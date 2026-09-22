import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Loader2,
  X,
  AlertCircle,
  BookOpen,
  Search,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { KnowledgeCase, VendorType } from '../types';

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToKnowledgeBase: (caseData: Partial<KnowledgeCase>) => void;
  initialQuery?: string;
  initialVendor?: VendorType | 'All';
}

export const AiSearchModal: React.FC<AiSearchModalProps> = ({
  isOpen,
  onClose,
  onSaveToKnowledgeBase,
  initialQuery = '',
  initialVendor = 'Nutanix',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [vendor, setVendor] = useState<VendorType>(
    initialVendor === 'All' ? 'Nutanix' : (initialVendor as VendorType)
  );
  const [errorCode, setErrorCode] = useState('');
  const [hardwareModel, setHardwareModel] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [resultText, setResultText] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && !errorCode.trim()) {
      setErrorMsg('กรุณากรอกอาการปัญหา ชื่อเคส หรือ Error Code');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResultText('');
    setSources([]);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/ai/search-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          vendor,
          errorCode: errorCode.trim(),
          hardwareModel: hardwareModel.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'ไม่สามารถดึงข้อมูลจากเว็บไซต์ทางการได้');
      }

      setResultText(data.text || '');
      setSources(data.sources || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToKB = async () => {
    if (!resultText) return;
    setIsExtracting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/ai/extract-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: resultText,
          originalQuery: query,
          vendor,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'ไม่สามารถสกัดข้อมูลเป็นโครงสร้างเคสได้');
      }

      const caseData: Partial<KnowledgeCase> = {
        ...data.caseData,
        referenceLinks: sources.map((s) => ({
          label: s.title || 'Official Vendor Documentation',
          url: s.uri,
        })),
      };

      onSaveToKnowledgeBase(caseData);
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกเคส');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  ดึงข้อมูลวิธีแก้ไขจากเว็บไซต์ทางการ
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Live Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                สืบค้นข้อมูลจาก Nutanix Support Portal, Lenovo Data Center Support, XCC KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query Form */}
          <form onSubmit={handleSearch} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  เลือกผู้ผลิต / ระบบ (Vendor)
                </label>
                <div className="flex gap-2">
                  {(['Nutanix', 'Lenovo'] as VendorType[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVendor(v)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                        vendor === v
                          ? v === 'Nutanix'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-red-600 text-white border-red-500 shadow-xs'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Error Code / Event ID (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น FQXSPPU0011M, 0x806F, NCC"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รุ่นฮาร์ดแวร์ / เครื่อง Server (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ThinkSystem SR650, NX-3060"
                  value={hardwareModel}
                  onChange={(e) => setHardwareModel(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                อาการของปัญหา หรือคำค้นหาที่ต้องการค้นจากเว็บทางการ <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น CVM Stargate service unresponsive, Power Supply redundancy lost, MegaRAID foreign config..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 rounded-lg transition shadow-xs whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>กำลังสืบค้น...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>ดึงข้อมูลจากเว็บ {vendor}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-2xs text-slate-400">
              <span className="font-semibold text-slate-300">ตัวอย่างคำค้น:</span>
              <button
                type="button"
                onClick={() => {
                  setVendor('Nutanix');
                  setQuery('CVM Stargate service down OOM memory');
                  setErrorCode('NCC check_cvm_memory_usage');
                }}
                className="hover:text-blue-400 underline"
              >
                Nutanix Stargate OOM
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setVendor('Nutanix');
                  setQuery('Cluster VIP ARP failover unreachable');
                  setErrorCode('VIP_FAILOVER');
                }}
                className="hover:text-blue-400 underline"
              >
                Nutanix Cluster VIP
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setVendor('Lenovo');
                  setQuery('Power supply redundancy is lost amber light');
                  setErrorCode('FQXSPPU0011M');
                  setHardwareModel('ThinkSystem SR650');
                }}
                className="hover:text-blue-400 underline"
              >
                Lenovo PSU Amber (FQXSPPU0011M)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setVendor('Lenovo');
                  setQuery('MegaRAID import foreign configuration');
                  setErrorCode('storcli');
                  setHardwareModel('ThinkSystem 930-8i');
                }}
                className="hover:text-blue-400 underline"
              >
                Lenovo MegaRAID Foreign Import
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ไม่สามารถดึงข้อมูลได้</p>
                <p className="text-red-300/80">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-blue-950/60 border border-blue-800 text-blue-400 animate-pulse">
                <Globe className="h-8 w-8 animate-spin" />
              </div>
              <h4 className="text-sm font-semibold text-white">
                กำลังเชื่อมต่อไปยัง Official Portal ของ {vendor}...
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                ระบบกำลังดึงข้อมูลขั้นตอนการแก้ปัญหาและคำสั่ง CLI ที่ถูกต้องจาก Knowledge Base และเอกสารคู่มือของ {vendor}
              </p>
            </div>
          )}

          {/* Result Content */}
          {resultText && !isLoading && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    ดึงข้อมูลทางการสำเร็จ
                  </span>
                  {sources.length > 0 && (
                    <span className="text-2xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                      อ้างอิงจาก {sources.length} แหล่งข้อมูลเว็บทางการ
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition border border-slate-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>คัดลอกข้อความ</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToKB}
                    disabled={isExtracting || savedSuccess}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 rounded-md transition shadow-xs"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>กำลังจัดโครงสร้าง...</span>
                      </>
                    ) : savedSuccess ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>บันทึกเข้าคลังเรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>บันทึกเข้า Knowledge Base ทันที</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Citations / Official Reference Links */}
              {sources.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <h5 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                    <span>แหล่งอ้างอิงจากเว็บไซต์ทางการ (Official Sources):</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-xs text-slate-300 transition group"
                      >
                        <span className="truncate font-medium">{src.title || src.uri}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 ml-1.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatted Solution Text */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-xs">
                <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap leading-relaxed font-sans text-slate-200">
                  {resultText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>ค้นหาด้วย Google Search Grounding เพื่อดึงข้อมูล KB และคู่มือทางการแบบเรียลไทม์</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
