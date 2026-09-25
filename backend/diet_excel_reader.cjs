const fs = require('fs');
const zlib = require('zlib');

// Minimal ZIP reader for xlsx
function readZip(buffer) {
  const files = {};
  let offset = 0;
  while (offset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(offset);
    if (sig === 0x04034b50) { // Local file header
      const compMethod = buffer.readUInt16LE(offset + 8);
      const compSize = buffer.readUInt32LE(offset + 18);
      const nameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const fileName = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
      const dataStart = offset + 30 + nameLen + extraLen;
      const dataEnd = dataStart + compSize;
      const rawData = buffer.slice(dataStart, dataEnd);

      let uncompressedData;
      if (compMethod === 0) {
        uncompressedData = rawData;
      } else if (compMethod === 8) {
        try {
          uncompressedData = zlib.inflateRawSync(rawData);
        } catch (e) {
          // ignore
        }
      }
      if (uncompressedData) {
        files[fileName] = uncompressedData.toString('utf8');
      }
      offset = dataEnd;
    } else {
      offset++;
    }
  }
  return files;
}

function decodeXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseXlsx(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: `File not found: ${filePath}` };
  }
  const buf = fs.readFileSync(filePath);
  const files = readZip(buf);

  // Workbook sheets mapping
  const sheets = [];
  if (files['xl/workbook.xml']) {
    const wbXml = files['xl/workbook.xml'];
    const sheetTags = wbXml.match(/<sheet\s+[^>]*\/>/g) || [];
    sheetTags.forEach((st, idx) => {
      const nameMatch = st.match(/name="([^"]+)"/);
      const sheetIdMatch = st.match(/sheetId="([^"]+)"/);
      sheets.push({
        name: nameMatch ? nameMatch[1] : `Sheet${idx + 1}`,
        sheetId: sheetIdMatch ? sheetIdMatch[1] : `${idx + 1}`,
        file: `xl/worksheets/sheet${idx + 1}.xml`
      });
    });
  }

  const result = {
    sheetsMeta: sheets,
    sheetsData: {}
  };

  sheets.forEach(sheet => {
    const sheetXml = files[sheet.file];
    if (!sheetXml) return;

    const rows = [];
    const rowMatches = sheetXml.match(/<row\s+[^>]*>[\s\S]*?<\/row>/g) || [];
    for (const rowXml of rowMatches) {
      const rowNumMatch = rowXml.match(/r="(\d+)"/);
      const rowNum = rowNumMatch ? parseInt(rowNumMatch[1], 10) : rows.length + 1;
      const cellMatches = rowXml.match(/<c\s+[^>]*>[\s\S]*?<\/c>/g) || rowXml.match(/<c\s+[^>]*\/>/g) || [];
      const rowObj = {};
      
      for (const cellXml of cellMatches) {
        const cellRef = (cellXml.match(/r="([A-Z]+[0-9]+)"/) || [])[1];
        if (!cellRef) continue;
        const colLetter = cellRef.replace(/[0-9]/g, '');

        let cellText = '';
        // Check inlineStr <t>...</t> or <t ...>
        const tMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/i);
        if (tMatch) {
          cellText = decodeXmlEntities(tMatch[1]);
        } else {
          // Check <v>...</v>
          const vMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/i);
          if (vMatch) {
            cellText = decodeXmlEntities(vMatch[1]);
          } else {
            // maybe <is><t> with attributes or other
            const isMatch = cellXml.match(/<is>([\s\S]*?)<\/is>/i);
            if (isMatch) cellText = decodeXmlEntities(isMatch[1].replace(/<[^>]+>/g, ''));
          }
        }
        rowObj[colLetter] = cellText;
      }
      rows.push({ rowNum, cells: rowObj });
    }
    result.sheetsData[sheet.name] = rows;
  });

  return result;
}

module.exports = {
  parseXlsx,
  decodeXmlEntities
};
