import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordsFilePath = path.join(__dirname, "../../../data/words.json");

// Load word bank from JSON
let wordBank = [];
function loadWordBankFromFile() {
  try {
    const raw = fs.readFileSync(wordsFilePath, "utf-8");
    wordBank = JSON.parse(raw);
  } catch (e) {
    wordBank = [
      { category: "Minuman", civilian: "Kopi", undercover: "Teh" },
      { category: "Makanan", civilian: "Indomie", undercover: "Mie Sedaap" },
      { category: "Teknologi", civilian: "Laptop", undercover: "PC Desktop" },
    ];
  }
}
loadWordBankFromFile();

function saveWordBankToFile() {
  try {
    const dataDir = path.dirname(wordsFilePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(wordsFilePath, JSON.stringify(wordBank, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save words to file:", e);
  }
}

// Word Bank Management APIs
export function getWordBankList() {
  return wordBank;
}

export function addWordPair({ category, civilian, undercover }) {
  if (!civilian || !undercover) return { error: "Kata Civilian dan Undercover wajib diisi" };
  const newPair = {
    category: (category || "Umum").trim(),
    civilian: civilian.trim(),
    undercover: undercover.trim(),
  };
  wordBank.unshift(newPair);
  saveWordBankToFile();
  return { success: true, word: newPair, total: wordBank.length };
}

export function updateWordPair(index, { category, civilian, undercover }) {
  if (index < 0 || index >= wordBank.length) return { error: "Index kata tidak valid" };
  if (!civilian || !undercover) return { error: "Kata Civilian dan Undercover wajib diisi" };
  wordBank[index] = {
    category: (category || "Umum").trim(),
    civilian: civilian.trim(),
    undercover: undercover.trim(),
  };
  saveWordBankToFile();
  return { success: true, word: wordBank[index], total: wordBank.length };
}

export function deleteWordPair(index) {
  if (index < 0 || index >= wordBank.length) return { error: "Index kata tidak valid" };
  const removed = wordBank.splice(index, 1);
  saveWordBankToFile();
  return { success: true, removed: removed[0], total: wordBank.length };
}

export function bulkImportWordBank(newWordsArray) {
  if (!Array.isArray(newWordsArray) || newWordsArray.length === 0) {
    return { error: "Data import harus berupa array objek kata" };
  }

  let importedCount = 0;
  newWordsArray.forEach((item) => {
    if (item && item.civilian && item.undercover) {
      const exists = wordBank.some(
        (w) =>
          normalizeWord(w.civilian) === normalizeWord(item.civilian) &&
          normalizeWord(w.undercover) === normalizeWord(item.undercover),
      );
      if (!exists) {
        wordBank.unshift({
          category: (item.category || "Umum").trim(),
          civilian: item.civilian.trim(),
          undercover: item.undercover.trim(),
        });
        importedCount++;
      }
    }
  });

  saveWordBankToFile();
  return { success: true, importedCount, total: wordBank.length };
}

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

export function calculateAutoRoleDistribution(playerCount) {
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

  return { undercoverCount, mrWhiteCount };
}

export class UndercoverHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.role = null;
      p.word = null;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 3) {
      return { error: "Minimal butuh 3 pemain aktif untuk memulai Undercover" };
    }

    if (room.settings?.autoBalance !== false) {
      const auto = calculateAutoRoleDistribution(activePlayers.length);
      room.settings.undercoverCount = auto.undercoverCount;
      room.settings.mrWhiteCount = auto.mrWhiteCount;
      io.to(room.id).emit("room:settings_updated", room.settings);
    }

    gameManager.clearAllTimers(room);

    const randomPair = wordBank[Math.floor(Math.random() * wordBank.length)] || {
      category: "Umum",
      civilian: "Kopi",
      undercover: "Teh",
    };
    room.wordPair = randomPair;

    const count = activePlayers.length;
    const shuffled = [...activePlayers].sort(() => 0.5 - Math.random());

    let numUndercover = room.settings?.undercoverCount ?? (count >= 6 ? 2 : 1);
    let numMrWhite = room.settings?.mrWhiteCount ?? (count >= 5 ? 1 : 0);

    const maxImpostors = count - 1;
    if (numUndercover + numMrWhite > maxImpostors) {
      numUndercover = Math.max(1, Math.min(numUndercover, maxImpostors));
      numMrWhite = Math.max(0, maxImpostors - numUndercover);
    }

    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.role = null;
      p.word = null;
    });

    shuffled.forEach((p, idx) => {
      if (idx < numUndercover) {
        p.role = "UNDERCOVER";
        p.word = randomPair.undercover;
      } else if (idx < numUndercover + numMrWhite) {
        p.role = "MR_WHITE";
        p.word = "??? (Kamu Mr. White, tebak kata mereka!)";
      } else {
        p.role = "CIVILIAN";
        p.word = randomPair.civilian;
      }
    });

    room.status = "MEMORIZE_PHASE";
    room.roundNumber = 1;
    room.turnOrder = shuffled.map((p) => p.socketId);
    room.currentTurnIndex = 0;
    room.clues = [];
    room.discussionMessages = [];
    room.votes = {};
    room.mrWhiteTarget = null;
    room.lastGameOverData = null;
    room.readyPlayers = new Set();
    room.discussionReadyPlayers = new Set();

    // Unicast roles
    room.players.forEach((p) => {
      if (p.connected && p.role) {
        const isMrWhite = p.role === "MR_WHITE";
        io.to(p.socketId).emit("game:role_assigned", {
          role: p.role,
          word: isMrWhite ? "??? (Tidak Ada Kata)" : p.word,
          category: isMrWhite ? "??? (Dirahasiakan)" : randomPair.category,
        });
      }
    });

    const memorizeDuration = 25;
    const endsAt = Date.now() + memorizeDuration * 1000;
    room.memorizeEndsAt = endsAt;

    io.to(room.id).emit("phase:memorize_start", {
      endsAt,
      duration: memorizeDuration,
      totalPlayers: activePlayers.length,
      readyCount: 0,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.memorizeTimerTimeout = setTimeout(() => {
      this.startFirstClueRound(room, io, gameManager);
    }, memorizeDuration * 1000);

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    const activePlayers = room.players.filter((p) => p.connected).length || 3;
    const maxImpostors = Math.max(1, activePlayers - 1);

    if (newSettings.autoBalance) {
      const autoRoles = calculateAutoRoleDistribution(activePlayers);
      room.settings = {
        autoBalance: true,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
    } else {
      let undercovers = parseInt(newSettings.undercoverCount, 10);
      let mrWhites = parseInt(newSettings.mrWhiteCount, 10);

      if (isNaN(undercovers) || undercovers < 1) undercovers = 1;
      if (isNaN(mrWhites) || mrWhites < 0) mrWhites = 0;

      if (undercovers + mrWhites > maxImpostors) {
        if (undercovers > maxImpostors) {
          undercovers = maxImpostors;
          mrWhites = 0;
        } else {
          mrWhites = Math.max(0, maxImpostors - undercovers);
        }
      }

      room.settings = {
        autoBalance: false,
        undercoverCount: undercovers,
        mrWhiteCount: mrWhites,
      };
    }

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
      this.startFirstClueRound(room, io, gameManager);
    }
  }

  startFirstClueRound(room, io, gameManager) {
    if (room.memorizeTimerTimeout) {
      clearTimeout(room.memorizeTimerTimeout);
      room.memorizeTimerTimeout = null;
    }
    room.memorizeEndsAt = null;

    room.status = "CLUE_PHASE";
    room.currentTurnIndex = 0;

    io.to(room.id).emit("phase:clue_start", {
      room: gameManager.getSanitizedRoom(room.id),
    });

    this.startTurnTimer(room, io, gameManager);
  }

  startTurnTimer(room, io, gameManager) {
    if (room.status !== "CLUE_PHASE") return;

    if (room.turnTimerTimeout) {
      clearTimeout(room.turnTimerTimeout);
      room.turnTimerTimeout = null;
    }

    const currentSocketId = room.turnOrder[room.currentTurnIndex];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);

    if (!currentPlayer || !currentPlayer.isAlive) {
      this.advanceToNextTurn(room, io, gameManager);
      return;
    }

    room.currentTurnPlayerId = currentPlayer.playerId;

    const durationSeconds = room.turnTimeLimit || 25;
    const endsAt = Date.now() + durationSeconds * 1000;
    room.currentTurnEndsAt = endsAt;

    io.to(room.id).emit("turn:change", {
      currentTurnSocketId: currentPlayer.socketId,
      currentTurnPlayerId: currentPlayer.playerId,
      currentTurnName: currentPlayer.name,
      endsAt,
      duration: durationSeconds,
      turnIndex: room.currentTurnIndex,
    });

    room.turnTimerTimeout = setTimeout(() => {
      this.submitClue(room, currentPlayer.socketId, "(Waktu habis / Pas)", io, gameManager);
    }, durationSeconds * 1000);
  }

  submitClue(room, socketId, text, io, gameManager) {
    if (room.status !== "CLUE_PHASE") return;

    const currentSocketId = room.turnOrder[room.currentTurnIndex];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);
    const callerPlayer = room.players.find((p) => p.socketId === socketId);

    const isCurrentTurnPlayer =
      currentSocketId === socketId ||
      (callerPlayer && currentPlayer && callerPlayer.playerId === currentPlayer.playerId);

    if (!isCurrentTurnPlayer) return;

    if (room.turnTimerTimeout) {
      clearTimeout(room.turnTimerTimeout);
      room.turnTimerTimeout = null;
    }
    room.currentTurnEndsAt = null;

    const player = callerPlayer || currentPlayer;
    if (!player) return;

    const clueItem = {
      senderName: player.name,
      senderId: player.playerId,
      senderSocketId: player.socketId,
      roundNumber: room.roundNumber || 1,
      text: (text || "").trim() || "(Tidak ada kata)",
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    room.clues.push(clueItem);
    io.to(room.id).emit("clue:new", clueItem);

    this.advanceToNextTurn(room, io, gameManager);
  }

  advanceToNextTurn(room, io, gameManager) {
    if (room.status !== "CLUE_PHASE") return;

    let nextIndex = room.currentTurnIndex + 1;
    while (nextIndex < room.turnOrder.length) {
      const nextSocketId = room.turnOrder[nextIndex];
      const p = room.players.find((x) => x.socketId === nextSocketId);
      if (p && p.isAlive) break;
      nextIndex++;
    }

    if (nextIndex >= room.turnOrder.length) {
      this.startDiscussionPhase(room, io, gameManager);
    } else {
      room.currentTurnIndex = nextIndex;
      const nextSocketId = room.turnOrder[nextIndex];
      const nextPlayer = room.players.find((x) => x.socketId === nextSocketId);
      room.currentTurnPlayerId = nextPlayer ? nextPlayer.playerId : null;
      this.startTurnTimer(room, io, gameManager);
    }
  }

  startDiscussionPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "DISCUSSION_PHASE";
    room.discussionReadyPlayers = new Set();
    const duration = room.discussionTimeLimit || 120;
    const endsAt = Date.now() + duration * 1000;
    room.discussionEndsAt = endsAt;

    const aliveConnected = room.players.filter((p) => p.isAlive && p.connected);

    io.to(room.id).emit("phase:discussion_start", {
      endsAt,
      duration,
      clues: room.clues,
      readyCount: 0,
      totalAlive: aliveConnected.length,
      readySocketIds: [],
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.discussionTimerTimeout = setTimeout(() => {
      this.startVotingPhase(room, io, gameManager);
    }, duration * 1000);
  }

  toggleDiscussionReady(room, socketId, io, gameManager) {
    if (room.status !== "DISCUSSION_PHASE") return;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isAlive) return;

    if (!room.discussionReadyPlayers) room.discussionReadyPlayers = new Set();

    if (room.discussionReadyPlayers.has(socketId)) {
      room.discussionReadyPlayers.delete(socketId);
    } else {
      room.discussionReadyPlayers.add(socketId);
    }

    const aliveConnected = room.players.filter((p) => p.isAlive && p.connected);

    io.to(room.id).emit("discussion:ready_update", {
      readyCount: room.discussionReadyPlayers.size,
      totalAlive: aliveConnected.length,
      readySocketIds: Array.from(room.discussionReadyPlayers),
    });

    if (
      aliveConnected.length > 0 &&
      room.discussionReadyPlayers.size >= aliveConnected.length
    ) {
      if (room.discussionTimerTimeout) {
        clearTimeout(room.discussionTimerTimeout);
        room.discussionTimerTimeout = null;
      }
      this.startVotingPhase(room, io, gameManager);
    }
  }

  skipDiscussionToVoting(room, socketId, io, gameManager) {
    if (room.status !== "DISCUSSION_PHASE") return;
    if (room.hostId !== socketId) return;

    this.startVotingPhase(room, io, gameManager);
  }

  startVotingPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "VOTING_PHASE";
    room.votes = {};

    const alivePlayers = room.players
      .filter((p) => p.isAlive)
      .map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
      }));

    const votingDuration = 35;
    const endsAt = Date.now() + votingDuration * 1000;
    room.votingEndsAt = endsAt;

    io.to(room.id).emit("phase:voting_start", {
      alivePlayers,
      endsAt,
      duration: votingDuration,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.votingTimerTimeout = setTimeout(() => {
      this.tallyVotes(room, io, gameManager);
    }, votingDuration * 1000);
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
      this.tallyVotes(room, io, gameManager);
    }
  }

  tallyVotes(room, io, gameManager) {
    if (room.votingTimerTimeout) {
      clearTimeout(room.votingTimerTimeout);
      room.votingTimerTimeout = null;
    }
    room.votingEndsAt = null;

    const counts = {};
    Object.values(room.votes).forEach((target) => {
      if (target) {
        counts[target] = (counts[target] || 0) + 1;
      }
    });

    let highestVote = 0;
    for (const count of Object.values(counts)) {
      if (count > highestVote) {
        highestVote = count;
      }
    }

    const topCandidates = Object.keys(counts).filter(
      (id) => counts[id] === highestVote,
    );

    if (highestVote === 0 || topCandidates.length > 1) {
      const tieNames = topCandidates
        .map((sId) => {
          const p = room.players.find((x) => x.socketId === sId || x.playerId === sId);
          return p ? p.name : null;
        })
        .filter(Boolean);

      const revealDuration = 5;
      io.to(room.id).emit("vote:result", {
        isTie: true,
        tiedCandidates: tieNames,
        duration: revealDuration,
        message:
          tieNames.length > 0
            ? `Hasil vote seri antara: ${tieNames.join(" & ")} (${highestVote} suara). Tidak ada yang dieliminasi putaran ini!`
            : "Tidak ada suara yang masuk. Putaran petunjuk dilanjutkan!",
      });

      room.voteResultTimerTimeout = setTimeout(() => {
        this.prepareNextRound(room, io, gameManager);
      }, revealDuration * 1000);
      return;
    }

    const eliminatedSocketId = topCandidates[0];
    const eliminatedPlayer = room.players.find(
      (p) => p.socketId === eliminatedSocketId || p.playerId === eliminatedSocketId,
    );

    if (!eliminatedPlayer) {
      this.prepareNextRound(room, io, gameManager);
      return;
    }

    eliminatedPlayer.isAlive = false;

    if (eliminatedPlayer.role === "MR_WHITE") {
      room.status = "MR_WHITE_GUESS";
      room.mrWhiteTarget = eliminatedPlayer;

      const guessDuration = 30;
      const endsAt = Date.now() + guessDuration * 1000;
      room.mrWhiteEndsAt = endsAt;

      io.to(room.id).emit("mrwhite:guess_time", {
        mrWhiteSocketId: eliminatedPlayer.socketId,
        mrWhitePlayerId: eliminatedPlayer.playerId,
        mrWhiteName: eliminatedPlayer.name,
        endsAt,
        duration: guessDuration,
      });

      io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

      room.mrWhiteTimerTimeout = setTimeout(() => {
        this.submitMrWhiteGuess(room, "(Waktu Habis)", io, gameManager);
      }, guessDuration * 1000);
      return;
    }

    const revealDuration = 6;
    io.to(room.id).emit("vote:result", {
      isTie: false,
      eliminated: {
        name: eliminatedPlayer.name,
        role: eliminatedPlayer.role,
        socketId: eliminatedPlayer.socketId,
      },
      duration: revealDuration,
      message: `${eliminatedPlayer.name} tereliminasi! Perannya adalah ${eliminatedPlayer.role}.`,
    });

    const winResult = this.evaluateWinCondition(room);
    if (winResult.gameOver) {
      this.endGame(
        room,
        winResult.winnerRole,
        winResult.summaryMessage,
        eliminatedPlayer.playerId,
        false,
        io,
        gameManager,
      );
    } else {
      room.voteResultTimerTimeout = setTimeout(() => {
        this.prepareNextRound(room, io, gameManager);
      }, revealDuration * 1000);
    }
  }

  submitMrWhiteGuess(room, guessText, io, gameManager) {
    if (room.status !== "MR_WHITE_GUESS") return;

    if (room.mrWhiteTimerTimeout) {
      clearTimeout(room.mrWhiteTimerTimeout);
      room.mrWhiteTimerTimeout = null;
    }
    room.mrWhiteEndsAt = null;

    const mrWhite = room.mrWhiteTarget;
    if (!mrWhite) {
      this.checkWinCondition(room, null, io, gameManager);
      return;
    }

    const normalizedGuess = normalizeWord(guessText);
    const normalizedCivilianWord = normalizeWord(room.wordPair?.civilian);

    const isCorrect =
      normalizedGuess.length > 0 && normalizedGuess === normalizedCivilianWord;

    if (isCorrect) {
      this.endGame(
        room,
        "MR_WHITE",
        `Mr. White (${mrWhite.name}) berhasil menebak kata Civilian: "${room.wordPair.civilian}"!`,
        mrWhite.playerId,
        true,
        io,
        gameManager,
      );
    } else {
      io.to(room.id).emit("mrwhite:guess_fail", {
        message: `Tebakan Mr. White salah! ("${guessText}")`,
        wordGuessed: guessText,
      });
      this.checkWinCondition(room, mrWhite.playerId, io, gameManager);
    }
  }

  evaluateWinCondition(room) {
    const alive = room.players.filter((p) => p.isAlive);
    const aliveCivilians = alive.filter((p) => p.role === "CIVILIAN").length;
    const aliveUndercovers = alive.filter((p) => p.role === "UNDERCOVER").length;
    const aliveMrWhites = alive.filter((p) => p.role === "MR_WHITE").length;
    const totalImpostors = aliveUndercovers + aliveMrWhites;

    if (totalImpostors === 0) {
      return {
        gameOver: true,
        winnerRole: "CIVILIAN",
        summaryMessage: "Civilian Menang! Semua penyusup (Undercover & Mr. White) telah berhasil dieliminasi.",
      };
    }

    if (aliveCivilians === 0) {
      const winnerRole = aliveUndercovers > 0 ? "UNDERCOVER" : "MR_WHITE";
      return {
        gameOver: true,
        winnerRole,
        summaryMessage: `${winnerRole} Menang! Seluruh Civilian telah tereliminasi.`,
      };
    }

    if (alive.length <= 2 || (alive.length <= 3 && totalImpostors >= 2)) {
      const winnerRole = aliveUndercovers > 0 ? "UNDERCOVER" : "MR_WHITE";
      return {
        gameOver: true,
        winnerRole,
        summaryMessage: `${winnerRole} Menang! Permainan mencapai babak akhir (${totalImpostors} Penyusup vs ${aliveCivilians} Civilian).`,
      };
    }

    return { gameOver: false };
  }

  checkWinCondition(room, lastEliminatedPlayerId, io, gameManager) {
    const winResult = this.evaluateWinCondition(room);
    if (winResult.gameOver) {
      this.endGame(
        room,
        winResult.winnerRole,
        winResult.summaryMessage,
        lastEliminatedPlayerId,
        false,
        io,
        gameManager,
      );
    } else {
      this.prepareNextRound(room, io, gameManager);
    }
  }

  prepareNextRound(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "CLUE_PHASE";
    room.votes = {};
    room.discussionReadyPlayers = new Set();
    room.roundNumber = (room.roundNumber || 1) + 1;

    const firstAliveIndex = room.turnOrder.findIndex((sId) => {
      const p = room.players.find((x) => x.socketId === sId);
      return p && p.isAlive && p.connected;
    });

    room.currentTurnIndex = firstAliveIndex !== -1 ? firstAliveIndex : 0;

    io.to(room.id).emit("phase:clue_start", {
      room: gameManager.getSanitizedRoom(room.id),
      roundNumber: room.roundNumber,
    });
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
    this.startTurnTimer(room, io, gameManager);
  }

  endGame(room, winnerRole, summaryMessage, lastVotedPlayerId, mrWhiteGuessed, io, gameManager) {
    room.status = "GAME_OVER";
    gameManager.clearAllTimers(room);

    room.players.forEach((p) => {
      if (p.role) {
        updatePlayerGameResult({
          playerId: p.playerId,
          nickname: p.name,
          gameType: "undercover",
          role: p.role,
          isWinner: p.role === winnerRole,
          wasVotedOut: !p.isAlive,
          mrWhiteGuessCorrect: p.role === "MR_WHITE" && mrWhiteGuessed,
        });
      }
    });

    const leaderboard = getLeaderboard();

    const gameOverPayload = {
      winnerRole,
      summaryMessage,
      wordPair: room.wordPair,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        role: p.role,
        word: p.role === "MR_WHITE" ? "??? (Mr. White)" : p.word,
        isAlive: p.isAlive,
        isWinner: p.role === winnerRole,
      })),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  getReconnectData(room, player, socketId) {
    const isMrWhite = player.role === "MR_WHITE";
    const roleData = player.role
      ? {
          role: player.role,
          word: isMrWhite ? "??? (Tidak Ada Kata)" : player.word,
          category: isMrWhite ? "??? (Dirahasiakan)" : room.wordPair?.category || "Umum",
        }
      : null;

    const currentTurnSocketId =
      room.turnOrder && room.turnOrder.length > 0
        ? room.turnOrder[room.currentTurnIndex]
        : null;

    return {
      roleData,
      currentTurnSocketId,
      currentTurnEndsAt: room.currentTurnEndsAt,
      memorizeEndsAt: room.memorizeEndsAt,
      readyCount: room.readyPlayers ? room.readyPlayers.size : 0,
      isReady: room.readyPlayers ? room.readyPlayers.has(socketId) : false,
      discussionEndsAt: room.discussionEndsAt,
      discussionReadyCount: room.discussionReadyPlayers ? room.discussionReadyPlayers.size : 0,
      isDiscussionReady: room.discussionReadyPlayers ? room.discussionReadyPlayers.has(socketId) : false,
      discussionReadySocketIds: room.discussionReadyPlayers ? Array.from(room.discussionReadyPlayers) : [],
      votingEndsAt: room.votingEndsAt,
      votingCandidates:
        room.status === "VOTING_PHASE"
          ? room.players.filter((p) => p.isAlive).map((p) => ({
              socketId: p.socketId,
              playerId: p.playerId,
              name: p.name,
            }))
          : [],
      votedTarget: (room.votes && room.votes[socketId]) || null,
      voteStats: {
        votedCount: room.votes ? Object.keys(room.votes).length : 0,
        totalAlive: room.players.filter((p) => p.isAlive && p.connected).length,
      },
      mrWhiteGuessTarget:
        room.status === "MR_WHITE_GUESS" && room.mrWhiteTarget
          ? {
              mrWhiteSocketId: room.mrWhiteTarget.socketId,
              mrWhitePlayerId: room.mrWhiteTarget.playerId,
              mrWhiteName: room.mrWhiteTarget.name,
              endsAt: room.mrWhiteEndsAt,
            }
          : null,
      gameOverData: room.status === "GAME_OVER" ? room.lastGameOverData : null,
    };
  }
}
