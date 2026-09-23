import { KnowledgeCase } from '../types';

/**
 * Download a single case or multiple cases as a clean formatted Markdown (.md) file
 */
export function downloadCaseAsMarkdown(c: KnowledgeCase): void {
  const stepsMd = c.resolutionSteps
    .map(
      (s) => `### Step ${s.step}: ${s.title}
${s.instruction}

${
  s.commands && s.commands.length > 0
    ? '```bash\n' + s.commands.join('\n') + '\n```'
    : ''
}
${s.notes ? `> **หมายเหตุ / ข้อควรระวัง:** ${s.notes}\n` : ''}`
    )
    .join('\n\n');

  const refsMd =
    c.referenceLinks && c.referenceLinks.length > 0
      ? `## แหล่งอ้างอิงทางการ (Official References)
${c.referenceLinks.map((r) => `- [${r.label}](${r.url})`).join('\n')}`
      : '';

  const mdContent = `# [${c.caseNumber}] ${c.title}

- **Vendor / ระบบ:** ${c.vendor}
- **หมวดหมู่ (Category):** ${c.category}
- **ความรุนแรง (Severity):** ${c.severity}
- **Error Code / Event ID:** ${c.errorCode || 'N/A'}
- **รุ่นฮาร์ดแวร์ (Hardware Models):** ${
    c.hardwareModels && c.hardwareModels.length > 0
      ? c.hardwareModels.join(', ')
      : 'General'
  }
- **วันที่อัปเดต:** ${new Date(c.updatedAt).toLocaleDateString('th-TH')}
- **Tags:** ${c.tags && c.tags.length > 0 ? c.tags.map((t) => `#${t}`).join(' ') : 'none'}

---

## อาการที่ตรวจพบ (Symptoms)
${c.symptoms}

## สาเหตุหลัก (Root Cause)
${c.rootCause}

## ขั้นตอนการแก้ไขปัญหา (Resolution Steps)
${stepsMd}

${
  c.workaround
    ? `## วิธีการบรรเทาชั่วคราว (Workaround)
${c.workaround}
`
    : ''
}

${
  c.verificationSteps
    ? `## การตรวจสอบยืนยันผล (Verification Steps)
${c.verificationSteps}
`
    : ''
}

${refsMd}
`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedName = c.caseNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  a.href = url;
  a.download = `${sanitizedName}-solution.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Download a single case as JSON
 */
export function downloadCaseAsJSON(c: KnowledgeCase): void {
  const blob = new Blob([JSON.stringify(c, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedName = c.caseNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  a.href = url;
  a.download = `${sanitizedName}-data.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Download a bundle of filtered cases as Markdown (.md)
 */
export function downloadMultipleCasesAsMarkdown(cases: KnowledgeCase[], filenameTitle = 'knowledge-base-export'): void {
  const fullText = cases
    .map((c) => {
      const steps = c.resolutionSteps
        .map(
          (s) => `### Step ${s.step}: ${s.title}
${s.instruction}
${s.commands && s.commands.length > 0 ? '```bash\n' + s.commands.join('\n') + '\n```' : ''}
${s.notes ? `> หมายเหตุ: ${s.notes}` : ''}`
        )
        .join('\n\n');

      return `# [${c.caseNumber}] ${c.title}
**Vendor:** ${c.vendor} | **Category:** ${c.category} | **Severity:** ${c.severity} | **Error Code:** ${c.errorCode || 'N/A'}
**Hardware:** ${c.hardwareModels?.join(', ') || 'General'}

### อาการ (Symptoms):
${c.symptoms}

### สาเหตุ (Root Cause):
${c.rootCause}

### วิธีแก้ไข (Resolution):
${steps}

${c.workaround ? `### วิธีแก้ไขชั่วคราว:\n${c.workaround}\n` : ''}
${c.verificationSteps ? `### การตรวจสอบผล:\n${c.verificationSteps}\n` : ''}
---
`;
    })
    .join('\n\n');

  const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameTitle}-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
