/**
 * Undercover Word Bank and Helpers for Offline & Online Gameplay
 */

export const DEFAULT_WORD_PAIRS = [
  { category: "Pakaian", civilian: "Jaket", undercover: "Hoodie" },
  { category: "Pakaian", civilian: "Kaos", undercover: "Kemeja" },
  { category: "Pakaian", civilian: "Celana Jeans", undercover: "Celana Chino" },
  { category: "Aksesoris", civilian: "Kacamata", undercover: "Softlens" },
  { category: "Pop Culture", civilian: "Roblox", undercover: "Minecraft" },
  { category: "Pop Culture", civilian: "K-Pop", undercover: "J-Pop" },
  { category: "Game", civilian: "Mobile Legends", undercover: "Free Fire" },
  { category: "Gaming", civilian: "PlayStation", undercover: "Xbox" },
  { category: "Rumah Tangga", civilian: "Dispenser", undercover: "Teko Listrik" },
  { category: "Rumah Tangga", civilian: "Bantal", undercover: "Guling" },
  { category: "Perabot Rumah", civilian: "Kasur", undercover: "Sofa" },
  { category: "Peralatan Rumah", civilian: "Sapu", undercover: "Vacuum Cleaner" },
  { category: "Elektronik Rumah", civilian: "AC", undercover: "Kipas Angin" },
  { category: "Perlengkap Rumah", civilian: "Handuk", undercover: "Selimut" },
  { category: "Perawatan Diri", civilian: "Sabun Batang", undercover: "Sabun Cair" },
  { category: "Perawatan Diri", civilian: "Shampoo", undercover: "Conditioner" },
  { category: "Sekolah", civilian: "Pensil Warna", undercover: "Spidol" },
  { category: "Sekolah / Kampus", civilian: "Ujian Akhir", undercover: "Kuis Dadakan" },
  { category: "Pendidikan", civilian: "Skripsi", undercover: "Tesis" },
  { category: "Pendidikan", civilian: "Sekolah", undercover: "Bimbel" },
  { category: "Pendidikan", civilian: "SMA", undercover: "SMK" },
  { category: "Pendidikan", civilian: "UTS", undercover: "UAS" },
  { category: "Kehidupan Kantor", civilian: "Printer", undercover: "Scanner" },
  { category: "Kehidupan Kantor", civilian: "Slip Gaji", undercover: "Kontrak Kerja" },
  { category: "Kantor / Pekerjaan", civilian: "Surat Peringatan", undercover: "Surat Resign" },
  { category: "Kantor / Pekerjaan", civilian: "Work from Home", undercover: "Hybrid Working" },
  { category: "Karir", civilian: "WFH", undercover: "WFO" },
  { category: "Karir", civilian: "Resign", undercover: "PHK" },
  { category: "Profesi", civilian: "Dokter", undercover: "Perawat" },
  { category: "Profesi", civilian: "Pilot", undercover: "Masinis" },
  { category: "Profesi", civilian: "Polisi", undercover: "Tentara" },
  { category: "Profesi", civilian: "Satpam", undercover: "Hansip" },
  { category: "Keuangan", civilian: "Gaji", undercover: "Bonus" },
  { category: "Keuangan", civilian: "ATM", undercover: "E-Wallet" },
  { category: "Keuangan", civilian: "Kartu Kredit", undercover: "Paylater" },
  { category: "Hewan", civilian: "Anjing Laut", undercover: "Singa Laut" },
  { category: "Hewan", civilian: "Bunglon", undercover: "Tokek" },
  { category: "Hewan", civilian: "Kucing", undercover: "Anjing" },
  { category: "Hewan", civilian: "Harimau", undercover: "Singa" },
  { category: "Hewan", civilian: "Hiu", undercover: "Paus" },
  { category: "Hewan", civilian: "Buaya", undercover: "Komodo" },
  { category: "Hewan", civilian: "Lebah", undercover: "Tawon" },
  { category: "Hewan", civilian: "Katak", undercover: "Kodok" },
  { category: "Hewan / Alam", civilian: "Kucing Anggora", undercover: "Kucing Persia" },
  { category: "Hewan / Alam", civilian: "Lumba-Lumba", undercover: "Paus Pembunuh" },
  { category: "Alam", civilian: "Sungai", undercover: "Danau" },
  { category: "Alam", civilian: "Hujan", undercover: "Badai" },
  { category: "Alam", civilian: "Petir", undercover: "Kilat" },
  { category: "Alam", civilian: "Pelangi", undercover: "Awan" },
  { category: "Transportasi", civilian: "Helikopter", undercover: "Pesawat Terbang" },
  { category: "Transportasi", civilian: "Kapal Pesiar", undercover: "Kapal Feri" },
  { category: "Transportasi", civilian: "Ojek Online", undercover: "Taksi Online" },
  { category: "Transportasi", civilian: "KRL", undercover: "MRT" },
  { category: "Transportasi", civilian: "Bus", undercover: "Travel" },
  { category: "Kendaraan", civilian: "Sepeda", undercover: "Motor" },
  { category: "Minuman", civilian: "Thai Tea", undercover: "Teh Tarik" },
  { category: "Minuman", civilian: "Es Doger", undercover: "Es Teler" },
  { category: "Minuman", civilian: "Kopi Susu Gula Aren", undercover: "Caramel Macchiato" },
  { category: "Minuman", civilian: "Bandrek", undercover: "Bajigur" },
  { category: "Minuman", civilian: "Kopi", undercover: "Teh" },
  { category: "Minuman", civilian: "Boba", undercover: "Cendol" },
  { category: "Minuman", civilian: "Es Teh", undercover: "Es Jeruk" },
  { category: "Minuman", civilian: "Jus Alpukat", undercover: "Jus Mangga" },
  { category: "Minuman", civilian: "Air Mineral", undercover: "Air Kelapa" },
  { category: "Minuman", civilian: "Susu Kedelai", undercover: "Susu Sapi" },
  { category: "Makanan", civilian: "Donat", undercover: "Churros" },
  { category: "Makanan", civilian: "Popcorn", undercover: "Jasuke" },
  { category: "Makanan", civilian: "Batagor", undercover: "Otak-otak" },
  { category: "Makanan", civilian: "Seblak", undercover: "Baso Aci" },
  { category: "Makanan", civilian: "Sate Padang", undercover: "Sate Madura" },
  { category: "Makanan", civilian: "Ayam Geprek", undercover: "Ayam Penyet" },
  { category: "Makanan", civilian: "Nasi Liwet", undercover: "Nasi Ulam" },
  { category: "Makanan", civilian: "Gado-gado", undercover: "Karedok" },
  { category: "Makanan", civilian: "Mie Goreng", undercover: "Bihun Goreng" },
  { category: "Makanan", civilian: "Gulai", undercover: "Kari" },
  { category: "Makanan", civilian: "Soto Betawi", undercover: "Soto Lamongan" },
  { category: "Makanan", civilian: "Sop Buntut", undercover: "Sop Iga" },
  { category: "Makanan", civilian: "Ayam Goreng", undercover: "Bebek Goreng" },
  { category: "Makanan", civilian: "Lontong Sayur", undercover: "Ketupat Sayur" },
  { category: "Makanan", civilian: "Bubur Ayam", undercover: "Bubur Kacang Hijau" },
  { category: "Makanan", civilian: "Nasi Kuning", undercover: "Nasi Liwet" },
  { category: "Makanan", civilian: "Onde-onde", undercover: "Combro" },
  { category: "Makanan", civilian: "Wajik", undercover: "Dodol" },
  { category: "Makanan", civilian: "Serabi", undercover: "Putu Mayang" },
  { category: "Makanan", civilian: "Lumpia", undercover: "Pastel" },
  { category: "Makanan", civilian: "Klepon", undercover: "Getuk" },
  { category: "Makanan", civilian: "Sop Buah", undercover: "Es Campur" },
  { category: "Makanan", civilian: "Pisang Goreng", undercover: "Ubi Goreng" },
  { category: "Makanan", civilian: "Bakwan", undercover: "Cireng" },
  { category: "Makanan", civilian: "Tahu Goreng", undercover: "Tempe Goreng" },
  { category: "Makanan", civilian: "Bakso", undercover: "Mie Ayam" },
  { category: "Makanan", civilian: "Nasi Goreng", undercover: "Nasi Uduk" },
  { category: "Makanan", civilian: "Pempek", undercover: "Siomay" },
  { category: "Makanan", civilian: "Martabak Manis", undercover: "Martabak Telur" },
  { category: "Makanan", civilian: "Sate Ayam", undercover: "Sate Kambing" },
  { category: "Makanan", civilian: "Rendang", undercover: "Semur" },
  { category: "Brand Makanan", civilian: "Indomie", undercover: "Mie Sedaap" },
  { category: "Fast Food", civilian: "Pizza", undercover: "Burger" },
  { category: "Fast Food", civilian: "KFC", undercover: "McDonald's" },
  { category: "Dessert", civilian: "Es Krim", undercover: "Gelato" },
  { category: "Camilan", civilian: "Keripik Singkong", undercover: "Keripik Pisang" },
  { category: "Buah", civilian: "Durian", undercover: "Nangka" },
  { category: "Buah", civilian: "Apel", undercover: "Pir" },
  { category: "Teknologi", civilian: "TWS", undercover: "Headphone" },
  { category: "Teknologi", civilian: "Smartwatch", undercover: "Smartband" },
  { category: "Teknologi", civilian: "Powerbank", undercover: "Charger" },
  { category: "Teknologi", civilian: "Instagram Reels", undercover: "TikTok" },
  { category: "Teknologi", civilian: "Android", undercover: "iOS" },
  { category: "Teknologi", civilian: "ChatGPT", undercover: "Claude" },
  { category: "Teknologi", civilian: "iPhone", undercover: "Android" },
  { category: "Teknologi", civilian: "Laptop", undercover: "PC Desktop" },
  { category: "Teknologi", civilian: "Google Chrome", undercover: "Safari" },
  { category: "Teknologi", civilian: "Google Drive", undercover: "Dropbox" },
  { category: "Teknologi AI", civilian: "ChatGPT", undercover: "Gemini" },
  { category: "Aplikasi", civilian: "WhatsApp", undercover: "Telegram" },
  { category: "Aplikasi", civilian: "Gojek", undercover: "Grab" },
  { category: "Aplikasi Musik", civilian: "Spotify", undercover: "Apple Music" },
  { category: "Sosial Media", civilian: "Instagram", undercover: "TikTok" },
  { category: "Hiburan Digital", civilian: "YouTube", undercover: "Netflix" },
  { category: "E-Commerce", civilian: "Shopee", undercover: "Tokopedia" },
  { category: "Kantor/Tech", civilian: "Slack", undercover: "Discord" },
  { category: "Tempat Belanja", civilian: "Supermarket", undercover: "Pasar Tradisional" },
  { category: "Tempat Belanja", civilian: "Minimarket", undercover: "Warung Madura" },
  { category: "Hiburan", civilian: "Bioskop", undercover: "Teater" },
  { category: "Hiburan", civilian: "Konser", undercover: "Festival" },
  { category: "Hiburan", civilian: "Film Horor", undercover: "Film Komedi" },
  { category: "Wisata", civilian: "Pantai", undercover: "Gunung" },
  { category: "Akomodasi", civilian: "Hotel", undercover: "Villa" },
  { category: "Hobi", civilian: "Mancing", undercover: "Berkemah" },
  { category: "Musik", civilian: "Dangdut", undercover: "Pop" },
  { category: "Karakter", civilian: "Superhero", undercover: "Villain" },
  { category: "Olahraga", civilian: "Futsal", undercover: "Sepak Bola" },
  { category: "Olahraga", civilian: "Badminton", undercover: "Tenis" },
  { category: "Olahraga", civilian: "Lari", undercover: "Bersepeda" },
  { category: "Olahraga", civilian: "Gym", undercover: "Yoga" },
  { category: "Olahraga", civilian: "Ski Air", undercover: "Selancar" },
  { category: "Olahraga", civilian: "Senam Lantai", undercover: "Senam Artistik" },
  { category: "Olahraga", civilian: "Formula 1", undercover: "MotoGP" },
  { category: "Olahraga", civilian: "Gulat", undercover: "Judo" },
  { category: "Olahraga", civilian: "Catur", undercover: "Go" },
  { category: "Olahraga", civilian: "Panjat Tebing", undercover: "Bouldering" },
  { category: "Olahraga", civilian: "Dayung", undercover: "Kano" },
  { category: "Olahraga", civilian: "Stick Hoki", undercover: "Pemukul Baseball" },
  { category: "Olahraga", civilian: "Sepatu Roda", undercover: "Skateboard" },
  { category: "Olahraga", civilian: "Karate", undercover: "Taekwondo" },
  { category: "Olahraga", civilian: "Gawang", undercover: "Ring Basket" },
  { category: "Olahraga", civilian: "Sarung Tangan Kiper", undercover: "Sarung Tinju" },
  { category: "Olahraga", civilian: "Stadion", undercover: "Arena" },
  { category: "Olahraga", civilian: "Wasit", undercover: "Juri" },
  { category: "Olahraga", civilian: "Pemain", undercover: "Pelatih" },
  { category: "Olahraga", civilian: "Panahan", undercover: "Menembak" },
  { category: "Olahraga", civilian: "Angkat Besi", undercover: "Angkat Beban" },
  { category: "Olahraga", civilian: "Sprint", undercover: "Marathon" },
  { category: "Olahraga", civilian: "Renang", undercover: "Selam" },
  { category: "Olahraga", civilian: "Basket", undercover: "Voli" },
];

export const CATEGORIES = [
  "Semua",
  "Makanan",
  "Minuman",
  "Teknologi",
  "Hewan",
  "Transportasi",
  "Olahraga",
  "Rumah Tangga",
  "Kehidupan Kantor",
  "Sekolah",
  "Pop Culture",
  "Wisata",
];

export function normalizeWord(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Get random word pair filtered by category
 */
export function getRandomWordPair(category = "Semua", customPool = null) {
  const pool = customPool && customPool.length > 0 ? customPool : DEFAULT_WORD_PAIRS;
  let filtered = pool;

  if (category && category !== "Semua") {
    const catLower = category.toLowerCase();
    filtered = pool.filter(
      (w) => w.category && w.category.toLowerCase().includes(catLower),
    );
    if (filtered.length === 0) filtered = pool;
  }

  const selected = filtered[Math.floor(Math.random() * filtered.length)];
  // Randomly flip civilian & undercover so words alternate unexpectedly!
  const shouldFlip = Math.random() > 0.5;

  return {
    category: selected.category || "Umum",
    civilian: shouldFlip ? selected.undercover : selected.civilian,
    undercover: shouldFlip ? selected.civilian : selected.undercover,
  };
}

/**
 * Smart automatic role distribution for Offline mode
 */
export function getAutoRoleDistribution(playerCount) {
  const count = Math.max(3, playerCount || 3);
  let undercoverCount = 1;
  let mrWhiteCount = 0;

  if (count <= 3) {
    undercoverCount = 1;
    mrWhiteCount = 0;
  } else if (count <= 5) {
    undercoverCount = 1;
    mrWhiteCount = 1;
  } else if (count <= 7) {
    undercoverCount = 2;
    mrWhiteCount = 1;
  } else if (count <= 9) {
    undercoverCount = 2;
    mrWhiteCount = 1;
  } else {
    undercoverCount = 3;
    mrWhiteCount = 2;
  }

  const maxImpostors = count - 1;
  if (undercoverCount + mrWhiteCount > maxImpostors) {
    undercoverCount = Math.max(1, Math.min(undercoverCount, maxImpostors));
    mrWhiteCount = Math.max(0, maxImpostors - undercoverCount);
  }

  const civilianCount = count - undercoverCount - mrWhiteCount;
  return { civilianCount, undercoverCount, mrWhiteCount };
}
