import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeWord } from "../undercover/index.js";
import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordsFilePath = path.join(__dirname, "words.json");

let drawWordsBank = [];
try {
  const raw = fs.readFileSync(wordsFilePath, "utf-8");
  drawWordsBank = JSON.parse(raw);
} catch (e) {
  drawWordsBank = [
    { word: "Kucing", category: "Hewan" },
    { word: "Gitar", category: "Benda" },
    { word: "Pesawat Terbang", category: "Transportasi" },
    { word: "Pizza", category: "Makanan" },
    { word: "Matahari", category: "Alam" },
  ];
}

export function getDrawWordsList() {
  return drawWordsBank;
}

function saveDrawWordsToFile() {
  try {
    const dataDir = path.dirname(wordsFilePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(wordsFilePath, JSON.stringify(drawWordsBank, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save draw words to file:", e);
  }
}

export function addDrawWord({ word, category, difficulty }) {
  if (!word || typeof word !== "string" || !word.trim()) {
    return { error: "Kata tidak boleh kosong" };
  }
  const cleanWord = word.trim();
  const cleanCategory = (category || "Umum").trim();
  const cleanDiff = difficulty || "Mudah";

  const exists = drawWordsBank.some((w) => normalizeWord(w.word) === normalizeWord(cleanWord));
  if (exists) {
    return { error: "Kata sudah ada di bank kata Tebak Gambar" };
  }

  const newWord = {
    word: cleanWord,
    category: cleanCategory,
    difficulty: cleanDiff,
  };

  drawWordsBank.push(newWord);
  saveDrawWordsToFile();
  return { success: true, word: newWord, totalCount: drawWordsBank.length };
}

export function updateDrawWord(index, { word, category, difficulty }) {
  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= drawWordsBank.length) {
    return { error: "Kata tidak ditemukan" };
  }

  const existing = drawWordsBank[idx];
  const cleanWord = word && typeof word === "string" ? word.trim() : existing.word;
  const cleanCategory = category && typeof category === "string" ? category.trim() : existing.category;
  const cleanDiff = difficulty || existing.difficulty || "Mudah";

  drawWordsBank[idx] = {
    word: cleanWord,
    category: cleanCategory,
    difficulty: cleanDiff,
  };

  saveDrawWordsToFile();
  return { success: true, word: drawWordsBank[idx] };
}

export function deleteDrawWord(index) {
  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= drawWordsBank.length) {
    return { error: "Kata tidak ditemukan" };
  }

  if (drawWordsBank.length <= 5) {
    return { error: "Minimal harus menyisakan 5 kata untuk permainan Tebak Gambar" };
  }

  const [removed] = drawWordsBank.splice(idx, 1);
  saveDrawWordsToFile();
  return { success: true, removedWord: removed, totalCount: drawWordsBank.length };
}

export function bulkImportDrawWords(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Data import harus berupa array kata yang valid" };
  }

  let imported = 0;
  items.forEach((item) => {
    if (!item || !item.word) return;
    const cleanWord = item.word.trim();
    const exists = drawWordsBank.some((w) => normalizeWord(w.word) === normalizeWord(cleanWord));
    if (!exists) {
      drawWordsBank.push({
        word: cleanWord,
        category: (item.category || "Umum").trim(),
        difficulty: item.difficulty || "Mudah",
      });
      imported++;
    }
  });

  saveDrawWordsToFile();
  return { success: true, importedCount: imported, totalCount: drawWordsBank.length };
}

export class DrawGuessHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.score = 0;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 2) {
      return { error: "Minimal butuh 2 pemain aktif untuk bermain Tebak Gambar" };
    }

    gameManager.clearAllTimers(room);

    const shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
    room.drawTurnOrder = shuffled.map((p) => p.socketId);
    room.currentDrawerIndex = 0;
    room.roundNumber = 1;
    room.maxRounds = room.settings?.maxRounds || 3;
    room.drawTimeLimit = room.settings?.drawTimeLimit || 60;
    room.scores = {};
    activePlayers.forEach((p) => {
      room.scores[p.playerId || p.socketId] = 0;
    });

    room.currentWord = "";
    room.currentWordCategory = "";
    room.wordOptions = [];
    room.guessedSocketIds = new Set();
    room.canvasStrokes = [];
    room.discussionMessages = [];
    room.lastGameOverData = null;

    this.startWordChoicePhase(room, io, gameManager);
    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let timeLimit = parseInt(newSettings.drawTimeLimit, 10) || 60;
    if (timeLimit < 30) timeLimit = 30;
    if (timeLimit > 120) timeLimit = 120;

    let rounds = parseInt(newSettings.maxRounds, 10) || 3;
    if (rounds < 1) rounds = 1;
    if (rounds > 5) rounds = 5;

    room.settings = {
      drawTimeLimit: timeLimit,
      maxRounds: rounds,
    };

    io.to(room.id).emit("room:settings_updated", room.settings);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  startWordChoicePhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    const activeConnected = room.players.filter((p) => p.connected);
    if (activeConnected.length < 2) {
      this.endGame(room, io, gameManager);
      return;
    }

    const drawerSocketId = room.drawTurnOrder[room.currentDrawerIndex % room.drawTurnOrder.length];
    const drawer = room.players.find((p) => p.socketId === drawerSocketId);

    if (!drawer || !drawer.connected) {
      this.advanceToNextTurn(room, io, gameManager);
      return;
    }

    room.status = "WORD_CHOICE_PHASE";
    room.currentDrawerSocketId = drawer.socketId;
    room.currentDrawerPlayerId = drawer.playerId;
    room.currentDrawerName = drawer.name;
    room.canvasStrokes = [];
    room.guessedSocketIds = new Set();
    room.correctGuessers = [];

    // Pick 3 random word options
    const shuffledWords = [...drawWordsBank].sort(() => 0.5 - Math.random());
    const options = shuffledWords.slice(0, 3);
    room.wordOptions = options;

    const choiceDuration = 15;
    const endsAt = Date.now() + choiceDuration * 1000;
    room.choiceEndsAt = endsAt;

    // Unicast options to drawer
    io.to(drawer.socketId).emit("draw:word_choices", {
      options,
      endsAt,
      duration: choiceDuration,
    });

    // Broadcast waiting to others
    io.to(room.id).emit("draw:waiting_for_drawer", {
      drawerName: drawer.name,
      drawerSocketId: drawer.socketId,
      drawerPlayerId: drawer.playerId,
      roundNumber: room.roundNumber,
      maxRounds: room.maxRounds,
      endsAt,
      scores: this.getFormattedScores(room),
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.choiceTimerTimeout = setTimeout(() => {
      // Auto-pick first option if drawer timed out
      this.selectWord(room, drawer.socketId, options[0].word, options[0].category, io, gameManager);
    }, choiceDuration * 1000);
  }

  selectWord(room, socketId, word, category, io, gameManager) {
    if (room.status !== "WORD_CHOICE_PHASE") return;
    if (room.currentDrawerSocketId !== socketId) return;

    if (room.choiceTimerTimeout) {
      clearTimeout(room.choiceTimerTimeout);
      room.choiceTimerTimeout = null;
    }

    room.currentWord = word;
    room.currentWordCategory = category || "Umum";

    this.startDrawingPhase(room, io, gameManager);
  }

  startDrawingPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "DRAWING_PHASE";
    room.guessedSocketIds = new Set();
    room.correctGuessers = [];

    const duration = room.drawTimeLimit || 60;
    const endsAt = Date.now() + duration * 1000;
    room.drawEndsAt = endsAt;

    const drawer = room.players.find((p) => p.socketId === room.currentDrawerSocketId);

    // Create masked word for guessers (e.g. "K u c i n g" -> "_ _ _ _ _ _")
    const maskedWord = room.currentWord
      .split("")
      .map((ch) => (ch === " " ? " " : "_"))
      .join(" ");

    // Send secret word to drawer
    io.to(room.currentDrawerSocketId).emit("draw:turn_active_drawer", {
      word: room.currentWord,
      category: room.currentWordCategory,
      endsAt,
      duration,
      scores: this.getFormattedScores(room),
    });

    // Send masked hints to guessers
    const guessers = room.players.filter((p) => p.socketId !== room.currentDrawerSocketId && p.connected);
    guessers.forEach((p) => {
      io.to(p.socketId).emit("draw:turn_active_guesser", {
        drawerName: drawer?.name || "Pelukis",
        drawerSocketId: drawer?.socketId,
        maskedWord,
        wordLength: room.currentWord.length,
        category: room.currentWordCategory,
        endsAt,
        duration,
        scores: this.getFormattedScores(room),
      });
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.drawTimerTimeout = setTimeout(() => {
      this.endTurn(room, io, gameManager, "Waktu Menggambar Habis!");
    }, duration * 1000);
  }

  skipTurn(room, socketId, io, gameManager) {
    if (room.status !== "DRAWING_PHASE" && room.status !== "WORD_CHOICE_PHASE") return;
    if (room.hostId !== socketId) return;
    this.endTurn(room, io, gameManager, "Giliran dilewati oleh Host!");
  }

  handleStroke(room, socketId, strokeData, io) {
    if (room.status !== "DRAWING_PHASE") return;
    if (room.currentDrawerSocketId !== socketId) return;

    room.canvasStrokes.push(strokeData);
    // Broadcast stroke to all other sockets in room
    io.to(room.id).emit("draw:stroke_received", strokeData);
  }

  handleClearCanvas(room, socketId, io) {
    if (room.status !== "DRAWING_PHASE") return;
    if (room.currentDrawerSocketId !== socketId) return;

    room.canvasStrokes = [];
    io.to(room.id).emit("draw:canvas_cleared");
  }

  submitGuess(room, socketId, guessText, io, gameManager) {
    if (room.status !== "DRAWING_PHASE") return;
    // Drawer cannot guess
    if (room.currentDrawerSocketId === socketId) return;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return;

    const trimmed = (guessText || "").trim();
    if (!trimmed) return;

    const normalizedGuess = normalizeWord(trimmed);
    const normalizedTarget = normalizeWord(room.currentWord || "");

    // If player already guessed correctly this turn:
    if (room.guessedSocketIds.has(socketId) || (player.playerId && room.correctGuessers?.some((g) => g.playerId === player.playerId))) {
      // Prevent leaking the answer to others
      if (normalizedGuess.length > 0 && normalizedGuess === normalizedTarget) {
        io.to(socketId).emit("draw:warning", {
          message: "Kamu sudah berhasil menebak kata ini! Jangan bocorkan jawabannya ke teman ya! 🤫",
        });
        return;
      }

      const msg = {
        senderName: player.name,
        senderId: player.playerId,
        senderSocketId: socketId,
        text: trimmed,
        isGuessedAlready: true,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      io.to(room.id).emit("discussion:new_message", msg);
      return;
    }

    const isCorrect = normalizedGuess.length > 0 && normalizedGuess === normalizedTarget;

    if (isCorrect) {
      room.guessedSocketIds.add(socketId);

      // Award points based on speed/rank
      const rank = room.guessedSocketIds.size;
      const guesserPoints = Math.max(50, 110 - rank * 15);
      const drawerBonus = 35;

      const pKey = player.playerId || player.socketId;
      room.scores[pKey] = (room.scores[pKey] || 0) + guesserPoints;

      const drawer = room.players.find((p) => p.socketId === room.currentDrawerSocketId);
      if (drawer) {
        const dKey = drawer.playerId || drawer.socketId;
        room.scores[dKey] = (room.scores[dKey] || 0) + drawerBonus;
      }

      if (!room.correctGuessers) room.correctGuessers = [];
      room.correctGuessers.push({
        socketId,
        playerId: player.playerId,
        name: player.name,
        points: guesserPoints,
        rank,
      });

      // Broadcast victory event
      io.to(room.id).emit("draw:correct_guess", {
        playerName: player.name,
        playerSocketId: socketId,
        playerId: player.playerId,
        points: guesserPoints,
        rank,
        correctGuessers: room.correctGuessers,
        scores: this.getFormattedScores(room),
      });

      // Send private confirmation with secret word to winning guesser
      io.to(socketId).emit("draw:you_guessed_correct", {
        word: room.currentWord,
        points: guesserPoints,
        rank,
      });

      // Broadcast room update so all clients get real-time guesser badges
      io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

      // Check if all eligible players have now guessed correctly (instant transition!)
      this.checkAllGuessed(room, io, gameManager);
    } else {
      // Normal chat message
      const msg = {
        senderName: player.name,
        senderId: player.playerId,
        senderSocketId: socketId,
        text: trimmed,
        isGuessedAlready: false,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      io.to(room.id).emit("discussion:new_message", msg);
    }
  }

  checkAllGuessed(room, io, gameManager) {
    if (room.status !== "DRAWING_PHASE") return false;

    const drawerSocketId = room.currentDrawerSocketId;
    const drawerPlayerId = room.currentDrawerPlayerId;

    // Active eligible guessers (connected, not spectator, alive, and not the drawer)
    const eligibleGuessers = room.players.filter((p) => {
      if (!p.connected || p.isSpectator || p.isAlive === false) return false;
      if (drawerSocketId && p.socketId === drawerSocketId) return false;
      if (drawerPlayerId && p.playerId === drawerPlayerId) return false;
      return true;
    });

    if (eligibleGuessers.length === 0) {
      if (room.drawTimerTimeout) {
        clearTimeout(room.drawTimerTimeout);
        room.drawTimerTimeout = null;
      }
      this.endTurn(room, io, gameManager, "Tidak ada penebak tersisa.");
      return true;
    }

    const allGuessed = eligibleGuessers.every((p) => {
      const socketGuessed = room.guessedSocketIds && room.guessedSocketIds.has(p.socketId);
      const playerGuessed = p.playerId && room.correctGuessers?.some((g) => g.playerId === p.playerId);
      return socketGuessed || playerGuessed;
    });

    if (allGuessed) {
      if (room.drawTimerTimeout) {
        clearTimeout(room.drawTimerTimeout);
        room.drawTimerTimeout = null;
      }
      this.endTurn(room, io, gameManager, "Semua pemain berhasil menebak! 🎉");
      return true;
    }

    return false;
  }

  onPlayerDisconnect(room, socketId, io, gameManager) {
    const connectedPlayers = room.players.filter((p) => p.connected && !p.isSpectator);
    if (connectedPlayers.length < 2) {
      this.endGame(room, io, gameManager);
      return;
    }

    if (room.status === "WORD_CHOICE_PHASE") {
      if (room.currentDrawerSocketId === socketId) {
        if (room.choiceTimerTimeout) {
          clearTimeout(room.choiceTimerTimeout);
          room.choiceTimerTimeout = null;
        }
        this.advanceToNextTurn(room, io, gameManager);
      }
    } else if (room.status === "DRAWING_PHASE") {
      if (room.currentDrawerSocketId === socketId) {
        if (room.drawTimerTimeout) {
          clearTimeout(room.drawTimerTimeout);
          room.drawTimerTimeout = null;
        }
        this.endTurn(room, io, gameManager, "Pelukis terputus dari permainan!");
      } else {
        this.checkAllGuessed(room, io, gameManager);
      }
    }
  }

  skipSummary(room, socketId, io, gameManager) {
    if (room.status !== "ROUND_SUMMARY_PHASE") return;
    if (room.hostId !== socketId) return;

    if (room.summaryTimerTimeout) {
      clearTimeout(room.summaryTimerTimeout);
      room.summaryTimerTimeout = null;
    }
    this.advanceToNextTurn(room, io, gameManager);
  }

  endTurn(room, io, gameManager, reasonMessage = "Giliran Selesai!") {
    gameManager.clearAllTimers(room);

    room.status = "ROUND_SUMMARY_PHASE";
    const summaryDuration = 4;
    const endsAt = Date.now() + summaryDuration * 1000;

    const drawer = room.players.find((p) => p.socketId === room.currentDrawerSocketId);

    io.to(room.id).emit("draw:turn_summary", {
      revealedWord: room.currentWord,
      category: room.currentWordCategory,
      drawerName: drawer?.name || "Pelukis",
      reasonMessage,
      scores: this.getFormattedScores(room),
      endsAt,
      duration: summaryDuration,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.summaryTimerTimeout = setTimeout(() => {
      this.advanceToNextTurn(room, io, gameManager);
    }, summaryDuration * 1000);
  }

  advanceToNextTurn(room, io, gameManager) {
    room.currentDrawerIndex++;

    // Check if one full round completed
    if (room.currentDrawerIndex >= room.drawTurnOrder.length) {
      room.currentDrawerIndex = 0;
      room.roundNumber++;

      if (room.roundNumber > room.maxRounds) {
        this.endGame(room, io, gameManager);
        return;
      }
    }

    this.startWordChoicePhase(room, io, gameManager);
  }

  endGame(room, io, gameManager) {
    room.status = "GAME_OVER";
    gameManager.clearAllTimers(room);

    const formattedScores = this.getFormattedScores(room);
    const winner = formattedScores[0];

    // Record stats
    room.players.forEach((p) => {
      const pKey = p.playerId || p.socketId;
      const isWinner = winner && winner.playerId === p.playerId;
      updatePlayerGameResult({
        playerId: p.playerId,
        nickname: p.name,
        gameType: "drawguess",
        role: "DRAWER",
        isWinner,
        points: room.scores[pKey] || 0,
        wasVotedOut: false,
        mrWhiteGuessCorrect: false,
      });
    });

    const leaderboard = getLeaderboard();

    const gameOverPayload = {
      winnerRole: "CIVILIAN",
      winnerName: winner?.name || "Pemenang",
      summaryMessage: `Game Selesai! Selamat kepada ${winner?.name || "Pemenang"} yang meraih skor tertinggi (${winner?.score || 0} Poin)!`,
      finalScores: formattedScores,
      players: room.players.map((p) => {
        const pKey = p.playerId || p.socketId;
        return {
          socketId: p.socketId,
          playerId: p.playerId,
          name: p.name,
          score: room.scores[pKey] || 0,
          isWinner: winner && winner.playerId === p.playerId,
        };
      }),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  getFormattedScores(room) {
    return room.players
      .map((p) => {
        const pKey = p.playerId || p.socketId;
        return {
          socketId: p.socketId,
          playerId: p.playerId,
          name: p.name,
          score: room.scores[pKey] || 0,
          connected: p.connected,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  getReconnectData(room, player, socketId) {
    const isDrawer = room.currentDrawerSocketId === socketId;
    const maskedWord = room.currentWord
      ? room.currentWord.split("").map((ch) => (ch === " " ? " " : "_")).join(" ")
      : "";

    return {
      gameType: "drawguess",
      isDrawer,
      currentDrawerName: room.currentDrawerName,
      currentDrawerSocketId: room.currentDrawerSocketId,
      word: isDrawer ? room.currentWord : null,
      maskedWord: isDrawer ? null : maskedWord,
      category: room.currentWordCategory,
      choiceEndsAt: room.choiceEndsAt,
      drawEndsAt: room.drawEndsAt,
      roundNumber: room.roundNumber,
      maxRounds: room.maxRounds,
      scores: this.getFormattedScores(room),
      canvasStrokes: room.canvasStrokes || [],
      hasGuessed: room.guessedSocketIds ? room.guessedSocketIds.has(socketId) : false,
      gameOverData: room.status === "GAME_OVER" ? room.lastGameOverData : null,
    };
  }
}
