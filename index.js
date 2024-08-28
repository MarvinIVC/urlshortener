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
        background-color: #f0f0f0;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        background: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 500px;
        box-sizing: border-box;
        text-align: center;
      }
      h1 {
        color: #ff6f61;
        margin-bottom: 20px;
        font-size: 24px;
        text-shadow: 1px 1px 2px rgba(255, 105, 97, 0.7);
      }
      form {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #555;
        font-size: 16px;
        text-align: left;
        width: 100%;
      }
      input {
        margin: 5px 0 15px;
        padding: 10px;
        border: 2px solid #ff6f61;
        border-radius: 5px;
        width: 100%;
        box-sizing: border-box;
        font-size: 16px;
        transition: border-color 0.3s ease;
      }
      input:focus {
        border-color: #ff3d2e;
        outline: none;
      }
      button, input[type="submit"] {
        background-color: #ff6f61;
        border: none;
        border-radius: 5px;
        padding: 10px 20px;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin-top: 10px;
      }
      button:hover, input[type="submit"]:hover {
        background-color: #ff3d2e;
      }
      a {
        color: #ff6f61;
        text-decoration: none;
        font-weight: bold;
        margin-top: 10px;
        display: inline-block;
      }
      a:hover {
        text-decoration: underline;
      }
      .response-container {
        background: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        margin: 20px auto;
        text-align: center;
      }
      .error {
        color: #ff4d4d;
      }
      .success {
        color: #4dff4d;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Marvin's URL Shortening Service</h1>
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
            background-color: #f0f0f0;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .response-container {
            background: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            margin: 20px auto;
            text-align: center;
          }
          h1 {
            color: #ff6f61;
          }
          a {
            color: #ff6f61;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
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
            background-color: #f0f0f0;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .response-container {
            background: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            margin: 20px auto;
            text-align: center;
          }
          p {
            color: #ff4d4d;
          }
          a {
            color: #ff6f61;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
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
          <p>Please screenshot this page and send it to the devs to resolve the issue.</p>
          <a href="/"> <-- Back to home</a>
        </div>
      </body>
      </html>
      `);
    }
  } else {
    if (qr) {
      qr = `<p>QR code: <img src='${await genqr(data.url)}' alt='QR code'></p>`;
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
          background-color: #f0f0f0;
          color: #333;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .response-container {
          background: #ffffff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          margin: 20px auto;
          text-align: center;
        }
        h1 {
          color: #4dff4d;
        }
        a {
          color: #ff6f61;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
          margin-top: 10px;
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
