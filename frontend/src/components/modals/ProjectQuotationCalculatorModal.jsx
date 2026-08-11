import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  X, 
  ArrowLeft, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  FileText, 
  Users, 
  Layers, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  Globe,
  Lock,
  Bell,
  Cloud,
  Wrench,
  CreditCard,
  Briefcase
} from 'lucide-react';

export default function ProjectQuotationCalculatorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // 1. Project Details State
  const [projectName, setProjectName] = useState('E-Commerce Mobile Application');
  const [clientName, setClientName] = useState('Apex Global Enterprises');
  const [projectType, setProjectType] = useState('Web & Mobile App');
  const [duration, setDuration] = useState('3');
  const [durationUnit, setDurationUnit] = useState('Months');

  // 2. Team Effort & Cost State
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', role: 'Project Manager', code: 'PM', monthlyRate: 50000, days: 30, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    { id: '2', role: 'Frontend Developer', code: 'FD', monthlyRate: 50000, days: 30, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    { id: '3', role: 'Backend Developer', code: 'BD', monthlyRate: 50000, days: 30, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' }
  ]);

  // 3. Direct Project Costs State
  const [directCosts, setDirectCosts] = useState({
    integrations: 30000,
    gatewaySetup: 5000,
    domainSSL: 5000,
    notifications: 10000,
    cloudServer: 20000,
    licensesTools: 10000
  });

  // 4. Overheads Percentages State
  const [overheads, setOverheads] = useState({
    office: 10,
    adminHR: 5,
    marketingSales: 5,
    miscellaneous: 5
  });

  // 5. Profit Margin Percentage State
  const [profitMargin, setProfitMargin] = useState(20);

  // Active step state (1 to 6)
  const [activeStep, setActiveStep] = useState(1);

  // Helper calculation totals
  const totalTeamCost = useMemo(() => {
    return teamMembers.reduce((sum, member) => {
      const dailyRate = (member.monthlyRate || 0) / 30;
      return sum + (dailyRate * (member.days || 0));
    }, 0);
  }, [teamMembers]);

  const totalDirectCosts = useMemo(() => {
    return Object.values(directCosts).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [directCosts]);

  const directSubtotal = totalTeamCost + totalDirectCosts;

  const overheadAmounts = useMemo(() => {
    const office = (directSubtotal * (overheads.office || 0)) / 100;
    const adminHR = (directSubtotal * (overheads.adminHR || 0)) / 100;
    const marketingSales = (directSubtotal * (overheads.marketingSales || 0)) / 100;
    const miscellaneous = (directSubtotal * (overheads.miscellaneous || 0)) / 100;
    const total = office + adminHR + marketingSales + miscellaneous;
    return { office, adminHR, marketingSales, miscellaneous, total };
  }, [directSubtotal, overheads]);

  const subtotalCostPrice = directSubtotal + overheadAmounts.total;

  const profitAmount = useMemo(() => {
    return (subtotalCostPrice * (profitMargin || 0)) / 100;
  }, [subtotalCostPrice, profitMargin]);

  const finalQuotationTotal = subtotalCostPrice + profitAmount;

  // Convert Number to Words (Indian Currency Lakhs/Thousands)
  const numberToWordsINR = (num) => {
    if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
    const roundNum = Math.round(num);
    
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

    return `${inWords(roundNum)} Rupees Only`;
  };

  // Add new role to team
  const handleAddRole = () => {
    const rolesList = [
      { role: 'UI/UX Designer', code: 'UI', rate: 45000, color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
      { role: 'QA Automation Engineer', code: 'QA', rate: 40000, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
      { role: 'DevOps Engineer', code: 'DE', rate: 60000, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' }
    ];
    const nextRole = rolesList[teamMembers.length % rolesList.length];
    setTeamMembers(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: nextRole.role,
        code: nextRole.code,
        monthlyRate: nextRole.rate,
        days: 30,
        color: nextRole.color
      }
    ]);
  };

  // Remove role
  const handleRemoveRole = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  // Reset all calculator values
  const handleReset = () => {
    setProjectName('');
    setClientName('');
    setProjectType('Web Application');
    setDuration('1');
    setDurationUnit('Months');
    setTeamMembers([
      { id: '1', role: 'Project Manager', code: 'PM', monthlyRate: 50000, days: 31, color: 'bg-purple-100 text-purple-700' },
      { id: '2', role: 'Frontend Developer', code: 'FD', monthlyRate: 50000, days: 31, color: 'bg-blue-100 text-blue-700' },
      { id: '3', role: 'Backend Developer', code: 'BD', monthlyRate: 50000, days: 31, color: 'bg-emerald-100 text-emerald-700' }
    ]);
    setDirectCosts({
      integrations: 0,
      gatewaySetup: 0,
      domainSSL: 0,
      notifications: 0,
      cloudServer: 0,
      licensesTools: 0
    });
    setOverheads({ office: 10, adminHR: 5, marketingSales: 5, miscellaneous: 5 });
    setProfitMargin(20);
  };

  // Export quotation report
  const handleExport = () => {
    window.print();
  };

  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Team' },
    { num: 3, label: 'Direct Costs' },
    { num: 4, label: 'Overheads' },
    { num: 5, label: 'Profit Margin' },
    { num: 6, label: 'Summary' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        
        {/* ── Top Header Navigation Bar ── */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Calculator"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                PROJECT QUOTATION CALCULATOR
              </h2>
              <p className="text-[10px] text-slate-400 font-bold hidden sm:block">Automated Pricing Engine & Cost Estimator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ── 6-Step Horizontal Progress Ribbon ── */}
        <div className="bg-white dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-slate-800 px-3 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[500px]">
            {steps.map((st, idx) => {
              const isActive = activeStep === st.num;
              const isCompleted = activeStep > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    onClick={() => setActiveStep(st.num)}
                    className="flex flex-col items-center gap-1 cursor-pointer transition-all shrink-0 group"
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-500/20 scale-105' 
                        : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                    </div>
                    <span className={`text-[10px] font-extrabold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                      {st.label}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Form Body ── */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 dark:text-slate-100 no-scrollbar">
          
          {/* SECTION 1: PROJECT DETAILS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                1. PROJECT DETAILS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] block">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] block">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] block">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Web Application">Web Application</option>
                  <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                  <option value="Custom ERP / SaaS">Custom ERP / SaaS</option>
                  <option value="UI/UX & Branding">UI/UX & Branding</option>
                  <option value="Full-Stack Enterprise">Full-Stack Enterprise</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] block">Duration</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 6"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] block">Unit</label>
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Months">Months</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Days">Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TEAM EFFORT & COST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                  2. TEAM EFFORT & COST
                </h3>
              </div>
              <button
                onClick={handleAddRole}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {teamMembers.map((m) => {
                const dailyRate = (m.monthlyRate || 0) / 30;
                const lineTotal = dailyRate * (m.days || 0);
                return (
                  <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${m.color || 'bg-blue-100 text-blue-700'}`}>
                        {m.code || 'DEV'}
                      </div>
                      <div className="min-w-0">
                        <strong className="font-extrabold text-slate-900 dark:text-white block truncate text-xs">{m.role}</strong>
                        <span className="text-[10px] text-slate-400 font-bold block">₹{(m.monthlyRate || 0).toLocaleString()} / mo</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <input
                          type="number"
                          value={m.days}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTeamMembers(prev => prev.map(item => item.id === m.id ? { ...item, days: val } : item));
                          }}
                          className="w-8 text-center text-xs font-bold bg-transparent focus:outline-none text-slate-900 dark:text-white"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">Days</span>
                      </div>

                      <strong className="font-black text-slate-900 dark:text-white text-xs w-20 text-right">
                        ₹{Math.round(lineTotal).toLocaleString()}
                      </strong>

                      <button
                        onClick={() => handleRemoveRole(m.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-500">Total Team Cost</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                ₹{Math.round(totalTeamCost).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* SECTION 3: DIRECT PROJECT COSTS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                3. DIRECT PROJECT COSTS
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { key: 'integrations', label: 'Integrations', icon: Wrench, placeholder: 'e.g. 30,000' },
                { key: 'gatewaySetup', label: 'Gateway Setup', icon: CreditCard, placeholder: 'e.g. 5,000' },
                { key: 'domainSSL', label: 'Domain & SSL', icon: Lock, placeholder: 'e.g. 5,000' },
                { key: 'notifications', label: 'Notifications', icon: Bell, placeholder: 'e.g. 10,000' },
                { key: 'cloudServer', label: 'Cloud / Server', icon: Cloud, placeholder: 'e.g. 20,000' },
                { key: 'licensesTools', label: 'Licenses / Tools', icon: Briefcase, placeholder: 'e.g. 10,000' }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="font-extrabold text-[11px] truncate">{item.label}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">₹</span>
                      <input
                        type="number"
                        value={directCosts[item.key] || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDirectCosts(prev => ({ ...prev, [item.key]: val }));
                        }}
                        placeholder={item.placeholder}
                        className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-500">Total Direct Costs</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                ₹{totalDirectCosts.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* SECTION 4: OVERHEADS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                4. OVERHEADS
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'office', label: 'Office Overheads', val: overheads.office, amt: overheadAmounts.office },
                { key: 'adminHR', label: 'Admin & HR', val: overheads.adminHR, amt: overheadAmounts.adminHR },
                { key: 'marketingSales', label: 'Marketing & Sales', val: overheads.marketingSales, amt: overheadAmounts.marketingSales },
                { key: 'miscellaneous', label: 'Miscellaneous', val: overheads.miscellaneous, amt: overheadAmounts.miscellaneous }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <input
                        type="number"
                        value={item.val}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOverheads(prev => ({ ...prev, [item.key]: val }));
                        }}
                        className="w-10 text-center text-xs font-extrabold bg-transparent focus:outline-none text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                    <strong className="font-black text-slate-900 dark:text-white text-xs w-20 text-right">
                      ₹{Math.round(item.amt).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-500">Total Overheads</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-black text-sm">
                ₹{Math.round(overheadAmounts.total).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* SECTION 5: PROFIT MARGIN */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                5. PROFIT MARGIN
              </h3>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300">Profit Margin (%)</span>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
                <input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  className="w-12 text-center font-black text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white"
                />
                <span className="font-extrabold text-slate-400 text-xs">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-extrabold text-slate-500">Profit Amount</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                ₹{Math.round(profitAmount).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* SECTION 6: QUOTATION SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
                6. QUOTATION SUMMARY
              </h3>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Total Team Cost</span><strong className="font-mono text-slate-900 dark:text-white">₹{Math.round(totalTeamCost).toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Total Direct Costs</span><strong className="font-mono text-slate-900 dark:text-white">₹{totalDirectCosts.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Total Overheads</span><strong className="font-mono text-slate-900 dark:text-white">₹{Math.round(overheadAmounts.total).toLocaleString()}</strong></div>
              
              <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                <span>Subtotal (Cost Price)</span>
                <strong>₹{Math.round(subtotalCostPrice).toLocaleString()}</strong>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Profit ({profitMargin}%)</span>
                <span>+ ₹{Math.round(profitAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Final Highlight Box */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-center space-y-1 shadow-inner">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                FINAL QUOTATION
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹ {Math.round(finalQuotationTotal).toLocaleString()}
              </div>
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 italic">
                ({numberToWordsINR(finalQuotationTotal)})
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom Summary Live Ribbon (Matches Screenshot Bottom Calculation Bar) ── */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-1 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-bold text-slate-600 dark:text-slate-300">
            <span className="text-indigo-600 dark:text-indigo-400 font-black">Team ₹{Math.round(totalTeamCost / 1000)}k</span>
            <span>+</span>
            <span className="text-blue-600 dark:text-blue-400 font-black">Direct ₹{Math.round(totalDirectCosts / 1000)}k</span>
            <span>+</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">Overheads ₹{Math.round(overheadAmounts.total / 1000)}k</span>
            <span>+</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">Profit ₹{Math.round(profitAmount / 1000)}k</span>
          </div>

          <button
            onClick={() => setActiveStep(6)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md shrink-0 active:scale-95 transition-all text-xs cursor-pointer"
          >
            Final ₹ {Math.round(finalQuotationTotal).toLocaleString()}
          </button>
        </div>

      </div>
    </div>
  );
}
