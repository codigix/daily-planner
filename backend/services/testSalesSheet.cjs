require('dotenv').config();
const { google } = require('googleapis');
const googleService = require('./googleService.cjs');

async function testFetch() {
  try {
    const validToken = await googleService.validateAndGetValidToken();
    if (!validToken) throw new Error('No valid token');

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.setCredentials({ access_token: validToken });

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1xshIPyJAb-8EZQgMPQUwFpG5sFqEaXJct0jaAq_wVaE',
      range: 'A1:Z5',
    });

    console.log(JSON.stringify(response.data.values, null, 2));
  } catch (e) {
    console.error(e);
  }
}

testFetch();
