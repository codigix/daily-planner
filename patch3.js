const fs = require('fs');
let f = fs.readFileSync('frontend/src/pages/FinanceDashboardView.jsx', 'utf8');

const regexTable = /<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden mt-4">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const tableReplacement = `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden mt-4">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-100">Spend Summary</th>
                  <th className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-100 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-500">Search-Filtered Purchases</td>
                  <td className="px-5 py-4 text-right font-bold text-rose-500 dark:text-rose-400 text-base">
                    ₹ {filteredPurchases.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-slate-100">Total Spend (Selected Period)</td>
                  <td className="px-5 py-4 text-right font-black text-rose-600 dark:text-rose-400 text-xl">
                    ₹ {totalPurchasesFromDB.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}`;

if (regexTable.test(f)) {
  f = f.replace(regexTable, tableReplacement);
  fs.writeFileSync('frontend/src/pages/FinanceDashboardView.jsx', f);
  console.log("Replaced");
} else {
  console.log("Could not find table");
}
