const https = require('https');

https.get('https://corsproxy.io/?' + encodeURIComponent('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'), (res) => {
  console.log(res.statusCode);
  console.log(res.headers);
});
