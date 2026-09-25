const fs = require('fs');
let f = fs.readFileSync('frontend/src/pages/FinanceDashboardView.jsx', 'utf8');

const replacement1 = `const currentYear = new Date().getFullYear();
  const monthlyFilters = Array.from({ length: 12 }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, '0');
    const monthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' });
    const fullMonthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'long' });
    return { id: \`\${currentYear}-\${monthStr}\`, full: \`\${monthName} \${currentYear}\`, short: monthName, desc: \`\${fullMonthName} \${currentYear} Ledger\` };
  });

  const filterOptions = [
    { id: 'this_month', full: 'This Month', short: 'This Mo.', desc: 'Current Month Ledger' },
    { id: 'last_month', full: 'Last Month', short: 'Last Mo.', desc: 'Previous Month' },
    ...monthlyFilters,
    { id: 'q1', full: 'Q1 (Jan-Mar)', short: 'Q1', desc: 'First Quarter' },
    { id: 'q2', full: 'Q2 (Apr-Jun)', short: 'Q2', desc: 'Second Quarter' },
    { id: 'q3', full: 'Q3 (Jul-Sep)', short: 'Q3', desc: 'Third Quarter' },
    { id: 'q4', full: 'Q4 (Oct-Dec)', short: 'Q4', desc: 'Fourth Quarter' },
    { id: 'all', full: 'All Time', short: 'All', desc: 'Complete Ledger' }
  ];

  const [searchQuery, setSearchQuery] = useState('');`;

f = f.replace("const [searchQuery, setSearchQuery] = useState('');", replacement1);

// Replace horizontal scroll buttons
const targetScroll = `          {[
            { id: 'this_month', full: 'This Month', short: 'Month' },
            { id: 'last_month', full: 'Last Month', short: 'Last Mo.' },
            { id: 'q1', full: 'Q1 (Jan-Mar)', short: 'Q1' },
            { id: 'q2', full: 'Q2 (Apr-Jun)', short: 'Q2' },
            { id: 'q3', full: 'Q3 (Jul-Sep)', short: 'Q3' },
            { id: 'q4', full: 'Q4 (Oct-Dec)', short: 'Q4' },
            { id: '2026', full: 'Year 2026', short: "'26" },
            { id: '2025', full: 'Year 2025', short: "'25" },
            { id: 'all', full: 'All Time', short: 'All' }
          ].map((period) => (`;
f = f.replace(targetScroll, "{filterOptions.map((period) => (");

// Replace filter modal 1 (Period Filter Selection Modal)
const targetModal1 = `              {[
                { id: 'this_month', label: 'This Month', desc: 'Current Month Ledger' },
                { id: 'last_month', label: 'Last Month', desc: 'Previous Month' },
                { id: 'q1', label: 'Q1 (Jan - Mar)', desc: 'First Quarter' },
                { id: 'q2', label: 'Q2 (Apr - Jun)', desc: 'Second Quarter' },
                { id: 'q3', label: 'Q3 (Jul - Sep)', desc: 'Third Quarter' },
                { id: 'q4', label: 'Q4 (Oct - Dec)', desc: 'Fourth Quarter' },
                { id: '2026', label: 'Year 2026', desc: 'FY 2026 Full' },
                { id: '2025', label: 'Year 2025', desc: 'FY 2025 Full' },
                { id: 'all', label: 'All Time', desc: 'Complete Ledger' }
              ].map((period) => (`;
f = f.replace(targetModal1, "{filterOptions.map((period) => (");

// Fix period.label -> period.full inside filter modal 1
const targetLabel1 = `                    <span>{period.label}</span>`;
f = f.replace(targetLabel1, `                    <span>{period.full}</span>`);

// Replace mobile filter modal
const targetModal2 = `                  {[
                    { id: 'this_month', label: 'This Month' },
                    { id: 'last_month', label: 'Last Month' },
                    { id: 'all', label: 'All Time' }
                  ].map((period) => (`;
f = f.replace(targetModal2, "{filterOptions.slice(0, 9).map((period) => (");

// Fix period.label -> period.short inside mobile filter modal
const targetLabel2 = `                      {period.label}
                    </button>
                  ))}`;
f = f.replace(targetLabel2, `                      {period.short}
                    </button>
                  ))}`);

// Finally, add the table under purchases tab exactly
const targetTableEnd = `              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Purchase</span>
              </button>
            }
          />
        </div>
      )}`;

const tableAddition = `              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Purchase</span>
              </button>
            }
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-4">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-100">Total Purchase Spend (Filtered Period)</th>
                  <th className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-100 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 font-medium">Sum of all visible purchases for the selected time period</td>
                  <td className="px-5 py-4 text-right font-black text-rose-600 dark:text-rose-400 text-lg">
                    ₹ {filteredPurchases.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}`;

if (f.includes(targetTableEnd)) {
  f = f.replace(targetTableEnd, tableAddition);
} else {
  console.log("targetTableEnd not found in file!");
}

fs.writeFileSync('frontend/src/pages/FinanceDashboardView.jsx', f);
console.log("Successfully rebuilt Finance Dashboard filters and table");
