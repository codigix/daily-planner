import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Download, Printer, FileText, 
  Building, User, Calendar, Layers, DollarSign, ShieldCheck, 
  ChevronDown, ChevronUp, Users, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw, Sparkles, FolderPlus, Layout 
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';

// Standard Sample Quotation Data for Codigix
const SAMPLE_CODIGIX_DATA = {
  logoUrl: '',
  page2ImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  page3ImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  page7BgImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',

  proposalTitle: 'Project Proposal',
  subtitle: 'Web & Mobile App Development',
  date: '11 Aug 2026',
  clientName: 'Mr. Santosh Manchare',
  companyName: 'Codigix Infotech Pvt. Ltd.',
  companyEmail: 'info@codigixinfotech.com',
  companyWebsite: 'www.codigixinfotech.com',
  companyPhone: '91127 06604',
  companyAddress: 'Office No 514, Brahma Sky Uzuri, Pimpri, Pune.',

  aboutText: 'Codigix Infotech is a technology-driven company specializing in advanced IT solutions such as AI-based Automation, Custom ERP and CRM Systems, Mobile Applications, and Scalable Website Development. We design and develop intelligent, secure, and high-performance digital platforms tailored to meet unique business requirements.',
  statYear: '2021',
  statTeam: '15',
  statClients: '44',
  ourFocusTag: 'OUR FOCUS',
  ourFocusTitle: 'Innovating Digital Excellence',
  valueBadges: [
    'High-Performance Enterprise Architecture',
    'Bank-grade Data Security & Scalable Cloud Services',
    'Business-Driven Digital Transformation'
  ],

  execSummary: 'FitRack is a scalable B2B2C Health & Wellness Business Management Platform designed for Fitness Coaches, Trainers, Nutritionists, Dietitians, and Wellness Professionals.\n\nThe platform will include three connected solutions:\n• Trainer Mobile App – Client management, assessments, diet/activity plans, products, inventory, appointments, payments, follow-ups, progress and reports.\n• Client Mobile App – Personalized plans, daily tasks, diet, workout, water and product tracking, appointments, payments and progress.\n• Admin Web Panel – Business, trainer, client, subscription, module, permission, payment and platform management.',
  
  ecosystemTagline: 'CONNECTED 3-TIER ECOSYSTEM',

  solutionCards: [
    {
      badge: 'SOLUTION 01',
      title: 'Trainer Mobile App',
      description: 'Client onboarding, assessments, personalized diet & workout plans, products, inventory, appointments & payment tracking.',
      footer: '• Android & iOS Apps',
      icon: '📱'
    },
    {
      badge: 'SOLUTION 02',
      title: 'Client Mobile App',
      description: 'Customized daily tasks, workout & water logs, nutrition product orders, appointment booking, payments & progress tracking.',
      footer: '• Android & iOS Apps',
      icon: '📱'
    },
    {
      badge: 'SOLUTION 03',
      title: 'Super Admin Panel',
      description: 'Central platform control, multi-tenant subscription tiers, trainer & client access control, revenue analytics & system configuration.',
      footer: '• Web Dashboard',
      icon: '💻'
    }
  ],

  deliverables: [
    'UI/UX Design & Prototyping',
    'Trainer Mobile Application – Android & iOS',
    'Client Mobile Application – Android & iOS',
    'Super Admin Web Panel',
    'Backend & REST API Development',
    'Database Design & Development',
    'Authentication, Roles & Permissions',
    'Multi-Tenant Business Architecture',
    'Coach Personal Workspace',
    'Cloud Infrastructure & DevOps',
    'Quality Assurance & Testing',
    'Client & Wellness Management',
    'Diet, Activity & Assessment Management',
    'Nutrition Product & Inventory Management',
    'Product Assignment, Tracking & Refill Automation',
    'Appointment, Follow-up Management',
    'Payment & Membership Management',
    'Progress Tracking & Reporting',
    'Notification & Reminder System',
    'Android & iOS App Deployment',
    'Technical Documentation & Source Code Handover',
    'Post-Launch Warranty & Support'
  ],

  teamList: [
    { role: 'Project Manager', count: '1', details: 'Requirements, workflows, business rules, client communication' },
    { role: 'UI / UX Designer', count: '1', details: 'Coach, Client & Admin UX/UI, prototype, design system' },
    { role: 'Flutter Developers', count: '2', details: 'Coach App + Client App' },
    { role: 'Backend Developer', count: '1', details: 'APIs, business logic, database integration, automation' },
    { role: 'Frontend Developer', count: '1', details: 'Admin Web Dashboard' },
    { role: 'QA Tester', count: '1', details: 'Mobile, web, API, regression & UAT' },
    { role: 'DevOps Engineer', count: '1', details: 'AWS/cloud, Docker, CI/CD, monitoring, backups' }
  ],

  integrations: [
    'Google Play Developer Account',
    'Apple Developer Program',
    'Cloud Hosting (AWS/Azure/GCP)',
    'Domain & SSL',
    'SMS / OTP Gateway',
    'Payment Gateway',
    'WhatsApp Business API'
  ],

  totalCost: '7,80,000',
  gstPercent: '18',
  particulars: [
    { name: 'AMC', value: '30% of total Project Cost' },
    { name: 'Support', value: '60 Days (Post-handover)' },
    { name: 'Extra Customizations / Modules', value: 'Chargeable as per requirement' },
    { name: 'Implementation Time', value: '90 working days (Mon-Fri)' },
    { name: 'Payment Terms', value: '1. 50% Advance\n2. 40% Once complete System Deployed on your domain\n3. 10% After System deployed' }
  ],

  bankAccountNo: '07230200002691',
  bankAccountName: 'Codigix Infotech Private Limited',
  bankIFSC: 'BARB0CHINCH',
  bankBranch: 'Bank of Baroda Pimpri',
  bankGST: '27AANCC3632N1Z8',

  notesList: [
    'All Module features are shared in-detailed in the separate document, please refer.',
    'There is no cost included for any third-party APIs with the provided system. The mentioned cost is strictly for development.',
    'During the testing phase, the client is responsible for thoroughly reviewing the system and reporting any bugs.',
    'Before development begins, the client must review, confirm, and approve all logic and calculations.',
    'The above cost does not include charges for the domain name, SSL certificate, server, or hosting requirements.',
    'Any additional requirements beyond the defined modules will be treated as change requests.',
    'The quoted price includes implementation, training, and 60 days support within the defined scope.',
    'After handover, support beyond 60 days will be chargeable on an hourly basis or under an AMC.',
    'AMC charges will be 30% of the total project cost.',
    'During AMC or 60 days support period, no additional requirements beyond discussed modules will be implemented.',
    'Once change request token issued, that will take to resolve around 3 - 4 days.',
    'An additional 18% GST will be applicable on the above-mentioned cost.'
  ],

  customPages: []
};

// Clean Empty State with Placeholders for Inputs
const EMPTY_QUOTATION_STATE = {
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

  solutionCards: [
    { badge: '', title: '', description: '', footer: '', icon: '📱' },
    { badge: '', title: '', description: '', footer: '', icon: '📱' },
    { badge: '', title: '', description: '', footer: '', icon: '💻' }
  ],

  deliverables: [''],

  teamList: [
    { role: '', count: '', details: '' }
  ],

  integrations: [
    'Google Play Developer Account',
    'Apple Developer Program',
    'Cloud Hosting (AWS/Azure/GCP)',
    'Domain & SSL',
    'SMS / OTP Gateway',
    'Payment Gateway',
    'WhatsApp Business API'
  ],

  totalCost: '',
  gstPercent: '18',
  particulars: [
    { name: 'AMC', value: '30% of total Project Cost' },
    { name: 'Support', value: '60 Days (Post-handover)' },
    { name: 'Extra Customizations / Modules', value: 'Chargeable as per requirement' },
    { name: 'Implementation Time', value: '90 working days (Mon-Fri)' },
    { name: 'Payment Terms', value: '1. 50% Advance\n2. 40% Once complete System Deployed on your domain\n3. 10% After System deployed' }
  ],

  bankAccountNo: '',
  bankAccountName: '',
  bankIFSC: '',
  bankBranch: '',
  bankGST: '',

  notesList: [''],

  customPages: []
};

export default function CreateQuotationView({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('cover'); // 'cover', 'about', 'summary', 'deliverables', 'team', 'budget', 'notes', 'images', 'custom'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0); // 0 to 100%
  const [showSaveToast, setShowSaveToast] = useState(false);

  // State initialized from localStorage or Clean Empty State with Placeholders
  const [quotationData, setQuotationData] = useState(() => {
    const saved = localStorage.getItem('codigix_quotation_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.customPages) parsed.customPages = [];
        if (!parsed.solutionCards) parsed.solutionCards = SAMPLE_CODIGIX_DATA.solutionCards;
        if (!parsed.ecosystemTagline) parsed.ecosystemTagline = SAMPLE_CODIGIX_DATA.ecosystemTagline;
        if (!parsed.valueBadges || parsed.valueBadges.length === 0) parsed.valueBadges = SAMPLE_CODIGIX_DATA.valueBadges;
        if (!parsed.ourFocusTag) parsed.ourFocusTag = 'OUR FOCUS';
        if (!parsed.ourFocusTitle) parsed.ourFocusTitle = 'Innovating Digital Excellence';
        return parsed;
      } catch (e) {
        console.error('Error reading saved quotation data:', e);
      }
    }
    return EMPTY_QUOTATION_STATE;
  });

  const handleSaveQuotation = () => {
    localStorage.setItem('codigix_quotation_data', JSON.stringify(quotationData));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleSaveAndDownload = async () => {
    localStorage.setItem('codigix_quotation_data', JSON.stringify(quotationData));
    setShowSaveToast(true);
    await handleDownloadPDF();
  };

  const handleLoadSampleData = () => {
    setQuotationData(SAMPLE_CODIGIX_DATA);
    localStorage.setItem('codigix_quotation_data', JSON.stringify(SAMPLE_CODIGIX_DATA));
  };

  const handleClearForm = () => {
    setQuotationData(EMPTY_QUOTATION_STATE);
    localStorage.removeItem('codigix_quotation_data');
  };

  const handleInputChange = (field, value) => {
    setQuotationData(prev => ({ ...prev, [field]: value }));
  };

  // Solution Cards Mutators (Page 3 Executive Summary)
  const handleSolutionCardChange = (index, field, value) => {
    const updated = [...(quotationData.solutionCards || [])];
    updated[index] = { ...updated[index], [field]: value };
    setQuotationData(prev => ({ ...prev, solutionCards: updated }));
  };

  const addSolutionCard = () => {
    const currentLength = quotationData.solutionCards?.length || 0;
    setQuotationData(prev => ({
      ...prev,
      solutionCards: [
        ...(prev.solutionCards || []),
        {
          badge: `SOLUTION 0${currentLength + 1}`,
          title: '',
          description: '',
          footer: '• Module Details',
          icon: '⚡'
        }
      ]
    }));
  };

  const removeSolutionCard = (index) => {
    setQuotationData(prev => ({
      ...prev,
      solutionCards: prev.solutionCards.filter((_, i) => i !== index)
    }));
  };

  // Value Badges Mutators (Page 2 About Us Checkmarks)
  const handleValueBadgeChange = (index, value) => {
    const updated = [...(quotationData.valueBadges || [])];
    updated[index] = value;
    setQuotationData(prev => ({ ...prev, valueBadges: updated }));
  };

  const addValueBadge = () => {
    setQuotationData(prev => ({ ...prev, valueBadges: [...(prev.valueBadges || []), ''] }));
  };

  const removeValueBadge = (index) => {
    setQuotationData(prev => ({ ...prev, valueBadges: prev.valueBadges.filter((_, i) => i !== index) }));
  };

  // Deliverables mutators
  const handleDeliverableChange = (index, value) => {
    const updated = [...quotationData.deliverables];
    updated[index] = value;
    setQuotationData(prev => ({ ...prev, deliverables: updated }));
  };

  const addDeliverable = () => {
    setQuotationData(prev => ({ ...prev, deliverables: [...prev.deliverables, ''] }));
  };

  const removeDeliverable = (index) => {
    setQuotationData(prev => ({ ...prev, deliverables: prev.deliverables.filter((_, i) => i !== index) }));
  };

  // Team mutators
  const handleTeamChange = (index, field, value) => {
    const updated = [...quotationData.teamList];
    updated[index] = { ...updated[index], [field]: value };
    setQuotationData(prev => ({ ...prev, teamList: updated }));
  };

  const addTeamMember = () => {
    setQuotationData(prev => ({
      ...prev,
      teamList: [...prev.teamList, { role: '', count: '1', details: '' }]
    }));
  };

  const removeTeamMember = (index) => {
    setQuotationData(prev => ({ ...prev, teamList: prev.teamList.filter((_, i) => i !== index) }));
  };

  // Particulars mutators (Budget Page 6)
  const handleParticularChange = (index, field, value) => {
    const updated = [...quotationData.particulars];
    updated[index] = { ...updated[index], [field]: value };
    setQuotationData(prev => ({ ...prev, particulars: updated }));
  };

  const addParticular = () => {
    setQuotationData(prev => ({
      ...prev,
      particulars: [...prev.particulars, { name: '', value: '' }]
    }));
  };

  const removeParticular = (index) => {
    setQuotationData(prev => ({ ...prev, particulars: prev.particulars.filter((_, i) => i !== index) }));
  };

  // Integrations mutators (Team Page 5)
  const handleIntegrationChange = (index, value) => {
    const updated = [...quotationData.integrations];
    updated[index] = value;
    setQuotationData(prev => ({ ...prev, integrations: updated }));
  };

  const addIntegration = () => {
    setQuotationData(prev => ({ ...prev, integrations: [...prev.integrations, ''] }));
  };

  const removeIntegration = (index) => {
    setQuotationData(prev => ({ ...prev, integrations: prev.integrations.filter((_, i) => i !== index) }));
  };

  // Notes mutators
  const handleNoteChange = (index, value) => {
    const updated = [...quotationData.notesList];
    updated[index] = value;
    setQuotationData(prev => ({ ...prev, notesList: updated }));
  };

  const addNote = () => {
    setQuotationData(prev => ({ ...prev, notesList: [...prev.notesList, ''] }));
  };

  const removeNote = (index) => {
    setQuotationData(prev => ({ ...prev, notesList: prev.notesList.filter((_, i) => i !== index) }));
  };

  // DYNAMIC CUSTOM PAGE & SECTION MUTATORS
  const handleCustomPageChange = (pageIndex, field, value) => {
    const updated = [...quotationData.customPages];
    updated[pageIndex] = { ...updated[pageIndex], [field]: value };
    setQuotationData(prev => ({ ...prev, customPages: updated }));
  };

  const handleCustomItemChange = (pageIndex, itemIndex, value) => {
    const updatedPages = [...quotationData.customPages];
    const updatedItems = [...(updatedPages[pageIndex].items || [])];
    updatedItems[itemIndex] = value;
    updatedPages[pageIndex].items = updatedItems;
    setQuotationData(prev => ({ ...prev, customPages: updatedPages }));
  };

  const addCustomItem = (pageIndex) => {
    const updatedPages = [...quotationData.customPages];
    const updatedItems = [...(updatedPages[pageIndex].items || []), ''];
    updatedPages[pageIndex].items = updatedItems;
    setQuotationData(prev => ({ ...prev, customPages: updatedPages }));
  };

  const removeCustomItem = (pageIndex, itemIndex) => {
    const updatedPages = [...quotationData.customPages];
    updatedPages[pageIndex].items = updatedPages[pageIndex].items.filter((_, i) => i !== itemIndex);
    setQuotationData(prev => ({ ...prev, customPages: updatedPages }));
  };

  const addCustomPage = () => {
    const newPage = {
      id: Date.now(),
      title: '',
      subtitle: '',
      content: '',
      items: [''],
      imageUrl: ''
    };
    setQuotationData(prev => ({ ...prev, customPages: [...(prev.customPages || []), newPage] }));
  };

  const removeCustomPage = (index) => {
    setQuotationData(prev => ({ ...prev, customPages: prev.customPages.filter((_, i) => i !== index) }));
  };

  // 100% DIRECT SQUARE PDF GENERATOR (210mm x 210mm) - Renders ALL standard + custom pages with 100% EXACT Edit Mode Font & Layout!
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setPdfProgress(5);

      // Ensure browser font engine has loaded Manrope font before capturing DOM
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const pageElements = document.querySelectorAll('.proposal-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No proposal pages found to render.');
      }

      // Create jsPDF instance (SQUARE: 210mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 210],
        compress: true
      });

      const totalPages = pageElements.length;

      for (let i = 0; i < totalPages; i++) {
        const pageEl = pageElements[i];
        
        // Render DOM element using SVG foreignObject to JPEG with inline injected Google Fonts Manrope CSS
        // This ensures the SVG foreignObject canvas uses the EXACT same 'Manrope' font and layout as Edit Mode on screen!
        const imgData = await toJpeg(pageEl, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: `
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');
            * {
              font-family: 'Manrope', system-ui, -apple-system, sans-serif !important;
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
            }
          `
        });

        if (i > 0) {
          pdf.addPage([210, 210], 'portrait');
        }

        // Add page image at full SQUARE bleed (0, 0, 210mm, 210mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 210, undefined, 'FAST');

        setPdfProgress(Math.round(((i + 1) / totalPages) * 100));
      }

      // Trigger direct file download
      const clientFileName = quotationData.clientName ? quotationData.clientName.replace(/[^a-zA-Z0-9]/g, '-') : 'Client';
      const fileName = `Codigix-Project-Proposal-${clientFileName}.pdf`;
      pdf.save(fileName);

      setIsGeneratingPDF(false);
      setPdfProgress(0);
    } catch (error) {
      console.error('Direct PDF generation error:', error);
      setIsGeneratingPDF(false);
      setPdfProgress(0);
      alert('PDF generation notice: Opening print view.');
      window.print();
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Red Barcode Pattern Component
  const RedBarcodePattern = () => (
    <div className="flex flex-col gap-[2px]">
      {[...Array(14)].map((_, i) => (
        <div key={i} className="w-5 h-[2px] bg-[#E60023]"></div>
      ))}
    </div>
  );

  const RedHorizontalBarcodePattern = () => (
    <div className="flex gap-[3px]">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="w-[3px] h-4 bg-[#E60023]"></div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-[#F1F5F9] dark:bg-[#0B1120] text-[#1E293B] dark:text-[#E2E8F0]">
      
      {/* High-Precision SQUARE Print & Aspect Ratio CSS (210mm x 210mm [1 : 1]) with ENFORCED WEBSITE FONT 'MANROPE' */}
      <style>{`
        .proposal-page, .proposal-page * {
          font-family: 'Manrope', system-ui, -apple-system, sans-serif !important;
        }
        @media print {
          @page {
            size: 210mm 210mm;
            margin: 0mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-family: 'Manrope', system-ui, -apple-system, sans-serif !important;
          }
          html, body, #root, main, div, section {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            position: static !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Manrope', system-ui, -apple-system, sans-serif !important;
          }
          .no-print, header, sidebar, nav, button {
            display: none !important;
          }
          .print-area {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .proposal-page {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            height: 209.5mm !important;
            min-height: 209.5mm !important;
            max-height: 209.5mm !important;
            aspect-ratio: 1 / 1 !important;
            page-break-before: always !important;
            page-break-after: always !important;
            break-before: page !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            position: relative !important;
            font-family: 'Manrope', system-ui, -apple-system, sans-serif !important;
          }
          .proposal-page:first-child {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
        }
      `}</style>

      {/* Generating Overlay Modal */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">
          <div className="bg-[#1E293B] border border-[#334155] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-4">
             <div className="w-14 h-14 rounded-full bg-[#E60023]/20 text-[#E60023] flex items-center justify-center mx-auto border border-[#E60023]/30">
               <Loader2 className="w-8 h-8 animate-spin" />
             </div>
             <div>
               <h3 className="text-xl font-black">Generating Square PDF</h3>
               <p className="text-xs text-[#94A3B8] mt-1">Rendering pixel-perfect PDF with edit mode layout ({7 + (quotationData.customPages?.length || 0)} pages)...</p>
             </div>
             
             {/* Progress Bar */}
             <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-mono font-bold text-[#CBD5E1]">
                  <span>Progress</span>
                  <span>{pdfProgress}%</span>
                </div>
                <div className="w-full h-3 bg-[#334155] rounded-full overflow-hidden p-0.5">
                   <div 
                     className="h-full bg-gradient-to-r from-[#E60023] to-[#F59E0B] rounded-full transition-all duration-300"
                     style={{ width: `${pdfProgress}%` }}
                   />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* LEFT PANEL - CONFIGURATION & INPUT FORM */}
      <div className="no-print w-full lg:w-4/12 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate && onNavigate('finance')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
              title="Back to Finance"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Quotation Generator</h1>
              <p className="text-xs text-slate-500 font-medium">Codigix Square Proposal Format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleSaveQuotation}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Save changes to browser storage"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Quick Action Toolbar (Load Demo Data / Clear Inputs) */}
        <div className="px-4 pt-3 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 bg-slate-50/50 dark:bg-slate-900/50">
           <button
             onClick={handleLoadSampleData}
             className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
           >
             <Sparkles className="w-3.5 h-3.5 text-blue-600" />
             <span>Fill Sample Data</span>
           </button>
           <button
             onClick={handleClearForm}
             className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
             title="Clear inputs to start with placeholders"
           >
             <RefreshCw className="w-3.5 h-3.5" />
             <span>Clear Inputs</span>
           </button>
        </div>

        {/* Saved Success Toast Banner */}
        {showSaveToast && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Form changes saved & live updated on PDF pages!</span>
          </div>
        )}

        {/* Section Accordions */}
        <div className="p-4 space-y-3">
          
          {/* Section 0: Images & Custom Assets */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'images' ? '' : 'images')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-pink-600" /> Page Images & Assets
              </span>
              {activeSection === 'images' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'images' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Logo Image URL (Optional)</label>
                  <input 
                    type="text" value={quotationData.logoUrl} onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="Leave empty to use official Codigix logo SVG"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Page 2 Image URL (About Us)</label>
                  <input 
                    type="text" value={quotationData.page2ImageUrl} onChange={(e) => handleInputChange('page2ImageUrl', e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Page 3 Image URL (Executive Summary)</label>
                  <input 
                    type="text" value={quotationData.page3ImageUrl} onChange={(e) => handleInputChange('page3ImageUrl', e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Page 7 Background Watermark URL</label>
                  <input 
                    type="text" value={quotationData.page7BgImageUrl} onChange={(e) => handleInputChange('page7BgImageUrl', e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Cover & Info */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'cover' ? '' : 'cover')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" /> 1. Cover & Client Info
              </span>
              {activeSection === 'cover' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'cover' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Proposal Title</label>
                  <input 
                    type="text" value={quotationData.proposalTitle} onChange={(e) => handleInputChange('proposalTitle', e.target.value)}
                    placeholder="e.g. Project Proposal"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Subtitle / Scope</label>
                  <input 
                    type="text" value={quotationData.subtitle} onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="e.g. Web & Mobile App Development"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Prepared For (Client)</label>
                    <input 
                      type="text" value={quotationData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)}
                      placeholder="e.g. Mr. Santosh Manchare"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-red-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Date</label>
                    <input 
                      type="text" value={quotationData.date} onChange={(e) => handleInputChange('date', e.target.value)}
                      placeholder="e.g. 11 Aug 2026"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Prepared By</label>
                    <input 
                      type="text" value={quotationData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="e.g. Codigix Infotech Pvt. Ltd."
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Company Email</label>
                    <input 
                      type="text" value={quotationData.companyEmail} onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                      placeholder="e.g. info@codigixinfotech.com"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: About Company & Stats */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'about' ? '' : 'about')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" /> 2. About Company & Stats
              </span>
              {activeSection === 'about' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'about' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">About Description</label>
                  <textarea 
                    rows="4" value={quotationData.aboutText} onChange={(e) => handleInputChange('aboutText', e.target.value)}
                    placeholder="e.g. Codigix Infotech is a technology-driven company specializing in advanced IT solutions..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Established</label>
                    <input 
                      type="text" value={quotationData.statYear} onChange={(e) => handleInputChange('statYear', e.target.value)}
                      placeholder="e.g. 2021"
                      className="w-full mt-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Team Members</label>
                    <input 
                      type="text" value={quotationData.statTeam} onChange={(e) => handleInputChange('statTeam', e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full mt-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Customers</label>
                    <input 
                      type="text" value={quotationData.statClients} onChange={(e) => handleInputChange('statClients', e.target.value)}
                      placeholder="e.g. 44"
                      className="w-full mt-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                   <div>
                     <label className="text-[10px] font-semibold text-slate-500 uppercase">Image Overlay Tag</label>
                     <input 
                       type="text" value={quotationData.ourFocusTag} onChange={(e) => handleInputChange('ourFocusTag', e.target.value)}
                       placeholder="e.g. OUR FOCUS"
                       className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-red-600"
                     />
                   </div>
                   <div>
                     <label className="text-[10px] font-semibold text-slate-500 uppercase">Image Overlay Title</label>
                     <input 
                       type="text" value={quotationData.ourFocusTitle} onChange={(e) => handleInputChange('ourFocusTitle', e.target.value)}
                       placeholder="e.g. Innovating Digital Excellence"
                       className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                     />
                   </div>
                </div>

                {/* Company Value Badges */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                   <label className="text-[11px] font-bold text-[#161042] dark:text-blue-400 uppercase flex items-center gap-1">
                     <span>✓ Checkmark Value Badges ({quotationData.valueBadges?.length || 0})</span>
                   </label>
                   
                   {quotationData.valueBadges && quotationData.valueBadges.map((badge, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#161042] text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                        <input 
                          type="text" value={badge} onChange={(e) => handleValueBadgeChange(idx, e.target.value)}
                          placeholder={`Checkmark Badge ${idx + 1} e.g. High-Performance Enterprise Architecture`}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-[#161042] dark:text-slate-200"
                        />
                        <button onClick={() => removeValueBadge(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   ))}
                   <button onClick={addValueBadge} className="w-full py-1.5 border border-dashed border-blue-300 dark:border-blue-700 text-xs font-bold text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                     + Add Value Badge
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Executive Summary & Solution Cards */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'summary' ? '' : 'summary')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" /> 3. Executive Summary & Solution Cards
              </span>
              {activeSection === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'summary' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Executive Summary Intro Text</label>
                  <textarea 
                    rows="4" value={quotationData.execSummary} onChange={(e) => handleInputChange('execSummary', e.target.value)}
                    placeholder="e.g. FitRack is engineered as a unified, multi-tenant digital ecosystem..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Bottom Barcode Ecosystem Tagline</label>
                  <input 
                    type="text" value={quotationData.ecosystemTagline} onChange={(e) => handleInputChange('ecosystemTagline', e.target.value)}
                    placeholder="e.g. CONNECTED 3-TIER ECOSYSTEM"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                  />
                </div>

                {/* EDITABLE SOLUTION CARDS EDITOR */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-slate-400 uppercase">Solution Pillar Cards ({quotationData.solutionCards?.length || 0} Cards)</span>
                   </div>

                   {quotationData.solutionCards && quotationData.solutionCards.map((card, idx) => (
                     <div key={idx} className="p-3 border border-purple-200 dark:border-purple-900/50 rounded-xl bg-purple-50/20 dark:bg-purple-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <input 
                               type="text" value={card.icon} onChange={(e) => handleSolutionCardChange(idx, 'icon', e.target.value)} placeholder="Emoji"
                               className="w-10 px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-xs"
                             />
                             <input 
                               type="text" value={card.badge} onChange={(e) => handleSolutionCardChange(idx, 'badge', e.target.value)} placeholder="e.g. SOLUTION 01"
                               className="w-28 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold uppercase text-red-600"
                             />
                          </div>
                          <button onClick={() => removeSolutionCard(idx)} className="text-red-500 hover:text-red-700 p-1">
                             <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input 
                          type="text" value={card.title} onChange={(e) => handleSolutionCardChange(idx, 'title', e.target.value)} placeholder="Solution Title e.g. Trainer Mobile App"
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                        />

                        <textarea 
                          rows="2" value={card.description} onChange={(e) => handleSolutionCardChange(idx, 'description', e.target.value)} placeholder="Solution details and scope..."
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs leading-tight"
                        />

                        <input 
                          type="text" value={card.footer} onChange={(e) => handleSolutionCardChange(idx, 'footer', e.target.value)} placeholder="Footer tag e.g. • Android & iOS Apps"
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px]"
                        />
                     </div>
                   ))}

                   <button 
                     onClick={addSolutionCard}
                     className="w-full py-2 border border-dashed border-purple-300 dark:border-purple-800 text-xs font-bold text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                   >
                     + Add Solution Pillar Card
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Key Deliverables */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'deliverables' ? '' : 'deliverables')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Scope of Work ({quotationData.deliverables.filter(Boolean).length} Deliverables)
              </span>
              {activeSection === 'deliverables' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'deliverables' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 max-h-[350px] overflow-y-auto">
                {quotationData.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}.</span>
                    <input 
                      type="text" value={item} onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                      placeholder={`Deliverable ${idx + 1} e.g. UI/UX Design`}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    />
                    <button onClick={() => removeDeliverable(idx)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addDeliverable}
                  className="w-full mt-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  + Add Deliverable Item
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Team Distribution & Third-Party Integrations */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'team' ? '' : 'team')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> 5. Team & Integrations
              </span>
              {activeSection === 'team' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'team' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Team Members Breakdown</span>
                  {quotationData.teamList.map((t, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex gap-2">
                        <input 
                          type="text" value={t.role} onChange={(e) => handleTeamChange(idx, 'role', e.target.value)} placeholder="Role e.g. Project Manager"
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                        />
                        <input 
                          type="text" value={t.count} onChange={(e) => handleTeamChange(idx, 'count', e.target.value)} placeholder="Qty"
                          className="w-12 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-center"
                        />
                        <button onClick={() => removeTeamMember(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input 
                        type="text" value={t.details} onChange={(e) => handleTeamChange(idx, 'details', e.target.value)} placeholder="Details / Scope e.g. Requirements, client communication"
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                      />
                    </div>
                  ))}
                  <button onClick={addTeamMember} className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 rounded-lg">
                    + Add Team Role
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Third-Party Integrations List</span>
                  {quotationData.integrations.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="text" value={item} onChange={(e) => handleIntegrationChange(idx, e.target.value)} placeholder="Integration e.g. AWS Cloud Hosting"
                        className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium"
                      />
                      <button onClick={() => removeIntegration(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addIntegration} className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 rounded-lg">
                    + Add Integration Item
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Budget, Particulars & Bank Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'budget' ? '' : 'budget')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> 6. Budget & Bank Details
              </span>
              {activeSection === 'budget' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'budget' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Project Cost (₹)</label>
                    <input 
                      type="text" value={quotationData.totalCost} onChange={(e) => handleInputChange('totalCost', e.target.value)}
                      placeholder="e.g. 7,80,000"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-red-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">GST %</label>
                    <input 
                      type="text" value={quotationData.gstPercent} onChange={(e) => handleInputChange('gstPercent', e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-bold"
                    />
                  </div>
                </div>

                {/* Particulars Table Rows */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Particulars & Terms Breakdown</span>
                  {quotationData.particulars.map((p, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex gap-2">
                        <input 
                          type="text" value={p.name} onChange={(e) => handleParticularChange(idx, 'name', e.target.value)} placeholder="Particular Name e.g. Payment Terms"
                          className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                        />
                        <button onClick={() => removeParticular(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea 
                        rows="2" value={p.value} onChange={(e) => handleParticularChange(idx, 'value', e.target.value)} placeholder="Particular Details..."
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                      />
                    </div>
                  ))}
                  <button onClick={addParticular} className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 rounded-lg">
                    + Add Particular Row
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Bank Transfer Details</span>
                  <div>
                    <label className="text-[10px] text-slate-500">Account No</label>
                    <input 
                      type="text" value={quotationData.bankAccountNo} onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                      placeholder="e.g. 07230200002691"
                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Account Name</label>
                    <input 
                      type="text" value={quotationData.bankAccountName} onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                      placeholder="e.g. Codigix Infotech Private Limited"
                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">IFSC Code</label>
                      <input 
                        type="text" value={quotationData.bankIFSC} onChange={(e) => handleInputChange('bankIFSC', e.target.value)}
                        placeholder="e.g. BARB0CHINCH"
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">GST No</label>
                      <input 
                        type="text" value={quotationData.bankGST} onChange={(e) => handleInputChange('bankGST', e.target.value)}
                        placeholder="e.g. 27AANCC3632N1Z8"
                        className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Notes & Terms */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button 
              onClick={() => setActiveSection(activeSection === 'notes' ? '' : 'notes')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600" /> 7. Terms & Conditions ({quotationData.notesList.filter(Boolean).length} Points)
              </span>
              {activeSection === 'notes' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'notes' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 max-h-[300px] overflow-y-auto">
                {quotationData.notesList.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-5 text-center text-xs font-bold text-slate-400 mt-1.5">{idx + 1}.</span>
                    <textarea 
                      rows="2" value={note} onChange={(e) => handleNoteChange(idx, e.target.value)}
                      placeholder={`Condition ${idx + 1} e.g. 18% GST will be applicable`}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-tight"
                    />
                    <button onClick={() => removeNote(idx)} className="p-1 text-red-400 hover:text-red-600 mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addNote} className="w-full mt-2 py-2 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 rounded-lg">
                  + Add Condition Note
                </button>
              </div>
            )}
          </div>

          {/* Section 8: ADD NEW CUSTOM PAGES & EXTRA SECTIONS */}
          <div className="border border-indigo-200 dark:border-indigo-900/50 rounded-xl overflow-hidden bg-indigo-50/40 dark:bg-indigo-950/20">
            <button 
              onClick={() => setActiveSection(activeSection === 'custom' ? '' : 'custom')}
              className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 8. Custom Pages & Additional Sections ({quotationData.customPages?.length || 0} Custom Slides)
              </span>
              {activeSection === 'custom' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {activeSection === 'custom' && (
              <div className="p-4 border-t border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-900 space-y-4">
                <p className="text-xs text-slate-500">
                  Add new custom section pages (e.g. Portfolio, SLA & Warranties, Case Studies). Each custom page will render as a full Square slide in your PDF!
                </p>

                {quotationData.customPages && quotationData.customPages.map((cp, cpIdx) => (
                  <div key={cp.id || cpIdx} className="p-3 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Custom Slide Page #{cpIdx + 8}</span>
                      <button onClick={() => removeCustomPage(cpIdx)} className="p-1 text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-bold">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Slide
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Section Title</label>
                      <input 
                        type="text" value={cp.title} onChange={(e) => handleCustomPageChange(cpIdx, 'title', e.target.value)} placeholder="e.g. Past Projects & Portfolio"
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Section Subtitle</label>
                      <input 
                        type="text" value={cp.subtitle} onChange={(e) => handleCustomPageChange(cpIdx, 'subtitle', e.target.value)} placeholder="e.g. Track Record & Proven Excellence"
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Section Content / Description</label>
                      <textarea 
                        rows="3" value={cp.content} onChange={(e) => handleCustomPageChange(cpIdx, 'content', e.target.value)} placeholder="Describe this custom section..."
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                      />
                    </div>

                    {/* Custom Page Bullet Points */}
                    <div className="space-y-1.5 pt-1">
                       <label className="text-[10px] font-semibold text-slate-500 uppercase">Custom Bullet Items</label>
                       {cp.items && cp.items.map((item, itemIdx) => (
                         <div key={itemIdx} className="flex items-center gap-2">
                            <input 
                              type="text" value={item} onChange={(e) => handleCustomItemChange(cpIdx, itemIdx, e.target.value)} placeholder={`Item ${itemIdx + 1}`}
                              className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs"
                            />
                            <button onClick={() => removeCustomItem(cpIdx, itemIdx)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                       ))}
                       <button onClick={() => addCustomItem(cpIdx)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                         + Add Bullet Item
                       </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addCustomPage}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-xs font-black text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Custom Page / Slide</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* RIGHT PANEL - LIVE PREVIEW & PRINTABLE DOCUMENT */}
      <div className="w-full lg:w-8/12 flex flex-col h-full bg-slate-200 dark:bg-[#080d1a] relative">
        
        {/* Toolbar (Hidden when printing) */}
        <div className="no-print sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <FileText className="w-4 h-4 text-red-600" />
             <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-wider">CODIGIX SQUARE PROPOSAL FORMAT ({7 + (quotationData.customPages?.length || 0)} PAGES)</span>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={handleNativePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> <span>Print</span>
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/30 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Square PDF ({pdfProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Real Quotation PDF</span>
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Multi-Page Document Container */}
        <div className="print-area flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8 flex flex-col items-center">
           
           {/* ================= PAGE 1: COVER PAGE (SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Header section (Fixed Top with Official Codigix Logo) */}
              <div className="p-8 flex justify-between items-start shrink-0">
                <div>
                  <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-10 object-contain" />
                </div>
                <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                  <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                  <RedBarcodePattern />
                </div>
              </div>

              {/* Title Section (Center Content) */}
              <div className="px-10 py-8 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
                 <h1 className="text-4xl sm:text-5xl font-black text-[#161042] tracking-tight leading-tight">
                   {quotationData.proposalTitle || 'Project Proposal'}
                 </h1>
                 <p className="text-xl sm:text-2xl font-bold text-[#161042] tracking-tight">
                   {quotationData.subtitle || 'Web & Mobile App Development'}
                 </p>
              </div>

              {/* Bottom Section: Contacts & Red Banner (Fixed Bottom) */}
              <div className="shrink-0 w-full">
                <div className="px-8 py-3 flex justify-between text-xs text-[#475569] font-medium border-t border-[#F1F5F9]">
                  <span>{quotationData.companyEmail || 'info@codigixinfotech.com'}</span>
                  <span>{quotationData.companyWebsite || 'www.codigixinfotech.com'}</span>
                </div>

                {/* Red Bottom Banner */}
                <div className="bg-[#E60023] text-white p-6 grid grid-cols-2 text-center items-center w-full">
                   <div>
                     <div className="text-xs uppercase font-medium tracking-wider opacity-90">Prepared for:</div>
                     <div className="text-lg sm:text-xl font-bold mt-0.5">{quotationData.clientName || 'Client Name'}</div>
                   </div>
                   <div>
                     <div className="text-xs uppercase font-medium tracking-wider opacity-90">Prepared by:</div>
                     <div className="text-lg sm:text-xl font-bold mt-0.5">{quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}</div>
                   </div>
                </div>
              </div>
           </div>


           {/* ================= PAGE 2: ABOUT US (REDESIGNED SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Header section (Logo & Date) */}
              <div className="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-[#F1F5F9]">
                <div>
                  <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-9 object-contain" />
                </div>
                <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                  <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                  <RedBarcodePattern />
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                 
                 {/* Title & Headline */}
                 <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161042]/5 border border-[#161042]/20 rounded-full text-[11px] font-bold text-[#161042] uppercase tracking-wider">
                      <Building className="w-3.5 h-3.5 text-[#E60023]" />
                      <span>About The Company</span>
                    </div>
                    <h2 className="text-3xl font-black text-[#161042] tracking-tight">
                      {quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}
                    </h2>
                    <div className="w-16 h-1 bg-[#E60023] rounded-full"></div>
                 </div>

                 {/* Two Column Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
                    
                    {/* Left Column: Text & Pillars (7 cols) */}
                    <div className="md:col-span-7 space-y-4">
                       <p className="text-xs text-[#334155] leading-relaxed font-normal bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                         {quotationData.aboutText || 'Codigix Infotech is a technology-driven company specializing in advanced IT solutions such as AI-based Automation, Custom ERP and CRM Systems, Mobile Applications, and Scalable Website Development.'}
                       </p>

                       {/* Company Value Badges (Dynamic Checkmarks with Website Font) */}
                       <div className="space-y-2 pt-1">
                          {(quotationData.valueBadges?.filter(Boolean).length > 0 
                            ? quotationData.valueBadges.filter(Boolean) 
                            : ['High-Performance Enterprise Architecture', 'Bank-grade Data Security & Scalable Cloud Services', 'Business-Driven Digital Transformation']
                          ).map((badge, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#161042]">
                              <span className={`w-5 h-5 rounded-full ${idx % 2 === 1 ? 'bg-[#E60023]' : 'bg-[#161042]'} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>✓</span>
                              <span>{badge}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Right Column: Image with Overlay Badge (5 cols) */}
                    <div className="md:col-span-5 h-full flex flex-col justify-center">
                       <div className="w-full h-[240px] rounded-2xl overflow-hidden shadow-lg border border-[#CBD5E1] relative bg-[#F8FAFC]">
                          <img 
                            src={quotationData.page2ImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'} 
                            alt="Codigix Team Working" 
                            className="w-full h-full object-cover object-center"
                          />
                          <div className="absolute bottom-3 left-3 right-3 bg-[#161042]/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/20 text-center">
                             <div className="text-[10px] uppercase tracking-widest font-bold text-[#E60023]">{quotationData.ourFocusTag || 'OUR FOCUS'}</div>
                             <div className="text-xs font-bold mt-0.5">{quotationData.ourFocusTitle || 'Innovating Digital Excellence'}</div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Stat Cards Row */}
                 <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="bg-[#161042] text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border border-[#161042]">
                      <div className="text-2xl font-black text-white">{quotationData.statYear || '2021'}</div>
                      <div className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-wider">Established</div>
                    </div>
                    <div className="bg-[#E60023] text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border border-[#E60023]">
                      <div className="text-2xl font-black text-white">{quotationData.statTeam || '15'}+</div>
                      <div className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">In-House Experts</div>
                    </div>
                    <div className="bg-[#0F172A] text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border border-[#0F172A]">
                      <div className="text-2xl font-black text-white">{quotationData.statClients || '44'}+</div>
                      <div className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-wider">Delighted Clients</div>
                    </div>
                 </div>

              </div>

              {/* Red Footer Bar */}
              <div className="h-7 bg-[#E60023] w-full shrink-0"></div>
           </div>


           {/* ================= PAGE 3: EXECUTIVE SUMMARY (DYNAMIC SOLUTION CARDS 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Header section (Logo & Date) */}
              <div className="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-[#F1F5F9]">
                <div>
                  <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-9 object-contain" />
                </div>
                <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                  <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                  <RedBarcodePattern />
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                 
                 {/* Title Section */}
                 <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E60023]/10 border border-[#E60023]/30 rounded-full text-[11px] font-bold text-[#E60023] uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5 text-[#E60023]" />
                      <span>Project Overview</span>
                    </div>
                    <h2 className="text-3xl font-black text-[#161042] tracking-tight">
                      Executive Summary
                    </h2>
                    <p className="text-xs font-semibold text-[#64748B]">
                      {quotationData.subtitle ? `${quotationData.subtitle} Scope` : 'Scalable Enterprise App Platform'}
                    </p>
                 </div>

                 {/* Platform Overview Intro Card */}
                 <div className="bg-[#F8FAFC] border-l-4 border-[#161042] p-4 rounded-r-xl space-y-1.5 shadow-sm">
                    <p className="text-xs text-[#334155] leading-relaxed font-normal whitespace-pre-wrap">
                      {quotationData.execSummary || 'FitRack is engineered as a unified, multi-tenant digital ecosystem connecting Fitness Coaches, Dietitians, Clients, and Platform Administrators under one seamless architecture.'}
                    </p>
                 </div>

                 {/* DYNAMIC SOLUTION PILLAR CARDS (Structured Dynamic Grid Layout) */}
                 <div className={`grid grid-cols-1 md:grid-cols-${Math.min(quotationData.solutionCards?.length || 3, 4)} gap-4 flex-1`}>
                    {(quotationData.solutionCards && quotationData.solutionCards.length > 0 
                      ? quotationData.solutionCards 
                      : [
                          { badge: 'SOLUTION 01', title: 'Trainer Mobile App', description: 'Client onboarding, assessments, personalized diet & workout plans.', footer: '• Android & iOS Apps', icon: '📱' },
                          { badge: 'SOLUTION 02', title: 'Client Mobile App', description: 'Customized daily tasks, workout & water logs, appointment booking.', footer: '• Android & iOS Apps', icon: '📱' },
                          { badge: 'SOLUTION 03', title: 'Super Admin Panel', description: 'Central platform control, multi-tenant subscription tiers & analytics.', footer: '• Web Dashboard', icon: '💻' }
                        ]
                    ).map((card, idx) => {
                      const borderColor = idx === 1 ? 'border-[#E60023]' : idx === 0 ? 'border-[#161042]' : 'border-[#0F172A]';
                      const badgeColor = idx === 1 ? 'text-[#E60023]' : idx === 0 ? 'text-[#161042]' : 'text-[#0F172A]';
                      const iconBg = idx === 1 ? 'bg-[#E60023]' : idx === 0 ? 'bg-[#161042]' : 'bg-[#0F172A]';
                      
                      return (
                        <div key={idx} className={`bg-white border-2 ${borderColor} rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden`}>
                           <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center font-bold text-sm`}>
                                {card.icon || '📱'}
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-[#E60023] uppercase tracking-wider">{card.badge || `SOLUTION 0${idx + 1}`}</span>
                                <h3 className="text-sm font-black text-[#161042] leading-tight">{card.title || 'Solution Title'}</h3>
                              </div>
                              <p className="text-[11px] text-[#475569] leading-snug">
                                {card.description || 'Solution details and module description.'}
                              </p>
                           </div>
                           <div className={`pt-2 border-t border-[#E2E8F0] text-[10px] font-bold ${badgeColor}`}>
                             {card.footer || '• Module Details'}
                           </div>
                        </div>
                      );
                    })}
                 </div>

                 {/* Bottom Barcode Accent */}
                 <div className="flex justify-between items-center pt-2">
                   <RedHorizontalBarcodePattern />
                   <span className="text-[10px] font-bold text-[#64748B]">
                     {quotationData.ecosystemTagline || 'CONNECTED 3-TIER ECOSYSTEM'}
                   </span>
                   <RedHorizontalBarcodePattern />
                 </div>

              </div>

              {/* Red Footer Bar */}
              <div className="h-7 bg-[#E60023] w-full shrink-0"></div>
           </div>


           {/* ================= PAGE 4: SCOPE OF WORK (SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1">
                 <div>
                   <h2 className="text-2xl font-black text-[#161042]">Scope of Work</h2>
                   <h3 className="text-lg font-bold text-[#161042] mt-0.5 border-b-2 border-[#161042] inline-block pb-0.5">Key Deliverables</h3>
                 </div>

                 {/* Deliverables Grid 2 Columns */}
                 <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
                    {(quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs']).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                         <div className="w-6 h-6 shrink-0 rounded-full bg-[#161042] text-white font-bold text-[11px] flex items-center justify-center">
                           {idx + 1}.
                         </div>
                         <span className="text-xs font-semibold text-[#161042] mt-0.5 leading-snug">
                           {item}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Red Footer Bar */}
              <div className="h-8 bg-[#E60023] w-full shrink-0"></div>
           </div>


           {/* ================= PAGE 5: TEAM & INTEGRATIONS (SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1 relative">
                 
                 <div className="absolute top-6 right-8">
                   <RedBarcodePattern />
                 </div>

                 {/* Team Distribution */}
                 <div className="space-y-3">
                    <h2 className="text-2xl font-black text-[#161042]">Team Distribution</h2>
                    
                    <div className="border border-[#161042] rounded-md overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#161042] text-white">
                          <tr>
                            <th className="py-2 px-3 font-bold">Team</th>
                            <th className="py-2 px-3 font-bold text-center">Details</th>
                            <th className="py-2 px-3 font-bold"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {(quotationData.teamList.filter(t => t.role).length > 0 ? quotationData.teamList.filter(t => t.role) : [{ role: 'Project Manager', count: '1', details: 'Requirements & Client Management' }]).map((t, idx) => (
                            <tr key={idx} className="text-[#1E293B]">
                              <td className="py-2 px-3 font-bold border-r border-[#E2E8F0]">{t.role}</td>
                              <td className="py-2 px-3 text-center font-bold border-r border-[#E2E8F0]">{t.count}</td>
                              <td className="py-2 px-3 text-[11px]">{t.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* Third-Party Integrations */}
                 <div className="space-y-3 pt-2">
                    <h3 className="text-lg font-bold text-[#161042]">Third - Party Integration Costing (Client Side)</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
                       {(quotationData.integrations.filter(Boolean).length > 0 ? quotationData.integrations.filter(Boolean) : ['Cloud Hosting', 'Domain & SSL']).map((item, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-xs font-bold text-[#161042]">
                           <span className="w-2 h-2 rounded-full bg-[#161042]"></span>
                           <span>{item}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="absolute bottom-4 right-6">
                   <RedBarcodePattern />
                 </div>
              </div>

              {/* Red Footer Bar */}
              <div className="h-8 bg-[#E60023] w-full shrink-0"></div>
           </div>


           {/* ================= PAGE 6: BUDGET & TIMELINE & BANK (SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1 relative">
                 
                 <div className="absolute top-6 right-8">
                   <RedBarcodePattern />
                 </div>

                 <h2 className="text-2xl font-black text-[#161042]">Budget & Timeline</h2>

                 {/* Cost Box */}
                 <div className="border-2 border-[#E60023] p-3 rounded-sm inline-block">
                    <span className="text-xl sm:text-2xl font-black text-[#E60023]">
                      Cost: {quotationData.totalCost || '7,80,000'}/- ( +{quotationData.gstPercent || '18'}% GST)
                    </span>
                 </div>

                 {/* Particulars Table */}
                 <div className="border border-[#161042] rounded-md overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#161042] text-white">
                        <tr>
                          <th className="py-2 px-3 font-bold border-r border-[#161042]">Particulars</th>
                          <th className="py-2 px-3 font-bold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#1E293B]">
                        {(quotationData.particulars.filter(p => p.name || p.value).length > 0 ? quotationData.particulars.filter(p => p.name || p.value) : [{ name: 'AMC', value: '30% of total Project Cost' }]).map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-bold border-r border-[#E2E8F0] bg-[#F8FAFC]">{p.name}</td>
                            <td className="py-2.5 px-3 whitespace-pre-wrap font-medium text-[11px]">{p.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 {/* Bank Details Box */}
                 <div className="border border-[#161042] rounded-md overflow-hidden max-w-md">
                    <div className="bg-[#161042] text-white py-1.5 px-3 font-bold text-xs">
                      Bank Details
                    </div>
                    <div className="p-3 text-xs space-y-1 font-medium text-[#1E293B] bg-[#F8FAFC]">
                       <div><span className="font-bold">Account No:</span> {quotationData.bankAccountNo || '07230200002691'}</div>
                       <div><span className="font-bold">Account Name:</span> {quotationData.bankAccountName || 'Codigix Infotech Private Limited'}</div>
                       <div><span className="font-bold">IFSC Code:</span> {quotationData.bankIFSC || 'BARB0CHINCH'}</div>
                       <div><span className="font-bold">Branch Name:</span> {quotationData.bankBranch || 'Bank of Baroda Pimpri'}</div>
                       <div><span className="font-bold">GST No:</span> {quotationData.bankGST || '27AANCC3632N1Z8'}</div>
                    </div>
                 </div>

                 <div className="absolute bottom-4 right-6">
                   <RedBarcodePattern />
                 </div>
              </div>

              {/* Red Footer Bar */}
              <div className="h-8 bg-[#E60023] w-full shrink-0"></div>
           </div>


           {/* ================= PAGE 7: TERMS & THANK YOU (SQUARE 1:1) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Background Office Watermark Image */}
              {quotationData.page7BgImageUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                  <img src={quotationData.page7BgImageUrl} alt="Background Watermark" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Top / Notes Section */}
              <div className="p-8 space-y-4 flex-1 relative z-10">
                 {/* Notes Box */}
                 <div className="border border-[#E60023] rounded-sm p-4 space-y-2 bg-white/95 backdrop-blur-sm shadow-sm">
                    <h3 className="text-sm font-bold text-[#E60023]">Note:</h3>
                    <ol className="space-y-1.5 text-xs text-[#1E293B] leading-tight">
                       {(quotationData.notesList.filter(Boolean).length > 0 ? quotationData.notesList.filter(Boolean) : ['All Module features are shared in-detailed in the separate document, please refer.', '18% GST will be applicable on the above cost.']).map((note, idx) => (
                         <li key={idx} className="flex gap-1.5">
                           <span className="font-bold text-[#64748B] shrink-0">{idx + 1}.</span>
                           <span>{note}</span>
                         </li>
                       ))}
                    </ol>
                 </div>
              </div>

              {/* Fixed Bottom Section (Thank You Note + Company Info + Red Banner) */}
              <div className="relative z-10 shrink-0 w-full">
                 {/* Red Barcode Patterns Row above Thank You */}
                 <div className="flex justify-between items-center px-8 pb-2">
                    <RedHorizontalBarcodePattern />
                    <RedHorizontalBarcodePattern />
                    <RedHorizontalBarcodePattern />
                    <RedHorizontalBarcodePattern />
                    <RedHorizontalBarcodePattern />
                 </div>

                 {/* Thank You Footer */}
                 <div className="px-8 pb-4 flex justify-between items-end">
                    <div>
                       <div className="text-4xl sm:text-5xl text-[#E60023] italic font-black">Thank You</div>
                    </div>
                    <div className="text-right text-[11px] text-[#1E293B] space-y-0.5 font-medium bg-white/90 p-2.5 rounded-lg border border-[#CBD5E1] shadow-sm">
                       <div className="font-bold text-sm text-[#161042]">{quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}</div>
                       <div>Contact: {quotationData.companyPhone || '91127 06604'}</div>
                       <div>Email: {quotationData.companyEmail || 'info@codigixinfotech.com'}</div>
                       <div>Website: {quotationData.companyWebsite || 'www.codigixinfotech.com'}</div>
                       <div>Address: {quotationData.companyAddress || 'Office No 514, Brahma Sky Uzuri, Pimpri, Pune.'}</div>
                    </div>
                 </div>

                 {/* Red Bottom Banner */}
                 <div className="h-8 bg-[#E60023] w-full"></div>
              </div>
           </div>


           {/* ================= PAGES 8+: DYNAMIC CUSTOM PAGES / SLIDES ================= */}
           {quotationData.customPages && quotationData.customPages.map((cp, cpIdx) => (
             <div key={cp.id || cpIdx} className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
                
                {/* Header section (Logo & Date) */}
                <div className="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-[#F1F5F9]">
                  <div>
                    <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-9 object-contain" />
                  </div>
                  <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                    <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                    <RedBarcodePattern />
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                   
                   {/* Title Section */}
                   <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161042]/5 border border-[#161042]/20 rounded-full text-[11px] font-bold text-[#161042] uppercase tracking-wider">
                        <FolderPlus className="w-3.5 h-3.5 text-[#E60023]" />
                        <span>Additional Section #{cpIdx + 1}</span>
                      </div>
                      <h2 className="text-3xl font-black text-[#161042] tracking-tight">
                        {cp.title || `Custom Section ${cpIdx + 1}`}
                      </h2>
                      {cp.subtitle && (
                        <p className="text-xs font-semibold text-[#64748B]">{cp.subtitle}</p>
                      )}
                      <div className="w-16 h-1 bg-[#E60023] rounded-full"></div>
                   </div>

                   {/* Custom Section Content & Items */}
                   <div className="space-y-4 flex-1">
                      {cp.content && (
                        <p className="text-xs text-[#334155] leading-relaxed font-normal bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] whitespace-pre-wrap">
                          {cp.content}
                        </p>
                      )}

                      {cp.items && cp.items.filter(Boolean).length > 0 && (
                        <div className="space-y-2.5 pt-2">
                           {cp.items.filter(Boolean).map((item, itemIdx) => (
                             <div key={itemIdx} className="flex items-center gap-2.5 text-xs font-semibold text-[#161042]">
                               <span className="w-6 h-6 rounded-full bg-[#161042] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                 {itemIdx + 1}.
                               </span>
                               <span>{item}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center pt-2">
                     <RedHorizontalBarcodePattern />
                     <span className="text-[10px] font-bold text-[#64748B]">CODIGIX CUSTOM SECTION SLIDE</span>
                     <RedHorizontalBarcodePattern />
                   </div>

                </div>

                {/* Red Footer Bar */}
                <div className="h-7 bg-[#E60023] w-full shrink-0"></div>
             </div>
           ))}

        </div>
      </div>
    </div>
  );
}
