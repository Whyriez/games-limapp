import assert from "assert";
import { GameManager } from "./gameManager.js";
import {
  createDeck,
  shuffleDeck,
  isValidSet,
  isValidRun,
  checkIsRemiHand,
  calculateDeadwoodScore,
} from "./games/remi/index.js";

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

console.log("▶ Running Remi Game Engine & Turn Logic Tests...");

// 1. Test Card Melds Validation
// Valid Set (3 or 4 same rank, different suits)
const validSet1 = [
  { suit: "hearts", rank: "7", value: 7 },
  { suit: "diamonds", rank: "7", value: 7 },
  { suit: "clubs", rank: "7", value: 7 },
];
assert.strictEqual(isValidSet(validSet1), true);

const invalidSetSameSuit = [
  { suit: "hearts", rank: "7", value: 7 },
  { suit: "hearts", rank: "7", value: 7 },
  { suit: "clubs", rank: "7", value: 7 },
];
assert.strictEqual(isValidSet(invalidSetSameSuit), false);

// Valid Run (3 or more consecutive same suit)
const validRun1 = [
  { suit: "spades", rank: "4", value: 4 },
  { suit: "spades", rank: "5", value: 5 },
  { suit: "spades", rank: "6", value: 6 },
];
assert.strictEqual(isValidRun(validRun1), true);

// Valid 4-card Run
const validRun4 = [
  { suit: "hearts", rank: "10", value: 10 },
  { suit: "hearts", rank: "J", value: 11 },
  { suit: "hearts", rank: "Q", value: 12 },
  { suit: "hearts", rank: "K", value: 13 },
];
assert.strictEqual(isValidRun(validRun4), true);

// Valid 7-Card Remi Complete Hand (3-card Run + 4-card Set)
const fullRemiHand = [
  { id: "c1", suit: "spades", rank: "4", value: 4 },
  { id: "c2", suit: "spades", rank: "5", value: 5 },
  { id: "c3", suit: "spades", rank: "6", value: 6 },
  { id: "c4", suit: "hearts", rank: "K", value: 13 },
  { id: "c5", suit: "diamonds", rank: "K", value: 13 },
  { id: "c6", suit: "clubs", rank: "K", value: 13 },
  { id: "c7", suit: "spades", rank: "K", value: 13 },
];
const remiCheck = checkIsRemiHand(fullRemiHand);
assert.strictEqual(remiCheck.isRemi, true);
console.log("✔ Remi Card Melds & Full Hand Validation passed");

// 2. Setup Remi Room with 3 Players
const mockIO = new MockIO();
const gm = new GameManager(mockIO);

gm.createRoom("REMI_ROOM", "s_p1", "Player 1", "u_p1");
gm.changeGameType("REMI_ROOM", "s_p1", "remi");
gm.joinRoom("REMI_ROOM", "s_p2", "Player 2", "u_p2");
gm.joinRoom("REMI_ROOM", "s_p3", "Player 3", "u_p3");
const room = gm.rooms.get("REMI_ROOM");

assert.strictEqual(room.gameType, "remi");
assert.strictEqual(room.players.length, 3);
console.log("✔ Remi Room Creation & Player Join passed");

// 3. Start Remi Game
gm.startGame("REMI_ROOM");
assert.strictEqual(room.status, "PLAYING_PHASE");
assert.strictEqual(room.turnOrder.length, 3);
assert.ok(room.currentTurnSocketId, "Current turn socket ID must be set");
assert.ok(room.currentTurnName, "Current turn player name must be set");
assert.strictEqual(room.playerHands[room.turnOrder[0]].length, 7);
assert.strictEqual(room.discardPile.length, 1);
assert.ok(room.drawPile.length > 20);
console.log(`✔ Remi Game Started in PLAYING_PHASE. Active player: ${room.currentTurnName}`);

// 4. Test Drawing from Deck
const firstPlayerSocket = room.currentTurnSocketId;
const drawRes = gm.remiDrawCard("REMI_ROOM", firstPlayerSocket, "deck");
assert.strictEqual(room.playerHands[firstPlayerSocket].length, 8, "Hand must have 8 cards after drawing");
assert.strictEqual(room.hasDrawnThisTurn, true);
console.log("✔ Drawing card from deck passed");

// 5. Test Discarding Card & Auto-Advancing Turn
const cardToDiscard = room.playerHands[firstPlayerSocket][0];
gm.remiDiscardCard("REMI_ROOM", firstPlayerSocket, cardToDiscard.id, false);
assert.strictEqual(room.playerHands[firstPlayerSocket].length, 7, "Hand must have 7 cards after discarding");
assert.notStrictEqual(room.currentTurnSocketId, firstPlayerSocket, "Turn must advance to next player after discard");
assert.strictEqual(room.hasDrawnThisTurn, false, "hasDrawnThisTurn must reset for new turn");
console.log(`✔ Discarding card passed, turn advanced to: ${room.currentTurnName}`);

// 6. Test Drawing from Discard Pile
const secondPlayerSocket = room.currentTurnSocketId;
const topDiscardBefore = room.discardPile[room.discardPile.length - 1];
gm.remiDrawCard("REMI_ROOM", secondPlayerSocket, "discard");
assert.strictEqual(room.playerHands[secondPlayerSocket].length, 8);
assert.strictEqual(
  room.playerHands[secondPlayerSocket].some((c) => c.id === topDiscardBefore.id),
  true,
  "Player must receive top discard card"
);
console.log("✔ Drawing card from discard pile passed");

// 7. Test Disconnection Handling During Active Turn
const activeSocket = room.currentTurnSocketId;
gm.handleDisconnect(activeSocket);
assert.notStrictEqual(
  room.currentTurnSocketId,
  activeSocket,
  "Turn must auto-advance when active player disconnects"
);
console.log("✔ Disconnection during active turn auto-advance passed");

// Clean up
gm.clearAllTimers(room);

console.log("\n🎉 ALL REMI GAME ENGINE & TURN ASSERTIONS PASSED WITH 100% SUCCESS!");
