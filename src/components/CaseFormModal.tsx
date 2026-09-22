import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Wrench, Save, AlertCircle, Terminal, HelpCircle } from 'lucide-react';
import { CategoryType, KnowledgeCase, ResolutionStep, SeverityType, VendorType } from '../types';

interface CaseFormModalProps {
  initialCase?: KnowledgeCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<KnowledgeCase>) => void;
}

const VENDOR_OPTIONS: VendorType[] = [
  'Nutanix',
  'Lenovo',
  'VMware',
  'Cisco',
  'Linux',
  'Windows',
  'General',
];

const CATEGORY_OPTIONS: CategoryType[] = [
  'Storage / Disk',
  'Hardware / Chassis',
  'Hypervisor / AHV',
  'Network / Switching',
  'Firmware / BIOS',
  'Cluster Services',
  'Power & Thermal',
  'General System',
];

const SEVERITY_OPTIONS: SeverityType[] = ['Critical', 'High', 'Medium', 'Low'];

export const CaseFormModal: React.FC<CaseFormModalProps> = ({
  initialCase,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState<VendorType>('Nutanix');
  const [category, setCategory] = useState<CategoryType>('Cluster Services');
  const [severity, setSeverity] = useState<SeverityType>('High');
  const [caseNumber, setCaseNumber] = useState('');
  const [hardwareModels, setHardwareModels] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [workaround, setWorkaround] = useState('');
  const [verificationSteps, setVerificationSteps] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [steps, setSteps] = useState<ResolutionStep[]>([
    {
      step: 1,
      title: 'ตรวจสอบสถานะเบื้องต้น',
      instruction: 'ระบุขั้นตอนการตรวจสอบสถานะ',
      commands: [''],
      notes: '',
    },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialCase) {
      setTitle(initialCase.title);
      setVendor(initialCase.vendor);
      setCategory(initialCase.category);
      setSeverity(initialCase.severity);
      setCaseNumber(initialCase.caseNumber);
      setHardwareModels(initialCase.hardwareModels?.join(', ') || '');
      setErrorCode(initialCase.errorCode || '');
      setSymptoms(initialCase.symptoms);
      setRootCause(initialCase.rootCause);
      setWorkaround(initialCase.workaround || '');
      setVerificationSteps(initialCase.verificationSteps || '');
      setTags(initialCase.tags?.join(', ') || '');
      setAuthor(initialCase.author || '');
      setSteps(
        initialCase.resolutionSteps && initialCase.resolutionSteps.length > 0
          ? initialCase.resolutionSteps
          : [{ step: 1, title: '', instruction: '', commands: [''] }]
      );
    } else {
      // Default new case setup
      const randNum = Math.floor(100 + Math.random() * 900);
      setTitle('');
      setVendor('Nutanix');
      setCategory('Cluster Services');
      setSeverity('High');
      setCaseNumber(`KB-CUSTOM-${randNum}`);
      setHardwareModels('');
      setErrorCode('');
      setSymptoms('');
      setRootCause('');
      setWorkaround('');
      setVerificationSteps('');
      setTags('');
      setAuthor('IT Support');
      setSteps([
        {
          step: 1,
          title: 'ตรวจสอบสถานะระบบผ่าน SSH / Management Console',
          instruction: 'ล็อกอินเข้าสู่ระบบและรันคำสั่งตรวจสอบสถานะเซอร์วิส',
          commands: [''],
          notes: '',
        },
      ]);
    }
    setErrorMsg('');
  }, [initialCase, isOpen]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        step: steps.length + 1,
        title: '',
        instruction: '',
        commands: [''],
        notes: '',
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) return;
    const newSteps = steps.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, step: idx + 1 }));
    setSteps(newSteps);
  };

  const handleStepChange = (index: number, field: keyof ResolutionStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleCommandsChange = (index: number, text: string) => {
    const lines = text.split('\n');
    handleStepChange(index, 'commands', lines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกชื่อเคส (Case Title)');
      return;
    }
    if (!symptoms.trim()) {
      setErrorMsg('กรุณาระบุอาการที่เกิดขึ้น (Symptoms)');
      return;
    }
    if (steps.some((s) => !s.title.trim() && !s.instruction.trim())) {
      setErrorMsg('กรุณากรอกรายละเอียดขั้นตอนการแก้ไขอย่างน้อย 1 ขั้นตอน');
      return;
    }

    const cleanedSteps = steps.map((s, idx) => ({
      step: idx + 1,
      title: s.title.trim() || `ขั้นตอนที่ ${idx + 1}`,
      instruction: s.instruction.trim(),
      commands: s.commands ? s.commands.filter((c) => c.trim().length > 0) : [],
      notes: s.notes?.trim() || '',
    }));

    const parsedHardware = hardwareModels
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedTags = tags
      .split(',')
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave({
      caseNumber: caseNumber.trim() || `KB-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      vendor,
      category,
      severity,
      hardwareModels: parsedHardware,
      errorCode: errorCode.trim(),
      symptoms: symptoms.trim(),
      rootCause: rootCause.trim(),
      workaround: workaround.trim(),
      verificationSteps: verificationSteps.trim(),
      resolutionSteps: cleanedSteps,
      tags: parsedTags,
      author: author.trim() || 'IT Engineer',
    });
    onClose();
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
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-xs">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialCase ? 'แก้ไขข้อมูลเคส' : 'บันทึกวิธีแก้ปัญหาเคสใหม่'}
              </h2>
              <p className="text-2xs text-slate-400">
                บันทึกวิธีแก้ปัญหาทางเทคนิคเพื่อเป็นองค์ความรู้สำหรับค้นหาครั้งต่อไป
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-200 mb-1">
              ชื่อเคส / หัวข้อปัญหา <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Nutanix CVM Stargate Down, Lenovo ThinkSystem XCC Amber PSU Error..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-sm outline-none font-medium"
            />
          </div>

          {/* Vendor, Category, Severity & Case ID Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">แบรนด์ / ระบบ</label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value as VendorType)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium"
              >
                {VENDOR_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">หมวดหมู่อาการ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">ระดับความรุนแรง</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityType)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white font-medium"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">รหัสเคส (Case ID)</label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="KB-NTX-101"
                className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-mono uppercase"
              />
            </div>
          </div>

          {/* Error Code & Hardware Models */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                รหัส Error Code / Event ID (ถ้ามี)
              </label>
              <input
                type="text"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                placeholder="เช่น FQXSPPU0011M, NCC_DISK_FAIL, 0x806F..."
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 font-mono text-rose-300 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                รุ่นฮาร์ดแวร์ (คั่นด้วยจุลภาค)
              </label>
              <input
                type="text"
                value={hardwareModels}
                onChange={(e) => setHardwareModels(e.target.value)}
                placeholder="เช่น Lenovo SR650, ThinkSystem SE350, NX-3060-G7"
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block font-bold text-slate-200 mb-1">
              อาการที่ตรวจพบ (Symptoms) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="ระบุอาการผิดปกติ, ข้อความแจ้งเตือนหน้า Dashboard หรือไฟ LED หน้าเครื่อง..."
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block font-bold text-slate-200 mb-1">
              สาเหตุของปัญหา (Root Cause)
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="อธิบายว่าทำไมถึงเกิดปัญหานี้ เช่น Memory leak, สายไฟหลวม, Bad sector, Config mismatch..."
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          {/* Step-by-Step Resolution Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-blue-400" />
                ขั้นตอนการแก้ไขปัญหา (Resolution Steps) <span className="text-rose-400">*</span>
              </span>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1 text-2xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 border border-blue-800/80 px-2.5 py-1 rounded-md transition"
              >
                <Plus className="h-3.5 w-3.5" />
                เพิ่มขั้นตอน (Step)
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-2xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      ขั้นตอนที่ {idx + 1}
                    </span>

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition"
                        title="ลบขั้นตอนนี้"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Step Title */}
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                    placeholder="หัวข้อขั้นตอน (เช่น SSH เข้า CVM และตรวจสอบเซอร์วิส)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500 font-medium"
                  />

                  {/* Step Instruction */}
                  <textarea
                    rows={2}
                    value={step.instruction}
                    onChange={(e) => handleStepChange(idx, 'instruction', e.target.value)}
                    placeholder="รายละเอียดคำอธิบายสิ่งที่ต้องทำในขั้นตอนนี้..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder-slate-500"
                  />

                  {/* Commands */}
                  <div>
                    <label className="block text-2xs font-mono font-bold text-slate-400 mb-1">
                      คำสั่ง Command Line / CLI (ขึ้นบรรทัดใหม่เมื่อมีหลายคำสั่ง):
                    </label>
                    <textarea
                      rows={2}
                      value={step.commands ? step.commands.join('\n') : ''}
                      onChange={(e) => handleCommandsChange(idx, e.target.value)}
                      placeholder="เช่น:&#10;cluster status | grep -i down&#10;genesis restart"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-black text-emerald-400 font-mono text-2xs"
                    />
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    value={step.notes || ''}
                    onChange={(e) => handleStepChange(idx, 'notes', e.target.value)}
                    placeholder="ข้อควรระวังหรือหมายเหตุเพิ่มเติม (ถ้ามี)"
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-2xs text-amber-300 placeholder:text-slate-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Workaround & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                การแก้ไขชั่วคราว (Workaround)
              </label>
              <textarea
                rows={2}
                value={workaround}
                onChange={(e) => setWorkaround(e.target.value)}
                placeholder="วิธีบรรเทาปัญหาก่อนที่อะไหล่จะมา หรือก่อนจะ restart..."
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                วิธีตรวจสอบยืนยันผล (Verification)
              </label>
              <textarea
                rows={2}
                value={verificationSteps}
                onChange={(e) => setVerificationSteps(e.target.value)}
                placeholder="คำสั่งหรือหน้า GUI ที่ยืนยันว่าปัญหาคลี่คลายแล้ว 100%..."
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Tags & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                แท็กคีย์เวิร์ด (คั่นด้วยจุลภาค)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="เช่น CVM, Stargate, Memory, NCC, XCC"
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                ชื่อผู้บันทึก (Author)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="เช่น IT Support Team, System Admin"
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition"
            >
              <Save className="h-4 w-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
