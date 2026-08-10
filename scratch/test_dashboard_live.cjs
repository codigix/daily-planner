const http = require('http');

http.get('http://localhost:5001/api/meta/dashboard?role=Admin', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Dashboard API status code:', res.statusCode);
    const json = JSON.parse(data);
    console.log('Connected:', json.connected);
    console.log('Pages:', JSON.stringify(json.pages, null, 2));
    console.log('Instagram:', JSON.stringify(json.instagram, null, 2));
    console.log('Ad Accounts:', JSON.stringify(json.ad_accounts, null, 2));
  });
}).on('error', err => {
  console.error('API Test Error:', err.message);
});
