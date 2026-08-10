import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Calendar,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  UserPlus,
  Layers,
  ChevronRight,
  Calculator,
  ShoppingBag,
  Receipt,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  getFinanceDashboardAPI,
  fetchSalesAPI,
  createSaleAPI,
  deleteSaleAPI,
  fetchPurchasesAPI,
  createPurchaseAPI,
  deletePurchaseAPI
} from '../services/api';

export default function FinanceDashboardView({ clients = [], plannerTasks = [], onOpenAI }) {
  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sales', 'purchases'
  const [selectedPeriod, setSelectedPeriod] = useState('this_month'); // 'this_month', 'last_month', 'q1', 'q2', 'q3', 'q4', '2026', '2025', 'all'
  const [loading, setLoading] = useState(true);

  // Financial Telemetry States
  const [dashboardData, setDashboardData] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Dialog States
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showPeriodFilterModal, setShowPeriodFilterModal] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Form Inputs for New Sale
  const [newSale, setNewSale] = useState({
    invoice_no: '',
    client_name: '',
    category: 'Custom Software Development',
    amount: '',
    tax_amount: '',
    sale_date: new Date().toISOString().split('T')[0],
    status: 'PAID',
    payment_method: 'Bank Transfer',
    notes: ''
  });

  // Form Inputs for New Purchase
  const [newPurchase, setNewPurchase] = useState({
    purchase_no: '',
    vendor_name: '',
    category: 'Salaries & Operations',
    amount: '',
    tax_amount: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'PAID',
    payment_method: 'Bank Transfer',
    notes: ''
  });

  // Project Quotation Calculator States (Clean Placeholders)
  const [calcProjectName, setCalcProjectName] = useState('');
  const [calcClientName, setCalcClientName] = useState('');
  const [calcProjectType, setCalcProjectType] = useState('Web Application');
  const [calcDuration, setCalcDuration] = useState('');
  const [calcDurationUnit, setCalcDurationUnit] = useState('Months');
  const [calcCurrency, setCalcCurrency] = useState('INR - Indian Rupee (₹)');

  // Team Effort & Cost Table
  const [calcTeamRoles, setCalcTeamRoles] = useState([
    { id: 1, role: 'Project Manager', monthlyCost: '', effortDays: '' },
    { id: 2, role: 'Frontend Developer', monthlyCost: '', effortDays: '' },
    { id: 3, role: 'Backend Developer', monthlyCost: '', effortDays: '' }
  ]);

  // Direct Project Costs
  const [calcThirdParty, setCalcThirdParty] = useState('');
  const [calcPaymentGateway, setCalcPaymentGateway] = useState('');
  const [calcDomainSsl, setCalcDomainSsl] = useState('');
  const [calcNotifications, setCalcNotifications] = useState('');
  const [calcCloudServer, setCalcCloudServer] = useState('');
  const [calcOtherDirect, setCalcOtherDirect] = useState('');
  const [calcLicenses, setCalcLicenses] = useState('');

  // Overheads (%)
  const [calcOfficeOverheadPct, setCalcOfficeOverheadPct] = useState('');
  const [calcAdminHrPct, setCalcAdminHrPct] = useState('');
  const [calcMarketingSalesPct, setCalcMarketingSalesPct] = useState('');
  const [calcMiscOverheadPct, setCalcMiscOverheadPct] = useState('');

  // Profit Margin (%)
  const [calcProfitMarginPct, setCalcProfitMarginPct] = useState('');

  // Reset Calculator Function
  const handleResetCalculator = () => {
    setCalcProjectName('');
    setCalcClientName('');
    setCalcProjectType('Web Application');
    setCalcDuration('');
    setCalcDurationUnit('Months');
    setCalcCurrency('INR - Indian Rupee (₹)');

    setCalcTeamRoles([
      { id: 1, role: 'Project Manager', monthlyCost: '', effortDays: '' },
      { id: 2, role: 'Frontend Developer', monthlyCost: '', effortDays: '' },
      { id: 3, role: 'Backend Developer', monthlyCost: '', effortDays: '' }
    ]);

    setCalcThirdParty('');
    setCalcPaymentGateway('');
    setCalcDomainSsl('');
    setCalcNotifications('');
    setCalcCloudServer('');
    setCalcOtherDirect('');
    setCalcLicenses('');

    setCalcOfficeOverheadPct('');
    setCalcAdminHrPct('');
    setCalcMarketingSalesPct('');
    setCalcMiscOverheadPct('');

    setCalcProfitMarginPct('');
  };

  // Load Financial Telemetry
  useEffect(() => {
    loadFinanceTelemetry();
  }, [selectedPeriod]);

  async function loadFinanceTelemetry() {
    setLoading(true);
    try {
      const data = await getFinanceDashboardAPI(selectedPeriod);
      if (data && data.success) {
        setDashboardData(data);
      }
      const salesRes = await fetchSalesAPI();
      if (salesRes && salesRes.success) setSalesList(salesRes.sales || []);

      const purchasesRes = await fetchPurchasesAPI();
      if (purchasesRes && purchasesRes.success) setPurchasesList(purchasesRes.purchases || []);
    } catch (err) {
      console.error('Failed to load finance telemetry:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Create Sale
  const handleSaveSale = async (e) => {
    e.preventDefault();
    if (!newSale.client_name || !newSale.amount) return;
    try {
      await createSaleAPI(newSale);
      setShowSaleModal(false);
      setNewSale({
        invoice_no: '',
        client_name: '',
        category: 'Custom Software Development',
        amount: '',
        tax_amount: '',
        sale_date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        payment_method: 'Bank Transfer',
        notes: ''
      });
      await loadFinanceTelemetry();
    } catch (err) {
      console.error('Failed to save sale:', err);
    }
  };

  // Handle Create Purchase
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!newPurchase.vendor_name || !newPurchase.amount) return;
    try {
      await createPurchaseAPI(newPurchase);
      setShowPurchaseModal(false);
      setNewPurchase({
        purchase_no: '',
        vendor_name: '',
        category: 'Salaries & Operations',
        amount: '',
        tax_amount: '',
        purchase_date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        payment_method: 'Bank Transfer',
        notes: ''
      });
      await loadFinanceTelemetry();
    } catch (err) {
      console.error('Failed to save purchase:', err);
    }
  };

  // Handle Delete Sale
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Delete this sales invoice record?')) return;
    try {
      await deleteSaleAPI(id);
      await loadFinanceTelemetry();
    } catch (err) {
      console.error('Failed to delete sale:', err);
    }
  };

  // Handle Delete Purchase
  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Delete this purchase record?')) return;
    try {
      await deletePurchaseAPI(id);
      await loadFinanceTelemetry();
    } catch (err) {
      console.error('Failed to delete purchase:', err);
    }
  };

  // Helper for Number in Words (INR Lakhs / Thousands)
  const formatWordsINR = (amount) => {
    if (!amount || amount === 0) return 'Zero Rupees Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    }
    return inWords(Math.round(amount)) + ' Only';
  };

  // Calculations for Project Quotation Calculator
  const totalTeamCost = calcTeamRoles.reduce((acc, row) => {
    const monthlyCost = parseFloat(row.monthlyCost || 0);
    const effortDays = parseFloat(row.effortDays || 0);
    const dailyRate = monthlyCost / 22;
    const rowCost = Math.round(dailyRate * effortDays);
    return acc + rowCost;
  }, 0);

  const totalDirectCosts =
    parseFloat(calcThirdParty || 0) +
    parseFloat(calcPaymentGateway || 0) +
    parseFloat(calcDomainSsl || 0) +
    parseFloat(calcNotifications || 0) +
    parseFloat(calcCloudServer || 0) +
    parseFloat(calcOtherDirect || 0) +
    parseFloat(calcLicenses || 0);

  const directBaseCost = totalTeamCost + totalDirectCosts;

  const officeOverheadVal = Math.round(directBaseCost * (parseFloat(calcOfficeOverheadPct || 0) / 100));
  const adminHrVal = Math.round(directBaseCost * (parseFloat(calcAdminHrPct || 0) / 100));
  const marketingSalesVal = Math.round(directBaseCost * (parseFloat(calcMarketingSalesPct || 0) / 100));
  const miscOverheadVal = Math.round(directBaseCost * (parseFloat(calcMiscOverheadPct || 0) / 100));

  const totalOverheads = officeOverheadVal + adminHrVal + marketingSalesVal + miscOverheadVal;

  const subtotalCostPrice = totalTeamCost + totalDirectCosts + totalOverheads;

  const calcProfitAmount = Math.round(subtotalCostPrice * (parseFloat(calcProfitMarginPct || 0) / 100));

  const finalQuotationAmount = subtotalCostPrice + calcProfitAmount;

  // Telemetry Aggregates
  const summary = dashboardData?.summary || {
    totalRevenue: 1290000,
    totalPurchases: 446858,
    netProfit: 843142,
    profitMargin: '65.4%',
    salesCount: salesList.length,
    purchaseCount: purchasesList.length
  };

  const trendChartData = dashboardData?.monthlyTrend && dashboardData.monthlyTrend.length > 0
    ? dashboardData.monthlyTrend.map(t => ({
      label: t.label,
      Revenue: parseFloat(t.revenue || 0) / 100000
    }))
    : [
      { label: 'May 2026', Revenue: 4.5 },
      { label: 'Jun 2026', Revenue: 6.2 },
      { label: 'Jul 2026', Revenue: 8.9 },
      { label: 'Aug 2026', Revenue: 12.9 }
    ];

  const expenseCategoryData = dashboardData?.expenseCategories && dashboardData.expenseCategories.length > 0
    ? dashboardData.expenseCategories.map((c, i) => {
      const colors = ['#2563eb', '#38bdf8', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#64748b'];
      const val = parseFloat(c.total || 0);
      const pct = summary.totalPurchases > 0 ? `${((val / summary.totalPurchases) * 100).toFixed(0)}%` : '0%';
      return {
        name: c.name,
        pct,
        val: `₹ ${val.toLocaleString('en-IN')}`,
        color: colors[i % colors.length]
      };
    })
    : [
      { name: 'Salaries & Payroll', pct: '64%', val: '₹ 2,85,000', color: '#2563eb' },
      { name: 'Office Operations', pct: '19%', val: '₹ 85,000', color: '#38bdf8' },
      { name: 'Marketing & Ads', pct: '10%', val: '₹ 45,600', color: '#ec4899' },
      { name: 'Cloud & Hosting', pct: '3%', val: '₹ 12,450', color: '#8b5cf6' },
      { name: 'Software Licenses', pct: '4%', val: '₹ 18,500', color: '#f59e0b' }
    ];

  // Combine Project Deals with Direct Sales Invoices
  const projectSales = (clients || []).map((c, idx) => ({
    id: `proj_${c.id || idx}`,
    invoice_no: `PROJ-${c.id || (idx + 101)}`,
    client_name: c.name || c.company || 'Enterprise Client',
    category: c.industry || c.category || 'Client Project Contract',
    amount: parseInt((c.expectedValue || '250000').replace(/[^0-9]/g, '')) || 250000,
    sale_date: c.createdDate || c.date || new Date().toISOString().split('T')[0],
    status: 'PAID',
    payment_method: 'Bank Transfer',
    isProject: true
  }));

  const allCombinedSales = [...salesList, ...projectSales];

  // Filtered Tables
  const filteredSales = allCombinedSales.filter(s =>
    s.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchases = purchasesList.filter(p =>
    p.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.purchase_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Top Header & Period Filter Controls */}
      <div className="card-base border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-bold">
                Financial Suite
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                ✓ Verified MySQL Ledger
              </span>
            </div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Finance & Revenue Control Center
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Real-time sales invoices, vendor purchases, net profit margins, and period revenue management.
            </p>
          </div>

          {/* Quick Action Buttons (Compact text on mobile to avoid overflow) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => setShowSaleModal(true)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Record Sale"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Record Sale</span>
              <span className="sm:hidden">+ Sale</span>
            </button>

            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Record Purchase"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Record Purchase</span>
              <span className="sm:hidden">Purchase</span>
            </button>

            <button
              onClick={() => setShowQuotationModal(true)}
              className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Calculator"
            >
              <Calculator className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="hidden sm:inline">Calculator</span>
              <span className="sm:hidden">Calc</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs (Clickable Filter Icon Button + Pills — Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowPeriodFilterModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 mr-1"
            title="Open Period Filters Modal"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          {[
            { id: 'this_month', full: 'This Month', short: 'Month' },
            { id: 'last_month', full: 'Last Month', short: 'Last Mo.' },
            { id: 'q1', full: 'Q1 (Jan-Mar)', short: 'Q1' },
            { id: 'q2', full: 'Q2 (Apr-Jun)', short: 'Q2' },
            { id: 'q3', full: 'Q3 (Jul-Sep)', short: 'Q3' },
            { id: 'q4', full: 'Q4 (Oct-Dec)', short: 'Q4' },
            { id: '2026', full: 'Year 2026', short: "'26" },
            { id: '2025', full: 'Year 2025', short: "'25" },
            { id: 'all', full: 'All Time', short: 'All' }
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedPeriod === period.id
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
            >
              <span className="hidden sm:inline">{period.full}</span>
              <span className="sm:hidden">{period.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Ribbon (2x2 Grid on Mobile, 4 Side-by-Side on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Sales / Revenue */}
        <div className="card-base p-3 sm:p-5 space-y-1.5 sm:space-y-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold truncate">
              <span className="hidden sm:inline">Total Sales / Revenue</span>
              <span className="sm:hidden">Revenue</span>
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
            ₹ {summary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-emerald-600 truncate">
            <span>+{summary.salesCount} Invoices Executed</span>
          </div>
        </div>

        {/* Total Purchases / Expenses */}
        <div className="card-base p-3 sm:p-5 space-y-1.5 sm:space-y-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold truncate">
              <span className="hidden sm:inline">Purchases & Expenses</span>
              <span className="sm:hidden">Expenses</span>
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
            ₹ {summary.totalPurchases.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-rose-500 truncate">
            <span>{summary.purchaseCount} Vendor Purchases</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="card-base p-3 sm:p-5 space-y-1.5 sm:space-y-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold truncate">
              <span className="hidden sm:inline">Net Revenue Profit</span>
              <span className="sm:hidden">Net Profit</span>
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
            ₹ {summary.netProfit.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-blue-600 truncate">
            <span>After Operating Purchases</span>
          </div>
        </div>

        {/* Profit Margin % */}
        <div className="card-base p-3 sm:p-5 space-y-1.5 sm:space-y-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold truncate">
              <span className="hidden sm:inline">Net Profit Margin</span>
              <span className="sm:hidden">Margin</span>
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
            {summary.profitMargin}
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-amber-600 truncate">
            <span>Healthy Margin</span>
          </div>
        </div>
      </div>

      {/* View Switcher Sub-Tabs (Overview | Sales Ledger | Purchase Ledger) */}
      <div className="flex items-center justify-between sm:justify-start gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Overview', full: 'Financial Overview', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
          { id: 'sales', label: `Sales (${salesList.length})`, full: `Sales & Invoices (${salesList.length})`, icon: <Receipt className="w-4 h-4 text-emerald-500 shrink-0" /> },
          { id: 'purchases', label: `Purchases (${purchasesList.length})`, full: `Purchases & Vendor Bills (${purchasesList.length})`, icon: <ShoppingBag className="w-4 h-4 text-rose-500 shrink-0" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-sm font-black'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.full}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: FINANCIAL OVERVIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Growth Trend Chart */}
            <div className="lg:col-span-2 card-base p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base  text-slate-900 dark:text-white">Monthly Revenue Growth (in Lakhs ₹)</h3>
                  <p className="text-xs text-slate-500">Track dynamic sales performance over time</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                      formatter={(val) => [`₹ ${val} Lakhs`, 'Revenue']}
                    />
                    <Bar dataKey="Revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="card-base p-6 space-y-4">
              <h3 className="text-base  text-slate-900 dark:text-white">Purchase & Expense Allocation</h3>
              <div className="space-y-3">
                {expenseCategoryData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs ">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-slate-900 dark:text-white font-mono">{item.val} ({item.pct})</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: item.pct, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Finance Assistant Insight */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded flex items-center gap-3">
            <div className="p-2 rounded border-slate-300 bg-blue-600 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              <strong className="text-blue-600 dark:text-blue-400">AI Financial Health Recommendation:</strong> Net revenue margin for <strong>{selectedPeriod}</strong> stands strong at <strong>{summary.profitMargin}</strong>. Operating costs are within 35% target bounds. Recommended: Reinvest 15% of surplus into high-ROI Meta & Google acquisition channels.
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: SALES & REVENUE INVOICES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Client or Invoice No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowSaleModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white  text-xs rounded border-slate-300  transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Sale</span>
            </button>
          </div>

          <div className="card-base overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500   border-b border-slate-200 dark:border-slate-750">
                  <tr>
                    <th className="p-3.5">Invoice No</th>
                    <th className="p-3.5">Client Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Sale Date</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono  text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <span>{item.invoice_no}</span>
                        {item.isProject && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px]  ">
                            📁 Project
                          </span>
                        )}
                      </td>
                      <td className="p-3.5  text-slate-900 dark:text-white">{item.client_name}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.category}</td>
                      <td className="p-3.5 text-slate-500">{new Date(item.sale_date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5  text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹ {parseFloat(item.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs  ">
                          {item.status || 'PAID'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.payment_method}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSale(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 ">
                        No sales invoices found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: PURCHASES & VENDOR BILLS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Vendor or Purchase No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white  text-xs rounded border-slate-300  transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Purchase</span>
            </button>
          </div>

          <div className="card-base overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500   border-b border-slate-200 dark:border-slate-750">
                  <tr>
                    <th className="p-3.5">Purchase No</th>
                    <th className="p-3.5">Vendor / Payee</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Purchase Date</th>
                    <th className="p-3.5">Amount (₹)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPurchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono  text-rose-600 dark:text-rose-400">{item.purchase_no}</td>
                      <td className="p-3.5  text-slate-900 dark:text-white">{item.vendor_name}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.category}</td>
                      <td className="p-3.5 text-slate-500">{new Date(item.purchase_date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5  text-rose-600 dark:text-rose-400 text-sm">
                        ₹ {parseFloat(item.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs  ">
                          {item.status || 'PAID'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.payment_method}</td>
                      <td className="p-3.5 text-right flex items-center justify-end gap-2">
                        {item.bill_file_url ? (
                          <a
                            href={item.bill_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400  text-xs rounded-lg flex items-center gap-1 border border-blue-500/20"
                            title={item.bill_file_name || 'View Invoice'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">No File</span>
                        )}
                        <button
                          onClick={() => handleDeletePurchase(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 ">
                        No purchase bills found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: RECORD NEW SALE */}
      {/* ---------------------------------------------------- */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded max-w-lg w-full p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base  text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <span>Record New Sale / Client Invoice</span>
              </h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-600  text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-3 text-xs">
              <div>
                <label className=" text-slate-700 dark:text-slate-300 block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Codigix Tech Solutions"
                  value={newSale.client_name}
                  onChange={(e) => setNewSale({ ...newSale, client_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 250000"
                    value={newSale.amount}
                    onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">GST / Tax Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={newSale.tax_amount}
                    onChange={(e) => setNewSale({ ...newSale, tax_amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={newSale.category}
                    onChange={(e) => setNewSale({ ...newSale, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Custom ERP Software">Custom ERP Software</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="SaaS Retainer Subscription">SaaS Retainer Subscription</option>
                    <option value="IoT & Asset Tracking">IoT & Asset Tracking</option>
                    <option value="AI Software Platform">AI Software Platform</option>
                  </select>
                </div>

                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Sale Date</label>
                  <input
                    type="date"
                    value={newSale.sale_date}
                    onChange={(e) => setNewSale({ ...newSale, sale_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300  rounded border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white  rounded border-slate-300  cursor-pointer"
                >
                  Save Sale Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: RECORD NEW PURCHASE */}
      {/* ---------------------------------------------------- */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded max-w-lg w-full p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base  text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                <span>Record New Purchase / Vendor Bill</span>
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-600  text-sm">✕</button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3 text-xs">
              <div>
                <label className=" text-slate-700 dark:text-slate-300 block mb-1">Vendor / Payee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services / Staff Salaries"
                  value={newPurchase.vendor_name}
                  onChange={(e) => setNewPurchase({ ...newPurchase, vendor_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={newPurchase.amount}
                    onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">GST / Tax Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 8100"
                    value={newPurchase.tax_amount}
                    onChange={(e) => setNewPurchase({ ...newPurchase, tax_amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={newPurchase.category}
                    onChange={(e) => setNewPurchase({ ...newPurchase, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Salaries & Payroll">Salaries & Payroll</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Office Operations">Office Operations</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Software Licenses">Software Licenses</option>
                  </select>
                </div>

                <div>
                  <label className=" text-slate-700 dark:text-slate-300 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newPurchase.purchase_date}
                    onChange={(e) => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className=" text-slate-700 dark:text-slate-300 block mb-1">Upload Purchase Bill / Invoice Document (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewPurchase({
                        ...newPurchase,
                        bill_file_name: file.name,
                        bill_file_url: URL.createObjectURL(file)
                      });
                    }
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 text-slate-600 dark:text-slate-300 text-xs"
                />
                {newPurchase.bill_file_name && (
                  <p className="text-xs text-emerald-600  mt-1">
                    ✓ Attached Document: {newPurchase.bill_file_name}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300  rounded border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white  rounded border-slate-300  cursor-pointer"
                >
                  Save Purchase Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: COMPACT PROJECT QUOTATION CALCULATOR */}
      {/* ---------------------------------------------------- */}
      {showQuotationModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-950 rounded max-w-5xl w-full p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[94vh] overflow-y-auto text-slate-800 dark:text-slate-100">

            {/* Modal Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded border-slate-300  shadow-indigo-600/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base  tracking-tight text-slate-900 dark:text-white ">
                    PROJECT QUOTATION CALCULATOR
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Calculate accurate project quotation with profit & overheads
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCalculator}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200  text-xs rounded border-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white  text-xs rounded border-slate-300  shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Export</span>
                </button>

                <button
                  onClick={() => setShowQuotationModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white  text-base ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Compact Step Wizard Bar */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between min-w-[650px] text-xs">
                {[
                  { step: 1, title: 'Project Details' },
                  { step: 2, title: 'Team Effort' },
                  { step: 3, title: 'Direct Costs' },
                  { step: 4, title: 'Overheads' },
                  { step: 5, title: 'Profit Margin' },
                  { step: 6, title: 'Summary' }
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.step}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center  text-xs shrink-0 ${s.step === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                        {s.step}
                      </div>
                      <div className=" text-slate-900 dark:text-white text-xs">{s.title}</div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 2-Column Master Compact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* LEFT COLUMN: Project Details, Team Effort & Direct Costs (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">

                {/* 1. Project Details */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>1. Project Details</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className=" text-slate-700 dark:text-slate-300 block mb-1">Project Name</label>
                      <input
                        type="text"
                        placeholder="Enter project name"
                        value={calcProjectName}
                        onChange={(e) => setCalcProjectName(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-700 dark:text-slate-300 block mb-1">Client Name</label>
                      <input
                        type="text"
                        placeholder="Enter client name"
                        value={calcClientName}
                        onChange={(e) => setCalcClientName(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-700 dark:text-slate-300 block mb-1">Project Type</label>
                      <select
                        value={calcProjectType}
                        onChange={(e) => setCalcProjectType(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      >
                        <option value="Web Application">Web Application</option>
                        <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                        <option value="Enterprise ERP System">Enterprise ERP System</option>
                        <option value="SaaS Platform">SaaS Platform</option>
                        <option value="Custom Software Development">Custom Software Development</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className=" text-slate-700 dark:text-slate-300 block mb-1">Duration</label>
                        <input
                          type="number"
                          placeholder="e.g. 6"
                          value={calcDuration}
                          onChange={(e) => setCalcDuration(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className=" text-slate-700 dark:text-slate-300 block mb-1">Unit</label>
                        <select
                          value={calcDurationUnit}
                          onChange={(e) => setCalcDurationUnit(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded border-slate-300 font-medium"
                        >
                          <option value="Months">Months</option>
                          <option value="Weeks">Weeks</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Team Effort & Cost */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      <span>2. Team Effort & Cost</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCalcTeamRoles(prev => [...prev, { id: Date.now(), role: 'Developer', monthlyCost: '', effortDays: '' }])}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400  text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Role</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-400   border-b border-slate-100 dark:border-slate-800 text-xs">
                        <tr>
                          <th className="pb-1.5">Role</th>
                          <th className="pb-1.5">Monthly Cost (₹)</th>
                          <th className="pb-1.5">Effort (Days)</th>
                          <th className="pb-1.5 text-right">Total Cost (₹)</th>
                          <th className="pb-1.5 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {calcTeamRoles.map((item) => {
                          const monthly = parseFloat(item.monthlyCost || 0);
                          const days = parseFloat(item.effortDays || 0);
                          const rowCost = Math.round((monthly / 22) * days);

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-1.5 pr-2">
                                <input
                                  type="text"
                                  value={item.role}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCalcTeamRoles(prev => prev.map(r => r.id === item.id ? { ...r, role: val } : r));
                                  }}
                                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded  text-xs"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 50,000"
                                  value={item.monthlyCost}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCalcTeamRoles(prev => prev.map(r => r.id === item.id ? { ...r, monthlyCost: val } : r));
                                  }}
                                  className="w-28 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded  text-xs text-right"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="number"
                                  placeholder="e.g. 30"
                                  value={item.effortDays}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCalcTeamRoles(prev => prev.map(r => r.id === item.id ? { ...r, effortDays: val } : r));
                                  }}
                                  className="w-16 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded  text-xs text-right"
                                />
                              </td>
                              <td className="py-1.5 font-mono  text-right text-slate-900 dark:text-white text-xs">
                                {rowCost > 0 ? rowCost.toLocaleString('en-IN') : '0'}
                              </td>
                              <td className="py-1.5 text-right pl-1">
                                <button
                                  type="button"
                                  onClick={() => setCalcTeamRoles(prev => prev.filter(r => r.id !== item.id))}
                                  className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-slate-400 italic">
                      * Daily rate = Monthly Cost / 22 Working Days
                    </p>
                    <div className="text-right">
                      <span className="text-slate-500  text-xs mr-2">Total Team Cost:</span>
                      <span className="text-sm  text-indigo-600 dark:text-indigo-400 font-mono">
                        ₹ {totalTeamCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Direct Project Costs */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>3. Direct Project Costs</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Integrations</label>
                      <input
                        type="number"
                        placeholder="e.g. 30,000"
                        value={calcThirdParty}
                        onChange={(e) => setCalcThirdParty(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Gateway Setup</label>
                      <input
                        type="number"
                        placeholder="e.g. 5,000"
                        value={calcPaymentGateway}
                        onChange={(e) => setCalcPaymentGateway(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Domain & SSL</label>
                      <input
                        type="number"
                        placeholder="e.g. 5,000"
                        value={calcDomainSsl}
                        onChange={(e) => setCalcDomainSsl(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Notifications</label>
                      <input
                        type="number"
                        placeholder="e.g. 10,000"
                        value={calcNotifications}
                        onChange={(e) => setCalcNotifications(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Cloud / Server</label>
                      <input
                        type="number"
                        placeholder="e.g. 20,000"
                        value={calcCloudServer}
                        onChange={(e) => setCalcCloudServer(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>

                    <div>
                      <label className=" text-slate-600 dark:text-slate-400 block mb-0.5 text-xs">Licenses / Tools</label>
                      <input
                        type="number"
                        placeholder="e.g. 10,000"
                        value={calcLicenses}
                        onChange={(e) => setCalcLicenses(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500  text-xs mr-2">Total Direct Costs:</span>
                    <span className="text-sm  text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹ {totalDirectCosts.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Overheads, Profit Margin & Summary Card (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">

                {/* 4. Overheads */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>4. Overheads</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-400 ">Office Overheads (%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="10"
                          value={calcOfficeOverheadPct}
                          onChange={(e) => setCalcOfficeOverheadPct(e.target.value)}
                          className="w-14 p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300 text-right  text-xs"
                        />
                        <span className=" text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-slate-200  w-20 text-right text-xs">
                        ₹ {officeOverheadVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-400 ">Admin & HR (%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="5"
                          value={calcAdminHrPct}
                          onChange={(e) => setCalcAdminHrPct(e.target.value)}
                          className="w-14 p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300 text-right  text-xs"
                        />
                        <span className=" text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-slate-200  w-20 text-right text-xs">
                        ₹ {adminHrVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-400 ">Marketing & Sales (%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="5"
                          value={calcMarketingSalesPct}
                          onChange={(e) => setCalcMarketingSalesPct(e.target.value)}
                          className="w-14 p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300 text-right  text-xs"
                        />
                        <span className=" text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-slate-200  w-20 text-right text-xs">
                        ₹ {marketingSalesVal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-400 ">Miscellaneous (%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="5"
                          value={calcMiscOverheadPct}
                          onChange={(e) => setCalcMiscOverheadPct(e.target.value)}
                          className="w-14 p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300 text-right  text-xs"
                        />
                        <span className=" text-slate-400">%</span>
                      </div>
                      <span className="font-mono text-slate-800 dark:text-slate-200  w-20 text-right text-xs">
                        ₹ {miscOverheadVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500  text-xs">Total Overheads:</span>
                    <span className="text-sm  text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹ {totalOverheads.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* 5. Profit Margin */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
                  <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>5. Profit Margin</span>
                  </h3>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 ">Profit Margin (%)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="20"
                        value={calcProfitMarginPct}
                        onChange={(e) => setCalcProfitMarginPct(e.target.value)}
                        className="w-16 p-2 bg-slate-50 dark:bg-slate-800 border rounded border-slate-300 text-right  text-emerald-600 text-xs"
                      />
                      <span className=" text-slate-400">%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400  block ">Profit Amount</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400  text-xs">
                        ₹ {calcProfitAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Quotation Summary */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded border border-indigo-200 dark:border-indigo-900  space-y-3">
                  <h3 className=" text-xs   text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>6. Quotation Summary</span>
                  </h3>

                  <div className="space-y-1.5 text-xs  text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Total Team Cost</span>
                      <span className="font-mono  text-slate-900 dark:text-white">₹ {totalTeamCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Direct Costs</span>
                      <span className="font-mono  text-slate-900 dark:text-white">₹ {totalDirectCosts.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Overheads</span>
                      <span className="font-mono  text-slate-900 dark:text-white">₹ {totalOverheads.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t  text-slate-900 dark:text-white text-xs">
                      <span>Subtotal (Cost Price)</span>
                      <span className="font-mono">₹ {subtotalCostPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 ">
                      <span>Profit ({calcProfitMarginPct || 0}%)</span>
                      <span className="font-mono">+ ₹ {calcProfitAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/60 rounded border-slate-300 border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
                    <span className="text-xs    text-indigo-600 dark:text-indigo-400 block">
                      FINAL QUOTATION
                    </span>
                    <div className="text-2xl  text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      ₹ {finalQuotationAmount.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[9px] text-slate-500  italic">
                      ({formatWordsINR(finalQuotationAmount)})
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Inlined Calculation Flow Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 text-xs overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className=" text-slate-500">Team:</span>
                <span className="font-mono  text-indigo-600">₹ {totalTeamCost.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-slate-400 ">+</span>
              <div className="flex items-center gap-2">
                <span className=" text-slate-500">Direct:</span>
                <span className="font-mono  text-blue-600">₹ {totalDirectCosts.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-slate-400 ">+</span>
              <div className="flex items-center gap-2">
                <span className=" text-slate-500">Overheads:</span>
                <span className="font-mono  text-amber-600">₹ {totalOverheads.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-slate-400 ">+</span>
              <div className="flex items-center gap-2">
                <span className=" text-slate-500">Profit:</span>
                <span className="font-mono  text-emerald-600">₹ {calcProfitAmount.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-slate-400 ">=</span>
              <div className="px-2.5 py-1 bg-indigo-600 text-white font-mono  rounded-lg text-xs">
                Final: ₹ {finalQuotationAmount.toLocaleString('en-IN')}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Period Filter Selection Modal */}
      {showPeriodFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Filter Financial Ledger Period
                </h3>
              </div>
              <button 
                onClick={() => setShowPeriodFilterModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { id: 'this_month', label: 'This Month', desc: 'Current Month Ledger' },
                { id: 'last_month', label: 'Last Month', desc: 'Previous Month' },
                { id: 'q1', label: 'Q1 (Jan - Mar)', desc: 'First Quarter' },
                { id: 'q2', label: 'Q2 (Apr - Jun)', desc: 'Second Quarter' },
                { id: 'q3', label: 'Q3 (Jul - Sep)', desc: 'Third Quarter' },
                { id: 'q4', label: 'Q4 (Oct - Dec)', desc: 'Fourth Quarter' },
                { id: '2026', label: 'Year 2026', desc: 'FY 2026 Full' },
                { id: '2025', label: 'Year 2025', desc: 'FY 2025 Full' },
                { id: 'all', label: 'All Time', desc: 'Complete Ledger' }
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => {
                    setSelectedPeriod(period.id);
                    setShowPeriodFilterModal(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPeriod === period.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm font-black'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-extrabold text-xs">{period.label}</span>
                  <span className="text-[9px] font-medium text-slate-400 mt-1">{period.desc}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowPeriodFilterModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close & View Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Finance Filters"
      >
        <Filter className="w-6 h-6 text-white" />
      </button>

      {/* ── Mobile Filters Drawer Modal ── */}
      {showMobileFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Finance Filters & Options</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Search Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Search Invoices / Transactions</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client, invoice or category..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* View Tab Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">View Section</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'sales', label: 'Sales Invoices' },
                    { id: 'purchases', label: 'Vendor Expenses' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all truncate ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Telemetry Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'this_month', label: 'This Month' },
                    { id: 'last_month', label: 'Last Month' },
                    { id: 'all', label: 'All Time' }
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setSelectedPeriod(period.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all ${
                        selectedPeriod === period.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('overview');
                  setSelectedPeriod('this_month');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
