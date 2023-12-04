const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const QRCode = require('qrcode')
const express=require('express')
const app=express()
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
async function linkgen(longlink, path){
  if(!path){
    path = nanoid()
  }
  let bodyops = {
      domain: 'amb.fr.to',
      path: 'p/'+path,
      originalURL: longlink,
      title: 'public:'+path,
      tags: ['public']
    }
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
  
  let data = await fetch(url, options)
  data = await data.json()

  if(data.success==false){
    if(data.error=='Link already exists'){
      return {success:false, dup:true}
    }
    else {
      return {success:false, dup:false, error:data.error}
    }
  }
  return {success:true, url:data.shortURL, id:data.idString}
}
  const genqr = async text => {
    try {
      let responce = await QRCode.toDataURL(text)
      console.log(responce)
      return responce
    } catch (err) {
      console.error(err)
    }
  }

// link('https://google.com/hello', 'hello').then(a=>{console.log(a)})


app.get('/', (req, res) => {
  res.send(`
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap');
  </style>
  <style>

    body, button, input, p, a, b, i, h1 {
      font-family:'Work Sans'
    }
    input {
      margin: 5px;
      padding:5px;
      border:#ffbf00 solid 2px;
      border-radius:5px;
      transition: border 0.3s ease, border-color 0.3s ease;
    }
    input :focus {
      border:#cd9900 solid 2px;

    }
    input :hover {
      border:black solid 2px;

    }
    button, input[type="submit"] {
      background-color: #ffbf00;
      border:none;
      border-radius:5px;
      padding:10px;
    }
    a {
      color:#cd9900;
      text-decoration: underline;
    }
    a:hover {
      text-decoration:blink
    }


  </style>
  <h1>Shorten Your Links With AmberURL</h1>
  <form action="/" method="post">
    <label for="longLink">Long Link:</label>
    <input type="text" id="longLink" name="longLink" required><br>
    <label for="customBackHalf">Custom Back Half (optional):</label>
    <input type="text" id="customBackHalf" name="customBackHalf"><br>
    <label for="password">Generate QR Code:</label>
    <input type="checkbox" id="qr" name="qr"><br>
    <input type="submit" value="Create Short Link">
  </form>
  `)
});

app.post('/', async (req, res) => {
  let link = req.body.longLink
  if(!link.startsWith('http://') && !link.startsWith('https://')){
    link = 'https://'+link
  }
  let path = req.body.customBackHalf
  let qr = req.body.qr
  let data = await linkgen(link, path)
  if(data.success==false){
    if(data.dup==true){
      res.send(`
      <style>
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap');
  </style>
  <style>
    
    body, button, input, p, a, b, i, h1 {
      font-family:'Work Sans'
    }
    input {
      margin: 5px;
      padding:5px;
      border:#ffbf00 solid 2px;
      border-radius:5px;
      transition: border 0.3s ease, border-color 0.3s ease;
    }
    input :focus {
      border:#cd9900 solid 2px;
      
    }
    input :hover {
      border:black solid 2px;

    }
    button, input[type="submit"] {
      background-color: #ffbf00;
      border:none;
      border-radius:5px;
      padding:10px;
    }
    a {
      color:#cd9900;
      text-decoration: underline;
    }
    a:hover {
      text-decoration:blink
    }

    
  </style>
  <h1>Link already exists</h1> 
      <a href='/'> <-- Back to home</a>`)
    } else {
      res.send(`<style>
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap');
  </style>
  <style>
    
    body, button, input, p, a, b, i, h1 {
      font-family:'Work Sans'
    }
    input {
      margin: 5px;
      padding:5px;
      border:#ffbf00 solid 2px;
      border-radius:5px;
      transition: border 0.3s ease, border-color 0.3s ease;
    }
    input :focus {
      border:#cd9900 solid 2px;
      
    }
    input :hover {
      border:black solid 2px;

    }
    button, input[type="submit"] {
      background-color: #ffbf00;
      border:none;
      border-radius:5px;
      padding:10px;
    }
    a {
      color:#cd9900;
      text-decoration: underline;
    }
    a:hover {
      text-decoration:blink
    }

    
  </style>
  <h1>An error occured</h1> 
      <p>ERROR: ${data.error}</p>
      <p>Please screenshot this page and sent it to devs to resolve issue</p>
      <a href='/'> <-- Back to home</a>`)
    }
  } else {
    console.log(qr)
    if(qr){
      
      qr = await genqr(data.url)
      qr = "QR code: "+`<img src='${qr}' alt = 'qrcode'>`
    } else {
      qr = ''
    }
    console.log(qr)
    console.log(data)
    res.send(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Comfortaa&family=Work+Sans&display=swap');
    </style>
    <style>

      body, button, input, p, a, b, i, h1 {
        font-family:'Work Sans'
      }
      input {
        margin: 5px;
        padding:5px;
        border:#ffbf00 solid 2px;
        border-radius:5px;
        transition: border 0.3s ease, border-color 0.3s ease;
      }
      input :focus {
        border:#cd9900 solid 2px;

      }
      input :hover {
        border:black solid 2px;

      }
      button, input[type="submit"] {
        background-color: #ffbf00;
        border:none;
        border-radius:5px;
        padding:10px;
      }
      a {
        color:#cd9900;
        text-decoration: underline;
      }
      a:hover {
        text-decoration:blink
      }


    </style>
    <h1>Link Created</h1>
    <p>Short Link: <a href='${data.url}'>${data.url}</a></p>
    <p>${qr}</p>
    <a href='/'> <-- Back to home</a>
    `)
  }
})

app.listen(3000, () => {
  console.log('server started');
});
