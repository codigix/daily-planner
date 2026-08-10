import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Globe,
  Target,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Filter,
  X,
  Search
} from 'lucide-react';

import {
  fetchMetaDashboard,
  fetchMetaStatus,
  fetchMetaPages,
  fetchMetaInstagram,
  fetchMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaLeads,
  fetchMetaMedia
} from '../modules/marketing/services/meta.service.js';

import {
  fetchGoogleDashboard,
  triggerGoogleSync,
  replyGoogleReview,
  answerGoogleQuestion,
  saveGoogleAccessToken
} from '../modules/marketing/services/google.service.js';

import {
  fetchLinkedInDashboard,
  triggerLinkedInSync,
  saveLinkedInAccessToken
} from '../modules/marketing/services/linkedin.service.js';

import {
  MetaLogo,
  LinkedInLogo,
  GoogleGmbLogo,
  GA4TrafficLogo
} from '../modules/marketing/components/BrandLogos.jsx';

import MetaBusinessView from '../modules/marketing/components/MetaBusinessView.jsx';
import LinkedInView from '../modules/marketing/components/LinkedInView.jsx';
import GMBView from '../modules/marketing/components/GMBView.jsx';
import WebsiteView from '../modules/marketing/components/WebsiteView.jsx';
import MarketingModals from '../modules/marketing/components/MarketingModals.jsx';

export default function MarketingDashboardView({ clients = [], onOpenAI }) {
  const [crmMarketingData, setCrmMarketingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalPlatform, setAuthModalPlatform] = useState(null);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Tab & User Role States
  const [metaSaaSData, setMetaSaaSData] = useState(null);
  const [userRole, setUserRole] = useState('Admin');
  const [activeTab, setActiveTab] = useState('meta'); // meta, linkedin, gmb, website
  const [metaSubTab, setMetaSubTab] = useState('overview'); // overview, facebook, instagram, whatsapp, ads
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMetaConnected, setIsMetaConnected] = useState(false);

  // Token Update Modal States
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);

  // Google Business Profile Integration States
  const [googleData, setGoogleData] = useState(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [showGoogleTokenModal, setShowGoogleTokenModal] = useState(false);
  const [inputGoogleToken, setInputGoogleToken] = useState('');
  const [googleTokenSuccess, setGoogleTokenSuccess] = useState('');

  // LinkedIn Company Page Integration States
  const [linkedinData, setLinkedinData] = useState(null);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [isSyncingLinkedin, setIsSyncingLinkedin] = useState(false);
  const [showLinkedinTokenModal, setShowLinkedinTokenModal] = useState(false);
  const [inputLinkedinToken, setInputLinkedinToken] = useState('');
  const [linkedinTokenSuccess, setLinkedinTokenSuccess] = useState('');

  const [metaStatus, setMetaStatus] = useState(null);

  // Load SaaS Meta API Telemetry across all REST APIs
  async function loadMetaSaaSData() {
    try {
      const res = await fetchMetaDashboard(userRole);
      console.log('[Meta Dashboard] Full API Response:', res);
      const payload = res?.data || res;
      console.log('[Meta Dashboard] Dashboard Data:', payload);
      setMetaSaaSData(payload);

      if (payload?.health) {
        setMetaStatus(payload.health);
        if (payload.health.connected) setIsMetaConnected(true);
      }

      try {
        const [statusRes, pagesRes] = await Promise.allSettled([
          fetchMetaStatus(),
          fetchMetaPages(),
          fetchMetaInstagram(),
          fetchMetaAdAccounts(),
          fetchMetaCampaigns(),
          fetchMetaLeads(),
          fetchMetaMedia()
        ]);

        const statusObj = statusRes.status === 'fulfilled' ? (statusRes.value?.data || statusRes.value) : null;
        if (statusObj) {
          setMetaStatus(statusObj);
          if (statusObj.connected || statusObj.businessName) {
            setIsMetaConnected(true);
          }
        }

        const pagesData = pagesRes.status === 'fulfilled' ? (pagesRes.value?.data || pagesRes.value) : null;
        if (pagesData && Array.isArray(pagesData) && pagesData.length > 0) {
          setMetaSaaSData(prev => ({ ...prev, pages: pagesData }));
        }
      } catch (subErr) {
        console.warn('Supplementary REST endpoints notice:', subErr.message);
      }
    } catch (err) {
      console.error('Failed to load Meta SaaS telemetry:', err);
    }
  }

  // Load Google Business Profile Telemetry
  async function loadGoogleData() {
    try {
      const data = await fetchGoogleDashboard();
      setGoogleData(data);
      if (data && data.connected) {
        setIsGoogleConnected(true);
      }
    } catch (err) {
      console.error('Failed to load Google Business data:', err);
    }
  }

  // Load LinkedIn Company Page Telemetry
  async function loadLinkedInData() {
    try {
      const data = await fetchLinkedInDashboard();
      setLinkedinData(data);
      if (data && data.connected) {
        setIsLinkedinConnected(true);
      }
    } catch (err) {
      console.error('Failed to load LinkedIn telemetry:', err);
    }
  }

  // Handlers for Google Actions
  const handleConnectGoogleAccount = async () => {
    try {
      const res = await fetch('/api/google/login');
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.open(data.auth_url, '_blank', 'width=600,height=700');
        }
      }
    } catch (err) {
      console.error('Google OAuth trigger error:', err);
      window.location.href = '/api/google/login?redirect=true';
    }
  };

  const handleSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    try {
      await triggerGoogleSync();
      await loadGoogleData();
    } catch (err) {
      console.error('Manual Google Sync failed:', err);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleSaveGoogleToken = async () => {
    if (!inputGoogleToken.trim()) return;
    try {
      await saveGoogleAccessToken(inputGoogleToken);
      setGoogleTokenSuccess('Google Access Token saved & live telemetry synced successfully!');
      setTimeout(() => {
        setShowGoogleTokenModal(false);
        setGoogleTokenSuccess('');
        setInputGoogleToken('');
      }, 1500);
      await loadGoogleData();
    } catch (err) {
      console.error('Error saving Google access token:', err);
    }
  };

  // Handlers for LinkedIn Actions
  const handleConnectLinkedInAccount = async () => {
    try {
      const res = await fetch('/api/linkedin/login');
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.open(data.auth_url, '_blank', 'width=600,height=700');
        }
      }
    } catch (err) {
      console.error('LinkedIn OAuth trigger error:', err);
      window.location.href = '/api/linkedin/login?redirect=true';
    }
  };

  const handleSyncLinkedIn = async () => {
    setIsSyncingLinkedin(true);
    try {
      await triggerLinkedInSync();
      await loadLinkedInData();
    } catch (err) {
      console.error('Manual LinkedIn Sync failed:', err);
    } finally {
      setIsSyncingLinkedin(false);
    }
  };

  const handleSaveLinkedInToken = async () => {
    if (!inputLinkedinToken.trim()) return;
    try {
      await saveLinkedInAccessToken(inputLinkedinToken);
      setLinkedinTokenSuccess('LinkedIn Access Token saved & company telemetry updated!');
      setTimeout(() => {
        setShowLinkedinTokenModal(false);
        setLinkedinTokenSuccess('');
        setInputLinkedinToken('');
      }, 1500);
      await loadLinkedInData();
    } catch (err) {
      console.error('Error saving LinkedIn access token:', err);
    }
  };

  useEffect(() => {
    if (window.location.search || window.location.hash) {
      setIsMetaConnected(true);
      if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }, []);

  const [metaNotice, setMetaNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_connected') === 'true') {
      setMetaNotice('Meta Business Portfolio connected successfully!');
      setIsMetaConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error')) {
      setMetaNotice('Meta Session notice: Token re-authentication or update required. Please use "Update Access Token" button.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    async function initData() {
      setLoading(true);
      await loadMetaSaaSData();
      await loadGoogleData();
      await loadLinkedInData();
      try {
        const res = await fetch('/api/marketing');
        if (res.ok) {
          const json = await res.json();
          setCrmMarketingData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [userRole]);

  // Connect Meta Account Trigger
  const handleConnectMetaAccount = async () => {
    try {
      const res = await fetch('/api/meta/login');
      if (res.ok) {
        const data = await res.json();
        if (data.oauth_url) {
          window.location.href = data.oauth_url;
        } else {
          setAuthModalPlatform({
            id: 'meta',
            name: 'Meta Business Suite & Instagram',
            oauthData: data
          });
        }
      } else {
        setAuthModalPlatform({ id: 'meta', name: 'Meta Business Suite & Instagram' });
      }
    } catch (err) {
      console.warn('Meta login endpoint error:', err);
      setAuthModalPlatform({ id: 'meta', name: 'Meta Business Suite & Instagram' });
    }
  };

  // Manual Synchronization Engine
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/meta/refresh', { method: 'POST' });
      const json = await res.json();

      if (json.status === 'RECONNECT_REQUIRED') {
        alert(`⚠️ ${json.message}`);
        setShowTokenModal(true);
      } else if (json.success) {
        await loadMetaSaaSData();
      } else {
        alert(`Sync Notice: ${json.message || 'Synchronization encounter issues.'}`);
      }
    } catch (err) {
      alert('Synchronization Failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Fresh Access Token
  const handleSaveToken = async () => {
    if (!inputToken || inputToken.trim().length < 20) {
      setTokenError('Please paste a valid Meta User Access Token.');
      return;
    }

    setIsSavingToken(true);
    setTokenError('');
    setTokenSuccess('');

    try {
      const res = await fetch('/api/meta/token/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: inputToken.trim() })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTokenSuccess(`✅ ${json.message}`);
        setIsMetaConnected(true);
        await loadMetaSaaSData();
        setTimeout(() => {
          setShowTokenModal(false);
          setInputToken('');
          setTokenSuccess('');
        }, 1500);
      } else {
        setTokenError(json.error || 'Failed to update access token.');
      }
    } catch (err) {
      setTokenError('Network Error: ' + err.message);
    } finally {
      setIsSavingToken(false);
    }
  };

  // Reply Handler
  const handleSendReply = async () => {
    if (!replyText || !activeMessage) return;
    alert(`Reply sent to ${activeMessage.sender_name}: "${replyText}"`);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Loading Omnichannel Marketing SaaS Telemetry...</p>
      </div>
    );
  }

  const portfolio = metaSaaSData?.portfolio;
  const instagram = metaSaaSData?.instagram;
  const insights = metaSaaSData?.instagram_insights;
  const campaigns = metaSaaSData?.campaigns || [];
  const leads = metaSaaSData?.leads || [];
  const messages = metaSaaSData?.messages || [];
  const comments = metaSaaSData?.comments || [];
  const reviews = metaSaaSData?.reviews || [];

  const fbMessages = messages.filter(m => m.platform?.toLowerCase().includes('facebook') || m.platform?.toLowerCase().includes('messenger') || !m.platform?.toLowerCase().includes('instagram'));
  const fbComments = comments.filter(c => c.platform?.toLowerCase().includes('facebook') || !c.platform?.toLowerCase().includes('instagram'));
  const igComments = comments.filter(c => c.platform?.toLowerCase().includes('instagram'));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Meta Notice Alert Banner */}
      {metaNotice && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <span className="font-bold flex items-center gap-2">
            <span>ℹ️</span> {metaNotice}
          </span>
          <button
            onClick={() => setMetaNotice(null)}
            className="px-2 py-0.5 font-black text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* Executive SaaS Header Ribbon (Matches Screenshot Header) */}
      <div className="card-base border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="hidden sm:flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  CODIGIX SaaS Enterprise OS
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Live API Telemetry
                </span>
              </div>
              <h1 className="text-base sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Marketing & Brand Intelligence Hub
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Real-time multi-platform telemetry across Meta Business, LinkedIn Corporate, and Google Business Profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 w-full md:w-auto">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Refreshing All APIs...' : 'Refresh Live Metrics'}</span>
              <span className="sm:hidden">{isSyncing ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>

            <button
              onClick={() => setShowTokenModal(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span className="text-amber-500">⚡</span>
              <span>Webhook Setup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Flex Layout: Content Views (Left) & Vertical Navigation Tabs (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Modular Platform Content Views */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {activeTab === 'meta' && (
            <MetaBusinessView
              metaSubTab={metaSubTab}
              setMetaSubTab={setMetaSubTab}
              portfolio={portfolio}
              metaSaaSData={metaSaaSData}
              metaStatus={metaStatus}
              pages={metaSaaSData?.pages || []}
              campaigns={campaigns}
              leads={leads}
              fbMessages={fbMessages}
              messages={messages}
              activeMessage={activeMessage}
              setActiveMessage={setActiveMessage}
              replyText={replyText}
              setReplyText={setReplyText}
              handleGenerateAI={null}
              handleSendReply={handleSendReply}
              reviews={reviews}
              comments={comments}
              fbComments={fbComments}
              instagram={instagram}
              insights={insights}
              igComments={igComments}
              handleConnectMetaAccount={handleConnectMetaAccount}
            />
          )}

          {activeTab === 'linkedin' && (
            <LinkedInView
              isLinkedinConnected={isLinkedinConnected}
              linkedinData={linkedinData}
              isSyncingLinkedin={isSyncingLinkedin}
              handleSyncLinkedIn={handleSyncLinkedIn}
              handleConnectLinkedInAccount={handleConnectLinkedInAccount}
              setShowLinkedinTokenModal={setShowLinkedinTokenModal}
            />
          )}

          {activeTab === 'gmb' && (
            <GMBView
              isGoogleConnected={isGoogleConnected}
              googleData={googleData}
              isSyncingGoogle={isSyncingGoogle}
              handleSyncGoogle={handleSyncGoogle}
              handleConnectGoogleAccount={handleConnectGoogleAccount}
              setShowGoogleTokenModal={setShowGoogleTokenModal}
            />
          )}

          {activeTab === 'website' && (
            <WebsiteView />
          )}
        </div>

        {/* Right Side: Navigation Tabs Sidebar (Horizontal pill bar on mobile, vertical sidebar on desktop) */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 space-y-3 order-first lg:order-last">
          <div className="card-base border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3">
            <div className="hidden sm:flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Navigation Tabs</h3>
                <p className="text-[11px] text-slate-500 font-medium">Select platform view</p>
              </div>
            </div>

            <div className="flex flex-row overflow-x-auto lg:flex-col gap-2 pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: 'meta', label: 'Meta Business', icon: <MetaLogo className="w-5 h-5" />, subtitle: 'Facebook, IG, WhatsApp & Ads', badge: 'Flagship' },
                { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInLogo className="w-5 h-5" />, subtitle: 'Company Page & B2B', badge: 'Active' },
                { id: 'gmb', label: 'Google Business', icon: <GoogleGmbLogo className="w-5 h-5" />, subtitle: '13-Phase Location Sync', badge: 'Synced' },
                { id: 'website', label: 'Website & GA4', icon: <GA4TrafficLogo className="w-5 h-5" />, subtitle: 'Analytics & Traffic', badge: 'Live' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-auto min-w-[160px] sm:min-w-0 lg:w-full text-left p-2.5 sm:p-3.5 rounded-2xl transition-all flex items-center justify-between shrink-0 group ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base p-1.5 rounded-xl bg-white/20 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        {tab.icon}
                      </span>
                      <div>
                        <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </h4>
                        <p className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                          {tab.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 hidden lg:block transition-transform ${isActive ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                      }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals for OAuth & Token Dialogs */}
      <MarketingModals
        authModalPlatform={authModalPlatform}
        setAuthModalPlatform={setAuthModalPlatform}
        showTokenModal={showTokenModal}
        setShowTokenModal={setShowTokenModal}
        inputToken={inputToken}
        setInputToken={setInputToken}
        tokenError={tokenError}
        tokenSuccess={tokenSuccess}
        isSavingToken={isSavingToken}
        handleSaveToken={handleSaveToken}
        handleConnectMetaAccount={handleConnectMetaAccount}
        showGoogleTokenModal={showGoogleTokenModal}
        setShowGoogleTokenModal={setShowGoogleTokenModal}
        inputGoogleToken={inputGoogleToken}
        setInputGoogleToken={setInputGoogleToken}
        googleTokenSuccess={googleTokenSuccess}
        handleSaveGoogleToken={handleSaveGoogleToken}
        handleConnectGoogleAccount={handleConnectGoogleAccount}
        showLinkedinTokenModal={showLinkedinTokenModal}
        setShowLinkedinTokenModal={setShowLinkedinTokenModal}
        inputLinkedinToken={inputLinkedinToken}
        setInputLinkedinToken={setInputLinkedinToken}
        linkedinTokenSuccess={linkedinTokenSuccess}
        handleSaveLinkedInToken={handleSaveLinkedInToken}
        handleConnectLinkedInAccount={handleConnectLinkedInAccount}
      />

      {/* ── Floating Filter Button (Mobile Only: lg:hidden) ── */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-20 right-4 z-40 lg:hidden p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all scale-100 active:scale-95 border-2 border-white dark:border-slate-900 cursor-pointer"
        title="Open Marketing Filters"
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
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Marketing Filters & Platforms</h3>
              </div>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Platform Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Select Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'meta', label: 'Meta Business' },
                    { id: 'linkedin', label: 'LinkedIn Corp' },
                    { id: 'gmb', label: 'Google Business' },
                    { id: 'website', label: 'GA4 Analytics' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveTab(p.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all ${
                        activeTab === p.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Tab Filter for Meta */}
              {activeTab === 'meta' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Meta Sub-View</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'overview', label: 'Dashboard' },
                      { id: 'facebook', label: 'Facebook' },
                      { id: 'instagram', label: 'Instagram' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'ads', label: 'Meta Ads' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setMetaSubTab(tab.id)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border text-center cursor-pointer transition-all truncate ${
                          metaSubTab === tab.id
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('meta');
                  setMetaSubTab('overview');
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
