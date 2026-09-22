import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint to search official Nutanix or Lenovo solutions with Google Search Grounding
app.post("/api/ai/search-solution", async (req, res) => {
  try {
    const { query, vendor, errorCode, hardwareModel } = req.body;

    if (!query && !errorCode) {
      return res.status(400).json({ error: "ต้องระบุข้อความค้นหา หรือ Error Code" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "ไม่พบ GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่า Environment Variable",
      });
    }

    // Build focused search prompt targeting official vendor portals
    const vendorTarget = vendor === "Lenovo" 
      ? "Lenovo Data Center Support (support.lenovo.com, pubs.lenovo.com, lenovopress.lenovo.com)" 
      : vendor === "Nutanix" 
      ? "Nutanix Support Portal & Knowledge Base (portal.nutanix.com, nutanix.com)"
      : "Official Nutanix or Lenovo Technical Support Documentation";

    const prompt = `คุณคือวิศวกรผู้เชี่ยวชาญด้าน Enterprise Infrastructure (Nutanix HCI และ Lenovo ThinkSystem/XClarity)
กรุณาสืบค้นข้อมูลจากเอกสารและเว็บไซต์ทางการของ ${vendorTarget} เพื่อหาวิธีแก้ไขปัญหาที่ถูกต้อง แม่นยำ และเป็นมาตรฐานทางเทคนิคที่สุด

ปัญหา/คำค้นหา: ${query || "ไม่ระบุ"}
Vendor: ${vendor || "Nutanix / Lenovo"}
Error Code / Event ID: ${errorCode || "ไม่มี"}
รุ่น Hardware / Server: ${hardwareModel || "ทั่วไป"}

ข้อกำหนดในการตอบ:
1. ตอบกลับเป็นภาษาไทยที่กระชับ ชัดเจนสำหรับวิศวกรไอที (System / Hardware Engineer)
2. อ้างอิงเอกสารหรือรหัส KB ของ ${vendor || "Nutanix/Lenovo"} เช่น KB number, Article ID, หรือ Message code ถ้ามี
3. ระบุ:
   - "ชื่อเคส / หัวข้อทางการ" (Official Title)
   - "สาเหตุที่แท้จริง" (Root Cause)
   - "ขั้นตอนการแก้ไขอย่างละเอียดแบบ Step-by-Step" พร้อมคำสั่ง CLI (เช่น ncli, acli, ncc, ssh, syshealth, resetsp, storcli)
   - "วิธีตรวจสอบผลยืนยัน" (Verification Step)
   - "ลิงก์หรือเอกสารอ้างอิงจาก official website" (Reference Links)
4. ปฏิบัติตามมาตรฐานความปลอดภัยของ Data Center (หลีกเลี่ยงคำสั่งที่เสี่ยงทำลายข้อมูลโดยไม่เตือน)`;

    // Calling Gemini with Google Search Grounding to pull real, up-to-date vendor information
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";

    // Extract Grounding Chunks (real web source citations)
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources: { title: string; uri: string }[] = [];

    for (const chunk of rawChunks) {
      if (chunk.web && chunk.web.uri) {
        webSources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri,
        });
      }
    }

    // Dedup web sources by URL
    const uniqueSources = Array.from(
      new Map(webSources.map((s) => [s.uri, s])).values()
    );

    return res.json({
      success: true,
      text,
      sources: uniqueSources,
    });
  } catch (error: any) {
    console.error("AI Search Solution error:", error);
    return res.status(500).json({
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลจากเว็บไซต์ทางการ",
    });
  }
});

// API Endpoint to convert search response into a structured Knowledge Case (to auto-fill or save to KB)
app.post("/api/ai/extract-case", async (req, res) => {
  try {
    const { rawText, originalQuery, vendor } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "ต้องระบุ rawText" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY ไม่พร้อมใช้งาน" });
    }

    const prompt = `จากเนื้อหาทางเทคนิคต่อไปนี้ กรุณาสกัดข้อมูลออกมาเป็น JSON Object ตามโครงสร้างของ Knowledge Case สำหรับ Technical Knowledge Base:

เนื้อหา:
${rawText}

คำค้นหาดั้งเดิม: ${originalQuery || ""}
Vendor: ${vendor || "Nutanix"}

กรุณาส่งกลับเป็น JSON ล้วน (ไม่มี markdown backticks หรือคำบรรยายอื่น) โดยมีฟิลด์ดังนี้:
{
  "title": "ชื่อเคสทางเทคนิคที่กระชับและชัดเจน (ภาษาไทยหรืออังกฤษ)",
  "vendor": "${vendor || "Nutanix"}",
  "category": "หนึ่งใน: Storage / Disk | Hardware / Chassis | Hypervisor / AHV | Network / Switching | Firmware / BIOS | Cluster Services | Power & Thermal | General System",
  "severity": "หนึ่งใน: Critical | High | Medium | Low",
  "hardwareModels": ["ชื่อรุ่น hardware เช่น Lenovo SR650, Nutanix NX-3060"],
  "errorCode": "รหัส Error Code หรือ Event ID ถ้ามี เช่น FQXSPPU0011M",
  "symptoms": "อาการที่สังเกตได้ (ภาษาไทย)",
  "rootCause": "สาเหตุหลักของปัญหา (ภาษาไทย)",
  "resolutionSteps": [
    {
      "step": 1,
      "title": "หัวข้อขั้นตอน",
      "instruction": "คำแนะนำและขั้นตอนการทำ",
      "commands": ["คำสั่ง CLI เช่น ncc health_checks ..."],
      "notes": "ข้อควรระวังหรือหมายเหตุถ้ามี"
    }
  ],
  "workaround": "วิธีแก้ไขชั่วคราวถ้ามี",
  "verificationSteps": "วิธีตรวจสอบว่าระบบหายเป็นปกติ",
  "tags": ["คำค้นหลักอย่างน้อย 3-5 คำ เช่น Nutanix, CVM, OOM"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({ success: true, caseData: parsedJson });
  } catch (error: any) {
    console.error("AI Extract Case error:", error);
    return res.status(500).json({
      error: error.message || "เกิดข้อผิดพลาดในการแปลงข้อมูล",
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
