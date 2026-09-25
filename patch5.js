const fs = require('fs');

// 1. PATCH finance.cjs
let financeContent = fs.readFileSync('backend/routes/finance.cjs', 'utf8');

// Sales Endpoint
const salesRegex = /router\.get\('\/sales',\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const\s*pool\s*=\s*await\s*getPool\(\);\s*if\s*\(!pool\)\s*return\s*res\.status\(500\)\.json\(\{\s*success:\s*false\s*\}\);\s*const\s*\[rows\]\s*=\s*await\s*pool\.query\('SELECT\s*\*\s*FROM\s*finance_sales\s*WHERE\s*company_id\s*=\s*1\s*ORDER\s*BY\s*sale_date\s*DESC'\);/;
const salesReplacement = `router.get('/sales', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const period = req.query.period || 'this_month';
    const salesCond = getPeriodWhereClause(period, 'sale_date');

    const [rows] = await pool.query(\`SELECT * FROM finance_sales WHERE company_id = 1 AND \${salesCond} ORDER BY sale_date DESC\`);`;
financeContent = financeContent.replace(salesRegex, salesReplacement);

// Purchases Endpoint
const purchasesRegex = /router\.get\('\/purchases',\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const\s*pool\s*=\s*await\s*getPool\(\);\s*if\s*\(!pool\)\s*return\s*res\.status\(500\)\.json\(\{\s*success:\s*false\s*\}\);\s*const\s*\[rows\]\s*=\s*await\s*pool\.query\('SELECT\s*\*\s*FROM\s*finance_purchases\s*WHERE\s*company_id\s*=\s*1\s*ORDER\s*BY\s*purchase_date\s*DESC'\);/;
const purchasesReplacement = `router.get('/purchases', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const period = req.query.period || 'this_month';
    const purchaseCond = getPeriodWhereClause(period, 'purchase_date');

    const [rows] = await pool.query(\`SELECT * FROM finance_purchases WHERE company_id = 1 AND \${purchaseCond} ORDER BY purchase_date DESC\`);`;
financeContent = financeContent.replace(purchasesRegex, purchasesReplacement);

fs.writeFileSync('backend/routes/finance.cjs', financeContent);
console.log('Patched finance.cjs');


// 2. PATCH api.js
let apiContent = fs.readFileSync('frontend/src/services/api.js', 'utf8');

apiContent = apiContent.replace(
  "export async function fetchSalesAPI() {\n  return await fetchAPI('/finance/sales');\n}",
  "export async function fetchSalesAPI(period = 'this_month') {\n  return await fetchAPI(`/finance/sales?period=${period}`);\n}"
);

apiContent = apiContent.replace(
  "export async function fetchPurchasesAPI() {\n  return await fetchAPI('/finance/purchases');\n}",
  "export async function fetchPurchasesAPI(period = 'this_month') {\n  return await fetchAPI(`/finance/purchases?period=${period}`);\n}"
);

fs.writeFileSync('frontend/src/services/api.js', apiContent);
console.log('Patched api.js');


// 3. PATCH FinanceDashboardView.jsx
let dashboardContent = fs.readFileSync('frontend/src/pages/FinanceDashboardView.jsx', 'utf8');
dashboardContent = dashboardContent.replace(
  "const salesRes = await fetchSalesAPI();",
  "const salesRes = await fetchSalesAPI(selectedPeriod);"
);
dashboardContent = dashboardContent.replace(
  "const purchasesRes = await fetchPurchasesAPI();",
  "const purchasesRes = await fetchPurchasesAPI(selectedPeriod);"
);
fs.writeFileSync('frontend/src/pages/FinanceDashboardView.jsx', dashboardContent);
console.log('Patched FinanceDashboardView.jsx');
