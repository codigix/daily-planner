const googleService = require('./services/googleService.cjs');
const { google } = require('googleapis');
require('dotenv').config({path: './.env'});
(async () => {
  try {
    const validToken = await googleService.validateAndGetValidToken();
    const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    oAuth2Client.setCredentials({ access_token: validToken });
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const SPREADSHEET_ID = '1xshIPyJAb-8EZQgMPQUwFpG5sFqEaXJct0jaAq_wVaE';
    const SHEET_GID = 1261867214;
    const metaResponse = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const targetSheet = metaResponse.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || metaResponse.data.sheets[0];
    const sheetName = targetSheet.properties.title;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!A1:G5` });
    console.log("SHEET_VALUES_START");
    console.log(JSON.stringify(response.data.values, null, 2));
    console.log("SHEET_VALUES_END");
  } catch (e) {
    console.error("ERROR:", e.message);
  }
  process.exit(0);
})();
