import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

export const ROOM_COORDINATES = {
  cafeteria: { x: 700, y: 220 },
  weapons: { x: 1100, y: 160 },
  navigation: { x: 1250, y: 560 },
  o2: { x: 1020, y: 410 },
  shields: { x: 1080, y: 790 },
  comms: { x: 830, y: 810 },
  storage: { x: 610, y: 760 },
  admin: { x: 830, y: 510 },
  electrical: { x: 390, y: 680 },
  security: { x: 350, y: 450 },
  reactor: { x: 130, y: 440 },
  medbay: { x: 400, y: 250 },
};

export const SPACESHIP_ROOMS = [
  { id: "cafeteria", name: "Cafeteria", hasEmergencyButton: true, icon: "Coffee" },
  { id: "weapons", name: "Weapons", hasVent: false, icon: "Crosshair" },
  { id: "navigation", name: "Navigation", hasVent: true, icon: "Compass" },
  { id: "o2", name: "O2 (Life Support)", hasVent: true, icon: "Wind" },
  { id: "shields", name: "Shields", hasVent: false, icon: "Shield" },
  { id: "comms", name: "Communications", hasVent: false, icon: "Radio" },
  { id: "storage", name: "Storage", hasVent: false, icon: "Archive" },
  { id: "admin", name: "Admin", hasVent: false, icon: "FileText" },
  { id: "electrical", name: "Electrical", hasVent: true, icon: "Zap" },
  { id: "security", name: "Security", hasVent: true, icon: "Shield" },
  { id: "reactor", name: "Reactor", hasVent: true, icon: "Atom" },
  { id: "medbay", name: "Medbay", hasVent: true, icon: "HeartPulse" },
];

export const VENT_CONNECTIONS = {
  electrical: ["medbay", "security"],
  medbay: ["electrical", "security"],
  security: ["electrical", "medbay"],
  reactor: ["o2", "navigation"],
  o2: ["reactor", "navigation"],
  navigation: ["reactor", "o2"],
};

export const TASK_DEFINITIONS = [
  { id: "wiring", name: "Sambung Kabel Listrik", room: "electrical", duration: 5, icon: "Zap" },
  { id: "swipe_card", name: "Gesek Kartu ID", room: "cafeteria", duration: 4, icon: "CreditCard" },
  { id: "manifolds", name: "Buka Kunci Reaktor (1-10)", room: "reactor", duration: 6, icon: "Keypad" },
  { id: "divert_power", name: "Salurkan Saklar Daya", room: "electrical", duration: 3, icon: "Sliders" },
  { id: "clean_filter", name: "Bersihkan Filter O2", room: "o2", duration: 5, icon: "Trash2" },
  { id: "medbay_scan", name: "Pindai Kesehatan (Scan)", room: "medbay", duration: 7, icon: "Activity" },
  { id: "chart_course", name: "Atur Arah Navigasi", room: "navigation", duration: 4, icon: "Navigation" },
  { id: "calibrate_distributor", name: "Kalibrasi Distributor", room: "electrical", duration: 5, icon: "Cpu" },
];

export function calculateImpostorRoles(playerCount, customSettings = {}) {
  const count = Math.max(3, playerCount || 3);
  let impostorCount = parseInt(customSettings.impostorCount, 10) || 1;
  if (impostorCount < 1) impostorCount = 1;

  // Max impostors: max 1 for <= 6 players, max 2 for 7-8, max 3 for 9+
  const maxPossible = Math.max(1, Math.floor((count - 1) / 2));
  if (impostorCount > maxPossible) {
    impostorCount = maxPossible;
  }

  return {
    impostorCount,
    crewmateCount: count - impostorCount,
  };
}

export class ImpostorHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.role = null;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 3) {
      return { error: "Minimal butuh 3 pemain aktif untuk memulai Impostor" };
    }

    gameManager.clearAllTimers(room);
    if (room.botLoopInterval) {
      clearInterval(room.botLoopInterval);
      room.botLoopInterval = null;
    }

    const count = activePlayers.length;
    const shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
    const roleConfig = calculateImpostorRoles(count, room.settings || {});

    // Role assignment
    const rolesPool = [];
    for (let i = 0; i < roleConfig.impostorCount; i++) rolesPool.push("IMPOSTOR");
    while (rolesPool.length < count) rolesPool.push("CREWMATE");
    rolesPool.sort(() => 0.5 - Math.random());

    const tasksPerPlayer = parseInt(room.settings?.tasksPerPlayer, 10) || 3;

    // Assign roles, starting rooms, and tasks
    shuffled.forEach((p, idx) => {
      p.role = rolesPool[idx] || "CREWMATE";
      p.isAlive = true;
      p.isGhost = false;
      p.currentRoom = "cafeteria"; // Everyone starts at Cafeteria
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI;
      p.x = Math.round(700 + Math.cos(angle) * 110);
      p.y = Math.round(220 + Math.sin(angle) * 75);
      p.facingLeft = false;
      p.isMoving = false;
      p.killCooldownEndsAt = Date.now() + (parseInt(room.settings?.killCooldown, 10) || 25) * 1000;
      p.usedEmergencyMeeting = false;

      // Assign random unique tasks
      const taskPool = [...TASK_DEFINITIONS].sort(() => 0.5 - Math.random());
      p.assignedTasks = taskPool.slice(0, tasksPerPlayer).map((t) => ({
        ...t,
        completed: false,
      }));
    });

    room.status = "MEMORIZE_PHASE";
    room.roundNumber = 1;
    room.readyPlayers = new Set();
    room.deadBodies = []; // Array of { id, victimName, victimSocketId, room, x, y, reported: false }
    room.activeSabotage = null; // { type: "reactor"|"o2"|"lights"|"comms", endsAt, resolvedBy: Set }
    room.activeMeeting = null; // { reason, reporterName, victimName, endsAt }
    room.votes = {}; // voterSocketId -> targetSocketId | "SKIP"
    room.lastEjection = null; // { ejectedName, wasImpostor, isTie, isSkip }
    room.lastGameOverData = null;
    room.discussionMessages = [];

    // Calculate total ship tasks
    const crewmates = room.players.filter((p) => p.role === "CREWMATE");
    room.totalShipTasks = crewmates.reduce((sum, c) => sum + (c.assignedTasks?.length || 0), 0);
    room.completedShipTasks = 0;

    // Send role info to each player
    const impostorPlayers = room.players.filter((p) => p.role === "IMPOSTOR");
    const impostorTeammateNames = impostorPlayers.map((w) => w.name);

    room.players.forEach((p) => {
      if (p.connected) {
        io.to(p.socketId).emit("game:role_assigned", {
          role: p.role,
          gameType: "impostor",
          teammates: p.role === "IMPOSTOR" ? impostorTeammateNames : [],
          tasks: p.assignedTasks || [],
          startRoom: "cafeteria",
          x: p.x,
          y: p.y,
        });
      }
    });

    const memorizeDuration = 8;
    const endsAt = Date.now() + memorizeDuration * 1000;
    room.memorizeEndsAt = endsAt;

    io.to(room.id).emit("phase:memorize_start", {
      endsAt,
      duration: memorizeDuration,
      totalPlayers: activePlayers.length,
      readyCount: 0,
      gameType: "impostor",
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    room.memorizeTimerTimeout = setTimeout(() => {
      this.startActionPhase(room, io, gameManager);
    }, memorizeDuration * 1000);

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  startActionPhase(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    room.status = "ACTION_PHASE";
    room.activeMeeting = null;
    room.votes = {};

    // Refresh kill cooldown for impostors on new action phase
    const cdDuration = parseInt(room.settings?.killCooldown, 10) || 25;
    room.players.forEach((p) => {
      if (p.role === "IMPOSTOR") {
        p.killCooldownEndsAt = Date.now() + cdDuration * 1000;
      }
    });

    // Reset living players' coordinates around Cafeteria table
    const living = room.players.filter((p) => p.isAlive);
    living.forEach((p, idx) => {
      const angle = (idx / Math.max(1, living.length)) * 2 * Math.PI;
      p.x = Math.round(700 + Math.cos(angle) * 110);
      p.y = Math.round(220 + Math.sin(angle) * 75);
      p.currentRoom = "cafeteria";
      p.facingLeft = false;
      p.isMoving = false;
    });

    // Clean up reported dead bodies
    room.deadBodies = (room.deadBodies || []).filter((b) => !b.reported);

    io.to(room.id).emit("impostor:action_phase_start", {
      rooms: SPACESHIP_ROOMS,
      deadBodies: room.deadBodies,
      activeSabotage: room.activeSabotage,
      totalTasks: room.totalShipTasks,
      completedTasks: room.completedShipTasks,
      progressPercent: room.totalShipTasks > 0 ? Math.round((room.completedShipTasks / room.totalShipTasks) * 100) : 0,
      playerPositions: room.players.map((p) => ({
        socketId: p.socketId,
        x: p.x || 700,
        y: p.y || 220,
        currentRoom: p.currentRoom || "cafeteria",
        facingLeft: !!p.facingLeft,
        isMoving: !!p.isMoving,
        isAlive: p.isAlive,
        isGhost: !!p.isGhost,
      })),
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Start bot loop
    this.startBotLoop(room, io, gameManager);
  }

  startBotLoop(room, io, gameManager) {
    if (room.botLoopInterval) {
      clearInterval(room.botLoopInterval);
      room.botLoopInterval = null;
    }

    room.botLoopInterval = setInterval(() => {
      if (room.status !== "ACTION_PHASE") return;

      const bots = room.players.filter((p) => p.isBot && p.isAlive);
      if (bots.length === 0) return;

      bots.forEach((bot) => {
        // 1. If bot is near or in room with unreported dead body -> 85% chance to report
        const bodyNear = (room.deadBodies || []).find((b) => {
          if (b.reported) return false;
          if (b.room === bot.currentRoom) return true;
          const dist = Math.hypot((b.x || 700) - (bot.x || 700), (b.y || 220) - (bot.y || 220));
          return dist < 140;
        });
        if (bodyNear && Math.random() < 0.85) {
          this.reportBody(room, bot.socketId, bodyNear.id, io, gameManager);
          return;
        }

        // 2. If bot is Impostor
        if (bot.role === "IMPOSTOR") {
          const now = Date.now();
          const canKill = !bot.killCooldownEndsAt || now >= bot.killCooldownEndsAt;
          if (canKill) {
            // Find an alive crewmate near bot or in same room
            const victim = room.players.find(
              (p) =>
                p.isAlive &&
                p.role === "CREWMATE" &&
                (p.currentRoom === bot.currentRoom ||
                  Math.hypot((p.x || 700) - (bot.x || 700), (p.y || 220) - (bot.y || 220)) < 120)
            );
            if (victim && Math.random() < 0.65) {
              this.killPlayer(room, bot.socketId, victim.socketId, io, gameManager);
              return;
            }
          }

          // Sabotage chance if none active
          if (!room.activeSabotage && Math.random() < 0.1) {
            const sabotages = ["reactor", "o2", "lights"];
            const chosen = sabotages[Math.floor(Math.random() * sabotages.length)];
            this.triggerSabotage(room, bot.socketId, chosen, io, gameManager);
          }
        }

        // 3. If bot is Crewmate and has task in current room
        if (bot.role === "CREWMATE" && bot.assignedTasks) {
          const pendingTask = bot.assignedTasks.find((t) => t.room === bot.currentRoom && !t.completed);
          if (pendingTask && Math.random() < 0.45) {
            this.completeTask(room, bot.socketId, pendingTask.id, io, gameManager);
          }
        }

        // 4. Movement: Bot roams towards a room or task location
        if (Math.random() < 0.55) {
          const roomKeys = Object.keys(ROOM_COORDINATES);
          const targetRoom = roomKeys[Math.floor(Math.random() * roomKeys.length)];
          const targetCoord = ROOM_COORDINATES[targetRoom];
          if (targetCoord) {
            const currentX = typeof bot.x === "number" ? bot.x : 700;
            const currentY = typeof bot.y === "number" ? bot.y : 220;
            const stepRatio = 0.45 + Math.random() * 0.4;
            const newX = Math.round(currentX + (targetCoord.x - currentX) * stepRatio + (Math.random() * 40 - 20));
            const newY = Math.round(currentY + (targetCoord.y - currentY) * stepRatio + (Math.random() * 30 - 15));
            bot.facingLeft = newX < currentX;
            bot.x = newX;
            bot.y = newY;
            bot.currentRoom = targetRoom;
            bot.isMoving = true;

            io.to(room.id).emit("impostor:pos_update", {
              socketId: bot.socketId,
              x: bot.x,
              y: bot.y,
              currentRoom: bot.currentRoom,
              facingLeft: bot.facingLeft,
              isMoving: true,
            });

            setTimeout(() => {
              if (bot) bot.isMoving = false;
            }, 900);
          }
        }
      });
    }, 2200);
  }

  updatePosition(room, socketId, posData, io) {
    if (room.status !== "ACTION_PHASE") return;
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return;

    if (typeof posData.x === "number") player.x = posData.x;
    if (typeof posData.y === "number") player.y = posData.y;
    if (posData.currentRoom) player.currentRoom = posData.currentRoom;
    if (typeof posData.facingLeft === "boolean") player.facingLeft = posData.facingLeft;
    if (typeof posData.isMoving === "boolean") player.isMoving = posData.isMoving;

    // Broadcast to other players in room
    io.to(room.id).emit("impostor:pos_update", {
      socketId: player.socketId,
      x: player.x,
      y: player.y,
      currentRoom: player.currentRoom,
      facingLeft: player.facingLeft,
      isMoving: player.isMoving,
    });
  }

  moveRoom(room, socketId, targetRoomId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || (!player.isAlive && !player.isGhost)) return { error: "Pemain tidak valid" };

    const validRoom = SPACESHIP_ROOMS.find((r) => r.id === targetRoomId);
    if (!validRoom) return { error: "Ruangan tidak valid" };

    player.currentRoom = targetRoomId;
    const coords = ROOM_COORDINATES[targetRoomId] || { x: 700, y: 220 };
    player.x = coords.x;
    player.y = coords.y;

    io.to(room.id).emit("impostor:player_moved", {
      socketId: player.socketId,
      name: player.name,
      currentRoom: targetRoomId,
    });

    io.to(room.id).emit("impostor:pos_update", {
      socketId: player.socketId,
      x: player.x,
      y: player.y,
      currentRoom: player.currentRoom,
      facingLeft: player.facingLeft,
      isMoving: false,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
    return { success: true };
  }

  ventTravel(room, socketId, targetRoomId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isAlive || player.role !== "IMPOSTOR") {
      return { error: "Hanya Impostor yang bisa menggunakan ventilasi!" };
    }

    const currentRoom = player.currentRoom || "cafeteria";
    const availableVents = VENT_CONNECTIONS[currentRoom] || [];

    if (!availableVents.includes(targetRoomId)) {
      return { error: "Ventilasi tidak terhubung ke ruangan tersebut" };
    }

    player.currentRoom = targetRoomId;
    const coords = ROOM_COORDINATES[targetRoomId] || { x: 700, y: 220 };
    player.x = coords.x;
    player.y = coords.y;

    // Broadcast vent sound/event
    io.to(room.id).emit("impostor:vent_used", {
      fromRoom: currentRoom,
      toRoom: targetRoomId,
    });

    io.to(room.id).emit("impostor:pos_update", {
      socketId: player.socketId,
      x: player.x,
      y: player.y,
      currentRoom: player.currentRoom,
      facingLeft: player.facingLeft,
      isMoving: false,
    });

    io.to(room.id).emit("impostor:player_moved", {
      socketId: player.socketId,
      name: player.name,
      currentRoom: targetRoomId,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
    return { success: true };
  }

  completeTask(room, socketId, taskId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return { error: "Pemain tidak ditemukan" };

    const task = (player.assignedTasks || []).find((t) => t.id === taskId);
    if (!task) return { error: "Tugas tidak ditemukan" };
    if (task.completed) return { error: "Tugas sudah diselesaikan" };

    task.completed = true;
    room.completedShipTasks = (room.completedShipTasks || 0) + 1;

    const progressPercent =
      room.totalShipTasks > 0 ? Math.round((room.completedShipTasks / room.totalShipTasks) * 100) : 100;

    io.to(room.id).emit("impostor:task_progress_updated", {
      completedTasks: room.completedShipTasks,
      totalTasks: room.totalShipTasks,
      progressPercent,
      completedBy: player.name,
      taskId,
    });

    // Check Win Condition: All tasks completed!
    if (room.completedShipTasks >= room.totalShipTasks && room.totalShipTasks > 0) {
      this.endGame(room, "CREWMATE", "Semua tugas (tasks) pesawat antariksa berhasil diselesaikan 100%!", io, gameManager);
      return { success: true };
    }

    return { success: true, progressPercent };
  }

  killPlayer(room, impostorSocketId, targetSocketId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const killer = room.players.find((p) => p.socketId === impostorSocketId);
    if (!killer || !killer.isAlive || killer.role !== "IMPOSTOR") {
      return { error: "Hanya Impostor aktif yang dapat mengeliminasi!" };
    }

    const now = Date.now();
    if (killer.killCooldownEndsAt && now < killer.killCooldownEndsAt) {
      const remaining = Math.ceil((killer.killCooldownEndsAt - now) / 1000);
      return { error: `Kill cooldown masih tersisa ${remaining} detik` };
    }

    const victim = room.players.find((p) => p.socketId === targetSocketId);
    if (!victim || !victim.isAlive) {
      return { error: "Target korban tidak valid atau sudah tereliminasi" };
    }

    if (victim.role === "IMPOSTOR") {
      return { error: "Tidak dapat mengeliminasi sesama rekan Impostor!" };
    }

    // Allow elimination if in same room OR within proximity range
    const dist =
      typeof killer.x === "number" && typeof victim.x === "number"
        ? Math.hypot(killer.x - victim.x, killer.y - victim.y)
        : 999;
    if (killer.currentRoom !== victim.currentRoom && dist > 140) {
      return { error: "Korban terlalu jauh untuk dieliminasi" };
    }

    // Execute kill
    victim.isAlive = false;
    victim.isGhost = true;

    // Reset kill cooldown
    const cdDuration = parseInt(room.settings?.killCooldown, 10) || 25;
    killer.killCooldownEndsAt = Date.now() + cdDuration * 1000;

    // Spawn dead body at victim's coordinates
    const bodyId = `body_${Date.now()}_${victim.socketId}`;
    const newBody = {
      id: bodyId,
      victimName: victim.name,
      victimSocketId: victim.socketId,
      room: victim.currentRoom || killer.currentRoom || "cafeteria",
      x: typeof victim.x === "number" ? victim.x : (killer.x || 700),
      y: typeof victim.y === "number" ? victim.y : (killer.y || 220),
      reported: false,
    };
    room.deadBodies = room.deadBodies || [];
    room.deadBodies.push(newBody);

    // Notify killer and victim
    io.to(victim.socketId).emit("impostor:killed", {
      killerName: killer.name,
      room: newBody.room,
      x: newBody.x,
      y: newBody.y,
    });

    io.to(killer.socketId).emit("impostor:kill_success", {
      victimName: victim.name,
      cooldownEndsAt: killer.killCooldownEndsAt,
    });

    io.to(room.id).emit("impostor:body_spawned", {
      body: newBody,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Check Win Condition: Impostors outnumber or equal alive crewmates
    this.checkWinConditions(room, io, gameManager);

    return { success: true };
  }

  triggerSabotage(room, impostorSocketId, sabotageType, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === impostorSocketId);
    if (!player || !player.isAlive || player.role !== "IMPOSTOR") {
      return { error: "Hanya Impostor yang dapat melakukan sabotase!" };
    }

    if (room.activeSabotage) {
      return { error: "Masih ada sabotase yang sedang aktif!" };
    }

    let durationSeconds = 35;
    let isCritical = false;

    if (sabotageType === "reactor") {
      durationSeconds = 40;
      isCritical = true;
    } else if (sabotageType === "o2") {
      durationSeconds = 35;
      isCritical = true;
    } else if (sabotageType === "lights") {
      durationSeconds = 60;
      isCritical = false;
    } else if (sabotageType === "comms") {
      durationSeconds = 45;
      isCritical = false;
    }

    const endsAt = Date.now() + durationSeconds * 1000;
    room.activeSabotage = {
      type: sabotageType,
      endsAt,
      isCritical,
      requiredRoom:
        sabotageType === "reactor" ? "reactor" : sabotageType === "o2" ? "o2" : sabotageType === "lights" ? "electrical" : "security",
      resolvedBy: [],
    };

    io.to(room.id).emit("impostor:sabotage_triggered", room.activeSabotage);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // If critical, set timer for Impostor victory
    if (isCritical) {
      if (room.sabotageTimerTimeout) clearTimeout(room.sabotageTimerTimeout);
      room.sabotageTimerTimeout = setTimeout(() => {
        if (room.activeSabotage && room.activeSabotage.isCritical && room.status === "ACTION_PHASE") {
          this.endGame(
            room,
            "IMPOSTOR",
            `Waktu sabotase kritis (${room.activeSabotage.type.toUpperCase()}) habis! Pesawat luar angkasa hancur!`,
            io,
            gameManager
          );
        }
      }, durationSeconds * 1000);
    }

    return { success: true };
  }

  fixSabotage(room, socketId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    if (!room.activeSabotage) return { error: "Tidak ada sabotase yang sedang aktif" };

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isAlive) return { error: "Pemain harus hidup untuk memperbaiki sabotase" };

    const requiredRoom = room.activeSabotage.requiredRoom;
    if (player.currentRoom !== requiredRoom) {
      return { error: `Anda harus berada di ruangan ${requiredRoom.toUpperCase()} untuk memperbaiki sabotase ini!` };
    }

    // Sabotage fixed!
    const fixedType = room.activeSabotage.type;
    room.activeSabotage = null;
    if (room.sabotageTimerTimeout) {
      clearTimeout(room.sabotageTimerTimeout);
      room.sabotageTimerTimeout = null;
    }

    io.to(room.id).emit("impostor:sabotage_fixed", {
      fixedBy: player.name,
      type: fixedType,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
    return { success: true };
  }

  reportBody(room, socketId, bodyId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isAlive) return { error: "Hanya pemain hidup yang dapat melaporkan mayat" };

    const body = (room.deadBodies || []).find((b) => b.id === bodyId && !b.reported);
    if (!body) return { error: "Mayat tidak ditemukan atau sudah dilaporkan" };

    if (player.currentRoom !== body.room) {
      return { error: "Anda harus berada di ruangan yang sama dengan mayat untuk melaporkannya!" };
    }

    body.reported = true;
    this.startMeeting(room, "DEAD_BODY", player.name, body.victimName, body.room, io, gameManager);
    return { success: true };
  }

  emergencyMeeting(room, socketId, io, gameManager) {
    if (room.status !== "ACTION_PHASE") return { error: "Bukan fase aksi" };
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player || !player.isAlive) return { error: "Hanya pemain hidup yang dapat menekan tombol darurat" };

    if (player.currentRoom !== "cafeteria") {
      return { error: "Tombol Emergency hanya berada di Cafeteria!" };
    }

    if (player.usedEmergencyMeeting) {
      return { error: "Anda sudah menggunakan kuota Emergency Meeting Anda game ini!" };
    }

    if (room.activeSabotage && room.activeSabotage.isCritical) {
      return { error: "Tidak dapat memanggil Emergency Meeting saat sabotase kritis aktif!" };
    }

    player.usedEmergencyMeeting = true;
    this.startMeeting(room, "EMERGENCY_BUTTON", player.name, null, "cafeteria", io, gameManager);
    return { success: true };
  }

  startMeeting(room, reason, reporterName, victimName, locationName, io, gameManager) {
    gameManager.clearAllTimers(room);
    if (room.botLoopInterval) {
      clearInterval(room.botLoopInterval);
      room.botLoopInterval = null;
    }

    // Cancel active sabotage if any non-critical
    if (room.activeSabotage && !room.activeSabotage.isCritical) {
      room.activeSabotage = null;
    }

    // Move all players to Cafeteria table
    const living = room.players.filter((p) => p.isAlive);
    living.forEach((p, idx) => {
      p.currentRoom = "cafeteria";
      const angle = (idx / Math.max(1, living.length)) * 2 * Math.PI;
      p.x = Math.round(700 + Math.cos(angle) * 110);
      p.y = Math.round(220 + Math.sin(angle) * 75);
      p.facingLeft = false;
      p.isMoving = false;
    });

    room.status = "MEETING_PHASE";
    room.votes = {};

    const discussionDuration = parseInt(room.settings?.discussionDuration, 10) || 60;
    const endsAt = Date.now() + discussionDuration * 1000;

    room.activeMeeting = {
      reason, // "DEAD_BODY" or "EMERGENCY_BUTTON"
      reporterName,
      victimName,
      locationName,
      endsAt,
    };

    io.to(room.id).emit("impostor:meeting_started", room.activeMeeting);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Schedule bots during meeting
    this.scheduleBotMeetingActions(room, io, gameManager, discussionDuration);

    room.discussionTimerTimeout = setTimeout(() => {
      this.resolveVotes(room, io, gameManager);
    }, discussionDuration * 1000);
  }

  scheduleBotMeetingActions(room, io, gameManager, discussionDuration) {
    const bots = room.players.filter((p) => p.isBot && p.isAlive);
    if (bots.length === 0) return;

    const phrases = [
      "Di mana mayatnya ditemukan?",
      "Aku tadi lagi ngerjain kabel di Electrical!",
      "Ada yang bareng sama aku di Medbay?",
      "Mencurigakan banget...",
      "Kayaknya kita harus skip dulu deh.",
      "Siapa yang terakhir kali lewat Cafeteria?",
    ];

    bots.forEach((bot, idx) => {
      // Chat phrase
      setTimeout(() => {
        if (room.status !== "MEETING_PHASE") return;
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        gameManager.submitDiscussionMessage(room.id, bot.socketId, phrase);
      }, (idx + 1) * 3500);

      // Bot Vote after halfway through discussion
      setTimeout(() => {
        if (room.status !== "MEETING_PHASE") return;
        if (!room.votes[bot.socketId]) {
          const aliveOthers = room.players.filter((p) => p.isAlive && p.socketId !== bot.socketId);
          // 30% chance skip, 70% vote someone
          if (Math.random() < 0.3 || aliveOthers.length === 0) {
            this.castVote(room, bot.socketId, "SKIP", io, gameManager);
          } else {
            const chosen = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
            this.castVote(room, bot.socketId, chosen.socketId, io, gameManager);
          }
        }
      }, Math.max(10, discussionDuration * 0.5) * 1000 + idx * 1000);
    });
  }

  castVote(room, voterSocketId, targetSocketId, io, gameManager) {
    if (room.status !== "MEETING_PHASE") return { error: "Bukan fase voting" };
    const voter = room.players.find((p) => p.socketId === voterSocketId);
    if (!voter || !voter.isAlive) return { error: "Hanya pemain hidup yang dapat melakukan voting" };

    room.votes = room.votes || {};
    room.votes[voterSocketId] = targetSocketId; // targetSocketId or "SKIP"

    const alivePlayers = room.players.filter((p) => p.isAlive && p.connected && !p.isSpectator);
    const votedCount = Object.keys(room.votes).length;

    io.to(room.id).emit("impostor:vote_update", {
      votedSocketId: voterSocketId,
      votedCount,
      totalVoters: alivePlayers.length,
    });

    // If everyone alive has voted -> resolve votes immediately!
    if (votedCount >= alivePlayers.length) {
      if (room.discussionTimerTimeout) {
        clearTimeout(room.discussionTimerTimeout);
        room.discussionTimerTimeout = null;
      }
      this.resolveVotes(room, io, gameManager);
    }

    return { success: true };
  }

  skipDiscussionToVoting(room, hostSocketId, io, gameManager) {
    if (room.status !== "MEETING_PHASE") return;
    if (room.hostId !== hostSocketId) return;

    if (room.discussionTimerTimeout) {
      clearTimeout(room.discussionTimerTimeout);
      room.discussionTimerTimeout = null;
    }

    this.resolveVotes(room, io, gameManager);
  }

  resolveVotes(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    const alivePlayers = room.players.filter((p) => p.isAlive && p.connected && !p.isSpectator);
    const votes = room.votes || {};

    // Tally votes
    const tally = {}; // targetSocketId -> count
    let skipCount = 0;

    Object.values(votes).forEach((target) => {
      if (target === "SKIP") {
        skipCount++;
      } else if (target) {
        tally[target] = (tally[target] || 0) + 1;
      }
    });

    let highestCount = 0;
    let candidates = [];

    Object.entries(tally).forEach(([sockId, count]) => {
      if (count > highestCount) {
        highestCount = count;
        candidates = [sockId];
      } else if (count === highestCount) {
        candidates.push(sockId);
      }
    });

    let ejectionResult = null;

    if (skipCount >= highestCount || candidates.length !== 1 || highestCount === 0) {
      // Skipped or Tie
      ejectionResult = {
        ejectedName: null,
        wasImpostor: null,
        isTie: candidates.length > 1 && highestCount > skipCount,
        isSkip: skipCount >= highestCount,
        remainingImpostors: room.players.filter((p) => p.isAlive && p.role === "IMPOSTOR").length,
      };
    } else {
      // Clear majority
      const ejectedSocketId = candidates[0];
      const ejectedPlayer = room.players.find((p) => p.socketId === ejectedSocketId);

      if (ejectedPlayer) {
        ejectedPlayer.isAlive = false;
        ejectedPlayer.isGhost = true;
        const wasImpostor = ejectedPlayer.role === "IMPOSTOR";

        const remainingImpostors = room.players.filter((p) => p.isAlive && p.role === "IMPOSTOR").length;

        ejectionResult = {
          ejectedSocketId: ejectedPlayer.socketId,
          ejectedName: ejectedPlayer.name,
          wasImpostor,
          isTie: false,
          isSkip: false,
          remainingImpostors,
        };
      }
    }

    room.lastEjection = ejectionResult;

    io.to(room.id).emit("impostor:ejection_result", {
      result: ejectionResult,
      votesSummary: votes,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Check win conditions after ejection
    const hasGameEnded = this.checkWinConditions(room, io, gameManager);

    if (!hasGameEnded) {
      // Return to Action Phase after 7 seconds for players to see the ejection animation
      room.voteResultTimerTimeout = setTimeout(() => {
        this.startActionPhase(room, io, gameManager);
      }, 7000);
    }
  }

  checkWinConditions(room, io, gameManager) {
    const aliveImpostors = room.players.filter((p) => p.isAlive && p.role === "IMPOSTOR");
    const aliveCrewmates = room.players.filter((p) => p.isAlive && p.role === "CREWMATE");

    // 1. All Impostors ejected -> Crewmates Win!
    if (aliveImpostors.length === 0) {
      this.endGame(room, "CREWMATE", "Semua Impostor (Penyusup) berhasil dikeluarkan ke antariksa!", io, gameManager);
      return true;
    }

    // 2. Impostors equal or outnumber Crewmates -> Impostors Win!
    if (aliveImpostors.length >= aliveCrewmates.length) {
      this.endGame(
        room,
        "IMPOSTOR",
        "Impostor berhasil menguasai kapal! Jumlah penyusup menyamai atau melebihi astronot yang tersisa.",
        io,
        gameManager
      );
      return true;
    }

    return false;
  }

  endGame(room, winnerRole, reason, io, gameManager) {
    gameManager.clearAllTimers(room);
    if (room.botLoopInterval) {
      clearInterval(room.botLoopInterval);
      room.botLoopInterval = null;
    }

    room.status = "GAME_OVER";

    const impostors = room.players.filter((p) => p.role === "IMPOSTOR").map((p) => p.name);
    const crewmates = room.players.filter((p) => p.role === "CREWMATE").map((p) => p.name);

    const gameOverData = {
      gameType: "impostor",
      winnerRole, // "CREWMATE" or "IMPOSTOR"
      reason,
      impostors,
      crewmates,
      taskProgressPercent:
        room.totalShipTasks > 0 ? Math.round((room.completedShipTasks / room.totalShipTasks) * 100) : 0,
    };

    room.lastGameOverData = gameOverData;

    // Update database points & stats
    room.players.forEach((p) => {
      const isWinner = p.role === winnerRole;
      try {
        updatePlayerGameResult(p.playerId, p.name, "impostor", isWinner, isWinner ? 25 : 5);
      } catch (e) {
        console.error("Failed to update player game result in DB:", e);
      }
    });

    io.to(room.id).emit("game:over", gameOverData);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
    io.emit("leaderboard:updated", getLeaderboard());
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let impCount = parseInt(newSettings.impostorCount, 10) || 1;
    if (impCount < 1) impCount = 1;
    if (impCount > 3) impCount = 3;

    let cd = parseInt(newSettings.killCooldown, 10) || 25;
    if (cd < 10) cd = 10;
    if (cd > 60) cd = 60;

    let disc = parseInt(newSettings.discussionDuration, 10) || 60;
    if (disc < 20) disc = 20;
    if (disc > 180) disc = 180;

    let tasks = parseInt(newSettings.tasksPerPlayer, 10) || 3;
    if (tasks < 1) tasks = 1;
    if (tasks > 6) tasks = 6;

    room.settings = {
      ...room.settings,
      impostorCount: impCount,
      killCooldown: cd,
      discussionDuration: disc,
      tasksPerPlayer: tasks,
    };

    io.to(room.id).emit("room:settings_updated", room.settings);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  getReconnectData(room, player, socketId) {
    return {
      roleData: {
        role: player.role,
        gameType: "impostor",
        tasks: player.assignedTasks || [],
        teammates:
          player.role === "IMPOSTOR"
            ? room.players.filter((p) => p.role === "IMPOSTOR").map((p) => p.name)
            : [],
      },
      currentRoom: player.currentRoom || "cafeteria",
      impostorState: {
        rooms: SPACESHIP_ROOMS,
        deadBodies: room.deadBodies || [],
        activeSabotage: room.activeSabotage || null,
        activeMeeting: room.activeMeeting || null,
        totalTasks: room.totalShipTasks || 0,
        completedTasks: room.completedShipTasks || 0,
      },
    };
  }
}
