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
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background: url('https://marketplace.canva.com/EAFCO6pfthY/1/0/1600w/canva-blue-green-watercolor-linktree-background-F2CyNS5sQdM.jpg') no-repeat center center fixed;
        background-size: cover;
        color: #333;
      }
      h1 {
        font-size: 2.5em;
        color: black;
        margin-bottom: 20px;
        text-align: center;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
      }
      .container {
        background: rgba(255, 255, 255, 0.8); /* Adjusted opacity for better contrast */
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 500px;
        box-sizing: border-box;
        text-align: center;
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
        border: 2px solid #007bff;
        border-radius: 5px;
        width: 100%;
        box-sizing: border-box;
        font-size: 16px;
        transition: border-color 0.3s ease;
      }
      input:focus {
        border-color: #0056b3;
        outline: none;
      }
      button, input[type="submit"] {
        background-color: #007bff;
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
        background-color: #0056b3;
      }
      a {
        color: #007bff;
        text-decoration: none;
        font-weight: bold;
        margin-top: 10px;
        display: inline-block;
      }
      a:hover {
        text-decoration: underline;
      }
      .response-container {
        background: rgba(255, 255, 255, 0.8); /* Adjusted opacity for better contrast */
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
      .footer {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            font-size: 14px;
            color: black;
        }

        .footer-text {
            margin-right: 10px;
            font-weight: bold;
        }

        .footer-heart {
            width: 20px;
            height: 20px;
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
    <div class="footer">
            <div class="footer-text">Made by Marvin with Much Love</div>
            <img class="footer-heart" src="https://cdn.pixabay.com/photo/2017/06/24/20/27/heart-2438746_1280.png" alt="Heart">
    </div>
    <script type="text/javascript" src="https://www.freevisitorcounters.com/en/home/counter/1226958/t/5"></script>
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .response-container {
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            margin: 20px auto;
            text-align: center;
          }
          h1 {
            color: #ff4d4d;
          }
          a {
            color: #007bff;
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .response-container {
            background: rgba(255, 255, 255, 0.9);
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
            color: #007bff;
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
          <h1 class="error">ERROR: ${data.error}</h1>
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
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
          color: #333;
        }
        .response-container {
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          margin: 20px auto;
          text-align: center;
        }
        h1 {
          color: #030000;
          font-size: 2.5em;
          margin-bottom: 20px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        a {
          color: #007bff;
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
