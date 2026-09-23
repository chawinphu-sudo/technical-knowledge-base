import { KnowledgeCase } from '../types';

/**
 * Parses raw text, Markdown, or pasted KB article from Nutanix/Lenovo web
 * into an initial structured KnowledgeCase draft without relying on external API.
 * Used as an instant offline/client-side fallback parser.
 */
export function parseLocalMarkdownOrText(text: string, defaultVendor: string = 'General'): Partial<KnowledgeCase> {
  const lines = text.split('\n').map((l) => l.trim());

  let title = '';
  let errorCode = '';
  let symptoms = '';
  let rootCause = '';
  let workaround = '';
  let verification = '';
  const tags: string[] = [];
  const hardware: string[] = [];
  const resolutionSteps: { step: number; title: string; instruction: string; commands?: string[]; notes?: string }[] = [];

  // Look for header title (# Title or First non-empty line)
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      break;
    }
  }

  if (!title) {
    // Find first meaningful line
    for (const line of lines) {
      if (line.length > 5 && !line.startsWith('http') && !line.startsWith('-')) {
        title = line;
        break;
      }
    }
  }

  // Detect Vendor
  let detectedVendor = defaultVendor;
  const lower = text.toLowerCase();
  if (lower.includes('nutanix') || lower.includes('cvm') || lower.includes('ahv') || lower.includes('ncc') || lower.includes('prism')) {
    detectedVendor = 'Nutanix';
    tags.push('Nutanix');
  } else if (lower.includes('lenovo') || lower.includes('thinksystem') || lower.includes('xcc') || lower.includes('imm') || lower.includes('storcli')) {
    detectedVendor = 'Lenovo';
    tags.push('Lenovo');
  }

  // Detect Error code
  const errMatch = text.match(/(?:error(?:\s*code)?|event(?:\s*id)?|message\s*id)[\s:=]+([A-Z0-9_-]{4,20})/i);
  if (errMatch) {
    errorCode = errMatch[1];
  } else {
    // Check common patterns like FQXSPPU0011M or NCC: xxx
    const fqxMatch = text.match(/FQX[A-Z0-9]{8,12}/i);
    if (fqxMatch) errorCode = fqxMatch[0];
  }

  // Look for symptoms block
  const symptomMatch = text.match(/(?:symptoms?|อาการ|issue|problem description)[\s:]+([\s\S]*?)(?=(?:cause|root\s*cause|resolution|solution|steps|workaround|วิธีแก้ไข|$))/i);
  if (symptomMatch) {
    symptoms = symptomMatch[1].trim().slice(0, 1000);
  } else {
    symptoms = text.slice(0, 300);
  }

  // Look for root cause
  const causeMatch = text.match(/(?:root\s*cause|cause|สาเหตุ)[\s:]+([\s\S]*?)(?=(?:resolution|solution|steps|workaround|verification|วิธีแก้ไข|$))/i);
  if (causeMatch) {
    rootCause = causeMatch[1].trim().slice(0, 1000);
  }

  // Extract commands in code blocks
  const codeBlocks = Array.from(text.matchAll(/```(?:bash|sh|cli)?([\s\S]*?)```/gi));
  if (codeBlocks.length > 0) {
    codeBlocks.forEach((block, idx) => {
      const cmds = block[1]
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c && !c.startsWith('#'));
      
      resolutionSteps.push({
        step: idx + 1,
        title: `ขั้นตอนที่ ${idx + 1}: ดำเนินการตามคำสั่ง CLI`,
        instruction: 'ปฏิบัติตามคำสั่งบนคอนโซลหรือ SSH',
        commands: cmds,
      });
    });
  }

  // If no resolution steps found yet, create basic step from text
  if (resolutionSteps.length === 0) {
    const solMatch = text.match(/(?:resolution|solution|วิธีแก้ไข|action)[\s:]+([\s\S]*?)(?=(?:workaround|verification|reference|$))/i);
    resolutionSteps.push({
      step: 1,
      title: 'ขั้นตอนการตรวจสอบและดำเนินการแก้ไขปัญหา',
      instruction: solMatch ? solMatch[1].trim() : text.slice(0, 400),
    });
  }

  return {
    title: title || 'นำเข้าจากเอกสารภายนอก (Imported Case)',
    vendor: detectedVendor as any,
    errorCode: errorCode || undefined,
    symptoms: symptoms || 'พบอาการผิดปกติจากเอกสารที่อัปโหลด',
    rootCause: rootCause || 'กรุณาตรวจสอบรายละเอียดเพิ่มเติมจากเอกสาร',
    resolutionSteps,
    workaround: workaround || undefined,
    verificationSteps: verification || 'ตรวจสอบว่า Service กลับมาทำงานปกติและไม่มี Event แจ้งเตือนค้าง',
    tags: tags.length > 0 ? tags : ['Imported'],
    category: 'General System',
    severity: 'Medium',
  };
}
