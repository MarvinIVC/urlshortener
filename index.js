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

  if (data.success === false) {
    if (data.error === 'Link already exists') {
      return { success: false, dup: true };
    } else {
      return { success: false, dup: false, error: data.error };
    }
  }
  return { success: true, url: data.shortURL, id: data.idString };
}

const genqr = async (text) => {
  try {
    let response = await QRCode.toDataURL(text);
    return response;
  } catch (err) {
    console.error(err);
  }
};

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Marvin's URL Shortening Service</title>
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
                border: 2px solid #0056b3; /* Darker blue */
                border-radius: 5px;
                width: 100%;
                box-sizing: border-box;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            input:focus {
                border-color: #004494; /* Even darker blue on focus */
                outline: none;
            }
            button, input[type="submit"] {
                background-color: #0056b3; /* Darker blue */
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
                background-color: #004494; /* Even darker blue on hover */
            }
            a {
                color: #0056b3; /* Darker blue */
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
            .error, .success {
                font-size: 1.5em;
                color: black;
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
  if (data.success === false) {
    if (data.dup === true) {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Marvin's URL Shortening Service</title>
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
                a {
                    color: #0056b3; /* Darker blue */
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 10px;
                    display: inline-block;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Link already exists</h1>
                <a href="/">← Back to home</a>
            </div>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Marvin's URL Shortening Service</title>
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
                .response-container {
                    background: rgba(255, 255, 255, 0.9);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    margin: 20px auto;
                    text-align: center;
                }
                .success {
                    font-size: 1.5em;
                    color: black;
                }
                .qr-code {
                    margin: 20px auto;
                }
                a {
                    color: #0056b3; /* Darker blue */
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 10px;
                    display: inline-block;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Link Created</h1>
                <div class="response-container">
                    <p class="success">Shortened URL: <a href="${data.url}" target="_blank">${data.url}</a></p>
                    ${qr ? `<div class="qr-code"><img src="${await genqr(data.url)}" alt="QR Code"></div>` : ''}
                    <a href="/">← Back to home</a>
                </div>
            </div>
        </body>
        </html>
      `);
    }
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
