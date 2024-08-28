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
        background-color: #e0f7fa;
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
        background: rgba(255, 255, 255, 0.9);
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
        border: 2px solid #009688;
        border-radius: 5px;
        width: 100%;
        box-sizing: border-box;
        font-size: 16px;
        transition: border-color 0.3s ease;
      }
      input:focus {
        border-color: #004d40;
        outline: none;
      }
      button, input[type="submit"] {
        background-color: #009688;
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
        background-color: #004d40;
      }
      a {
        color: #00796b;
        text-decoration: none;
        font-weight: bold;
        margin-top: 10px;
        display: inline-block;
      }
      a:hover {
        text-decoration: underline;
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
      .error {
        color: #e57373;
      }
      .success {
        color: #81c784;
      }
      #backgroundSelection {
        position: absolute;
        bottom: 10px;
        left: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      #backgroundSelection label {
        margin: 0 5px;
        cursor: pointer;
      }
      #backgroundSelection label img {
        width: 50px;
        height: 50px;
        border-radius: 5px;
        border: 2px solid #009688;
        transition: border-color 0.3s ease;
      }
      #backgroundSelection label img:hover {
        border-color: #004d40;
      }
      .roundButton {
        position: fixed;
        bottom: 60px;
        left: 10px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background-color: #00bfff;
        color: white;
        font-size: 24px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.3s;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .roundButton:hover {
        background-color: #009acd;
        transform: scale(1.1);
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
    <div id="backgroundSelection">
      <label>
        <input type="radio" name="background" value="1" checked>
        <img src="https://files.123freevectors.com/wp-content/original/131396-light-color-polygonal-abstract-background-vector-illustration.jpg" alt="Background 1">
      </label>
      <label>
        <input type="radio" name="background" value="2">
        <img src="https://th.bing.com/th/id/R.435ebd9442f6ca449b44699a2a9a6acd?rik=fYMPzB%2ffp1EczA&riu=http%3a%2f%2fgetwallpapers.com%2fwallpaper%2ffull%2f1%2fa%2f8%2f136021.jpg&ehk=MAPonR9qka0eiZRvyC%2b08vGWIdpkEibRMFYdtK6xt8c%3d&risl=&pid=ImgRaw&r=0" alt="Background 2">
      </label>
      <label>
        <input type="radio" name="background" value="3">
        <img src="https://www.teahub.io/photos/full/44-440307_light-colors-geometric-pattern-abstract-wallpaper-abstract-wallpaper.jpg" alt="Background 3">
      </label>
      <label>
        <input type="radio" name="background" value="4">
        <img src="https://img.freepik.com/free-photo/soft-vintage-gradient-blur-background-with-pastel-colored-well-use-as-studio-room-product-presentation-banner_1258-71429.jpg" alt="Background 4">
      </label>
      <label>
        <input type="radio" name="background" value="5">
        <img src="https://static.vecteezy.com/system/resources/thumbnails/008/058/793/small_2x/abstract-blur-with-bokeh-light-for-background-usage-vector.jpg" alt="Background 5">
      </label>
      <label>
        <input type="radio" name="background" value="6">
        <img src="https://getwallpapers.com/wallpaper/full/e/c/e/455056.jpg" alt="Background 6">
      </label>
    </div>
    <button id="toggleBackgrounds" class="roundButton">☰</button>
    <script>
      document.getElementById('toggleBackgrounds').addEventListener('click', function() {
        const selection = document.getElementById('backgroundSelection');
        selection.classList.toggle('visible');
      });
    </script>
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
            background-color: #e0f7fa;
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
            color: #e57373;
          }
          a {
            color: #00796b;
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
            background-color: #e0f7fa;
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
            color: #e57373;
          }
          a {
            color: #00796b;
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
          background-color: #e0f7fa;
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
          color: black;
          font-size: 2.5em;
          margin-bottom: 20px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        a {
          color: #00796b;
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
