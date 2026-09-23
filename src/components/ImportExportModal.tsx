import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Check, AlertCircle, FileJson, ShieldAlert, FileText } from 'lucide-react';
import { KnowledgeCase } from '../types';
import { exportCasesAsJSON, validateImportedCases } from '../utils/storage';
import { downloadMultipleCasesAsMarkdown } from '../utils/kbExport';

interface ImportExportModalProps {
  isOpen: boolean;
  cases: KnowledgeCase[];
  onClose: () => void;
  onImportSuccess: (importedCases: KnowledgeCase[]) => void;
  onResetDefault: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  cases,
  onClose,
  onImportSuccess,
  onResetDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    exportCasesAsJSON(cases);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const validated = validateImportedCases(parsed);
        onImportSuccess(validated);
        setImportStatus({
          type: 'success',
          message: `นำเข้าข้อมูลสำเร็จทั้งหมด ${validated.length} เคส!`,
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err.message || 'โครงสร้างไฟล์ JSON ไม่ถูกต้อง',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="relative bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileJson className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-bold text-white">สำรองและนำเข้าข้อมูล (JSON)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-medium ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              }`}
            >
              {importStatus.type === 'success' ? (
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Export Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Download className="h-4 w-4 text-blue-400" /> ส่งออกไฟล์สำรอง (Export)
              </span>
              <span className="text-2xs text-slate-400 font-mono">{cases.length} เคส</span>
            </div>
            <p className="text-2xs text-slate-400">
              ดาวน์โหลดฐานข้อมูลทั้งหมดในรูปแบบไฟล์ JSON สามารถแชร์ให้ทีม IT หรือเก็บไว้เป็น Backup
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={handleExport}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs text-xs"
              >
                <Download className="h-4 w-4" />
                <span>โหลดไฟล์ JSON ({cases.length})</span>
              </button>

              <button
                type="button"
                onClick={() => downloadMultipleCasesAsMarkdown(cases, 'enterprise-kb-handbook')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs text-xs"
                title="ดาวน์โหลดเคสทั้งหมดรวมเป็นคู่มือ Markdown (.md)"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>โหลดคู่มือ .MD ({cases.length})</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-emerald-400" /> นำเข้าไฟล์ (Import JSON)
            </span>
            <p className="text-2xs text-slate-400">
              เลือกไฟล์ JSON ที่เคยบันทึกไว้ เพื่อนำข้อมูลเคสกลับเข้ามาในระบบ
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              <span>เลือกไฟล์ JSON จากเครื่อง</span>
            </button>
          </div>

          {/* Reset to Default */}
          <div className="pt-2 border-t border-slate-800">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-1.5 text-2xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>รีเซ็ตกลับเป็นเคสตัวอย่างมาตรฐาน (Nutanix & Lenovo)</span>
              </button>
            ) : (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3 space-y-2 text-rose-300">
                <span className="font-bold text-xs flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4 text-rose-400" /> ยืนยันการรีเซ็ต?
                </span>
                <p className="text-2xs text-rose-300/80">
                  ข้อมูลเคสที่สร้างใหม่จะถูกแทนที่ด้วยข้อมูลเคสเริ่มต้นของ Nutanix และ Lenovo
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium hover:bg-slate-700"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefault();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
                  >
                    ยืนยันรีเซ็ต
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition border border-slate-700"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
