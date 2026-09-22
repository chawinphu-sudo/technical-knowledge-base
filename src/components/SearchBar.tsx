import React, { useRef, useEffect } from 'react';
import { Search, X, Filter, Star, Tag, ChevronDown, Check, Globe } from 'lucide-react';
import { CategoryType, FilterOptions, SeverityType, VendorType } from '../types';

interface SearchBarProps {
  filter: FilterOptions;
  onFilterChange: (newFilter: FilterOptions) => void;
  totalResults: number;
  onOpenAiSearch?: () => void;
}

const VENDORS: { id: VendorType | 'All'; label: string; badgeClass: string }[] = [
  { id: 'All', label: 'ทั้งหมด (All)', badgeClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { id: 'Nutanix', label: 'Nutanix', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'Lenovo', label: 'Lenovo', badgeClass: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { id: 'VMware', label: 'VMware', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
  { id: 'Cisco', label: 'Cisco', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'Linux', label: 'Linux', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
];

const CATEGORIES: (CategoryType | 'All')[] = [
  'All',
  'Storage / Disk',
  'Hardware / Chassis',
  'Hypervisor / AHV',
  'Network / Switching',
  'Firmware / BIOS',
  'Cluster Services',
  'Power & Thermal',
  'General System',
];

const SEVERITIES: (SeverityType | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

const QUICK_TAGS = [
  'Stargate',
  'NCC',
  'XCC Amber',
  'MegaRAID',
  'Disk',
  'RAM ECC',
  'VIP',
  'FQXSPPU0011M',
  'OOM',
  'LCM',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  filter,
  onFilterChange,
  totalResults,
  onOpenAiSearch,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQueryChange = (val: string) => {
    onFilterChange({ ...filter, searchQuery: val });
  };

  const handleVendorSelect = (v: VendorType | 'All') => {
    onFilterChange({ ...filter, vendor: v });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, category: e.target.value as CategoryType | 'All' });
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, severity: e.target.value as SeverityType | 'All' });
  };

  const toggleFavorite = () => {
    onFilterChange({ ...filter, favoriteOnly: !filter.favoriteOnly });
  };

  const handleQuickTagClick = (tag: string) => {
    if (filter.searchQuery.toLowerCase() === tag.toLowerCase()) {
      onFilterChange({ ...filter, searchQuery: '' });
    } else {
      onFilterChange({ ...filter, searchQuery: tag });
    }
  };

  const clearAllFilters = () => {
    onFilterChange({
      searchQuery: '',
      vendor: 'All',
      category: 'All',
      severity: 'All',
      favoriteOnly: false,
    });
  };

  const hasActiveFilters =
    filter.searchQuery !== '' ||
    filter.vendor !== 'All' ||
    filter.category !== 'All' ||
    filter.severity !== 'All' ||
    filter.favoriteOnly;

  return (
    <section className="bg-slate-900/70 backdrop-blur-md border-b border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-3.5">
        {/* Main Search Input Box */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input
            ref={searchInputRef}
            id="main-search-input"
            type="text"
            value={filter.searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="ค้นหาชื่อเคส, รหัส Error Code, อาการ, คำสั่งแก้ไข (เช่น Stargate OOM, FQXSPPU0011M, MegaRAID, NCC)..."
            className="w-full pl-12 pr-32 py-3.5 bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl text-white placeholder:text-slate-500 text-sm md:text-base font-normal transition-all outline-none shadow-inner"
          />

          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-1.5">
            {filter.searchQuery && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="ล้างข้อความค้นหา"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {onOpenAiSearch && filter.searchQuery.trim().length > 1 && (
              <button
                type="button"
                onClick={onOpenAiSearch}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 rounded-xl border border-indigo-700/60 shadow-xs transition active:scale-95"
                title="สืบค้นวิธีแก้จากเว็บทางการของ Nutanix / Lenovo ด้วยคำค้นนี้"
              >
                <Globe className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span>ค้นหาบนเว็บ</span>
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 border border-slate-700 rounded-md text-2xs font-semibold text-slate-400 bg-slate-900 shadow-xs">
              /
            </kbd>
          </div>
        </div>

        {/* Vendors Filter Pills & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
          {/* Vendor Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
              แบรนด์:
            </span>
            {VENDORS.map((v) => {
              const isSelected = filter.vendor === v.id;
              return (
                <button
                  key={v.id}
                  id={`filter-vendor-${v.id.toLowerCase()}`}
                  type="button"
                  onClick={() => handleVendorSelect(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700/80 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters: Category, Severity, Favorites */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                id="filter-category-select"
                aria-label="เลือกหมวดหมู่อาการ"
                value={filter.category}
                onChange={handleCategoryChange}
                className="appearance-none pl-3 pr-7 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 shadow-xs transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat === 'All' ? 'หมวดหมู่: ทั้งหมด' : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Severity Dropdown */}
            <div className="relative">
              <select
                id="filter-severity-select"
                aria-label="เลือกระดับความรุนแรง"
                value={filter.severity}
                onChange={handleSeverityChange}
                className="appearance-none pl-3 pr-7 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 shadow-xs transition"
              >
                {SEVERITIES.map((sev) => (
                  <option key={sev} value={sev} className="bg-slate-900 text-white">
                    {sev === 'All' ? 'ความรุนแรง: ทั้งหมด' : `ระดับ: ${sev}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Starred Only Toggle */}
            <button
              id="filter-favorite-toggle"
              type="button"
              onClick={toggleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition shadow-xs ${
                filter.favoriteOnly
                  ? 'bg-amber-950/60 text-amber-300 border-amber-600/60 font-semibold'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
              }`}
              title="แสดงเฉพาะเคสที่ติดดาวไว้"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  filter.favoriteOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>ติดดาว</span>
            </button>

            {/* Reset Filters button if any active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-950/80 border border-rose-800/60 px-2.5 py-1.5 rounded-xl transition"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Keywords / Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="h-3 w-3" /> คีย์เวิร์ดยอดนิยม:
          </span>
          {QUICK_TAGS.map((tag) => {
            const isActive = filter.searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-2xs font-mono transition shadow-xs ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-750'
                }`}
              >
                #{tag}
              </button>
            );
          })}

          <span className="ml-auto text-xs text-slate-400 font-medium">
            พบ <strong className="text-white font-bold">{totalResults}</strong> เคส
          </span>
        </div>
      </div>
    </section>
  );
};
