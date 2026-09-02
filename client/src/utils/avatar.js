/**
 * Dynamic Avatar System (Casual Pastel 3D Game Edition)
 * Rich collection of 70+ playful 3D Memoji stickers & 16 vibrant pastel clay themes.
 */

export const AVATAR_EMOJIS = [
  // 🦊 Animals & Cute Creatures (25)
  "🦊", "🐱", "🐼", "🦁", "🐯", "🐨", "🐰", "🐻", "🐸", "🐵",
  "🐙", "🦄", "🦖", "🐧", "🦔", "🦝", "🐺", "🦉", "🦆", "🐬",
  "🐝", "🦩", "🦥", "🦋", "🦫",

  // 🕵️ Gaming, Agents & Fantasy (25)
  "🤖", "👾", "🕵️‍♂️", "🥷", "🧙‍♂️", "🦸‍♂️", "🦹‍♂️", "🛸", "🚀", "🎭",
  "👑", "💎", "🎲", "🎯", "🔮", "🕶️", "🎩", "🧭", "🕹️", "🛡️",
  "⚔️", "🏆", "🔥", "⚡", "✨",

  // 😎 Fun Expressions & Characters (15)
  "😎", "🥳", "🤠", "🧐", "🤩", "👻", "👽", "🤡", "🍿", "🍕",
  "🍔", "🍩", "🍦", "🥑", "🍓",
];

export const AVATAR_THEMES = [
  {
    id: "coral",
    name: "Coral Sunset",
    bg: "from-[#FF9782] to-[#F56447]",
    border: "border-[#FFB2A1]",
    shadow: "shadow-[#F56447]/30",
    accentBg: "bg-[#FFF0ED]",
    accentText: "text-[#E64B2D]",
  },
  {
    id: "sky",
    name: "Sky Blue",
    bg: "from-[#60C0FF] to-[#3AA5F8]",
    border: "border-[#8CD3FF]",
    shadow: "shadow-[#3AA5F8]/30",
    accentBg: "bg-[#EFF8FF]",
    accentText: "text-[#1C8BE0]",
  },
  {
    id: "mint",
    name: "Mint Matcha",
    bg: "from-[#5CE68E] to-[#38C76C]",
    border: "border-[#89EFA9]",
    shadow: "shadow-[#38C76C]/30",
    accentBg: "bg-[#EDFCF2]",
    accentText: "text-[#24A654]",
  },
  {
    id: "purple",
    name: "Royal Purple",
    bg: "from-[#B077FF] to-[#8740FA]",
    border: "border-[#C9A0FF]",
    shadow: "shadow-[#8740FA]/30",
    accentBg: "bg-[#F7F1FF]",
    accentText: "text-[#7B33ED]",
  },
  {
    id: "peach",
    name: "Warm Peach",
    bg: "from-[#FFB347] to-[#FFA012]",
    border: "border-[#FFCA80]",
    shadow: "shadow-[#FFA012]/30",
    accentBg: "bg-[#FFF8EC]",
    accentText: "text-[#D97E00]",
  },
  {
    id: "pink",
    name: "Rose Bubblegum",
    bg: "from-[#FF7EB3] to-[#FF4D88]",
    border: "border-[#FFA6CC]",
    shadow: "shadow-[#FF4D88]/30",
    accentBg: "bg-[#FFF0F6]",
    accentText: "text-[#E0246A]",
  },
  {
    id: "aqua",
    name: "Ocean Aqua",
    bg: "from-[#38E8DE] to-[#12B8B0]",
    border: "border-[#7EF5EE]",
    shadow: "shadow-[#12B8B0]/30",
    accentBg: "bg-[#E6FFFD]",
    accentText: "text-[#0A8F88]",
  },
  {
    id: "sunbeam",
    name: "Sunbeam Gold",
    bg: "from-[#FFD23F] to-[#FFB703]",
    border: "border-[#FFE27A]",
    shadow: "shadow-[#FFB703]/30",
    accentBg: "bg-[#FFFDEB]",
    accentText: "text-[#B88200]",
  },
  {
    id: "lavender",
    name: "Lavender Mist",
    bg: "from-[#D499FF] to-[#A855F7]",
    border: "border-[#E4BEFF]",
    shadow: "shadow-[#A855F7]/30",
    accentBg: "bg-[#FAF5FF]",
    accentText: "text-[#9333EA]",
  },
  {
    id: "lime",
    name: "Electric Lime",
    bg: "from-[#A3E635] to-[#65A30D]",
    border: "border-[#BEF264]",
    shadow: "shadow-[#65A30D]/30",
    accentBg: "bg-[#F7FEE7]",
    accentText: "text-[#4D7C0F]",
  },
  {
    id: "crimson",
    name: "Berry Crimson",
    bg: "from-[#FB7185] to-[#E11D48]",
    border: "border-[#FDA4AF]",
    shadow: "shadow-[#E11D48]/30",
    accentBg: "bg-[#FFF1F2]",
    accentText: "text-[#BE123C]",
  },
  {
    id: "indigo",
    name: "Indigo Twilight",
    bg: "from-[#818CF8] to-[#4F46E5]",
    border: "border-[#A5B4FC]",
    shadow: "shadow-[#4F46E5]/30",
    accentBg: "bg-[#EEF2FF]",
    accentText: "text-[#4338CA]",
  },
  {
    id: "teal",
    name: "Neon Teal",
    bg: "from-[#2DD4BF] to-[#0D9488]",
    border: "border-[#5EEAD4]",
    shadow: "shadow-[#0D9488]/30",
    accentBg: "bg-[#F0FDFA]",
    accentText: "text-[#0F766E]",
  },
  {
    id: "caramel",
    name: "Caramel Toffee",
    bg: "from-[#FDBA74] to-[#EA580C]",
    border: "border-[#FED7AA]",
    shadow: "shadow-[#EA580C]/30",
    accentBg: "bg-[#FFF7ED]",
    accentText: "text-[#C2410C]",
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    bg: "from-[#F472B6] to-[#DB2777]",
    border: "border-[#FBCFE8]",
    shadow: "shadow-[#DB2777]/30",
    accentBg: "bg-[#FDF2F8]",
    accentText: "text-[#BE185D]",
  },
  {
    id: "violet",
    name: "Cyber Violet",
    bg: "from-[#C084FC] to-[#9333EA]",
    border: "border-[#E9D5FF]",
    shadow: "shadow-[#9333EA]/30",
    accentBg: "bg-[#FAF5FF]",
    accentText: "text-[#7E22CE]",
  },
];

/**
 * Robust polynomial hash generator to ensure distinct icons and themes even for similar names
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

export function getPlayerTheme(name) {
  const safeName = (name || "Pemain").trim().toLowerCase();
  const primaryHash = hashString(safeName);
  const secondaryHash = hashString(safeName + "_salt_avatar_v2");

  const themeIdx = primaryHash % AVATAR_THEMES.length;
  const emojiIdx = secondaryHash % AVATAR_EMOJIS.length;

  return {
    ...AVATAR_THEMES[themeIdx],
    emoji: AVATAR_EMOJIS[emojiIdx],
    emojiIndex: emojiIdx,
    themeIndex: themeIdx,
  };
}

export function getAvatarGradient(name) {
  return getPlayerTheme(name).bg;
}
