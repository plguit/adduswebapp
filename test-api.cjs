const http = require('http');

const req = http.request('http://localhost:5000/api/analyze-website', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ url: 'https://addus.co.in' }));
req.end();
