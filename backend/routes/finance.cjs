const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');

// Helper: Format SQL date condition based on period filter
function getPeriodWhereClause(period = 'this_month', dateColumn = 'sale_date') {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (period === 'this_month') {
    return `${dateColumn} >= '${year}-${String(month).padStart(2, '0')}-01'`;
  }
  if (period === 'last_month') {
    const lastM = month === 1 ? 12 : month - 1;
    const lastY = month === 1 ? year - 1 : year;
    const endLastM = new Date(lastY, lastM, 0).getDate();
    return `${dateColumn} BETWEEN '${lastY}-${String(lastM).padStart(2, '0')}-01' AND '${lastY}-${String(lastM).padStart(2, '0')}-${endLastM}'`;
  }
  if (period === 'q1') {
    return `${dateColumn} BETWEEN '${year}-01-01' AND '${year}-03-31'`;
  }
  if (period === 'q2') {
    return `${dateColumn} BETWEEN '${year}-04-01' AND '${year}-06-30'`;
  }
  if (period === 'q3') {
    return `${dateColumn} BETWEEN '${year}-07-01' AND '${year}-09-30'`;
  }
  if (period === 'q4') {
    return `${dateColumn} BETWEEN '${year}-10-01' AND '${year}-12-31'`;
  }
  if (period === '2025') {
    return `${dateColumn} BETWEEN '2025-01-01' AND '2025-12-31'`;
  }
  if (period === '2026') {
    return `${dateColumn} BETWEEN '2026-01-01' AND '2026-12-31'`;
  }
  return '1=1'; // All time
}

// 1. GET /api/finance/dashboard - Dynamic Dashboard & Period-filtered Revenue Telemetry
router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false, error: 'Database unavailable' });

    const period = req.query.period || 'this_month';
    const salesCond = getPeriodWhereClause(period, 'sale_date');
    const purchaseCond = getPeriodWhereClause(period, 'purchase_date');

    // Aggregate Sales (Revenue)
    const [salesAgg] = await pool.query(
      `SELECT SUM(amount) as net_sales, SUM(tax_amount) as total_tax, SUM(total_amount) as gross_sales, COUNT(*) as sales_count FROM finance_sales WHERE company_id = 1 AND ${salesCond}`
    );

    // Aggregate Purchases (Expenses)
    const [purchasesAgg] = await pool.query(
      `SELECT SUM(amount) as net_purchases, SUM(tax_amount) as total_tax, SUM(total_amount) as gross_purchases, COUNT(*) as purchase_count FROM finance_purchases WHERE company_id = 1 AND ${purchaseCond}`
    );

    const totalRevenue = parseFloat(salesAgg[0].net_sales || 0);
    const totalPurchases = parseFloat(purchasesAgg[0].net_purchases || 0);
    const grossRevenue = parseFloat(salesAgg[0].gross_sales || 0);

    // Net Profit Calculations
    const netProfit = totalRevenue - totalPurchases;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Recent Sales & Recent Purchases
    const [salesList] = await pool.query(`SELECT * FROM finance_sales WHERE company_id = 1 AND ${salesCond} ORDER BY sale_date DESC LIMIT 10`);
    const [purchasesList] = await pool.query(`SELECT * FROM finance_purchases WHERE company_id = 1 AND ${purchaseCond} ORDER BY purchase_date DESC LIMIT 10`);

    // Monthly Trend Chart Data
    const [trendData] = await pool.query(`
      SELECT 
        DATE_FORMAT(sale_date, '%b %Y') as label,
        SUM(amount) as revenue
      FROM finance_sales 
      WHERE company_id = 1 
      GROUP BY DATE_FORMAT(sale_date, '%Y-%m'), DATE_FORMAT(sale_date, '%b %Y')
      ORDER BY DATE_FORMAT(sale_date, '%Y-%m') ASC
      LIMIT 6
    `);

    // Category Expense Breakdown
    const [expenseCats] = await pool.query(`
      SELECT category as name, SUM(amount) as total
      FROM finance_purchases
      WHERE company_id = 1 AND ${purchaseCond}
      GROUP BY category
    `);

    return res.json({
      success: true,
      period,
      summary: {
        totalRevenue,
        grossRevenue,
        totalPurchases,
        netProfit,
        profitMargin: `${profitMargin}%`,
        salesCount: salesAgg[0].sales_count || 0,
        purchaseCount: purchasesAgg[0].purchase_count || 0
      },
      recentSales: salesList,
      recentPurchases: purchasesList,
      monthlyTrend: trendData,
      expenseCategories: expenseCats
    });

  } catch (err) {
    console.error('[FinanceRoute] Dashboard error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/finance/sales - Fetch Sales Invoices
router.get('/sales', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const [rows] = await pool.query('SELECT * FROM finance_sales WHERE company_id = 1 ORDER BY sale_date DESC');
    return res.json({ success: true, sales: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/finance/sales - Add New Sales Invoice
router.post('/sales', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const { invoice_no, client_name, category, amount, tax_amount, sale_date, status, payment_method, notes } = req.body;
    const numAmount = parseFloat(amount || 0);
    const numTax = parseFloat(tax_amount || 0);
    const totalAmount = numAmount + numTax;
    const invNo = invoice_no || `INV-${Date.now().toString().slice(-6)}`;
    const dateStr = sale_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO finance_sales (company_id, invoice_no, client_name, category, amount, tax_amount, total_amount, sale_date, status, payment_method, notes)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [invNo, client_name || 'Client', category || 'Software & Services', numAmount, numTax, totalAmount, dateStr, status || 'PAID', payment_method || 'Bank Transfer', notes || '']);

    return res.json({ success: true, id: result.insertId, invoice_no: invNo });
  } catch (err) {
    console.error('[FinanceRoute] Add sale error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE /api/finance/sales/:id
router.delete('/sales/:id', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    await pool.query('DELETE FROM finance_sales WHERE id = ? AND company_id = 1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/finance/purchases - Fetch Purchase Bills
router.get('/purchases', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const [rows] = await pool.query('SELECT * FROM finance_purchases WHERE company_id = 1 ORDER BY purchase_date DESC');
    return res.json({ success: true, purchases: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/finance/purchases - Add New Purchase Order / Expense with Invoice Upload
router.post('/purchases', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    const { purchase_no, vendor_name, category, amount, tax_amount, purchase_date, status, payment_method, notes, bill_file_name, bill_file_url } = req.body;
    const numAmount = parseFloat(amount || 0);
    const numTax = parseFloat(tax_amount || 0);
    const totalAmount = numAmount + numTax;
    const purNo = purchase_no || `PUR-${Date.now().toString().slice(-6)}`;
    const dateStr = purchase_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO finance_purchases (company_id, purchase_no, vendor_name, category, amount, tax_amount, total_amount, purchase_date, status, payment_method, notes, bill_file_name, bill_file_url)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [purNo, vendor_name || 'Vendor', category || 'Operations & Infra', numAmount, numTax, totalAmount, dateStr, status || 'PAID', payment_method || 'Bank Transfer', notes || '', bill_file_name || null, bill_file_url || null]);

    return res.json({ success: true, id: result.insertId, purchase_no: purNo });
  } catch (err) {
    console.error('[FinanceRoute] Add purchase error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/finance/purchases/:id
router.delete('/purchases/:id', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(500).json({ success: false });

    await pool.query('DELETE FROM finance_purchases WHERE id = ? AND company_id = 1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
