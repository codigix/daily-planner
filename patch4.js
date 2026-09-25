const fs = require('fs');
let f = fs.readFileSync('frontend/src/pages/FinanceDashboardView.jsx', 'utf8');

const regex = /\{\s*key:\s*'category',\s*header:\s*'Category'[\s\S]*?\}\s*,\s*\{\s*key:\s*'purchase_date',\s*header:\s*'Purchase Date'[\s\S]*?\}\s*,\s*\{\s*key:\s*'amount',\s*header:\s*'Amount \(₹\)'[\s\S]*?<\/span>\s*\)\s*\}/;

const replacement = `{ key: 'purchase_date', header: 'Date', sortable: true, render: (item) => <span className="text-slate-500">{new Date(item.purchase_date).toLocaleDateString('en-IN')}</span> },
              {
                key: 'received',
                header: 'Received (₹)',
                sortable: true,
                render: (item) => (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {parseFloat(item.received_amount || 0) > 0 ? \`₹ \${parseFloat(item.received_amount).toLocaleString('en-IN')}\` : '-'}
                  </span>
                )
              },
              {
                key: 'amount',
                header: 'Expense (₹)',
                sortable: true,
                render: (item) => (
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {parseFloat(item.amount || 0) > 0 ? \`₹ \${parseFloat(item.amount).toLocaleString('en-IN')}\` : '-'}
                  </span>
                )
              },
              {
                key: 'balance',
                header: 'Balance (₹)',
                sortable: false,
                render: (item) => (
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {parseFloat(item.balance_amount || 0) !== 0 ? \`₹ \${parseFloat(item.balance_amount).toLocaleString('en-IN')}\` : '-'}
                  </span>
                )
              }`;

if (regex.test(f)) {
  f = f.replace(regex, replacement);
  fs.writeFileSync('frontend/src/pages/FinanceDashboardView.jsx', f);
  console.log("Successfully replaced columns");
} else {
  console.log("Could not find columns in Purchases table");
}
