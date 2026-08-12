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

async function testPageFields() {
  const pages = await fetchGraphApi('me/accounts?fields=id,name,category,access_token,followers_count,fan_count,picture', userToken);
  console.log('Graph API me/accounts response:');
  console.log(JSON.stringify(pages, null, 2));

  if (pages && pages.data && pages.data.length > 0) {
    const pg = pages.data[0];
    const pageToken = pg.access_token || userToken;
    const pageDetails = await fetchGraphApi(`${pg.id}?fields=id,name,category,followers_count,fan_count,engagement`, pageToken);
    console.log(`Graph API page ${pg.id} details response:`);
    console.log(JSON.stringify(pageDetails, null, 2));
  }
}

testPageFields();
