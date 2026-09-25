const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/CreateQuotationView.jsx', 'utf8');

if (!content.includes("import JoditEditor from 'jodit-react';")) {
  content = content.replace(
    "import { toJpeg } from 'html-to-image';",
    "import { toJpeg } from 'html-to-image';\nimport JoditEditor from 'jodit-react';"
  );
  fs.writeFileSync('frontend/src/pages/CreateQuotationView.jsx', content);
  console.log('Added JoditEditor import');
}
