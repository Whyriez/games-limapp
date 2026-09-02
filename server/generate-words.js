import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateWords() {
  console.log("🤖 Menghubungi Gemini untuk generate kata...");

  const prompt = `
  Buatkan 80 pasangan kata bahasa Indonesia yang menarik dan seimbang untuk game Undercover (Civilian vs Undercover).
  Pasangan kata harus mirip konteksnya tapi memiliki perbedaan spesifik (contoh: Kopi vs Teh, Bioskop vs Netflix, Skripsi vs Tesis, Indomie vs Mie Sedaap).
  Format response WAJIB berupa JSON murni (array of objects) tanpa format markdown tambahan:
  [
    { "category": "Minuman", "civilian": "Kopi", "undercover": "Teh" },
    { "category": "Kantor/Tech", "civilian": "Slack", "undercover": "Discord" }
  ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let text = response.text.trim();
    if (text.startsWith("```json")) {
      text = text
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const words = JSON.parse(text);
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    fs.writeFileSync(
      path.join(dataDir, "words.json"),
      JSON.stringify(words, null, 2),
    );
    console.log(
      `✅ Berhasil membuat ${words.length} pasang kata di server/data/words.json`,
    );
  } catch (error) {
    console.error("❌ Gagal generate kata:", error);
  }
}

generateWords();
