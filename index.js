const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const app = express();

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (like CSS)
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function nanoid() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

async function linkgen(longlink, path) {
  if (!path) {
    path = nanoid();
  }
  let bodyops = {
    domain: 'mwsl.ddns.net',
    path: 'p/' + path,
    originalURL: longlink,
    title: 'public:' + path,
    tags: ['public']
  };
  const url = 'https://api.short.io/links';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: process.env['key']
    },
    body: JSON.stringify(bodyops)
  };

  let data = await fetch(url, options);
  data = await data.json();

  if (data.success == false) {
    if (data.error == 'Link already exists') {
      return { success: false, dup: true };
    } else {
      return { success: false, dup: false, error: data.error };
    }
  }
  return { success: true, url: data.shortURL, id: data.idString };
}

const genqr = async text => {
  try {
    let response = await QRCode.toDataURL(text);
    return response;
  } catch (err) {
    console.error(err);
  }
};

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/', async (req, res) => {
  let link = req.body.longLink;
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    link = 'https://' + link;
  }
  let path = req.body.customBackHalf;
  let qr = req.body.qr;
  let data = await linkgen(link, path);

  if (data.success == false) {
    if (data.dup == true) {
      res.render('error', { error: 'Link already exists' });
    } else {
      res.render('error', { error: data.error });
    }
  } else {
    if (qr) {
      qr = `<p>QR code: <img src='${await genqr(data.url)}' alt='QR code'></p>`;
    } else {
      qr = '';
    }
    res.render('success', { url: data.url, qr: qr });
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
