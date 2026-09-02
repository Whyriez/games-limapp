import assert from "assert";
import { GameManager } from "./gameManager.js";
import { getGameHandler } from "./games/registry.js";

class MockIO {
  constructor() {
    this.emits = [];
  }
  to(target) {
    return {
      emit: (event, data) => {
        this.emits.push({ target, event, data });
      },
    };
  }
  emit(event, data) {
    this.emits.push({ target: "all", event, data });
  }
}

console.log("▶ Running Draw & Guess (Tebak Gambar) Auto-Advance Tests...");

const mockIO = new MockIO();
const gm = new GameManager(mockIO);

// 1. Create Room & Select DrawGuess
gm.createRoom("DRAW_ROOM", "s_p1", "Player 1", "u_p1");
gm.changeGameType("DRAW_ROOM", "s_p1", "drawguess");
gm.joinRoom("DRAW_ROOM", "s_p2", "Player 2", "u_p2");
gm.joinRoom("DRAW_ROOM", "s_p3", "Player 3", "u_p3");
const room = gm.rooms.get("DRAW_ROOM");

assert.strictEqual(room.gameType, "drawguess");
assert.strictEqual(room.players.length, 3);
console.log("✔ Room setup with 3 players passed");

// 2. Start Game -> Word Choice Phase
const startRes = gm.startGame("DRAW_ROOM");
assert.strictEqual(room.status, "WORD_CHOICE_PHASE");
const drawerSocketId = room.currentDrawerSocketId;
const drawer = room.players.find((p) => p.socketId === drawerSocketId);
const guessers = room.players.filter((p) => p.socketId !== drawerSocketId);
assert.strictEqual(guessers.length, 2);
console.log(`✔ Game started in WORD_CHOICE_PHASE with drawer: ${drawer.name}`);

// 3. Drawer Selects Word -> DRAWING_PHASE
gm.drawSelectWord("DRAW_ROOM", drawerSocketId, "Kucing", "Hewan");
assert.strictEqual(room.status, "DRAWING_PHASE");
assert.strictEqual(room.currentWord, "Kucing");
console.log("✔ Word selected, entered DRAWING_PHASE");

// 4. First Guesser submits correct guess
const guesser1 = guessers[0];
const guesser2 = guessers[1];

gm.drawSubmitGuess("DRAW_ROOM", guesser1.socketId, "kucing");
assert.strictEqual(room.status, "DRAWING_PHASE", "Status must still be DRAWING_PHASE while other guesser hasn't guessed");
assert.strictEqual(room.guessedSocketIds.has(guesser1.socketId), true);
assert.strictEqual(room.scores[guesser1.playerId || guesser1.socketId] > 0, true);
console.log("✔ First guesser guessed correctly, waiting for second guesser");

// 5. Second (and all remaining) Guesser submits correct guess -> INSTANT AUTO-ADVANCE!
gm.drawSubmitGuess("DRAW_ROOM", guesser2.socketId, "  Kucing!  ");
assert.strictEqual(
  room.status,
  "ROUND_SUMMARY_PHASE",
  "Status must INSTANTLY become ROUND_SUMMARY_PHASE when all guessers have guessed without waiting for timer!"
);
console.log("✔ All guessers guessed -> INSTANT auto-transition to ROUND_SUMMARY_PHASE passed!");

// 6. Host skips summary -> Advances to next turn
gm.drawSkipSummary("DRAW_ROOM", "s_p1");
assert.strictEqual(
  room.status,
  "WORD_CHOICE_PHASE",
  "Skipping summary must advance immediately to next turn WORD_CHOICE_PHASE"
);
console.log("✔ Skip summary passed");

// 7. Test with Spectator in Room (Spectators should not block auto-advance)
const drawer2SocketId = room.currentDrawerSocketId;
gm.drawSelectWord("DRAW_ROOM", drawer2SocketId, "Pesawat", "Transportasi");
assert.strictEqual(room.status, "DRAWING_PHASE");

// Spectator joins mid-game
gm.joinRoom("DRAW_ROOM", "s_spec", "Spectator Alex", "u_spec");
const activeGuessers = room.players.filter(
  (p) => p.connected && !p.isSpectator && p.socketId !== drawer2SocketId
);
assert.strictEqual(activeGuessers.length, 2);

// Both active non-spectators guess
activeGuessers.forEach((ag) => {
  gm.drawSubmitGuess("DRAW_ROOM", ag.socketId, "pesawat");
});

assert.strictEqual(
  room.status,
  "ROUND_SUMMARY_PHASE",
  "Spectator presence must not block instant auto-advance when all active guessers finish!"
);
console.log("✔ Spectator exclusion in guess counting passed!");

// 8. Test Disconnection during Drawing Phase
gm.drawSkipSummary("DRAW_ROOM", "s_p1");
const drawer3SocketId = room.currentDrawerSocketId;
gm.drawSelectWord("DRAW_ROOM", drawer3SocketId, "Gitar", "Benda");
assert.strictEqual(room.status, "DRAWING_PHASE");

const activeG3 = room.players.filter(
  (p) => p.connected && !p.isSpectator && p.socketId !== drawer3SocketId
);
// One guesser guesses
gm.drawSubmitGuess("DRAW_ROOM", activeG3[0].socketId, "gitar");
assert.strictEqual(room.status, "DRAWING_PHASE");

// The other guesser disconnects
gm.handleDisconnect(activeG3[1].socketId);
assert.strictEqual(
  room.status,
  "ROUND_SUMMARY_PHASE",
  "Disconnecting remaining guesser must trigger instant advance if remaining connected guessers all guessed!"
);
console.log("✔ Disconnection auto-advance check passed!");

// Clean up
gm.clearAllTimers(room);

console.log("\n🎉 ALL TEBAK GAMBAR AUTO-ADVANCE TESTS PASSED WITH 100% SUCCESS!");
