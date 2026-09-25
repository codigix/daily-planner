const { google } = require('googleapis');
const googleService = require('./googleService.cjs');
const { getPool } = require('../db_mysql.cjs');

function extractSheetInfo(url) {
  let spreadsheetId = '';
  let sheetGid = '0';
  if (!url) return { spreadsheetId, sheetGid };
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) spreadsheetId = match[1];
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    if (gidMatch) sheetGid = gidMatch[1];
  } catch (e) { }
  return { spreadsheetId, sheetGid };
}


async function syncPurchasesFromSheet(userEmail, sheetUrl) {
  const { spreadsheetId: SPREADSHEET_ID, sheetGid: SHEET_GID } = extractSheetInfo(sheetUrl);

  const validToken = await googleService.validateAndGetValidToken();
  if (!validToken) {
    throw new Error('Google Account not connected or token expired. Please connect Google OAuth.');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ access_token: validToken });

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get sheet name from GID
  const metaResponse = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const targetSheet = metaResponse.data.sheets.find(s => s.properties.sheetId.toString() === SHEET_GID.toString()) || metaResponse.data.sheets[0];
  const sheetName = targetSheet.properties.title;

  // Read data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`, 
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return { success: true, count: 0, message: 'No data found in Google Sheet.' };

  const pool = await getPool();

  // Clear previously synced Google Sheet purchases to prevent duplicates
  await pool.query(`DELETE FROM finance_purchases WHERE company_id = 1 AND payment_method = 'Google Sheet Sync'`);
  
  let insertedCount = 0;

  for (const row of rows) {
    // Expected Columns: Date, Vendor Name, Category, Amount, Tax, Total, Notes (example)
    // We will parse them defensively
    let dateStr = row[0] || '';
    // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
    const dmMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmMatch) {
      dateStr = `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
    } else if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    } else {
      // Fallback: standard JS parsing
      const parsed = new Date(dateStr);
      dateStr = !isNaN(parsed) ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    }
    const vendorName = row[1] || 'Unknown Vendor';
    
    // Parse amounts (Received, Expence, Balance)
    const rawReceived = row[2] ? row[2].toString().replace(/[^0-9.-]+/g,"") : '0';
    const rawExpense = row[3] ? row[3].toString().replace(/[^0-9.-]+/g,"") : '0';
    const rawBalance = row[4] ? row[4].toString().replace(/[^0-9.-]+/g,"") : '0';

    const receivedAmount = parseFloat(rawReceived) || 0;
    const expenseAmount = parseFloat(rawExpense) || 0;
    const balanceAmount = parseFloat(rawBalance) || 0;
    
    // We categorize based on if it's purely received funds vs an expense
    const category = expenseAmount > 0 ? 'Office Expense' : 'Funding Deposit';
    
    // The main amount column represents the Expense. We also store received and balance.
    const amount = expenseAmount;
    const tax = 0;
    const total = amount;
    const notes = row[6] || 'Synced from Google Sheets';
    
    const purNo = `PUR-GS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;

    // Skip completely empty rows
    if (vendorName === 'Unknown Vendor' && amount === 0 && receivedAmount === 0) continue;

    await pool.query(`
      INSERT INTO finance_purchases (company_id, purchase_no, vendor_name, category, amount, received_amount, balance_amount, tax_amount, total_amount, purchase_date, status, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, purNo, vendorName, category, amount, receivedAmount, balanceAmount, tax, total, dateStr, 'Paid', 'Google Sheet Sync', notes]);
    
    insertedCount++;
  }

  return { success: true, count: insertedCount, message: `Successfully synced ${insertedCount} purchases from Google Sheet.` };
}


async function syncSalesFromSheet(userEmail, sheetUrl) {
  const { spreadsheetId: SPREADSHEET_ID, sheetGid: SHEET_GID } = extractSheetInfo(sheetUrl);

  const validToken = await googleService.validateAndGetValidToken();
  if (!validToken) {
    throw new Error('Google Account not connected or token expired. Please connect Google OAuth.');
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ access_token: validToken });

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get sheet name from GID
  const metaResponse = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const targetSheet = metaResponse.data.sheets.find(s => s.properties.sheetId.toString() === SHEET_GID.toString()) || metaResponse.data.sheets[0];
  const sheetName = targetSheet.properties.title;

  // Read data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`, 
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return { success: true, count: 0, message: 'No data found in Sales Sheet.' };

  const pool = await getPool();

  // Clear previously synced Google Sheet sales to prevent duplicates
  await pool.query(`DELETE FROM finance_sales WHERE company_id = 1 AND notes = 'Synced from Google Sheets'`);

  let insertedCount = 0;

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    
    // New Sheet Columns: Client, Total Amount, Received Amount, Total Pending, Status
    const clientName = row[0] || 'Unknown Client';
    
    const rawTotal = row[1] ? row[1].toString().replace(/[^0-9.-]+/g,"") : '0';
    const rawReceived = row[2] ? row[2].toString().replace(/[^0-9.-]+/g,"") : '0';
    const rawPending = row[3] ? row[3].toString().replace(/[^0-9.-]+/g,"") : '0';
    const status = row[4] || 'PAID';

    const total = parseFloat(rawTotal) || 0;
    const received = parseFloat(rawReceived) || 0;
    const pending = parseFloat(rawPending) || 0;
    const dateStr = new Date().toISOString().split('T')[0];
    
    const invNo = `INV-GS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;

    if (clientName === 'Unknown Client' && total === 0) continue;

    await pool.query(`
      INSERT INTO finance_sales (company_id, invoice_no, client_name, category, amount, tax_amount, total_amount, received_amount, pending_amount, sale_date, status, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [1, invNo, clientName, 'Software & Services', total, 0, total, received, pending, dateStr, status, 'Bank Transfer', 'Synced from Google Sheets']);
    
    insertedCount++;
  }

  return { success: true, count: insertedCount, message: `Successfully synced ${insertedCount} sales from Google Sheet.` };
}

module.exports = { syncPurchasesFromSheet, syncSalesFromSheet };
