import React, { useState } from 'react';
import { Star, Terminal, Copy, Check, ChevronRight, AlertTriangle, ShieldAlert, Info, Cpu, ArrowUpRight } from 'lucide-react';
import { KnowledgeCase, SeverityType, VendorType } from '../types';

interface CaseCardProps {
  item: KnowledgeCase;
  searchQuery: string;
  onSelect: (item: KnowledgeCase) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

const VENDOR_BADGES: Record<VendorType, { label: string; badge: string; border: string }> = {
  Nutanix: { label: 'Nutanix', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80', border: 'hover:border-emerald-500/60' },
  Lenovo: { label: 'Lenovo', badge: 'bg-red-950/70 text-red-300 border-red-800/80', border: 'hover:border-red-500/60' },
  VMware: { label: 'VMware', badge: 'bg-sky-950/70 text-sky-300 border-sky-800/80', border: 'hover:border-sky-500/60' },
  Cisco: { label: 'Cisco', badge: 'bg-blue-950/70 text-blue-300 border-blue-800/80', border: 'hover:border-blue-500/60' },
  Linux: { label: 'Linux', badge: 'bg-amber-950/70 text-amber-300 border-amber-800/80', border: 'hover:border-amber-500/60' },
  Windows: { label: 'Windows', badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80', border: 'hover:border-indigo-500/60' },
  General: { label: 'General', badge: 'bg-slate-800 text-slate-300 border-slate-700', border: 'hover:border-slate-500/60' },
};

const SEVERITY_BADGES: Record<SeverityType, { label: string; badge: string; icon: React.ReactNode }> = {
  Critical: {
    label: 'Critical',
    badge: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
    icon: <ShieldAlert className="h-3 w-3 text-rose-400" />,
  },
  High: {
    label: 'High',
    badge: 'bg-orange-950/70 text-orange-300 border-orange-800/80',
    icon: <AlertTriangle className="h-3 w-3 text-orange-400" />,
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
    icon: <Info className="h-3 w-3 text-amber-400" />,
  },
  Low: {
    label: 'Low',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    icon: <Info className="h-3 w-3 text-slate-400" />,
  },
};

export const CaseCard: React.FC<CaseCardProps> = ({
  item,
  searchQuery,
  onSelect,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  const vendorInfo = VENDOR_BADGES[item.vendor] || VENDOR_BADGES.General;
  const severityInfo = SEVERITY_BADGES[item.severity] || SEVERITY_BADGES.Medium;

  // First resolution step command for instant copy
  const firstStep = item.resolutionSteps[0];
  const firstCommand = firstStep?.commands && firstStep.commands.length > 0 ? firstStep.commands[0] : null;

  const handleCopyFirstCommand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstCommand) return;
    navigator.clipboard.writeText(firstCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      id={`case-card-${item.id}`}
      onClick={() => onSelect(item)}
      className="group relative bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/60 rounded-2xl p-5 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-2xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {item.caseNumber}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold border ${vendorInfo.badge}`}>
              {vendorInfo.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold border ${severityInfo.badge}`}>
              {severityInfo.icon}
              <span>{severityInfo.label}</span>
            </span>
          </div>

          {/* Star Favorite Button */}
          <button
            type="button"
            id={`btn-favorite-${item.id}`}
            onClick={(e) => onToggleFavorite(item.id, e)}
            className="p-1 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-slate-800 transition"
            title={item.isFavorite ? 'ยกเลิกติดดาว' : 'ติดดาวเคสนี้'}
          >
            <Star
              className={`h-4 w-4 ${
                item.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug mb-2">
          {item.title}
        </h3>

        {/* Error Code & Hardware Models */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {item.errorCode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/60 text-2xs font-mono font-medium">
              <span className="font-sans font-bold text-rose-400">ERR:</span> {item.errorCode}
            </span>
          )}

          {item.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-2xs font-medium border border-slate-750">
              {item.category}
            </span>
          )}

          {item.hardwareModels && item.hardwareModels.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-2xs font-medium border border-slate-750">
              <Cpu className="h-3 w-3 text-slate-400" />
              {item.hardwareModels.slice(0, 2).join(', ')}
              {item.hardwareModels.length > 2 && ` +${item.hardwareModels.length - 2}`}
            </span>
          )}
        </div>

        {/* Symptoms Summary */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
          <strong className="text-slate-300 font-semibold">อาการ:</strong> {item.symptoms}
        </p>

        {/* Quick CLI Command Box (if available) */}
        {firstCommand && (
          <div className="bg-slate-950 rounded-xl p-3 mb-3.5 text-2xs font-mono text-slate-200 border border-slate-800/80 shadow-inner relative group/cmd">
            <div className="flex items-center justify-between text-slate-400 mb-1.5 font-sans text-3xs uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1 text-slate-300">
                <Terminal className="h-3 w-3 text-blue-400" /> Step 1 Command
              </span>
              <button
                type="button"
                onClick={handleCopyFirstCommand}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md transition"
                title="คัดลอกคำสั่งนี้"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="truncate text-emerald-400 font-mono text-xs">
              {firstCommand}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-2xs text-slate-400">
          <span className="font-semibold text-slate-300">{item.resolutionSteps.length} ขั้นตอนแก้</span>
          <span>•</span>
          <span>{new Date(item.updatedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-0.5 transition-all">
          <span>ดูวิธีแก้ปัญหา</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
};
