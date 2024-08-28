const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const express = require('express');
const app = express();

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
  res.send(`
  <html>
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap">
    <style>
      body {
        font-family: 'Work Sans', sans-serif;
        background-color: #f4f4f4;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      h1 {
        color: #ffbf00;
        text-shadow: 1px 1px 2px #cd9900;
      }
      form {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        width: 300px;
        box-sizing: border-box;
      }
      label {
        font-weight: bold;
        display: block;
        margin: 10px 0 5px;
      }
      input {
        margin: 5px 0 15px;
        padding: 10px;
        border: 2px solid #ffbf00;
        border-radius: 5px;
        width: calc(100% - 22px);
        box-sizing: border-box;
        font-size: 16px;
        transition: border-color 0.3s ease;
      }
      input:focus {
        border-color: #cd9900;
        outline: none;
      }
      input:hover {
        border-color: #333;
      }
      button, input[type="submit"] {
        background-color: #ffbf00;
        border: none;
        border-radius: 5px;
        padding: 10px;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      button:hover, input[type="submit"]:hover {
        background-color: #cd9900;
      }
      a {
        color: #cd9900;
        text-decoration: none;
        font-weight: bold;
      }
      a:hover {
        text-decoration: underline;
      }
      .error, .success {
        color: #ff4d4d;
      }
      .success {
        color: #4dff4d;
      }
      .response-container {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        width: 300px;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div class="form-container">
      <h1>Shorten Your Links With AmberURL</h1>
      <form action="/" method="post">
        <label for="longLink">Long Link:</label>
        <input type="text" id="longLink" name="longLink" required>
        <label for="customBackHalf">Custom Back Half (optional):</label>
        <input type="text" id="customBackHalf" name="customBackHalf">
        <label for="qr">Generate QR Code:</label>
        <input type="checkbox" id="qr" name="qr">
        <input type="submit" value="Create Short Link">
      </form>
    </div>
  </body>
  </html>
  `);
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
      res.send(`
      <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap">
        <style>
          body {
            font-family: 'Work Sans', sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          h1 {
            color: #ffbf00;
            text-shadow: 1px 1px 2px #cd9900;
          }
          .response-container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 300px;
            box-sizing: border-box;
          }
          a {
            color: #cd9900;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="response-container">
          <h1 class="error">Link already exists</h1>
          <a href="/"> <-- Back to home</a>
        </div>
      </body>
      </html>
      `);
    } else {
      res.send(`
      <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap">
        <style>
          body {
            font-family: 'Work Sans', sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          h1 {
            color: #ffbf00;
            text-shadow: 1px 1px 2px #cd9900;
          }
          .response-container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: 300px;
            box-sizing: border-box;
          }
          p {
            color: #ff4d4d;
          }
          a {
            color: #cd9900;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="response-container">
          <h1 class="error">An error occurred</h1>
          <p>ERROR: ${data.error}</p>
          <p>Please screenshot this page and send it to the devs to resolve the issue</p>
          <a href="/"> <-- Back to home</a>
        </div>
      </body>
      </html>
      `);
    }
  } else {
    if (qr) {
      qr = await genqr(data.url);
      qr = "<p><strong>QR code:</strong> <img src='" + qr + "' alt='QR code'></p>";
    } else {
      qr = '';
    }
    res.send(`
    <html>
    <head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap">
      <style>
        body {
          font-family: 'Work Sans', sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        h1 {
          color: #ffbf00;
          text-shadow: 1px 1px 2px #cd9900;
        }
        .response-container {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          width: 300px;
          box-sizing: border-box;
        }
        a {
          color: #cd9900;
          text-decoration: none;
          font-weight: bold;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="response-container">
        <h1>Link Created</h1>
        <p>Short Link: <a href='${data.url}'>${data.url}</a></p>
        ${qr}
        <a href="/"> <-- Back to home</a>
      </div>
    </body>
    </html>
    `);
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
