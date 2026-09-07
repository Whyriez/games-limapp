import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const locationsFilePath = path.join(__dirname, "locations.json");

let locationBank = [];
try {
  const raw = fs.readFileSync(locationsFilePath, "utf-8");
  locationBank = JSON.parse(raw);
} catch (e) {
  locationBank = [
    {
      id: "pesawat",
      name: "Pesawat Terbang",
      category: "Transportasi",
      roles: ["Pilot", "Pramugari", "Penumpang VIP", "Kopilot", "Polisi Udara"],
    },
    {
      id: "rumah_sakit",
      name: "Rumah Sakit Umum",
      category: "Kesehatan",
      roles: ["Dokter Bedah", "Perawat", "Pasien", "Satpam IGD", "Dokter Magang"],
    },
    {
      id: "hotel_bintang_5",
      name: "Hotel Bintang 5",
      category: "Pariwisata",
      roles: ["Manajer Hotel", "Resepsionis", "Bellboy", "Tamu Sultan", "Chef"],
    },
  ];
}

export function getLocationList() {
  return locationBank;
}

function saveLocationsToFile() {
  try {
    const dataDir = path.dirname(locationsFilePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(locationsFilePath, JSON.stringify(locationBank, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save locations to file:", e);
  }
}

export function addLocation({ name, category, roles }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "Nama lokasi tidak boleh kosong" };
  }
  const cleanName = name.trim();
  const cleanCategory = (category || "Umum").trim();
  const cleanRoles = Array.isArray(roles)
    ? roles.map((r) => String(r).trim()).filter(Boolean)
    : ["Pengunjung", "Petugas", "Manajer", "Staf"];

  if (cleanRoles.length < 2) {
    return { error: "Lokasi minimal harus memiliki 2 peran" };
  }

  const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36);
  const newLoc = {
    id,
    name: cleanName,
    category: cleanCategory,
    roles: cleanRoles,
  };

  locationBank.push(newLoc);
  saveLocationsToFile();
  return { success: true, location: newLoc, totalCount: locationBank.length };
}

export function updateLocation(idOrIndex, { name, category, roles }) {
  let idx = -1;
  if (typeof idOrIndex === "number") {
    idx = idOrIndex;
  } else {
    idx = locationBank.findIndex((l) => l.id === idOrIndex);
  }

  if (idx < 0 || idx >= locationBank.length) {
    return { error: "Lokasi tidak ditemukan" };
  }

  const existing = locationBank[idx];
  const cleanName = name && typeof name === "string" ? name.trim() : existing.name;
  const cleanCategory = category && typeof category === "string" ? category.trim() : existing.category;
  const cleanRoles = Array.isArray(roles) && roles.length >= 2
    ? roles.map((r) => String(r).trim()).filter(Boolean)
    : existing.roles;

  locationBank[idx] = {
    ...existing,
    name: cleanName,
    category: cleanCategory,
    roles: cleanRoles,
  };

  saveLocationsToFile();
  return { success: true, location: locationBank[idx] };
}

export function deleteLocation(idOrIndex) {
  let idx = -1;
  if (typeof idOrIndex === "number") {
    idx = idOrIndex;
  } else {
    idx = locationBank.findIndex((l) => l.id === idOrIndex);
  }

  if (idx < 0 || idx >= locationBank.length) {
    return { error: "Lokasi tidak ditemukan" };
  }

  if (locationBank.length <= 3) {
    return { error: "Minimal harus menyisakan 3 lokasi untuk permainan Spyfall" };
  }

  const [removed] = locationBank.splice(idx, 1);
  saveLocationsToFile();
  return { success: true, removedLocation: removed, totalCount: locationBank.length };
}

export function bulkImportLocations(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Data import harus berupa array lokasi yang valid" };
  }

  let imported = 0;
  items.forEach((item) => {
    if (!item || !item.name) return;
    const cleanName = item.name.trim();
    const exists = locationBank.some((l) => l.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
      const cleanCategory = (item.category || "Umum").trim();
      const cleanRoles = Array.isArray(item.roles) && item.roles.length >= 2
        ? item.roles.map((r) => String(r).trim()).filter(Boolean)
        : ["Pengunjung", "Petugas", "Manajer", "Staf"];

      const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36);
      locationBank.push({
        id,
        name: cleanName,
        category: cleanCategory,
        roles: cleanRoles,
      });
      imported++;
    }
  });

  saveLocationsToFile();
  return { success: true, importedCount: imported, totalCount: locationBank.length };
}

export class SpyfallHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.role = null;
      p.location = null;
      p.isSpy = false;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 3) {
      return { error: "Minimal butuh 3 pemain aktif untuk memulai Spyfall" };
    }

    gameManager.clearAllTimers(room);

    // Pick random location
    const selectedLocation =
      locationBank[Math.floor(Math.random() * locationBank.length)] || locationBank[0];
    room.secretLocation = selectedLocation;

    const count = activePlayers.length;
    const shuffled = [...activePlayers].sort(() => 0.5 - Math.random());

    let spyCount = room.settings?.spyCount || 1;
    if (spyCount >= count) spyCount = 1;

    // Pick available roles for non-spies from location
    const availableRoles = [...(selectedLocation.roles || ["Warga"])].sort(
      () => 0.5 - Math.random(),
    );

    shuffled.forEach((p, idx) => {
      if (idx < spyCount) {
        p.isSpy = true;
        p.role = "AGEN RAHASIA (SPY)";
        p.location = "??? (Kamu adalah SPY!)";
      } else {
        p.isSpy = false;
        const assignedRole =
          availableRoles[(idx - spyCount) % availableRoles.length] || "Warga Setempat";
        p.role = assignedRole;
        p.location = selectedLocation.name;
      }
    });

    const allLocationNames = locationBank.map((loc) => ({
      id: loc.id,
      name: loc.name,
      category: loc.category,
    }));

    room.status = "MEMORIZE_PHASE";
    room.allLocations = allLocationNames;
    room.discussionMessages = [];
    room.readyPlayers = new Set();
    room.activeAccusation = null;
    room.lastGameOverData = null;

    // Unicast secret identity to each connected player
    room.players.forEach((p) => {
      if (p.connected) {
        io.to(p.socketId).emit("game:role_assigned", {
          isSpy: p.isSpy,
          role: p.role,
          location: p.isSpy ? "??? (Rahasia / Kamu Spy)" : p.location,
          locationCategory: p.isSpy ? "???" : selectedLocation.category,
          allLocations: allLocationNames,
          gameType: "spyfall",
        });
      }
    });

    const memorizeDuration = 18;
    const endsAt = Date.now() + memorizeDuration * 1000;
    room.memorizeEndsAt = endsAt;

    io.to(room.id).emit("phase:memorize_start", {
      endsAt,
      duration: memorizeDuration,
      totalPlayers: activePlayers.length,
      readyCount: 0,
      gameType: "spyfall",
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.memorizeTimerTimeout = setTimeout(() => {
      this.startInquiryPhase(room, io, gameManager);
    }, memorizeDuration * 1000);

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let roundMinutes = parseInt(newSettings.roundDurationMinutes, 10) || 3;
    if (roundMinutes < 1) roundMinutes = 1;
    if (roundMinutes > 10) roundMinutes = 10;

    let spyCount = parseInt(newSettings.spyCount, 10) || 1;
    if (spyCount < 1) spyCount = 1;
    if (spyCount > 2) spyCount = 2;

    room.settings = {
      roundDurationMinutes: roundMinutes,
      spyCount,
    };

    io.to(room.id).emit("room:settings_updated", room.settings);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  markPlayerReady(room, socketId, io, gameManager) {
    if (room.status !== "MEMORIZE_PHASE") return;

    if (!room.readyPlayers) room.readyPlayers = new Set();
    room.readyPlayers.add(socketId);

    const connectedPlayers = room.players.filter((p) => p.connected);

    io.to(room.id).emit("ready:update", {
      readyCount: room.readyPlayers.size,
      totalPlayers: connectedPlayers.length,
      readySocketIds: Array.from(room.readyPlayers),
    });

    if (room.readyPlayers.size >= connectedPlayers.length) {
      if (room.memorizeTimerTimeout) {
        clearTimeout(room.memorizeTimerTimeout);
        room.memorizeTimerTimeout = null;
      }
      this.startInquiryPhase(room, io, gameManager);
    }
  }

  skipInquiry(room, socketId, io, gameManager) {
    if (room.status !== "INQUIRY_PHASE") return;
    // Clear inquiry timer and proceed immediately to final guess / accusation
    gameManager.clearAllTimers(room);
    this.handleInquiryTimeExpired(room, io, gameManager);
  }

  startInquiryPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);
    room.memorizeEndsAt = null;

    room.status = "INQUIRY_PHASE";
    room.activeAccusation = null;

    const durationMinutes = room.settings?.roundDurationMinutes || 3;
    const durationSeconds = durationMinutes * 60;
    const endsAt = Date.now() + durationSeconds * 1000;
    room.inquiryEndsAt = endsAt;
    room.remainingInquirySeconds = durationSeconds;

    // Pick a random starting questioner
    const activePlayers = room.players.filter((p) => p.connected);
    const starter = activePlayers[Math.floor(Math.random() * activePlayers.length)] || activePlayers[0];

    io.to(room.id).emit("spyfall:inquiry_start", {
      endsAt,
      duration: durationSeconds,
      starterPlayerName: starter?.name || "Semua Pemain",
      allLocations: room.allLocations,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.inquiryTimerTimeout = setTimeout(() => {
      this.handleInquiryTimeExpired(room, io, gameManager);
    }, durationSeconds * 1000);
  }

  handleInquiryTimeExpired(room, io, gameManager) {
    // Time's up or skipped! Spies get one final chance to guess or non-spies must accuse
    this.startFinalVoteOrGuess(room, io, gameManager);
  }

  startAccusation(room, accuserSocketId, suspectSocketId, io, gameManager) {
    if (room.status !== "INQUIRY_PHASE") return;
    if (accuserSocketId === suspectSocketId) return;

    const accuser = room.players.find((p) => p.socketId === accuserSocketId);
    const suspect = room.players.find((p) => p.socketId === suspectSocketId);
    if (!accuser || !suspect) return;

    // Calculate remaining time on inquiry timer to restore later if accusation is rejected
    if (room.inquiryEndsAt) {
      room.remainingInquirySeconds = Math.max(
        10,
        Math.floor((room.inquiryEndsAt - Date.now()) / 1000),
      );
    }
    gameManager.clearAllTimers(room);

    room.status = "ACCUSATION_PHASE";
    const accusationDuration = 30;
    const endsAt = Date.now() + accusationDuration * 1000;

    room.activeAccusation = {
      accuserSocketId,
      accuserName: accuser.name,
      suspectSocketId,
      suspectName: suspect.name,
      suspectPlayerId: suspect.playerId,
      votes: { [accuserSocketId]: true }, // Accuser automatically votes YES
      endsAt,
    };

    const eligibleVoters = room.players.filter(
      (p) => p.connected && p.socketId !== suspectSocketId,
    );

    io.to(room.id).emit("spyfall:accusation_started", {
      accuserName: accuser.name,
      suspectName: suspect.name,
      suspectSocketId,
      endsAt,
      duration: accusationDuration,
      totalVoters: eligibleVoters.length,
      agreeCount: 1,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.accusationTimerTimeout = setTimeout(() => {
      this.resolveAccusation(room, io, gameManager);
    }, accusationDuration * 1000);
  }

  castAccusationVote(room, voterSocketId, isAgree, io, gameManager) {
    if (room.status !== "ACCUSATION_PHASE" || !room.activeAccusation) return;

    // Suspect cannot vote on their own accusation
    if (voterSocketId === room.activeAccusation.suspectSocketId) return;

    room.activeAccusation.votes[voterSocketId] = !!isAgree;

    const eligibleVoters = room.players.filter(
      (p) => p.connected && p.socketId !== room.activeAccusation.suspectSocketId,
    );

    const voteEntries = Object.entries(room.activeAccusation.votes);
    const agreeCount = voteEntries.filter(([_, v]) => v === true).length;

    io.to(room.id).emit("spyfall:accusation_vote_update", {
      agreeCount,
      votedCount: voteEntries.length,
      totalVoters: eligibleVoters.length,
    });
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // If all eligible voters voted, resolve immediately
    if (voteEntries.length >= eligibleVoters.length) {
      if (room.accusationTimerTimeout) {
        clearTimeout(room.accusationTimerTimeout);
        room.accusationTimerTimeout = null;
      }
      this.resolveAccusation(room, io, gameManager);
    }
  }

  resolveAccusation(room, io, gameManager) {
    if (room.accusationTimerTimeout) {
      clearTimeout(room.accusationTimerTimeout);
      room.accusationTimerTimeout = null;
    }

    const accusation = room.activeAccusation;
    if (!accusation) {
      this.resumeInquiryPhase(room, io, gameManager);
      return;
    }

    const eligibleVoters = room.players.filter(
      (p) => p.connected && p.socketId !== accusation.suspectSocketId,
    );
    const voteEntries = Object.entries(accusation.votes);
    const agreeCount = voteEntries.filter(([_, v]) => v === true).length;
    const requiredVotes = Math.ceil(eligibleVoters.length * 0.6); // 60% supermajority

    const suspect = room.players.find(
      (p) => p.socketId === accusation.suspectSocketId,
    );

    if (agreeCount >= requiredVotes && suspect) {
      // Accusation is SUCCESSFUL!
      if (suspect.isSpy) {
        // Accused is indeed the SPY!
        // The Spy gets 1 last chance to guess location:
        this.startSpyLocationGuessPhase(
          room,
          suspect,
          `Tuduhan tepat! ${suspect.name} adalah Agen Rahasia (Spy)! Berikan kesempatan terakhir bagi Spy untuk menebak lokasi.`,
          io,
          gameManager,
        );
      } else {
        // Accused was INNOCENT! Spy wins automatically!
        const spies = room.players.filter((p) => p.isSpy);
        const spyNames = spies.map((s) => s.name).join(" & ");
        this.endGame(
          room,
          "SPY",
          `Agen Rahasia (${spyNames}) Menang! Warga salah menuduh ${suspect.name} yang ternyata adalah ${suspect.role}.`,
          io,
          gameManager,
        );
      }
    } else {
      // Accusation failed, resume inquiry
      io.to(room.id).emit("spyfall:accusation_rejected", {
        message: `Tuduhan terhadap ${accusation.suspectName} ditolak (${agreeCount}/${eligibleVoters.length} suara setuju). Tanya jawab dilanjutkan!`,
      });
      this.resumeInquiryPhase(room, io, gameManager);
    }
  }

  resumeInquiryPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);
    room.status = "INQUIRY_PHASE";
    room.activeAccusation = null;

    const remaining = room.remainingInquirySeconds || 60;
    const endsAt = Date.now() + remaining * 1000;
    room.inquiryEndsAt = endsAt;

    io.to(room.id).emit("spyfall:inquiry_resumed", {
      endsAt,
      duration: remaining,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.inquiryTimerTimeout = setTimeout(() => {
      this.handleInquiryTimeExpired(room, io, gameManager);
    }, remaining * 1000);
  }

  startSpyLocationGuessPhase(room, spyPlayer, promptMessage, io, gameManager) {
    gameManager.clearAllTimers(room);
    room.status = "SPY_GUESS_PHASE";
    room.activeSpyGuesser = spyPlayer;

    const guessDuration = 30;
    const endsAt = Date.now() + guessDuration * 1000;
    room.spyGuessEndsAt = endsAt;

    io.to(room.id).emit("spyfall:guess_phase_start", {
      spySocketId: spyPlayer.socketId,
      spyName: spyPlayer.name,
      message: promptMessage,
      endsAt,
      duration: guessDuration,
      allLocations: room.allLocations,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.spyGuessTimerTimeout = setTimeout(() => {
      // Time expired on spy guess -> Citizens win
      this.endGame(
        room,
        "CITIZEN",
        `Waktu menebak habis! Warga Kota Menang dan Agen Rahasia (${spyPlayer.name}) tertangkap di ${room.secretLocation?.name}.`,
        io,
        gameManager,
      );
    }, guessDuration * 1000);
  }

  submitSpyLocationGuess(room, socketId, locationName, io, gameManager) {
    if (room.status !== "SPY_GUESS_PHASE" && room.status !== "INQUIRY_PHASE") return;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isSpy) return;

    gameManager.clearAllTimers(room);

    const secretLocName = (room.secretLocation?.name || "").toLowerCase().trim();
    const guessedLocName = (locationName || "").toLowerCase().trim();

    const isCorrect = secretLocName.length > 0 && secretLocName === guessedLocName;

    if (isCorrect) {
      this.endGame(
        room,
        "SPY",
        `Agen Rahasia (${player.name}) Menang! Tebakan lokasinya tepat: "${room.secretLocation.name}"!`,
        io,
        gameManager,
      );
    } else {
      this.endGame(
        room,
        "CITIZEN",
        `Warga Kota Menang! Agen Rahasia (${player.name}) salah menebak lokasi ("${locationName}"). Lokasi sebenarnya adalah "${room.secretLocation.name}".`,
        io,
        gameManager,
      );
    }
  }

  startFinalVoteOrGuess(room, io, gameManager) {
    const spies = room.players.filter((p) => p.isSpy);
    const spy = spies[0];
    if (spy) {
      this.startSpyLocationGuessPhase(
        room,
        spy,
        `Waktu tanya jawab telah habis! Agen Rahasia (${spy.name}) harus menebak nama lokasi sekarang.`,
        io,
        gameManager,
      );
    } else {
      this.endGame(room, "CITIZEN", "Waktu habis dan permainan selesai!", io, gameManager);
    }
  }

  endGame(room, winnerSide, summaryMessage, io, gameManager) {
    room.status = "GAME_OVER";
    gameManager.clearAllTimers(room);

    room.players.forEach((p) => {
      const isWinner =
        (winnerSide === "SPY" && p.isSpy) || (winnerSide === "CITIZEN" && !p.isSpy);
      updatePlayerGameResult({
        playerId: p.playerId,
        nickname: p.name,
        gameType: "spyfall",
        role: p.isSpy ? "SPY" : "CITIZEN",
        isWinner,
        wasVotedOut: false,
        mrWhiteGuessCorrect: false,
      });
    });

    const leaderboard = getLeaderboard();

    const gameOverPayload = {
      gameType: "spyfall",
      winnerRole: winnerSide === "SPY" ? "SPY" : "CITIZEN",
      winnerSide: winnerSide === "SPY" ? "SPY" : "CITIZEN",
      summaryMessage,
      secretLocation: room.secretLocation,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        role: p.role,
        location: p.location,
        isSpy: p.isSpy,
        isWinner:
          (winnerSide === "SPY" && p.isSpy) || (winnerSide === "CITIZEN" && !p.isSpy),
      })),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  getReconnectData(room, player, socketId) {
    return {
      gameType: "spyfall",
      roleData: player.role
        ? {
            isSpy: player.isSpy,
            role: player.role,
            location: player.isSpy ? "??? (Rahasia / Kamu Spy)" : player.location,
            locationCategory: player.isSpy ? "???" : room.secretLocation?.category,
            allLocations: room.allLocations || [],
          }
        : null,
      inquiryEndsAt: room.inquiryEndsAt,
      memorizeEndsAt: room.memorizeEndsAt,
      readyCount: room.readyPlayers ? room.readyPlayers.size : 0,
      isReady: room.readyPlayers ? room.readyPlayers.has(socketId) : false,
      activeAccusation: room.activeAccusation,
      spyGuessEndsAt: room.spyGuessEndsAt,
      allLocations: room.allLocations || [],
      gameOverData: room.status === "GAME_OVER" ? room.lastGameOverData : null,
    };
  }
}
