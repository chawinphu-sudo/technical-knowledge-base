import React, { useState, useEffect, useMemo } from 'react';
import {
  KnowledgeCase,
  FilterOptions,
  VendorType,
} from './types';
import {
  loadCases,
  saveCases,
  resetToDefaultCases,
} from './utils/storage';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CaseCard } from './components/CaseCard';
import { CaseDetailModal } from './components/CaseDetailModal';
import { CaseFormModal } from './components/CaseFormModal';
import { CheatSheetModal } from './components/CheatSheetModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AiSearchModal } from './components/AiSearchModal';
import { DocumentUploaderModal } from './components/DocumentUploaderModal';
import {
  Search,
  Plus,
  Server,
  Terminal,
  ShieldCheck,
  FolderOpen,
  FilterX,
  Sparkles,
  BookOpen,
  Globe,
  LayoutGrid,
  List,
  ArrowUpDown,
  SlidersHorizontal,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<KnowledgeCase[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'severity' | 'title'>('updated');
  const [filter, setFilter] = useState<FilterOptions>({
    searchQuery: '',
    vendor: 'All',
    category: 'All',
    severity: 'All',
    favoriteOnly: false,
  });

  const [selectedCase, setSelectedCase] = useState<KnowledgeCase | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<KnowledgeCase | null>(null);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [isDocUploaderOpen, setIsDocUploaderOpen] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchVendor, setAiSearchVendor] = useState<VendorType | 'All'>('Nutanix');

  // Load initial cases from localStorage on mount
  useEffect(() => {
    const loaded = loadCases();
    setCases(loaded);
  }, []);

  // Filter & Search Evaluation
  const filteredCases = useMemo(() => {
    const query = filter.searchQuery.trim().toLowerCase();

    const result = cases.filter((item) => {
      // Vendor filter
      if (filter.vendor !== 'All' && item.vendor !== filter.vendor) {
        return false;
      }

      // Category filter
      if (filter.category !== 'All' && item.category !== filter.category) {
        return false;
      }

      // Severity filter
      if (filter.severity !== 'All' && item.severity !== filter.severity) {
        return false;
      }

      // Favorite filter
      if (filter.favoriteOnly && !item.isFavorite) {
        return false;
      }

      // Search Query filter (matches multiple attributes)
      if (query) {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchNumber = item.caseNumber.toLowerCase().includes(query);
        const matchErrorCode = item.errorCode?.toLowerCase().includes(query) || false;
        const matchSymptoms = item.symptoms.toLowerCase().includes(query);
        const matchRootCause = item.rootCause?.toLowerCase().includes(query) || false;
        const matchHardware = item.hardwareModels?.some((m) => m.toLowerCase().includes(query)) || false;
        const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        const matchSteps = item.resolutionSteps.some(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.instruction.toLowerCase().includes(query) ||
            (s.commands && s.commands.some((c) => c.toLowerCase().includes(query)))
        );

        if (
          !matchTitle &&
          !matchNumber &&
          !matchErrorCode &&
          !matchSymptoms &&
          !matchRootCause &&
          !matchHardware &&
          !matchTags &&
          !matchSteps
        ) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    const severityWeight: Record<string, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return [...result].sort((a, b) => {
      if (sortBy === 'severity') {
        return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'th');
      }
      // Default: updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [cases, filter, sortBy]);

  // CRUD Handlers
  const handleSaveCase = (caseData: Partial<KnowledgeCase>) => {
    let updatedCases: KnowledgeCase[];

    if (editingCase) {
      // Edit existing
      updatedCases = cases.map((c) => {
        if (c.id === editingCase.id) {
          const updated: KnowledgeCase = {
            ...c,
            ...caseData,
            updatedAt: new Date().toISOString(),
          } as KnowledgeCase;
          // Also update selectedCase if currently viewed
          if (selectedCase?.id === editingCase.id) {
            setSelectedCase(updated);
          }
          return updated;
        }
        return c;
      });
    } else {
      // Create new
      const newCase: KnowledgeCase = {
        id: `case-${Date.now()}`,
        caseNumber: caseData.caseNumber || `KB-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
        title: caseData.title || 'Untitled Case',
        vendor: caseData.vendor || 'General',
        category: caseData.category || 'General System',
        severity: caseData.severity || 'Medium',
        hardwareModels: caseData.hardwareModels || [],
        errorCode: caseData.errorCode || '',
        symptoms: caseData.symptoms || '',
        rootCause: caseData.rootCause || '',
        resolutionSteps: caseData.resolutionSteps || [],
        workaround: caseData.workaround || '',
        verificationSteps: caseData.verificationSteps || '',
        referenceLinks: caseData.referenceLinks || [],
        tags: caseData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: caseData.author || 'IT Engineer',
        isFavorite: false,
      };
      updatedCases = [newCase, ...cases];
      setSelectedCase(newCase);
    }

    setCases(updatedCases);
    saveCases(updatedCases);
    setEditingCase(null);
  };

  const handleDeleteCase = (id: string) => {
    const updated = cases.filter((c) => c.id !== id);
    setCases(updated);
    saveCases(updated);
    if (selectedCase?.id === id) {
      setSelectedCase(null);
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = cases.map((c) => {
      if (c.id === id) {
        const toggled = { ...c, isFavorite: !c.isFavorite };
        if (selectedCase?.id === id) {
          setSelectedCase(toggled);
        }
        return toggled;
      }
      return c;
    });
    setCases(updated);
    saveCases(updated);
  };

  const handleOpenEdit = (item: KnowledgeCase) => {
    setEditingCase(item);
    setIsFormOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCase(null);
    setIsFormOpen(true);
  };

  const handleImportSuccess = (imported: KnowledgeCase[]) => {
    setCases(imported);
    saveCases(imported);
  };

  const handleResetDefault = () => {
    const defaultData = resetToDefaultCases();
    setCases(defaultData);
    setSelectedCase(null);
  };

  const handleOpenAiSearch = (customQuery?: string, customVendor?: VendorType | 'All') => {
    setAiSearchQuery(customQuery || filter.searchQuery || '');
    setAiSearchVendor(customVendor || (filter.vendor === 'All' ? 'Nutanix' : filter.vendor));
    setIsAiSearchOpen(true);
  };

  const handleSaveFromAi = (caseData: Partial<KnowledgeCase>) => {
    handleSaveCase(caseData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        cases={cases}
        onNewCase={handleOpenNew}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAiSearch={() => handleOpenAiSearch()}
        onOpenDocUploader={() => setIsDocUploaderOpen(true)}
      />

      {/* Main Search & Filters Bar */}
      <SearchBar
        filter={filter}
        onFilterChange={setFilter}
        totalResults={filteredCases.length}
        onOpenAiSearch={() => handleOpenAiSearch()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Results Bar with Sort & View controls */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">
              ผลการค้นหา: <span className="text-white font-bold">{filteredCases.length}</span> รายการ
            </span>
            {filter.searchQuery && (
              <span className="text-2xs bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
                คำค้น: "{filter.searchQuery}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline text-2xs font-semibold text-slate-400 uppercase">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 font-medium text-slate-200 outline-none cursor-pointer text-xs"
              >
                <option value="updated">อัปเดตล่าสุด</option>
                <option value="severity">ความรุนแรง (Critical ก่อน)</option>
                <option value="title">ชื่อเคส (ก-ฮ)</option>
              </select>
            </div>

            {/* View Switcher: Grid vs Table */}
            <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="มุมมองแบบการ์ด (Grid View)"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="มุมมองแบบตารางสรุปด่วน (Table View)"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid or Table */}
        {filteredCases.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCases.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  searchQuery={filter.searchQuery}
                  onSelect={setSelectedCase}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            /* Modern Table View */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-3xs font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">รหัส / แบรนด์</th>
                      <th className="py-3 px-4">หัวข้อปัญหา (Title)</th>
                      <th className="py-3 px-4">Error Code / ฮาร์ดแวร์</th>
                      <th className="py-3 px-4">ระดับ</th>
                      <th className="py-3 px-4">ขั้นตอน</th>
                      <th className="py-3 px-4 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredCases.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedCase(item)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-2xs font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.caseNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                              item.vendor === 'Nutanix'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                : 'bg-red-950 text-red-300 border border-red-800/80'
                            }`}>
                              {item.vendor}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-2xs text-slate-400 line-clamp-1 mt-0.5">
                            {item.symptoms}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.errorCode ? (
                            <span className="font-mono font-medium text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded text-3xs border border-rose-800/80">
                              {item.errorCode}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-3xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold ${
                            item.severity === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                              : item.severity === 'High'
                              ? 'bg-orange-950 text-orange-300 border border-orange-800/80'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-medium">
                          {item.resolutionSteps.length} ขั้นตอน
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(item);
                            }}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 px-2.5 py-1 rounded-lg transition"
                          >
                            ดูวิธีแก้
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty Search Result View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-md mx-auto my-12 shadow-md">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              ไม่พบเคสที่ตรงกับคำค้นหา
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              ลองค้นหาด้วยคำสำคัญอื่น เช่น <span className="font-mono text-slate-300">Stargate</span>,{' '}
              <span className="font-mono text-slate-300">NCC</span>,{' '}
              <span className="font-mono text-slate-300">FQXSPPU0011M</span> หรือเลือกล้างตัวกรองทั้งหมด
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  setFilter({
                    searchQuery: '',
                    vendor: 'All',
                    category: 'All',
                    severity: 'All',
                    favoriteOnly: false,
                  })
                }
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                ล้างตัวกรองทั้งหมด
              </button>

              <button
                type="button"
                onClick={() => handleOpenAiSearch(filter.searchQuery, filter.vendor)}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/80 rounded-lg transition flex items-center gap-1.5"
              >
                <Globe className="h-4 w-4 text-indigo-400" />
                <span>ดึงวิธีแก้จากเว็บ {filter.vendor === 'All' ? 'Nutanix/Lenovo' : filter.vendor} ทันที</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNew}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>บันทึกเคสใหม่นี้</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedCase && (
        <CaseDetailModal
          item={selectedCase}
          onClose={() => setSelectedCase(null)}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteCase}
          onToggleFavorite={handleToggleFavorite}
          onSearchVendorWeb={(c) => handleOpenAiSearch(c.title || c.errorCode || c.symptoms, c.vendor)}
        />
      )}

      <CaseFormModal
        isOpen={isFormOpen}
        initialCase={editingCase}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSaveCase}
      />

      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
      />

      <ImportExportModal
        isOpen={isBackupOpen}
        cases={cases}
        onClose={() => setIsBackupOpen(false)}
        onImportSuccess={handleImportSuccess}
        onResetDefault={handleResetDefault}
      />

      <AiSearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
        onSaveToKnowledgeBase={handleSaveFromAi}
        initialQuery={aiSearchQuery}
        initialVendor={aiSearchVendor}
      />

      <DocumentUploaderModal
        isOpen={isDocUploaderOpen}
        onClose={() => setIsDocUploaderOpen(false)}
        onSaveCase={(newCase) => {
          handleSaveCase(newCase);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/90 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-2xs font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Technical Knowledge Base for Enterprise Support (Nutanix & Lenovo)</span>
          </div>
          <div className="text-2xs text-slate-500">
            กดปุ่ม <kbd className="px-1.5 py-0.5 border border-slate-700 rounded bg-slate-800 text-slate-300 font-mono text-3xs">/</kbd> เพื่อค้นหาเคสด่วน
          </div>
        </div>
      </footer>
    </div>
  );
}
