import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Copy, ArrowLeft } from 'lucide-react';
import { importDietItemsAPI } from '../../services/api';
import { fileToBase64, formatTime12 } from '../../utils/dietItems';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const STATUS_STYLE = {
  ready: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  imported: { label: 'Imported', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  duplicate: { label: 'Already exists', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  error: { label: 'Needs fixing', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' }
};

const whenLabel = (item) => {
  if (item.repeat === 'daily') return 'Every day';
  if (item.repeat === 'weekly') return item.day ? `Every ${item.day}` : '—';
  return item.date || '—';
};

export default function DietImportModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const base64Ref = useRef('');

  useEffect(() => {
    if (open) {
      setFile(null);
      setPreview(null);
      setError('');
      base64Ref.current = '';
    }
  }, [open]);

  if (!open) return null;

  const pickFile = async (f) => {
    setError('');
    setPreview(null);
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) {
      setError('Choose an Excel (.xlsx) or CSV file. For old .xls files, open them in Excel and "Save As" .xlsx.');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('File is larger than 5 MB. Split it into smaller sheets.');
      return;
    }
    setFile(f);
    setBusy(true);
    try {
      base64Ref.current = await fileToBase64(f);
      const res = await importDietItemsAPI(f.name, base64Ref.current, true);
      if (!res.ok) setError(res.data.error || 'Could not read this file');
      else setPreview(res.data);
    } catch (e) {
      setError('Could not read this file');
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    setBusy(true);
    const res = await importDietItemsAPI(file.name, base64Ref.current, false);
    setBusy(false);
    if (!res.ok) {
      setError(res.data.error || 'Import failed');
      return;
    }
    setPreview(res.data);
    onImported?.(res.data.summary.imported);
  };

  const summary = preview?.summary;
  const done = preview && !preview.dryRun;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />Import diet plan from Excel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Upload a sheet, check the preview, then import.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto min-h-0">
          {error && (
            <div role="alert" className="p-3 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {!preview && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Upload className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {busy ? `Reading ${file?.name}…` : 'Drop your Excel file here, or click to choose'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">.xlsx or .csv, up to 5 MB and 1,000 rows</p>
                <input ref={inputRef} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden" onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ''; }} />
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Columns the sheet should have</p>
                  <a href="/templates/diet_items_template.xlsx" download
                    className="px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-md flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/25">
                    <Download className="w-3.5 h-3.5" />Download template
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {['Date', 'Day', 'Time *', 'Title *', 'Type', 'Repeat', 'Ingredients / Details', 'Instructions', 'Reminder (min)'].map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{c}</span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Fill <b>Date</b> for one-time items (2026-10-05 or 05/10/2026) or <b>Day</b> (e.g. Monday) for weekly ones.
                  Time can be 07:30 or 7:30 AM. Rows that already exist are skipped, so re-importing the same sheet is safe.
                </p>
              </div>
            </>
          )}

          {preview && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                <span className="text-slate-700 dark:text-slate-200 mr-1 truncate max-w-full">{file?.name}</span>
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />{done ? `${summary.imported} imported` : `${summary.ready} ready`}
                </span>
                {summary.duplicates > 0 && (
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5" />{summary.duplicates} already exist
                  </span>
                )}
                {summary.errors > 0 && (
                  <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{summary.errors} need fixing
                  </span>
                )}
              </div>

              {done && (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                  {summary.imported > 0
                    ? `${summary.imported} item${summary.imported === 1 ? '' : 's'} added to your Diet & Wellness plan.`
                    : 'Nothing new to import.'}
                  {summary.errors > 0 && ' Fix the rows marked "Needs fixing" in your sheet and import it again — existing rows will be skipped.'}
                </div>
              )}

              {/* Phones: one card per row so titles and error messages are fully visible */}
              <ul className="sm:hidden space-y-2">
                {preview.rows.map((r) => {
                  const st = STATUS_STYLE[r.status] || STATUS_STYLE.error;
                  return (
                    <li key={r.rowNum} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {r.item.title || <span className="text-slate-400 font-bold">(no title)</span>}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${st.cls}`}>{st.label}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Row {r.rowNum} · {whenLabel(r.item)} · {r.item.time ? formatTime12(r.item.time) : 'no time'} · {r.item.category}
                      </div>
                      {r.errors.map((e) => (
                        <div key={e} className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-1">{e}</div>
                      ))}
                    </li>
                  );
                })}
              </ul>

              <div className="hidden sm:block border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-left font-extrabold">Row</th>
                      <th className="px-3 py-2 text-left font-extrabold">Status</th>
                      <th className="px-3 py-2 text-left font-extrabold">When</th>
                      <th className="px-3 py-2 text-left font-extrabold">Time</th>
                      <th className="px-3 py-2 text-left font-extrabold">Title</th>
                      <th className="px-3 py-2 text-left font-extrabold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.rows.map((r) => {
                      const st = STATUS_STYLE[r.status] || STATUS_STYLE.error;
                      return (
                        <tr key={r.rowNum} className="align-top text-slate-700 dark:text-slate-200">
                          <td className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">{r.rowNum}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{whenLabel(r.item)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.item.time ? formatTime12(r.item.time) : '—'}</td>
                          <td className="px-3 py-2 min-w-[160px]">
                            <div className="font-bold">{r.item.title || <span className="text-slate-400">(no title)</span>}</div>
                            {r.errors.map((e) => (
                              <div key={e} className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold mt-0.5">{e}</div>
                            ))}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{r.item.category}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-800 shrink-0">
          {preview && !done && (
            <button onClick={() => { setPreview(null); setFile(null); }}
              className="mr-auto px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer min-h-[44px] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /><span className="sm:hidden">Back</span><span className="hidden sm:inline">Choose another file</span>
            </button>
          )}
          <button onClick={onClose}
            className={`${preview && !done ? 'hidden sm:block' : ''} px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer min-h-[44px]`}>
            {done ? 'Close' : 'Cancel'}
          </button>
          {preview && !done && (
            <button onClick={runImport} disabled={busy || summary.ready === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-md shadow-md cursor-pointer min-h-[44px] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
              <Upload className="w-4 h-4" />
              {busy ? 'Importing…' : summary.ready === 0 ? 'Nothing to import' : `Import ${summary.ready} item${summary.ready === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
