import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Avatar";
import TimerDisplay from "../../components/TimerDisplay";
import { playSound } from "../../utils/sound";
import SpaceArenaCanvas from "./SpaceArenaCanvas";
import VirtualJoystick from "./VirtualJoystick";
import { ROOMS_MAP } from "./shipMap";
import {
  Rocket,
  Skull,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Zap,
  Coffee,
  Compass,
  HeartPulse,
  Wind,
  Shield,
  CreditCard,
  Sliders,
  Trash2,
  Activity,
  Cpu,
  Send,
  Users,
  Eye,
  X,
  FastForward,
  Flame,
  Radio,
  Ghost as GhostIcon,
} from "lucide-react";

export default function ImpostorGame({
  room,
  socket,
  identity,
  nickname,
  myRoleData,
  isHost,
  isSpectator,
  isMyPlayerAlive,
  isReadyConfirmed,
  readyStats,
  onMarkReady,
  onSendDiscussionMessage,
}) {
  const role = myRoleData?.role || "CREWMATE";
  const isImpostor = role === "IMPOSTOR";
  const isCrewmate = role === "CREWMATE";

  // Local game state
  const [currentRoom, setCurrentRoom] = useState("cafeteria");
  const [activeTaskModal, setActiveTaskModal] = useState(null); // task object
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [showVentModal, setShowVentModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  // Kill cooldown tick state
  const [killCooldownSecs, setKillCooldownSecs] = useState(0);

  // 2D Movement & Proximity State
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [proximity, setProximity] = useState({
    canUse: false,
    activeTask: null,
    canEmergency: false,
    canFixSabotage: false,
    canReport: false,
    nearestBody: null,
    canKill: false,
    targetCrewmate: null,
    canVent: false,
    nearestVent: null,
    currentRoom: "cafeteria",
  });

  // Mini-task states
  // 1. Wiring
  const [wiringLeftSelected, setWiringLeftSelected] = useState(null);
  const [wiringConnected, setWiringConnected] = useState({});
  // 2. Unlock Manifolds (1-10)
  const [manifoldNext, setManifoldNext] = useState(1);
  const [manifoldButtons, setManifoldButtons] = useState([]);
  // 3. Swipe Card
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeStatus, setSwipeStatus] = useState("Geser kartu dari kiri ke kanan");
  // 4. Clean Filter (leaves)
  const [remainingLeaves, setRemainingLeaves] = useState([1, 2, 3, 4, 5]);
  // 5. Divert Power
  const [powerSwitches, setPowerSwitches] = useState([false, false, false]);

  const alivePlayers = (room?.players || []).filter((p) => p.isAlive && p.connected && !p.isSpectator);
  const myPlayerObj = (room?.players || []).find(
    (p) => p.socketId === socket?.id || (identity?.playerId && p.playerId === identity.playerId)
  );
  const isGhost = myPlayerObj ? !myPlayerObj.isAlive : false;

  // Track room from server
  useEffect(() => {
    if (myPlayerObj?.currentRoom) {
      setCurrentRoom(myPlayerObj.currentRoom);
    }
  }, [myPlayerObj?.currentRoom]);

  // Kill Cooldown countdown timer
  useEffect(() => {
    if (!isImpostor || !myPlayerObj) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const endsAt = myPlayerObj.killCooldownEndsAt || 0;
      if (endsAt > now) {
        setKillCooldownSecs(Math.ceil((endsAt - now) / 1000));
      } else {
        setKillCooldownSecs(0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isImpostor, myPlayerObj?.killCooldownEndsAt]);

  // Sound triggers on game events
  useEffect(() => {
    if (!socket) return;

    const handleActionPhase = () => {
      playSound("turn");
      setActiveTaskModal(null);
    };

    const handleKilled = () => {
      playSound("kill");
    };

    const handleBodySpawned = () => {
      // Body spawned
    };

    const handleSabotageTriggered = () => {
      playSound("sabotage");
    };

    const handleMeetingStarted = () => {
      playSound("emergency");
      setActiveTaskModal(null);
      setShowSabotageModal(false);
      setShowVentModal(false);
    };

    const handleEjectionResult = () => {
      playSound("eliminated");
    };

    const handleVentUsed = () => {
      playSound("vent");
    };

    socket.on("impostor:action_phase_start", handleActionPhase);
    socket.on("impostor:killed", handleKilled);
    socket.on("impostor:body_spawned", handleBodySpawned);
    socket.on("impostor:sabotage_triggered", handleSabotageTriggered);
    socket.on("impostor:meeting_started", handleMeetingStarted);
    socket.on("impostor:ejection_result", handleEjectionResult);
    socket.on("impostor:vent_used", handleVentUsed);

    return () => {
      socket.off("impostor:action_phase_start", handleActionPhase);
      socket.off("impostor:killed", handleKilled);
      socket.off("impostor:body_spawned", handleBodySpawned);
      socket.off("impostor:sabotage_triggered", handleSabotageTriggered);
      socket.off("impostor:meeting_started", handleMeetingStarted);
      socket.off("impostor:ejection_result", handleEjectionResult);
      socket.off("impostor:vent_used", handleVentUsed);
    };
  }, [socket]);

  // Scroll chat during meeting
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [room?.discussionMessages?.length]);

  // Initialize manifold buttons when task opened
  const startManifoldTask = (task) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => 0.5 - Math.random());
    setManifoldButtons(nums);
    setManifoldNext(1);
    setActiveTaskModal(task);
  };

  const startSwipeTask = (task) => {
    setSwipeProgress(0);
    setSwipeStatus("Geser kartu dari kiri ke kanan");
    setActiveTaskModal(task);
  };

  const startWiringTask = (task) => {
    setWiringLeftSelected(null);
    setWiringConnected({});
    setActiveTaskModal(task);
  };

  const startFilterTask = (task) => {
    setRemainingLeaves([1, 2, 3, 4, 5]);
    setActiveTaskModal(task);
  };

  const startDivertTask = (task) => {
    setPowerSwitches([false, false, false]);
    setActiveTaskModal(task);
  };

  const openTaskModal = (task) => {
    if (task.completed) return;
    if (task.id === "manifolds") startManifoldTask(task);
    else if (task.id === "swipe_card") startSwipeTask(task);
    else if (task.id === "wiring") startWiringTask(task);
    else if (task.id === "clean_filter") startFilterTask(task);
    else if (task.id === "divert_power") startDivertTask(task);
    else {
      // General task
      setActiveTaskModal(task);
    }
  };

  const handleFinishTask = (taskId) => {
    playSound("task");
    socket.emit("impostor:task_complete", { roomId: room.id, taskId });
    setActiveTaskModal(null);
  };

  // Actions
  const handleMove = (targetRoomId) => {
    if (currentRoom === targetRoomId) return;
    socket.emit("impostor:move", { roomId: room.id, targetRoomId });
    setCurrentRoom(targetRoomId);
  };

  const handleVent = (targetRoomId) => {
    socket.emit("impostor:vent", { roomId: room.id, targetRoomId });
    setCurrentRoom(targetRoomId);
    setShowVentModal(false);
  };

  const handleKill = (targetSocketId) => {
    socket.emit("impostor:kill", { roomId: room.id, targetSocketId });
  };

  const handleTriggerSabotage = (sabotageType) => {
    socket.emit("impostor:sabotage", { roomId: room.id, sabotageType });
    setShowSabotageModal(false);
  };

  const handleFixSabotage = () => {
    socket.emit("impostor:fix_sabotage", { roomId: room.id });
  };

  const handleReport = (bodyId) => {
    socket.emit("impostor:report", { roomId: room.id, bodyId });
  };

  const handleEmergency = () => {
    socket.emit("impostor:emergency", { roomId: room.id });
  };

  const handleCastVote = (targetSocketId) => {
    socket.emit("impostor:vote", { roomId: room.id, targetSocketId });
  };

  const handleSkipDiscussion = () => {
    if (!isHost) return;
    socket.emit("impostor:skip_discussion", { roomId: room.id });
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !room) return;
    if (onSendDiscussionMessage) {
      onSendDiscussionMessage(chatInput.trim());
    }
    setChatInput("");
  };

  const handleQuickChip = (text) => {
    if (onSendDiscussionMessage) {
      onSendDiscussionMessage(text);
    }
  };

  // Room definitions with positions & icons
  const ROOMS = [
    { id: "cafeteria", name: "Cafeteria", icon: Coffee, color: "#FFA012", hasVent: false, hasButton: true },
    { id: "weapons", name: "Weapons", icon: CrosshairIcon, color: "#FF7F66", hasVent: false },
    { id: "navigation", name: "Navigation", icon: Compass, color: "#50B5FF", hasVent: true },
    { id: "o2", name: "O2 (Life Support)", icon: Wind, color: "#4DD97B", hasVent: true },
    { id: "electrical", name: "Electrical", icon: Zap, color: "#FFD028", hasVent: true },
    { id: "reactor", name: "Reactor", icon: AtomIcon, color: "#9D5CFF", hasVent: true },
    { id: "medbay", name: "Medbay", icon: HeartPulse, color: "#24A654", hasVent: true },
    { id: "security", name: "Security", icon: Shield, color: "#3B82F6", hasVent: true },
  ];

  // Helper icons
  function CrosshairIcon(props) {
    return <Radio {...props} />;
  }
  function AtomIcon(props) {
    return <Activity {...props} />;
  }

  // Get dead bodies in current room
  const deadBodies = room?.impostorInfo?.deadBodies || [];
  const deadBodiesHere = deadBodies.filter((b) => b.room === currentRoom && !b.reported);

  // Other players in current room
  const playersHere = (room?.players || []).filter(
    (p) => p.isAlive && p.currentRoom === currentRoom && p.socketId !== socket?.id
  );

  // Impostor killable targets: living crewmates in same room
  const killableTargets = playersHere.filter((p) => p.role !== "IMPOSTOR");

  // Tasks in current room
  const myTasks = myRoleData?.tasks || [];
  const tasksInCurrentRoom = myTasks.filter((t) => t.room === currentRoom);

  // Task progress calculation
  const totalTasks = room?.impostorInfo?.totalTasks || 0;
  const completedTasks = room?.impostorInfo?.completedTasks || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Active sabotage
  const activeSabotage = room?.impostorInfo?.activeSabotage;
  const activeMeeting = room?.impostorInfo?.activeMeeting;
  const lastEjection = room?.impostorInfo?.lastEjection;

  const handleUseAction = () => {
    if (proximity.canFixSabotage) {
      handleFixSabotage();
    } else if (proximity.canEmergency) {
      handleEmergency();
    } else if (proximity.activeTask) {
      openTaskModal(proximity.activeTask);
    }
  };

  const handleKillAction = () => {
    if (!isImpostor || isGhost || killCooldownSecs > 0) return;
    if (proximity.targetCrewmate) {
      handleKill(proximity.targetCrewmate.socketId);
    }
  };

  const handleReportAction = () => {
    if (isGhost) return;
    if (proximity.nearestBody) {
      handleReport(proximity.nearestBody.id);
    }
  };

  const handleVentAction = () => {
    if (!isImpostor || isGhost) return;
    setShowVentModal(true);
  };

  // Vent links
  const VENT_LINKS = {
    cafeteria: ["admin", "o2"],
    electrical: ["medbay", "security"],
    medbay: ["electrical", "security"],
    security: ["electrical", "medbay"],
    reactor: ["o2", "navigation"],
    o2: ["reactor", "navigation"],
    navigation: ["reactor", "o2"],
    weapons: ["navigation", "shields"],
    shields: ["weapons", "navigation"],
  };

  // Global Keyboard Hotkeys for Desktop Players
  useEffect(() => {
    const handleGlobalHotkeys = (e) => {
      // Don't intercept if typing in chat or input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (room?.status !== "ACTION_PHASE") return;

      const key = e.key.toLowerCase();
      if (key === "e" || e.code === "Space") {
        e.preventDefault();
        handleUseAction();
      } else if (key === "q") {
        e.preventDefault();
        handleKillAction();
      } else if (key === "r") {
        e.preventDefault();
        handleReportAction();
      } else if (key === "v") {
        e.preventDefault();
        handleVentAction();
      } else if (key === "escape") {
        setActiveTaskModal(null);
        setShowSabotageModal(false);
        setShowVentModal(false);
      }
    };

    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [room?.status, proximity, isImpostor, isGhost, killCooldownSecs]);

  // ==========================================
  // PHASE 1: MEMORIZE PHASE (ROLE UNICAST REVEAL)
  // ==========================================
  if (room?.status === "MEMORIZE_PHASE") {
    return (
      <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#F6E6D0] space-y-6 text-center animate-pop-spring">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#8C8275]">
            Penugasan Peran Luar Angkasa
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#3A332C]">
            Identitas Rahasiamu
          </h2>
        </div>

        <div
          className={`p-6 sm:p-8 rounded-3xl border-3 shadow-lg max-w-md mx-auto space-y-4 transition-all duration-300 ${
            isImpostor
              ? "bg-[#FFF0ED] border-[#FFB2A1] shadow-[0_10px_25px_rgba(255,77,77,0.18)]"
              : "bg-[#EFF8FF] border-[#8CD3FF] shadow-[0_10px_25px_rgba(80,181,255,0.18)]"
          }`}
        >
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border-2 shadow-sm ${
              isImpostor
                ? "bg-[#FFE0D9] text-[#FF4D4D] border-[#FFB2A1]"
                : "bg-[#DDF0FF] text-[#1C8BE0] border-[#8CD3FF]"
            }`}
          >
            {isImpostor ? (
              <Skull className="w-10 h-10 animate-bounce text-[#FF4D4D]" />
            ) : (
              <Rocket className="w-10 h-10 animate-pulse text-[#1C8BE0]" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                isImpostor
                  ? "bg-[#FFE0D9] text-[#FF4D4D] border-[#FFB2A1]"
                  : "bg-[#DDF0FF] text-[#1C8BE0] border-[#8CD3FF]"
              }`}
            >
              {isImpostor ? "Penyusup (Impostor)" : "Astronot (Crewmate)"}
            </span>
            <h3
              className={`text-3xl sm:text-4xl font-black tracking-tight ${
                isImpostor ? "text-[#FF4D4D]" : "text-[#1C8BE0]"
              }`}
            >
              {role}
            </h3>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#8C8275] leading-relaxed">
            {isImpostor
              ? "Lenyapkan Crewmate tanpa ketahuan, gunakan ventilasi, dan picu sabotase darurat untuk menghancurkan kapal!"
              : "Selesaikan seluruh daftar tugas (tasks) kapal antariksa dan temukan siapa penyusup di antaramu!"}
          </p>

          {isImpostor && myRoleData?.teammates && myRoleData.teammates.length > 1 && (
            <div className="p-3 bg-white/80 rounded-2xl border border-[#FFB2A1] text-xs">
              <span className="text-[#FF4D4D] font-black block">Rekan Impostor Anda:</span>
              <span className="font-extrabold text-[#3A332C]">
                {myRoleData.teammates.join(", ")}
              </span>
            </div>
          )}

          {!isImpostor && (
            <div className="p-3 bg-white/80 rounded-2xl border border-[#8CD3FF] text-xs text-left space-y-1">
              <span className="text-[#1C8BE0] font-black block">Misi Awal Anda:</span>
              <ul className="list-disc list-inside text-[#3A332C] font-semibold space-y-0.5">
                {myTasks.map((t) => (
                  <li key={t.id}>
                    {t.name} ({t.room.toUpperCase()})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onMarkReady}
            disabled={isReadyConfirmed}
            className={`w-full max-w-xs mx-auto py-3.5 rounded-2xl font-black text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
              isReadyConfirmed
                ? "bg-[#E8F8ED] text-[#24A654] border-2 border-[#89EFA9] cursor-default shadow-none"
                : "btn-3d-peach"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isReadyConfirmed ? "Siap Meluncur!" : "Saya Sudah Paham"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2 & 3: ACTION PHASE & EMERGENCY MEETING
  // ==========================================
  return (
    <div className="space-y-4 sm:space-y-5 animate-pop-spring">
      {/* 1. TOP STATUS & TASK PROGRESS BAR */}
      <div className="clay-card p-4 sm:p-5 bg-white border-2 border-[#F6E6D0] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-2xl border ${
                isImpostor
                  ? "bg-[#FFF0ED] text-[#FF4D4D] border-[#FFB2A1]"
                  : "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]"
              }`}
            >
              {isImpostor ? <Skull className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full border ${
                    isImpostor
                      ? "bg-[#FFF0ED] text-[#FF4D4D] border-[#FFB2A1]"
                      : "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]"
                  }`}
                >
                  {isGhost ? "Hantu (Ghost)" : isImpostor ? "Impostor" : "Crewmate"}
                </span>
                {isGhost && (
                  <span className="text-[10px] font-bold text-[#8C8275] bg-[#F6E6D0] px-2 py-0.2 rounded-full">
                    👻 Tereliminasi (Tetap Bisa Kerjakan Task)
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#3A332C] mt-0.5">
                Ruangan Saat Ini: <span className="text-[#50B5FF]">{currentRoom.toUpperCase()}</span>
              </h3>
            </div>
          </div>

          {/* Quick Impostor Cooldown Chip */}
          {isImpostor && !isGhost && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#FFF0ED] border border-[#FFB2A1] text-xs font-black text-[#FF4D4D] flex items-center gap-1.5">
                <Skull className="w-4 h-4" />
                <span>
                  Kill: {killCooldownSecs > 0 ? `${killCooldownSecs}s` : "SIAP!"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Task Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black text-[#8C8275]">
            <span>TOTAL PROGRES TUGAS KAPAL</span>
            <span className="text-[#24A654]">
              {completedTasks} / {totalTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-[#FFF5E8] rounded-full border border-[#F0DDC5] overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#89EFA9] to-[#24A654] rounded-full transition-all duration-500 shadow-inner"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Active Sabotage Alert Banner */}
        {activeSabotage && (
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#FF4D4D] to-[#E64B2D] text-white rounded-2xl border-2 border-[#B82B10] flex items-center justify-between gap-3 shadow-md animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0 animate-bounce" />
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  ⚠️ SABOTASE: {activeSabotage.type.toUpperCase()} AKTIF!
                </h4>
                <p className="text-[11px] font-medium opacity-90 truncate">
                  Segera menuju ke ruangan <strong>{activeSabotage.requiredRoom.toUpperCase()}</strong> untuk memperbaiki!
                </p>
              </div>
            </div>
            {currentRoom === activeSabotage.requiredRoom && !isGhost && (
              <button
                type="button"
                onClick={handleFixSabotage}
                className="btn-3d-peach text-xs font-black px-3 py-1.5 rounded-xl shrink-0 cursor-pointer"
              >
                Perbaiki!
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. EMERGENCY MEETING MODAL / SCENE */}
      {room?.status === "MEETING_PHASE" && (
        <div className="clay-card p-5 sm:p-6 bg-white border-3 border-[#FF4D4D] space-y-5 shadow-2xl animate-pop-spring">
          {/* Header Siren */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#F6E6D0]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#FFF0ED] text-[#FF4D4D] border-2 border-[#FFB2A1] animate-bounce">
                <Siren className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF4D4D] bg-[#FFF0ED] px-2 py-0.5 rounded-full border border-[#FFB2A1]">
                  {activeMeeting?.reason === "DEAD_BODY" ? "💀 Mayat Ditemukan!" : "🚨 Emergency Meeting"}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#3A332C] mt-0.5">
                  Musyawarah Darurat Antariksa
                </h2>
                <p className="text-xs text-[#8C8275] font-semibold">
                  {activeMeeting?.reason === "DEAD_BODY"
                    ? `${activeMeeting?.reporterName} menemukan mayat ${activeMeeting?.victimName} di ${activeMeeting?.locationName?.toUpperCase()}!`
                    : `${activeMeeting?.reporterName} menekan tombol darurat di Kafetaria!`}
                </p>
              </div>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={handleSkipDiscussion}
                className="flex items-center gap-1 text-xs font-black text-[#FFA012] bg-[#FFF8EC] border border-[#FFA012] hover:bg-[#FFEACD] px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Langsung Hitung Vote</span>
              </button>
            )}
          </div>

          {/* Voting Grid: All Players */}
          <div className="space-y-2">
            <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider block">
              Pilih Tersangka yang Ingin Diejeksi ke Luar Angkasa:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {room?.players?.map((p) => {
                const isDead = !p.isAlive;
                const hasVoted = room.votes && !!room.votes[p.socketId];
                const isMyVote = room.votes && room.votes[socket?.id] === p.socketId;

                return (
                  <button
                    key={p.socketId}
                    type="button"
                    disabled={isDead || isGhost || (room.votes && !!room.votes[socket?.id])}
                    onClick={() => handleCastVote(p.socketId)}
                    className={`p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1.5 relative cursor-pointer active:scale-95 ${
                      isDead
                        ? "opacity-40 grayscale bg-[#FFFBF5] border-[#F0DDC5] cursor-not-allowed"
                        : isMyVote
                        ? "bg-[#FFF0ED] border-[#FF4D4D] ring-2 ring-[#FF4D4D]/30 shadow-md"
                        : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#50B5FF] hover:bg-[#EFF8FF]"
                    }`}
                  >
                    <Avatar name={p.name} size="sm" />
                    <span className="text-xs font-black text-[#3A332C] truncate max-w-full">
                      {p.name}
                    </span>
                    {isDead && (
                      <span className="text-[10px] font-black text-[#FF4D4D]">💀 Gugur</span>
                    )}
                    {hasVoted && (
                      <span className="text-[9px] font-black bg-[#EDFCF2] text-[#24A654] border border-[#89EFA9] px-1.5 py-0.2 rounded-full">
                        ✓ Memilih
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Skip Vote Button */}
              <button
                type="button"
                disabled={isGhost || (room.votes && !!room.votes[socket?.id])}
                onClick={() => handleCastVote("SKIP")}
                className={`p-3 rounded-2xl border-2 transition flex flex-col items-center justify-center text-center gap-1 cursor-pointer active:scale-95 ${
                  room.votes && room.votes[socket?.id] === "SKIP"
                    ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                    : "bg-white border-[#F0DDC5] hover:bg-[#FFFBF5]"
                }`}
              >
                <FastForward className="w-6 h-6 text-[#FFA012]" />
                <span className="text-xs font-black text-[#3A332C]">Skip Vote</span>
                <span className="text-[10px] text-[#8C8275] font-semibold">Lewati Pilihan</span>
              </button>
            </div>
          </div>

          {/* Real-Time Discussion Chat */}
          <div className="space-y-2 pt-2 border-t border-[#F6E6D0]">
            <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider block">
              Obrolan Diskusi Real-Time:
            </span>
            <div
              ref={chatContainerRef}
              className="h-32 overflow-y-auto p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2 text-xs"
            >
              {(room?.discussionMessages || []).length === 0 ? (
                <p className="text-[#8C8275] italic text-center py-4">
                  Belum ada pesan. Saling tanyakan alibi dan lokasi rekanmu!
                </p>
              ) : (
                room.discussionMessages.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="font-extrabold text-[#50B5FF] shrink-0">{m.senderName}:</span>
                    <span className="text-[#3A332C] font-semibold break-words">{m.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Chat Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Di mana lokasinya?",
                "Aku lagi di Medbay!",
                "Aku tadi ngerjain kabel di Electrical!",
                "Mencurigakan banget...",
                "Skip dulu aja kali ini!",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickChip(chip)}
                  className="text-[11px] font-bold bg-white hover:bg-[#FFF5E8] text-[#8C8275] hover:text-[#3A332C] px-2.5 py-1 rounded-full border border-[#F0DDC5] transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik alibi atau kecurigaanmu..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#F0DDC5] text-xs font-semibold focus:outline-none focus:border-[#50B5FF] bg-white"
              />
              <button
                type="submit"
                className="btn-3d-blue text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. EJECTION RESULT MODAL OVERLAY */}
      {lastEjection && (
        <div className="clay-card p-6 bg-gradient-to-b from-[#1F1B24] to-[#120F16] text-white border-2 border-[#9D5CFF] text-center space-y-4 shadow-2xl animate-pop-spring">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 flex items-center justify-center border border-white/20">
            <Rocket className="w-8 h-8 text-[#50B5FF] animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-yellow-300">
              {lastEjection.ejectedName
                ? `${lastEjection.ejectedName} Dilempar ke Luar Angkasa!`
                : lastEjection.isTie
                ? "Hasil Seri (Tie)! Tidak ada yang diejeksi."
                : "Voting Dilewati (Skipped)! Tidak ada yang diejeksi."}
            </h3>
            <p className="text-sm font-extrabold text-white/90">
              {lastEjection.ejectedName
                ? lastEjection.wasImpostor
                  ? `✓ ${lastEjection.ejectedName} adalah seorang IMPOSTOR!`
                  : `✗ ${lastEjection.ejectedName} BUKAN Impostor.`
                : "Semua astronot selamat di putaran ini."}
            </p>
            <p className="text-xs text-white/60 font-semibold pt-1">
              ({lastEjection.remainingImpostors} Impostor tersisa)
            </p>
          </div>
        </div>
      )}

      {/* 4. REAL-TIME 2D SPACESHIP ARENA & HUD CONTROLS */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#F6E6D0] shadow-xl select-none">
        {/* Canvas Arena */}
        <SpaceArenaCanvas
          room={room}
          socket={socket}
          identity={identity}
          myRoleData={myRoleData}
          isImpostor={isImpostor}
          isGhost={isGhost}
          killCooldownSecs={killCooldownSecs}
          joystickVector={joystickVector}
          activeSabotage={activeSabotage}
          onProximityChange={setProximity}
        />

        {/* Floating Controls Overlay: Virtual Joystick (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
          <VirtualJoystick
            onMove={setJoystickVector}
            onStop={() => setJoystickVector({ x: 0, y: 0 })}
            size={116}
            knobSize={48}
          />
        </div>

        {/* Floating Controls Overlay: Proximity Action Buttons (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Top row of secondary action buttons (Vent & Sabotage for Impostor) */}
          {isImpostor && !isGhost && (
            <div className="flex items-center gap-2">
              {/* Sabotage Button */}
              <button
                type="button"
                onClick={() => setShowSabotageModal(true)}
                title="Picu Sabotase"
                className="relative w-12 h-12 rounded-2xl bg-[#FFF0ED] hover:bg-[#FFE0D9] border-2 border-[#FFB2A1] text-[#FF4D4D] shadow-md flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              >
                <Flame className="w-5 h-5" />
              </button>

              {/* Vent Button */}
              <button
                type="button"
                disabled={!proximity.canVent}
                onClick={handleVentAction}
                title="Gunakan Ventilasi"
                className={`relative w-12 h-12 rounded-2xl border-2 shadow-md flex items-center justify-center transition-all ${
                  proximity.canVent
                    ? "bg-[#7B33ED] hover:bg-[#6824D6] border-white text-white animate-bounce cursor-pointer shadow-[0_0_15px_rgba(123,51,237,0.5)]"
                    : "bg-white/70 border-[#C9A0FF]/60 text-[#7B33ED]/50 cursor-not-allowed opacity-60"
                }`}
              >
                <Wind className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-md bg-black/80 text-[9px] font-black text-white border border-white/30 hidden sm:block">V</span>
              </button>
            </div>
          )}

          {/* Main Action Buttons: REPORT, KILL, USE */}
          <div className="flex items-end gap-2.5">
            {/* REPORT BUTTON (Available to all living players near dead body) */}
            {!isGhost && (
              <button
                type="button"
                disabled={!proximity.canReport}
                onClick={handleReportAction}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-3xl border-3 flex flex-col items-center justify-center text-center transition-all ${
                  proximity.canReport
                    ? "bg-[#FF4D4D] hover:bg-[#E63939] text-white border-white shadow-[0_0_22px_rgba(255,77,77,0.8)] animate-pulse cursor-pointer scale-105 active:scale-95"
                    : "bg-white/60 border-[#F0DDC5] text-[#8C8275]/40 opacity-50 cursor-not-allowed shadow-none"
                }`}
              >
                <Siren className={`w-5 h-5 sm:w-6 sm:h-6 ${proximity.canReport ? "animate-bounce" : ""}`} />
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Report</span>
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-md bg-black/80 text-[9px] font-black text-white border border-white/30 hidden sm:block">R</span>
              </button>
            )}

            {/* KILL BUTTON (Impostor only) */}
            {isImpostor && !isGhost && (
              <button
                type="button"
                disabled={!proximity.canKill}
                onClick={handleKillAction}
                className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-3xl border-3 flex flex-col items-center justify-center text-center transition-all ${
                  proximity.canKill
                    ? "bg-[#C51111] hover:bg-[#A30C0C] text-white border-white shadow-[0_0_25px_rgba(197,17,17,0.8)] cursor-pointer scale-105 active:scale-95 animate-pop-spring"
                    : killCooldownSecs > 0
                    ? "bg-[#334155]/85 border-[#475569] text-white/80 cursor-not-allowed shadow-none"
                    : "bg-white/60 border-[#F0DDC5] text-[#8C8275]/40 opacity-50 cursor-not-allowed shadow-none"
                }`}
              >
                <Skull className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
                  {killCooldownSecs > 0 ? `${killCooldownSecs}s` : "Kill"}
                </span>
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-md bg-black/80 text-[9px] font-black text-white border border-white/30 hidden sm:block">Q</span>
              </button>
            )}

            {/* USE / TASK / EMERGENCY / FIX BUTTON */}
            {!isGhost && (
              <button
                type="button"
                disabled={!proximity.canUse}
                onClick={handleUseAction}
                className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-3xl border-3 flex flex-col items-center justify-center text-center transition-all ${
                  proximity.canUse
                    ? proximity.canFixSabotage
                      ? "bg-[#EF4444] hover:bg-[#DC2626] text-white border-white shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-bounce cursor-pointer scale-105 active:scale-95"
                      : proximity.canEmergency
                      ? "bg-[#FFA012] hover:bg-[#EA8E05] text-white border-white shadow-[0_0_25px_rgba(255,160,18,0.7)] animate-bounce cursor-pointer scale-105 active:scale-95"
                      : "bg-[#1C8BE0] hover:bg-[#1572BA] text-white border-white shadow-[0_0_25px_rgba(28,139,224,0.7)] animate-bounce cursor-pointer scale-105 active:scale-95"
                    : "bg-white/60 border-[#F0DDC5] text-[#8C8275]/40 opacity-50 cursor-not-allowed shadow-none"
                }`}
              >
                {proximity.canEmergency ? (
                  <Siren className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
                  {proximity.canFixSabotage
                    ? "Perbaiki!"
                    : proximity.canEmergency
                    ? "Emergency"
                    : proximity.activeTask
                    ? "Kerjakan"
                    : "Use"}
                </span>
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-md bg-black/80 text-[9px] font-black text-white border border-white/30 hidden sm:block">E</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Floating Helper Controls Bar */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-black text-white flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
            <span>
              Lokasi: <span className="text-[#38BDF8]">{proximity.currentRoom?.toUpperCase() || currentRoom.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Bottom Center Movement & Hotkeys Guide */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:block">
          <span className="text-[10px] font-extrabold text-white/90 bg-black/55 px-4 py-1.5 rounded-full backdrop-blur-xs border border-white/20 shadow-md">
            Tap peta untuk jalan • WASD / Joystick • [E] Use • [Q] Kill • [R] Report • [V] Vent
          </span>
        </div>
      </div>

      {/* 5. SHIP ASSIGNED TASKS CHECKLIST (COLLAPSIBLE TRAY) */}
      <div className="clay-card p-3.5 sm:p-4 bg-white border-2 border-[#F6E6D0] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#24A654]" />
            <span className="text-xs font-black uppercase text-[#3A332C]">
              Daftar Tugas Astronot Anda ({myTasks.filter((t) => t.completed).length}/{myTasks.length})
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#8C8275]">
            Dekati konsol di ruangan untuk menyelesaikan tugas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {myTasks.map((t) => (
            <div
              key={t.id}
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold transition ${
                t.completed
                  ? "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]"
                  : "bg-[#FFFBF5] text-[#3A332C] border-[#F0DDC5]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${t.completed ? "bg-[#24A654]" : "bg-[#FFA012] animate-pulse"}`} />
                <span className="truncate">{t.name}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md uppercase font-black shrink-0 bg-white border border-[#F0DDC5]">
                {t.room}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. IMPOSTOR VENT TRAVEL MODAL */}
      {showVentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="clay-card p-5 max-w-sm w-full bg-white space-y-4 border-2 border-[#C9A0FF] animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-[#7B33ED]" />
                <h4 className="text-sm font-black text-[#3A332C]">Saluran Ventilasi (Vent)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowVentModal(false)}
                className="text-[#8C8275] hover:text-[#3A332C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#8C8275] font-semibold">
              Pilih ruangan tujuan ventilasi untuk berpindah secara instan tanpa ketahuan:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(VENT_LINKS[currentRoom] || []).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => handleVent(target)}
                  className="p-3 rounded-2xl bg-[#F7F1FF] hover:bg-[#EDE0FF] border-2 border-[#C9A0FF] font-black text-xs text-[#7B33ED] transition cursor-pointer text-center"
                >
                  {target.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. IMPOSTOR SABOTAGE MODAL */}
      {showSabotageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="clay-card p-5 max-w-md w-full bg-white space-y-4 border-2 border-[#FFB2A1] animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#FF4D4D]" />
                <h4 className="text-sm font-black text-[#3A332C]">Picu Sabotase Darurat</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSabotageModal(false)}
                className="text-[#8C8275] hover:text-[#3A332C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTriggerSabotage("reactor")}
                className="p-3.5 rounded-2xl bg-[#FFF0ED] hover:bg-[#FFE0D9] border-2 border-[#FFB2A1] text-left space-y-1 cursor-pointer"
              >
                <span className="text-xs font-black text-[#FF4D4D] block">💥 Reactor Meltdown</span>
                <span className="text-[10px] text-[#8C8275] font-semibold block leading-tight">
                  Sabotase Kritis! Waktu 40 detik untuk perbaikan reaktor.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSabotage("o2")}
                className="p-3.5 rounded-2xl bg-[#FFF0ED] hover:bg-[#FFE0D9] border-2 border-[#FFB2A1] text-left space-y-1 cursor-pointer"
              >
                <span className="text-xs font-black text-[#FF4D4D] block">💨 O2 Depletion</span>
                <span className="text-[10px] text-[#8C8275] font-semibold block leading-tight">
                  Sabotase Kritis! Pasokan oksigen habis dalam 35 detik.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSabotage("lights")}
                className="p-3.5 rounded-2xl bg-[#FFFBF5] hover:bg-[#FFF5E8] border-2 border-[#F0DDC5] text-left space-y-1 cursor-pointer"
              >
                <span className="text-xs font-black text-[#FFA012] block">💡 Matikan Lampu</span>
                <span className="text-[10px] text-[#8C8275] font-semibold block leading-tight">
                  Mengacaukan pandangan kru lain di ruangan.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSabotage("comms")}
                className="p-3.5 rounded-2xl bg-[#FFFBF5] hover:bg-[#FFF5E8] border-2 border-[#F0DDC5] text-left space-y-1 cursor-pointer"
              >
                <span className="text-xs font-black text-[#FFA012] block">📡 Gangguan Komunikasi</span>
                <span className="text-[10px] text-[#8C8275] font-semibold block leading-tight">
                  Menyembunyikan progres task bar kru.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. INTERACTIVE MINI-TASKS MODAL */}
      {activeTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="clay-card p-5 sm:p-6 max-w-md w-full bg-white space-y-4 border-2 border-[#8CD3FF] shadow-2xl animate-pop-spring">
            {/* Task Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#3A332C]">
                    {activeTaskModal.name}
                  </h3>
                  <span className="text-[10px] font-bold text-[#8C8275]">
                    Ruangan: {activeTaskModal.room.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                className="text-[#8C8275] hover:text-[#3A332C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TASK 1: UNLOCK MANIFOLDS (1-10) */}
            {activeTaskModal.id === "manifolds" && (
              <div className="space-y-3 text-center">
                <p className="text-xs font-bold text-[#8C8275]">
                  Tekan angka secara berurutan mulai dari <strong>1</strong> sampai <strong>10</strong>!
                </p>
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {manifoldButtons.map((num) => {
                    const isDone = num < manifoldNext;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (num === manifoldNext) {
                            if (num === 10) {
                              handleFinishTask(activeTaskModal.id);
                            } else {
                              setManifoldNext(num + 1);
                              playSound("message");
                            }
                          }
                        }}
                        disabled={isDone}
                        className={`h-12 rounded-xl font-black text-sm transition cursor-pointer border-2 ${
                          isDone
                            ? "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9] cursor-default"
                            : "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF] hover:bg-[#DDF0FF] active:scale-95"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TASK 2: SWIPE CARD */}
            {activeTaskModal.id === "swipe_card" && (
              <div className="space-y-4 text-center">
                <p className="text-xs font-bold text-[#8C8275]">{swipeStatus}</p>
                <div className="p-4 bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5] space-y-3">
                  <div className="h-14 bg-white rounded-xl border border-[#D9C4AB] flex items-center px-3 relative overflow-hidden">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={swipeProgress}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setSwipeProgress(val);
                        if (val >= 98) {
                          setSwipeStatus("✓ Kartu Diterima!");
                          handleFinishTask(activeTaskModal.id);
                        }
                      }}
                      className="w-full accent-[#50B5FF] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#8C8275]">
                    <span>[ START ]</span>
                    <span>[ SCANNER ]</span>
                    <span>[ FINISH ]</span>
                  </div>
                </div>
              </div>
            )}

            {/* TASK 3: WIRING */}
            {activeTaskModal.id === "wiring" && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#8C8275] text-center">
                  Hubungkan kabel di sisi kiri ke warna yang sama di sisi kanan!
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Wires */}
                  <div className="space-y-2">
                    {["red", "blue", "yellow", "pink"].map((col) => {
                      const isMatched = wiringConnected[col];
                      const isSel = wiringLeftSelected === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={isMatched}
                          onClick={() => setWiringLeftSelected(col)}
                          className={`w-full py-2.5 px-3 rounded-xl font-black text-xs text-white uppercase transition cursor-pointer border-2 ${
                            col === "red"
                              ? "bg-[#FF4D4D] border-[#E63939]"
                              : col === "blue"
                              ? "bg-[#50B5FF] border-[#3AA5F8]"
                              : col === "yellow"
                              ? "bg-[#FFB347] border-[#FFA012]"
                              : "bg-[#FF7F66] border-[#F56447]"
                          } ${isSel ? "ring-4 ring-yellow-400 scale-102" : ""} ${
                            isMatched ? "opacity-40" : ""
                          }`}
                        >
                          {col} {isMatched ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Wires (Shuffled order) */}
                  <div className="space-y-2">
                    {["yellow", "red", "pink", "blue"].map((col) => {
                      const isMatched = Object.values(wiringConnected).includes(col);
                      return (
                        <button
                          key={col}
                          type="button"
                          disabled={isMatched || !wiringLeftSelected}
                          onClick={() => {
                            if (wiringLeftSelected === col) {
                              const updated = { ...wiringConnected, [col]: col };
                              setWiringConnected(updated);
                              setWiringLeftSelected(null);
                              playSound("message");
                              if (Object.keys(updated).length === 4) {
                                handleFinishTask(activeTaskModal.id);
                              }
                            } else {
                              setWiringLeftSelected(null);
                            }
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl font-black text-xs text-white uppercase transition cursor-pointer border-2 ${
                            col === "red"
                              ? "bg-[#FF4D4D] border-[#E63939]"
                              : col === "blue"
                              ? "bg-[#50B5FF] border-[#3AA5F8]"
                              : col === "yellow"
                              ? "bg-[#FFB347] border-[#FFA012]"
                              : "bg-[#FF7F66] border-[#F56447]"
                          } ${isMatched ? "opacity-40" : ""}`}
                        >
                          {col} {isMatched ? "✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TASK 4: CLEAN FILTER (Leaves) */}
            {activeTaskModal.id === "clean_filter" && (
              <div className="space-y-3 text-center">
                <p className="text-xs font-bold text-[#8C8275]">
                  Klik semua sampah dedaunan untuk membersihkan saluran O2!
                </p>
                <div className="p-6 bg-[#EFF8FF] rounded-2xl border-2 border-[#8CD3FF] min-h-[140px] flex items-center justify-around flex-wrap gap-3">
                  {remainingLeaves.map((leaf) => (
                    <button
                      key={leaf}
                      type="button"
                      onClick={() => {
                        const updated = remainingLeaves.filter((l) => l !== leaf);
                        setRemainingLeaves(updated);
                        playSound("message");
                        if (updated.length === 0) {
                          handleFinishTask(activeTaskModal.id);
                        }
                      }}
                      className="w-12 h-12 rounded-2xl bg-[#4DD97B] text-white border-2 border-[#24A654] flex items-center justify-center font-black shadow-xs hover:scale-110 active:scale-90 transition cursor-pointer"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  ))}
                  {remainingLeaves.length === 0 && (
                    <span className="text-xs font-black text-[#24A654]">Filter Bersih!</span>
                  )}
                </div>
              </div>
            )}

            {/* TASK 5: DIVERT POWER */}
            {activeTaskModal.id === "divert_power" && (
              <div className="space-y-3 text-center">
                <p className="text-xs font-bold text-[#8C8275]">
                  Nyalakan ketiga saklar daya ke atas!
                </p>
                <div className="flex items-center justify-center gap-4 py-3">
                  {powerSwitches.map((isOn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const next = [...powerSwitches];
                        next[idx] = true;
                        setPowerSwitches(next);
                        playSound("message");
                        if (next.every(Boolean)) {
                          handleFinishTask(activeTaskModal.id);
                        }
                      }}
                      className={`w-14 h-24 rounded-2xl border-3 flex flex-col items-center justify-between p-2 transition cursor-pointer shadow-md ${
                        isOn
                          ? "bg-[#EDFCF2] border-[#24A654] text-[#24A654]"
                          : "bg-[#FFF0ED] border-[#FFB2A1] text-[#FF4D4D]"
                      }`}
                    >
                      <span className="text-[10px] font-black">{isOn ? "ON" : "OFF"}</span>
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                          isOn ? "bg-[#24A654] text-white" : "bg-[#FF4D4D] text-white"
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GENERIC TASK FALLBACK */}
            {activeTaskModal.id !== "manifolds" &&
              activeTaskModal.id !== "swipe_card" &&
              activeTaskModal.id !== "wiring" &&
              activeTaskModal.id !== "clean_filter" &&
              activeTaskModal.id !== "divert_power" && (
                <div className="space-y-4 text-center py-2">
                  <p className="text-xs font-semibold text-[#8C8275]">
                    Sedang melakukan kalibrasi sistem pesawat antariksa...
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFinishTask(activeTaskModal.id)}
                    className="btn-3d-blue text-xs font-black py-3 px-6 rounded-2xl cursor-pointer"
                  >
                    Selesaikan Tugas Sekarang
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* VENT TRAVEL MODAL (IMPOSTOR ONLY) */}
      {showVentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="clay-card p-5 sm:p-6 bg-white border-3 border-[#7B33ED] max-w-sm w-full space-y-4 shadow-2xl animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0DDC5]">
              <div className="flex items-center gap-2 text-[#7B33ED]">
                <Wind className="w-5 h-5" />
                <h3 className="text-base font-black text-[#3A332C]">Jaringan Ventilasi Kapal</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVentModal(false)}
                className="w-8 h-8 rounded-full bg-[#FFF5E8] hover:bg-[#FFE0D9] text-[#8C8275] flex items-center justify-center cursor-pointer font-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-[#8C8275]">
              Pilih ruangan yang terhubung untuk melompat secara instan lewat pipa ventilasi:
            </p>

            <div className="space-y-2">
              {(
                VENT_LINKS[proximity.nearestVent?.room || currentRoom] || [
                  "medbay",
                  "security",
                  "electrical",
                ]
              ).map((targetId) => (
                <button
                  key={targetId}
                  type="button"
                  onClick={() => handleVent(targetId)}
                  className="w-full p-3 rounded-2xl bg-[#F5F3FF] hover:bg-[#EDE9FE] border-2 border-[#DDD6FE] hover:border-[#7B33ED] text-[#3A332C] flex items-center justify-between font-black text-xs transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-[#7B33ED]" />
                    <span className="uppercase">{targetId}</span>
                  </div>
                  <span className="text-[10px] bg-[#7B33ED] text-white px-2.5 py-1 rounded-full font-black">
                    Masuk Pipa
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SABOTAGE SELECTION MODAL (IMPOSTOR ONLY) */}
      {showSabotageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="clay-card p-5 sm:p-6 bg-white border-3 border-[#FF4D4D] max-w-sm w-full space-y-4 shadow-2xl animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0DDC5]">
              <div className="flex items-center gap-2 text-[#FF4D4D]">
                <Flame className="w-5 h-5" />
                <h3 className="text-base font-black text-[#3A332C]">Picu Sabotase Darurat</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSabotageModal(false)}
                className="w-8 h-8 rounded-full bg-[#FFF5E8] hover:bg-[#FFE0D9] text-[#8C8275] flex items-center justify-center cursor-pointer font-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-[#8C8275]">
              Picu krisis darurat untuk membingungkan dan memecah konsentrasi Crewmate:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: "reactor",
                  name: "Reaktor Nuklir",
                  desc: "Kritis Ledakan (40s)",
                  icon: Flame,
                },
                {
                  id: "o2",
                  name: "Habiskan O2",
                  desc: "Kritis Oksigen (35s)",
                  icon: Wind,
                },
                {
                  id: "lights",
                  name: "Padam Listrik",
                  desc: "Matikan Lampu",
                  icon: Zap,
                },
                {
                  id: "comms",
                  name: "Ganggu Sinyal",
                  desc: "Kacaukan Peta",
                  icon: Radio,
                },
              ].map((sab) => (
                <button
                  key={sab.id}
                  type="button"
                  onClick={() => handleTriggerSabotage(sab.id)}
                  className="p-3 rounded-2xl border-2 transition flex flex-col items-center text-center gap-1 cursor-pointer active:scale-95 bg-[#FFF0ED] border-[#FFB2A1] hover:border-[#FF4D4D] hover:bg-[#FFE0D9]"
                >
                  <sab.icon className="w-5 h-5 text-[#FF4D4D]" />
                  <span className="text-xs font-black text-[#3A332C]">{sab.name}</span>
                  <span className="text-[9px] text-[#8C8275] font-semibold">{sab.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
