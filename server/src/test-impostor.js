import assert from "assert";
import { GameManager } from "./gameManager.js";
import { getGameHandler } from "./games/registry.js";
import {
  SPACESHIP_ROOMS,
  TASK_DEFINITIONS,
  VENT_CONNECTIONS,
  calculateImpostorRoles,
} from "./games/impostor/index.js";

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

console.log("▶ Running Impostor: Space Sabotage Game Tests...");

// 1. Roles & Config Test
const roleConfig4 = calculateImpostorRoles(4, { impostorCount: 1 });
assert.strictEqual(roleConfig4.impostorCount, 1);
assert.strictEqual(roleConfig4.crewmateCount, 3);

const roleConfig8 = calculateImpostorRoles(8, { impostorCount: 2 });
assert.strictEqual(roleConfig8.impostorCount, 2);
assert.strictEqual(roleConfig8.crewmateCount, 6);
console.log("✔ Impostor role calculation verified");

// 2. Spaceship Rooms & Vents
assert.ok(SPACESHIP_ROOMS.length >= 7);
assert.ok(VENT_CONNECTIONS.electrical.includes("medbay"));
assert.ok(TASK_DEFINITIONS.length >= 6);
console.log("✔ Spaceship rooms and vents verified");

// 3. Game Lifecycle Test
const mockIO = new MockIO();
const gm = new GameManager(mockIO);

const roomCode = "IMPOSTOR_TEST";
gm.createRoom(roomCode, "sock_host", "Astronaut Alpha", "pid_1", "impostor");
gm.joinRoom(roomCode, "sock_2", "Astronaut Beta", "pid_2");
gm.joinRoom(roomCode, "sock_3", "Astronaut Gamma", "pid_3");
gm.joinRoom(roomCode, "sock_4", "Astronaut Delta", "pid_4");

const room = gm.rooms.get(roomCode);
assert.strictEqual(room.players.length, 4);

// Start game
const startRes = gm.startGame(roomCode);
assert.ok(!startRes.error, `Start error: ${startRes?.error}`);
assert.strictEqual(room.status, "MEMORIZE_PHASE");

const impostors = room.players.filter((p) => p.role === "IMPOSTOR");
const crewmates = room.players.filter((p) => p.role === "CREWMATE");
assert.strictEqual(impostors.length, 1);
assert.strictEqual(crewmates.length, 3);
console.log("✔ Impostor initialization and role unicast verified");

// Force Action Phase transition
const handler = getGameHandler("impostor");
handler.startActionPhase(room, mockIO, gm);
assert.strictEqual(room.status, "ACTION_PHASE");

// 4. Movement test
const imp = impostors[0];
const crew1 = crewmates[0];
const crew2 = crewmates[1];

gm.impostorMoveRoom(roomCode, crew1.socketId, "electrical");
assert.strictEqual(crew1.currentRoom, "electrical");

// 5. Complete Task test
const task = crew1.assignedTasks[0];
assert.ok(task, "Crewmate should have assigned tasks");
const initialCompleted = room.completedShipTasks;
gm.impostorCompleteTask(roomCode, crew1.socketId, task.id);
assert.strictEqual(room.completedShipTasks, initialCompleted + 1);
assert.strictEqual(task.completed, true);
console.log("✔ Task completion and ship task bar verified");

// 6. Impostor Vent Travel
gm.impostorMoveRoom(roomCode, imp.socketId, "electrical");
const ventRes = gm.impostorVentTravel(roomCode, imp.socketId, "medbay");
assert.ok(!ventRes.error, `Vent travel error: ${ventRes?.error}`);
assert.strictEqual(imp.currentRoom, "medbay");
console.log("✔ Impostor vent travel verified");

// 7. Impostor Kill & Cooldown
gm.impostorMoveRoom(roomCode, crew2.socketId, "medbay");
imp.killCooldownEndsAt = Date.now() - 1000; // Ready to kill
const killRes = gm.impostorKill(roomCode, imp.socketId, crew2.socketId);
assert.ok(!killRes.error, `Kill error: ${killRes?.error}`);
assert.strictEqual(crew2.isAlive, false);
assert.strictEqual(crew2.isGhost, true);
assert.strictEqual(room.deadBodies.length, 1);
console.log("✔ Impostor kill and dead body spawning verified");

// 8. Report Body & Emergency Meeting
const reporter = crewmates[2]; // Astronaut Delta
gm.impostorMoveRoom(roomCode, reporter.socketId, "medbay");
const reportRes = gm.impostorReportBody(roomCode, reporter.socketId, room.deadBodies[0].id);
assert.ok(!reportRes.error, `Report error: ${reportRes?.error}`);
assert.strictEqual(room.status, "MEETING_PHASE");
assert.strictEqual(room.activeMeeting.reason, "DEAD_BODY");
assert.strictEqual(room.activeMeeting.reporterName, reporter.name);
console.log("✔ Dead body report and emergency meeting triggered verified");

// 9. Voting & Ejection
// Vote out the impostor
gm.impostorCastVote(roomCode, crew1.socketId, imp.socketId);
gm.impostorCastVote(roomCode, reporter.socketId, imp.socketId);
gm.impostorCastVote(roomCode, imp.socketId, "SKIP");

// Check vote resolution
assert.strictEqual(room.status, "GAME_OVER");
assert.strictEqual(room.lastGameOverData.winnerRole, "CREWMATE");
console.log("✔ Voting ejection and Crewmate victory verified!");

console.log("\n🎉 ALL IMPOSTOR GAME ENGINE TESTS PASSED PERFECTLY! 🎉\n");
