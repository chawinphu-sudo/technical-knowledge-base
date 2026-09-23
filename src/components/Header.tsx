import React from 'react';
import { Database, Plus, Terminal, Download, ShieldAlert, Server, Globe, Sparkles, Upload } from 'lucide-react';
import { KnowledgeCase } from '../types';

interface HeaderProps {
  cases: KnowledgeCase[];
  onNewCase: () => void;
  onOpenCheatSheet: () => void;
  onOpenBackup: () => void;
  onOpenAiSearch: () => void;
  onOpenDocUploader: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cases,
  onNewCase,
  onOpenCheatSheet,
  onOpenBackup,
  onOpenAiSearch,
  onOpenDocUploader,
}) => {
  const nutanixCount = cases.filter((c) => c.vendor === 'Nutanix').length;
  const lenovoCount = cases.filter((c) => c.vendor === 'Lenovo').length;
  const criticalCount = cases.filter((c) => c.severity === 'Critical').length;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                  TechKB
                  <span className="text-slate-600 font-normal">|</span>
                  <span className="text-sm font-semibold text-slate-300">Enterprise Solutions</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Nutanix • Lenovo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                ระบบค้นหาและบันทึกวิธีแก้ปัญหาทางเทคนิค ค้นหาตามชื่อเคสหรือรหัส Error
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3.5 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
              <Database className="h-3.5 w-3.5 text-slate-400" />
              <span>ทั้งหมด <strong className="text-white font-semibold">{cases.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950"></span>
              <span>Nutanix <strong className="text-emerald-400 font-semibold">{nutanixCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2 border-r border-slate-700">
              <span className="h-2 w-2 rounded-full bg-red-400 ring-2 ring-red-950"></span>
              <span>Lenovo <strong className="text-red-400 font-semibold">{lenovoCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 pl-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Critical <strong className="text-amber-400 font-semibold">{criticalCount}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="btn-ai-search"
              type="button"
              onClick={onOpenAiSearch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/80 active:bg-indigo-900 rounded-xl transition-all border border-indigo-700/60 shadow-xs group"
              title="ดึงข้อมูลวิธีแก้ไขจากเว็บทางการของ Nutanix หรือ Lenovo"
            >
              <Globe className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>ดึง KB จากเว็บ</span>
              <span className="hidden xl:inline text-3xs px-1.5 py-0.2 bg-indigo-800 text-indigo-200 rounded font-bold">Web</span>
            </button>

            <button
              id="btn-upload-doc"
              type="button"
              onClick={onOpenDocUploader}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/70 hover:bg-sky-900/80 active:bg-sky-900 rounded-xl transition-all border border-sky-700/60 shadow-xs group"
              title="อัปโหลดไฟล์เอกสาร KB (.md / .txt) แล้วแปลงเข้าสู่ฐานข้อมูลระบบ"
            >
              <Upload className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>อัปโหลด & แปลงลง DB</span>
            </button>

            <button
              id="btn-cheat-sheet"
              type="button"
              onClick={onOpenCheatSheet}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-700/80 rounded-xl transition-all border border-slate-700/80 shadow-xs"
              title="ดูชุดคำสั่งด่วน Nutanix & Lenovo"
            >
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              <span>คำสั่งด่วน (CLI)</span>
            </button>

            <button
              id="btn-backup-data"
              type="button"
              onClick={onOpenBackup}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-700/80 rounded-xl transition-all border border-slate-700/80 shadow-xs"
              title="ส่งออก / นำเข้าไฟล์ JSON"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">นำเข้า/ส่งออก</span>
            </button>

            <button
              id="btn-add-new-case"
              type="button"
              onClick={onNewCase}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-950/40"
            >
              <Plus className="h-4 w-4" />
              <span>บันทึกเคสใหม่</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
