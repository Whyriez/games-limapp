import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import {
  GameManager,
  getWordBankList,
  addWordPair,
  updateWordPair,
  deleteWordPair,
  bulkImportWordBank,
} from "./gameManager.js";
import { getAvailableGames } from "./games/registry.js";
import {
  getLocationList,
  addLocation,
  updateLocation,
  deleteLocation,
  bulkImportLocations,
} from "./games/spyfall/index.js";
import {
  getDrawWordsList,
  addDrawWord,
  updateDrawWord,
  deleteDrawWord,
  bulkImportDrawWords,
} from "./games/drawguess/index.js";
import {
  generateAIWords,
  generateAISpyfallLocations,
  generateAIDrawWords,
} from "./aiWordGenerator.js";
import { getLeaderboard, resetLeaderboard } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  pingInterval: 20000,
  pingTimeout: 10000,
});

const gameManager = new GameManager(io);

// REST API for Available Games List
app.get("/api/games", (req, res) => {
  res.json(getAvailableGames());
});

// REST API for Leaderboard
app.get("/api/leaderboard", (req, res) => {
  res.json(getLeaderboard());
});

app.post("/api/leaderboard/reset", (req, res) => {
  const result = resetLeaderboard();
  io.emit("leaderboard:reset", []);
  res.json(result);
});

// ==========================================
// 1. UNDERCOVER WORD BANK APIS
// ==========================================
app.get("/api/words", (req, res) => {
  const words = getWordBankList();
  const search = (req.query.search || "").toLowerCase().trim();
  const category = (req.query.category || "").toLowerCase().trim();

  let filtered = words;
  if (category && category !== "semua") {
    filtered = filtered.filter((w) => w.category.toLowerCase() === category);
  }
  if (search) {
    filtered = filtered.filter(
      (w) =>
        w.civilian.toLowerCase().includes(search) ||
        w.undercover.toLowerCase().includes(search) ||
        w.category.toLowerCase().includes(search),
    );
  }

  const categories = Array.from(new Set(words.map((w) => w.category)));

  res.json({
    total: words.length,
    filteredCount: filtered.length,
    categories,
    words: filtered,
  });
});

app.post("/api/words", (req, res) => {
  const { category, civilian, undercover } = req.body;
  const result = addWordPair({ category, civilian, undercover });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.put("/api/words/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { category, civilian, undercover } = req.body;
  const result = updateWordPair(index, { category, civilian, undercover });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete("/api/words/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const result = deleteWordPair(index);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/words/bulk", (req, res) => {
  const { words } = req.body;
  const result = bulkImportWordBank(words);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/words/ai-generate", async (req, res) => {
  const { count, category, themeHint } = req.body;
  try {
    const result = await generateAIWords({ count, category, themeHint });
    res.json(result);
  } catch (err) {
    console.error("AI Generation Error:", err);
    res.status(500).json({ error: err.message || "Gagal melakukan generate kata dengan AI" });
  }
});

app.post("/api/words/ai-confirm", (req, res) => {
  const { candidates } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Daftar kandidat kata kosong" });
  }

  const result = bulkImportWordBank(candidates);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json({
    success: true,
    insertedCount: result.importedCount,
    total: result.total,
    message: `Berhasil menyimpan ${result.importedCount} pasangan kata baru tanpa duplikat!`,
  });
});

// ==========================================
// 2. SPYFALL LOCATIONS & ROLES APIS
// ==========================================
app.get("/api/spyfall/locations", (req, res) => {
  const locations = getLocationList();
  const search = (req.query.search || "").toLowerCase().trim();
  const category = (req.query.category || "").toLowerCase().trim();

  let filtered = locations;
  if (category && category !== "semua") {
    filtered = filtered.filter((l) => l.category && l.category.toLowerCase() === category);
  }
  if (search) {
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(search) ||
        (l.category && l.category.toLowerCase().includes(search)) ||
        (l.roles && l.roles.some((r) => r.toLowerCase().includes(search))),
    );
  }

  const categories = Array.from(new Set(locations.map((l) => l.category).filter(Boolean)));

  res.json({
    total: locations.length,
    filteredCount: filtered.length,
    categories,
    locations: filtered,
  });
});

app.post("/api/spyfall/locations", (req, res) => {
  const { name, category, roles } = req.body;
  const result = addLocation({ name, category, roles });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.put("/api/spyfall/locations/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, roles } = req.body;
  const result = updateLocation(id, { name, category, roles });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete("/api/spyfall/locations/:id", (req, res) => {
  const { id } = req.params;
  const result = deleteLocation(id);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/spyfall/locations/bulk", (req, res) => {
  const { locations } = req.body;
  const result = bulkImportLocations(locations);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/spyfall/locations/ai-generate", async (req, res) => {
  const { count, category, themeHint } = req.body;
  try {
    const result = await generateAISpyfallLocations({ count, category, themeHint });
    res.json(result);
  } catch (err) {
    console.error("Spyfall AI Error:", err);
    res.status(500).json({ error: err.message || "Gagal melakukan generate lokasi dengan AI" });
  }
});

app.post("/api/spyfall/locations/ai-confirm", (req, res) => {
  const { candidates } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Daftar kandidat lokasi kosong" });
  }

  const result = bulkImportLocations(candidates);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json({
    success: true,
    insertedCount: result.importedCount,
    total: result.totalCount,
    message: `Berhasil menambahkan ${result.importedCount} lokasi baru!`,
  });
});

// ==========================================
// 3. DRAW & GUESS (TEBAK GAMBAR) APIS
// ==========================================
app.get("/api/drawguess/words", (req, res) => {
  const words = getDrawWordsList();
  const search = (req.query.search || "").toLowerCase().trim();
  const category = (req.query.category || "").toLowerCase().trim();

  let filtered = words;
  if (category && category !== "semua") {
    filtered = filtered.filter((w) => w.category && w.category.toLowerCase() === category);
  }
  if (search) {
    filtered = filtered.filter(
      (w) =>
        w.word.toLowerCase().includes(search) ||
        (w.category && w.category.toLowerCase().includes(search)) ||
        (w.difficulty && w.difficulty.toLowerCase().includes(search)),
    );
  }

  const categories = Array.from(new Set(words.map((w) => w.category).filter(Boolean)));

  res.json({
    total: words.length,
    filteredCount: filtered.length,
    categories,
    words: filtered,
  });
});

app.post("/api/drawguess/words", (req, res) => {
  const { word, category, difficulty } = req.body;
  const result = addDrawWord({ word, category, difficulty });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.put("/api/drawguess/words/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { word, category, difficulty } = req.body;
  const result = updateDrawWord(index, { word, category, difficulty });
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete("/api/drawguess/words/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  const result = deleteDrawWord(index);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/drawguess/words/bulk", (req, res) => {
  const { words } = req.body;
  const result = bulkImportDrawWords(words);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.post("/api/drawguess/words/ai-generate", async (req, res) => {
  const { count, category, difficulty, themeHint } = req.body;
  try {
    const result = await generateAIDrawWords({ count, category, difficulty, themeHint });
    res.json(result);
  } catch (err) {
    console.error("Draw & Guess AI Error:", err);
    res.status(500).json({ error: err.message || "Gagal melakukan generate kata gambar dengan AI" });
  }
});

app.post("/api/drawguess/words/ai-confirm", (req, res) => {
  const { candidates } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Daftar kandidat kata kosong" });
  }

  const result = bulkImportDrawWords(candidates);
  if (result.error) {
    return res.status(400).json(result);
  }
  res.json({
    success: true,
    insertedCount: result.importedCount,
    total: result.totalCount,
    message: `Berhasil menambahkan ${result.importedCount} kata gambar baru!`,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Helper to determine acting player ID (supports dev puppet switcher for bots)
function getActingSocketId(socket, roomId, asSocketId) {
  if (!asSocketId || asSocketId === socket.id) {
    return socket.id;
  }
  const room = gameManager.rooms.get(roomId);
  if (!room) return socket.id;

  const isDev = process.env.NODE_ENV !== "production" || process.env.DEV_MODE === "true";
  const isHost = room.hostId === socket.id;
  const targetPlayer = room.players.find((p) => p.socketId === asSocketId);

  if ((isHost || isDev) && targetPlayer && targetPlayer.isBot) {
    return asSocketId;
  }
  return socket.id;
}

io.on("connection", (socket) => {
  // Create Room
  socket.on("room:create", ({ roomId, name, playerId, gameType }) => {
    socket.join(roomId);
    const room = gameManager.createRoom(roomId, socket.id, name, playerId, gameType || "undercover");
    io.to(roomId).emit("room:updated", room);
  });

  // Join or Reconnect Room
  socket.on("room:join", ({ roomId, name, playerId }) => {
    const result = gameManager.joinRoom(roomId, socket.id, name, playerId);
    if (result.error) {
      socket.emit("error:message", result.error);
    } else {
      socket.join(roomId);

      if (result.isReconnect) {
        socket.emit("session:restored", result);
        io.to(roomId).emit("room:updated", result.room);
      } else {
        io.to(roomId).emit("room:updated", result.room);
      }
    }
  });

  // Change Game in Lobby (Host only)
  socket.on("room:change_game", ({ roomId, gameType }) => {
    const result = gameManager.changeGameType(roomId, socket.id, gameType);
    if (result.error) {
      socket.emit("error:message", result.error);
    }
  });

  // Update Room Settings
  socket.on("room:update_settings", ({ roomId, settings }) => {
    gameManager.updateRoomSettings(roomId, socket.id, settings);
  });

  // Bot Management (Host only)
  socket.on("room:add_bot", ({ roomId }) => {
    const result = gameManager.addBot(roomId, socket.id);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  // Batch Add Bots (Dev Mode or Host Quick Setup)
  socket.on("room:add_bots_batch", ({ roomId, count = 3 }) => {
    const result = gameManager.addBot(roomId, socket.id, count);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("room:remove_bot", ({ roomId, botSocketId }) => {
    const result = gameManager.removeBot(roomId, socket.id, botSocketId);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("room:remove_all_bots", ({ roomId }) => {
    const result = gameManager.removeAllBots(roomId, socket.id);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  // Dev Puppet States Sync
  socket.on("dev:get_puppet_states", ({ roomId }) => {
    const states = gameManager.getDevPuppetStates(roomId, socket.id);
    if (states) {
      socket.emit("dev:puppet_sync", states);
    }
  });

  // Start Game
  socket.on("game:start", ({ roomId }) => {
    const result = gameManager.startGame(roomId);
    if (result.error) {
      socket.emit("error:message", result.error);
    }
  });

  // Return to Lobby
  socket.on("room:return_lobby", ({ roomId }) => {
    const result = gameManager.returnToLobby(roomId, socket.id);
    if (result.error) {
      socket.emit("error:message", result.error);
    }
  });

  // Player Ready Confirmation in MEMORIZE_PHASE
  socket.on("player:ready", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.markPlayerReady(roomId, actingId);
  });

  // Player Ready Confirmation in DISCUSSION_PHASE
  socket.on("discussion:ready_toggle", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.toggleDiscussionReady(roomId, actingId);
  });

  // Submit Official Turn Clue (Undercover)
  socket.on("clue:send", ({ roomId, text, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.submitClue(roomId, actingId, text);
  });

  // Submit Free Discussion Chat Message
  socket.on("discussion:send", ({ roomId, text, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.submitDiscussionMessage(roomId, actingId, text);
  });

  // Host Skip Discussion to Voting
  socket.on("discussion:skip", ({ roomId }) => {
    gameManager.skipDiscussionToVoting(roomId, socket.id);
  });

  // Submit Vote
  socket.on("vote:submit", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.castVote(roomId, actingId, targetSocketId);
  });

  // Submit Mr. White Guess (Undercover)
  socket.on("mrwhite:guess_submit", ({ roomId, guessText, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.submitMrWhiteGuess(roomId, guessText);
  });

  // Spyfall Actions
  socket.on("spyfall:accuse", ({ roomId, targetSocketId }) => {
    gameManager.startSpyfallAccusation(roomId, socket.id, targetSocketId);
  });

  socket.on("spyfall:vote", ({ roomId, isAgree, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.castSpyfallAccusationVote(roomId, actingId, isAgree);
  });

  socket.on("spyfall:spy_guess", ({ roomId, locationName, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.submitSpyfallLocationGuess(roomId, actingId, locationName);
  });

  socket.on("spyfall:skip_inquiry", ({ roomId }) => {
    gameManager.skipSpyfallInquiry(roomId, socket.id);
  });

  // Werewolf Actions
  socket.on("werewolf:seer_peek", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.werewolfSeerPeek(roomId, actingId, targetSocketId);
  });

  socket.on("werewolf:doctor_protect", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.werewolfDoctorProtect(roomId, actingId, targetSocketId);
  });

  socket.on("werewolf:wolf_vote", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.werewolfVote(roomId, actingId, targetSocketId);
  });

  socket.on("werewolf:skip_night", ({ roomId }) => {
    gameManager.skipWerewolfNight(roomId, socket.id);
  });

  socket.on("werewolf:skip_day", ({ roomId }) => {
    gameManager.skipWerewolfDay(roomId, socket.id);
  });

  socket.on("werewolf:skip_voting", ({ roomId }) => {
    gameManager.skipWerewolfVoting(roomId, socket.id);
  });

  // Draw & Guess Actions
  socket.on("draw:select_word", ({ roomId, word, category, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.drawSelectWord(roomId, actingId, word, category);
  });

  socket.on("draw:stroke", ({ roomId, strokeData, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.drawStroke(roomId, actingId, strokeData);
  });

  socket.on("draw:clear", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.drawClearCanvas(roomId, actingId);
  });

  socket.on("draw:skip_turn", ({ roomId }) => {
    gameManager.drawSkipTurn(roomId, socket.id);
  });

  socket.on("draw:skip_summary", ({ roomId }) => {
    gameManager.drawSkipSummary(roomId, socket.id);
  });

  socket.on("draw:guess", ({ roomId, text, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    gameManager.submitDiscussionMessage(roomId, actingId, text);
  });

  // Remi Actions
  socket.on("remi:draw_card", ({ roomId, source, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.remiDrawCard(roomId, actingId, source);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("remi:discard_card", ({ roomId, cardId, isDeclareWin, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.remiDiscardCard(roomId, actingId, cardId, isDeclareWin);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("remi:sync_state", ({ roomId }) => {
    gameManager.remiSyncState(roomId, socket.id);
  });

  // UNO Actions
  socket.on("uno:play_card", ({ roomId, cardId, chosenColor, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.unoPlayCard(roomId, actingId, cardId, chosenColor);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("uno:draw_card", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.unoDrawCard(roomId, actingId);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("uno:pass_turn", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.unoPassTurn(roomId, actingId);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("uno:call_uno", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.unoCallUno(roomId, actingId);
    if (result && result.error) {
      socket.emit("error:message", result.error);
    }
  });

  socket.on("uno:sync_state", ({ roomId }) => {
    gameManager.unoSyncState(roomId, socket.id);
  });

  // Impostor Actions
  socket.on("impostor:pos", (posData) => {
    if (!posData || !posData.roomId) return;
    const actingId = posData.socketId || socket.id;
    gameManager.impostorUpdatePosition(posData.roomId, actingId, posData);
  });

  socket.on("impostor:move", ({ roomId, targetRoomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorMoveRoom(roomId, actingId, targetRoomId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:vent", ({ roomId, targetRoomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorVentTravel(roomId, actingId, targetRoomId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:task_complete", ({ roomId, taskId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorCompleteTask(roomId, actingId, taskId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:kill", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorKill(roomId, actingId, targetSocketId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:sabotage", ({ roomId, sabotageType, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorSabotage(roomId, actingId, sabotageType);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:fix_sabotage", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorFixSabotage(roomId, actingId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:report", ({ roomId, bodyId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorReportBody(roomId, actingId, bodyId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:emergency", ({ roomId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorEmergencyMeeting(roomId, actingId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:vote", ({ roomId, targetSocketId, asSocketId }) => {
    const actingId = getActingSocketId(socket, roomId, asSocketId);
    const result = gameManager.impostorCastVote(roomId, actingId, targetSocketId);
    if (result && result.error) socket.emit("error:message", result.error);
  });

  socket.on("impostor:skip_discussion", ({ roomId }) => {
    gameManager.impostorSkipDiscussion(roomId, socket.id);
  });


  // Admin Reset Leaderboard / Podium
  socket.on("leaderboard:reset", () => {
    resetLeaderboard();
    io.emit("leaderboard:reset", []);
  });

  // Disconnect Handler
  socket.on("disconnect", () => {
    gameManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Party Game Server running on http://localhost:${PORT}`);
});
