import { KnowledgeCase } from '../types';

export const INITIAL_CASES: KnowledgeCase[] = [
  {
    id: 'case-ntx-001',
    caseNumber: 'KB-NTX-101',
    title: 'Nutanix CVM Stargate Service Unresponsive & CVM Out of Memory (OOM)',
    vendor: 'Nutanix',
    category: 'Cluster Services',
    severity: 'Critical',
    hardwareModels: ['Nutanix NX-3060-G7', 'NX-8035-G8', 'Lenovo ThinkAgile HX3320'],
    errorCode: 'NCC: stargate_not_responding / CVM_OOM_KILLER',
    symptoms: 'Prism Element แสดงสถานะแจ้งเตือน Stargate down หรือ CVM Unresponsive, VM บน Node นั้นมี Disk I/O latency สูงผิดปกติ, SSH เข้า CVM ช้ามากหรือ connection refused',
    rootCause: 'Stargate process ใช้หน่วยความจำ (RAM) สูงเกินขีดจำกัดของ CVM เนื่องจาก workload read/write cache หรือ deduplication cache สูง ส่งผลให้ Linux Linux OOM-killer ทำการ kill process Stargate หรือ Genesis',
    resolutionSteps: [
      {
        step: 1,
        title: 'ตรวจสอบสถานะ Service ของ Cluster ผ่าน CVM อื่นใน Node เดียวกัน',
        instruction: 'SSH เข้าสู่ CVM เครื่องใดเครื่องหนึ่งที่ยังปกติ และตรวจสอบว่า Stargate บน CVM ตัวที่มีปัญหา down อยู่หรือไม่',
        commands: [
          'ssh nutanix@<CVM_IP>',
          'cluster status | grep -E "Stargate|Down"'
        ],
        notes: 'หากพบ Stargate แสดงสถานะ DOWN ให้บันทึก CVM IP และ Service PID ไว้'
      },
      {
        step: 2,
        title: 'ตรวจสอบ Log การเกิด OOM Killer',
        instruction: 'ตรวจสอบ dmesg และ messages log บน CVM ที่มีปัญหาเพื่อยืนยันว่า Linux OOM killer สั่ง terminate Stargate จริง',
        commands: [
          'dmesg -T | grep -i -E "oom|out of memory|killed process"',
          'grep -i "invoked oom-killer" /var/log/messages'
        ]
      },
      {
        step: 3,
        title: 'เพิ่ม CVM Memory และทำการ Start Service คืนระบบ',
        instruction: 'เข้าสู่ AHV host ของ CVM ดังกล่าว เพื่อเพิ่ม RAM ของ CVM (เช่น จาก 32GB เป็น 40GB หรือ 48GB ตาม Nutanix Sizing Guide)',
        commands: [
          '# รันบน AHV Host:',
          'virsh list --all',
          'virsh setmem <CVM_NAME> 41943040 --config',
          'virsh setmaxmem <CVM_NAME> 41943040 --config',
          '# จากนั้นรันบน CVM เพื่อ start genesis และ Stargate:',
          'genesis restart',
          'cluster start'
        ],
        notes: 'ให้แน่ใจว่า AHV Host มี RAM เหลือเพียงพอก่อนเพิ่ม CVM RAM'
      },
      {
        step: 4,
        title: 'รัน NCC ตรวจสอบความสมบูรณ์ของระบบหลังแก้ไข',
        instruction: 'รัน Nutanix Cluster Check เฉพาะโมดูล memory และ stargate เพื่อตรวจสุขภาพหลัง recovery',
        commands: [
          'ncc health_checks hardware_checks cvm_checks check_cvm_memory_usage',
          'ncc health_checks system_checks stargate_checks'
        ]
      }
    ],
    workaround: 'หากยังไม่สามารถเพิ่ม RAM ได้ทันที ให้ Restart genesis บน CVM: "genesis restart" เพื่อคืน RAM ชั่วคราว และ migrate workload บางส่วนออกจาก host ชั่วคราว',
    verificationSteps: 'รัน "cluster status" ต้องแสดงสถานะ Stargate และ service ทั้งหมดเป็น "UP" ครบทุก CVM และ latency ใน Prism Element กลับสู่ระดับปกติ (<5ms)',
    referenceLinks: [
      { label: 'Nutanix KB-1002 (CVM Memory Sizing)', url: 'https://portal.nutanix.com/page/documents/kbs/details?targetId=kA00e000000Cc5TCAS' },
      { label: 'Nutanix Field Advisory - Stargate OOM', url: 'https://portal.nutanix.com' }
    ],
    tags: ['CVM', 'Stargate', 'OOM', 'Memory', 'NCC', 'Prism'],
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-09-02T14:10:00Z',
    author: 'Infrastructure Support Team',
    isFavorite: true
  },
  {
    id: 'case-len-001',
    caseNumber: 'KB-LEN-102',
    title: 'Lenovo ThinkSystem SR650 - XCC System Health Sensor Amber (PSU Redundancy Lost)',
    vendor: 'Lenovo',
    category: 'Power & Thermal',
    severity: 'High',
    hardwareModels: ['Lenovo ThinkSystem SR650', 'SR650 V2', 'SR630'],
    errorCode: 'FQXSPPU0011M / EventID: 806f0011-2581ffff',
    symptoms: 'ไฟ Check Log LED ด้านหน้าเครื่องติดสว่างเป็นสีส้ม (Amber), หน้าจอ XClarity Controller (XCC) แจ้งเตือน Critical/Warning "Power supply redundancy is lost. Power Supply 2 is offline or disconnected"',
    rootCause: 'Power Supply Unit 2 ไม่ได้รับไฟฟ้ากระแสสลับ (AC Loss), สายไฟหลวม, PDU เบรกเกอร์ทริป หรือตัวโมดูล PSU2 เกิด Firmware Lockup / ฮาร์ดแวร์เสียหาย',
    resolutionSteps: [
      {
        step: 1,
        title: 'ตรวจสอบสถานะ Physical LED และสาย Power Feed',
        instruction: 'ตรวจสอบไฟ LED ด้านหลัง PSU2 ของ Server ว่าติดสีเขียว, กะพริบ, หรือดับสนิท และตรวจสอบว่าเสียบสายแน่นกับ PDU สายหลัก/สายสำรองหรือไม่',
        commands: [
          '# ตรวจสอบผ่าน SSH XCC CLI:',
          'ssh USERID@<XCC_IP>',
          'syshealth -l'
        ],
        notes: 'LED หลัง PSU: สีเขียวค้าง = ปกติ, ส้ม = เกิดความผิดพลาดที่ตัว PSU, ดับ = ไม่มีไฟเข้า'
      },
      {
        step: 2,
        title: 'ตรวจสอบ Event Log และค่า Voltage ใน XCC Web GUI',
        instruction: 'เข้าสู่ XCC Web Interface -> Events -> Event Log และไปที่ Hardware Inventory -> Power Supplies เพื่อดู Input Voltage และ Power Wattage ปัจจุบัน',
        commands: [
          '# คำสั่ง CLI ดูสถานะพลังงาน:',
          'fuelgauge'
        ]
      },
      {
        step: 3,
        title: 'ขั้นตอนการ Reseat และสลับ Slot เพื่อแยกว่าเป็นที่ PSU หรือ Backplane',
        instruction: '1. ปลดสายไฟ AC ออกจาก PSU2 รอ 15 วินาที\n2. ถอดตัว PSU2 ออกจาก Bay แล้วเสียบกลับเข้าไปใหม่จนได้ยินเสียงล็อกแน่น\n3. เสียบสายไฟ AC คืน และสังเกตไฟเขียว\n4. หากยังไม่ติด ให้สลับ PSU1 และ PSU2 เพื่อทดสอบว่าเสียที่ตัว Supply หรือที่ Power Distribution Backplane',
        notes: 'เนื่องจากมี Redundant PSU ตัวที่ 1 ทำงานอยู่ การ Reseat PSU2 สามารถทำได้ขณะ Server เปิดทำงาน (Hot-swappable)'
      },
      {
        step: 4,
        title: 'Clear Event Log และ Restart XCC Management Controller',
        instruction: 'หากไฟ PSU กลับมาเขียวแต่ Alarm หน้า XCC ยังค้าง ให้ทำการ Reset XCC (ไม่มีผลกระทบต่อระบบปฏิบัติการของ Server)',
        commands: [
          '# บน XCC CLI:',
          'resetsp',
          '# หรือผ่าน URL: Maintenance -> Reset Management Controller'
        ]
      }
    ],
    workaround: 'หาก PSU ชำรุด ให้เปิดใช้งานโหมด Non-redundant ใน XCC และเร่งเปิดเคสเปลี่ยนอะไหล่กับ Lenovo Support Part Number: 4P57A72900 (750W Titanium)',
    verificationSteps: 'หน้า Overview ของ XCC System Health ต้องเปลี่ยนเป็นเครื่องหมายถูกสีเขียว "Normal" และไฟหน้าเครื่องดับลง Event Log แสดง "Power supply redundancy restored"',
    referenceLinks: [
      { label: 'Lenovo Support - Message FQXSPPU0011M Guide', url: 'https://pubs.lenovo.com/xcc-messages/fqxsppu0011m' },
      { label: 'Lenovo ThinkSystem Maintenance Manual', url: 'https://lenovopress.lenovo.com' }
    ],
    tags: ['XCC', 'PowerSupply', 'PSU', 'Amber', 'FQXSPPU0011M', 'SR650'],
    createdAt: '2026-08-20T11:15:00Z',
    updatedAt: '2026-09-10T16:45:00Z',
    author: 'Data Center Ops',
    isFavorite: true
  },
  {
    id: 'case-ntx-002',
    caseNumber: 'KB-NTX-103',
    title: 'Nutanix Metadata / Data Disk Failure (Stargate & Curator Auto-Rebuild)',
    vendor: 'Nutanix',
    category: 'Storage / Disk',
    severity: 'High',
    hardwareModels: ['Nutanix NX-3060-G7', 'Lenovo HX3320', 'Dell XC640'],
    errorCode: 'NCC: disk_failure_check / DISK_OFFLINE_STALE',
    symptoms: 'Prism Element แจ้งเตือนสีแดง "Physical disk in slot X host Y is marked offline or dead", Storage Pool สถานะ Warning, Curator เริ่มรัน Data Resynchronization',
    rootCause: 'SSD หรือ HDD เกิด Media Error, Bad Sector สะสมเกินเกณฑ์ SMART Threshold หรือ Controller ตรวจพบ I/O Timeout ซ้ำซ้อน ระบบ Stargate จึงสั่ง Mark Offline อัตโนมัติเพื่อป้องกันข้อมูลคลาดเคลื่อน',
    resolutionSteps: [
      {
        step: 1,
        title: 'ระบุ Disk ID และ Serial Number ของดิสก์ที่เสีย',
        instruction: 'SSH เข้า CVM เครื่องใดก็ได้ และค้นหา Disk ID และ Serial Number เพื่อความแม่นยำก่อนถอดเปลี่ยนฮาร์ดแวร์',
        commands: [
          'ssh nutanix@<CVM_IP>',
          'ncli disk list | grep -E "Id|Serial|Location|State"'
        ],
        notes: 'บันทึก Disk ID (เช่น 142) และ Slot Location (เช่น Node B Slot 2)'
      },
      {
        step: 2,
        title: 'ตรวจสอบสถานะ Data Resync และ Cluster Tolerance',
        instruction: 'ตรวจสอบว่าระบบสามารถทนต่อการเสียของ Node อื่นได้หรือไม่ (Data Resiliency Status) และระบบ Rebuild เสร็จหรือยัง',
        commands: [
          'nodetool -h 127.0.0.1 ring',
          'curator_cli get_curator_state'
        ]
      },
      {
        step: 3,
        title: 'สั่งเปิดไฟ LED บนดิสก์ที่มีปัญหาเพื่อระบุตำแหน่งหน้าตู้ Rack',
        instruction: 'เปิดไฟ LED Locator ที่ตัวดิสก์เพื่อป้องกันไม่ให้เจ้าหน้าที่หน้างานดึงดิสก์ผิดลูก',
        commands: [
          'ncli disk set-led id=<DISK_ID> status=true'
        ],
        notes: 'ไฟ LED หน้าถาด Disk Slot นั้นจะกะพริบเป็นสีน้ำเงิน/ส้ม'
      },
      {
        step: 4,
        title: 'ถอดเปลี่ยน Disk ใหม่ และปิดไฟ Locator LED',
        instruction: 'ดึงลูกเก่าออก เสียบลูกใหม่เข้าไป รอ 3-5 นาที Nutanix จะทำ Auto-Discovery หรือสั่งตรวจเช็คดิสก์ใหม่',
        commands: [
          'ncli disk set-led id=<DISK_ID> status=false',
          '# ตรวจสอบการ Detect ดิสก์ใหม่:',
          'lsscsi',
          'ncli disk list'
        ]
      },
      {
        step: 5,
        title: 'รัน NCC Disk Check ยืนยันความสมบูรณ์',
        instruction: 'รันชุดตรวจสุขภาพของ Disk subsystem ทั้งหมดบน Cluster',
        commands: [
          'ncc health_checks hardware_checks disk_checks run_all'
        ]
      }
    ],
    workaround: 'หาก Cluster มีพื้นที่เหลือพอ ระบบจะ Auto-rebuild ให้ข้อมูลครบ 2 หรือ 3 copies (RF2/RF3) อัตโนมัติระหว่างรออะไหล่เคลมจาก Vendor',
    verificationSteps: 'คำสั่ง "ncli disk list" แสดงดิสก์ใหม่ในสถานะ "Online", Storage Pool ความจุกลับมาปกติ และ Data Resiliency Status ใน Prism Element เป็นสีเขียว "OK (FT: 1)"',
    referenceLinks: [
      { label: 'Nutanix KB-1211: Replacing a Failed Disk in Nutanix Cluster', url: 'https://portal.nutanix.com/page/documents/kbs/details?targetId=kA00e000000Cs23CAC' }
    ],
    tags: ['Disk', 'SSD', 'Curator', 'Stargate', 'ncli', 'NCC', 'Storage'],
    createdAt: '2026-08-25T14:20:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
    author: 'SAN & Storage Specialist',
    isFavorite: false
  },
  {
    id: 'case-len-002',
    caseNumber: 'KB-LEN-104',
    title: 'Lenovo ThinkSystem - MegaRAID 930-8i Controller Foreign Configuration Detected',
    vendor: 'Lenovo',
    category: 'Firmware / BIOS',
    severity: 'Critical',
    hardwareModels: ['ThinkSystem SR650', 'SR630', 'SR550', 'ST550'],
    errorCode: 'RAID_FOREIGN_CFG_0x11 / POST 0x806F',
    symptoms: 'เมื่อเปิดเครื่อง Server ค้างที่หน้า POST พร้อมข้อความ "Foreign configuration(s) found on adapter. Press Any Key to continue or F1 for Setup", ระบบปฏิบัติการไม่สามารถ Boot ได้',
    rootCause: 'RAID Controller ตรวจพบลายเซ็นข้อมูล (DDF Metadata) บนดิสก์ไม่ตรงกับ Configuration เดิมใน NVRAM ของ Controller ซึ่งมักเกิดหลังจากย้าย Slot ดิสก์, เปลี่ยน Controller ใบใหม่ หรือเกิดไฟดับกะทันหัน',
    resolutionSteps: [
      {
        step: 1,
        title: 'เข้าสู่ LXPM (Lenovo XClarity Provisioning Manager)',
        instruction: 'กด F1 ตอนบูตเครื่องเพื่อเข้าสู่ UEFI Setup / Lenovo XClarity Provisioning Manager',
        notes: 'อย่ากด "Clear" หรือ "Initialize" เด็ดขาด เพราะข้อมูลใน Array จะสูญหาย!'
      },
      {
        step: 2,
        title: 'ตรวจสอบรายละเอียด Foreign Configuration',
        instruction: 'ไปที่เมนู: UEFI Setup -> System Settings -> Storage -> LSI MegaRAID <930-8i> Configuration Utility -> Controller Management -> Foreign Configuration',
        commands: [
          '# หากรันผ่าน StorCLI บน Live Linux / Rescue OS:',
          'storcli /c0 /dall show',
          'storcli /c0 show foreign'
        ]
      },
      {
        step: 3,
        title: 'เลือกคำสั่ง Preview และ Import Foreign Configuration',
        instruction: '1. ในหน้า Foreign Configuration เลือก "Preview Foreign Configuration"\n2. ตรวจสอบว่า Virtual Drive (VD) และสมาชิกดิสก์แสดงสถานะ Optimal/Normal ครบถ้วน\n3. กดปุ่ม "Import Foreign Configuration"\n4. ทำเครื่องหมาย [X] Confirm และกดยืนยัน (Yes)',
        commands: [
          '# คำสั่ง StorCLI CLI สำหรับ Import Foreign Config:',
          'storcli /c0/fall import'
        ],
        notes: 'คำสั่ง Import จะโหลดค่า RAID Array จากดิสก์กลับเข้า Controller NVRAM โดยไม่สูญเสียข้อมูล'
      },
      {
        step: 4,
        title: 'Save ค่าใน UEFI และ Reboot ระบบ',
        instruction: 'กด Exit -> Save Changes and Exit ระบบจะรีบูตและเข้าสู่ OS (ESXi / Windows / Linux) ตามปกติ',
        notes: 'ตรวจสอบว่า Virtual Drive กลับมามีสถานะ "Optimal"'
      }
    ],
    workaround: 'หาก Import ไม่สำเร็จและมีดิสก์บางลูกหลุด ให้ตรวจสอบสาย Mini-SAS HD / SlimSAS และรัน Diagnostics ทดสอบดิสก์',
    verificationSteps: 'เครื่อง Server บูตเข้าสู่ระบบปฏิบัติการสำเร็จ และในหน้า LXPM หรือ XCC Storage แสดงสถานะ Virtual Drive เป็น "Optimal" สีเขียว',
    referenceLinks: [
      { label: 'Lenovo Support: How to import a foreign configuration in LXPM', url: 'https://support.lenovo.com/solutions/ht507499' }
    ],
    tags: ['MegaRAID', 'RAID', 'ForeignConfig', 'LXPM', 'UEFI', 'StorCLI'],
    createdAt: '2026-08-28T08:00:00Z',
    updatedAt: '2026-09-15T13:20:00Z',
    author: 'Field Engineering Team',
    isFavorite: true
  },
  {
    id: 'case-ntx-003',
    caseNumber: 'KB-NTX-105',
    title: 'Nutanix Prism Element Cluster Virtual IP (VIP) Failover & ARP Cache Issue',
    vendor: 'Nutanix',
    category: 'Network / Switching',
    severity: 'Medium',
    hardwareModels: ['All Nutanix Models (NX, Lenovo HX, Dell XC)'],
    errorCode: 'ERR_CLUSTER_VIP_TIMEOUT / ARP_STALE',
    symptoms: 'ไม่สามารถเปิดหน้าเว็บ Prism Element ผ่าน Cluster VIP ได้ (https://<VIP>:9440) แต่ยังสามารถเปิดผ่าน CVM IP ของแต่ละ Node ได้ตามปกติ และ ping VIP มี packet loss',
    rootCause: 'Node ที่ถือ VIP เกิดการ Restart หรือ Failover ทำให้ MAC address ของ VIP เปลี่ยนไปยัง CVM เครื่องใหม่ แต่ Core Switch / ToR Switch ยังค้างค่า Dynamic ARP Table เก่า (Stale ARP entry) ไม่ยอมอัปเดต Gratuitous ARP (GARP)',
    resolutionSteps: [
      {
        step: 1,
        title: 'ตรวจสอบว่า CVM ตัวใดถือ VIP อยู่ในปัจจุบัน',
        instruction: 'SSH เข้า CVM เครื่องใดเครื่องหนึ่ง แล้วตรวจดูว่า CVM ใดเป็นเจ้าของ VIP ปัจจุบัน',
        commands: [
          'ssh nutanix@<CVM_IP>',
          'cluster info | grep -i "virtual_ip"'
        ]
      },
      {
        step: 2,
        title: 'ตรวจสอบ IP config บน CVM interface eth0',
        instruction: 'รัน allssh เพื่อดูว่า VIP ไป bind อยู่ที่ CVM เครื่องไหน',
        commands: [
          'allssh "ip addr show eth0:1 || ip addr show eth0"'
        ],
        notes: 'VIP จะถูก assign เป็น sub-interface เช่น eth0:1 บน CVM ที่ทำหน้าที่ Active VIP'
      },
      {
        step: 3,
        title: 'สั่งส่ง Gratuitous ARP (GARP) เพื่อบังคับให้ Switch อัปเดต MAC Address',
        instruction: 'บน CVM ที่ถือ VIP ให้รันคำสั่ง arping บังคับ broadcast MAC ใหม่ไปยัง Switch',
        commands: [
          'sudo arping -U -c 5 -I eth0 <CLUSTER_VIP_IP>'
        ]
      },
      {
        step: 4,
        title: 'หรือทำการ Re-assign Cluster VIP เพื่อสลับโหนดถือสิทธิ์',
        instruction: 'หาก ARP ยังไม่เคลียร์ ให้สั่ง unbind และ set VIP ใหม่ผ่าน CVM CLI:',
        commands: [
          'ncli cluster clear-external-ip-address',
          'ncli cluster set-external-ip-address external-ip-address=<CLUSTER_VIP_IP>'
        ],
        notes: 'คำสั่งนี้ไม่กระทบกับ Storage Traffic หรือ VM ที่รันอยู่ กระทบเฉพาะการเปิดหน้าเว็บ Prism Element'
      }
    ],
    workaround: 'ล็อกอินเข้าบริหารจัดการ Cluster ผ่าน IP ของ CVM เครื่องใดก็ได้โดยตรง (https://<CVM_IP>:9440) ชั่วคราวระหว่างรอ ARP บน Switch หมดอายุ (Aging Time)',
    verificationSteps: 'ทดสอบเปิดเบราว์เซอร์ https://<CLUSTER_VIP_IP>:9440 เข้าหน้า Login ของ Prism Element ได้ทันที และทดสอบ ping VIP ได้ response time < 1ms คงที่',
    referenceLinks: [
      { label: 'Nutanix KB-1123: Managing Cluster External IP', url: 'https://portal.nutanix.com' }
    ],
    tags: ['Network', 'VIP', 'Prism', 'ARP', 'Switch', 'Failover'],
    createdAt: '2026-09-01T15:00:00Z',
    updatedAt: '2026-09-18T09:40:00Z',
    author: 'Network & Virtualization Admin',
    isFavorite: false
  },
  {
    id: 'case-len-003',
    caseNumber: 'KB-LEN-106',
    title: 'Lenovo XClarity Controller (XCC) Web UI Unresponsive / HTTP 500 หรือ Connection Refused',
    vendor: 'Lenovo',
    category: 'Hardware / Chassis',
    severity: 'Medium',
    hardwareModels: ['Lenovo ThinkSystem SR650, SR630, ST550, SE350'],
    errorCode: 'XCC_DAEMON_HANG / HTTP_REFUSED',
    symptoms: 'ไม่สามารถเปิดหน้าเว็บ XCC Management ได้ (หมุนค้างหรือขึ้น ERR_CONNECTION_REFUSED) แต่ยัง Ping IP ของ XCC เจอ และ OS ของ Server ยังทำงานปกติทุกอย่าง',
    rootCause: 'XCC Web Server daemon (lighttpd/nginx ภายใน Service Processor) เกิด Memory leak หรือ Thread Deadlock หลังจากไม่ได้ Reboot XCC เป็นเวลานาน หรือโดน Security Scanner สแกนพอร์ตถี่เกินไป',
    resolutionSteps: [
      {
        step: 1,
        title: 'ทดสอบการเชื่อมต่อ SSH ไปยัง XCC CLI',
        instruction: 'เนื่องจาก Web UI ค้าง แต่ SSH Service ของ XCC มักจะยังตอบสนองได้ ให้ล็อกอินผ่าน SSH Port 22',
        commands: [
          'ssh USERID@<XCC_IP>',
          '# ป้อน Password ของ XCC Admin'
        ]
      },
      {
        step: 2,
        title: 'สั่ง Restart XCC Service Processor (SP)',
        instruction: 'รันคำสั่ง resetsp เพื่อรีสตาร์ตเฉพาะหน่วยประมวลผล XCC โดยไม่มีผลกระทบต่อเครื่อง Server และ OS ที่รันอยู่',
        commands: [
          'resetsp',
          '# รอประมาณ 3 ถึง 5 นาทีเพื่อให้ XCC Boot ขึ้นมาใหม่'
        ],
        notes: 'คำสั่ง resetsp ปลอดภัย 100% ไม่ทำให้ Server ดับหรือรีบูต'
      },
      {
        step: 3,
        title: 'ทางเลือก: กรณีที่ SSH ไม่ตอบสนอง ให้ใช้คำสั่ง OneCLI หรือ IPMI ผ่าน OS',
        instruction: 'หาก SSH เข้าไม่ได้ ให้รัน OneCLI หรือ ipmitool จากบนตัว OS ของ Server เอง (Local In-Band Reset):',
        commands: [
          '# บน Linux Server ที่รันอยู่:',
          'ipmitool mc reset cold',
          '# หรือใช้ Lenovo OneCLI:',
          './onecli misc coldreset'
        ]
      },
      {
        step: 4,
        title: 'อัปเดต Firmware XCC เป็นเวอร์ชันล่าสุด',
        instruction: 'เมื่อเข้า Web UI ได้แล้ว ให้ดาวน์โหลด XCC Firmware ล่าสุดเพื่อแก้ไขปัญหา Web daemon hang ถาวร',
        notes: 'ไปที่ XCC Web -> Maintenance -> Firmware Update'
      }
    ],
    workaround: 'ใช้ In-Band IPMI Tool หรือใช้ Lenovo XClarity Administrator (LXCA) สั่งการเครื่อง Server แทนการเข้า Web UI โดยตรง',
    verificationSteps: 'เข้าหน้าเว็บ XCC ผ่าน Browser ได้รวดเร็ว หน้า Login โหลดสมบูรณ์ และทดสอบเปิด Remote KVM Console ได้ปกติ',
    referenceLinks: [
      { label: 'Lenovo Support: How to restart the XClarity Controller', url: 'https://support.lenovo.com/solutions/ht507647' }
    ],
    tags: ['XCC', 'WebUI', 'resetsp', 'IPMI', 'OneCLI', 'BMC'],
    createdAt: '2026-09-03T10:10:00Z',
    updatedAt: '2026-09-19T11:05:00Z',
    author: 'Platform Infrastructure Team',
    isFavorite: false
  },
  {
    id: 'case-ntx-004',
    caseNumber: 'KB-NTX-107',
    title: 'Lenovo HX Series (Nutanix Appliance) - LCM Firmware Mismatch & AHV Host Maintenance Failure',
    vendor: 'Nutanix',
    category: 'Firmware / BIOS',
    severity: 'High',
    hardwareModels: ['Lenovo ThinkAgile HX3320', 'HX5520', 'HX7520'],
    errorCode: 'LCM_FW_MISMATCH_ERR / LCM-5002',
    symptoms: 'การรัน Nutanix LCM (LifeCycle Manager) เพื่ออัปเดต Firmware Disk/BIOS/HBA ล้มเหลวที่สเต็ป "Entering Host Maintenance Mode" หรือแจ้งเตือนว่า Firmware Catalog ไม่ตรงกับ Lenovo BOM',
    rootCause: 'มี VM บางตัวถูกล็อกด้วย Host Affinity Rule (เช่น CVM หรือ Virtual Appliance ที่ห้าม Migrate) หรือ AHV Maintenance Mode ติด timeout เนื่องจาก VM ใช้เวลานานในการ Live Migrate ข้าม Node',
    resolutionSteps: [
      {
        step: 1,
        title: 'ตรวจสอบ VM ที่ไม่สามารถ Live Migrate ออกจาก Host ได้',
        instruction: 'SSH เข้า CVM และใช้ acli ตรวจสอบรายการ VM ที่ยังค้างอยู่บน Host ดังกล่าว',
        commands: [
          'ssh nutanix@<CVM_IP>',
          'acli host.list',
          'acli host.get <HOST_IP>'
        ]
      },
      {
        step: 2,
        title: 'ตรวจสอบ VM Affinity Rules และปิดการตรึง Host ชั่วคราว',
        instruction: 'ค้นหา VM ที่มี Affinity Rule ผูกติดกับ Host นั้นแล้วปลดล็อกเพื่อให้ระบบย้าย VM ได้อัตโนมัติ',
        commands: [
          'acli vm.list',
          'acli vm.get <VM_NAME> | grep -i "affinity"',
          'acli vm.update <VM_NAME> affinity_host_list=""'
        ]
      },
      {
        step: 3,
        title: 'ทดสอบสั่ง Enter Maintenance Mode แบบ Manual',
        instruction: 'รันคำสั่งเข้าสู่ Maintenance Mode ด้วยตนเองเพื่อดู Error ละเอียดที่ระบบฟ้องออกมา',
        commands: [
          'acli host.enter_maintenance_mode <HOST_IP> wait=true'
        ],
        notes: 'เมื่อ Host เข้าสู่ Maintenance Mode สำเร็จ CVM บน Host นั้นจะ Shutdown อย่างปลอดภัย'
      },
      {
        step: 4,
        title: 'รัน LCM Update อีกครั้งผ่าน Prism Element หรือ Prism Central',
        instruction: 'กลับไปที่หน้า Prism Element -> LCM -> Updates และกด Run Update ของ Node นั้นอีกครั้ง'
      },
      {
        step: 5,
        title: 'นำ Host ออกจาก Maintenance Mode เมื่ออัปเดตเสร็จ',
        instruction: 'เมื่อ Firmware เสร็จสิ้นและเครื่องรีบูตขึ้นมาแล้ว สั่งนำ Host กลับเข้า Cluster:',
        commands: [
          'acli host.exit_maintenance_mode <HOST_IP>'
        ]
      }
    ],
    workaround: 'ย้าย VM ทั้งหมดบน Host ไปยัง Host อื่นด้วยตนเองก่อนกดรัน LCM (Manual Pre-evacuation)',
    verificationSteps: 'ในหน้า LCM Dashboard แสดงสถานะของ Node เป็น "Up to date" เวอร์ชั่น BIOS/Firmware ตรงตาม Release Notes ล่าสุด และ VM ย้ายกลับมาทำงานปกติ',
    referenceLinks: [
      { label: 'Nutanix LCM Guide - Host Maintenance Troubleshooting', url: 'https://portal.nutanix.com' },
      { label: 'Lenovo ThinkAgile HX Best Recipe', url: 'https://support.lenovo.com/us/en/solutions/ht505537' }
    ],
    tags: ['LenovoHX', 'LCM', 'AHV', 'Firmware', 'acli', 'MaintenanceMode'],
    createdAt: '2026-09-05T13:45:00Z',
    updatedAt: '2026-09-17T14:30:00Z',
    author: 'Enterprise Solution Architect',
    isFavorite: false
  },
  {
    id: 'case-len-004',
    caseNumber: 'KB-LEN-108',
    title: 'Lenovo ThinkSystem SR630 - DIMM Uncorrectable ECC Error Halting POST',
    vendor: 'Lenovo',
    category: 'Hardware / Chassis',
    severity: 'Critical',
    hardwareModels: ['Lenovo ThinkSystem SR630', 'SR650', 'ST650 V2'],
    errorCode: 'FQXSME0002M / EventID: 806f0113-2581ffff',
    symptoms: 'Server หยุดทำงานกะทันหัน หรือ Boot ไม่ขึ้น ค้างที่หน้า Lenovo Splash Screen ไฟเตือนหน้าเครื่องติด Amber, XCC แจ้งเตือน: "An uncorrectable error has been detected on Memory device: DIMM 7"',
    rootCause: 'แถวแรม (DDR4/DDR5 DIMM) เกิดข้อผิดพลาดของซิลิคอนในตัวชิปหน่วยความจำ ทำให้ Multi-bit ECC ไม่สามารถซ่อมแซมได้ จึงทำให้ระบบตัดการทำงานเพื่อป้องกัน Data Corruption',
    resolutionSteps: [
      {
        step: 1,
        title: 'ระบุตำแหน่ง Slot DIMM ที่แน่นอนจากหน้า XCC Inventory',
        instruction: 'เข้าสู่ XCC Web Interface -> Hardware Inventory -> Memory ดู Slot Name, Silk Screen Label และ Serial Number ของแรมที่แจ้ง Error',
        commands: [
          '# ตรวจสอบผ่าน SSH XCC:',
          'ssh USERID@<XCC_IP>',
          'syshealth -l'
        ],
        notes: 'จดบันทึก Channel และ Slot (เช่น CPU 1, Channel B, Slot 7)'
      },
      {
        step: 2,
        title: 'ปิดเครื่องและสวมสายรัดป้องกันไฟฟ้าสถิต (ESD Strap)',
        instruction: 'สั่ง Graceful Shutdown ผ่าน OS หรือ XCC Power Actions, ถอดปลั๊กไฟ AC ทุกเส้น และเปิดฝาครอบเครื่อง Server'
      },
      {
        step: 3,
        title: 'ขั้นตอนการ Reseat หรือสลับ Channel (Swap Test)',
        instruction: '1. กดล็อกด้านข้างของ DIMM Slot 7 เพื่อปลดแรมออกมา\n2. ตรวจสอบหน้าสัมผัสทองคำ (Gold Finger) ว่ามีฝุ่นหรือรอยไหม้หรือไม่\n3. เสียบสลับกับ Slot ข้างเคียง (เช่น Slot 8 หรืออีก Channel) เพื่อพิสูจน์ว่าเป็นที่แถวแรม หรือเป็นที่ Memory Controller ของ CPU/Mainboard Socket\n4. เสียบกลับให้แน่นจนคลิกล็อก',
        notes: 'หากเสียบสลับแล้ว Error ย้ายตามแรมไป Slot ใหม่ = แรมชำรุด แต่ถ้า Error ยังอยู่ที่ Slot เดิม = เมนบอร์ด/CPU ผิดปกติ'
      },
      {
        step: 4,
        title: 'รัน Lenovo XClarity Provisioning Manager Memory Diagnostics',
        instruction: 'เปิดเครื่อง กด F1 เข้า LXPM ไปที่ Diagnostics -> Memory Test และเลือกรัน Quick หรือ Extended Test เพื่อยืนยัน'
      }
    ],
    workaround: 'หากจำเป็นต้องเปิดเครื่องใช้งานเร่งด่วน ให้ถอด DIMM ตัวที่เสียออก ระบบจะบูตขึ้นมาด้วยความจุ RAM ที่ลดลง (ระวังเรื่อง Balanced Memory Population)',
    verificationSteps: 'Server บูตเข้า OS ได้สมบูรณ์ และหน้า XCC Memory แสดงสถานะเป็นสีเขียว Normal ความจุ RAM แสดงครบตามจำนวนที่ติดตั้ง',
    referenceLinks: [
      { label: 'Lenovo Support - Message FQXSME0002M Information', url: 'https://pubs.lenovo.com/xcc-messages/fqxsme0002m' },
      { label: 'Lenovo Server Memory Population Rules', url: 'https://lenovopress.lenovo.com' }
    ],
    tags: ['Memory', 'RAM', 'ECC', 'DIMM', 'FQXSME0002M', 'Hardware'],
    createdAt: '2026-09-08T16:00:00Z',
    updatedAt: '2026-09-20T10:15:00Z',
    author: 'Hardware Maintenance Engineer',
    isFavorite: false
  }
];
