const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

// 1. Add state for the modal
content = content.replace(
  "const [activeSection, setActiveSection] = useState('cover');",
  "const [activeSection, setActiveSection] = useState('cover');\n  const [showSowModal, setShowSowModal] = useState(false);\n  const [tempSowHtml, setTempSowHtml] = useState('');"
);

// 2. Replace the embedded editor with a button to open the modal
const oldEditorSection = `{quotationData.sowMode === 'advanced' ? (
                      <div className="mt-2 text-slate-900">
                        <JoditEditor
                          value={quotationData.scopeOfWorkHtml}
                          config={{ readonly: false, height: 400 }}
                          onBlur={newContent => setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: newContent }))}
                        />
                      </div>
                    ) : (`;

const newEditorSection = `{quotationData.sowMode === 'advanced' ? (
                      <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-md bg-blue-50/50 dark:bg-blue-900/20">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 text-center max-w-sm">
                          Advanced mode allows you to use a full rich-text editor with tables, lists, and deep formatting.
                        </p>
                        <button 
                          onClick={() => {
                            setTempSowHtml(quotationData.scopeOfWorkHtml);
                            setShowSowModal(true);
                          }}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md-lg shadow-sm transition-all flex items-center gap-2"
                        >
                          <Layout className="w-4 h-4" /> Open Full-Page Editor
                        </button>
                      </div>
                    ) : (`;

content = content.replace(oldEditorSection, newEditorSection);

// 3. Add the Modal at the bottom of the component (before the final closing div/return)
// The last closing tag of the component return is usually at the bottom.
// Let's insert the modal right before the final `</div>\n    </div>\n  );\n}` or similar.
const modalCode = `
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
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: tempSowHtml }));
                    setShowSowModal(false);
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-md-lg shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Content
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto bg-slate-50 dark:bg-slate-950 text-slate-900">
              <div className="max-w-[1000px] mx-auto h-full">
                <JoditEditor
                  value={tempSowHtml}
                  config={{ 
                    readonly: false, 
                    height: 'calc(100vh - 180px)',
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    defaultActionOnPaste: 'insert_as_html',
                    uploader: { insertImageAsBase64URI: true }
                  }}
                  onChange={newContent => setTempSowHtml(newContent)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "    </div>\n  );\n}",
  modalCode + "\n    </div>\n  );\n}"
);

fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Patched CreateQuotationView.jsx for modal');
