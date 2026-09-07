import { UndercoverHandler } from "./undercover/index.js";
import { SpyfallHandler } from "./spyfall/index.js";
import { WerewolfHandler } from "./werewolf/index.js";
import { DrawGuessHandler } from "./drawguess/index.js";
import { RemiHandler } from "./remi/index.js";
import { UnoHandler } from "./uno/index.js";
import { ImpostorHandler } from "./impostor/index.js";

export const GAMES_REGISTRY = {
  undercover: {
    id: "undercover",
    name: "Undercover",
    fullName: "Undercover: Stealth Edition",
    tagline: "Temukan penyusup kata di antaramu!",
    description:
      "Setiap pemain mendapatkan kata rahasia yang mirip. Berikan petunjuk satu per satu, temukan siapa yang memegang kata berbeda (Undercover) atau tanpa kata (Mr. White) sebelum terlambat!",
    minPlayers: 3,
    maxPlayers: 16,
    category: "Deduksi Kata",
    badge: "Populer 🌟",
    duration: "5 - 10 Menit",
    defaultSettings: {
      autoBalance: true,
      undercoverCount: 1,
      mrWhiteCount: 0,
    },
    handler: new UndercoverHandler(),
  },
  spyfall: {
    id: "spyfall",
    name: "Spyfall",
    fullName: "Spyfall: Agen Rahasia",
    tagline: "Semua tahu lokasinya, kecuali sang Agen Rahasia!",
    description:
      "Semua pemain berada di satu lokasi rahasia dan memiliki peran, KECUALI 1 Agen Rahasia (Spy). Warga saling bertanya untuk mengungkap siapa yang tidak tahu lokasinya, sementara Spy berusaha menebak nama lokasi!",
    minPlayers: 3,
    maxPlayers: 12,
    category: "Bluffing & Interogasi",
    badge: "Favorit Party 🔥",
    duration: "4 - 8 Menit",
    defaultSettings: {
      roundDurationMinutes: 5,
      spyCount: 1,
    },
    handler: new SpyfallHandler(),
  },
  werewolf: {
    id: "werewolf",
    name: "Werewolf",
    fullName: "Werewolf: Desa Serigala",
    tagline: "Malam memangsa, siang bermusyawarah!",
    description:
      "Game deduksi sosial legendaris! Serigala berburu korban di malam hari, Seer menerawang peran rahasia, Dokter melindungi warga, dan seluruh desa bermusyawarah di siang hari untuk mengeksekusi serigala!",
    minPlayers: 4,
    maxPlayers: 16,
    category: "Sosial Deduksi",
    badge: "Klasik Pesta 🐺",
    duration: "8 - 15 Menit",
    defaultSettings: {
      werewolfCount: 1,
      hasSeer: true,
      hasDoctor: true,
      dayDiscussionSeconds: 90,
    },
    handler: new WerewolfHandler(),
  },
  drawguess: {
    id: "drawguess",
    name: "Tebak Gambar",
    fullName: "Tebak Gambar: Draw & Guess",
    tagline: "Goreskan imajinasimu dan tebak gambarnya!",
    description:
      "Bergantian menjadi pelukis di kanvas interaktif real-time dan berlomba menebak kata rahasia paling cepat di ruang obrolan untuk mengumpulkan poin tertinggi!",
    minPlayers: 2,
    maxPlayers: 12,
    category: "Kreatif & Tebak Kata",
    badge: "Seru & Santai 🎨",
    duration: "5 - 12 Menit",
    defaultSettings: {
      drawTimeLimit: 60,
      maxRounds: 3,
    },
    handler: new DrawGuessHandler(),
  },
  remi: {
    id: "remi",
    name: "Remi",
    fullName: "Remi: Classic Rummy",
    tagline: "Susun Seri & Set, tutup kartu dan raih kemenangan!",
    description:
      "Game kartu klasik nusantara! Tarik kartu dari tumpukan deck atau buangan, susun kombinasi Seri (Run) dan Triple (Set), lalu buang kartu hingga berhasil mendeklarasikan REMI!",
    minPlayers: 2,
    maxPlayers: 6,
    category: "Kartu Klasik",
    badge: "Strategi Kartu 🃏",
    duration: "5 - 10 Menit",
    defaultSettings: {
      turnTimeLimit: 30,
      handSize: 7,
    },
    handler: new RemiHandler(),
  },
  uno: {
    id: "uno",
    name: "UNO",
    fullName: "UNO: Party Card Game",
    tagline: "Cocokkan warna & angka, teriakkan UNO dan menangkan game!",
    description:
      "Game kartu pesta paling legendaris dan seru di dunia! Cocokkan warna atau angka, jebak lawan dengan kartu aksi +2, +4, Skip, dan Reverse, dan jangan lupa berteriak UNO saat kartumu tersisa satu!",
    minPlayers: 2,
    maxPlayers: 10,
    category: "Kartu Pesta",
    badge: "Seru & Heboh 🌈",
    duration: "5 - 10 Menit",
    defaultSettings: {
      turnTimeLimit: 30,
    },
    handler: new UnoHandler(),
  },
  impostor: {
    id: "impostor",
    name: "Impostor",
    fullName: "Impostor: Space Sabotage",
    tagline: "Selesaikan misi, waspadai penyusup di antariksa!",
    description:
      "Game deduksi sosial luar angkasa legendaris! Crewmate berkeliling menyelesaikan mini-tasks di kapal dan memperbaiki sabotase. Impostor menyusup, menyabotase kapal, dan melenyapkan crewmate secara rahasia. Adakan Emergency Meeting dan temukan impostornya!",
    minPlayers: 3,
    maxPlayers: 15,
    category: "Deduksi & Sabotase",
    badge: "Petualangan Angkasa 🚀",
    duration: "6 - 12 Menit",
    defaultSettings: {
      impostorCount: 1,
      killCooldown: 25,
      discussionDuration: 60,
      tasksPerPlayer: 3,
    },
    handler: new ImpostorHandler(),
  },
};

export function getAvailableGames() {
  return Object.values(GAMES_REGISTRY).map((g) => ({
    id: g.id,
    name: g.name,
    fullName: g.fullName,
    tagline: g.tagline,
    description: g.description,
    minPlayers: g.minPlayers,
    maxPlayers: g.maxPlayers,
    category: g.category,
    badge: g.badge,
    duration: g.duration,
    defaultSettings: g.defaultSettings,
  }));
}

export function getGameConfig(gameId) {
  return GAMES_REGISTRY[gameId] || GAMES_REGISTRY.undercover;
}

export function getGameHandler(gameId) {
  const game = GAMES_REGISTRY[gameId] || GAMES_REGISTRY.undercover;
  return game.handler;
}
