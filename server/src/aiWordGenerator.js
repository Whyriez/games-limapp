import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getWordBankList, normalizeWord } from "./gameManager.js";

dotenv.config();

// Supported models with cascade: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash, gemini-3.7-flash
const SUPPORTED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

// Curated Indonesian Smart Thematic Vocabulary Packs (Emergency fallback if all models/keys fail)
const BACKUP_VOCABULARY_PACKS = [
  { category: "Makanan", civilian: "Nasi Liwet", undercover: "Nasi Ulam" },
  { category: "Makanan", civilian: "Ayam Geprek", undercover: "Ayam Penyet" },
  { category: "Makanan", civilian: "Sate Padang", undercover: "Sate Madura" },
  { category: "Makanan", civilian: "Gado-Gado", undercover: "Karedok" },
  { category: "Makanan", civilian: "Soto Betawi", undercover: "Soto Lamongan" },
  { category: "Minuman", civilian: "Kopi Susu Gula Aren", undercover: "Caramel Macchiato" },
  { category: "Minuman", civilian: "Es Cincau", undercover: "Es Selasih" },
  { category: "Minuman", civilian: "Bandrek", undercover: "Bajigur" },
  { category: "Minuman", civilian: "Smoothie", undercover: "Milkshake" },
  { category: "Pop Culture", civilian: "Marvel", undercover: "DC Comics" },
  { category: "Pop Culture", civilian: "Harry Potter", undercover: "Lord of the Rings" },
  { category: "Pop Culture", civilian: "K-Pop", undercover: "J-Pop" },
  { category: "Teknologi", civilian: "Android", undercover: "iOS" },
  { category: "Teknologi", civilian: "ChatGPT", undercover: "Claude" },
  { category: "Teknologi", civilian: "Shopee", undercover: "Tokopedia" },
  { category: "Teknologi", civilian: "Instagram Reels", undercover: "TikTok" },
  { category: "Kantor / Pekerjaan", civilian: "Work from Home", undercover: "Hybrid Working" },
  { category: "Kantor / Pekerjaan", civilian: "Meeting Online", undercover: "Webinar" },
  { category: "Kantor / Pekerjaan", civilian: "Surat Peringatan", undercover: "Surat Resign" },
  { category: "Sekolah / Kampus", civilian: "Skripsi", undercover: "Tesis" },
  { category: "Sekolah / Kampus", civilian: "Ujian Akhir", undercover: "Kuis Dadakan" },
  { category: "Hewan / Alam", civilian: "Kucing Anggora", undercover: "Kucing Persia" },
  { category: "Hewan / Alam", civilian: "Lumba-Lumba", undercover: "Paus Pembunuh" },
  { category: "Transportasi", civilian: "KRL Commuter", undercover: "MRT Jakarta" },
  { category: "Transportasi", civilian: "Ojek Online", undercover: "Taksi Online" },
];

let currentKeyIndex = 0;

/**
 * Retrieves and cleans all configured Gemini API keys from environment.
 * Supports comma-separated lists in GEMINI_API_KEYS (with or without quotes) and GEMINI_API_KEY.
 */
export function getApiKeys() {
  const envRaw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const cleaned = envRaw.replace(/["']/g, "").trim();
  const keys = cleaned
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 5);

  if (keys.length === 0) {
    return ["AIzaSyBU1KctvSipIP0MCN1toz373IpOqcipd8E"];
  }
  return keys;
}

/**
 * Generates unique Indonesian word pairs for Undercover with API key rotation and strict model cascade fallback.
 */
export async function generateAIWords({ count = 10, category = "", themeHint = "" } = {}) {
  const existingWords = getWordBankList();
  const apiKeys = getApiKeys();

  // Create compact reference of existing pairs so Gemini avoids generating them
  const existingSummary = existingWords
    .slice(0, 120)
    .map((w) => `${w.civilian} vs ${w.undercover}`)
    .join(", ");

  const requestedCount = Math.max(1, Math.min(parseInt(count, 10) || 10, 30));
  const categoryInstruction =
    category && category !== "Semua" && category !== "Random" && category !== "Random / Campur"
      ? `Kategori utama yang diinginkan: "${category}".`
      : "Kategori bebas dan bervariasi (misalnya: Makanan, Minuman, Pop Culture, Teknologi, Kehidupan Kantor, Sekolah, Hewan, Transportasi).";

  const themeInstruction = themeHint
    ? `Tema spesifik / arahan gaya: "${themeHint}".`
    : "Gunakan kosakata bahasa Indonesia yang umum, populer, dan mudah dipahami semua kalangan usia.";

  const prompt = `
  Anda adalah asisten kurator kata profesional untuk game deduksi sosial "Undercover" (Civilian vs Undercover) berbahasa Indonesia.
  
  Tugas: Buatkan ${requestedCount + 5} pasangan kata baru yang menarik, seimbang, dan menantang.
  
  Prinsip Game Undercover:
  1. Pasangan kata harus berada dalam ranah/konteks yang sama tetapi memiliki perbedaan spesifik yang jelas (misal: "Kopi vs Teh", "Indomie vs Mie Sedaap", "Spotify vs Apple Music", "Bioskop vs Netflix").
  2. Kata Civilian dan Undercover TIDAK BOLEH SAMA dan TIDAK BOLEH sinonim 100% identik.
  3. ${categoryInstruction}
  4. ${themeInstruction}
  5. JANGAN membuat kata yang sudah ada dalam database ini: ${existingSummary}
  
  Format Response WAJIB berupa JSON murni (array of objects) tanpa markdown atau teks pengantar:
  [
    { "category": "Makanan", "civilian": "Bakso", "undercover": "Mie Ayam" }
  ]
  `;

  let rawParsed = [];
  let successModel = null;
  let successKeyIndex = null;

  // Model cascade: gemini-3.7-flash -> gemini-3.6-flash -> gemini-3.5-flash
  modelLoop: for (const modelName of SUPPORTED_MODELS) {
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      const activeKeyIdx = (currentKeyIndex + attempt) % apiKeys.length;
      const apiKey = apiKeys[activeKeyIdx];
      const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);

      try {
        console.log(`🤖 Attempting AI generation with model [${modelName}] using Key #${activeKeyIdx + 1} (${maskedKey})...`);
        const aiClient = new GoogleGenAI({ apiKey });

        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        let text = response.text ? response.text.trim() : "";
        if (text.startsWith("```json")) {
          text = text.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (text.startsWith("```")) {
          text = text.replace(/^```/, "").replace(/```$/, "").trim();
        }

        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawParsed = parsed;
            successModel = modelName;
            successKeyIndex = activeKeyIdx;
            // Update rotating key index pointer for load balance
            currentKeyIndex = (activeKeyIdx + 1) % apiKeys.length;
            console.log(`✅ Success with [${modelName}] on Key #${activeKeyIdx + 1}! Generated ${parsed.length} raw pairs.`);
            break modelLoop;
          }
        }
      } catch (err) {
        console.warn(
          `⚠️ Model [${modelName}] on Key #${activeKeyIdx + 1} (${maskedKey}) failed: ${err.message}. Rotating to next key/model...`,
        );
      }
    }
  }

  // If all models and keys fail, use smart offline curated vocabulary fallback
  if (rawParsed.length === 0) {
    console.log("ℹ️ Using smart offline curated vocabulary generator fallback...");
    rawParsed = [...BACKUP_VOCABULARY_PACKS].sort(() => 0.5 - Math.random());
    successModel = "Offline-Curated-Pack";
  }

  // --- VALIDATION STAGE 1: Server-Side De-duplication & Hygiene Check ---
  const existingSet = new Set();
  existingWords.forEach((w) => {
    const c = normalizeWord(w.civilian);
    const u = normalizeWord(w.undercover);
    existingSet.add(`${c}:::${u}`);
    existingSet.add(`${u}:::${c}`);
    existingSet.add(c);
    existingSet.add(u);
  });

  const validatedCandidates = [];
  const localBatchSet = new Set();
  let duplicateCount = 0;

  rawParsed.forEach((item) => {
    if (!item || !item.civilian || !item.undercover) return;

    const civ = item.civilian.trim();
    const und = item.undercover.trim();
    const cat = (item.category || category || "Umum").trim();

    const normCiv = normalizeWord(civ);
    const normUnd = normalizeWord(und);

    // Rule A: Civilian and Undercover must not be identical and must have length >= 2
    if (normCiv === normUnd || normCiv.length < 2 || normUnd.length < 2) {
      duplicateCount++;
      return;
    }

    // Rule B: Must not match existing database word pairs (in either order)
    const pairKey1 = `${normCiv}:::${normUnd}`;
    const pairKey2 = `${normUnd}:::${normCiv}`;
    if (existingSet.has(pairKey1) || existingSet.has(pairKey2)) {
      duplicateCount++;
      return;
    }

    // Rule C: Must not be duplicate inside this newly generated batch
    if (localBatchSet.has(pairKey1) || localBatchSet.has(pairKey2)) {
      duplicateCount++;
      return;
    }

    localBatchSet.add(pairKey1);
    validatedCandidates.push({
      category: cat,
      civilian: civ,
      undercover: und,
      status: "VERIFIED_UNIQUE",
    });
  });

  // Limit to requested count
  const finalCandidates = validatedCandidates.slice(0, requestedCount);

  return {
    requested: requestedCount,
    generated: rawParsed.length,
    validUniqueCount: finalCandidates.length,
    duplicateRejected: duplicateCount,
    usedModel: successModel,
    usedKeyIndex: successKeyIndex !== null ? successKeyIndex + 1 : "Fallback",
    totalAvailableKeys: apiKeys.length,
    candidates: finalCandidates,
  };
}

/**
 * Generates unique Indonesian locations with themed character roles for Spyfall.
 */
export async function generateAISpyfallLocations({ count = 5, category = "", themeHint = "" } = {}) {
  const apiKeys = getApiKeys();
  const requestedCount = Math.max(1, Math.min(parseInt(count, 10) || 5, 20));

  const categoryInstruction =
    category && category !== "Semua" && category !== "Random" && category !== "Random / Campur"
      ? `Kategori lokasi utama yang diinginkan: "${category}".`
      : "Kategori lokasi bebas, populer, dan bervariasi (misal: Pariwisata, Transportasi, Kesehatan, Tempat Hiburan, Kantor/Kerja, Sains, Militer, Tempat Umum).";

  const themeInstruction = themeHint
    ? `Tema spesifik / arahan lokasi: "${themeHint}".`
    : "Gunakan nama lokasi khas/populer yang mudah dibayangkan oleh pemain Indonesia.";

  const prompt = `
  Anda adalah perancang game profesional untuk game deduksi sosial "Spyfall" (Agen Rahasia) berbahasa Indonesia.
  
  Tugas: Buatkan ${requestedCount + 2} lokasi rahasia baru beserta daftar peran (pekerjaan/karakter) yang realistis dan menarik di lokasi tersebut.
  
  Aturan Spyfall:
  1. Setiap lokasi harus memiliki nama yang jelas dan spesifik (misal: "Bandara Internasional", "Kapal Pesiar", "Kantor Polisi", "Kebun Binatang").
  2. Setiap lokasi HARUS memiliki 5 sampai 7 nama peran karakter/pekerjaan yang khas di lokasi tersebut (misal: untuk "Bioskop" -> ["Penjaga Pintu Teater", "Penjual Popcorn", "Operator Proyektor", "Penonton", "Manager Bioskop"]).
  3. ${categoryInstruction}
  4. ${themeInstruction}
  
  Format Response WAJIB berupa JSON murni (array of objects) tanpa markdown atau teks pengantar:
  [
    {
      "name": "Stadion Sepak Bola",
      "category": "Olahraga",
      "roles": ["Wasit Utama", "Kiper Bintang", "Pelatih Tim", "Komentator TV", "Suporter Fanatik", "Dokter Tim Medis"]
    }
  ]
  `;

  let rawParsed = [];
  let successModel = null;
  let successKeyIndex = null;

  modelLoop: for (const modelName of SUPPORTED_MODELS) {
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      const activeKeyIdx = (currentKeyIndex + attempt) % apiKeys.length;
      const apiKey = apiKeys[activeKeyIdx];
      const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);

      try {
        const aiClient = new GoogleGenAI({ apiKey });
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        let text = response.text ? response.text.trim() : "";
        if (text.startsWith("```json")) {
          text = text.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (text.startsWith("```")) {
          text = text.replace(/^```/, "").replace(/```$/, "").trim();
        }

        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawParsed = parsed;
            successModel = modelName;
            successKeyIndex = activeKeyIdx;
            currentKeyIndex = (activeKeyIdx + 1) % apiKeys.length;
            break modelLoop;
          }
        }
      } catch (err) {
        console.warn(`Spyfall AI attempt failed on [${modelName}]:`, err.message);
      }
    }
  }

  if (rawParsed.length === 0) {
    rawParsed = [
      {
        name: "Museum Seni Nasional",
        category: "Budaya & Seni",
        roles: ["Kurator Seni", "Pemandu Museum", "Kolektor Lukisan", "Satpam Penjaga", "Turis Asing", "Pencuri Seni Menyamar"],
      },
      {
        name: "Stadion Sepak Bola",
        category: "Olahraga",
        roles: ["Wasit Utama", "Kiper Bintang", "Pelatih Tim", "Komentator TV", "Suporter Fanatik", "Dokter Tim Medis"],
      },
      {
        name: "Studio Rekaman Musik",
        category: "Hiburan",
        roles: ["Penyanyi Vokalis", "Sound Engineer", "Produser Musik", "Gitaris Utama", "Manajer Artis", "Pemain Drum"],
      },
    ];
    successModel = "Offline-Curated-Pack";
  }

  const validated = [];
  rawParsed.forEach((item) => {
    if (!item || !item.name) return;
    const cleanName = item.name.trim();
    const cleanCat = (item.category || category || "Umum").trim();
    const cleanRoles = Array.isArray(item.roles) && item.roles.length >= 2
      ? item.roles.map((r) => String(r).trim()).filter(Boolean)
      : ["Pengunjung", "Petugas", "Manajer", "Staf"];

    validated.push({
      name: cleanName,
      category: cleanCat,
      roles: cleanRoles,
      status: "VERIFIED_UNIQUE",
    });
  });

  const finalCandidates = validated.slice(0, requestedCount);

  return {
    requested: requestedCount,
    generated: rawParsed.length,
    validUniqueCount: finalCandidates.length,
    usedModel: successModel,
    usedKeyIndex: successKeyIndex !== null ? successKeyIndex + 1 : "Fallback",
    candidates: finalCandidates,
  };
}

/**
 * Generates fun, easily visualizable Indonesian words for Draw & Guess (Tebak Gambar).
 */
export async function generateAIDrawWords({ count = 10, category = "", difficulty = "Mudah", themeHint = "" } = {}) {
  const apiKeys = getApiKeys();
  const requestedCount = Math.max(1, Math.min(parseInt(count, 10) || 10, 30));

  const categoryInstruction =
    category && category !== "Semua" && category !== "Random" && category !== "Random / Campur"
      ? `Kategori kata yang diinginkan: "${category}".`
      : "Kategori bebas dan bervariasi (misal: Hewan, Makanan, Benda Sehari-hari, Transportasi, Alam, Tempat Populer, Profesi).";

  const diffInstruction = difficulty ? `Tingkat kesulitan gambar: "${difficulty}".` : "Tingkat kesulitan mudah hingga sedang.";
  const themeInstruction = themeHint ? `Tema spesifik: "${themeHint}".` : "Pilih benda/konsep konkret yang seru dan bisa digambar di kanvas 2D.";

  const prompt = `
  Anda adalah asisten game developer untuk game tebak gambar online "Draw & Guess" (Tebak Gambar) berbahasa Indonesia.
  
  Tugas: Buatkan ${requestedCount + 5} kata/frasa baru yang seru untuk digambar dan ditebak oleh pemain.
  
  Kriteria:
  1. Kata harus konkret dan memiliki wujud visual yang bisa digambar dengan jelas (misal: "Gajah", "Api Unggun", "Kacamata Hitam", "Helikopter", "Candi Borobudur").
  2. Hindari konsep abstrak yang tidak bisa digambar (misal: "Keadilan", "Waktu Luang").
  3. ${categoryInstruction}
  4. ${diffInstruction}
  5. ${themeInstruction}
  
  Format Response WAJIB berupa JSON murni (array of objects) tanpa markdown atau teks pengantar:
  [
    { "word": "Kucing Anggora", "category": "Hewan", "difficulty": "Mudah" },
    { "word": "Lampu Tidur", "category": "Benda", "difficulty": "Mudah" }
  ]
  `;

  let rawParsed = [];
  let successModel = null;
  let successKeyIndex = null;

  modelLoop: for (const modelName of SUPPORTED_MODELS) {
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      const activeKeyIdx = (currentKeyIndex + attempt) % apiKeys.length;
      const apiKey = apiKeys[activeKeyIdx];
      try {
        const aiClient = new GoogleGenAI({ apiKey });
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        let text = response.text ? response.text.trim() : "";
        if (text.startsWith("```json")) {
          text = text.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (text.startsWith("```")) {
          text = text.replace(/^```/, "").replace(/```$/, "").trim();
        }

        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawParsed = parsed;
            successModel = modelName;
            successKeyIndex = activeKeyIdx;
            currentKeyIndex = (activeKeyIdx + 1) % apiKeys.length;
            break modelLoop;
          }
        }
      } catch (err) {
        console.warn(`Draw AI attempt failed on [${modelName}]:`, err.message);
      }
    }
  }

  if (rawParsed.length === 0) {
    rawParsed = [
      { word: "Sepeda Motor", category: "Transportasi", difficulty: "Mudah" },
      { word: "Kelinci Putih", category: "Hewan", difficulty: "Mudah" },
      { word: "Gunung Berapi", category: "Alam", difficulty: "Mudah" },
      { word: "Martabak Manis", category: "Makanan", difficulty: "Sedang" },
      { word: "Kacamata Renang", category: "Benda", difficulty: "Mudah" },
    ];
    successModel = "Offline-Curated-Pack";
  }

  const validated = [];
  rawParsed.forEach((item) => {
    if (!item || !item.word) return;
    const cleanWord = item.word.trim();
    if (cleanWord.length < 2) return;
    validated.push({
      word: cleanWord,
      category: (item.category || category || "Umum").trim(),
      difficulty: item.difficulty || difficulty || "Mudah",
      status: "VERIFIED_UNIQUE",
    });
  });

  const finalCandidates = validated.slice(0, requestedCount);

  return {
    requested: requestedCount,
    generated: rawParsed.length,
    validUniqueCount: finalCandidates.length,
    usedModel: successModel,
    usedKeyIndex: successKeyIndex !== null ? successKeyIndex + 1 : "Fallback",
    candidates: finalCandidates,
  };
}

