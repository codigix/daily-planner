const http = require('http');

http.get('http://localhost:5001/api/meta/login', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('API /api/meta/login output:');
    console.log(data);
  });
}).on('error', err => {
  console.error('API Test Error:', err.message);
});
