import React from "react";
import { Sparkles, Users, Compass, Eye, ShieldAlert, Sliders, Moon, Palette, Layers, Flame } from "lucide-react";

import UndercoverGame from "./undercover/UndercoverGame";
import UndercoverSettings from "./undercover/UndercoverSettings";
import UndercoverRules from "./undercover/UndercoverRules";

import SpyfallGame from "./spyfall/SpyfallGame";
import SpyfallSettings from "./spyfall/SpyfallSettings";
import SpyfallRules from "./spyfall/SpyfallRules";

import WerewolfGame from "./werewolf/WerewolfGame";
import WerewolfSettings from "./werewolf/WerewolfSettings";
import WerewolfRules from "./werewolf/WerewolfRules";

import DrawGuessGame from "./drawguess/DrawGuessGame";
import DrawGuessSettings from "./drawguess/DrawGuessSettings";
import DrawGuessRules from "./drawguess/DrawGuessRules";

import RemiGame from "./remi/RemiGame";
import RemiSettings from "./remi/RemiSettings";
import RemiRules from "./remi/RemiRules";

import UnoGame from "./uno/UnoGame";
import UnoSettings from "./uno/UnoSettings";
import UnoRules from "./uno/UnoRules";

export const GAMES_CATALOG = {
  undercover: {
    id: "undercover",
    name: "Undercover",
    fullName: "Undercover: Stealth Edition",
    tagline: "Temukan penyusup kata di antaramu!",
    description:
      "Game deduksi kata adiktif! Setiap pemain mendapatkan kata rahasia yang mirip. Berikan petunjuk satu per satu, cari siapa yang memegang kata berbeda (Undercover) atau tanpa kata (Mr. White)!",
    category: "Deduksi Kata",
    badge: "Populer 🌟",
    badgeColor: "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]",
    minPlayers: 3,
    maxPlayers: 16,
    duration: "5 - 10 Menit",
    difficulty: "Mudah",
    tags: ["Deduksi Kata", "Rahasia", "Voting", "AI Words"],
    icon: Sparkles,
    themeColor: "#50B5FF",
    GameComponent: UndercoverGame,
    SettingsComponent: UndercoverSettings,
    RulesComponent: UndercoverRules,
  },
  spyfall: {
    id: "spyfall",
    name: "Spyfall",
    fullName: "Spyfall: Agen Rahasia",
    tagline: "Semua tahu lokasinya, kecuali sang Agen Rahasia!",
    description:
      "Semua pemain berada di satu lokasi rahasia dan memiliki peran, KECUALI 1 Agen Rahasia (Spy). Saling bertanya tanpa membongkar nama lokasi, sementara Spy berusaha menebak nama lokasi sebelum tertangkap!",
    category: "Bluffing & Interogasi",
    badge: "Favorit Party 🔥",
    badgeColor: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
    minPlayers: 3,
    maxPlayers: 12,
    duration: "4 - 8 Menit",
    difficulty: "Menengah",
    tags: ["Interogasi", "Papan Lokasi", "Bluffing", "Timer"],
    icon: Compass,
    themeColor: "#FFA012",
    GameComponent: SpyfallGame,
    SettingsComponent: SpyfallSettings,
    RulesComponent: SpyfallRules,
  },
  werewolf: {
    id: "werewolf",
    name: "Werewolf",
    fullName: "Werewolf: Desa Serigala",
    tagline: "Malam memangsa, siang bermusyawarah!",
    description:
      "Game deduksi sosial klasik! Serigala memangsa warga di kegelapan malam, Seer menerawang peran, Dokter melindungi kawan, dan seluruh desa berdebat menentukan siapa yang akan dieksekusi di siang hari!",
    category: "Sosial Deduksi",
    badge: "Klasik Pesta 🐺",
    badgeColor: "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]",
    minPlayers: 4,
    maxPlayers: 16,
    duration: "8 - 15 Menit",
    difficulty: "Seru",
    tags: ["Malam/Siang", "Peran Khusus", "Musyawarah", "Eliminasi"],
    icon: Moon,
    themeColor: "#9D5CFF",
    GameComponent: WerewolfGame,
    SettingsComponent: WerewolfSettings,
    RulesComponent: WerewolfRules,
  },
  drawguess: {
    id: "drawguess",
    name: "Tebak Gambar",
    fullName: "Tebak Gambar: Draw & Guess",
    tagline: "Goreskan imajinasimu dan tebak gambarnya!",
    description:
      "Game santai penuh tawa! Bergantian menjadi pelukis di kanvas real-time sementara pemain lain berlomba mengetik tebakan secepat mungkin untuk mengumpulkan poin tertinggi!",
    category: "Kreatif & Tebak Kata",
    badge: "Seru & Santai 🎨",
    badgeColor: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
    minPlayers: 2,
    maxPlayers: 12,
    duration: "5 - 12 Menit",
    difficulty: "Mudah",
    tags: ["Kanvas Real-Time", "Tebak Chat", "Poin Cepat", "Kreatif"],
    icon: Palette,
    themeColor: "#4DD97B",
    GameComponent: DrawGuessGame,
    SettingsComponent: DrawGuessSettings,
    RulesComponent: DrawGuessRules,
  },
  remi: {
    id: "remi",
    name: "Remi",
    fullName: "Remi: Classic Rummy",
    tagline: "Susun Seri & Set, tutup kartu dan raih kemenangan!",
    description:
      "Game kartu klasik favorit nusantara! Ambil kartu dari dek atau buangan, susun kombinasi Seri (Run) dan Triple (Set), lalu buang kartu hingga berhasil mendeklarasikan TUTUP REMI!",
    category: "Kartu Klasik",
    badge: "Strategi Kartu 🃏",
    badgeColor: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
    minPlayers: 2,
    maxPlayers: 6,
    duration: "5 - 10 Menit",
    difficulty: "Mudah",
    tags: ["Kartu 3D", "Seri & Triple", "Ambil/Buang", "Tutup Remi"],
    icon: Layers,
    themeColor: "#E64B2D",
    GameComponent: RemiGame,
    SettingsComponent: RemiSettings,
    RulesComponent: RemiRules,
  },
  uno: {
    id: "uno",
    name: "UNO",
    fullName: "UNO: Party Card Game",
    tagline: "Cocokkan warna & angka, teriakkan UNO dan menangkan game!",
    description:
      "Game kartu pesta paling populer di dunia! Cocokkan warna atau angka, jebak lawan dengan kartu aksi +2, +4, Skip, dan Reverse, dan jangan lupa berteriak UNO saat kartumu tersisa satu!",
    category: "Kartu Pesta",
    badge: "Seru & Heboh 🌈",
    badgeColor: "bg-[#FFF8EC] text-[#FFA012] border-[#F0DDC5]",
    minPlayers: 2,
    maxPlayers: 10,
    duration: "5 - 10 Menit",
    difficulty: "Mudah",
    tags: ["Kartu Warna", "Wild +4", "Reverse & Skip", "Teriak UNO"],
    icon: Flame,
    themeColor: "#FF3B30",
    GameComponent: UnoGame,
    SettingsComponent: UnoSettings,
    RulesComponent: UnoRules,
  },
};

export function getAvailableGames() {
  return Object.values(GAMES_CATALOG);
}

export function getGameMeta(gameId) {
  return GAMES_CATALOG[gameId] || GAMES_CATALOG.undercover;
}
