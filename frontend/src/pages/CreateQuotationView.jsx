import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Plus, Trash2, Download, Printer, FileText, 
  Building, User, Calendar, Layers, DollarSign, ShieldCheck, 
  ChevronDown, ChevronUp, Users, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw, Sparkles, FolderPlus, Layout, Palette, Check, Smartphone, Laptop, Server, Plug
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toJpeg } from 'html-to-image';

// QUOTATION THEMES & TEMPLATES DEFINITION
const QUOTATION_THEMES = [
  {
    id: 'codigix_red',
    name: 'Codigix Red Signature',
    desc: 'Classic Split Grid Layout with Crimson accents & 3-column solutions',
    layoutStyle: 'split_classic',
    layoutTag: 'Split Grid Layout',
    primaryColor: '#161042',
    accentColor: '#E60023',
    accentBg: '#E60023',
    bannerBg: 'bg-[#E60023]',
    bannerText: 'text-white',
    titleColor: 'text-[#161042]',
    pillBg: 'bg-[#161042]/5 border-[#161042]/20 text-[#161042]',
    pillAccentBg: 'bg-[#E60023]/10 border-[#E60023]/30 text-[#E60023]',
    badgeBg: 'bg-[#E60023]',
    badgeText: 'text-white',
    cardBorder: 'border-[#E2E8F0]',
    cardAccentBg: 'bg-[#E60023]/10',
    cardAccentText: 'text-[#E60023]',
    tableHeaderBg: 'bg-[#161042]',
    tableHeaderText: 'text-white',
    priceBorder: 'border-[#E60023]',
    priceText: 'text-[#E60023]',
    footerBg: 'bg-[#E60023]',
    barcodeColor: '#E60023',
    swatchGradient: 'from-[#161042] via-[#E60023] to-[#161042]'
  },
  {
    id: 'modern_emerald',
    name: 'Executive Emerald',
    desc: 'Modern Asymmetric Sidebar & Stacked Solution Rows Layout',
    layoutStyle: 'modern_sidebar',
    layoutTag: 'Stacked Sidebar Layout',
    primaryColor: '#0F172A',
    accentColor: '#10B981',
    accentBg: '#10B981',
    bannerBg: 'bg-gradient-to-r from-[#0F172A] via-[#047857] to-[#10B981]',
    bannerText: 'text-white',
    titleColor: 'text-[#0F172A]',
    pillBg: 'bg-[#10B981]/10 border-[#10B981]/30 text-[#047857]',
    pillAccentBg: 'bg-[#10B981]/15 border-[#10B981]/40 text-[#047857]',
    badgeBg: 'bg-[#10B981]',
    badgeText: 'text-white',
    cardBorder: 'border-[#A7F3D0]',
    cardAccentBg: 'bg-[#10B981]/10',
    cardAccentText: 'text-[#047857]',
    tableHeaderBg: 'bg-[#047857]',
    tableHeaderText: 'text-white',
    priceBorder: 'border-[#10B981]',
    priceText: 'text-[#047857]',
    footerBg: 'bg-[#047857]',
    barcodeColor: '#10B981',
    swatchGradient: 'from-[#0F172A] via-[#047857] to-[#10B981]'
  },
  {
    id: 'corporate_gold',
    name: 'Corporate Gold & Navy',
    desc: 'Luxury Framed Executive Layout with Gold Borders & Dual-Column Split',
    layoutStyle: 'luxury_frame',
    layoutTag: 'Luxury Double-Framed Layout',
    primaryColor: '#0F172A',
    accentColor: '#D97706',
    accentBg: '#D97706',
    bannerBg: 'bg-[#0F172A]',
    bannerText: 'text-[#FBBF24]',
    titleColor: 'text-[#0F172A]',
    pillBg: 'bg-[#0F172A]/10 border-[#D97706]/30 text-[#B45309]',
    pillAccentBg: 'bg-[#D97706]/15 border-[#D97706]/40 text-[#B45309]',
    badgeBg: 'bg-[#D97706]',
    badgeText: 'text-white',
    cardBorder: 'border-[#FDE68A]',
    cardAccentBg: 'bg-[#D97706]/10',
    cardAccentText: 'text-[#B45309]',
    tableHeaderBg: 'bg-[#0F172A]',
    tableHeaderText: 'text-[#FBBF24]',
    priceBorder: 'border-[#D97706]',
    priceText: 'text-[#B45309]',
    footerBg: 'bg-[#0F172A]',
    barcodeColor: '#D97706',
    swatchGradient: 'from-[#0F172A] via-[#D97706] to-[#FBBF24]'
  },
  {
    id: 'cyber_purple',
    name: 'Cyber Creative Violet',
    desc: 'Futuristic Bento-Box Grid Matrix & Multi-Card Tiles Layout',
    layoutStyle: 'cyber_bento',
    layoutTag: 'Bento Box Grid Matrix',
    primaryColor: '#1E1B4B',
    accentColor: '#7C3AED',
    accentBg: '#7C3AED',
    bannerBg: 'bg-gradient-to-r from-[#1E1B4B] via-[#6D28D9] to-[#7C3AED]',
    bannerText: 'text-white',
    titleColor: 'text-[#1E1B4B]',
    pillBg: 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#6D28D9]',
    pillAccentBg: 'bg-[#7C3AED]/15 border-[#7C3AED]/40 text-[#6D28D9]',
    badgeBg: 'bg-[#7C3AED]',
    badgeText: 'text-white',
    cardBorder: 'border-[#DDD6FE]',
    cardAccentBg: 'bg-[#7C3AED]/10',
    cardAccentText: 'text-[#6D28D9]',
    tableHeaderBg: 'bg-[#5B21B6]',
    tableHeaderText: 'text-white',
    priceBorder: 'border-[#7C3AED]',
    priceText: 'text-[#6D28D9]',
    footerBg: 'bg-[#6D28D9]',
    barcodeColor: '#7C3AED',
    swatchGradient: 'from-[#1E1B4B] via-[#6D28D9] to-[#7C3AED]'
  },
  {
    id: 'royal_blue',
    name: 'Royal Blue Classic',
    desc: 'Traditional Corporate Report Layout with Top Hero Image Banner',
    layoutStyle: 'classic_report',
    layoutTag: 'Traditional Report Layout',
    primaryColor: '#1E3A8A',
    accentColor: '#2563EB',
    accentBg: '#2563EB',
    bannerBg: 'bg-[#1E3A8A]',
    bannerText: 'text-white',
    titleColor: 'text-[#1E3A8A]',
    pillBg: 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1D4ED8]',
    pillAccentBg: 'bg-[#2563EB]/15 border-[#2563EB]/40 text-[#1D4ED8]',
    badgeBg: 'bg-[#2563EB]',
    badgeText: 'text-white',
    cardBorder: 'border-[#BFDBFE]',
    cardAccentBg: 'bg-[#2563EB]/10',
    cardAccentText: 'text-[#1D4ED8]',
    tableHeaderBg: 'bg-[#1E3A8A]',
    tableHeaderText: 'text-white',
    priceBorder: 'border-[#2563EB]',
    priceText: 'text-[#1D4ED8]',
    footerBg: 'bg-[#1E3A8A]',
    barcodeColor: '#2563EB',
    swatchGradient: 'from-[#1E3A8A] via-[#2563EB] to-[#60A5FA]'
  }
];

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
  notesList: [''],

  customPages: []
};

// Vector SVG Number Badge for 100% mathematical pixel-perfect centering in HTML5 canvas & PDF exports
const NumberBadge = ({ num, color, size = 24 }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 inline-block align-middle">
    <circle cx={size / 2} cy={size / 2} r={(size / 2) - 0.5} fill={color} />
    <text 
      x={size / 2} 
      y={(size / 2) + 0.5} 
      fill="#ffffff" 
      fontSize={size === 24 ? "12" : "11"} 
      fontWeight="900" 
      textAnchor="middle" 
      dominantBaseline="central"
      alignmentBaseline="central"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {num}
    </text>
  </svg>
);

export default function CreateQuotationView({ onNavigate }) {
  const { user } = useAuth();
  const storageKey = user?.id ? `codigix_quotation_data_${user.id}` : 'codigix_quotation_data';

  const [mainWorkflowTab, setMainWorkflowTab] = useState('fill'); // 'fill', 'theme', 'arrange', 'download'
  const [activeSection, setActiveSection] = useState('cover'); // 'cover', 'about', 'summary', 'deliverables', 'team', 'budget', 'notes', 'images'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0); // 0 to 100%
  const [showSaveToast, setShowSaveToast] = useState(false);

  // State initialized from user-specific localStorage or Clean Empty State
  const [quotationData, setQuotationData] = useState(() => {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem('codigix_quotation_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.customPages) parsed.customPages = [];
        if (!parsed.solutionCards) parsed.solutionCards = SAMPLE_CODIGIX_DATA.solutionCards;
        if (!parsed.ecosystemTagline) parsed.ecosystemTagline = SAMPLE_CODIGIX_DATA.ecosystemTagline;
        if (!parsed.valueBadges || parsed.valueBadges.length === 0) parsed.valueBadges = SAMPLE_CODIGIX_DATA.valueBadges;
        if (!parsed.ourFocusTag) parsed.ourFocusTag = 'OUR FOCUS';
        if (!parsed.ourFocusTitle) parsed.ourFocusTitle = 'Innovating Digital Excellence';
        if (!parsed.selectedTheme) parsed.selectedTheme = 'codigix_red';
        return parsed;
      } catch (e) {
        console.error('Error reading saved quotation data:', e);
      }
    }
    return { ...EMPTY_QUOTATION_STATE, selectedTheme: 'codigix_red' };
  });

  // Re-sync quotation data when active user changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setQuotationData(JSON.parse(saved));
      } catch (e) {}
    }
  }, [user?.id, storageKey]);

  const currentThemeKey = quotationData.selectedTheme || 'codigix_red';
  const currentTheme = QUOTATION_THEMES.find(t => t.id === currentThemeKey) || QUOTATION_THEMES[0];

  const handleSelectTheme = (themeId) => {
    setQuotationData(prev => {
      const updated = { ...prev, selectedTheme: themeId };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleSaveQuotation = () => {
    localStorage.setItem(storageKey, JSON.stringify(quotationData));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleSaveAndDownload = async () => {
    localStorage.setItem(storageKey, JSON.stringify(quotationData));
    setShowSaveToast(true);
    await handleDownloadPDF();
  };

  const handleLoadSampleData = () => {
    setQuotationData({ ...SAMPLE_CODIGIX_DATA, selectedTheme: currentThemeKey });
    localStorage.setItem('codigix_quotation_data', JSON.stringify({ ...SAMPLE_CODIGIX_DATA, selectedTheme: currentThemeKey }));
  };

  const handleClearForm = () => {
    setQuotationData({ ...EMPTY_QUOTATION_STATE, selectedTheme: currentThemeKey });
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

  const moveCustomPageUp = (index) => {
    if (index === 0) return;
    setQuotationData(prev => {
      const arr = [...(prev.customPages || [])];
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
      return { ...prev, customPages: arr };
    });
  };

  const moveCustomPageDown = (index) => {
    setQuotationData(prev => {
      const arr = [...(prev.customPages || [])];
      if (index >= arr.length - 1) return prev;
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
      return { ...prev, customPages: arr };
    });
  };

  // 100% DIRECT SQUARE PDF GENERATOR (210mm x 210mm) - Renders ALL standard + custom pages with 100% EXACT Edit Mode Font & Layout!
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setPdfProgress(5);

      // Ensure browser font engine has preloaded Manrope font weights before capturing DOM
      if (document.fonts) {
        try {
          await Promise.all([
            document.fonts.load("14px 'Manrope'"),
            document.fonts.load("bold 16px 'Manrope'"),
            document.fonts.load("900 24px 'Manrope'")
          ]);
          await document.fonts.ready;
        } catch (fErr) {
          console.warn('Font loading check notice:', fErr);
        }
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
        
        let imgData = null;
        try {
          // Primary engine: html2canvas for 100% exact Google Font 'Manrope' rasterization
          const canvas = await html2canvas(pageEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              const el = clonedDoc.querySelectorAll('.proposal-page')[i];
              if (el) {
                el.style.fontFamily = "'Manrope', system-ui, -apple-system, sans-serif";
              }
              const badges = clonedDoc.querySelectorAll('.pdf-number-badge');
              badges.forEach(badge => {
                badge.style.display = 'inline-block';
                badge.style.textAlign = 'center';
                badge.style.verticalAlign = 'middle';
              });
            }
          });
          imgData = canvas.toDataURL('image/jpeg', 0.98);
        } catch (h2cErr) {
          console.warn('html2canvas render fallback:', h2cErr);
          imgData = await toJpeg(pageEl, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            cacheBust: true
          });
        }

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

  // Dynamic Theme Barcode Pattern Component
  const RedBarcodePattern = ({ color }) => (
    <div className="flex flex-col gap-[2px]">
      {[...Array(14)].map((_, i) => (
        <div key={i} className="w-5 h-[2px]" style={{ backgroundColor: color || currentTheme.barcodeColor }}></div>
      ))}
    </div>
  );

  const RedHorizontalBarcodePattern = ({ color }) => (
    <div className="flex gap-[3px]">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="w-[3px] h-4" style={{ backgroundColor: color || currentTheme.barcodeColor }}></div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[calc(100vh-100px)] w-full overflow-hidden bg-[#F1F5F9] dark:bg-[#0B1120] text-[#1E293B] dark:text-[#E2E8F0] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      
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

      {/* CLEAN INTEGRATED TOP HEADER WORKFLOW BAR */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs shrink-0 z-30">
        
        {/* Left Title & Theme Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => onNavigate && onNavigate('finance')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Back to Finance"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase">QUOTATION BUILDER</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                {currentTheme.name}
              </span>
            </div>
          </div>
        </div>

        {/* Center Compact Step Tabs (Scroll Bar Completely Removed) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-1 shrink-0">
          <button
            onClick={() => setMainWorkflowTab('fill')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainWorkflowTab === 'fill'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Fill</span>
          </button>

          <button
            onClick={() => setMainWorkflowTab('theme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainWorkflowTab === 'theme'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>2. Theme</span>
          </button>

          <button
            onClick={() => setMainWorkflowTab('arrange')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainWorkflowTab === 'arrange'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Pages ({7 + (quotationData.customPages?.length || 0)})</span>
          </button>

          <button
            onClick={() => setMainWorkflowTab('download')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              mainWorkflowTab === 'download'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>4. Export</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleSaveQuotation}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Save changes to browser storage"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Save</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: currentTheme.accentColor }}
          >
            {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>
        </div>

      </div>

      {/* MAIN WORKSPACE GRID (LEFT PANEL + RIGHT LIVE PREVIEW) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* LEFT PANEL - CONFIGURATION & INPUT FORM */}
        <div className="no-print w-full lg:w-4/12 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar shrink-0 min-h-0">

          {/* Saved Success Toast Banner */}
          {showSaveToast && (
            <div className="mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Form changes saved & live updated on PDF pages!</span>
            </div>
          )}

        {/* TAB 1: FILL QUOTATION DATA */}
        {mainWorkflowTab === 'fill' && (
          <div className="space-y-4">
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

            {/* Section Accordions */}
            <div className="p-4 space-y-3">
              {/* Section 1: Images & Custom Assets */}
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
                  </div>
                )}
              </div>

              {/* Section 1: Cover & Client Details */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button 
                  onClick={() => setActiveSection(activeSection === 'cover' ? '' : 'cover')}
                  className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> 1. Proposal Cover & Client Info
                  </span>
                  {activeSection === 'cover' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {activeSection === 'cover' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Proposal Title</label>
                      <input 
                        type="text" value={quotationData.proposalTitle} onChange={(e) => handleInputChange('proposalTitle', e.target.value)}
                        placeholder="e.g. FitRack Platform Proposal" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Proposal Subtitle / Scope</label>
                      <input 
                        type="text" value={quotationData.subtitle} onChange={(e) => handleInputChange('subtitle', e.target.value)}
                        placeholder="e.g. Web & Mobile App Development Scope" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">Proposal Date</label>
                        <input 
                          type="text" value={quotationData.date} onChange={(e) => handleInputChange('date', e.target.value)}
                          placeholder="e.g. 11 Aug 2026" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">Client Name</label>
                        <input 
                          type="text" value={quotationData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)}
                          placeholder="e.g. Mr. Santosh Manchare" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: About Us */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button 
                  onClick={() => setActiveSection(activeSection === 'about' ? '' : 'about')}
                  className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" /> 2. About Company & Pillars
                  </span>
                  {activeSection === 'about' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {activeSection === 'about' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Company Name</label>
                      <input 
                        type="text" value={quotationData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">About Us Paragraph</label>
                      <textarea 
                        rows="4" value={quotationData.aboutText} onChange={(e) => handleInputChange('aboutText', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Executive Summary */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button 
                  onClick={() => setActiveSection(activeSection === 'summary' ? '' : 'summary')}
                  className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" /> 3. Executive Summary & Solutions
                  </span>
                  {activeSection === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {activeSection === 'summary' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Executive Summary Text</label>
                      <textarea 
                        rows="4" value={quotationData.execSummary} onChange={(e) => handleInputChange('execSummary', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                      />
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Key Deliverables & Scope
                  </span>
                  {activeSection === 'deliverables' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {activeSection === 'deliverables' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    {quotationData.deliverables.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input 
                          type="text" value={item} onChange={(e) => handleDeliverableChange(index, e.target.value)}
                          placeholder={`Deliverable item ${index + 1}`} className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button onClick={() => removeDeliverable(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addDeliverable} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50">
                      + Add Deliverable
                    </button>
                  </div>
                )}
              </div>

              {/* Section 5: Team */}
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
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    {quotationData.teamList.map((member, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" value={member.role} onChange={(e) => handleTeamChange(index, 'role', e.target.value)}
                          placeholder="Role" className="col-span-5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                        <input 
                          type="text" value={member.count} onChange={(e) => handleTeamChange(index, 'count', e.target.value)}
                          placeholder="Count" className="col-span-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold"
                        />
                        <input 
                          type="text" value={member.details} onChange={(e) => handleTeamChange(index, 'details', e.target.value)}
                          placeholder="Details" className="col-span-4 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button onClick={() => removeTeamMember(index)} className="col-span-1 text-red-500 hover:text-red-700 p-1 flex justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addTeamMember} className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
                      + Add Team Member
                    </button>
                  </div>
                )}
              </div>

              {/* Section 6: Budget & Bank */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button 
                  onClick={() => setActiveSection(activeSection === 'budget' ? '' : 'budget')}
                  className="w-full p-3.5 flex items-center justify-between font-bold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> 6. Budget, Particulars & Bank
                  </span>
                  {activeSection === 'budget' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {activeSection === 'budget' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">Total Project Cost</label>
                        <input 
                          type="text" value={quotationData.totalCost} onChange={(e) => handleInputChange('totalCost', e.target.value)}
                          placeholder="e.g. 7,80,000" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">GST Percentage</label>
                        <input 
                          type="text" value={quotationData.gstPercent} onChange={(e) => handleInputChange('gstPercent', e.target.value)}
                          placeholder="e.g. 18" className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: CHOOSE THEME & COLOR PALETTE (PPT SHOWCASE) */}
        {mainWorkflowTab === 'theme' && (
          <div className="p-4 space-y-4">
             <div className="bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50">
                <h3 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>PPT Slide Themes & Layout Combinations</span>
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Choose a slide master theme. Each theme instantly transforms color combinations, card arrangements, and section layouts across your proposal pages!
                </p>
             </div>

             <div className="space-y-4">
               {QUOTATION_THEMES.map((t) => {
                 const isSelected = t.id === currentThemeKey;
                 return (
                   <div
                     key={t.id}
                     onClick={() => handleSelectTheme(t.id)}
                     className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative overflow-hidden group ${
                       isSelected 
                         ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 shadow-lg ring-2 ring-purple-500/30' 
                         : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 bg-white dark:bg-slate-900'
                     }`}
                   >
                     {/* Theme Header Bar */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                           <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${t.swatchGradient} shrink-0 shadow-sm border border-white/30`} />
                           <div>
                              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{t.name}</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                                {t.layoutTag}
                              </span>
                           </div>
                        </div>

                        {isSelected ? (
                          <span className="px-2 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" /> Active Theme
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600 transition-colors">
                            Click to Apply
                          </span>
                        )}
                     </div>

                     {/* PPT Slide Mini Thumbnail Mockup */}
                     <div className="w-full aspect-[16/9] rounded-lg bg-slate-950 p-2.5 relative border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between group-hover:border-purple-500/40 transition-colors">
                        {/* Slide Top Banner */}
                        <div className="w-full h-4 rounded px-2 flex items-center justify-between" style={{ backgroundColor: t.primaryColor }}>
                           <div className="w-12 h-1 bg-white/70 rounded-full"></div>
                           <div className="w-4 h-1 rounded-full" style={{ backgroundColor: t.accentColor }}></div>
                        </div>

                        {/* Slide Body Layout Mockup */}
                        <div className="flex-1 my-1.5 flex gap-1.5 items-stretch">
                           {t.layoutStyle === 'modern_sidebar' && (
                             <div className="w-2 rounded-sm" style={{ backgroundColor: t.accentColor }}></div>
                           )}
                           <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-1">
                                <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                <div className="w-1/2 h-1.5 bg-slate-300 dark:bg-slate-800 rounded"></div>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <div className="h-4 rounded border" style={{ borderColor: t.accentColor, backgroundColor: `${t.accentColor}20` }}></div>
                                <div className="h-4 rounded border" style={{ borderColor: t.accentColor, backgroundColor: `${t.accentColor}20` }}></div>
                                <div className="h-4 rounded border" style={{ borderColor: t.accentColor, backgroundColor: `${t.accentColor}20` }}></div>
                              </div>
                           </div>
                        </div>

                        {/* Slide Footer */}
                        <div className="w-full h-1.5 rounded-full flex items-center justify-between" style={{ backgroundColor: t.accentColor }}></div>
                     </div>

                     {/* Color Swatch Combination Palette */}
                     <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Color Palette</span>
                        <div className="flex items-center gap-1.5">
                           <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: t.primaryColor }} title="Primary Color" />
                              <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: t.accentColor }} title="Accent Color" />
                              <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: t.barcodeColor }} title="Highlight Color" />
                           </div>
                        </div>
                     </div>

                     <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{t.desc}</p>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* TAB 3: MANAGE PAGES & SECTIONS (ADD / DELETE / REORDER) */}
        {mainWorkflowTab === 'arrange' && (
          <div className="p-4 space-y-4">
             <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Proposal Page & Section Manager</span>
                </h3>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                  Add new custom section pages, reorder slide pages, or delete unwanted sections from your proposal PDF!
                </p>
             </div>

             {/* Standard Pages List */}
             <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Standard Proposal Pages</span>
                <div className="space-y-1.5">
                   {[
                     { num: 1, title: 'Cover Page' },
                     { num: 2, title: 'About Company & Pillars' },
                     { num: 3, title: 'Executive Summary & Solutions' },
                     { num: 4, title: 'Scope of Work & Deliverables' },
                     { num: 5, title: 'Team Distribution & Integrations' },
                     { num: 6, title: 'Budget, Particulars & Bank' },
                     { num: 7, title: 'Terms, Notes & Thank You' }
                   ].map((p) => (
                     <div key={p.num} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">{p.num}</span>
                          <span>{p.title}</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Required</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Custom Pages List */}
             <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                   <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Custom Section Pages ({quotationData.customPages?.length || 0})</span>
                   <button 
                     onClick={addCustomPage}
                     className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                   >
                     <Plus className="w-3.5 h-3.5" /> <span>Add Page</span>
                   </button>
                </div>

                {quotationData.customPages && quotationData.customPages.map((cp, cpIdx) => (
                  <div key={cp.id || cpIdx} className="p-3.5 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Custom Page #{cpIdx + 8}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveCustomPageUp(cpIdx)} disabled={cpIdx === 0} className="p-1 hover:bg-indigo-100 rounded text-slate-600 disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveCustomPageDown(cpIdx)} disabled={cpIdx >= quotationData.customPages.length - 1} className="p-1 hover:bg-indigo-100 rounded text-slate-600 disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeCustomPage(cpIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded flex items-center gap-1 text-xs font-bold ml-1">
                          <Trash2 className="w-3.5 h-3.5" /> Delete Page
                        </button>
                      </div>
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
                        type="text" value={cp.subtitle} onChange={(e) => handleCustomPageChange(cpIdx, 'subtitle', e.target.value)} placeholder="e.g. Proven Track Record"
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Content Paragraph</label>
                      <textarea 
                        rows="2" value={cp.content} onChange={(e) => handleCustomPageChange(cpIdx, 'content', e.target.value)} placeholder="Custom section details..."
                        className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB 4: EXPORT & DOWNLOAD PDF */}
        {mainWorkflowTab === 'download' && (
          <div className="p-4 space-y-4">
             <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Export Proposal PDF</span>
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Ready to download! Generates a high-precision square PDF rendered in the exact selected theme.
                </p>
             </div>

             {/* Proposal Summary Card */}
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                   <span className="text-slate-500">Proposal Title:</span>
                   <span className="font-bold text-slate-800 dark:text-slate-200">{quotationData.proposalTitle || 'Project Proposal'}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Client Name:</span>
                   <span className="font-bold text-slate-800 dark:text-slate-200">{quotationData.clientName || 'Client Name'}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Total Investment:</span>
                   <span className="font-bold text-emerald-600">₹{quotationData.totalCost || '7,80,000'}/-</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Active Theme:</span>
                   <span className="font-bold text-purple-600">{currentTheme.name} ({currentTheme.layoutTag})</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-500">Total PDF Pages:</span>
                   <span className="font-bold text-slate-800 dark:text-slate-200">{7 + (quotationData.customPages?.length || 0)} Square Pages</span>
                </div>
             </div>

             <div className="space-y-2 pt-2">
                <button
                  onClick={handleSaveQuotation}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Save Proposal to Storage</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="w-full py-3 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ backgroundColor: currentTheme.accentColor }}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Square PDF ({pdfProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download {currentTheme.name} PDF</span>
                    </>
                  )}
                </button>
             </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - LIVE PREVIEW & PRINTABLE DOCUMENT */}
      <div className="w-full lg:w-8/12 flex flex-col h-full bg-slate-200 dark:bg-[#080d1a] relative min-h-0 overflow-hidden">
        
        {/* Toolbar (Hidden when printing) */}
        <div className="no-print sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
           <div className="flex items-center gap-2">
             <FileText className="w-4 h-4 text-red-600" />
             <span className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-wider">LIVE PROPOSAL CANVAS PREVIEW ({7 + (quotationData.customPages?.length || 0)} PAGES)</span>
           </div>
        </div>

        {/* Multi-Page Document Container */}
        <div className="print-area flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-8 flex flex-col items-center min-h-0">
           
           {/* ================= PAGE 1: COVER PAGE (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {currentTheme.layoutStyle === 'modern_sidebar' && (
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-b from-[#0F172A] via-[#047857] to-[#10B981] z-10"></div>
              )}

              {currentTheme.layoutStyle === 'luxury_frame' ? (
                <div className="m-4 p-6 border-4 border-double border-[#D97706]/40 flex-1 flex flex-col justify-between relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-10 object-contain" />
                    </div>
                    <div className="text-right text-xs text-[#B45309] font-bold flex items-center gap-2 bg-[#FDF8F0] px-3 py-1.5 rounded border border-[#D97706]/30">
                      🏆 <span>EXECUTIVE PROPOSAL</span>
                    </div>
                  </div>

                  <div className="text-center space-y-4 py-8">
                     <div className="text-xs uppercase tracking-widest font-black text-[#D97706]">CONFIDENTIAL FINANCIAL PROPOSAL</div>
                     <h1 className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
                       {quotationData.proposalTitle || 'Project Proposal'}
                     </h1>
                     <div className="w-24 h-0.5 bg-[#D97706] mx-auto"></div>
                     <p className="text-xl font-bold text-[#B45309]">
                       {quotationData.subtitle || 'Web & Mobile App Development'}
                     </p>
                  </div>

                  <div className="bg-[#0F172A] text-white p-5 rounded-lg border-t-2 border-[#D97706] grid grid-cols-2 text-center">
                     <div>
                       <div className="text-[10px] uppercase font-bold text-[#FBBF24]">PREPARED FOR</div>
                       <div className="text-base font-black mt-0.5">{quotationData.clientName || 'Client Name'}</div>
                     </div>
                     <div>
                       <div className="text-[10px] uppercase font-bold text-[#FBBF24]">PREPARED BY</div>
                       <div className="text-base font-black mt-0.5">{quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}</div>
                     </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`p-8 flex justify-between items-start shrink-0 ${currentTheme.layoutStyle === 'modern_sidebar' ? 'pl-12' : ''}`}>
                    <div>
                      <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-10 object-contain" />
                    </div>
                    <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                      <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                      <RedBarcodePattern color={currentTheme.barcodeColor} />
                    </div>
                  </div>

                  <div className={`px-10 py-8 text-center space-y-3 flex-1 flex flex-col justify-center items-center ${currentTheme.layoutStyle === 'modern_sidebar' ? 'items-start text-left pl-14' : ''}`}>
                     {currentTheme.layoutStyle === 'cyber_bento' ? (
                       <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 p-8 rounded-2xl w-full text-center space-y-3 backdrop-blur-sm shadow-sm">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#7C3AED] text-white">PROJECT ARCHITECTURE PROPOSAL</span>
                          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: currentTheme.primaryColor }}>
                            {quotationData.proposalTitle || 'Project Proposal'}
                          </h1>
                          <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentTheme.primaryColor }}>
                            {quotationData.subtitle || 'Web & Mobile App Development'}
                          </p>
                       </div>
                     ) : (
                       <>
                         <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: currentTheme.primaryColor }}>
                           {quotationData.proposalTitle || 'Project Proposal'}
                         </h1>
                         <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentTheme.primaryColor }}>
                           {quotationData.subtitle || 'Web & Mobile App Development'}
                         </p>
                       </>
                     )}
                  </div>

                  <div className="shrink-0 w-full">
                    <div className={`px-8 py-3 flex justify-between text-xs text-[#475569] font-medium border-t border-[#F1F5F9] ${currentTheme.layoutStyle === 'modern_sidebar' ? 'pl-12' : ''}`}>
                      <span>{quotationData.companyEmail || 'info@codigixinfotech.com'}</span>
                      <span>{quotationData.companyWebsite || 'www.codigixinfotech.com'}</span>
                    </div>

                    <div className={`${currentTheme.bannerBg} ${currentTheme.bannerText} p-6 grid grid-cols-2 text-center items-center w-full shadow-inner`}>
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
                </>
              )}
           </div>


           {/* ================= PAGE 2: ABOUT US (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Header section (Logo & Date) */}
              <div className="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-[#F1F5F9]">
                <div>
                  <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-9 object-contain" />
                </div>
                <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                  <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                  <RedBarcodePattern color={currentTheme.barcodeColor} />
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                 
                 {/* Title & Headline */}
                 <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${currentTheme.pillBg}`}>
                      <Building className="w-3.5 h-3.5" style={{ color: currentTheme.accentColor }} />
                      <span>About The Company</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: currentTheme.primaryColor }}>
                      {quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}
                    </h2>
                    <div className="w-16 h-1 rounded-full" style={{ backgroundColor: currentTheme.accentColor }}></div>
                 </div>

                 {/* LAYOUT ADAPTIVE ARRANGEMENT FOR PAGE 2 */}
                 {currentTheme.layoutStyle === 'modern_sidebar' ? (
                   /* EXECUTIVE EMERALD: Top Stat Ribbon + Reversed Image/Text Row */
                   <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl text-center text-white font-bold text-xs" style={{ backgroundColor: currentTheme.primaryColor }}>
                           <div className="text-xl font-black">{quotationData.statYear || '2021'}</div>
                           <div className="text-[9px] uppercase tracking-wider opacity-80">Established</div>
                        </div>
                        <div className="p-3 rounded-xl text-center text-white font-bold text-xs" style={{ backgroundColor: currentTheme.accentColor }}>
                           <div className="text-xl font-black">{quotationData.statTeam || '15'}+</div>
                           <div className="text-[9px] uppercase tracking-wider opacity-90">Experts</div>
                        </div>
                        <div className="p-3 rounded-xl text-center text-white font-bold text-xs bg-[#0F172A]">
                           <div className="text-xl font-black">{quotationData.statClients || '44'}+</div>
                           <div className="text-[9px] uppercase tracking-wider opacity-80">Clients</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-5 items-center flex-1">
                         <div className="col-span-5 h-[210px] rounded-2xl overflow-hidden shadow-md border relative">
                            <img src={quotationData.page2ImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'} alt="Team" className="w-full h-full object-cover" />
                         </div>
                         <div className="col-span-7 space-y-3">
                            <p className="text-xs text-[#334155] leading-relaxed p-3.5 bg-[#F8FAFC] rounded-xl border">
                              {quotationData.aboutText || 'Codigix Infotech is a technology-driven company specializing in AI-based Automation, ERP/CRM Systems, and Enterprise Applications.'}
                            </p>
                            <div className="space-y-1.5">
                              {(quotationData.valueBadges?.filter(Boolean) || []).slice(0, 3).map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-[#047857]">
                                  <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px]">✓</span>
                                  <span>{badge}</span>
                                </div>
                              ))}
                            </div>
                         </div>
                      </div>
                   </div>
                 ) : currentTheme.layoutStyle === 'cyber_bento' ? (
                   /* CYBER VIOLET: Bento-Box Tile Matrix */
                   <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-3 gap-3">
                         <div className="p-3 rounded-xl text-center bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[#6D28D9]">
                            <div className="text-xl font-black">{quotationData.statYear || '2021'}</div>
                            <div className="text-[9px] font-bold uppercase">Year Founded</div>
                         </div>
                         <div className="p-3 rounded-xl text-center bg-[#7C3AED] text-white">
                            <div className="text-xl font-black">{quotationData.statTeam || '15'}+</div>
                            <div className="text-[9px] font-bold uppercase">Tech Engineers</div>
                         </div>
                         <div className="p-3 rounded-xl text-center bg-[#1E1B4B] text-white">
                            <div className="text-xl font-black">{quotationData.statClients || '44'}+</div>
                            <div className="text-[9px] font-bold uppercase">Global Projects</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 flex-1">
                         <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#DDD6FE] flex flex-col justify-between">
                            <p className="text-xs text-[#334155] leading-relaxed">
                              {quotationData.aboutText || 'Codigix Infotech delivers high-performance enterprise architecture and AI automation.'}
                            </p>
                            <div className="space-y-1.5 pt-2">
                               {(quotationData.valueBadges?.filter(Boolean) || []).slice(0, 2).map((badge, idx) => (
                                 <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-[#6D28D9]">
                                   <span className="w-3.5 h-3.5 rounded bg-[#7C3AED] text-white flex items-center justify-center text-[9px]">✓</span>
                                   <span>{badge}</span>
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="rounded-2xl overflow-hidden shadow border relative bg-slate-900">
                            <img src={quotationData.page2ImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'} alt="Team" className="w-full h-full object-cover opacity-85" />
                            <div className="absolute inset-x-2 bottom-2 bg-[#1E1B4B]/90 backdrop-blur-md p-2 rounded-xl text-center text-white text-[10px] font-bold">
                               <span className="text-[#7C3AED] uppercase block text-[9px]">{quotationData.ourFocusTag || 'OUR FOCUS'}</span>
                               {quotationData.ourFocusTitle || 'Innovating Digital Excellence'}
                            </div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   /* CLASSIC SPLIT & LUXURY FRAMED LAYOUTS */
                   <>
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
                        <div className="md:col-span-7 space-y-4">
                           <p className="text-xs text-[#334155] leading-relaxed font-normal bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                             {quotationData.aboutText || 'Codigix Infotech is a technology-driven company specializing in advanced IT solutions such as AI-based Automation, Custom ERP and CRM Systems, Mobile Applications, and Scalable Website Development.'}
                           </p>

                           <div className="space-y-2 pt-1">
                              {(quotationData.valueBadges?.filter(Boolean).length > 0 
                                ? quotationData.valueBadges.filter(Boolean) 
                                : ['High-Performance Enterprise Architecture', 'Bank-grade Data Security & Scalable Cloud Services', 'Business-Driven Digital Transformation']
                              ).map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs font-semibold" style={{ color: currentTheme.primaryColor }}>
                                  <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: idx % 2 === 1 ? currentTheme.accentColor : currentTheme.primaryColor }}>✓</span>
                                  <span>{badge}</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="md:col-span-5 h-full flex flex-col justify-center">
                           <div className="w-full h-[240px] rounded-2xl overflow-hidden shadow-lg border border-[#CBD5E1] relative bg-[#F8FAFC]">
                              <img 
                                src={quotationData.page2ImageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'} 
                                alt="Codigix Team Working" 
                                className="w-full h-full object-cover object-center"
                              />
                              <div className="absolute bottom-3 left-3 right-3 bg-[#0F172A]/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/20 text-center">
                                 <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: currentTheme.accentColor }}>{quotationData.ourFocusTag || 'OUR FOCUS'}</div>
                                 <div className="text-xs font-bold mt-0.5">{quotationData.ourFocusTitle || 'Innovating Digital Excellence'}</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border" style={{ backgroundColor: currentTheme.primaryColor, borderColor: currentTheme.primaryColor }}>
                          <div className="text-2xl font-black text-white">{quotationData.statYear || '2021'}</div>
                          <div className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-wider">Established</div>
                        </div>
                        <div className="text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border" style={{ backgroundColor: currentTheme.accentColor, borderColor: currentTheme.accentColor }}>
                          <div className="text-2xl font-black text-white">{quotationData.statTeam || '15'}+</div>
                          <div className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">In-House Experts</div>
                        </div>
                        <div className="bg-[#0F172A] text-white p-4 rounded-xl text-center shadow-md space-y-0.5 border border-[#0F172A]">
                          <div className="text-2xl font-black text-white">{quotationData.statClients || '44'}+</div>
                          <div className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-wider">Delighted Clients</div>
                        </div>
                     </div>
                   </>
                 )}

              </div>

              {/* Theme Footer Bar */}
              <div className="h-7 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
           </div>


           {/* ================= PAGE 3: EXECUTIVE SUMMARY (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              
              {/* Header section (Logo & Date) */}
              <div className="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-[#F1F5F9]">
                <div>
                  <img src={quotationData.logoUrl || '/codigix-logo.svg'} alt="Codigix Logo" className="h-9 object-contain" />
                </div>
                <div className="text-right text-xs text-[#475569] font-medium flex items-center gap-4">
                  <span>Date: <span className="font-bold text-[#0F172A]">{quotationData.date || '11 Aug 2026'}</span></span>
                  <RedBarcodePattern color={currentTheme.barcodeColor} />
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                 
                 {/* Title Section */}
                 <div className="space-y-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${currentTheme.pillAccentBg}`}>
                      <Layers className="w-3.5 h-3.5" style={{ color: currentTheme.accentColor }} />
                      <span>Project Overview</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight" style={{ color: currentTheme.primaryColor }}>
                      Executive Summary
                    </h2>
                    <p className="text-xs font-semibold text-[#64748B]">
                      {quotationData.subtitle ? `${quotationData.subtitle} Scope` : 'Scalable Enterprise App Platform'}
                    </p>
                 </div>

                 {/* Platform Overview Intro Card */}
                 <div className="bg-[#F8FAFC] p-4 rounded-r-xl space-y-1.5 shadow-sm" style={{ borderLeft: `4px solid ${currentTheme.primaryColor}` }}>
                    <p className="text-xs text-[#334155] leading-relaxed font-normal whitespace-pre-wrap">
                      {quotationData.execSummary || 'FitRack is engineered as a unified, multi-tenant digital ecosystem connecting Fitness Coaches, Dietitians, Clients, and Platform Administrators under one seamless architecture.'}
                    </p>
                 </div>

                 {/* LAYOUT ADAPTIVE SOLUTION CARDS FOR PAGE 3 */}
                 {currentTheme.layoutStyle === 'modern_sidebar' ? (
                   /* EXECUTIVE EMERALD: Stacked Horizontal Solution Rows */
                   <div className="space-y-3 flex-1 flex flex-col justify-center">
                      {(quotationData.solutionCards && quotationData.solutionCards.length > 0 
                        ? quotationData.solutionCards 
                        : [
                            { badge: 'SOLUTION 01', title: 'Trainer Mobile App', description: 'Client onboarding, assessments, personalized diet & workout plans.', footer: '• Android & iOS Apps', icon: '📱' },
                            { badge: 'SOLUTION 02', title: 'Client Mobile App', description: 'Customized daily tasks, workout & water logs, appointment booking.', footer: '• Android & iOS Apps', icon: '📱' },
                            { badge: 'SOLUTION 03', title: 'Super Admin Panel', description: 'Central platform control, multi-tenant subscription tiers & analytics.', footer: '• Web Dashboard', icon: '💻' }
                          ]
                      ).map((card, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-[#A7F3D0] rounded-xl flex items-center justify-between gap-4 shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#047857] text-white flex items-center justify-center text-lg font-bold shrink-0">
                                {card.icon || '📱'}
                              </div>
                              <div>
                                 <span className="text-[9px] font-black text-[#047857] uppercase tracking-wider">{card.badge || `SOLUTION 0${idx + 1}`}</span>
                                 <h3 className="text-xs font-black text-[#0F172A]">{card.title || 'Solution Title'}</h3>
                                 <p className="text-[10px] text-[#475569] leading-snug">{card.description}</p>
                              </div>
                           </div>
                           <span className="px-2.5 py-1 rounded bg-[#10B981]/15 text-[#047857] text-[10px] font-bold shrink-0">{card.footer}</span>
                        </div>
                      ))}
                   </div>
                 ) : currentTheme.layoutStyle === 'cyber_bento' ? (
                   /* CYBER VIOLET: Bento Grid (1 Feature Card + 2 Stacked Cards) */
                   <div className="grid grid-cols-12 gap-3 flex-1">
                      <div className="col-span-5 bg-[#1E1B4B] text-white p-4 rounded-2xl flex flex-col justify-between shadow border border-[#7C3AED]/30">
                         <div className="space-y-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#7C3AED] uppercase">FEATURE SOLUTION</span>
                            <h3 className="text-base font-black text-white">{quotationData.solutionCards?.[0]?.title || 'Trainer App'}</h3>
                            <p className="text-[11px] text-[#DDD6FE] leading-relaxed">{quotationData.solutionCards?.[0]?.description || 'Complete onboarding, assessments & workouts.'}</p>
                         </div>
                         <div className="text-[10px] font-bold text-[#7C3AED]">{quotationData.solutionCards?.[0]?.footer || '• Core Platform'}</div>
                      </div>

                      <div className="col-span-7 space-y-3 flex flex-col justify-between">
                         {(quotationData.solutionCards || []).slice(1, 3).map((card, idx) => (
                           <div key={idx} className="p-3.5 bg-white border-2 border-[#DDD6FE] rounded-xl flex-1 flex flex-col justify-between shadow-sm">
                              <div>
                                 <span className="text-[9px] font-black text-[#7C3AED] uppercase">{card.badge || `SOLUTION 0${idx + 2}`}</span>
                                 <h4 className="text-xs font-black text-[#1E1B4B]">{card.title}</h4>
                                 <p className="text-[10px] text-slate-600">{card.description}</p>
                              </div>
                              <span className="text-[9px] font-bold text-[#6D28D9] pt-1">{card.footer}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    /* EXECUTIVE STACKED HORIZONTAL SOLUTION CARDS */
                    <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                       {(quotationData.solutionCards && quotationData.solutionCards.length > 0 
                         ? quotationData.solutionCards 
                         : [
                             { badge: 'SOLUTION 01', title: 'Trainer Mobile App', description: 'Client onboarding, assessments, personalized diet & workout plans.', footer: '• Android & iOS Apps', icon: '📱' },
                             { badge: 'SOLUTION 02', title: 'Client Mobile App', description: 'Customized daily tasks, workout & water logs, appointment booking.', footer: '• Android & iOS Apps', icon: '📱' },
                             { badge: 'SOLUTION 03', title: 'Super Admin Panel', description: 'Central platform control, multi-tenant subscription tiers & analytics.', footer: '• Web Dashboard', icon: '💻' }
                           ]
                       ).map((card, idx) => (
                         <div key={idx} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4 shadow-xs transition-all hover:border-slate-300">
                            <div className="flex items-center gap-3.5">
                               <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs leading-none" style={{ backgroundColor: idx === 1 ? currentTheme.accentColor : currentTheme.primaryColor }}>
                                 {idx === 0 ? <Smartphone className="w-5 h-5 text-white" /> : idx === 1 ? <Smartphone className="w-5 h-5 text-white" /> : <Laptop className="w-5 h-5 text-white" />}
                               </div>
                               <div className="space-y-0.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: currentTheme.accentColor }}>{card.badge || `SOLUTION 0${idx + 1}`}</span>
                                  <h3 className="text-sm font-black text-[#0F172A] leading-tight">{card.title || 'Solution Title'}</h3>
                                  <p className="text-xs text-[#475569] leading-snug font-medium">{card.description || 'Solution details and module description.'}</p>
                               </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold shrink-0 border" style={{ color: currentTheme.primaryColor, backgroundColor: `${currentTheme.primaryColor}10`, borderColor: `${currentTheme.primaryColor}30` }}>
                              {card.footer || '• Module Details'}
                            </span>
                         </div>
                       ))}
                    </div>
                  )}

                 {/* Bottom Barcode Accent */}
                 <div className="flex justify-between items-center pt-2">
                   <RedHorizontalBarcodePattern color={currentTheme.barcodeColor} />
                   <span className="text-[10px] font-bold text-[#64748B]">
                     {quotationData.ecosystemTagline || 'CONNECTED 3-TIER ECOSYSTEM'}
                   </span>
                   <RedHorizontalBarcodePattern color={currentTheme.barcodeColor} />
                 </div>

              </div>

              {/* Theme Footer Bar */}
              <div className="h-7 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
           </div>


           {/* ================= PAGE 4: SCOPE OF WORK (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1">
                 <div>
                   <h2 className="text-2xl font-black" style={{ color: currentTheme.primaryColor }}>Scope of Work</h2>
                   <h3 className="text-lg font-bold mt-0.5 inline-block pb-0.5" style={{ color: currentTheme.primaryColor, borderBottom: `2px solid ${currentTheme.primaryColor}` }}>Key Deliverables</h3>
                 </div>

                 {/* LAYOUT ADAPTIVE DELIVERABLES GRID FOR PAGE 4 */}
                 {currentTheme.layoutStyle === 'cyber_bento' ? (
                   /* BENTO TILE BOXES FOR DELIVERABLES */
                   <div className="grid grid-cols-2 gap-4 pt-2">
                      {(quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs']).map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-[#DDD6FE] flex items-center gap-3.5 shadow-xs">
                           <NumberBadge num={idx + 1} color="#7C3AED" size={24} />
                           <span className="text-xs font-bold text-[#1E1B4B]">{item}</span>
                        </div>
                      ))}
                   </div>
                 ) : (
                    /* COMPACT 2-COLUMN DELIVERABLES LIST */
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                       {(quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs']).map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <NumberBadge num={idx + 1} color={currentTheme.primaryColor} size={24} />
                            <span className="text-xs font-bold text-[#0F172A] leading-snug">
                              {item}
                            </span>
                         </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Theme Footer Bar */}
              <div className="h-8 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
           </div>


           {/* ================= PAGE 5: TEAM & INTEGRATIONS (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1 relative">
                 
                 {/* Header Title Row */}
                 <div className="flex justify-between items-center pb-1">
                    <h2 className="text-2xl font-black" style={{ color: currentTheme.primaryColor }}>Team Distribution</h2>
                    <RedBarcodePattern color={currentTheme.barcodeColor} />
                 </div>

                 {/* Team Distribution Table */}
                 <div className="space-y-3">
                    <div className="border rounded-xl overflow-hidden shadow-xs border-[#E2E8F0]">
                      <table className="w-full text-xs text-left">
                        <thead className="text-white" style={{ backgroundColor: currentTheme.primaryColor }}>
                          <tr>
                            <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[11px] w-4/12 border-r border-white/20">Role / Team</th>
                            <th className="py-3 px-3 font-extrabold uppercase tracking-wider text-[11px] text-center w-2/12 border-r border-white/20">Count</th>
                            <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[11px] w-6/12">Key Responsibilities</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] bg-white">
                          {(quotationData.teamList.filter(t => t.role).length > 0 
                            ? quotationData.teamList.filter(t => t.role) 
                            : [
                                { role: 'Project Manager', count: '1', details: 'Requirements & Client Management' },
                                { role: 'UI/UX Designer', count: '1', details: 'Figma Prototypes & Design System' },
                                { role: 'Full Stack Developers', count: '2', details: 'Frontend & Backend Architecture' },
                                { role: 'QA Automation Engineer', count: '1', details: 'Testing & Quality Assurance' }
                              ]
                          ).map((t, idx) => (
                            <tr key={idx} className="text-[#1E293B] hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-black border-r border-[#E2E8F0] text-xs" style={{ color: currentTheme.primaryColor }}>{t.role}</td>
                              <td className="py-3 px-3 text-center font-black border-r border-[#E2E8F0] text-xs">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 font-extrabold text-[#0F172A]">{t.count}</span>
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-[#475569]">{t.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>

                 {/* Third-Party Integrations */}
                 <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black tracking-tight" style={{ color: currentTheme.primaryColor }}>Third-Party Integration Costing (Client Side)</h3>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">Prerequisites</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
                       {(quotationData.integrations.filter(Boolean).length > 0 
                         ? quotationData.integrations.filter(Boolean) 
                         : [
                             'Google Play Developer Account',
                             'Apple Developer Program',
                             'Cloud Hosting (AWS/Azure/GCP)',
                             'Domain & SSL Certificate',
                             'SMS / OTP Gateway',
                             'Payment Gateway Account',
                             'WhatsApp Business API'
                           ]
                       ).map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs leading-none" style={{ backgroundColor: currentTheme.primaryColor }}>
                               <Check className="w-3 h-3 text-white stroke-[3]" />
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] leading-snug">{item}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="absolute bottom-4 right-6">
                   <RedBarcodePattern color={currentTheme.barcodeColor} />
                 </div>
              </div>

              {/* Theme Footer Bar */}
              <div className="h-8 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
           </div>


           {/* ================= PAGE 6: BUDGET & TIMELINE (LAYOUT ADAPTIVE) ================= */}
           <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
              <div className="p-8 space-y-6 flex-1 relative">
                 
                 <div className="absolute top-6 right-8">
                   <RedBarcodePattern color={currentTheme.barcodeColor} />
                 </div>

                 <h2 className="text-2xl font-black" style={{ color: currentTheme.primaryColor }}>Budget & Timeline</h2>

                 {/* HERO FULL-WIDTH INVESTMENT BANNER */}
                 <div className="p-4 rounded-xl shadow-xs flex items-center justify-between text-white" style={{ backgroundColor: currentTheme.primaryColor }}>
                    <div>
                       <div className="text-[10px] uppercase font-extrabold tracking-widest opacity-80">TOTAL PROJECT INVESTMENT</div>
                       <div className="text-2xl sm:text-3xl font-black">Cost: ₹{quotationData.totalCost || '7,80,000'}/-</div>
                    </div>
                    <div className="text-right text-xs font-black bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shrink-0">
                       +{quotationData.gstPercent || '18'}% Applicable GST
                    </div>
                 </div>

                 {/* Particulars Table */}
                 <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left">
                      <thead className="text-white" style={{ backgroundColor: currentTheme.primaryColor }}>
                        <tr>
                          <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider text-[11px] w-4/12 border-r border-white/20">Particulars</th>
                          <th className="py-2.5 px-4 font-extrabold uppercase tracking-wider text-[11px] w-8/12">Details / Terms</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] bg-white text-[#1E293B]">
                        {(quotationData.particulars.filter(p => p.name || p.value).length > 0 
                          ? quotationData.particulars.filter(p => p.name || p.value) 
                          : [
                              { name: 'AMC', value: '30% of total Project Cost' },
                              { name: 'Support', value: '60 Days (Post-handover)' },
                              { name: 'Extra Customizations', value: 'Chargeable as per requirement' },
                              { name: 'Implementation Time', value: '90 working days (Mon-Fri)' },
                              { name: 'Payment Terms', value: '1. 50% Advance\n2. 40% Once complete System Deployed on your domain\n3. 10% After System deployed' }
                            ]
                        ).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-black border-r border-[#E2E8F0] bg-[#F8FAFC] text-xs" style={{ color: currentTheme.primaryColor }}>{p.name}</td>
                            <td className="py-2.5 px-4 whitespace-pre-wrap font-semibold text-xs text-[#334155] leading-snug">{p.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>

                 {/* Full-Width Bank Details Card */}
                 <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs bg-[#F8FAFC]">
                    <div className="text-white py-2 px-4 font-black text-xs uppercase tracking-wider flex items-center justify-between" style={{ backgroundColor: currentTheme.primaryColor }}>
                      <span>🏦 Bank Wire Transfer & Account Details</span>
                      <span className="text-[10px] opacity-80 font-bold">Official Payment Channel</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-semibold text-[#1E293B]">
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-[#64748B] w-28 shrink-0">Account Name:</span>
                         <span className="font-extrabold text-[#0F172A]">{quotationData.bankAccountName || 'Codigix Infotech Private Limited'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-[#64748B] w-28 shrink-0">Account No:</span>
                         <span className="font-extrabold text-[#0F172A] font-mono">{quotationData.bankAccountNo || '07230200002691'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-[#64748B] w-28 shrink-0">IFSC Code:</span>
                         <span className="font-extrabold text-[#0F172A] font-mono">{quotationData.bankIFSC || 'BARB0CHINCH'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-[#64748B] w-28 shrink-0">Branch Name:</span>
                         <span className="font-bold text-[#334155]">{quotationData.bankBranch || 'Bank of Baroda Pimpri'}</span>
                       </div>
                       <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-[#E2E8F0]">
                         <span className="font-bold text-[#64748B] w-28 shrink-0">GST Registration:</span>
                         <span className="font-mono font-extrabold text-[#2563EB]">{quotationData.bankGST || '27AANCC3632N1Z8'}</span>
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-4 right-6">
                   <RedBarcodePattern color={currentTheme.barcodeColor} />
                 </div>
              </div>

              {/* Theme Footer Bar */}
              <div className="h-8 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
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
                 {/* Section Title Header */}
                 <div className="space-y-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${currentTheme.pillAccentBg}`}>
                      <FileText className="w-3.5 h-3.5" style={{ color: currentTheme.accentColor }} />
                      <span>Commercial Guidelines</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight" style={{ color: currentTheme.primaryColor }}>
                      Terms & Conditions
                    </h2>
                 </div>

                 {/* Notes & Terms Section */}
                 <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: currentTheme.accentColor }}>
                      <span>📌 Important Notes & Guidelines</span>
                    </h3>
                    <div className="space-y-3 pt-1">
                       {(quotationData.notesList.filter(Boolean).length > 0 
                         ? quotationData.notesList.filter(Boolean) 
                         : [
                             'All Module features are shared in-detailed in the separate document, please refer.',
                             '18% GST will be applicable on the above cost.'
                           ]
                       ).map((note, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                           <NumberBadge num={idx + 1} color={currentTheme.accentColor} size={22} />
                           <span className="text-xs font-bold text-[#1E293B] leading-snug">{note}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Fixed Bottom Section (Thank You Note + Company Info + Theme Banner) */}
              <div className="relative z-10 shrink-0 w-full">
                 {/* Sleek Accent Line Separator */}
                 <div className="px-8 pb-4">
                    <div className="h-1 w-full rounded-full" style={{ backgroundColor: currentTheme.accentColor }}></div>
                 </div>

                 {/* Thank You & Corporate Contact Card Container */}
                 <div className="px-8 pb-6 flex items-center justify-between gap-6">
                    
                    {/* Left: Thank You Hero Title & Subtitle */}
                    <div className="flex-1 flex flex-col justify-center space-y-1.5">
                       <div className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: currentTheme.accentColor }}>
                         Thank You!
                       </div>
                       <p className="text-xs font-semibold text-[#475569]">
                         We appreciate the opportunity to present this proposal and look forward to collaborating with you.
                       </p>
                       <div className="w-16 h-1 rounded-full mt-2" style={{ backgroundColor: currentTheme.primaryColor }}></div>
                    </div>

                    {/* Right: Corporate Contact Details Card */}
                    <div className="w-7/12 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs space-y-2 shrink-0">
                       <div className="font-extrabold text-sm border-b border-[#E2E8F0] pb-1.5" style={{ color: currentTheme.primaryColor }}>
                         {quotationData.companyName || 'Codigix Infotech Pvt. Ltd.'}
                       </div>
                       <div className="grid grid-cols-1 gap-1 text-xs text-[#334155] font-semibold">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-[#64748B] w-16">Contact:</span>
                             <span>{quotationData.companyPhone || '91127 06604'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-[#64748B] w-16">Email:</span>
                             <span className="text-[#2563EB]">{quotationData.companyEmail || 'info@codigixinfotech.com'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-[#64748B] w-16">Website:</span>
                             <span>{quotationData.companyWebsite || 'www.codigixinfotech.com'}</span>
                          </div>
                          <div className="flex items-start gap-2 pt-0.5">
                             <span className="font-bold text-[#64748B] w-16 shrink-0">Address:</span>
                             <span className="text-[11px] leading-tight">{quotationData.companyAddress || 'Office No 514, Brahma Sky Uzuri, Pimpri, Pune.'}</span>
                          </div>
                       </div>
                    </div>

                 </div>

                 {/* Theme Bottom Banner */}
                 <div className="h-8 w-full" style={{ backgroundColor: currentTheme.accentColor }}></div>
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
                    <RedBarcodePattern color={currentTheme.barcodeColor} />
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                   
                   {/* Title Section */}
                   <div className="space-y-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${currentTheme.pillBg}`}>
                        <FolderPlus className="w-3.5 h-3.5" style={{ color: currentTheme.accentColor }} />
                        <span>Additional Section #{cpIdx + 1}</span>
                      </div>
                      <h2 className="text-3xl font-black tracking-tight" style={{ color: currentTheme.primaryColor }}>
                        {cp.title || `Custom Section ${cpIdx + 1}`}
                      </h2>
                      {cp.subtitle && (
                        <p className="text-xs font-semibold text-[#64748B]">{cp.subtitle}</p>
                      )}
                      <div className="w-16 h-1 rounded-full" style={{ backgroundColor: currentTheme.accentColor }}></div>
                   </div>

                   {/* Custom Section Content & Items */}
                   <div className="space-y-4 flex-1">
                      {cp.content && (
                        <p className="text-xs text-[#334155] leading-relaxed font-normal bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] whitespace-pre-wrap">
                          {cp.content}
                        </p>
                      )}

                      {cp.items && cp.items.filter(Boolean).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 pt-2">
                           {cp.items.filter(Boolean).map((item, itemIdx) => (
                             <div key={itemIdx} className="flex items-center gap-3">
                               <NumberBadge num={itemIdx + 1} color={currentTheme.primaryColor} size={24} />
                               <span className="text-xs font-bold text-[#0F172A] leading-snug">{item}</span>
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center pt-2">
                     <RedHorizontalBarcodePattern color={currentTheme.barcodeColor} />
                     <span className="text-[10px] font-bold text-[#64748B]">CODIGIX CUSTOM SECTION SLIDE</span>
                     <RedHorizontalBarcodePattern color={currentTheme.barcodeColor} />
                   </div>

                </div>

                {/* Theme Footer Bar */}
                <div className="h-7 w-full shrink-0" style={{ backgroundColor: currentTheme.accentColor }}></div>
             </div>
           ))}

         </div>
       </div>
     </div>
    </div>
  );
}
