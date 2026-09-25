const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

const regexDeliverables = /\{activeSection === 'deliverables' && \(\s*<div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">\s*\{quotationData\.deliverables\.map\(\(item, index\) => \{/;

const replacementDeliverables = `{activeSection === 'deliverables' && (
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
                      <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-900/20">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center max-w-sm">
                          Advanced mode allows you to use a full rich-text editor with tables, lists, and deep formatting.
                        </p>
                        <button 
                          onClick={() => {
                            sowContentRef.current = quotationData.scopeOfWorkHtml;
                            setShowSowModal(true);
                          }}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                          <Layout className="w-4 h-4" /> Open Full-Page Editor
                        </button>
                      </div>
                    ) : (
                    <div className="space-y-2">
                    {quotationData.deliverables.map((item, index) => {`;

content = content.replace(regexDeliverables, replacementDeliverables);

const regexCloseForm = /\+ Add Heading\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/;
const replaceCloseForm = `+ Add Heading
                      </button>
                    </div>
                    </div>
                    )}
                  </div>
                )}`;

content = content.replace(regexCloseForm, replaceCloseForm);


const regexPreview = /\{\/\* ================= PAGE 4\+: SCOPE OF WORK \(LAYOUT ADAPTIVE & DYNAMIC PAGINATION\) ================= \*\/\}\s*\{\(\(\) => \{/;

const replacePreview = `{/* ================= PAGE 4+: SCOPE OF WORK (LAYOUT ADAPTIVE & DYNAMIC PAGINATION) ================= */}
           {quotationData.sowMode === 'advanced' ? (
              <div className="proposal-page w-full max-w-[800px] aspect-square min-h-[800px] bg-white text-[#1E293B] shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between relative border border-[#E2E8F0] shrink-0">
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
           ) : (() => {`;

content = content.replace(regexPreview, replacePreview);

const regexClosePreview = /\}\)\(\)\}\s*\{\/\* ================= PAGE 5: TEAM & INTEGRATIONS \(LAYOUT ADAPTIVE\) ================= \*\/\}/;
const replaceClosePreview = `})()}
           }

           {/* ================= PAGE 5: TEAM & INTEGRATIONS (LAYOUT ADAPTIVE) ================= */}`;
content = content.replace(regexClosePreview, replaceClosePreview);

// Add the modal JSX at the very end before the final `</div>\n    </div>\n  );\n}`
const modalJSX = `
      {/* SOW Full Page Modal */}
      {showSowModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex flex-col">
          <div className="flex-1 bg-white dark:bg-slate-900 w-full h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Advanced Scope of Work Editor</h2>
                <p className="text-xs text-slate-500">Add tables, formatting, and rich text deliverables.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSowModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: sowContentRef.current }));
                    setShowSowModal(false);
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Content
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto bg-slate-50 dark:bg-slate-950 text-slate-900">
              <div className="max-w-[1000px] mx-auto h-full">
                <JoditEditor
                  value={quotationData.scopeOfWorkHtml}
                  config={{ 
                    readonly: false, 
                    height: 600,
                    minHeight: 500,
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    defaultActionOnPaste: 'insert_as_html',
                    uploader: { insertImageAsBase64URI: true }
                  }}
                  onChange={newContent => { sowContentRef.current = newContent; }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/<\/div>\s*<\/div>\s*\);\s*\}/, modalJSX + `    </div>\n    </div>\n  );\n}`);

fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Restored SOW Modals and Views properly');
