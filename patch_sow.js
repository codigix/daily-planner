const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

// 1. Add import JoditEditor
content = content.replace(
  "import React, { useState, useRef, useEffect } from 'react';",
  "import React, { useState, useRef, useEffect, useMemo } from 'react';\nimport JoditEditor from 'jodit-react';"
);

// 2. Add new fields to quotationData
content = content.replace(
  "deliverables: [",
  "scopeOfWorkHtml: '<p>Enter your detailed scope of work here, including tables...</p>',\n    sowMode: 'advanced',\n    deliverables: ["
);

// 3. Update the form section 4
const oldFormSection = `{activeSection === 'deliverables' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    {quotationData.deliverables.map((item, index) => {`;

const newFormSection = `{activeSection === 'deliverables' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="sowMode"
                          checked={quotationData.sowMode === 'simple'}
                          onChange={() => setQuotationData(prev => ({...prev, sowMode: 'simple'}))}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Simple Grid Mode</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="sowMode"
                          checked={quotationData.sowMode === 'advanced'}
                          onChange={() => setQuotationData(prev => ({...prev, sowMode: 'advanced'}))}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Advanced Editor Mode</span>
                      </label>
                    </div>

                    {quotationData.sowMode === 'advanced' ? (
                      <div className="mt-2 text-slate-900">
                        <JoditEditor
                          value={quotationData.scopeOfWorkHtml}
                          config={{ readonly: false, height: 400 }}
                          onBlur={newContent => setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: newContent }))}
                        />
                      </div>
                    ) : (
                    <div className="space-y-2">
                    {quotationData.deliverables.map((item, index) => {`;

content = content.replace(oldFormSection, newFormSection);

// 4. Close the parenthesis for the simple mode div
const oldFormClose = `+ Add Heading
                      </button>
                    </div>
                  </div>
                )}`;

const newFormClose = `+ Add Heading
                      </button>
                    </div>
                    </div>
                    )}
                  </div>
                )}`;

content = content.replace(oldFormClose, newFormClose);

// 5. Update the Preview render section
const oldPreview = `{/* ================= PAGE 4+: SCOPE OF WORK (LAYOUT ADAPTIVE & DYNAMIC PAGINATION) ================= */}
           {(() => {
             const rawItems = quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs'];`;

const newPreview = `{/* ================= PAGE 4+: SCOPE OF WORK (LAYOUT ADAPTIVE & DYNAMIC PAGINATION) ================= */}
           {quotationData.sowMode === 'advanced' ? (
              <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-md-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
                  <div className="p-8 space-y-6 flex-1">
                     <div>
                       <h2 className="text-2xl font-black" style={{ color: currentTheme.primaryColor }}>Scope of Work & Deliverables</h2>
                     </div>
                     <div 
                        className="jodit-preview-content prose max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: quotationData.scopeOfWorkHtml }}
                     />
                  </div>
                  {/* Page Footer */}
                  <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center z-10 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400">Page 4</span>
                    <img src={quotationData.logoUrl || "/codigix-logo.svg"} alt="Logo" className="h-4 object-contain opacity-50 grayscale" />
                  </div>
              </div>
           ) : (() => {
             const rawItems = quotationData.deliverables.filter(Boolean).length > 0 ? quotationData.deliverables.filter(Boolean) : ['UI/UX Design', 'Mobile App Development', 'Super Admin Web Panel', 'Backend REST APIs'];`;

content = content.replace(oldPreview, newPreview);

// 6. Close the ternary condition
content = content.replace(
  `})()}


           {/* ================= PAGE 5: TEAM & INTEGRATIONS ================= */}`,
  `})()}
           }


           {/* ================= PAGE 5: TEAM & INTEGRATIONS ================= */}`
);

fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Patched CreateQuotationView.jsx');
