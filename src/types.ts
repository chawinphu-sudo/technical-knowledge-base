export type VendorType = 'Nutanix' | 'Lenovo' | 'VMware' | 'Cisco' | 'Linux' | 'Windows' | 'General';

export type SeverityType = 'Critical' | 'High' | 'Medium' | 'Low';

export type CategoryType = 
  | 'Storage / Disk'
  | 'Hardware / Chassis'
  | 'Hypervisor / AHV'
  | 'Network / Switching'
  | 'Firmware / BIOS'
  | 'Cluster Services'
  | 'Power & Thermal'
  | 'General System';

export interface ResolutionStep {
  step: number;
  title: string;
  instruction: string;
  commands?: string[];
  notes?: string;
}

export interface ReferenceLink {
  label: string;
  url: string;
}

export interface KnowledgeCase {
  id: string;
  caseNumber: string; // e.g. KB-NTX-104
  title: string; // e.g. Nutanix CVM Stargate Service Unresponsive & Memory OOM
  vendor: VendorType;
  category: CategoryType;
  severity: SeverityType;
  hardwareModels: string[]; // e.g. ["Lenovo SR650", "ThinkSystem SE350"]
  errorCode?: string; // e.g. FQXSPPU0011M, NCC_CHECK_CVM_MEMORY
  symptoms: string; // อาการที่สังเกตได้
  rootCause: string; // สาเหตุของปัญหา
  resolutionSteps: ResolutionStep[]; // ขั้นตอนการแก้ไขปัญหา
  workaround?: string; // วิธีแก้ไขชั่วคราว
  verificationSteps?: string; // วิธีตรวจสอบว่าแก้สำเร็จแล้ว
  referenceLinks?: ReferenceLink[]; // ลิงก์อ้างอิง
  tags: string[]; // e.g. ["cvm", "stargate", "memory", "ncc"]
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  author?: string;
  isFavorite?: boolean;
}

export interface FilterOptions {
  searchQuery: string;
  vendor: VendorType | 'All';
  category: CategoryType | 'All';
  severity: SeverityType | 'All';
  tag?: string;
  favoriteOnly: boolean;
}
