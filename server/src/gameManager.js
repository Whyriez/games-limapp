import {
  GAMES_REGISTRY,
  getGameConfig,
  getGameHandler,
  getAvailableGames,
} from "./games/registry.js";
import {
  getWordBankList,
  addWordPair,
  updateWordPair,
  deleteWordPair,
  bulkImportWordBank,
  normalizeWord,
  calculateAutoRoleDistribution,
} from "./games/undercover/index.js";

// Re-export word bank management functions for backward compatibility with REST endpoints
export {
  getWordBankList,
  addWordPair,
  updateWordPair,
  deleteWordPair,
  bulkImportWordBank,
  normalizeWord,
  calculateAutoRoleDistribution,
};

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> RoomState
    this.cleanupTimers = new Map(); // roomId -> Timeout
  }

  createRoom(roomId, hostId, hostName, hostPlayerId, initialGameType = "undercover") {
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId));
      this.cleanupTimers.delete(roomId);
    }

    const gameConfig = getGameConfig(initialGameType);

    const newRoom = {
      id: roomId,
      hostId: hostId,
      hostPlayerId: hostPlayerId,
      gameType: gameConfig.id,
      status: "LOBBY",
      settings: { ...gameConfig.defaultSettings },
      players: [
        {
          socketId: hostId,
          playerId: hostPlayerId,
          name: hostName,
          isAlive: true,
          connected: true,
          role: null,
          word: null,
        },
      ],
      turnOrder: [],
      currentTurnIndex: 0,
      turnTimeLimit: 25,
      turnTimerTimeout: null,
      currentTurnEndsAt: null,
      memorizeEndsAt: null,
      memorizeTimerTimeout: null,
      readyPlayers: new Set(),
      discussionTimeLimit: 120,
      discussionReadyPlayers: new Set(),
      discussionEndsAt: null,
      discussionTimerTimeout: null,
      votingEndsAt: null,
      votingTimerTimeout: null,
      voteResultTimerTimeout: null,
      mrWhiteEndsAt: null,
      mrWhiteTimerTimeout: null,
      inquiryEndsAt: null,
      inquiryTimerTimeout: null,
      accusationTimerTimeout: null,
      spyGuessEndsAt: null,
      spyGuessTimerTimeout: null,
      nightEndsAt: null,
      nightTimerTimeout: null,
      dayDiscussionEndsAt: null,
      dayTimerTimeout: null,
      choiceEndsAt: null,
      choiceTimerTimeout: null,
      drawEndsAt: null,
      drawTimerTimeout: null,
      summaryTimerTimeout: null,
      clues: [],
      discussionMessages: [],
      votes: {},
      roundNumber: 1,
      wordPair: null,
      mrWhiteTarget: null,
      lastGameOverData: null,
    };

    // If initial game is Undercover, balance roles
    if (gameConfig.id === "undercover") {
      const autoRoles = calculateAutoRoleDistribution(1);
      newRoom.settings = {
        autoBalance: true,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
    }

    this.rooms.set(roomId, newRoom);
    return this.getSanitizedRoom(roomId);
  }

  changeGameType(roomId, socketId, newGameType) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "LOBBY") {
      return { error: "Hanya dapat mengganti game saat berada di ruang tunggu (Lobby)" };
    }

    if (room.hostId !== socketId) {
      return { error: "Hanya host yang dapat mengganti jenis permainan" };
    }

    const gameConfig = getGameConfig(newGameType);
    room.gameType = gameConfig.id;
    room.settings = { ...gameConfig.defaultSettings };

    if (gameConfig.id === "undercover") {
      const activeCount = room.players.filter((p) => p.connected).length || 3;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings = {
        autoBalance: true,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
    }

    this.io.to(roomId).emit("room:game_changed", {
      gameType: room.gameType,
      gameConfig: {
        id: gameConfig.id,
        name: gameConfig.name,
        fullName: gameConfig.fullName,
        minPlayers: gameConfig.minPlayers,
        maxPlayers: gameConfig.maxPlayers,
        category: gameConfig.category,
      },
      settings: room.settings,
    });

    this.io.to(roomId).emit("room:settings_updated", room.settings);
    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));

    return { success: true, room: this.getSanitizedRoom(roomId) };
  }

  updateRoomSettings(roomId, socketId, newSettings) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.updateSettings === "function") {
      handler.updateSettings(room, socketId, newSettings, this.io, this);
    } else {
      room.settings = { ...room.settings, ...newSettings };
      this.io.to(roomId).emit("room:settings_updated", room.settings);
      this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
    }
  }

  joinRoom(roomId, socketId, name, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room tidak ditemukan" };

    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId));
      this.cleanupTimers.delete(roomId);
    }

    const existing = room.players.find((p) => p.playerId === playerId);
    if (existing) {
      const oldSocketId = existing.socketId;
      existing.socketId = socketId;
      if (name) existing.name = name;
      existing.connected = true;

      if (room.hostPlayerId === playerId || room.hostId === oldSocketId) {
        room.hostId = socketId;
        room.hostPlayerId = playerId;
      }

      if (room.turnOrder) {
        room.turnOrder = room.turnOrder.map((sId) =>
          sId === oldSocketId ? socketId : sId,
        );
      }

      if (room.readyPlayers && room.readyPlayers.has(oldSocketId)) {
        room.readyPlayers.delete(oldSocketId);
        room.readyPlayers.add(socketId);
      }

      if (room.votes && room.votes[oldSocketId]) {
        const target = room.votes[oldSocketId];
        delete room.votes[oldSocketId];
        room.votes[socketId] = target;
      }
      if (room.votes) {
        for (const [voter, target] of Object.entries(room.votes)) {
          if (target === oldSocketId) {
            room.votes[voter] = socketId;
          }
        }
      }

      if (room.mrWhiteTarget && room.mrWhiteTarget.playerId === playerId) {
        room.mrWhiteTarget.socketId = socketId;
      }

      if (room.playerHands && room.playerHands[oldSocketId]) {
        room.playerHands[socketId] = room.playerHands[oldSocketId];
        delete room.playerHands[oldSocketId];
      }
      if (room.currentTurnSocketId === oldSocketId) {
        room.currentTurnSocketId = socketId;
      }

      if (room.gameType === "drawguess") {
        if (room.currentDrawerPlayerId && room.currentDrawerPlayerId === playerId) {
          room.currentDrawerSocketId = socketId;
        }
        if (room.drawTurnOrder) {
          const idx = room.drawTurnOrder.indexOf(oldSocketId);
          if (idx !== -1) {
            room.drawTurnOrder[idx] = socketId;
          }
        }
        if (room.guessedSocketIds && room.guessedSocketIds.has(oldSocketId)) {
          room.guessedSocketIds.delete(oldSocketId);
          room.guessedSocketIds.add(socketId);
        }
        if (room.correctGuessers) {
          room.correctGuessers.forEach((g) => {
            if (g.playerId === playerId || g.socketId === oldSocketId) {
              g.socketId = socketId;
            }
          });
        }
      }

      if (room.gameType === "remi") {
        if (room.turnOrder) {
          const idx = room.turnOrder.indexOf(oldSocketId);
          if (idx !== -1) {
            room.turnOrder[idx] = socketId;
          }
        }
      }

      if (room.gameType === "uno") {
        if (room.turnOrder) {
          const idx = room.turnOrder.indexOf(oldSocketId);
          if (idx !== -1) {
            room.turnOrder[idx] = socketId;
          }
        }
      }

      const handler = getGameHandler(room.gameType);
      const reconnectData =
        handler && typeof handler.getReconnectData === "function"
          ? handler.getReconnectData(room, existing, socketId)
          : {};


      return {
        room: this.getSanitizedRoom(roomId),
        isReconnect: true,
        isSpectator: !!existing.isSpectator,
        ...reconnectData,
      };
    }

    if (room.status !== "LOBBY") {
      const newSpectator = {
        socketId,
        playerId,
        name: name || `Player ${room.players.length + 1}`,
        isAlive: false,
        isSpectator: true,
        connected: true,
        role: null,
        word: null,
      };
      room.players.push(newSpectator);

      this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));

      return {
        room: this.getSanitizedRoom(roomId),
        isReconnect: false,
        isSpectator: true,
        roleData: null,
      };
    }

    room.players.push({
      socketId,
      playerId,
      name: name || `Player ${room.players.length + 1}`,
      isAlive: true,
      isSpectator: false,
      connected: true,
      role: null,
      word: null,
    });

    if (room.gameType === "undercover" && room.settings?.autoBalance !== false) {
      const activeCount = room.players.filter((p) => p.connected).length;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings.undercoverCount = autoRoles.undercoverCount;
      room.settings.mrWhiteCount = autoRoles.mrWhiteCount;
      this.io.to(roomId).emit("room:settings_updated", room.settings);
    }

    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));

    return {
      room: this.getSanitizedRoom(roomId),
      isReconnect: false,
      isSpectator: false,
    };
  }

  addBot(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room tidak ditemukan" };
    if (room.status !== "LOBBY") return { error: "Hanya dapat menambah bot saat di Lobby" };
    if (room.hostId !== socketId) return { error: "Hanya Host yang dapat menambah bot" };

    const BOT_NAMES = [
      "Bot Budi", "Bot Siti", "Bot Agus", "Bot Dewi", "Bot Joko",
      "Bot Rina", "Bot Reza", "Bot Maya", "Bot Eko", "Bot Wati",
      "Bot Aldo", "Bot Bella", "Bot Citra", "Bot Dimas", "Bot Fajar"
    ];
    const existingBotCount = room.players.filter((p) => p.isBot).length;
    const botName = BOT_NAMES[existingBotCount % BOT_NAMES.length] || `Bot ${existingBotCount + 1}`;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    room.players.push({
      socketId: botId,
      playerId: botId,
      name: botName,
      isAlive: true,
      isSpectator: false,
      connected: true,
      isBot: true,
      role: null,
      word: null,
    });

    if (room.gameType === "undercover" && room.settings?.autoBalance !== false) {
      const activeCount = room.players.filter((p) => p.connected).length;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings = {
        ...room.settings,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
      this.io.to(roomId).emit("room:settings_updated", room.settings);
    }

    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
    return { success: true, room: this.getSanitizedRoom(roomId) };
  }

  removeBot(roomId, socketId, botSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room tidak ditemukan" };
    if (room.status !== "LOBBY") return { error: "Hanya dapat menghapus bot saat di Lobby" };
    if (room.hostId !== socketId) return { error: "Hanya Host yang dapat menghapus bot" };

    const botIdx = room.players.findIndex((p) => p.socketId === botSocketId && p.isBot);
    if (botIdx === -1) return { error: "Bot tidak ditemukan" };

    room.players.splice(botIdx, 1);

    if (room.gameType === "undercover" && room.settings?.autoBalance !== false) {
      const activeCount = room.players.filter((p) => p.connected).length;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings = {
        ...room.settings,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
      this.io.to(roomId).emit("room:settings_updated", room.settings);
    }

    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
    return { success: true, room: this.getSanitizedRoom(roomId) };
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room tidak ditemukan" };

    const gameConfig = getGameConfig(room.gameType);
    const activePlayers = room.players.filter((p) => p.connected);

    if (activePlayers.length < (gameConfig.minPlayers || 2)) {
      return {
        error: `Minimal butuh ${gameConfig.minPlayers || 2} pemain aktif untuk memulai game ${gameConfig.name}`,
      };
    }

    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.initGame === "function") {
      const result = handler.initGame(room, this.io, this);
      this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
      return result;
    }


    return { error: "Game handler tidak ditemukan" };
  }

  returnToLobby(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room tidak ditemukan" };

    if (socketId && room.hostId !== socketId) {
      return { error: "Hanya host yang dapat mengembalikan ke lobby" };
    }

    this.clearAllTimers(room);

    room.status = "LOBBY";
    room.roundNumber = 1;
    room.clues = [];
    room.votes = {};
    room.turnOrder = [];
    room.currentTurnIndex = 0;
    room.wordPair = null;
    room.mrWhiteTarget = null;
    room.lastGameOverData = null;
    room.readyPlayers = new Set();
    room.discussionReadyPlayers = new Set();
    room.activeAccusation = null;

    // Reset turn timestamps & timers
    room.currentTurnSocketId = null;
    room.currentTurnPlayerId = null;
    room.currentTurnName = null;
    room.currentTurnEndsAt = null;
    room.memorizeEndsAt = null;
    room.discussionEndsAt = null;
    room.inquiryEndsAt = null;
    room.nightEndsAt = null;
    room.dayDiscussionEndsAt = null;
    room.choiceEndsAt = null;
    room.drawEndsAt = null;
    room.spyGuessEndsAt = null;
    room.votingEndsAt = null;

    // Reset UNO & Remi states
    room.playerHands = {};
    room.discardPile = [];
    room.drawPile = [];
    room.hasDrawnThisTurn = false;
    room.drawnCardId = null;
    room.lastActionAlert = null;
    room.unoAlert = null;

    // Reset Draw & Guess states
    room.currentDrawerSocketId = null;
    room.currentDrawerPlayerId = null;
    room.currentDrawerName = null;
    room.secretWord = null;
    room.secretCategory = null;
    room.canvasStrokes = [];
    room.guessedSocketIds = new Set();
    room.correctGuessers = [];
    room.drawTurnOrder = [];
    room.currentDrawIndex = 0;

    // Reset Spyfall states
    room.secretLocation = null;
    room.allLocations = [];
    room.activeSpyGuesser = null;

    // Reset Werewolf states
    room.seerTarget = null;
    room.doctorTarget = null;
    room.wolfVotes = {};
    room.dayAnnouncement = null;

    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.role = null;
      p.word = null;
      p.location = null;
      p.isSpy = false;
      p.score = 0;
      p.calledUno = false;
    });

    if (room.gameType === "undercover" && room.settings?.autoBalance) {
      const activeCount = room.players.filter((p) => p.connected).length;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings.undercoverCount = autoRoles.undercoverCount;
      room.settings.mrWhiteCount = autoRoles.mrWhiteCount;
    }

    this.io.to(roomId).emit("room:returned_to_lobby", {
      room: this.getSanitizedRoom(roomId),
    });
    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));

    return { success: true, room: this.getSanitizedRoom(roomId) };
  }

  // Generic and Game-Specific Action Dispatchers
  markPlayerReady(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.markPlayerReady === "function") {
      handler.markPlayerReady(room, socketId, this.io, this);
    }
  }

  toggleDiscussionReady(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.toggleDiscussionReady === "function") {
      handler.toggleDiscussionReady(room, socketId, this.io, this);
    }
  }

  submitClue(roomId, socketId, text) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.submitClue === "function") {
      handler.submitClue(room, socketId, text, this.io, this);
    }
  }

  submitDiscussionMessage(roomId, socketId, text) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // In Draw & Guess, guesses are routed through the handler
    if (room.gameType === "drawguess" && room.status === "DRAWING_PHASE") {
      const handler = getGameHandler("drawguess");
      if (handler) {
        handler.submitGuess(room, socketId, text, this.io, this);
        return;
      }
    }

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return;

    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const msg = {
      senderName: player.name,
      senderId: player.playerId,
      senderSocketId: player.socketId,
      isAlive: player.isAlive,
      isSpectator: !!player.isSpectator,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    if (!room.discussionMessages) room.discussionMessages = [];
    room.discussionMessages.push(msg);

    this.io.to(roomId).emit("discussion:new_message", msg);
  }

  skipDiscussionToVoting(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.skipDiscussionToVoting === "function") {
      handler.skipDiscussionToVoting(room, socketId, this.io, this);
    }
  }

  castVote(roomId, voterSocketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.castVote === "function") {
      handler.castVote(room, voterSocketId, targetSocketId, this.io, this);
    }
  }

  submitMrWhiteGuess(roomId, guessText) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.submitMrWhiteGuess === "function") {
      handler.submitMrWhiteGuess(room, guessText, this.io, this);
    }
  }

  // Spyfall specific actions
  startSpyfallAccusation(roomId, accuserSocketId, suspectSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.startAccusation === "function") {
      handler.startAccusation(room, accuserSocketId, suspectSocketId, this.io, this);
    }
  }

  castSpyfallAccusationVote(roomId, voterSocketId, isAgree) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.castAccusationVote === "function") {
      handler.castAccusationVote(room, voterSocketId, isAgree, this.io, this);
    }
  }

  submitSpyfallLocationGuess(roomId, socketId, locationName) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.submitSpyLocationGuess === "function") {
      handler.submitSpyLocationGuess(room, socketId, locationName, this.io, this);
    }
  }

  skipSpyfallInquiry(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler(room.gameType);
    if (handler && typeof handler.skipInquiry === "function") {
      handler.skipInquiry(room, socketId, this.io, this);
    }
  }

  // Werewolf specific actions
  werewolfSeerPeek(roomId, socketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.seerPeek === "function") {
      handler.seerPeek(room, socketId, targetSocketId, this.io);
    }
  }

  werewolfDoctorProtect(roomId, socketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.doctorProtect === "function") {
      handler.doctorProtect(room, socketId, targetSocketId, this.io);
    }
  }

  werewolfVote(roomId, socketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.werewolfVote === "function") {
      handler.werewolfVote(room, socketId, targetSocketId, this.io);
    }
  }

  skipWerewolfNight(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.skipNightPhase === "function") {
      handler.skipNightPhase(room, socketId, this.io, this);
    }
  }

  skipWerewolfDay(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.skipDayDiscussion === "function") {
      handler.skipDayDiscussion(room, socketId, this.io, this);
    }
  }

  skipWerewolfVoting(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("werewolf");
    if (handler && typeof handler.skipVotingPhase === "function") {
      handler.skipVotingPhase(room, socketId, this.io, this);
    }
  }

  // Draw & Guess specific actions
  drawSelectWord(roomId, socketId, word, category) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.selectWord === "function") {
      handler.selectWord(room, socketId, word, category, this.io, this);
    }
  }

  drawStroke(roomId, socketId, strokeData) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.handleStroke === "function") {
      handler.handleStroke(room, socketId, strokeData, this.io);
    }
  }

  drawClearCanvas(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.handleClearCanvas === "function") {
      handler.handleClearCanvas(room, socketId, this.io);
    }
  }

  drawSkipTurn(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.skipTurn === "function") {
      handler.skipTurn(room, socketId, this.io, this);
    }
  }

  drawSkipSummary(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.skipSummary === "function") {
      handler.skipSummary(room, socketId, this.io, this);
    }
  }

  drawSubmitGuess(roomId, socketId, text) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("drawguess");
    if (handler && typeof handler.submitGuess === "function") {
      handler.submitGuess(room, socketId, text, this.io, this);
    }
  }

  // Remi specific actions
  remiDrawCard(roomId, socketId, source) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("remi");
    if (handler && typeof handler.drawCard === "function") {
      return handler.drawCard(room, socketId, source, this.io, this);
    }
  }

  remiDiscardCard(roomId, socketId, cardId, isDeclareWin) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("remi");
    if (handler && typeof handler.discardCard === "function") {
      return handler.discardCard(room, socketId, cardId, isDeclareWin, this.io, this);
    }
  }

  remiSyncState(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("remi");
    if (handler && typeof handler.syncState === "function") {
      return handler.syncState(room, socketId, this.io);
    }
  }

  // UNO specific actions
  unoPlayCard(roomId, socketId, cardId, chosenColor) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("uno");
    if (handler && typeof handler.playCard === "function") {
      return handler.playCard(room, socketId, cardId, chosenColor, this.io, this);
    }
  }

  unoDrawCard(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("uno");
    if (handler && typeof handler.drawCard === "function") {
      return handler.drawCard(room, socketId, this.io, this);
    }
  }

  unoPassTurn(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("uno");
    if (handler && typeof handler.passTurn === "function") {
      return handler.passTurn(room, socketId, this.io, this);
    }
  }

  unoCallUno(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("uno");
    if (handler && typeof handler.callUno === "function") {
      return handler.callUno(room, socketId, this.io);
    }
  }

  unoSyncState(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("uno");
    if (handler && typeof handler.syncState === "function") {
      return handler.syncState(room, socketId, this.io);
    }
  }

  // Impostor specific actions
  impostorUpdatePosition(roomId, socketId, posData) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.updatePosition === "function") {
      return handler.updatePosition(room, socketId, posData, this.io);
    }
  }

  impostorMoveRoom(roomId, socketId, targetRoomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.moveRoom === "function") {
      return handler.moveRoom(room, socketId, targetRoomId, this.io, this);
    }
  }

  impostorVentTravel(roomId, socketId, targetRoomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.ventTravel === "function") {
      return handler.ventTravel(room, socketId, targetRoomId, this.io, this);
    }
  }

  impostorCompleteTask(roomId, socketId, taskId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.completeTask === "function") {
      return handler.completeTask(room, socketId, taskId, this.io, this);
    }
  }

  impostorKill(roomId, socketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.killPlayer === "function") {
      return handler.killPlayer(room, socketId, targetSocketId, this.io, this);
    }
  }

  impostorSabotage(roomId, socketId, sabotageType) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.triggerSabotage === "function") {
      return handler.triggerSabotage(room, socketId, sabotageType, this.io, this);
    }
  }

  impostorFixSabotage(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.fixSabotage === "function") {
      return handler.fixSabotage(room, socketId, this.io, this);
    }
  }

  impostorReportBody(roomId, socketId, bodyId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.reportBody === "function") {
      return handler.reportBody(room, socketId, bodyId, this.io, this);
    }
  }

  impostorEmergencyMeeting(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.emergencyMeeting === "function") {
      return handler.emergencyMeeting(room, socketId, this.io, this);
    }
  }

  impostorCastVote(roomId, socketId, targetSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.castVote === "function") {
      return handler.castVote(room, socketId, targetSocketId, this.io, this);
    }
  }

  impostorSkipDiscussion(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const handler = getGameHandler("impostor");
    if (handler && typeof handler.skipDiscussionToVoting === "function") {
      return handler.skipDiscussionToVoting(room, socketId, this.io, this);
    }
  }

  addBot(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "LOBBY") return { error: "Hanya bisa menambah bot di ruang tunggu (Lobby)" };
    if (room.hostId !== socketId) return { error: "Hanya host yang dapat menambah bot" };
    if (room.players.length >= 16) return { error: "Ruangan sudah penuh (Maks. 16 pemain)" };

    const botNames = [
      "🤖 Bot Budi",
      "🤖 Bot Siti",
      "🤖 Bot Santai",
      "🤖 Bot Jagoan",
      "🤖 Bot Bayangan",
      "🤖 Bot Cerdas",
      "🤖 Bot Kancil",
      "🤖 Bot Elang",
    ];
    const existingNames = new Set(room.players.map((p) => p.name));
    const availableName = botNames.find((n) => !existingNames.has(n)) || `🤖 Bot ${room.players.length + 1}`;

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const botPlayer = {
      socketId: botId,
      playerId: botId,
      name: availableName,
      isAlive: true,
      connected: true,
      role: null,
      word: null,
      isBot: true,
    };

    room.players.push(botPlayer);

    if (room.gameType === "undercover") {
      const activeCount = room.players.filter((p) => p.connected).length;
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      room.settings = {
        ...room.settings,
        autoBalance: true,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      };
      this.io.to(roomId).emit("room:settings_updated", room.settings);
    }

    this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
    return { success: true };
  }

  removeBot(roomId, socketId, botSocketId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "LOBBY") return { error: "Hanya bisa menghapus bot di ruang tunggu" };
    if (room.hostId !== socketId) return { error: "Hanya host yang dapat menghapus bot" };

    const index = room.players.findIndex((p) => p.socketId === botSocketId && p.isBot);
    if (index !== -1) {
      room.players.splice(index, 1);

      if (room.gameType === "undercover") {
        const activeCount = room.players.filter((p) => p.connected).length || 3;
        const autoRoles = calculateAutoRoleDistribution(activeCount);
        room.settings = {
          ...room.settings,
          autoBalance: true,
          undercoverCount: autoRoles.undercoverCount,
          mrWhiteCount: autoRoles.mrWhiteCount,
        };
        this.io.to(roomId).emit("room:settings_updated", room.settings);
      }

      this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
      return { success: true };
    }
    return { error: "Bot tidak ditemukan" };
  }



  handleDisconnect(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        player.connected = false;

        const isHostDisconnected = room.hostId === socketId;
        const connectedPlayers = room.players.filter((p) => p.connected);

        if (connectedPlayers.length === 0) {
          this.scheduleRoomCleanup(roomId);
        } else if (isHostDisconnected) {
          const nextHost = connectedPlayers[0];
          room.hostId = nextHost.socketId;
          room.hostPlayerId = nextHost.playerId;
          this.io.to(roomId).emit("host:migrated", {
            newHostId: nextHost.socketId,
            newHostPlayerId: nextHost.playerId,
            newHostName: nextHost.name,
          });
        }

        if (room.gameType === "drawguess") {
          const handler = getGameHandler("drawguess");
          if (handler && typeof handler.onPlayerDisconnect === "function") {
            handler.onPlayerDisconnect(room, socketId, this.io, this);
          }
        }

        if (room.gameType === "remi") {
          const handler = getGameHandler("remi");
          if (handler && typeof handler.onPlayerDisconnect === "function") {
            handler.onPlayerDisconnect(room, socketId, this.io, this);
          }
        }

        if (room.gameType === "uno") {
          const handler = getGameHandler("uno");
          if (handler && typeof handler.onPlayerDisconnect === "function") {
            handler.onPlayerDisconnect(room, socketId, this.io, this);
          }
        }

        this.io.to(roomId).emit("room:updated", this.getSanitizedRoom(roomId));
        break;
      }
    }
  }

  scheduleRoomCleanup(roomId) {
    if (this.cleanupTimers.has(roomId)) {
      clearTimeout(this.cleanupTimers.get(roomId));
    }
    const timeout = setTimeout(() => {
      const room = this.rooms.get(roomId);
      if (room) {
        this.clearAllTimers(room);
        this.rooms.delete(roomId);
      }
      this.cleanupTimers.delete(roomId);
    }, 5 * 60 * 1000);
    this.cleanupTimers.set(roomId, timeout);
  }

  clearAllTimers(room) {
    if (!room) return;
    if (room.turnTimerTimeout) {
      clearTimeout(room.turnTimerTimeout);
      room.turnTimerTimeout = null;
    }
    if (room.memorizeTimerTimeout) {
      clearTimeout(room.memorizeTimerTimeout);
      room.memorizeTimerTimeout = null;
    }
    if (room.discussionTimerTimeout) {
      clearTimeout(room.discussionTimerTimeout);
      room.discussionTimerTimeout = null;
    }
    if (room.votingTimerTimeout) {
      clearTimeout(room.votingTimerTimeout);
      room.votingTimerTimeout = null;
    }
    if (room.voteResultTimerTimeout) {
      clearTimeout(room.voteResultTimerTimeout);
      room.voteResultTimerTimeout = null;
    }
    if (room.mrWhiteTimerTimeout) {
      clearTimeout(room.mrWhiteTimerTimeout);
      room.mrWhiteTimerTimeout = null;
    }
    if (room.inquiryTimerTimeout) {
      clearTimeout(room.inquiryTimerTimeout);
      room.inquiryTimerTimeout = null;
    }
    if (room.accusationTimerTimeout) {
      clearTimeout(room.accusationTimerTimeout);
      room.accusationTimerTimeout = null;
    }
    if (room.spyGuessTimerTimeout) {
      clearTimeout(room.spyGuessTimerTimeout);
      room.spyGuessTimerTimeout = null;
    }
    if (room.nightTimerTimeout) {
      clearTimeout(room.nightTimerTimeout);
      room.nightTimerTimeout = null;
    }
    if (room.dayTimerTimeout) {
      clearTimeout(room.dayTimerTimeout);
      room.dayTimerTimeout = null;
    }
    if (room.choiceTimerTimeout) {
      clearTimeout(room.choiceTimerTimeout);
      room.choiceTimerTimeout = null;
    }
    if (room.drawTimerTimeout) {
      clearTimeout(room.drawTimerTimeout);
      room.drawTimerTimeout = null;
    }
    if (room.summaryTimerTimeout) {
      clearTimeout(room.summaryTimerTimeout);
      room.summaryTimerTimeout = null;
    }
    if (room.botTimerTimeout) {
      clearTimeout(room.botTimerTimeout);
      room.botTimerTimeout = null;
    }
    if (room.sabotageTimerTimeout) {
      clearTimeout(room.sabotageTimerTimeout);
      room.sabotageTimerTimeout = null;
    }
    if (room.botLoopInterval) {
      clearInterval(room.botLoopInterval);
      room.botLoopInterval = null;
    }
  }

  getSanitizedRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const gameConfig = getGameConfig(room.gameType);

    return {
      id: room.id,
      hostId: room.hostId,
      hostPlayerId: room.hostPlayerId,
      gameType: room.gameType || "undercover",
      gameName: gameConfig.name,
      gameCategory: gameConfig.category,
      minPlayers: gameConfig.minPlayers || 2,
      status: room.status,
      settings: room.settings,
      currentTurnSocketId: room.currentTurnSocketId || null,
      currentTurnPlayerId: room.currentTurnPlayerId || null,
      currentTurnName: room.currentTurnName || null,
      currentTurnEndsAt: room.currentTurnEndsAt || null,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        isAlive: p.isAlive,
        isGhost: !!p.isGhost,
        isBot: !!p.isBot,
        currentRoom: p.currentRoom || null,
        x: typeof p.x === "number" ? p.x : 700,
        y: typeof p.y === "number" ? p.y : 220,
        facingLeft: !!p.facingLeft,
        isMoving: !!p.isMoving,
        isSpectator: !!p.isSpectator,
        connected: p.connected,
      })),
      roundNumber: room.roundNumber,
      clues: room.clues || [],
      discussionMessages: room.discussionMessages || [],
      readyCount: room.readyPlayers ? room.readyPlayers.size : 0,
      activeAccusation: room.activeAccusation
        ? {
            accuserName: room.activeAccusation.accuserName,
            accuserSocketId: room.activeAccusation.accuserSocketId,
            suspectName: room.activeAccusation.suspectName,
            suspectSocketId: room.activeAccusation.suspectSocketId,
            endsAt: room.activeAccusation.endsAt,
            votes: room.activeAccusation.votes || {},
            votedCount: Object.keys(room.activeAccusation.votes || {}).length,
            agreeCount: Object.values(room.activeAccusation.votes || {}).filter(Boolean).length,
            totalVoters: room.players.filter(
              (p) => p.connected && p.socketId !== room.activeAccusation.suspectSocketId,
            ).length,
          }
        : null,
      drawTurnInfo: room.gameType === "drawguess"
        ? {
            drawerSocketId: room.currentDrawerSocketId,
            drawerPlayerId: room.currentDrawerPlayerId,
            drawerName: room.currentDrawerName,
            category: room.currentWordCategory,
            wordLength: room.currentWord ? room.currentWord.length : 0,
            correctGuessers: room.correctGuessers || [],
            guessedCount: room.guessedSocketIds ? room.guessedSocketIds.size : 0,
            totalGuessers: room.players.filter(
              (p) =>
                p.connected &&
                !p.isSpectator &&
                p.socketId !== room.currentDrawerSocketId &&
                (room.currentDrawerPlayerId ? p.playerId !== room.currentDrawerPlayerId : true),
            ).length,
            drawEndsAt: room.drawEndsAt,
            choiceEndsAt: room.choiceEndsAt,
            scores: room.scores || {},
          }
        : null,
      impostorInfo: room.gameType === "impostor"
        ? {
            deadBodies: room.deadBodies || [],
            activeSabotage: room.activeSabotage || null,
            activeMeeting: room.activeMeeting || null,
            totalTasks: room.totalShipTasks || 0,
            completedTasks: room.completedShipTasks || 0,
            lastEjection: room.lastEjection || null,
          }
        : null,
    };
  }
}
