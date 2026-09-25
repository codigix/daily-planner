const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

// 1. Add the ref
content = content.replace(
  "const [showSowModal, setShowSowModal] = useState(false);",
  "const [showSowModal, setShowSowModal] = useState(false);\n  const sowContentRef = useRef('');"
);

// 2. Update the "Open Full-Page Editor" button
content = content.replace(
  "setTempSowHtml(quotationData.scopeOfWorkHtml);\n                            setShowSowModal(true);",
  "sowContentRef.current = quotationData.scopeOfWorkHtml;\n                            setShowSowModal(true);"
);

// 3. Update the Save button in the modal
content = content.replace(
  "setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: tempSowHtml }));\n                    setShowSowModal(false);",
  "setQuotationData(prev => ({ ...prev, scopeOfWorkHtml: sowContentRef.current }));\n                    setShowSowModal(false);"
);

// 4. Update the JoditEditor config and handlers
const oldJodit = `<JoditEditor
                  value={tempSowHtml}
                  config={{ 
                    readonly: false, 
                    height: 600,
                    minHeight: 500,
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    defaultActionOnPaste: 'insert_as_html',
                    uploader: { insertImageAsBase64URI: true }
                  }}
                  onBlur={newContent => setTempSowHtml(newContent)}
                />`;

const newJodit = `<JoditEditor
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
                />`;

content = content.replace(oldJodit, newJodit);

fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
console.log('Patched JoditEditor for Ref-based state');
