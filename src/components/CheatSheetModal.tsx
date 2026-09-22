import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Server, ShieldCheck, Zap } from 'lucide-react';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  title: string;
  command: string;
  description: string;
}

const NUTANIX_COMMANDS: { category: string; commands: CommandItem[] }[] = [
  {
    category: '1. ตรวจสอบสถานะ Cluster และ Service (CVM)',
    commands: [
      {
        title: 'ตรวจสอบสถานะเซอร์วิสทั้งหมดบน Cluster',
        command: 'cluster status',
        description: 'ดูว่า Stargate, Cassandra, Zookeeper, Genesis ทำงานปกติ (UP) หรือไม่',
      },
      {
        title: 'ค้นหาเฉพาะเซอร์วิสที่ DOWN หรือผิดปกติ',
        command: 'cluster status | grep -i -E "down|stop"',
        description: 'กรองดูเฉพาะ Node หรือ Service ที่มีปัญหา',
      },
      {
        title: 'รีสตาร์ต Genesis บน CVM ตัวที่มีปัญหา',
        command: 'genesis restart',
        description: 'รีสตาร์ต service manager เพื่อ restart service ย่อยที่ค้าง',
      },
      {
        title: 'รีสตาร์ต Genesis บนทุก CVM พร้อมกัน',
        command: 'allssh "genesis restart"',
        description: 'รันคำสั่ง Genesis restart บนทุก CVM ในคัสเตอร์พร้อมกัน',
      },
    ],
  },
  {
    category: '2. ตรวจสอบและจัดการดิสก์ (Disk & Storage)',
    commands: [
      {
        title: 'ดูรายการดิสก์ทั้งหมด พร้อม Serial Number & Slot',
        command: 'ncli disk list',
        description: 'ตรวจสอบสถานะ Online/Offline, ความจุ, หมายเลขซีเรียลของดิสก์',
      },
      {
        title: 'สั่งเปิดไฟ LED หน้าตู้เพื่อระบุตำแหน่งดิสก์ที่เสีย',
        command: 'ncli disk set-led id=<DISK_ID> status=true',
        description: 'เปิดไฟ Locator LED สีน้ำเงิน/ส้มหน้า Drive Slot เพื่อป้องกันการดึงผิดลูก',
      },
      {
        title: 'สั่งปิดไฟ LED หลังเปลี่ยนดิสก์เสร็จ',
        command: 'ncli disk set-led id=<DISK_ID> status=false',
        description: 'ปิดไฟ Locator LED',
      },
      {
        title: 'ตรวจสอบระดับ Data Resiliency (ความปลอดภัยของข้อมูล)',
        command: 'nodetool -h 127.0.0.1 ring',
        description: 'ตรวจสอบ Token ring และการกระจายตัวของ Cassandra Metadata',
      },
    ],
  },
  {
    category: '3. รัน Nutanix Cluster Check (NCC)',
    commands: [
      {
        title: 'รัน NCC ตรวจสอบสุขภาพทั้งระบบ (Run All)',
        command: 'ncc health_checks run_all',
        description: 'รันชุดตรวจเช็คทั้งหมด แนะนำให้รันก่อนและหลังอัปเกรด AOS',
      },
      {
        title: 'รันเฉพาะตรวจสอบ Disk & ฮาร์ดแวร์',
        command: 'ncc health_checks hardware_checks disk_checks run_all',
        description: 'ตรวจเช็คเฉพาะความสมบูรณ์ของดิสก์และ SMART data',
      },
      {
        title: 'รันเฉพาะการใช้งาน Memory ของ CVM',
        command: 'ncc health_checks hardware_checks cvm_checks check_cvm_memory_usage',
        description: 'ตรวจดูว่า CVM มี RAM เหลือเพียงพอหรือไม่ ป้องกัน OOM',
      },
    ],
  },
  {
    category: '4. AHV Host & Maintenance Mode',
    commands: [
      {
        title: 'ดูรายการ Host และ IP ใน Cluster ผ่าน acli',
        command: 'acli host.list',
        description: 'แสดงรายการ AHV Nodes ทั้งหมดในระบบ',
      },
      {
        title: 'นำ AHV Node เข้า Maintenance Mode (Live Migrate VM ออก)',
        command: 'acli host.enter_maintenance_mode <HOST_IP> wait=true',
        description: 'ย้าย VM ทั้งหมดไปยัง Node อื่นก่อนทำการ Maintenance หรือ Flash Firmware',
      },
      {
        title: 'นำ AHV Node ออกจาก Maintenance Mode',
        command: 'acli host.exit_maintenance_mode <HOST_IP>',
        description: 'นำโหนดกลับเข้ามารับ Workload ตามเดิม',
      },
    ],
  },
];

const LENOVO_COMMANDS: { category: string; commands: CommandItem[] }[] = [
  {
    category: '1. XClarity Controller (XCC) SSH CLI Commands',
    commands: [
      {
        title: 'รีสตาร์ต XCC Service Processor โดยไม่ดับ Server',
        command: 'resetsp',
        description: 'คำสั่งแก้ปัญหาหน้าเว็บ XCC ค้างหรือหมุนช้า ไม่กระทบกับระบบปฏิบัติการของ Server',
      },
      {
        title: 'ตรวจสอบสถานะสุขภาพและ System Health Sensors',
        command: 'syshealth -l',
        description: 'แสดงรายการเซ็นเซอร์ Power, Fan, Temp, Voltage, DIMM และสถานะผิดปกติ',
      },
      {
        title: 'ตรวจสอบระดับการจ่ายกระแสไฟ Power Supplies (PSU)',
        command: 'fuelgauge',
        description: 'ดูการบริโภคพลังงาน (Watts) และค่า Voltage ปัจจุบันของ PSU1 และ PSU2',
      },
      {
        title: 'ดูการตั้งค่า Network IP Address ของ XCC',
        command: 'ipconfig -l',
        description: 'ตรวจสอบ IP, Netmask, Gateway และ MAC address ของพอร์ต Management',
      },
    ],
  },
  {
    category: '2. MegaRAID / Storage Controller (StorCLI)',
    commands: [
      {
        title: 'ตรวจสอบว่ามี Foreign Configuration ค้างอยู่หรือไม่',
        command: 'storcli /c0 show foreign',
        description: 'ตรวจสอบ Virtual Drive ที่ขึ้นสถานะ Foreign บน Controller 0',
      },
      {
        title: 'สั่ง Import Foreign Configuration กู้คืน RAID Array',
        command: 'storcli /c0/fall import',
        description: 'โหลดค่าคอนฟิก RAID จากดิสก์เข้าสู่ Controller โดยข้อมูลไม่สูญหาย',
      },
      {
        title: 'ดูสถานะ Virtual Drives (VD) และดิสก์ทั้งหมด',
        command: 'storcli /c0 /dall show',
        description: 'ดูสถานะ Optimal, Degraded, Failed และความเร็ว Link Speed',
      },
      {
        title: 'สั่ง Rebuild ดิสก์ลูกใหม่ใน Slot ที่เปลี่ยน',
        command: 'storcli /c0/e<Enclosure_ID>/s<Slot_ID> start rebuild',
        description: 'สั่งเริ่มกระบวนการ Rebuild ข้อมูลดิสก์',
      },
    ],
  },
  {
    category: '3. In-Band IPMI & Linux Reset',
    commands: [
      {
        title: 'สั่ง Reset BMC (XCC) จากใน OS ของ Linux ด้วย IPMI',
        command: 'ipmitool mc reset cold',
        description: 'ใช้เมื่อไม่สามารถเข้า SSH หรือ Web ของ XCC ได้จากภายนอก',
      },
      {
        title: 'ดึงรายการ Sensor Data Repository (SDR) ผ่าน IPMI',
        command: 'ipmitool sdr list',
        description: 'ดูอุณหภูมิ CPU, ความเร็วรอบพัดลม และสถานะ Power Supply',
      },
      {
        title: 'ดู System Event Log (SEL) ผ่าน ipmitool',
        command: 'ipmitool sel list | tail -n 20',
        description: 'ดู Event Log 20 รายการล่าสุดเพื่อหาสาเหตุ Hardware Alert',
      },
    ],
  },
];

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'Nutanix' | 'Lenovo'>('Nutanix');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const sections = activeTab === 'Nutanix' ? NUTANIX_COMMANDS : LENOVO_COMMANDS;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div
        className="relative bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">CLI Technical Cheat Sheet</h2>
              <p className="text-2xs text-slate-400">
                รวมชุดคำสั่งยอดนิยมสำหรับแก้ปัญหา Nutanix CVM/AHV และ Lenovo ThinkSystem/XCC
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

        {/* Tab Selector */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('Nutanix')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'Nutanix'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Nutanix CLI (CVM / acli / ncli / ncc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('Lenovo')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'Lenovo'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Lenovo CLI (XCC / StorCLI / IPMI)</span>
          </button>
        </div>

        {/* Commands List */}
        <div className="px-6 py-4 overflow-y-auto space-y-5 flex-1">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-1">
                {sec.category}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sec.commands.map((cmd, cIdx) => {
                  const cmdKey = `${activeTab}-${sIdx}-${cIdx}`;
                  const isCopied = copiedIndex === cmdKey;

                  return (
                    <div
                      key={cIdx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div className="mb-2">
                        <h4 className="text-xs font-bold text-white mb-0.5">{cmd.title}</h4>
                        <p className="text-2xs text-slate-400 leading-tight">{cmd.description}</p>
                      </div>

                      <div className="bg-black/80 border border-slate-850 rounded-lg p-2 font-mono text-2xs text-emerald-400 flex items-center justify-between gap-2 overflow-hidden">
                        <code className="truncate selection:bg-slate-800">{cmd.command}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(cmd.command, cmdKey)}
                          className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-3xs font-sans font-semibold transition flex items-center gap-1"
                          title="คัดลอกคำสั่ง"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-2xs text-slate-400">
          <span>* คลิกปุ่ม "Copy" บนคำสั่งที่ต้องการ แล้วนำไปวางใน SSH Terminal ได้ทันที</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
