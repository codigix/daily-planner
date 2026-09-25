const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

// 1. solutionCards fallback
content = content.replace(
  /const cards = quotationData\.solutionCards && quotationData\.solutionCards\.length > 0\s*\?\s*quotationData\.solutionCards\s*:\s*\[[\s\S]*?\];/g,
  `const cards = quotationData.solutionCards && quotationData.solutionCards.filter(c=>c.title).length > 0 
                 ? quotationData.solutionCards.filter(c=>c.title) 
                 : [];`
);

// 2. deliverables fallback
content = content.replace(
  /const rawItems = quotationData\.deliverables\.filter\(Boolean\)\.length > 0 \? quotationData\.deliverables\.filter\(Boolean\) : \['UI\/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs'\];/g,
  `const rawItems = quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : [];`
);

// 3. teamList fallback
content = content.replace(
  /\(quotationData\.teamList\.filter\(t => t\.role\)\.length > 0\s*\?\s*quotationData\.teamList\.filter\(t => t\.role\)\s*:\s*\[[\s\S]*?\]\)/g,
  `(quotationData.teamList.filter(t => t.role).length > 0 ? quotationData.teamList.filter(t => t.role) : [])`
);

// 4. integrations fallback
content = content.replace(
  /\(quotationData\.integrations\.filter\(Boolean\)\.length > 0\s*\?\s*quotationData\.integrations\.filter\(Boolean\)\s*:\s*\[[\s\S]*?\]\)/g,
  `(quotationData.integrations.filter(Boolean).length > 0 ? quotationData.integrations.filter(Boolean) : [])`
);

// 5. particulars fallback
content = content.replace(
  /\(quotationData\.particulars\.filter\(p => p\.name \|\| p\.value\)\.length > 0\s*\?\s*quotationData\.particulars\.filter\(p => p\.name \|\| p\.value\)\s*:\s*\[[\s\S]*?\]\)/g,
  `(quotationData.particulars.filter(p => p.name || p.value).length > 0 ? quotationData.particulars.filter(p => p.name || p.value) : [])`
);

// 6. pricingOptions fallback (Budget page)
content = content.replace(
  /\(quotationData\.pricingOptions \|\| \[\{ title: 'TOTAL PROJECT INVESTMENT', cost: quotationData\.totalCost \|\| '7,80,000', gst: quotationData\.gstPercent \|\| '18', suffix: 'Applicable GST' \}\]\)/g,
  `(quotationData.pricingOptions || [{ title: 'TOTAL PROJECT INVESTMENT', cost: quotationData.totalCost, gst: quotationData.gstPercent, suffix: 'Applicable GST' }])`
);

// 7. Also fix the initial state if it has any hardcoded strings that were missed
content = content.replace(/execSummary: 'FitRack.*?',/s, "execSummary: '',");


fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Removed array fallbacks.');
