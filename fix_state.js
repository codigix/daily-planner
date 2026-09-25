const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

// The file might be corrupted around line 300-330
// I will just find the whole EMPTY_QUOTATION_STATE block and replace it cleanly.
const regex = /const EMPTY_QUOTATION_STATE = \{[\s\S]*?customPages: \[\]\n\};/;

const cleanState = `const EMPTY_QUOTATION_STATE = {
  logoUrl: '',
  page2ImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  page3ImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  page7BgImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',

  proposalTitle: '',
  subtitle: '',
  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  clientName: '',
  companyName: '',
  companyEmail: '',
  companyWebsite: '',
  companyPhone: '',
  companyAddress: '',

  aboutText: '',
  statYear: '',
  statTeam: '',
  statClients: '',
  ourFocusTag: '',
  ourFocusTitle: '',
  valueBadges: ['', '', ''],

  execSummary: '',
  ecosystemTagline: '',
  
  scopeOfWorkHtml: '',
  sowMode: 'advanced',

  solutionCards: [],
  deliverables: [],
  teamList: [],
  integrations: [],

  totalCost: '',
  gstPercent: '18',
  particulars: [],

  bankAccountNo: '',
  bankAccountName: '',
  bankIFSC: '',
  bankBranch: '',
  notesList: [],

  customPages: []
};`;

content = content.replace(regex, cleanState);
fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
