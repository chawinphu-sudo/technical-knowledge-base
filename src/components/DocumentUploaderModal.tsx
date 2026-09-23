import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Terminal,
  BookmarkPlus
} from 'lucide-react';
import { KnowledgeCase, VendorType } from '../types';
import { parseLocalMarkdownOrText } from '../utils/localParser';

interface DocumentUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCase: (caseData: Partial<KnowledgeCase>) => void;
}

export const DocumentUploaderModal: React.FC<DocumentUploaderModalProps> = ({
  isOpen,
  onClose,
  onSaveCase,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorType>('Nutanix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSaved, setSuccessSaved] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<KnowledgeCase> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setParsedPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      // Auto-detect vendor if mentioned
      const lower = text.toLowerCase();
      if (lower.includes('nutanix') || lower.includes('cvm') || lower.includes('ahv')) {
        setSelectedVendor('Nutanix');
      } else if (lower.includes('lenovo') || lower.includes('thinksystem') || lower.includes('xcc')) {
        setSelectedVendor('Lenovo');
      }
    };
    reader.onerror = () => {
      setErrorMsg('ไม่สามารถอ่านไฟล์ได้');
    };
    reader.readAsText(file);
  };

  const handleProcessDocument = async () => {
    if (!fileContent.trim()) {
      setErrorMsg('กรุณาเลือกไฟล์เอกสาร หรือวางเนื้อหา KB');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Try server-side AI structured extraction first
      const res = await fetch('/api/ai/extract-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: fileContent.slice(0, 15000), // Protect token window
          vendor: selectedVendor,
          originalQuery: fileName || 'Uploaded Document',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.caseData && data.caseData.title) {
          setParsedPreview(data.caseData);
          setIsProcessing(false);
          return;
        }
      }

      // 2. Fallback to client-side heuristic parser if offline or AI quota issue
      console.warn('AI extraction endpoint returned non-ok, falling back to local text parser');
      const localResult = parseLocalMarkdownOrText(fileContent, selectedVendor);
      setParsedPreview(localResult);
    } catch (err: any) {
      console.warn('Network error during AI extraction, using local parser:', err);
      const localResult = parseLocalMarkdownOrText(fileContent, selectedVendor);
      setParsedPreview(localResult);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = () => {
    if (!parsedPreview) return;

    onSaveCase({
      ...parsedPreview,
      vendor: selectedVendor,
      author: 'Uploaded KB Document',
      updatedAt: new Date().toISOString(),
    });

    setSuccessSaved(true);
    setTimeout(() => {
      onClose();
      setSuccessSaved(false);
      setParsedPreview(null);
      setFileContent('');
      setFileName('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div
        className="relative bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-xs">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  อัปโหลดเอกสาร & แปลงเป็นฐานข้อมูลเคสในระบบ
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Auto-Convert
                </span>
              </div>
              <p className="text-xs text-slate-400">
                รองรับไฟล์ Markdown (.md), Text (.txt), Log หรือวางเนื้อหาบทความที่ดาวน์โหลดมาจากเว็บ Nutanix / Lenovo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>เลือกไฟล์ (.md / .txt / .log)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>คัดลอกข้อความมาวางตรงๆ (Paste Text)</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vendor Choice */}
          <div className="flex items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300">
              ระบุผู้ผลิต / โครงสร้างระบบ (Vendor):
            </span>
            <div className="flex gap-2">
              {(['Nutanix', 'Lenovo', 'General'] as VendorType[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedVendor(v)}
                  className={`px-3 py-1 rounded-lg font-semibold border text-xs transition ${
                    selectedVendor === v
                      ? v === 'Nutanix'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : v === 'Lenovo'
                        ? 'bg-red-600 text-white border-red-500 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Input Method: File or Paste */}
          {activeTab === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 bg-slate-950/40 hover:bg-slate-950/70 rounded-2xl p-8 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.log,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {fileName ? fileName : 'คลิกเพื่อเลือกไฟล์เอกสาร KB หรือลากไฟล์มาวางที่นี่'}
              </h3>
              <p className="text-slate-400 text-2xs">
                รองรับไฟล์บทความ Markdown (.md), ข้อความ (.txt), หรือบันทึกขั้นตอน CLI (.log)
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                วางข้อความบทความ KB, สรุปปัญหา หรือคู่มือจากเว็บ:
              </label>
              <textarea
                rows={8}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="วางเนื้อหาบทความ KB หรือ Log อาการปัญหาที่นี่ เช่น:
# Nutanix CVM Stargate Unresponsive
Symptoms: Stargate service down after disk failure
Root cause: Disk metadata timeout
Steps:
1. Check service: cluster status
2. Restart genesis: genesis restart..."
                className="w-full text-xs font-mono p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action Trigger Button */}
          {!parsedPreview && fileContent && (
            <button
              type="button"
              onClick={handleProcessDocument}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-950/40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ระบบ AI กำลังวิเคราะห์และจัดโครงสร้างเคส...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>แปลงข้อความเป็นโครงสร้างฐานข้อมูล (Parse to Case)</span>
                </>
              )}
            </button>
          )}

          {/* Preview of Parsed Result */}
          {parsedPreview && (
            <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm">
                    แปลงข้อมูลเป็นโครงสร้างฐานข้อมูลสำเร็จ!
                  </span>
                </div>
                <span className="text-2xs text-slate-400 font-mono">
                  {parsedPreview.resolutionSteps?.length || 0} ขั้นตอนแก้ไข
                </span>
              </div>

              {/* Card preview */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-2xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {parsedPreview.category || 'General System'}
                      </span>
                      {parsedPreview.errorCode && (
                        <span className="font-mono text-2xs text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800/80">
                          {parsedPreview.errorCode}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {parsedPreview.title}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-2xs">
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200/90">
                    <strong>อาการ:</strong> {parsedPreview.symptoms}
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-blue-200/90">
                    <strong>สาเหตุ:</strong> {parsedPreview.rootCause}
                  </div>
                </div>

                {/* Steps preview */}
                {parsedPreview.resolutionSteps && parsedPreview.resolutionSteps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                      ขั้นตอนการแก้ไข (ตัวอย่างขั้นตอนแรก):
                    </span>
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <div className="font-bold text-slate-200 text-xs">
                        1. {parsedPreview.resolutionSteps[0].title}
                      </div>
                      <div className="text-2xs text-slate-400">
                        {parsedPreview.resolutionSteps[0].instruction}
                      </div>
                      {parsedPreview.resolutionSteps[0].commands && (
                        <div className="font-mono text-3xs text-emerald-400 bg-black/60 p-1.5 rounded">
                          {parsedPreview.resolutionSteps[0].commands.join(' && ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Save into Database Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setParsedPreview(null)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition text-center"
                >
                  เลือกหรือวางเนื้อหาใหม่
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={successSaved}
                  className="flex-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  {successSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>บันทึกเข้าฐานข้อมูลเรียบร้อยแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-4 w-4" />
                      <span>บันทึกเคสนี้เข้าสู่ฐานข้อมูลระบบ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-2xs text-slate-400">
          <span>* เอกสารจะถูกสกัดเป็น Resolution Steps, Commands และ Symptoms เข้าคลังทันที</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
