// Dependency-free reader for .xlsx and .csv uploads.
// Returns the first worksheet as an array of rows, each row an array of cell values
// (strings, or numbers for numeric cells — Excel dates/times arrive as serial numbers).
const zlib = require('zlib');

// ── ZIP (via the central directory, so entries using data descriptors work too) ──
function readZipEntries(buffer) {
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .xlsx file (zip directory not found)');

  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const files = {};

  for (let n = 0; n < entryCount; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);

    const localNameLen = buffer.readUInt16LE(localOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buffer.subarray(dataStart, dataStart + compSize);

    if (method === 0) files[name] = raw.toString('utf8');
    else if (method === 8) files[name] = zlib.inflateRawSync(raw).toString('utf8');

    offset += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

function decodeXml(str) {
  return String(str || '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Concatenate every <t> run inside a fragment (handles rich-text shared strings)
function textRuns(xml) {
  const parts = [];
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let m;
  while ((m = re.exec(xml))) parts.push(decodeXml(m[1]));
  return parts.join('');
}

function columnIndex(ref) {
  const letters = ref.replace(/[0-9]/g, '');
  let idx = 0;
  for (const ch of letters) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function firstSheetPath(files) {
  const workbook = files['xl/workbook.xml'] || '';
  const rels = files['xl/_rels/workbook.xml.rels'] || '';
  const sheetTag = workbook.match(/<sheet\s[^>]*>/);
  const ridMatch = sheetTag && sheetTag[0].match(/r:id="([^"]+)"/);
  if (ridMatch) {
    const relRe = new RegExp(`<Relationship\\s[^>]*Id="${ridMatch[1]}"[^>]*>`);
    const rel = rels.match(relRe);
    const target = rel && rel[0].match(/Target="([^"]+)"/);
    if (target) {
      const t = target[1].replace(/^\//, '');
      return t.startsWith('xl/') ? t : `xl/${t}`;
    }
  }
  return 'xl/worksheets/sheet1.xml';
}

function parseXlsxBuffer(buffer) {
  const files = readZipEntries(buffer);
  const sheetXml = files[firstSheetPath(files)];
  if (!sheetXml) throw new Error('No worksheet found in the Excel file');

  const shared = [];
  const sst = files['xl/sharedStrings.xml'];
  if (sst) {
    const siRe = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRe.exec(sst))) shared.push(textRuns(m[1]));
  }

  const rows = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(sheetXml))) {
    const row = [];
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cell;
    while ((cell = cellRe.exec(rowMatch[1]))) {
      const attrs = cell[1];
      const inner = cell[2] || '';
      const ref = (attrs.match(/\br="([A-Z]+\d+)"/) || [])[1];
      const type = (attrs.match(/\bt="([^"]+)"/) || [])[1] || 'n';
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];

      let value = '';
      if (type === 's') value = shared[parseInt(v, 10)] ?? '';
      else if (type === 'inlineStr') value = textRuns(inner);
      else if (type === 'str' || type === 'e') value = decodeXml(v || '');
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
      else if (v !== undefined && v !== '') value = Number(v);

      const col = ref ? columnIndex(ref) : row.length;
      row[col] = value;
    }
    rows.push(Array.from(row, (c) => (c === undefined ? '' : c)));
  }
  return rows;
}

// RFC 4180-style CSV (quoted fields, escaped quotes, CRLF/LF, optional BOM)
function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function parseSpreadsheet(buffer, fileName = '') {
  if (/\.csv$/i.test(fileName)) return parseCsvBuffer(buffer);
  if (/\.xls$/i.test(fileName)) throw new Error('Old .xls format is not supported — save the sheet as .xlsx or .csv');
  return parseXlsxBuffer(buffer);
}

module.exports = { parseSpreadsheet, parseXlsxBuffer, parseCsvBuffer };
