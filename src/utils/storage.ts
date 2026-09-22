import { KnowledgeCase } from '../types';
import { INITIAL_CASES } from '../data/initialCases';

const STORAGE_KEY = 'tech_knowledge_base_cases_v1';

export function loadCases(): KnowledgeCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCases(INITIAL_CASES);
      return INITIAL_CASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_CASES;
  } catch (err) {
    console.error('Failed to load cases from localStorage:', err);
    return INITIAL_CASES;
  }
}

export function saveCases(cases: KnowledgeCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error('Failed to save cases to localStorage:', err);
  }
}

export function resetToDefaultCases(): KnowledgeCase[] {
  saveCases(INITIAL_CASES);
  return INITIAL_CASES;
}

export function exportCasesAsJSON(cases: KnowledgeCase[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cases, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `techops-knowledge-base-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function validateImportedCases(data: unknown): KnowledgeCase[] {
  if (!Array.isArray(data)) {
    throw new Error('ไฟล์ JSON ไม่ถูกต้อง: ข้อมูลต้องเป็น Array ของ Case');
  }

  // Basic validation of fields
  const validated = data.map((item, idx) => {
    if (!item.title || !item.vendor || !item.symptoms || !item.resolutionSteps) {
      throw new Error(`ข้อมูลเคสลำดับที่ ${idx + 1} ไม่ครบถ้วน (ต้องมี title, vendor, symptoms, resolutionSteps)`);
    }
    return {
      id: item.id || `case-import-${Date.now()}-${idx}`,
      caseNumber: item.caseNumber || `KB-${Date.now().toString().slice(-4)}`,
      title: String(item.title),
      vendor: item.vendor,
      category: item.category || 'General System',
      severity: item.severity || 'Medium',
      hardwareModels: Array.isArray(item.hardwareModels) ? item.hardwareModels : [],
      errorCode: item.errorCode || '',
      symptoms: String(item.symptoms),
      rootCause: String(item.rootCause || ''),
      resolutionSteps: Array.isArray(item.resolutionSteps) ? item.resolutionSteps : [],
      workaround: item.workaround || '',
      verificationSteps: item.verificationSteps || '',
      referenceLinks: Array.isArray(item.referenceLinks) ? item.referenceLinks : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: item.author || 'Imported User',
      isFavorite: Boolean(item.isFavorite),
    } as KnowledgeCase;
  });

  return validated;
}
