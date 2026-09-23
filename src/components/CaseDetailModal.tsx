import React, { useState } from 'react';
import {
  X,
  Star,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  Terminal,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Share2,
  Cpu,
  Calendar,
  User,
  ShieldAlert,
  Info,
  Layers,
  Wrench,
  Globe,
  Download,
  FileDown
} from 'lucide-react';
import { KnowledgeCase } from '../types';
import { downloadCaseAsMarkdown, downloadCaseAsJSON } from '../utils/kbExport';

interface CaseDetailModalProps {
  item: KnowledgeCase | null;
  onClose: () => void;
  onEdit: (item: KnowledgeCase) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSearchVendorWeb?: (item: KnowledgeCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSearchVendorWeb,
}) => {
  const [copiedStepIndex, setCopiedStepIndex] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const handleCopyCommand = (command: string, stepIdx: number) => {
    navigator.clipboard.writeText(command);
    setCopiedStepIndex(stepIdx);
    setTimeout(() => setCopiedStepIndex(null), 2000);
  };

  const handleCopyFullResolution = () => {
    const stepsText = item.resolutionSteps
      .map(
        (s) =>
          `Step ${s.step}: ${s.title}\n${s.instruction}\n${
            s.commands && s.commands.length > 0 ? `คำสั่ง CLI:\n` + s.commands.join('\n') : ''
          }\n${s.notes ? `หมายเหตุ: ${s.notes}` : ''}`
      )
      .join('\n\n');

    const fullText = `[${item.caseNumber}] ${item.title}
แบรนด์/ระบบ: ${item.vendor} | หมวดหมู่: ${item.category} | ความรุนแรง: ${item.severity}
${item.errorCode ? `Error Code: ${item.errorCode}\n` : ''}${
      item.hardwareModels && item.hardwareModels.length > 0
        ? `Hardware: ${item.hardwareModels.join(', ')}\n`
        : ''
    }
อาการ: ${item.symptoms}

สาเหตุของปัญหา (Root Cause):
${item.rootCause}

ขั้นตอนการแก้ไขปัญหา (Resolution Steps):
${stepsText}

${item.workaround ? `การแก้ไขชั่วคราว (Workaround):\n${item.workaround}\n` : ''}${
      item.verificationSteps ? `การทดสอบยืนยันผล (Verification):\n${item.verificationSteps}\n` : ''
    }`;

    navigator.clipboard.writeText(fullText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div
        className="relative bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-2xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md shadow-xs">
                {item.caseNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold border ${
                item.vendor === 'Nutanix'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                  : 'bg-red-950 text-red-300 border-red-800/80'
              }`}>
                {item.vendor}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-medium bg-slate-850 text-slate-300 border border-slate-800">
                {item.category}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                  item.severity === 'Critical'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                    : item.severity === 'High'
                    ? 'bg-orange-950 text-orange-300 border border-orange-800/80'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {item.severity}
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
              {item.title}
            </h2>
          </div>

          {/* Action Bar & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onToggleFavorite(item.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
              title="ติดดาวเคสนี้"
            >
              <Star
                className={`h-5 w-5 ${
                  item.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>

            {onSearchVendorWeb && (
              <button
                type="button"
                onClick={() => onSearchVendorWeb(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 shadow-xs transition"
                title={`ค้นหาเอกสารทางการและวิธีแก้ล่าสุดจากเว็บ ${item.vendor}`}
              >
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">ตรวจจากเว็บ {item.vendor}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyFullResolution}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-xs transition"
              title="คัดลอกสรุปวิธีแก้ทั้งหมดส่งต่อไปยัง Ticket หรืออีเมล"
            >
              {copiedSummary ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอกทั้งหมดแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-400" />
                  <span>คัดลอกสรุป</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadCaseAsMarkdown(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 shadow-xs transition"
              title="ดาวน์โหลดเคสนี้เป็นไฟล์เอกสาร Markdown (.md) สำหรับเก็บออฟไลน์หรือแชร์"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">โหลด .MD</span>
            </button>

            <button
              type="button"
              onClick={() => downloadCaseAsJSON(item)}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
              title="ดาวน์โหลดข้อมูลเคสเป็นไฟล์ JSON"
            >
              <FileDown className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
              title="แก้ไขข้อมูลเคสนี้"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="ลบเคสนี้"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
              title="ปิดหน้าต่าง"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* Hardware & Error Code Header Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
            <div>
              <span className="text-2xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                <Cpu className="h-3.5 w-3.5" /> รุ่นฮาร์ดแวร์ / อุปกรณ์ที่ได้รับผลกระทบ
              </span>
              <div className="font-semibold text-slate-200 text-xs">
                {item.hardwareModels && item.hardwareModels.length > 0
                  ? item.hardwareModels.join(', ')
                  : 'ไม่ได้ระบุรุ่นเจาะจง'}
              </div>
            </div>

            <div>
              <span className="text-2xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1 mb-1">
                <Terminal className="h-3.5 w-3.5" /> รหัสข้อผิดพลาด (Error Code / Event ID)
              </span>
              <div className="font-mono font-bold text-rose-400 text-xs">
                {item.errorCode || 'ไม่มี Error Code ระบุ'}
              </div>
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              อาการที่ตรวจพบ (Symptoms)
            </h4>
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 text-slate-300 leading-relaxed text-xs md:text-sm whitespace-pre-line">
              {item.symptoms}
            </div>
          </div>

          {/* Root Cause Section */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              สาเหตุของปัญหา (Root Cause)
            </h4>
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3.5 text-slate-300 leading-relaxed text-xs md:text-sm whitespace-pre-line">
              {item.rootCause}
            </div>
          </div>

          {/* Step-by-Step Resolution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <Wrench className="h-4 w-4 text-emerald-400" />
                ขั้นตอนการแก้ไขปัญหาอย่างละเอียด (Resolution Steps)
              </h4>
              <span className="text-xs text-slate-400 font-medium">
                {item.resolutionSteps.length} ขั้นตอน
              </span>
            </div>

            <div className="space-y-3.5">
              {item.resolutionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 shadow-inner space-y-2.5"
                >
                  {/* Step Title */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mt-0.5">
                      {step.step || idx + 1}
                    </span>
                    <h5 className="font-bold text-white text-sm leading-tight">
                      {step.title}
                    </h5>
                  </div>

                  {/* Instruction text */}
                  <div className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line pl-8">
                    {step.instruction}
                  </div>

                  {/* Commands terminal blocks */}
                  {step.commands && step.commands.length > 0 && (
                    <div className="pl-8 pt-1">
                      <div className="bg-black/90 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto relative group border border-slate-800">
                        <div className="flex items-center justify-between text-slate-400 pb-1.5 mb-1.5 border-b border-slate-800 font-sans text-2xs">
                          <span>คำสั่ง Command Line / Terminal</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCommand(step.commands!.join('\n'), idx)}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-2xs transition"
                          >
                            {copiedStepIndex === idx ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">คัดลอกแล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy CLI</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="text-emerald-400 leading-relaxed whitespace-pre-wrap selection:bg-slate-800">
                          {step.commands.join('\n')}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Step Note / Warning */}
                  {step.notes && (
                    <div className="pl-8 pt-1 text-2xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span><strong>ข้อควรระวัง:</strong> {step.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workaround & Verification Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {item.workaround && (
              <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60 space-y-1.5">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-orange-400" /> วิธีการบรรเทาชั่วคราว (Workaround)
                </span>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                  {item.workaround}
                </p>
              </div>
            )}

            {item.verificationSteps && (
              <div className="border border-emerald-900/60 rounded-xl p-3.5 bg-emerald-950/20 space-y-1.5">
                <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> วิธีตรวจสอบการแก้ไข (Verification)
                </span>
                <p className="text-xs text-emerald-400/90 leading-relaxed whitespace-pre-line">
                  {item.verificationSteps}
                </p>
              </div>
            )}
          </div>

          {/* References and Links */}
          {item.referenceLinks && item.referenceLinks.length > 0 && (
            <div className="border-t border-slate-800 pt-3 space-y-1.5">
              <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                เอกสารอ้างอิงจาก Vendor (Official KB / Docs):
              </span>
              <div className="flex flex-wrap gap-2">
                {item.referenceLinks.map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 px-2.5 py-1 rounded-md transition"
                  >
                    <span>{ref.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              <span className="text-2xs text-slate-500 font-semibold">แท็ก:</span>
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-2xs bg-slate-800 text-slate-300 font-mono border border-slate-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-2xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> ผู้บันทึก: {item.author || 'IT Team'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> อัปเดตล่าสุด: {new Date(item.updatedAt).toLocaleString('th-TH')}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            ปิด
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> ยืนยันการลบเคสนี้?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบเคส <strong>"{item.caseNumber}: {item.title}"</strong> ออกจากฐานข้อมูล? การดำเนินการนี้ไม่สามารถเรียกคืนได้
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  setConfirmDelete(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
