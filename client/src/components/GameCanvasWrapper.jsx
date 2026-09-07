import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  MessageSquare,
  Users,
  RotateCw,
  Clock,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Columns,
  Square,
  DoorOpen,
  StopCircle,
} from "lucide-react";
import TimerDisplay from "./TimerDisplay";
import GameChatModal from "./GameChatModal";
import GameRosterModal from "./GameRosterModal";
import { playSound } from "../utils/sound";

export default function GameCanvasWrapper({
  children,
  activeGameMeta,
  room,
  socket,
  identity,
  nickname,
  isHost,
  isSpectator,
  isMyPlayerAlive,
  soundMuted,
  onToggleSound,
  onCancelGame,
  onLeaveRoom,
  onCamouflage,
  timerEndsAt,
  timerDuration = 25,
  discussionMessages = [],
  onSendMessage,
  currentTurnSocketId,
  currentTurnPlayerId,
  isFocusMode,
  onToggleFocusMode,
  activePuppetSocketId,
  activePuppetName,
  onClearPuppet,
}) {
  const containerRef = useRef(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Landscape state & forced CSS landscape mode
  const [isLandscapeMode, setIsLandscapeMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });
  const [isForcedLandscape, setIsForcedLandscape] = useState(false);

  // Modals state: Chat & Roster
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // Unread chat counter
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenMsgCountRef = useRef(discussionMessages.length);

  // Timer visibility state: 'full' | 'compact' | 'hidden'
  const [timerVisibility, setTimerVisibility] = useState("full");

  // Track orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsLandscapeMode(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Track unread messages when chat modal is closed
  useEffect(() => {
    if (isChatOpen) {
      lastSeenMsgCountRef.current = discussionMessages.length;
      setUnreadCount(0);
    } else {
      const diff = discussionMessages.length - lastSeenMsgCountRef.current;
      if (diff > 0) {
        setUnreadCount(diff);
      }
    }
  }, [discussionMessages.length, isChatOpen]);

  // Open Chat modal and clear unread
  const handleOpenChat = () => {
    setIsChatOpen(true);
    lastSeenMsgCountRef.current = discussionMessages.length;
    setUnreadCount(0);
  };

  // Toggle Fullscreen using HTML5 API + CSS fallback
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && !isFullscreen) {
        // Request fullscreen
        const elem = containerRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen().catch(() => {});
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen().catch(() => {});
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to pure CSS state if API fails
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  // Sync state if user exits via browser native controls (e.g. Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNative = Boolean(document.fullscreenElement);
      setIsFullscreen(isNative);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Toggle Landscape Orientation / Lock
  const handleToggleLandscape = async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        if (!isLandscapeMode) {
          await screen.orientation.lock("landscape").catch(() => {
            setIsForcedLandscape((prev) => !prev);
          });
        } else {
          await screen.orientation.unlock?.();
          setIsForcedLandscape(false);
        }
      } else {
        // Toggle CSS simulation on devices without orientation lock API (like iOS Safari)
        setIsForcedLandscape((prev) => !prev);
      }
    } catch {
      setIsForcedLandscape((prev) => !prev);
    }
  };

  // Keyboard Hotkeys: F for fullscreen, C/T for chat, R for roster, Esc to close/exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in input or textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "c" || e.key === "C" || e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleOpenChat();
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        setIsRosterOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isChatOpen) {
          setIsChatOpen(false);
        } else if (isRosterOpen) {
          setIsRosterOpen(false);
        } else if (isFullscreen) {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen, isChatOpen, isRosterOpen, isFullscreen]);

  // Phase badge translation
  const getPhaseBadge = (status) => {
    switch (status) {
      case "MEMORIZE_PHASE":
        return { text: "Menghafal Kata/Peran", color: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]" };
      case "CLUE_PHASE":
        return { text: "Fase Beri Petunjuk", color: "bg-[#FFF8EC] text-[#FFA012] border-[#F0DDC5]" };
      case "DISCUSSION_PHASE":
      case "DAY_PHASE":
        return { text: "Diskusi Terbuka", color: "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]" };
      case "VOTING_PHASE":
        return { text: "Voting Eliminasi", color: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]" };
      case "ACTION_PHASE":
        return { text: "Aksi Antariksa", color: "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]" };
      case "MEETING_PHASE":
        return { text: "Emergency Meeting", color: "bg-[#FFF0ED] text-[#FF4D4D] border-[#FFB2A1]" };
      case "NIGHT_PHASE":
        return { text: "Malam Gelap", color: "bg-[#251D3A] text-[#C9A0FF] border-[#6C24DB]" };
      case "DRAWING_PHASE":
        return { text: "Menggambar", color: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]" };
      default:
        return { text: "Permainan Aktif", color: "bg-[#FFFBF5] text-[#8C8275] border-[#F0DDC5]" };
    }
  };

  const phaseBadge = getPhaseBadge(room?.status);
  const livingPlayers = (room?.players || []).filter((p) => p.isAlive && !p.isSpectator);
  const totalPlayers = (room?.players || []).length;
  const isImpostorGame = activeGameMeta?.id === "impostor";

  // Cycle timer visibility: full -> compact -> hidden -> full
  const handleCycleTimerVisibility = () => {
    if (timerVisibility === "full") setTimerVisibility("compact");
    else if (timerVisibility === "compact") setTimerVisibility("hidden");
    else setTimerVisibility("full");
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-all duration-300 ${
        isFullscreen
          ? "game-fullscreen-container bg-[#FFF3DE] flex flex-col"
          : "clay-card bg-white p-3 sm:p-5 flex flex-col space-y-3 sm:space-y-4"
      } ${isForcedLandscape ? "forced-landscape-mode" : ""}`}
    >
      {/* 1. Sleek Floating In-Game HUD Toolbar */}
      <header
        className={`w-full flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 transition-all ${
          isFullscreen
            ? "sticky top-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/95 backdrop-blur-md border-b-2 border-[#F6E6D0] shadow-sm z-30"
            : "pb-2 border-b-2 border-[#F6E6D0]"
        }`}
      >
        {/* Left: Game Title, Phase, & Room Chip */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="p-1.5 sm:p-2 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
            style={{
              backgroundColor: activeGameMeta?.themeColor ? `${activeGameMeta.themeColor}18` : "#EFF8FF",
              borderColor: activeGameMeta?.themeColor ? `${activeGameMeta.themeColor}50` : "#8CD3FF",
              color: activeGameMeta?.themeColor || "#50B5FF",
            }}
          >
            {activeGameMeta?.icon ? (
              <activeGameMeta.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-[#3A332C] truncate">
                {activeGameMeta?.name || "Game"}
              </h2>
              <span
                className={`text-[9px] sm:text-[10px] font-black px-2 py-0.2 rounded-full border ${phaseBadge.color} truncate`}
              >
                {phaseBadge.text}
              </span>
              {activePuppetSocketId && (
                <button
                  type="button"
                  onClick={onClearPuppet}
                  title="Klik untuk kembali bermain sebagai Host"
                  className="text-[9px] sm:text-[10px] font-black px-2 py-0.2 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1 cursor-pointer transition animate-pulse"
                >
                  <span>🎮 Puppet: {activePuppetName || "Bot"}</span>
                  <span className="text-purple-200">✕</span>
                </button>
              )}
            </div>
            {room?.id && (
              <span className="text-[10px] text-[#8C8275] font-bold hidden sm:inline-block">
                Room: <strong className="font-mono text-[#50B5FF]">{room.id}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Center: Hideable / Collapsible Timer Pill */}
        {timerEndsAt && timerVisibility !== "hidden" && (
          <div className="flex items-center gap-1">
            <div
              onClick={handleCycleTimerVisibility}
              title="Klik untuk sembunyikan atau perkecil waktu"
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              {timerVisibility === "full" ? (
                <TimerDisplay endsAt={timerEndsAt} duration={timerDuration} />
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF8EC] border border-[#FFA012] text-[#D97E00] text-[11px] font-mono font-black shadow-xs">
                  <Clock className="w-3 h-3 text-[#FFA012]" />
                  <span>Waktu</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Quick Action Buttons (Chat, Roster, Landscape, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Timer visibility button (if timer exists) */}
          {timerEndsAt && (
            <button
              type="button"
              onClick={handleCycleTimerVisibility}
              title={
                timerVisibility === "full"
                  ? "Perkecil Timer"
                  : timerVisibility === "compact"
                  ? "Sembunyikan Timer"
                  : "Tampilkan Timer"
              }
              className={`p-2 rounded-2xl border transition cursor-pointer active:scale-95 shrink-0 ${
                timerVisibility === "hidden"
                  ? "bg-[#FFFBF5] text-[#8C8275] border-[#F0DDC5] opacity-60"
                  : "bg-[#FFF8EC] text-[#D97E00] border-[#FFA012]/40"
              }`}
            >
              <Clock className="w-4 h-4" />
            </button>
          )}

          {/* Chat Popup Button (with unread badge) */}
          <button
            type="button"
            onClick={handleOpenChat}
            title="Buka Obrolan Game (C / T)"
            className="relative p-2 sm:px-3 sm:py-2 rounded-2xl bg-[#EFF8FF] hover:bg-[#DDF0FF] text-[#1C8BE0] border-2 border-[#8CD3FF] transition font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF4D4D] text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Roster / Players Popup Button */}
          <button
            type="button"
            onClick={() => setIsRosterOpen(true)}
            title="Daftar Pemain (U)"
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#3A332C] border-2 border-[#F0DDC5] transition font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-xs"
          >
            <Users className="w-4 h-4 text-[#FFA012]" />
            <span className="hidden md:inline">
              Pemain ({livingPlayers.length}/{totalPlayers})
            </span>
          </button>

          {/* Landscape Mode Button (especially valuable for Impostor and mobile) */}
          <button
            type="button"
            onClick={handleToggleLandscape}
            title="Beralih ke Mode Landscape (Mendatar)"
            className={`p-2 rounded-2xl border-2 transition cursor-pointer active:scale-95 shrink-0 ${
              isLandscapeMode || isForcedLandscape
                ? "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9] shadow-xs"
                : "bg-[#FFFBF5] text-[#8C8275] hover:text-[#3A332C] border-[#F0DDC5]"
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Desktop Focus View Toggle (Focus Canvas vs Split Sidebar) */}
          {!isFullscreen && onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              title={isFocusMode ? "Mode Bagi (Tampilkan Sidebar)" : "Mode Fokus (Kanvas Penuh)"}
              className="hidden lg:flex p-2 rounded-2xl bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#8C8275] hover:text-[#3A332C] border-2 border-[#F0DDC5] transition cursor-pointer active:scale-95 shrink-0"
            >
              {isFocusMode ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh (Esc / F)" : "Layar Penuh (F)"}
            className={`p-2 sm:px-3 sm:py-2 rounded-2xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
              isFullscreen
                ? "bg-[#FFF0ED] text-[#E64B2D] border-2 border-[#FFB2A1] shadow-xs"
                : "btn-3d-blue shadow-sm"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>

          {/* Host Cancel Button in Fullscreen */}
          {isFullscreen && isHost && onCancelGame && (
            <button
              type="button"
              onClick={onCancelGame}
              title="Batalkan Permainan"
              className="p-2 rounded-2xl bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1] hover:bg-[#FFE0D9] transition cursor-pointer shrink-0"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Mobile Landscape Suggestion Banner (Dismissible tip for Impostor / mobile) */}
      {!isLandscapeMode && !isForcedLandscape && isImpostorGame && (
        <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#EFF8FF] to-[#F7F1FF] border-2 border-[#8CD3FF] flex items-center justify-between gap-2 shadow-xs animate-pop-spring text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <RotateCw className="w-4 h-4 text-[#1C8BE0] shrink-0 animate-spin" />
            <span className="font-extrabold text-[#3A332C] truncate">
              📱 Tip: Putar ke mode <strong>Landscape</strong> untuk kontrol joystick dan pandangan kapal terbaik!
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleLandscape}
            className="px-2.5 py-1 rounded-xl bg-[#50B5FF] text-white font-black text-[11px] shrink-0 cursor-pointer shadow-2xs hover:bg-[#3AA5F8] active:scale-95"
          >
            Putar Layar
          </button>
        </div>
      )}

      {/* 3. Main Game Viewport Canvas Stage */}
      <main
        className={`relative w-full flex-1 flex flex-col ${
          isFullscreen
            ? "min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-4 pb-24"
            : "min-h-[420px]"
        }`}
      >
        {/* Render the Active Game Component */}
        {children}
      </main>

      {/* 4. Floating Chat Modal */}
      <GameChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={discussionMessages}
        currentSocketId={socket?.id}
        currentPlayerId={identity?.playerId}
        currentNickname={nickname}
        onSendMessage={onSendMessage}
        activeGameType={activeGameMeta?.id}
        isAlive={isMyPlayerAlive}
        isSpectator={isSpectator}
        container={containerRef.current}
      />

      {/* 5. Floating Roster Modal */}
      <GameRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        players={room?.players || []}
        hostId={room?.hostId}
        currentSocketId={socket?.id}
        currentPlayerId={identity?.playerId}
        currentTurnSocketId={currentTurnSocketId}
        currentTurnPlayerId={currentTurnPlayerId}
        gameType={activeGameMeta?.id}
        container={containerRef.current}
      />
    </div>
  );
}
