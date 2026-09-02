import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

export function calculateWerewolfRoles(playerCount, customSettings = {}) {
  const count = Math.max(4, playerCount || 4);
  let werewolfCount = customSettings.werewolfCount;
  if (!werewolfCount) {
    if (count <= 5) werewolfCount = 1;
    else if (count <= 8) werewolfCount = 2;
    else werewolfCount = 3;
  }

  const hasSeer = customSettings.hasSeer !== false;
  const hasDoctor = customSettings.hasDoctor !== false;

  let specialCount = werewolfCount + (hasSeer ? 1 : 0) + (hasDoctor ? 1 : 0);
  if (specialCount >= count) {
    werewolfCount = Math.max(1, count - 2);
  }

  return {
    werewolfCount,
    hasSeer,
    hasDoctor,
    villagerCount: Math.max(1, count - (werewolfCount + (hasSeer ? 1 : 0) + (hasDoctor ? 1 : 0))),
  };
}

export class WerewolfHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.role = null;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 4) {
      return { error: "Minimal butuh 4 pemain aktif untuk memulai Werewolf" };
    }

    gameManager.clearAllTimers(room);

    const count = activePlayers.length;
    const shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
    const roleConfig = calculateWerewolfRoles(count, room.settings || {});

    // Role assignment pool
    const rolesPool = [];
    for (let i = 0; i < roleConfig.werewolfCount; i++) rolesPool.push("WEREWOLF");
    if (roleConfig.hasSeer) rolesPool.push("SEER");
    if (roleConfig.hasDoctor) rolesPool.push("DOCTOR");
    while (rolesPool.length < count) rolesPool.push("VILLAGER");

    // Shuffle roles
    rolesPool.sort(() => 0.5 - Math.random());

    shuffled.forEach((p, idx) => {
      p.role = rolesPool[idx] || "VILLAGER";
      p.isAlive = true;
    });

    room.status = "MEMORIZE_PHASE";
    room.roundNumber = 1;
    room.readyPlayers = new Set();
    room.nightActions = {
      wolfTargetId: null,
      wolfVotes: {}, // wolfSocketId -> targetSocketId
      seerTargetId: null,
      seerCheckedResult: null,
      doctorProtectedId: null,
    };
    room.dayAnnouncement = null;
    room.discussionMessages = [];
    room.votes = {};
    room.lastGameOverData = null;

    // Unicast role identity to each player
    const werewolves = room.players.filter((p) => p.role === "WEREWOLF");
    const werewolfTeammateNames = werewolves.map((w) => w.name);

    room.players.forEach((p) => {
      if (p.connected) {
        io.to(p.socketId).emit("game:role_assigned", {
          role: p.role,
          gameType: "werewolf",
          teammates: p.role === "WEREWOLF" ? werewolfTeammateNames : [],
        });
      }
    });

    const memorizeDuration = 15;
    const endsAt = Date.now() + memorizeDuration * 1000;
    room.memorizeEndsAt = endsAt;

    io.to(room.id).emit("phase:memorize_start", {
      endsAt,
      duration: memorizeDuration,
      totalPlayers: activePlayers.length,
      readyCount: 0,
      gameType: "werewolf",
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.memorizeTimerTimeout = setTimeout(() => {
      this.startNightPhase(room, io, gameManager);
    }, memorizeDuration * 1000);

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let wolfCount = parseInt(newSettings.werewolfCount, 10) || 1;
    if (wolfCount < 1) wolfCount = 1;
    if (wolfCount > 4) wolfCount = 4;

    room.settings = {
      werewolfCount: wolfCount,
      hasSeer: newSettings.hasSeer !== false,
      hasDoctor: newSettings.hasDoctor !== false,
      dayDiscussionSeconds: parseInt(newSettings.dayDiscussionSeconds, 10) || 90,
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
      this.startNightPhase(room, io, gameManager);
    }
  }

  skipNightPhase(room, socketId, io, gameManager) {
    if (room.status !== "NIGHT_PHASE") return;
    if (room.hostId !== socketId) return;
    this.resolveNightAndStartDay(room, io, gameManager);
  }

  skipDayDiscussion(room, socketId, io, gameManager) {
    if (room.status !== "DAY_PHASE") return;
    if (room.hostId !== socketId) return;
    this.startVotingPhase(room, io, gameManager);
  }

  skipVotingPhase(room, socketId, io, gameManager) {
    if (room.status !== "VOTING_PHASE") return;
    if (room.hostId !== socketId) return;
    this.tallyDayVotes(room, io, gameManager);
  }

  startNightPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);
    room.memorizeEndsAt = null;

    room.status = "NIGHT_PHASE";
    room.nightActions = {
      wolfTargetId: null,
      wolfVotes: {},
      seerTargetId: null,
      seerCheckedResult: null,
      doctorProtectedId: null,
    };

    const duration = 25; // 25 seconds for night actions
    const endsAt = Date.now() + duration * 1000;
    room.nightEndsAt = endsAt;

    const alivePlayers = room.players
      .filter((p) => p.isAlive && p.connected)
      .map((p) => ({ socketId: p.socketId, playerId: p.playerId, name: p.name }));

    io.to(room.id).emit("werewolf:night_start", {
      endsAt,
      duration,
      roundNumber: room.roundNumber || 1,
      alivePlayers,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.nightTimerTimeout = setTimeout(() => {
      this.resolveNightAndStartDay(room, io, gameManager);
    }, duration * 1000);
  }

  // Seer Peek Action
  seerPeek(room, socketId, targetSocketId, io) {
    if (room.status !== "NIGHT_PHASE") return;
    const seer = room.players.find((p) => p.socketId === socketId);
    if (!seer || !seer.isAlive || seer.role !== "SEER") return;

    const target = room.players.find((p) => p.socketId === targetSocketId);
    if (!target || !target.isAlive) return;

    const isWolf = target.role === "WEREWOLF";
    room.nightActions.seerTargetId = targetSocketId;
    room.nightActions.seerCheckedResult = {
      targetName: target.name,
      isWerewolf: isWolf,
      role: target.role,
    };

    // Unicast result to Seer only
    io.to(socketId).emit("werewolf:seer_result", {
      targetSocketId,
      targetName: target.name,
      isWerewolf: isWolf,
    });
  }

  // Doctor Protect Action
  doctorProtect(room, socketId, targetSocketId, io) {
    if (room.status !== "NIGHT_PHASE") return;
    const doc = room.players.find((p) => p.socketId === socketId);
    if (!doc || !doc.isAlive || doc.role !== "DOCTOR") return;

    const target = room.players.find((p) => p.socketId === targetSocketId);
    if (!target || !target.isAlive) return;

    room.nightActions.doctorProtectedId = targetSocketId;

    io.to(socketId).emit("werewolf:doctor_confirm", {
      protectedSocketId: targetSocketId,
      protectedName: target.name,
    });
  }

  // Werewolf Kill Vote Action
  werewolfVote(room, socketId, targetSocketId, io) {
    if (room.status !== "NIGHT_PHASE") return;
    const wolf = room.players.find((p) => p.socketId === socketId);
    if (!wolf || !wolf.isAlive || wolf.role !== "WEREWOLF") return;

    const target = room.players.find((p) => p.socketId === targetSocketId);
    if (!target || !target.isAlive) return;

    room.nightActions.wolfVotes[socketId] = targetSocketId;

    // Broadcast to other werewolves
    const werewolves = room.players.filter((p) => p.role === "WEREWOLF" && p.connected);
    werewolves.forEach((w) => {
      io.to(w.socketId).emit("werewolf:pack_vote_update", {
        voterSocketId: socketId,
        voterName: wolf.name,
        targetSocketId,
        targetName: target.name,
        wolfVotes: room.nightActions.wolfVotes,
      });
    });
  }

  resolveNightAndStartDay(room, io, gameManager) {
    if (room.nightTimerTimeout) {
      clearTimeout(room.nightTimerTimeout);
      room.nightTimerTimeout = null;
    }
    room.nightEndsAt = null;

    // Tally werewolf target
    const wolfVotes = room.nightActions.wolfVotes || {};
    const counts = {};
    Object.values(wolfVotes).forEach((targetId) => {
      counts[targetId] = (counts[targetId] || 0) + 1;
    });

    let topTargetId = null;
    let maxVotes = 0;
    for (const [targetId, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        topTargetId = targetId;
      }
    }

    const protectedId = room.nightActions.doctorProtectedId;
    let victimPlayer = null;
    let wasSaved = false;

    if (topTargetId) {
      if (topTargetId === protectedId) {
        wasSaved = true;
      } else {
        victimPlayer = room.players.find((p) => p.socketId === topTargetId);
        if (victimPlayer) {
          victimPlayer.isAlive = false;
        }
      }
    }

    room.dayAnnouncement = {
      victim: victimPlayer
        ? {
            name: victimPlayer.name,
            socketId: victimPlayer.socketId,
            role: victimPlayer.role,
          }
        : null,
      wasSaved,
      message: victimPlayer
        ? `Tragis! ${victimPlayer.name} ditemukan tewas dimangsa oleh Serigala semalam.`
        : wasSaved
          ? "Kabar baik! Dokter desa berhasil menyelamatkan korban semalam sehingga tidak ada korban jiwa!"
          : "Malam yang tenang, tidak ada korban yang gugur semalam.",
    };

    // Check win condition
    const winResult = this.evaluateWinCondition(room);
    if (winResult.gameOver) {
      this.endGame(room, winResult.winnerRole, winResult.summaryMessage, io, gameManager);
      return;
    }

    this.startDayPhase(room, io, gameManager);
  }

  startDayPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "DAY_PHASE";
    room.discussionReadyPlayers = new Set();

    const duration = room.settings?.dayDiscussionSeconds || 90;
    const endsAt = Date.now() + duration * 1000;
    room.dayDiscussionEndsAt = endsAt;

    io.to(room.id).emit("werewolf:day_start", {
      announcement: room.dayAnnouncement,
      endsAt,
      duration,
      roundNumber: room.roundNumber || 1,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.dayTimerTimeout = setTimeout(() => {
      this.startVotingPhase(room, io, gameManager);
    }, duration * 1000);
  }

  startVotingPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "VOTING_PHASE";
    room.votes = {};

    const alivePlayers = room.players
      .filter((p) => p.isAlive && p.connected)
      .map((p) => ({ socketId: p.socketId, playerId: p.playerId, name: p.name }));

    const duration = 35;
    const endsAt = Date.now() + duration * 1000;
    room.votingEndsAt = endsAt;

    io.to(room.id).emit("phase:voting_start", {
      alivePlayers,
      endsAt,
      duration,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.votingTimerTimeout = setTimeout(() => {
      this.tallyDayVotes(room, io, gameManager);
    }, duration * 1000);
  }

  castVote(room, voterSocketId, targetSocketId, io, gameManager) {
    if (room.status !== "VOTING_PHASE") return;
    if (voterSocketId === targetSocketId) return;

    const voter = room.players.find((p) => p.socketId === voterSocketId);
    if (!voter || !voter.isAlive) return;

    room.votes[voterSocketId] = targetSocketId;
    const aliveConnected = room.players.filter((p) => p.isAlive && p.connected);

    io.to(room.id).emit("vote:update", {
      votedCount: Object.keys(room.votes).length,
      totalAlive: aliveConnected.length,
    });

    if (
      aliveConnected.length > 0 &&
      Object.keys(room.votes).length >= aliveConnected.length
    ) {
      if (room.votingTimerTimeout) {
        clearTimeout(room.votingTimerTimeout);
        room.votingTimerTimeout = null;
      }
      this.tallyDayVotes(room, io, gameManager);
    }
  }

  tallyDayVotes(room, io, gameManager) {
    if (room.votingTimerTimeout) {
      clearTimeout(room.votingTimerTimeout);
      room.votingTimerTimeout = null;
    }
    room.votingEndsAt = null;

    const counts = {};
    Object.values(room.votes).forEach((targetId) => {
      if (targetId) counts[targetId] = (counts[targetId] || 0) + 1;
    });

    let highest = 0;
    for (const c of Object.values(counts)) {
      if (c > highest) highest = c;
    }

    const topCandidates = Object.keys(counts).filter((id) => counts[id] === highest);

    if (highest === 0 || topCandidates.length > 1) {
      const revealDuration = 5;
      io.to(room.id).emit("vote:result", {
        isTie: true,
        tiedCandidates: topCandidates.map((id) => room.players.find((p) => p.socketId === id)?.name).filter(Boolean),
        duration: revealDuration,
        message: "Hasil voting musyawarah desa seri! Tidak ada warga yang dieksekusi hari ini.",
      });

      room.voteResultTimerTimeout = setTimeout(() => {
        this.advanceToNextNight(room, io, gameManager);
      }, revealDuration * 1000);
      return;
    }

    const eliminatedId = topCandidates[0];
    const eliminated = room.players.find((p) => p.socketId === eliminatedId);

    if (eliminated) {
      eliminated.isAlive = false;
      const revealDuration = 6;
      io.to(room.id).emit("vote:result", {
        isTie: false,
        eliminated: {
          name: eliminated.name,
          role: eliminated.role,
          socketId: eliminated.socketId,
        },
        duration: revealDuration,
        message: `Warga desa memutuskan mengeksekusi ${eliminated.name}! Perannya adalah ${eliminated.role}.`,
      });

      const winResult = this.evaluateWinCondition(room);
      if (winResult.gameOver) {
        this.endGame(room, winResult.winnerRole, winResult.summaryMessage, io, gameManager);
      } else {
        room.voteResultTimerTimeout = setTimeout(() => {
          this.advanceToNextNight(room, io, gameManager);
        }, revealDuration * 1000);
      }
    }
  }

  advanceToNextNight(room, io, gameManager) {
    room.roundNumber = (room.roundNumber || 1) + 1;
    this.startNightPhase(room, io, gameManager);
  }

  evaluateWinCondition(room) {
    const alive = room.players.filter((p) => p.isAlive);
    const aliveWolves = alive.filter((p) => p.role === "WEREWOLF").length;
    const aliveGood = alive.filter((p) => p.role !== "WEREWOLF").length;

    // 1. Village Win: All Werewolves are dead
    if (aliveWolves === 0) {
      return {
        gameOver: true,
        winnerRole: "VILLAGER",
        summaryMessage: "Warga Desa Menang! Seluruh Serigala berhasil dimusnahkan dan desa kembali damai.",
      };
    }

    // 2. Werewolf Win: Wolves equal or outnumber good villagers
    if (aliveWolves >= aliveGood) {
      return {
        gameOver: true,
        winnerRole: "WEREWOLF",
        summaryMessage: "Kawanan Serigala Menang! Jumlah serigala telah menguasai desa.",
      };
    }

    return { gameOver: false };
  }

  endGame(room, winnerRole, summaryMessage, io, gameManager) {
    room.status = "GAME_OVER";
    gameManager.clearAllTimers(room);

    room.players.forEach((p) => {
      const isWinner =
        (winnerRole === "WEREWOLF" && p.role === "WEREWOLF") ||
        (winnerRole === "VILLAGER" && p.role !== "WEREWOLF");
      updatePlayerGameResult({
        playerId: p.playerId,
        nickname: p.name,
        gameType: "werewolf",
        role: p.role,
        isWinner,
        wasVotedOut: !p.isAlive,
        mrWhiteGuessCorrect: false,
      });
    });

    const leaderboard = getLeaderboard();

    const gameOverPayload = {
      winnerRole,
      summaryMessage,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        role: p.role,
        isAlive: p.isAlive,
        isWinner:
          (winnerRole === "WEREWOLF" && p.role === "WEREWOLF") ||
          (winnerRole === "VILLAGER" && p.role !== "WEREWOLF"),
      })),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  getReconnectData(room, player, socketId) {
    const werewolves = room.players.filter((p) => p.role === "WEREWOLF");
    return {
      gameType: "werewolf",
      roleData: player.role
        ? {
            role: player.role,
            teammates: player.role === "WEREWOLF" ? werewolves.map((w) => w.name) : [],
          }
        : null,
      nightEndsAt: room.nightEndsAt,
      dayDiscussionEndsAt: room.dayDiscussionEndsAt,
      memorizeEndsAt: room.memorizeEndsAt,
      votingEndsAt: room.votingEndsAt,
      readyCount: room.readyPlayers ? room.readyPlayers.size : 0,
      isReady: room.readyPlayers ? room.readyPlayers.has(socketId) : false,
      dayAnnouncement: room.dayAnnouncement,
      votingCandidates:
        room.status === "VOTING_PHASE"
          ? room.players.filter((p) => p.isAlive).map((p) => ({
              socketId: p.socketId,
              playerId: p.playerId,
              name: p.name,
            }))
          : [],
      gameOverData: room.status === "GAME_OVER" ? room.lastGameOverData : null,
    };
  }
}
