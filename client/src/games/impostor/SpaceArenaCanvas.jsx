import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ROOMS_MAP,
  CORRIDORS,
  SOLID_OBSTACLES,
  EMERGENCY_BUTTON,
  TASK_STATIONS,
  VENT_LOCATIONS,
  SABOTAGE_STATIONS,
  isWalkable,
  getRoomAt,
  getPlayerColor,
} from "./shipMap";

/**
 * 2D Top-Down Spaceship Arena Canvas
 * Real-time 60fps rendering, player movement, smooth lerp interpolation,
 * animated bean astronauts, dead bodies, vents, and proximity detection.
 */
export default function SpaceArenaCanvas({
  room,
  socket,
  identity,
  myRoleData,
  isImpostor,
  isGhost,
  killCooldownSecs,
  joystickVector,
  onProximityChange,
  activeSabotage,
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // My player socket ID
  const myPlayerId = socket?.id;
  const myPlayerObj = (room?.players || []).find(
    (p) => p.socketId === myPlayerId || (identity?.playerId && p.playerId === identity.playerId)
  );

  // Local position & movement state
  const localPosRef = useRef({
    x: myPlayerObj?.x || 700,
    y: myPlayerObj?.y || 220,
    facingLeft: false,
    isMoving: false,
    walkCycle: 0,
  });

  // Remote player positions with lerp interpolation
  const remotePlayersRef = useRef(new Map()); // socketId -> { x, y, targetX, targetY, facingLeft, isMoving, walkCycle, ... }

  // Keyboard keys down
  const keysDownRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
  });

  // Last socket emit timestamp for throttling
  const lastEmitTimeRef = useRef(0);

  // Camera world position ref for click-to-move calculations
  const camRef = useRef({ x: 0, y: 0 });

  // Tap-to-move / Click-to-move waypoint ref
  const waypointRef = useRef({ x: null, y: null, active: false, ringTime: 0 });

  // Dynamic particle system (dust puffs & vent smoke)
  const particlesRef = useRef([]);

  // Screen shake & damage/kill vignette
  const shakeRef = useRef({ intensity: 0, duration: 0 });
  const redFlashRef = useRef(0);

  // Previous proximity state cache for state diffing
  const prevProximityRef = useRef({});

  // Tasks assigned to me
  const myTasks = myRoleData?.tasks || [];

  // Stars in background
  const starsRef = useRef([]);
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * (MAP_WIDTH + 400) - 200,
        y: Math.random() * (MAP_HEIGHT + 400) - 200,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    starsRef.current = stars;
  }, []);

  // Pointer down on canvas for Tap-to-Move / Click-to-Move
  const handleCanvasPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickScreenX = e.clientX - rect.left;
    const clickScreenY = e.clientY - rect.top;

    const cam = camRef.current;
    const targetWorldX = Math.round(clickScreenX + cam.x);
    const targetWorldY = Math.round(clickScreenY + cam.y);

    if (isWalkable(targetWorldX, targetWorldY, isGhost)) {
      waypointRef.current = {
        x: targetWorldX,
        y: targetWorldY,
        active: true,
        ringTime: performance.now(),
      };
    }
  };

  // Update local pos if server respawns / teleports player (e.g. after meeting)
  useEffect(() => {
    if (myPlayerObj && typeof myPlayerObj.x === "number") {
      const dist = Math.hypot(
        localPosRef.current.x - myPlayerObj.x,
        localPosRef.current.y - myPlayerObj.y
      );
      if (dist > 180) {
        localPosRef.current.x = myPlayerObj.x;
        localPosRef.current.y = myPlayerObj.y;
        waypointRef.current.active = false;
      }
    }
  }, [myPlayerObj?.x, myPlayerObj?.y]);

  // Handle remote position updates from socket
  useEffect(() => {
    if (!socket) return;

    const handlePosUpdate = (data) => {
      if (data.socketId === myPlayerId) return;

      const existing = remotePlayersRef.current.get(data.socketId);
      if (existing) {
        existing.targetX = data.x;
        existing.targetY = data.y;
        existing.currentRoom = data.currentRoom;
        if (typeof data.facingLeft === "boolean") existing.facingLeft = data.facingLeft;
        if (typeof data.isMoving === "boolean") existing.isMoving = data.isMoving;
      } else {
        remotePlayersRef.current.set(data.socketId, {
          x: data.x,
          y: data.y,
          targetX: data.x,
          targetY: data.y,
          facingLeft: !!data.facingLeft,
          isMoving: !!data.isMoving,
          walkCycle: 0,
          currentRoom: data.currentRoom,
        });
      }
    };

    socket.on("impostor:pos_update", handlePosUpdate);
    return () => {
      socket.off("impostor:pos_update", handlePosUpdate);
    };
  }, [socket, myPlayerId]);

  // Sync initial player positions when action phase starts
  useEffect(() => {
    if (!socket) return;

    const handleActionPhaseStart = (data) => {
      if (data?.playerPositions) {
        data.playerPositions.forEach((p) => {
          if (p.socketId === myPlayerId) {
            localPosRef.current.x = p.x;
            localPosRef.current.y = p.y;
            waypointRef.current.active = false;
          } else {
            remotePlayersRef.current.set(p.socketId, {
              x: p.x,
              y: p.y,
              targetX: p.x,
              targetY: p.y,
              facingLeft: false,
              isMoving: false,
              walkCycle: 0,
              currentRoom: p.currentRoom,
            });
          }
        });
      }
    };

    socket.on("impostor:action_phase_start", handleActionPhaseStart);
    return () => {
      socket.off("impostor:action_phase_start", handleActionPhaseStart);
    };
  }, [socket, myPlayerId]);

  // Game event effects (screen shake, kill flash, vent puff)
  useEffect(() => {
    if (!socket) return;

    const handleKilled = () => {
      shakeRef.current = { intensity: 14, duration: 0.45 };
      redFlashRef.current = 0.75;
    };

    const handleMeeting = () => {
      shakeRef.current = { intensity: 8, duration: 0.35 };
      waypointRef.current.active = false;
    };

    const handleSabotage = () => {
      redFlashRef.current = 0.55;
    };

    const handleVentUsed = (data) => {
      const targetVent = VENT_LOCATIONS.find((v) => v.room === data.toRoom);
      if (targetVent) {
        for (let i = 0; i < 14; i++) {
          particlesRef.current.push({
            x: targetVent.x + (Math.random() - 0.5) * 18,
            y: targetVent.y + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 35,
            vy: (Math.random() - 0.5) * 35,
            life: 0.55,
            maxLife: 0.55,
            size: Math.random() * 7 + 5,
            color: "rgba(168, 85, 247, 0.7)",
          });
        }
      }
    };

    socket.on("impostor:killed", handleKilled);
    socket.on("impostor:meeting_started", handleMeeting);
    socket.on("impostor:sabotage_triggered", handleSabotage);
    socket.on("impostor:vent_used", handleVentUsed);

    return () => {
      socket.off("impostor:killed", handleKilled);
      socket.off("impostor:meeting_started", handleMeeting);
      socket.off("impostor:sabotage_triggered", handleSabotage);
      socket.off("impostor:vent_used", handleVentUsed);
    };
  }, [socket]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      if (
        key === "w" ||
        key === "W" ||
        key === "ArrowUp" ||
        key === "s" ||
        key === "S" ||
        key === "ArrowDown" ||
        key === "a" ||
        key === "A" ||
        key === "ArrowLeft" ||
        key === "d" ||
        key === "D" ||
        key === "ArrowRight"
      ) {
        keysDownRef.current[key.toLowerCase()] = true;
        keysDownRef.current[key] = true;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key;
      if (
        key === "w" ||
        key === "W" ||
        key === "ArrowUp" ||
        key === "s" ||
        key === "S" ||
        key === "ArrowDown" ||
        key === "a" ||
        key === "A" ||
        key === "ArrowLeft" ||
        key === "d" ||
        key === "D" ||
        key === "ArrowRight"
      ) {
        keysDownRef.current[key.toLowerCase()] = false;
        keysDownRef.current[key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Main Canvas Render & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let lastTime = performance.now();

    const renderLoop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Ensure canvas matches client dimensions
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const viewW = canvas.width;
      const viewH = canvas.height;

      // 1. UPDATE LOCAL PLAYER POSITION FROM INPUT (Keyboard + Joystick + Waypoint)
      let inputX = 0;
      let inputY = 0;

      // Check keyboard
      const keys = keysDownRef.current;
      if (keys.w || keys.arrowup) inputY -= 1;
      if (keys.s || keys.arrowdown) inputY += 1;
      if (keys.a || keys.arrowleft) inputX -= 1;
      if (keys.d || keys.arrowright) inputX += 1;

      // Combine with joystick if active
      if (joystickVector && (joystickVector.x !== 0 || joystickVector.y !== 0)) {
        inputX = joystickVector.x;
        inputY = joystickVector.y;
      }

      const manualLen = Math.hypot(inputX, inputY);
      if (manualLen > 0.05) {
        // Manual control overrides tap-to-move waypoint
        waypointRef.current.active = false;
      } else if (waypointRef.current.active && typeof waypointRef.current.x === "number") {
        // Waypoint navigation
        const toX = waypointRef.current.x - localPosRef.current.x;
        const toY = waypointRef.current.y - localPosRef.current.y;
        const distToWaypoint = Math.hypot(toX, toY);
        if (distToWaypoint < 12) {
          waypointRef.current.active = false;
        } else {
          inputX = toX / distToWaypoint;
          inputY = toY / distToWaypoint;
        }
      }

      const inputLen = Math.hypot(inputX, inputY);
      const isMoving = inputLen > 0.05;

      const SPEED = isGhost ? 280 : 210; // Pixels per second
      if (isMoving) {
        const normX = inputX / (inputLen > 1 ? inputLen : 1);
        const normY = inputY / (inputLen > 1 ? inputLen : 1);

        const nextX = localPosRef.current.x + normX * SPEED * dt;
        const nextY = localPosRef.current.y + normY * SPEED * dt;

        let movedX = false;
        let movedY = false;

        // Collision check (separate axes for sliding along walls)
        if (isWalkable(nextX, localPosRef.current.y, isGhost)) {
          localPosRef.current.x = nextX;
          movedX = true;
        }
        if (isWalkable(localPosRef.current.x, nextY, isGhost)) {
          localPosRef.current.y = nextY;
          movedY = true;
        }

        // If navigating to waypoint and stuck in wall, cancel waypoint
        if (waypointRef.current.active && !movedX && !movedY) {
          waypointRef.current.active = false;
        }

        if (normX < -0.1) localPosRef.current.facingLeft = true;
        else if (normX > 0.1) localPosRef.current.facingLeft = false;

        localPosRef.current.walkCycle += dt * 14;
        localPosRef.current.isMoving = true;

        // Spawn cute footstep dust particles
        if (!isGhost && Math.random() < 0.28) {
          particlesRef.current.push({
            x: localPosRef.current.x + (Math.random() - 0.5) * 8,
            y: localPosRef.current.y + 14 + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            life: 0.35,
            maxLife: 0.35,
            size: Math.random() * 3.5 + 2.5,
            color: "rgba(203, 213, 225, 0.6)",
          });
        }
      } else {
        localPosRef.current.isMoving = false;
        localPosRef.current.walkCycle = 0;
      }

      const currentRoomId = getRoomAt(localPosRef.current.x, localPosRef.current.y);

      // Throttled position emit to server (every 55ms)
      const now = performance.now();
      if (now - lastEmitTimeRef.current > 55 && socket) {
        lastEmitTimeRef.current = now;
        socket.emit("impostor:pos", {
          roomId: room?.id,
          x: Math.round(localPosRef.current.x),
          y: Math.round(localPosRef.current.y),
          currentRoom: currentRoomId,
          facingLeft: localPosRef.current.facingLeft,
          isMoving: localPosRef.current.isMoving,
        });
      }

      // 2. LERP REMOTE PLAYERS
      remotePlayersRef.current.forEach((remote) => {
        if (typeof remote.targetX === "number") {
          const dx = remote.targetX - remote.x;
          const dy = remote.targetY - remote.y;
          remote.x += dx * 0.25;
          remote.y += dy * 0.25;
          if (Math.hypot(dx, dy) > 2) {
            remote.walkCycle = (remote.walkCycle || 0) + dt * 12;
          } else {
            remote.walkCycle = 0;
          }
        }
      });

      // 3. CAMERA FOLLOW (Smoothly center on local player)
      const camTargetX = localPosRef.current.x - viewW / 2;
      const camTargetY = localPosRef.current.y - viewH / 2;
      const camX = Math.max(0, Math.min(MAP_WIDTH - viewW, camTargetX));
      const camY = Math.max(0, Math.min(MAP_HEIGHT - viewH, camTargetY));
      camRef.current = { x: camX, y: camY };

      // Screen Shake calculation
      let shakeX = 0;
      let shakeY = 0;
      if (shakeRef.current.duration > 0) {
        shakeRef.current.duration -= dt;
        const progress = Math.max(0, shakeRef.current.duration / 0.45);
        const s = shakeRef.current.intensity * progress;
        shakeX = (Math.random() - 0.5) * s * 2;
        shakeY = (Math.random() - 0.5) * s * 2;
      }

      // 4. DRAWING PIPELINE
      ctx.save();
      ctx.clearRect(0, 0, viewW, viewH);

      // Space Starfield Background
      ctx.fillStyle = "#0A0D18";
      ctx.fillRect(0, 0, viewW, viewH);

      // Draw Parallax Stars
      starsRef.current.forEach((star) => {
        const sx = star.x - camX * 0.3;
        const sy = star.y - camY * 0.3;
        if (sx >= -10 && sx <= viewW + 10 && sy >= -10 && sy <= viewH + 10) {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Translate camera to World Space with screen shake
      ctx.translate(-camX + shakeX, -camY + shakeY);

      // A. Draw Outer Hull Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      for (const key of Object.keys(ROOMS_MAP)) {
        const r = ROOMS_MAP[key];
        ctx.fillRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16);
      }
      for (const c of CORRIDORS) {
        ctx.fillRect(c.x - 6, c.y - 6, c.w + 12, c.h + 12);
      }

      // B. Draw Corridors (Metallic Hallways)
      CORRIDORS.forEach((c) => {
        ctx.fillStyle = "#E4EBF2";
        ctx.fillRect(c.x, c.y, c.w, c.h);

        // Corridor side borders
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 4;
        ctx.strokeRect(c.x, c.y, c.w, c.h);

        // Subtle corridor floor metal plates
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = c.x + 20; gx < c.x + c.w; gx += 20) {
          ctx.moveTo(gx, c.y);
          ctx.lineTo(gx, c.y + c.h);
        }
        ctx.stroke();
      });

      // C. Draw Rooms
      for (const key of Object.keys(ROOMS_MAP)) {
        const r = ROOMS_MAP[key];

        // Room floor
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x, r.y, r.w, r.h);

        // Room tile grid pattern
        ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let gx = r.x + 30; gx < r.x + r.w; gx += 30) {
          ctx.moveTo(gx, r.y);
          ctx.lineTo(gx, r.y + r.h);
        }
        for (let gy = r.y + 30; gy < r.y + r.h; gy += 30) {
          ctx.moveTo(r.x, gy);
          ctx.lineTo(r.x + r.w, gy);
        }
        ctx.stroke();

        // Room wall border
        ctx.strokeStyle = r.borderColor;
        ctx.lineWidth = 5;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // Room Name Label on floor
        ctx.fillStyle = r.borderColor;
        ctx.font = "900 15px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(r.name.toUpperCase(), r.x + r.w / 2, r.y + 26);
      }

      // D. Draw Solid Props & Room Centers
      SOLID_OBSTACLES.forEach((obs) => {
        if (obs.type === "circle") {
          // Cafeteria Meeting Table or Medbay Scanner
          if (obs.x === 700 && obs.y === 200) {
            // Cafeteria round meeting table
            ctx.fillStyle = "#E2E8F0";
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#94A3B8";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner glass rim
            ctx.fillStyle = "#F1F5F9";
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.r - 14, 0, Math.PI * 2);
            ctx.fill();

            // Red Emergency Button in center
            ctx.fillStyle = "#FF4D4D";
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#B91C1C";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Glass reflection highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(obs.x - 5, obs.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#3A332C";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("EMERGENCY", obs.x, obs.y + 28);
          } else if (obs.x === 400 && obs.y === 255) {
            // Medbay Scanner bed
            ctx.fillStyle = "#99F6E4";
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#0D9488";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Pulsing holographic scan circle
            const pulse = (Math.sin(time * 0.005) + 1) * 0.5;
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.4 + pulse * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, (obs.r - 8) * (0.4 + pulse * 0.6), 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#0F766E";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("MED SCAN", obs.x, obs.y);
          }
        } else if (obs.type === "rect") {
          // Tables / pillars
          ctx.fillStyle = "#CBD5E1";
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = "#64748B";
          ctx.lineWidth = 3;
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

          if (obs.x === 100 && obs.y === 410) {
            // Reactor glowing core
            const pulse = (Math.sin(time * 0.006) + 1) * 0.5;
            ctx.fillStyle = `rgba(168, 85, 247, ${0.7 + pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#7E22CE";
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      });

      // E. Draw Vents
      VENT_LOCATIONS.forEach((vent) => {
        ctx.fillStyle = "#475569";
        ctx.fillRect(vent.x - 15, vent.y - 10, 30, 20);
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 2;
        ctx.strokeRect(vent.x - 15, vent.y - 10, 30, 20);

        // Vent grates slits
        ctx.fillStyle = "#0F172A";
        for (let i = -10; i <= 10; i += 5) {
          ctx.fillRect(vent.x + i - 1, vent.y - 7, 2, 14);
        }

        // Impostor vent highlight glow
        if (isImpostor && !isGhost) {
          ctx.strokeStyle = "rgba(168, 85, 247, 0.75)";
          ctx.lineWidth = 2;
          ctx.strokeRect(vent.x - 17, vent.y - 12, 34, 24);
        }
      });

      // F. Draw Task Interactive Consoles
      TASK_STATIONS.forEach((task) => {
        const isMyPendingTask = myTasks.some((t) => t.id === task.id && !t.completed);

        // Console base
        ctx.fillStyle = task.color;
        ctx.fillRect(task.x - 14, task.y - 14, 28, 28);
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(task.x - 14, task.y - 14, 28, 28);

        // Inner screen
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(task.x - 9, task.y - 9, 18, 18);

        // Floating yellow exclamation icon if my pending task
        if (isMyPendingTask) {
          const bounce = Math.sin(time * 0.008) * 4;
          ctx.fillStyle = "#FACC15";
          ctx.beginPath();
          ctx.arc(task.x, task.y - 24 + bounce, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#854D0E";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#854D0E";
          ctx.font = "black 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("!", task.x, task.y - 24 + bounce);
        }
      });

      // G. Draw Active Sabotage Warning Beacon
      if (activeSabotage) {
        const targetStation = SABOTAGE_STATIONS[activeSabotage.type];
        if (targetStation) {
          const pulse = (Math.sin(time * 0.01) + 1) * 0.5;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.4})`;
          ctx.beginPath();
          ctx.arc(targetStation.x, targetStation.y, 35 + pulse * 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#DC2626";
          ctx.beginPath();
          ctx.arc(targetStation.x, targetStation.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "black 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("⚠", targetStation.x, targetStation.y);
        }
      }

      // H. Draw Dead Bodies (Half Bean + White Bone + Blood Stain)
      const deadBodies = room?.impostorInfo?.deadBodies || [];
      deadBodies.forEach((body) => {
        if (body.reported) return;
        const bx = body.x || 700;
        const by = body.y || 220;

        // Blood puddle
        ctx.fillStyle = "rgba(185, 28, 28, 0.75)";
        ctx.beginPath();
        ctx.ellipse(bx, by + 10, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Half astronaut torso lying down
        ctx.fillStyle = "#C51111"; // Default red corpse or player color
        ctx.beginPath();
        ctx.ellipse(bx - 4, by + 4, 16, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Exposed white bone sticking out
        ctx.fillStyle = "#F8FAFC";
        ctx.fillRect(bx - 3, by - 12, 6, 14);
        // Bone joint caps
        ctx.beginPath();
        ctx.arc(bx - 4, by - 12, 4, 0, Math.PI * 2);
        ctx.arc(bx + 4, by - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label: Dead Body
        ctx.fillStyle = "#EF4444";
        ctx.font = "black 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`💀 ${body.victimName}`, bx, by - 22);
      });

      // I. DRAW ALL CHARACTERS (Sorted by Y for depth layering)
      const allRenderPlayers = [];

      // Add Remote Players
      (room?.players || []).forEach((p, idx) => {
        if (p.socketId === myPlayerId) return;

        const rem = remotePlayersRef.current.get(p.socketId);
        const px = rem ? rem.x : p.x || 700;
        const py = rem ? rem.y : p.y || 220;
        const facingLeft = rem ? rem.facingLeft : !!p.facingLeft;
        const isMoving = rem ? rem.isMoving : !!p.isMoving;
        const walkCycle = rem ? rem.walkCycle : 0;

        allRenderPlayers.push({
          isSelf: false,
          socketId: p.socketId,
          name: p.name,
          role: p.role,
          isAlive: p.isAlive,
          isGhost: !p.isAlive,
          x: px,
          y: py,
          facingLeft,
          isMoving,
          walkCycle,
          color: getPlayerColor(idx),
        });
      });

      // Add Local Player
      allRenderPlayers.push({
        isSelf: true,
        socketId: myPlayerId,
        name: myPlayerObj?.name || "Saya",
        role: myRoleData?.role,
        isAlive: !isGhost,
        isGhost: isGhost,
        x: localPosRef.current.x,
        y: localPosRef.current.y,
        facingLeft: localPosRef.current.facingLeft,
        isMoving: localPosRef.current.isMoving,
        walkCycle: localPosRef.current.walkCycle,
        color: getPlayerColor(0),
      });

      // Sort by Y coordinate so foreground players render on top
      allRenderPlayers.sort((a, b) => a.y - b.y);

      // Render each character
      allRenderPlayers.forEach((char) => {
        drawAstronaut(ctx, char);
      });

      // Update and draw dynamic particles (Dust & Vent Smoke)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= dt;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const pAlpha = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pAlpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1 - pAlpha) * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Animated Waypoint Marker
      const wp = waypointRef.current;
      if (wp && wp.ringTime && performance.now() - wp.ringTime < 1400) {
        const elapsed = (performance.now() - wp.ringTime) / 1000;
        const fade = Math.max(0, 1 - elapsed / 1.4);
        const radius = ((elapsed * 45) % 24) + 6;

        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${fade * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${fade * 0.75})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, Math.max(2, radius - 7), 0, Math.PI * 2);
        ctx.stroke();

        // Target dot
        ctx.fillStyle = `rgba(56, 189, 248, ${fade})`;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. PROXIMITY DETECTION
      const lx = localPosRef.current.x;
      const ly = localPosRef.current.y;

      // Nearest Task
      let nearestTask = null;
      let minTaskDist = 999;
      myTasks.forEach((t) => {
        if (t.completed) return;
        const st = TASK_STATIONS.find((s) => s.id === t.id);
        if (st) {
          const d = Math.hypot(lx - st.x, ly - st.y);
          if (d < 65 && d < minTaskDist) {
            minTaskDist = d;
            nearestTask = t;
          }
        }
      });

      // Emergency Button proximity
      const emergencyDist = Math.hypot(lx - EMERGENCY_BUTTON.x, ly - EMERGENCY_BUTTON.y);
      const canEmergency = emergencyDist < 70 && !isGhost;

      // Nearest Dead Body for REPORT
      let nearestBody = null;
      let minBodyDist = 999;
      deadBodies.forEach((b) => {
        if (b.reported) return;
        const bx = b.x || 700;
        const by = b.y || 220;
        const d = Math.hypot(lx - bx, ly - by);
        if (d < 80 && d < minBodyDist) {
          minBodyDist = d;
          nearestBody = b;
        }
      });
      const canReport = !!nearestBody && !isGhost;

      // Nearest Crewmate for KILL (Impostor only)
      let targetCrewmate = null;
      if (isImpostor && !isGhost) {
        let minCrewDist = 999;
        (room?.players || []).forEach((p) => {
          if (p.socketId === myPlayerId || !p.isAlive || p.role === "IMPOSTOR") return;
          const rem = remotePlayersRef.current.get(p.socketId);
          const px = rem ? rem.x : p.x || 700;
          const py = rem ? rem.y : p.y || 220;
          const d = Math.hypot(lx - px, ly - py);
          if (d < 70 && d < minCrewDist) {
            minCrewDist = d;
            targetCrewmate = p;
          }
        });
      }
      const canKill = !!targetCrewmate && killCooldownSecs <= 0;

      // Nearest Vent (Impostor only)
      let nearestVent = null;
      if (isImpostor && !isGhost) {
        let minVentDist = 999;
        VENT_LOCATIONS.forEach((v) => {
          const d = Math.hypot(lx - v.x, ly - v.y);
          if (d < 65 && d < minVentDist) {
            minVentDist = d;
            nearestVent = v;
          }
        });
      }
      const canVent = !!nearestVent;

      // Active Sabotage Fix station proximity
      let canFixSabotage = false;
      if (activeSabotage && !isGhost) {
        const sabStation = SABOTAGE_STATIONS[activeSabotage.type];
        if (sabStation) {
          const d = Math.hypot(lx - sabStation.x, ly - sabStation.y);
          canFixSabotage = d < 70;
        }
      }

      // Draw In-World Floating Action Prompts on interactive items
      const badgeBob = Math.sin(time * 0.006) * 3;

      if (canEmergency) {
        drawFloatingBadge(
          ctx,
          EMERGENCY_BUTTON.x,
          EMERGENCY_BUTTON.y - 32 + badgeBob,
          "[E] EMERGENCY",
          "#DC2626",
          "#FFFFFF"
        );
      } else if (canFixSabotage && activeSabotage) {
        const sabSt = SABOTAGE_STATIONS[activeSabotage.type];
        if (sabSt) {
          drawFloatingBadge(
            ctx,
            sabSt.x,
            sabSt.y - 30 + badgeBob,
            "[E] PERBAIKI!",
            "#DC2626",
            "#FFFFFF"
          );
        }
      } else if (nearestTask) {
        const st = TASK_STATIONS.find((s) => s.id === nearestTask.id);
        if (st) {
          drawFloatingBadge(
            ctx,
            st.x,
            st.y - 32 + badgeBob,
            "[E] KERJAKAN",
            "#2563EB",
            "#FFFFFF"
          );
        }
      }

      if (canReport && nearestBody) {
        drawFloatingBadge(
          ctx,
          nearestBody.x || 700,
          (nearestBody.y || 220) - 34 + badgeBob,
          "[R] REPORT",
          "#DC2626",
          "#FFFFFF"
        );
      }

      if (canKill && targetCrewmate) {
        const remTarget = remotePlayersRef.current.get(targetCrewmate.socketId);
        const tx = remTarget ? remTarget.x : targetCrewmate.x || 700;
        const ty = remTarget ? remTarget.y : targetCrewmate.y || 220;
        drawFloatingBadge(
          ctx,
          tx,
          ty - 54 + badgeBob,
          "[Q] KILL",
          "#991B1B",
          "#FFFFFF"
        );
      }

      if (canVent && nearestVent) {
        drawFloatingBadge(
          ctx,
          nearestVent.x,
          nearestVent.y - 24 + badgeBob,
          "[V] VENT",
          "#7C3AED",
          "#FFFFFF"
        );
      }

      ctx.restore(); // Restore World Transform

      // 6. SCREEN-SPACE OVERLAYS (Kill Red Flash & Sabotage Warning Vignette)
      if (redFlashRef.current > 0.01) {
        redFlashRef.current = Math.max(0, redFlashRef.current - dt * 1.8);
        ctx.fillStyle = `rgba(239, 68, 68, ${redFlashRef.current * 0.4})`;
        ctx.fillRect(0, 0, viewW, viewH);
      }

      if (activeSabotage) {
        const sabPulse = (Math.sin(time * 0.007) + 1) * 0.5;
        const grad = ctx.createRadialGradient(
          viewW / 2,
          viewH / 2,
          Math.min(viewW, viewH) * 0.35,
          viewW / 2,
          viewH / 2,
          Math.max(viewW, viewH) * 0.68
        );
        grad.addColorStop(0, "rgba(239, 68, 68, 0)");
        grad.addColorStop(1, `rgba(239, 68, 68, ${0.12 + sabPulse * 0.22})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, viewW, viewH);
      }

      // 7. DRAW MINIMAP (Top Right Corner)
      drawMiniMap(ctx, viewW, viewH, lx, ly, myTasks, activeSabotage);

      // 8. STATE-DIFFED PROXIMITY DISPATCH (Eliminates 60 FPS React re-renders)
      const canUse = !!nearestTask || canEmergency || canFixSabotage;
      const prev = prevProximityRef.current;
      const changed =
        prev.canUse !== canUse ||
        prev.activeTaskId !== (nearestTask ? nearestTask.id : null) ||
        prev.canEmergency !== canEmergency ||
        prev.canFixSabotage !== canFixSabotage ||
        prev.canReport !== canReport ||
        prev.nearestBodyId !== (nearestBody ? nearestBody.id : null) ||
        prev.canKill !== canKill ||
        prev.targetCrewmateId !== (targetCrewmate ? targetCrewmate.socketId : null) ||
        prev.canVent !== canVent ||
        prev.nearestVentRoom !== (nearestVent ? nearestVent.room : null) ||
        prev.currentRoom !== currentRoomId;

      if (changed) {
        prevProximityRef.current = {
          canUse,
          activeTaskId: nearestTask ? nearestTask.id : null,
          canEmergency,
          canFixSabotage,
          canReport,
          nearestBodyId: nearestBody ? nearestBody.id : null,
          canKill,
          targetCrewmateId: targetCrewmate ? targetCrewmate.socketId : null,
          canVent,
          nearestVentRoom: nearestVent ? nearestVent.room : null,
          currentRoom: currentRoomId,
        };

        if (onProximityChange) {
          onProximityChange({
            canUse,
            activeTask: nearestTask,
            canEmergency,
            canFixSabotage,
            canReport,
            nearestBody,
            canKill,
            targetCrewmate,
            canVent,
            nearestVent,
            currentRoom: currentRoomId,
          });
        }
      }

      // Loop
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    room,
    socket,
    myPlayerId,
    myRoleData,
    isImpostor,
    isGhost,
    killCooldownSecs,
    joystickVector,
    activeSabotage,
    myTasks,
    onProximityChange,
  ]);

  /**
   * Draw classic Among Us bean astronaut
   */
  function drawAstronaut(ctx, char) {
    ctx.save();
    ctx.translate(char.x, char.y);

    if (char.facingLeft) {
      ctx.scale(-1, 1);
    }

    if (char.isGhost) {
      ctx.globalAlpha = 0.45;
    }

    const color = char.color || getPlayerColor(0);
    const walkBob = char.isMoving ? Math.sin(char.walkCycle) * 3.5 : 0;
    const legSwing = char.isMoving ? Math.sin(char.walkCycle) * 5 : 0;

    // A. Backpack (Oxygen Tank)
    ctx.fillStyle = color.dark;
    ctx.fillRect(-22, -18 + walkBob, 10, 26);
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-22, -18 + walkBob, 10, 26);

    // B. Legs (or Ghost Tail)
    if (!char.isGhost) {
      // Left leg
      ctx.fillStyle = color.dark;
      ctx.beginPath();
      ctx.roundRect(-12 - legSwing, 12, 10, 16, 5);
      ctx.fill();
      ctx.stroke();

      // Right leg
      ctx.fillStyle = color.primary;
      ctx.beginPath();
      ctx.roundRect(2 + legSwing, 12, 10, 16, 5);
      ctx.fill();
      ctx.stroke();
    } else {
      // Wavy ghostly tail
      ctx.fillStyle = color.light;
      ctx.beginPath();
      ctx.moveTo(-12, 14);
      ctx.bezierCurveTo(-16, 28, 0, 32, 2, 22);
      ctx.bezierCurveTo(4, 30, 14, 28, 12, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // C. Main Body (Pill bean)
    ctx.fillStyle = color.primary;
    ctx.beginPath();
    ctx.roundRect(-14, -26 + walkBob, 28, 42, 14);
    ctx.fill();
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // D. Visor (Glass helmet)
    ctx.fillStyle = "#7DD3FC";
    ctx.beginPath();
    ctx.roundRect(1, -20 + walkBob, 18, 14, 7);
    ctx.fill();
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Visor white reflection highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.ellipse(8, -17 + walkBob, 5, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Reset flip for nametag
    if (char.facingLeft) {
      ctx.scale(-1, 1);
    }

    // E. Floating Name Tag above head
    const isTeammateImpostor = isImpostor && char.role === "IMPOSTOR";
    ctx.font = "bold 11px sans-serif";
    const nameWidth = ctx.measureText(char.name).width;

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(-nameWidth / 2 - 8, -48 + walkBob, nameWidth + 16, 17, 8);
    ctx.fill();

    ctx.fillStyle = isTeammateImpostor ? "#FF4D4D" : "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      isTeammateImpostor ? `${char.name} [IMP]` : char.name,
      0,
      -39 + walkBob
    );

    ctx.restore();
  }

  /**
   * Draw mini-map overlay in top-right corner
   */
  function drawMiniMap(ctx, viewW, viewH, lx, ly, tasks, activeSab) {
    const mapW = 150;
    const mapH = 100;
    const pad = 12;
    const mx = viewW - mapW - pad;
    const my = pad;

    ctx.save();
    // Backdrop
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(mx, my, mapW, mapH, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const scaleX = mapW / MAP_WIDTH;
    const scaleY = mapH / MAP_HEIGHT;

    // Draw miniature rooms
    for (const key of Object.keys(ROOMS_MAP)) {
      const r = ROOMS_MAP[key];
      ctx.fillStyle = r.borderColor;
      ctx.fillRect(mx + r.x * scaleX, my + r.y * scaleY, r.w * scaleX, r.h * scaleY);
    }

    // Pending tasks markers (Yellow dots)
    tasks.forEach((t) => {
      if (t.completed) return;
      const st = TASK_STATIONS.find((s) => s.id === t.id);
      if (st) {
        ctx.fillStyle = "#FACC15";
        ctx.beginPath();
        ctx.arc(mx + st.x * scaleX, my + st.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Active Sabotage marker (Red pulsing dot)
    if (activeSab) {
      const st = SABOTAGE_STATIONS[activeSab.type];
      if (st) {
        ctx.fillStyle = "#EF4444";
        ctx.beginPath();
        ctx.arc(mx + st.x * scaleX, my + st.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Local player marker (Bright cyan / white blinking dot)
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.arc(mx + lx * scaleX, my + ly * scaleY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw glowing in-world action prompt badge
   */
  function drawFloatingBadge(ctx, x, y, text, bgColor, textColor) {
    ctx.save();
    ctx.font = "900 11px sans-serif";
    const textWidth = ctx.measureText(text).width;
    const padX = 9;
    const w = textWidth + padX * 2;
    const h = 22;

    // Glowing shadow
    ctx.shadowColor = bgColor;
    ctx.shadowBlur = 12;

    // Background pill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 11);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Text
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handleCanvasPointerDown}
      className="w-full h-[56vh] min-h-[380px] max-h-[580px] rounded-3xl block shadow-inner bg-[#0B0D1B] touch-none cursor-crosshair"
    />
  );
}
