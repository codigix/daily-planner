const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

const dummies = [
  "|| 'Codigix Infotech Pvt. Ltd.'",
  "|| '11 Aug 2026'",
  "|| 'Project Proposal'",
  "|| 'Web & Mobile App Development'",
  "|| 'info@codigixinfotech.com'",
  "|| 'www.codigixinfotech.com'",
  "|| 'Client Name'",
  "|| '2021'",
  "|| '15'",
  "|| '44'",
  "|| 'Codigix Infotech is a technology-driven company specializing in AI-based Automation, ERP/CRM Systems, and Enterprise Applications.'",
  "|| 'Codigix Infotech delivers high-performance enterprise architecture and AI automation.'",
  "|| 'Codigix Infotech is a technology-driven company specializing in advanced IT solutions such as AI-based Automation, Custom ERP and CRM Systems, Mobile Applications, and Scalable Website Development.'",
  "|| 'OUR FOCUS'",
  "|| 'Innovating Digital Excellence'",
  "|| 'FitRack is engineered as a unified, multi-tenant digital ecosystem connecting Fitness Coaches, Dietitians, Clients, and Platform Administrators under one seamless architecture.'",
  "|| '📱'",
  "|| '💻'",
  "|| 'Solution Title'",
  "|| 'Trainer App'",
  "|| 'Complete onboarding, assessments & workouts.'",
  "|| '• Core Platform'",
  "|| 'Solution details and module description.'",
  "|| '• Module Details'",
  "|| 'CONNECTED 3-TIER ECOSYSTEM'",
  "|| 'TOTAL PROJECT INVESTMENT'",
  "|| '7,80,000'",
  "|| 'Codigix Infotech Private Limited'",
  "|| '07230200002691'",
  "|| 'BARB0CHINCH'",
  "|| 'Bank of Baroda Pimpri'",
  "|| '27AANCC3632N1Z8'",
  "|| '91127 06604'",
  "|| 'Office No 514, Brahma Sky Uzuri, Pimpri, Pune.'",
  "|| ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs']"
];

dummies.forEach(d => {
  content = content.split(' ' + d).join('');
  content = content.split(d).join('');
});

// Also there are some fallback props in EMPTY_QUOTATION_STATE that they might want removed? 
// No, the EMPTY_QUOTATION_STATE is mostly blank already except for images. Images they probably want to keep as placeholders because without them the PDF breaks.

fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Removed dummy data fallbacks.');
