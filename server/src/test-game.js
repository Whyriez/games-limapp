import assert from "assert";
import { GameManager, normalizeWord } from "./gameManager.js";
import { getGameHandler } from "./games/registry.js";

console.log("▶ Running Undercover Game Engine Tests (with Customizable Roles & Discussion Ready)...");

// 1. Test String Normalization for Mr. White
assert.strictEqual(normalizeWord("Nasi Uduk"), "nasiuduk");
assert.strictEqual(normalizeWord("  Nasi  Uduk!  "), "nasiuduk");
assert.strictEqual(normalizeWord("Kopi-Luwak"), "kopiluwak");
assert.strictEqual(normalizeWord("Mie Sedaap"), "miesedaap");
assert.strictEqual(normalizeWord("Cendol..."), "cendol");
console.log("✔ String Normalization passed");

// Mock Socket.io
class MockIO {
  constructor() {
    this.emits = [];
    this.rooms = new Map();
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

const mockIO = new MockIO();
const gm = new GameManager(mockIO);

// 2. Test Room Creation
const room1 = gm.createRoom("ROOM1", "sock_host", "Budi Host", "usr_1");
assert.strictEqual(room1.id, "ROOM1");
assert.strictEqual(room1.players.length, 1);
assert.strictEqual(room1.hostId, "sock_host");
assert.strictEqual(room1.settings.undercoverCount, 1);
assert.strictEqual(room1.settings.mrWhiteCount, 0);
console.log("✔ Room Creation & Default Settings passed");

// 3. Test Room Joining (4 players)
gm.joinRoom("ROOM1", "sock_p2", "Siti Backend", "usr_2");
gm.joinRoom("ROOM1", "sock_p3", "Joko Frontend", "usr_3");
gm.joinRoom("ROOM1", "sock_p4", "Rina DevOps", "usr_4");
assert.strictEqual(gm.rooms.get("ROOM1").players.length, 4);
console.log("✔ Room Joining passed");

// 4. Test Custom Role Settings (1 Undercover, 1 Mr. White -> 2 Civilians)
gm.updateRoomSettings("ROOM1", "sock_host", { autoBalance: false, undercoverCount: 1, mrWhiteCount: 1 });
const r1 = gm.rooms.get("ROOM1");
assert.strictEqual(r1.settings.undercoverCount, 1);
assert.strictEqual(r1.settings.mrWhiteCount, 1);
console.log("✔ Custom Role Settings Update passed");

// 5. Test Game Start & Custom Role Allocation
gm.startGame("ROOM1");
const activeRoom = gm.rooms.get("ROOM1");
assert.strictEqual(activeRoom.status, "MEMORIZE_PHASE");

const undercovers = activeRoom.players.filter((p) => p.role === "UNDERCOVER");
const mrWhites = activeRoom.players.filter((p) => p.role === "MR_WHITE");
const civilians = activeRoom.players.filter((p) => p.role === "CIVILIAN");

assert.strictEqual(undercovers.length, 1, "Must have exactly 1 Undercover");
assert.strictEqual(mrWhites.length, 1, "Must have exactly 1 Mr. White");
assert.strictEqual(civilians.length, 2, "Must have exactly 2 Civilians");
console.log("✔ Custom Role Allocation (1 Undercover, 1 Mr. White, 2 Civilians) passed");

// 6. Test Ready-Up by all players triggering instant CLUE_PHASE
gm.markPlayerReady("ROOM1", "sock_host");
gm.markPlayerReady("ROOM1", "sock_p2");
gm.markPlayerReady("ROOM1", "sock_p3");
gm.markPlayerReady("ROOM1", "sock_p4");
assert.strictEqual(activeRoom.status, "CLUE_PHASE", "All players ready must start CLUE_PHASE");
console.log("✔ Ready-Up instant start passed");

// 7. Test Clue Submission & Discussion Phase Transition
const p1Socket = activeRoom.turnOrder[0];
const p2Socket = activeRoom.turnOrder[1];
const p3Socket = activeRoom.turnOrder[2];
const p4Socket = activeRoom.turnOrder[3];

gm.submitClue("ROOM1", p1Socket, "Warna hitam pahit");
gm.submitClue("ROOM1", p2Socket, "Ada kafein");
gm.submitClue("ROOM1", p3Socket, "Enak diminum pagi");
gm.submitClue("ROOM1", p4Socket, "Diseduh air panas");

assert.strictEqual(activeRoom.clues.length, 4);
assert.strictEqual(activeRoom.status, "DISCUSSION_PHASE");
assert.strictEqual(activeRoom.discussionTimeLimit, 120, "Discussion phase must have 120 seconds default duration");
console.log("✔ Clue Round to Discussion Phase (120s timer) transition passed");

// 8. Test Discussion 'Sudah Fix / Ready' Feature (Instant Voting Transition when all ready)
gm.toggleDiscussionReady("ROOM1", p1Socket);
assert.strictEqual(activeRoom.discussionReadyPlayers.size, 1);
assert.strictEqual(activeRoom.status, "DISCUSSION_PHASE");

gm.toggleDiscussionReady("ROOM1", p2Socket);
gm.toggleDiscussionReady("ROOM1", p3Socket);
assert.strictEqual(activeRoom.discussionReadyPlayers.size, 3);
assert.strictEqual(activeRoom.status, "DISCUSSION_PHASE");

// 4th player confirms ready -> instant auto-transition to VOTING_PHASE!
gm.toggleDiscussionReady("ROOM1", p4Socket);
assert.strictEqual(activeRoom.status, "VOTING_PHASE", "When all alive players click Fix, status must instantly switch to VOTING_PHASE");
console.log("✔ Discussion 'Sudah Fix' instant voting auto-transition passed");

// 9. Test Self-Voting Prohibition
gm.castVote("ROOM1", p1Socket, p1Socket); // p1 tries to vote for p1
assert.strictEqual(activeRoom.votes[p1Socket], undefined, "Self-voting must be blocked and ignored");
console.log("✔ Self-Voting Block passed");

// 11. Test Voting Elimination & Game Over transition
const room2 = gm.createRoom("ROOM2", "s_host", "Host", "u_1");
gm.joinRoom("ROOM2", "s_p2", "Player 2", "u_2");
gm.joinRoom("ROOM2", "s_p3", "Player 3", "u_3");
gm.updateRoomSettings("ROOM2", "s_host", { undercoverCount: 1, mrWhiteCount: 0 });
gm.startGame("ROOM2");
const r2 = gm.rooms.get("ROOM2");
gm.markPlayerReady("ROOM2", "s_host");
gm.markPlayerReady("ROOM2", "s_p2");
gm.markPlayerReady("ROOM2", "s_p3");
assert.strictEqual(r2.status, "CLUE_PHASE");

// Complete clues to advance to discussion and skip to voting
gm.submitClue("ROOM2", r2.turnOrder[0], "clue1");
gm.submitClue("ROOM2", r2.turnOrder[1], "clue2");
gm.submitClue("ROOM2", r2.turnOrder[2], "clue3");
assert.strictEqual(r2.status, "DISCUSSION_PHASE");
gm.skipDiscussionToVoting("ROOM2", "s_host");
assert.strictEqual(r2.status, "VOTING_PHASE");

// Find the undercover player
const ucPlayer = r2.players.find((p) => p.role === "UNDERCOVER");
const civPlayers = r2.players.filter((p) => p.role === "CIVILIAN");

// Both Civilians vote for the Undercover player
mockIO.emits = [];
gm.castVote("ROOM2", civPlayers[0].socketId, ucPlayer.socketId);
gm.castVote("ROOM2", civPlayers[1].socketId, ucPlayer.socketId);
gm.castVote("ROOM2", ucPlayer.socketId, civPlayers[0].socketId);

// All 3 alive connected players voted -> instantly tally!
assert.strictEqual(r2.status, "GAME_OVER", "All impostors eliminated must result in GAME_OVER");
const roomUpdatedEmit = mockIO.emits.find((e) => e.event === "room:updated" && e.data?.status === "GAME_OVER");
const gameOverEmit = mockIO.emits.find((e) => e.event === "game:over");
assert.ok(roomUpdatedEmit, "room:updated must be emitted with status GAME_OVER");
assert.ok(gameOverEmit, "game:over must be emitted");
console.log("✔ Voting Elimination & Game Over Broadcast sync passed");

// 12. Test Mr. White Elimination & Guess Transition
const room3 = gm.createRoom("ROOM3", "s3_host", "Host", "u3_1");
gm.joinRoom("ROOM3", "s3_p2", "Player 2", "u3_2");
gm.joinRoom("ROOM3", "s3_p3", "Player 3", "u3_3");
gm.joinRoom("ROOM3", "s3_p4", "Player 4", "u3_4");
gm.updateRoomSettings("ROOM3", "s3_host", { undercoverCount: 1, mrWhiteCount: 1 });
gm.startGame("ROOM3");
const r3 = gm.rooms.get("ROOM3");
gm.markPlayerReady("ROOM3", "s3_host");
gm.markPlayerReady("ROOM3", "s3_p2");
gm.markPlayerReady("ROOM3", "s3_p3");
gm.markPlayerReady("ROOM3", "s3_p4");
gm.submitClue("ROOM3", r3.turnOrder[0], "c1");
gm.submitClue("ROOM3", r3.turnOrder[1], "c2");
gm.submitClue("ROOM3", r3.turnOrder[2], "c3");
gm.submitClue("ROOM3", r3.turnOrder[3], "c4");
gm.skipDiscussionToVoting("ROOM3", "s3_host");
assert.strictEqual(r3.status, "VOTING_PHASE");

const mrWhiteP = r3.players.find((p) => p.role === "MR_WHITE");
const otherPlayers = r3.players.filter((p) => p.role !== "MR_WHITE");

mockIO.emits = [];
gm.castVote("ROOM3", otherPlayers[0].socketId, mrWhiteP.socketId);
gm.castVote("ROOM3", otherPlayers[1].socketId, mrWhiteP.socketId);
gm.castVote("ROOM3", otherPlayers[2].socketId, mrWhiteP.socketId);
gm.castVote("ROOM3", mrWhiteP.socketId, otherPlayers[0].socketId);

assert.strictEqual(r3.status, "MR_WHITE_GUESS", "Mr. White eliminated must transition to MR_WHITE_GUESS");
const mwRoomUpdated = mockIO.emits.find((e) => e.event === "room:updated" && e.data?.status === "MR_WHITE_GUESS");
const mwGuessTime = mockIO.emits.find((e) => e.event === "mrwhite:guess_time");
assert.ok(mwRoomUpdated, "room:updated must be emitted when MR_WHITE_GUESS starts");
assert.ok(mwGuessTime, "mrwhite:guess_time must be emitted");
console.log("✔ Mr. White Elimination & Guess Transition passed");

// 13. Test Voting with Disconnected Player (Early Auto-Tally)
const room4 = gm.createRoom("ROOM4", "s4_host", "Host", "u4_1");
gm.joinRoom("ROOM4", "s4_p2", "Player 2", "u4_2");
gm.joinRoom("ROOM4", "s4_p3", "Player 3", "u4_3");
gm.startGame("ROOM4");
const r4 = gm.rooms.get("ROOM4");
gm.markPlayerReady("ROOM4", "s4_host");
gm.markPlayerReady("ROOM4", "s4_p2");
gm.markPlayerReady("ROOM4", "s4_p3");
gm.submitClue("ROOM4", r4.turnOrder[0], "c1");
gm.submitClue("ROOM4", r4.turnOrder[1], "c2");
gm.submitClue("ROOM4", r4.turnOrder[2], "c3");
gm.skipDiscussionToVoting("ROOM4", "s4_host");
assert.strictEqual(r4.status, "VOTING_PHASE");

// Player 3 disconnects
gm.handleDisconnect("s4_p3");
assert.strictEqual(r4.players.find((p) => p.socketId === "s4_p3").connected, false);

// The 2 remaining connected players cast votes
mockIO.emits = [];
gm.castVote("ROOM4", "s4_host", "s4_p2");
gm.castVote("ROOM4", "s4_p2", "s4_host");

// Votes should be tallied immediately because all 2 active connected players voted (tie result with 5s reveal delay)
const tieResultEmit = mockIO.emits.find((e) => e.event === "vote:result" && e.data?.isTie);
assert.ok(tieResultEmit, "vote:result with isTie=true must be emitted immediately when all active players vote");
assert.strictEqual(tieResultEmit.data.duration, 5);
console.log("✔ Disconnected Player in Voting (Early Auto-Tally & Reveal Delay) passed");

// 14. Test Session Reconnect during Voting Phase
const room5 = gm.createRoom("ROOM5", "s5_host", "Host", "u5_1");
gm.joinRoom("ROOM5", "s5_p2", "Player 2", "u5_2");
gm.joinRoom("ROOM5", "s5_p3", "Player 3", "u5_3");
gm.startGame("ROOM5");
const r5 = gm.rooms.get("ROOM5");
gm.markPlayerReady("ROOM5", "s5_host");
gm.markPlayerReady("ROOM5", "s5_p2");
gm.markPlayerReady("ROOM5", "s5_p3");
gm.submitClue("ROOM5", r5.turnOrder[0], "c1");
gm.submitClue("ROOM5", r5.turnOrder[1], "c2");
gm.submitClue("ROOM5", r5.turnOrder[2], "c3");
gm.skipDiscussionToVoting("ROOM5", "s5_host");
assert.strictEqual(r5.status, "VOTING_PHASE");

gm.castVote("ROOM5", "s5_host", "s5_p2");

// Player 1 refreshes / reconnects with new socket
const reconnectData = gm.joinRoom("ROOM5", "s5_host_new", "Host", "u5_1");
assert.strictEqual(reconnectData.isReconnect, true);
assert.strictEqual(reconnectData.votedTarget, "s5_p2");
assert.strictEqual(reconnectData.votingCandidates.length, 3);
assert.strictEqual(reconnectData.voteStats.votedCount, 1);
console.log("✔ Session Reconnect during Voting Phase passed");

import { updatePlayerGameResult, getLeaderboard, resetLeaderboard } from "./db.js";
import { calculateAutoRoleDistribution } from "./gameManager.js";

updatePlayerGameResult({
  playerId: "test_user_1",
  nickname: "Top Player",
  role: "CIVILIAN",
  isWinner: true,
  wasVotedOut: false,
  mrWhiteGuessCorrect: false,
});
const lbBefore = getLeaderboard();
assert.ok((lbBefore.all || lbBefore).length > 0, "Leaderboard should have stats");

resetLeaderboard();
const lbAfter = getLeaderboard();
assert.strictEqual((lbAfter.all || lbAfter).length, 0, "Leaderboard should be empty after reset");
console.log("✔ Leaderboard Update & Admin Reset passed");

// 16. Test Auto Role Balancing Calculations
assert.deepStrictEqual(calculateAutoRoleDistribution(3), { undercoverCount: 1, mrWhiteCount: 0 });
assert.deepStrictEqual(calculateAutoRoleDistribution(4), { undercoverCount: 1, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(5), { undercoverCount: 1, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(6), { undercoverCount: 2, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(7), { undercoverCount: 2, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(8), { undercoverCount: 2, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(9), { undercoverCount: 2, mrWhiteCount: 1 });
assert.deepStrictEqual(calculateAutoRoleDistribution(12), { undercoverCount: 3, mrWhiteCount: 2 });
console.log("✔ Dynamic Auto-Role Balancing passed");

// 17. Test Mid-Game Spectator Waiting Room & Auto Inclusion on Next Match
const room6 = gm.createRoom("ROOM6", "s6_host", "Host", "u6_1");
gm.joinRoom("ROOM6", "s6_p2", "Player 2", "u6_2");
gm.joinRoom("ROOM6", "s6_p3", "Player 3", "u6_3");

// Verify room settings auto-adjusted to 3 players
const r6 = gm.rooms.get("ROOM6");
assert.strictEqual(r6.settings.undercoverCount, 1);
assert.strictEqual(r6.settings.mrWhiteCount, 0);

gm.startGame("ROOM6");
assert.strictEqual(r6.status, "MEMORIZE_PHASE");

// Player 4 joins while game is IN PROGRESS -> enters as spectator
const specJoin = gm.joinRoom("ROOM6", "s6_spec", "Late Spectator", "u6_spec");
assert.strictEqual(specJoin.isSpectator, true);
assert.strictEqual(specJoin.error, undefined);
const specPlayer = r6.players.find((p) => p.socketId === "s6_spec");
assert.strictEqual(specPlayer.isSpectator, true);
assert.strictEqual(specPlayer.isAlive, false);

// Now host restarts / starts next match -> spectator is automatically included as alive player with role!
gm.startGame("ROOM6");
assert.strictEqual(r6.players.filter((p) => p.isAlive).length, 4);
assert.strictEqual(specPlayer.isSpectator, false);
assert.ok(specPlayer.role !== null);
console.log("✔ Mid-Game Spectator Waiting Room & Next Match Inclusion passed");

// 18. Test Lobby Chat / Discussion Message
gm.submitDiscussionMessage("ROOM6", "s6_host", "Halo dari ruang tunggu!");
assert.strictEqual(r6.discussionMessages.length, 1);
assert.strictEqual(r6.discussionMessages[0].text, "Halo dari ruang tunggu!");
console.log("✔ Lobby & In-Game Chat Broadcast passed");

// 19. Test Blind Mr. White (Category & Word Hiding)
const room7 = gm.createRoom("ROOM7", "s7_host", "Host", "u7_1");
gm.joinRoom("ROOM7", "s7_p2", "Player 2", "u7_2");
gm.joinRoom("ROOM7", "s7_p3", "Player 3", "u7_3");
gm.joinRoom("ROOM7", "s7_p4", "Player 4", "u7_4");
gm.joinRoom("ROOM7", "s7_p5", "Player 5", "u7_5");
// 5 players auto-balance assigns 1 Undercover, 1 Mr. White, 3 Civilians
gm.startGame("ROOM7");

const r7Emits = mockIO.emits.filter((e) => e.event === "game:role_assigned" && ["s7_host", "s7_p2", "s7_p3", "s7_p4", "s7_p5"].includes(e.target));
const mrwEmit = r7Emits.find((e) => e.data && e.data.role === "MR_WHITE");
assert.ok(mrwEmit, "There must be an emit for Mr. White");
assert.strictEqual(mrwEmit.data.category, "??? (Dirahasiakan)", "Mr. White must have hidden category (100% blind)");
assert.strictEqual(mrwEmit.data.word, "??? (Tidak Ada Kata)", "Mr. White must have no word");

// Civilians & Undercovers must have valid category and word
const nonMrwEmits = r7Emits.filter((e) => e.data && e.data.role !== "MR_WHITE");
assert.strictEqual(nonMrwEmits.length, 4);
nonMrwEmits.forEach((emit) => {
  assert.ok(emit.data.category && emit.data.category !== "??? (Dirahasiakan)");
  assert.ok(emit.data.word && !emit.data.word.startsWith("???"));
});
console.log("✔ Blind Roles & Mr. White Blind Category passed");

// 20. Test Multi-Round Elimination Loop (5 Players -> Round 1, Round 2, Round 3 until 2 remain or win)
const room8 = gm.createRoom("ROOM8", "s8_p1", "Player 1", "u8_1");
gm.joinRoom("ROOM8", "s8_p2", "Player 2", "u8_2");
gm.joinRoom("ROOM8", "s8_p3", "Player 3", "u8_3");
gm.joinRoom("ROOM8", "s8_p4", "Player 4", "u8_4");
gm.joinRoom("ROOM8", "s8_p5", "Player 5", "u8_5");
gm.startGame("ROOM8");

const r8 = gm.rooms.get("ROOM8");
// Assign deterministic roles: 3 Civilians (p1, p2, p3), 1 Undercover (p4), 1 Mr. White (p5)
const p1 = r8.players.find((p) => p.socketId === "s8_p1");
const p2 = r8.players.find((p) => p.socketId === "s8_p2");
const p3 = r8.players.find((p) => p.socketId === "s8_p3");
const p4 = r8.players.find((p) => p.socketId === "s8_p4");
const p5 = r8.players.find((p) => p.socketId === "s8_p5");

p1.role = "CIVILIAN";
p2.role = "CIVILIAN";
p3.role = "CIVILIAN";
p4.role = "UNDERCOVER";
p5.role = "MR_WHITE";

// Start Round 1
r8.status = "VOTING_PHASE";
r8.votes = {
  s8_p1: "s8_p2",
  s8_p2: "s8_p3",
  s8_p3: "s8_p1",
  s8_p4: "s8_p1",
  s8_p5: "s8_p1", // Player 1 (Civilian) has 3 votes -> eliminated!
};
const ucHandler = getGameHandler("undercover");
ucHandler.tallyVotes(r8, mockIO, gm);

// After p1 eliminated, 4 players remain (2 Civilians, 1 Undercover, 1 Mr. White)
assert.strictEqual(p1.isAlive, false, "Player 1 must be dead");
assert.strictEqual(r8.players.filter((p) => p.isAlive).length, 4, "Must have 4 alive players");
const winRound1 = ucHandler.evaluateWinCondition(r8);
assert.strictEqual(winRound1.gameOver, false, "Game must NOT end after 1 civilian elimination when 4 players remain");

// Fast-forward to Round 2
ucHandler.prepareNextRound(r8, mockIO, gm);
assert.strictEqual(r8.status, "CLUE_PHASE", "Must transition to CLUE_PHASE for Round 2");
assert.strictEqual(r8.roundNumber, 2, "Round number must be 2");

// In Round 2, eliminate Player 4 (Undercover)
r8.status = "VOTING_PHASE";
r8.votes = {
  s8_p2: "s8_p4",
  s8_p3: "s8_p4",
  s8_p4: "s8_p2",
  s8_p5: "s8_p4", // Player 4 (Undercover) has 3 votes -> eliminated!
};
ucHandler.tallyVotes(r8, mockIO, gm);
assert.strictEqual(p4.isAlive, false, "Player 4 (Undercover) must be dead");
assert.strictEqual(r8.players.filter((p) => p.isAlive).length, 3, "Must have 3 alive players remaining");
const winRound2 = ucHandler.evaluateWinCondition(r8);
assert.strictEqual(winRound2.gameOver, false, "Game must NOT end after Undercover eliminated when Mr. White is still alive");

// Fast-forward to Round 3
ucHandler.prepareNextRound(r8, mockIO, gm);
assert.strictEqual(r8.roundNumber, 3, "Round number must be 3");

// In Round 3, eliminate Player 2 (Civilian) -> Reaches 2 players (1 Civilian, 1 Mr. White) -> Endgame!
p2.isAlive = false;
assert.strictEqual(r8.players.filter((p) => p.isAlive).length, 2, "Must reach 2 players remaining");
const winRound3 = ucHandler.evaluateWinCondition(r8);
assert.strictEqual(winRound3.gameOver, true, "Game must END when 2 players remain (1 Civilian + 1 Impostor)");
assert.strictEqual(winRound3.winnerRole, "MR_WHITE", "Mr. White must win when reaching final 2");
console.log("✔ Multi-Round Elimination Loop & Final 2 Endgame passed");

// 21. Test Return to Lobby for Role Customization & New Match Setup
const retResult = gm.returnToLobby("ROOM8", "s8_p1");
assert.strictEqual(retResult.success, true);
assert.strictEqual(r8.status, "LOBBY");
assert.strictEqual(r8.roundNumber, 1);
assert.strictEqual(r8.players.filter((p) => p.isAlive).length, 5, "All 5 players must be alive in lobby");
assert.strictEqual(r8.players.every((p) => p.role === null && p.word === null), true, "All roles must be reset");

// Host can update settings in lobby before starting new game
gm.updateRoomSettings("ROOM8", "s8_p1", { autoBalance: false, undercoverCount: 2, mrWhiteCount: 1 });
assert.strictEqual(r8.settings.undercoverCount, 2);
assert.strictEqual(r8.settings.mrWhiteCount, 1);
console.log("✔ Return to Lobby & Role Reconfiguration passed");

// Clean up timers
const r7 = gm.rooms.get("ROOM7");
gm.clearAllTimers(activeRoom);
gm.clearAllTimers(r2);
gm.clearAllTimers(r3);
gm.clearAllTimers(r4);
gm.clearAllTimers(r5);
gm.clearAllTimers(r6);
gm.clearAllTimers(r7);
gm.clearAllTimers(r8);

console.log("\n🎉 ALL 21 GAME ENGINE ASSERTION TESTS (INCLUDING RETURN TO LOBBY & ROLE RECONFIG) PASSED WITH 100% SUCCESS!");
