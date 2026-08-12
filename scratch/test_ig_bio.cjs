const https = require('https');

const userToken = 'EAAYMFJxD70kBSIB28y0fCJ0JcYbWgTI0pK3Bh41oSvlxwHq9nL610ro9r1gKfVxcAfCZCfkoCSe3xEBGaNglbtMfUK2jZBVdaIA5QATrQEjcmeq8RFvKpkZBS2czSQT5FoT1k9KvbSvSnlZBVYJmLRImbkBm18MQk2L9QJoHZC3NiUzKg89xXKVOlIDkK7ZBRytfnkTbVUbrdEDe725Y84X0eXNRuLk5xFhSwTSzhZAGSJB3M0ZBrRZCTEwmlZCei7SfOGUaZBEFmejHoJVNXUYELFa1kS6muwPx4rLzgeIBQZDZD';

function fetchGraphApi(path, token) {
  return new Promise((resolve) => {
    const separator = path.includes('?') ? '&' : '?';
    const urlPath = `/v24.0/${path}${separator}access_token=${encodeURIComponent(token)}`;

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: urlPath,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function testIgBio() {
  const igId = '17841478337244166';
  const igInfo = await fetchGraphApi(`${igId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website`, userToken);
  console.log('Graph API Instagram response:');
  console.log(JSON.stringify(igInfo, null, 2));
}

testIgBio();
