import assert from "assert";
import { GameManager } from "./gameManager.js";
import {
  createUnoDeck,
  shuffleDeck,
  isCardPlayable,
} from "./games/uno/index.js";

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

console.log("▶ Running UNO Game Engine & Card Logic Tests...");

// 1. Deck Validation
const deck = createUnoDeck();
assert.strictEqual(deck.length, 108, "Standard UNO deck must have 108 cards");

const redCards = deck.filter((c) => c.color === "red");
const yellowCards = deck.filter((c) => c.color === "yellow");
const greenCards = deck.filter((c) => c.color === "green");
const blueCards = deck.filter((c) => c.color === "blue");
const wildCards = deck.filter((c) => c.color === "wild");

assert.strictEqual(redCards.length, 25);
assert.strictEqual(yellowCards.length, 25);
assert.strictEqual(greenCards.length, 25);
assert.strictEqual(blueCards.length, 25);
assert.strictEqual(wildCards.length, 8); // 4 Wild + 4 Wild Draw 4
console.log("✔ UNO 108-card Deck Composition verified");

// 2. Card Playability Tests
const topCard1 = { color: "red", type: "number", value: 5 };
assert.strictEqual(isCardPlayable({ color: "red", type: "number", value: 8 }, "red", topCard1), true); // Match color
assert.strictEqual(isCardPlayable({ color: "blue", type: "number", value: 5 }, "red", topCard1), true); // Match number
assert.strictEqual(isCardPlayable({ color: "green", type: "number", value: 2 }, "red", topCard1), false); // Mismatch
assert.strictEqual(isCardPlayable({ color: "wild", type: "wild", value: "wild" }, "red", topCard1), true); // Wild always valid
assert.strictEqual(isCardPlayable({ color: "wild", type: "wild4", value: "+4" }, "red", topCard1), true); // Wild 4 always valid

const topSkip = { color: "blue", type: "skip", value: "skip" };
assert.strictEqual(isCardPlayable({ color: "yellow", type: "skip", value: "skip" }, "blue", topSkip), true); // Match action symbol
console.log("✔ Card Playability logic passed");

// 3. Room Setup & Game Start
const mockIO = new MockIO();
const gm = new GameManager(mockIO);

gm.createRoom("UNO_ROOM", "s_p1", "Player 1", "u_p1");
gm.changeGameType("UNO_ROOM", "s_p1", "uno");
gm.joinRoom("UNO_ROOM", "s_p2", "Player 2", "u_p2");
gm.joinRoom("UNO_ROOM", "s_p3", "Player 3", "u_p3");
const room = gm.rooms.get("UNO_ROOM");

assert.strictEqual(room.gameType, "uno");
assert.strictEqual(room.players.length, 3);

gm.startGame("UNO_ROOM");
assert.strictEqual(room.status, "PLAYING_PHASE");
assert.ok(room.playerHands[room.turnOrder[0]].length >= 7);
assert.ok(room.activeColor);
assert.ok(room.discardPile.length >= 1);
assert.ok(room.currentTurnSocketId);
console.log(`✔ UNO Room Started. Active player: ${room.currentTurnName}, Active color: ${room.activeColor}`);

// 4. Test Playing Card & Turn Advance
const activeSocket = room.currentTurnSocketId;
const hand = room.playerHands[activeSocket];
// Give a guaranteed matching card for testing
const matchCard = { id: "test_card_1", color: room.activeColor, type: "number", value: 7, score: 7 };
hand.push(matchCard);

const playRes = gm.unoPlayCard("UNO_ROOM", activeSocket, "test_card_1", "red");
assert.strictEqual(playRes.success, true);
assert.strictEqual(room.playerHands[activeSocket].some((c) => c.id === "test_card_1"), false);
assert.notStrictEqual(room.currentTurnSocketId, activeSocket, "Turn must advance after playing card");
console.log(`✔ Playing matching card passed. Next turn: ${room.currentTurnName}`);

// 5. Test Drawing Card
const nextSocket = room.currentTurnSocketId;
const handCountBeforeDraw = room.playerHands[nextSocket].length;
const drawRes = gm.unoDrawCard("UNO_ROOM", nextSocket);
assert.strictEqual(drawRes.success, true);
assert.strictEqual(room.playerHands[nextSocket].length, handCountBeforeDraw + 1);
assert.strictEqual(room.hasDrawnThisTurn, true);
console.log("✔ Drawing card from deck passed");

// 6. Test Passing Turn
const passRes = gm.unoPassTurn("UNO_ROOM", nextSocket);
assert.strictEqual(passRes.success, true);
assert.notStrictEqual(room.currentTurnSocketId, nextSocket, "Turn must advance after pass");
console.log("✔ Passing turn passed");

// 7. Test Reverse Action (3 players)
const revSocket = room.currentTurnSocketId;
const revCard = { id: "test_rev", color: room.activeColor, type: "reverse", value: "reverse", score: 20 };
room.playerHands[revSocket].push(revCard);
const dirBefore = room.turnDirection;
gm.unoPlayCard("UNO_ROOM", revSocket, "test_rev", "red");
assert.strictEqual(room.turnDirection, -dirBefore, "Reverse card must invert turn direction");
console.log("✔ Reverse card turn inversion passed");

// Clean up
gm.clearAllTimers(room);

console.log("\n🎉 ALL UNO ENGINE ASSERTIONS PASSED WITH 100% SUCCESS!");
