import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { socket } from "./socket";
import { getOrCreatePlayerIdentity, savePlayerName } from "./utils/identity";
import { playSound, isSoundMuted, toggleSoundMute } from "./utils/sound";
import { getGameMeta } from "./games/registry";

import Avatar from "./components/Avatar";
import PlayerList from "./components/PlayerList";
import GameOverModal from "./components/GameOverModal";
import LeaderboardModal from "./components/LeaderboardModal";
import WorkplaceCamouflage from "./components/WorkplaceCamouflage";
import TimerDisplay from "./components/TimerDisplay";
import EliminationModal from "./components/EliminationModal";
import ActiveGameBanner from "./components/ActiveGameBanner";
import GameSelectorModal from "./components/GameSelectorModal";
import LandingHub from "./components/LandingHub";
import UndercoverOffline from "./games/undercover/UndercoverOffline";

import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Trophy,
  Copy,
  Check,
  DoorOpen,
  Sparkles,
  Share2,
  Link,
  Eye,
  Send,
  MessageSquare,
  HelpCircle,
  Smile,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  StopCircle,
} from "lucide-react";

export default function App() {
  const [identity] = useState(() => getOrCreatePlayerIdentity());
  const [nickname, setNickname] = useState(() => identity.cachedName || "");
  const [roomId, setRoomId] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return (urlParams.get("room") || "").toUpperCase();
    }
    return "";
  });
  const [isJoined, setIsJoined] = useState(false);
  const [room, setRoom] = useState(null);
  const [lobbyTab, setLobbyTab] = useState("chat");
  const [lobbyMsgInput, setLobbyMsgInput] = useState("");
  const lobbyChatContainerRef = useRef(null);

  // Multi-game Modal
  const [showGameSelector, setShowGameSelector] = useState(false);

  // Offline Mode (Pass & Play)
  const [activeOfflineGame, setActiveOfflineGame] = useState(null);

  // Gameplay State (Shared & Game-Specific)
  const [myRoleData, setMyRoleData] = useState(null);
  const [currentTurnSocketId, setCurrentTurnSocketId] = useState(null);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState(null);
  const [currentTurnName, setCurrentTurnName] = useState("");
  const [currentTurnEndsAt, setCurrentTurnEndsAt] = useState(null);
  const [clueInput, setClueInput] = useState("");

  // Memorize / Ready Phase State
  const [memorizeEndsAt, setMemorizeEndsAt] = useState(null);
  const [isReadyConfirmed, setIsReadyConfirmed] = useState(false);
  const [readyStats, setReadyStats] = useState({ readyCount: 0, totalPlayers: 0 });

  // Discussion State (Undercover)
  const [discussionEndsAt, setDiscussionEndsAt] = useState(null);
  const [isDiscussionReady, setIsDiscussionReady] = useState(false);
  const [discussionReadyStats, setDiscussionReadyStats] = useState({
    readyCount: 0,
    totalAlive: 0,
    readySocketIds: [],
  });

  // Inquiry State (Spyfall)
  const [inquiryEndsAt, setInquiryEndsAt] = useState(null);

  // Werewolf Timers
  const [nightEndsAt, setNightEndsAt] = useState(null);
  const [dayDiscussionEndsAt, setDayDiscussionEndsAt] = useState(null);

  // Draw & Guess Timers
  const [choiceEndsAt, setChoiceEndsAt] = useState(null);
  const [drawEndsAt, setDrawEndsAt] = useState(null);

  // Voting State
  const [votingCandidates, setVotingCandidates] = useState([]);
  const [votingEndsAt, setVotingEndsAt] = useState(null);
  const [votedTarget, setVotedTarget] = useState(null);
  const [voteStats, setVoteStats] = useState({ votedCount: 0, totalAlive: 0 });

  // Elimination Reveal Modal State
  const [eliminationModalData, setEliminationModalData] = useState(null);
  const eliminationModalRef = useRef(null);

  // Mr. White Guess State
  const [mrWhiteGuessTarget, setMrWhiteGuessTarget] = useState(null);
  const [mrWhiteInput, setMrWhiteInput] = useState("");

  // End Game State
  const [gameOverData, setGameOverData] = useState(null);
  const [pendingGameOverData, setPendingGameOverData] = useState(null);
  const [showCancelGameModal, setShowCancelGameModal] = useState(false);

  // Alert & Modals
  const [bannerAlert, setBannerAlert] = useState(null);
  const alertTimeoutRef = useRef(null);

  const showAlert = (msg) => {
    if (!msg) return;
    setBannerAlert(msg);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setBannerAlert(null);
    }, 4000);
  };

  const closeAlert = () => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setBannerAlert(null);
  };

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isCamouflaged, setIsCamouflaged] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => isSoundMuted());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isBottomDockOpen, setIsBottomDockOpen] = useState(false);

  const activeGameType = room?.gameType || "undercover";
  const activeGameMeta = getGameMeta(activeGameType);

  // Keyboard shortcut listener for Panic Button (ESC / Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || (e.ctrlKey && e.key.toLowerCase() === "b")) {
        e.preventDefault();
        setIsCamouflaged((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    socket.connect();

    // Auto-reconnect to existing session if page was refreshed
    const savedRoomId = sessionStorage.getItem("stealth_room_id");
    if (savedRoomId && identity.playerId) {
      socket.emit("room:join", {
        roomId: savedRoomId,
        name: identity.cachedName || "Pemain",
        playerId: identity.playerId,
      });
    }

    socket.on("room:updated", (updatedRoom) => {
      setRoom(updatedRoom);
      setIsJoined(true);
      if (updatedRoom?.id) {
        sessionStorage.setItem("stealth_room_id", updatedRoom.id);
      }
      if (updatedRoom?.currentTurnSocketId) {
        setCurrentTurnSocketId(updatedRoom.currentTurnSocketId);
        setCurrentTurnPlayerId(updatedRoom.currentTurnPlayerId);
        setCurrentTurnName(updatedRoom.currentTurnName);
        setCurrentTurnEndsAt(updatedRoom.currentTurnEndsAt);
      }
    });

    socket.on("room:game_changed", (data) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              gameType: data.gameType,
              settings: data.settings,
            }
          : prev,
      );
      showAlert(`👑 Host mengubah permainan menjadi: ${data.gameConfig?.fullName || data.gameType}!`);
      playSound("message");
    });

    socket.on("room:settings_updated", (newSettings) => {
      setRoom((prev) => (prev ? { ...prev, settings: newSettings } : prev));
    });

    socket.on("session:restored", (data) => {
      const {
        room: restoredRoom,
        roleData,
        currentTurnSocketId: turnId,
        currentTurnEndsAt: turnEnds,
        memorizeEndsAt: memEnds,
        isReady: rReady,
        discussionEndsAt: discEnds,
        inquiryEndsAt: inqEnds,
        nightEndsAt: nEnds,
        dayDiscussionEndsAt: dEnds,
        choiceEndsAt: cEnds,
        drawEndsAt: drEnds,
        discussionReadyCount: rDiscCount,
        isDiscussionReady: rDiscReady,
        discussionReadySocketIds: rDiscIds,
        votingEndsAt: vEnds,
        votingCandidates: vCandidates,
        votedTarget: vTarget,
        voteStats: vStats,
        mrWhiteGuessTarget: mrwTarget,
        gameOverData: goData,
      } = data;

      setRoom(restoredRoom);
      setIsJoined(true);
      if (restoredRoom?.id) {
        sessionStorage.setItem("stealth_room_id", restoredRoom.id);
      }

      if (roleData) setMyRoleData(roleData);
      if (turnId) setCurrentTurnSocketId(turnId);
      if (turnEnds) setCurrentTurnEndsAt(turnEnds);
      if (memEnds) {
        setMemorizeEndsAt(memEnds);
        const alive = (restoredRoom?.players || []).filter((p) => p.isAlive);
        setReadyStats({
          readyCount: restoredRoom?.readyCount || 0,
          totalPlayers: alive.length,
        });
      }
      if (rReady !== undefined) setIsReadyConfirmed(rReady);
      if (discEnds) setDiscussionEndsAt(discEnds);
      if (inqEnds) setInquiryEndsAt(inqEnds);
      if (nEnds) setNightEndsAt(nEnds);
      if (dEnds) setDayDiscussionEndsAt(dEnds);
      if (cEnds) setChoiceEndsAt(cEnds);
      if (drEnds) setDrawEndsAt(drEnds);
      if (rDiscReady !== undefined) setIsDiscussionReady(rDiscReady);
      if (rDiscCount !== undefined) {
        const alive = (restoredRoom?.players || []).filter((p) => p.isAlive && p.connected);
        setDiscussionReadyStats({
          readyCount: rDiscCount,
          totalAlive: alive.length,
          readySocketIds: rDiscIds || [],
        });
      }
      if (vEnds) setVotingEndsAt(vEnds);
      if (vCandidates && vCandidates.length > 0) {
        setVotingCandidates(vCandidates);
      }
      if (vTarget !== undefined) setVotedTarget(vTarget);
      if (vStats) setVoteStats(vStats);
      if (mrwTarget) setMrWhiteGuessTarget(mrwTarget);
      if (goData) setGameOverData(goData);
    });

    socket.on("game:role_assigned", (data) => {
      setMyRoleData(data);
      setGameOverData(null);
      setPendingGameOverData(null);
      setVotedTarget(null);
      eliminationModalRef.current = null;
      setEliminationModalData(null);
      setMrWhiteGuessTarget(null);
      setIsReadyConfirmed(false);
      setIsDiscussionReady(false);
      showAlert("Misi Dimulai! Peran dan identitas rahasiamu telah diberikan.");
      playSound("reveal");
    });

    socket.on("phase:memorize_start", ({ endsAt, totalPlayers, readyCount, gameType }) => {
      setMemorizeEndsAt(endsAt);
      setIsReadyConfirmed(false);
      setIsDiscussionReady(false);
      eliminationModalRef.current = null;
      setEliminationModalData(null);
      setVotedTarget(null);
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setDiscussionEndsAt(null);
      setNightEndsAt(null);
      setDayDiscussionEndsAt(null);
      setChoiceEndsAt(null);
      setDrawEndsAt(null);
      setMrWhiteGuessTarget(null);
      setGameOverData(null);
      setPendingGameOverData(null);
      setRoom((prev) => (prev ? { ...prev, status: "MEMORIZE_PHASE" } : prev));
      setReadyStats({ readyCount: readyCount || 0, totalPlayers: totalPlayers || 0 });
      showAlert("Fase Rahasia: Simak identitasmu dan konfirmasi saat siap!");
    });

    socket.on("ready:update", ({ readyCount, totalPlayers, readySocketIds }) => {
      setReadyStats({ readyCount, totalPlayers });
      if (readySocketIds && readySocketIds.includes(socket.id)) {
        setIsReadyConfirmed(true);
      }
    });

    // Undercover Clue Turn Listener
    socket.on(
      "turn:change",
      ({ currentTurnSocketId: turnId, currentTurnPlayerId: turnPlayerId, currentTurnName: turnName, endsAt }) => {
        setCurrentTurnSocketId(turnId);
        setCurrentTurnPlayerId(turnPlayerId);
        setCurrentTurnName(turnName);
        setCurrentTurnEndsAt(endsAt);
        setMemorizeEndsAt(null);

        const isMyTurn = Boolean(
          (turnId && turnId === socket.id) ||
          (turnPlayerId && identity.playerId && turnPlayerId === identity.playerId) ||
          (turnName && identity.cachedName && turnName.trim().toLowerCase() === identity.cachedName.trim().toLowerCase()),
        );
        playSound("turn", { isMyTurn });
      },
    );

    socket.on("clue:new", (clue) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.clues?.some(
          (c) =>
            c.senderId === clue.senderId &&
            c.timestamp === clue.timestamp &&
            c.text === clue.text,
        );
        if (exists) return prev;
        return { ...prev, clues: [...(prev.clues || []), clue] };
      });
      playSound("message", { isSelf: clue.senderSocketId === socket.id });
    });

    socket.on("phase:clue_start", ({ room: refreshedRoom, roundNumber }) => {
      setRoom(refreshedRoom);
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setDiscussionEndsAt(null);
      setMemorizeEndsAt(null);
      setVotedTarget(null);
      setMrWhiteGuessTarget(null);
      const rNum = roundNumber || refreshedRoom?.roundNumber || 1;
      showAlert(`🎯 Ronde ${rNum} Dimulai! Giliran memberikan petunjuk berikutnya.`);
      playSound("reveal");
    });

    // Undercover Discussion Listeners
    socket.on("phase:discussion_start", ({ endsAt, readyCount, totalAlive, readySocketIds }) => {
      setDiscussionEndsAt(endsAt);
      setMemorizeEndsAt(null);
      setVotingEndsAt(null);
      setVotingCandidates([]);
      setVotedTarget(null);
      setMrWhiteGuessTarget(null);
      setEliminationModalData(null);
      setIsDiscussionReady(false);
      setRoom((prev) => (prev ? { ...prev, status: "DISCUSSION_PHASE" } : prev));
      setDiscussionReadyStats({
        readyCount: readyCount || 0,
        totalAlive: totalAlive || 0,
        readySocketIds: readySocketIds || [],
      });
      showAlert("🔥 Fase Diskusi Bebas! Berdebatlah atau klik 'Sudah Fix' bila siap voting.");
      playSound("turn");
    });

    socket.on("discussion:ready_update", ({ readyCount, totalAlive, readySocketIds }) => {
      setDiscussionReadyStats({ readyCount, totalAlive, readySocketIds });
      if (readySocketIds && readySocketIds.includes(socket.id)) {
        setIsDiscussionReady(true);
      } else {
        setIsDiscussionReady(false);
      }
    });

    socket.on("discussion:new_message", (msg) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          discussionMessages: [...(prev.discussionMessages || []), msg],
        };
      });
      playSound("message", { isSelf: msg.senderSocketId === socket.id });
    });

    // Voting Listeners
    socket.on("phase:voting_start", ({ alivePlayers, endsAt }) => {
      setVotingCandidates(alivePlayers || []);
      setVotingEndsAt(endsAt);
      setDiscussionEndsAt(null);
      setMemorizeEndsAt(null);
      setNightEndsAt(null);
      setDayDiscussionEndsAt(null);
      setIsDiscussionReady(false);
      setVotedTarget(null);
      setMrWhiteGuessTarget(null);
      setEliminationModalData(null);
      setRoom((prev) => (prev ? { ...prev, status: "VOTING_PHASE" } : prev));
      setVoteStats({
        votedCount: 0,
        totalAlive: alivePlayers ? alivePlayers.length : 0,
      });
      showAlert("Fase Voting Dimulai! Pilih siapa yang ingin dieksekusi.");
      playSound("turn");
    });

    socket.on("vote:update", ({ votedCount, totalAlive }) => {
      setVoteStats({ votedCount, totalAlive });
    });

    socket.on("vote:result", ({ isTie, tiedCandidates, eliminated, message }) => {
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setVotedTarget(null);
      showAlert(message);
      if (isTie) {
        playSound("turn");
        const modalData = {
          isTie: true,
          tiedCandidates: tiedCandidates || [],
          message,
        };
        eliminationModalRef.current = modalData;
        setEliminationModalData(modalData);
      } else {
        playSound("eliminated");
        if (eliminated) {
          const modalData = {
            isTie: false,
            name: eliminated.name,
            role: eliminated.role,
            message,
          };
          eliminationModalRef.current = modalData;
          setEliminationModalData(modalData);
        }
      }
    });

    socket.on("mrwhite:guess_time", (data) => {
      setMrWhiteGuessTarget(data);
      setRoom((prev) => (prev ? { ...prev, status: "MR_WHITE_GUESS" } : prev));
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setVotedTarget(null);
      setDiscussionEndsAt(null);
      setMemorizeEndsAt(null);
      eliminationModalRef.current = null;
      setEliminationModalData(null);
      showAlert(`Mr. White (${data.mrWhiteName}) sedang menebak kata Civilian!`);
    });

    socket.on("mrwhite:guess_fail", ({ message }) => {
      showAlert(message);
    });

    // Spyfall Socket Listeners
    socket.on("spyfall:inquiry_start", ({ endsAt, starterPlayerName }) => {
      setInquiryEndsAt(endsAt);
      setMemorizeEndsAt(null);
      setRoom((prev) => (prev ? { ...prev, status: "INQUIRY_PHASE" } : prev));
      showAlert(`🔍 Tanya Jawab Dimulai! Giliran pertama bertanya: ${starterPlayerName}`);
      playSound("reveal");
    });

    socket.on("spyfall:accusation_started", ({ accuserName, suspectName, endsAt }) => {
      setRoom((prev) => (prev ? { ...prev, status: "ACCUSATION_PHASE" } : prev));
      showAlert(`⚠️ ${accuserName} menuduh ${suspectName} adalah Spy!`);
      playSound("turn");
    });

    socket.on("spyfall:accusation_vote_update", ({ agreeCount, votedCount, totalVoters }) => {
      playSound("turn");
      showAlert(`🗳️ Suara masuk: ${votedCount}/${totalVoters} pemain telah memilih.`);
    });

    socket.on("spyfall:accusation_rejected", ({ message }) => {
      showAlert(message);
    });

    socket.on("spyfall:inquiry_resumed", ({ endsAt }) => {
      setInquiryEndsAt(endsAt);
      setRoom((prev) => (prev ? { ...prev, status: "INQUIRY_PHASE" } : prev));
      showAlert("⏱️ Tanya jawab dilanjutkan!");
    });

    socket.on("spyfall:guess_phase_start", ({ spyName, message }) => {
      setRoom((prev) => (prev ? { ...prev, status: "SPY_GUESS_PHASE" } : prev));
      showAlert(message);
      playSound("turn");
    });

    // Werewolf Socket Listeners
    socket.on("werewolf:night_start", ({ endsAt, roundNumber }) => {
      setNightEndsAt(endsAt);
      setMemorizeEndsAt(null);
      setVotingEndsAt(null);
      setDayDiscussionEndsAt(null);
      setRoom((prev) => (prev ? { ...prev, status: "NIGHT_PHASE", roundNumber } : prev));
      showAlert(`🌙 Malam Hari (Ronde ${roundNumber || 1}) Telah Tiba!`);
      playSound("turn");
    });

    socket.on("werewolf:day_start", ({ endsAt, announcement, roundNumber }) => {
      setDayDiscussionEndsAt(endsAt);
      setNightEndsAt(null);
      setVotingEndsAt(null);
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              status: "DAY_PHASE",
              dayAnnouncement: announcement,
              roundNumber,
            }
          : prev,
      );
      showAlert("☀️ Fajar Menyingsing! Musyawarah desa dimulai.");
      playSound("reveal");
    });

    // Draw & Guess Socket Listeners
    socket.on("draw:word_choices", ({ endsAt }) => {
      setChoiceEndsAt(endsAt);
      setRoom((prev) => (prev ? { ...prev, status: "WORD_CHOICE_PHASE" } : prev));
      playSound("turn");
    });

    socket.on("draw:turn_active_drawer", ({ endsAt }) => {
      setDrawEndsAt(endsAt);
      setChoiceEndsAt(null);
      setRoom((prev) => (prev ? { ...prev, status: "DRAWING_PHASE" } : prev));
      playSound("reveal");
    });

    socket.on("draw:turn_active_guesser", ({ endsAt }) => {
      setDrawEndsAt(endsAt);
      setChoiceEndsAt(null);
      setRoom((prev) => (prev ? { ...prev, status: "DRAWING_PHASE" } : prev));
      playSound("reveal");
    });

    socket.on("draw:turn_summary", () => {
      setDrawEndsAt(null);
      setChoiceEndsAt(null);
      setRoom((prev) => (prev ? { ...prev, status: "ROUND_SUMMARY_PHASE" } : prev));
      playSound("turn");
    });

    // Remi Game Socket Listeners
    socket.on("remi:game_started", (data) => {
      if (data.currentTurnSocketId) {
        setCurrentTurnSocketId(data.currentTurnSocketId);
        setCurrentTurnPlayerId(data.currentTurnPlayerId);
        setCurrentTurnName(data.currentTurnName);
        setCurrentTurnEndsAt(data.currentTurnEndsAt);
      }
      setRoom((prev) => (prev ? { ...prev, status: "PLAYING_PHASE" } : prev));
      playSound("reveal");
    });

    socket.on("remi:turn_change", (data) => {
      setCurrentTurnSocketId(data.currentTurnSocketId);
      setCurrentTurnPlayerId(data.currentTurnPlayerId);
      setCurrentTurnName(data.currentTurnName);
      setCurrentTurnEndsAt(data.endsAt);
      const isTurn = Boolean(
        (data.currentTurnSocketId && data.currentTurnSocketId === socket.id) ||
        (data.currentTurnPlayerId && identity.playerId && data.currentTurnPlayerId === identity.playerId) ||
        (data.currentTurnName && identity.cachedName && data.currentTurnName.trim().toLowerCase() === identity.cachedName.trim().toLowerCase())
      );
      playSound("turn", { isMyTurn: isTurn });
    });

    // UNO Game Socket Listeners
    socket.on("uno:game_started", (data) => {
      if (data.currentTurnSocketId) {
        setCurrentTurnSocketId(data.currentTurnSocketId);
        setCurrentTurnPlayerId(data.currentTurnPlayerId);
        setCurrentTurnName(data.currentTurnName);
        setCurrentTurnEndsAt(data.currentTurnEndsAt);
      }
      setRoom((prev) => (prev ? { ...prev, status: "PLAYING_PHASE" } : prev));
      playSound("reveal");
    });

    socket.on("uno:turn_change", (data) => {
      setCurrentTurnSocketId(data.currentTurnSocketId);
      setCurrentTurnPlayerId(data.currentTurnPlayerId);
      setCurrentTurnName(data.currentTurnName);
      setCurrentTurnEndsAt(data.endsAt);
      const isTurn = Boolean(
        (data.currentTurnSocketId && data.currentTurnSocketId === socket.id) ||
        (data.currentTurnPlayerId && identity.playerId && data.currentTurnPlayerId === identity.playerId) ||
        (data.currentTurnName && identity.cachedName && data.currentTurnName.trim().toLowerCase() === identity.cachedName.trim().toLowerCase())
      );
      playSound("turn", { isMyTurn: isTurn });
    });

    // Game Over & Return
    socket.on("game:over", (data) => {
      setLeaderboardData(data.leaderboard || []);
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setVotedTarget(null);
      setDiscussionEndsAt(null);
      setMemorizeEndsAt(null);
      setInquiryEndsAt(null);
      setNightEndsAt(null);
      setDayDiscussionEndsAt(null);
      setChoiceEndsAt(null);
      setDrawEndsAt(null);
      setMrWhiteGuessTarget(null);
      setShowCancelGameModal(false);

      if (eliminationModalRef.current && (data.gameType === "undercover" || data.gameType === "werewolf")) {
        setPendingGameOverData(data);
        setEliminationModalData((prev) => {
          const updated = prev ? { ...prev, isGameOver: true } : prev;
          eliminationModalRef.current = updated;
          return updated;
        });
      } else {
        eliminationModalRef.current = null;
        setEliminationModalData(null);
        setGameOverData(data);
        setRoom((prev) => (prev ? { ...prev, status: "GAME_OVER" } : prev));

        setMyRoleData((currentRole) => {
          const amIWinner =
            (data.winnerSocketId && data.winnerSocketId === socket.id) ||
            (data.players && data.players.some((p) => p.isWinner && (p.socketId === socket.id || (identity.playerId && p.playerId === identity.playerId)))) ||
            (currentRole && (
              currentRole.role === data.winnerRole ||
              currentRole.isWinner ||
              (data.winnerRole === "SPY" && currentRole.isSpy) ||
              (data.winnerRole === "CITIZEN" && !currentRole.isSpy) ||
              (data.winnerRole === "UNDERCOVER" && currentRole.role === "UNDERCOVER") ||
              (data.winnerRole === "VILLAGER" && currentRole.role !== "WEREWOLF") ||
              (data.winnerRole === "WEREWOLF" && currentRole.role === "WEREWOLF") ||
              (data.winnerRole === "CREWMATE" && currentRole.role === "CREWMATE") ||
              (data.winnerRole === "IMPOSTOR" && currentRole.role === "IMPOSTOR")
            ));
          playSound(amIWinner ? "win" : "defeat");
          return currentRole;
        });
      }
    });

    socket.on("room:returned_to_lobby", ({ room: refreshedRoom }) => {
      setRoom(refreshedRoom);
      setShowCancelGameModal(false);
      setGameOverData(null);
      setPendingGameOverData(null);
      setMyRoleData(null);
      setEliminationModalData(null);
      eliminationModalRef.current = null;
      setIsReadyConfirmed(false);
      setVotingCandidates([]);
      setVotingEndsAt(null);
      setMemorizeEndsAt(null);
      setDiscussionEndsAt(null);
      setInquiryEndsAt(null);
      setNightEndsAt(null);
      setDayDiscussionEndsAt(null);
      setChoiceEndsAt(null);
      setDrawEndsAt(null);
      setMrWhiteGuessTarget(null);
      setVotedTarget(null);
      setIsDiscussionReady(false);
      showAlert("👑 Permainan dikembalikan ke Ruang Tunggu (Lobby).");
      playSound("message");
    });

    socket.on("host:migrated", ({ newHostName }) => {
      showAlert(`Host ruangan telah berpindah ke ${newHostName}`);
    });

    socket.on("leaderboard:reset", () => {
      setLeaderboardData([]);
      showAlert("Podium & statistik pemain telah direset.");
    });

    socket.on("error:message", (msg) => {
      showAlert(`Perhatian: ${msg}`);
      if (
        msg &&
        (msg.toLowerCase().includes("tidak ditemukan") ||
          msg.toLowerCase().includes("sudah ditutup") ||
          msg.toLowerCase().includes("tidak aktif"))
      ) {
        sessionStorage.removeItem("stealth_room_id");
        setIsJoined(false);
        setRoom(null);
        if (typeof window !== "undefined" && window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    return () => {
      socket.off("room:updated");
      socket.off("room:game_changed");
      socket.off("room:settings_updated");
      socket.off("session:restored");
      socket.off("game:role_assigned");
      socket.off("phase:memorize_start");
      socket.off("ready:update");
      socket.off("turn:change");
      socket.off("clue:new");
      socket.off("phase:clue_start");
      socket.off("phase:discussion_start");
      socket.off("discussion:ready_update");
      socket.off("discussion:new_message");
      socket.off("phase:voting_start");
      socket.off("vote:update");
      socket.off("vote:result");
      socket.off("mrwhite:guess_time");
      socket.off("mrwhite:guess_fail");
      socket.off("spyfall:inquiry_start");
      socket.off("spyfall:accusation_started");
      socket.off("spyfall:accusation_vote_update");
      socket.off("spyfall:accusation_rejected");
      socket.off("spyfall:inquiry_resumed");
      socket.off("spyfall:guess_phase_start");
      socket.off("werewolf:night_start");
      socket.off("werewolf:day_start");
      socket.off("draw:word_choices");
      socket.off("draw:turn_active_drawer");
      socket.off("draw:turn_active_guesser");
      socket.off("draw:turn_summary");
      socket.off("room:returned_to_lobby");
      socket.off("game:over");
      socket.off("host:migrated");
      socket.off("error:message");
    };
  }, [identity.playerId, identity.cachedName]);

  // Auto-scroll Lobby chat container
  useEffect(() => {
    if (lobbyChatContainerRef.current) {
      lobbyChatContainerRef.current.scrollTop = lobbyChatContainerRef.current.scrollHeight;
    }
  }, [room?.discussionMessages?.length, lobbyTab]);

  const handleCreateRoom = (selectedGameType = "undercover") => {
    if (!nickname.trim()) {
      showAlert("⚠️ Silakan isi Nickname / Nama Panggilan terlebih dahulu!");
      return;
    }
    savePlayerName(nickname.trim());
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanGameType = typeof selectedGameType === "string" ? selectedGameType : "undercover";
    socket.emit("room:create", {
      roomId: code,
      name: nickname.trim(),
      playerId: identity.playerId,
      gameType: cleanGameType,
    });
  };

  const handleJoinRoom = (e) => {
    if (e) e.preventDefault();
    if (!nickname.trim()) {
      showAlert("⚠️ Silakan isi Nickname / Nama Panggilan terlebih dahulu sebelum bergabung!");
      return;
    }
    if (!roomId.trim()) {
      showAlert("⚠️ Silakan masukkan 4 Digit Kode Ruangan yang ingin diikuti!");
      return;
    }
    savePlayerName(nickname.trim());
    socket.emit("room:join", {
      roomId: roomId.trim().toUpperCase(),
      name: nickname.trim(),
      playerId: identity.playerId,
    });
  };

  const handleChangeGame = (selectedGameType) => {
    if (!room) return;
    socket.emit("room:change_game", {
      roomId: room.id,
      gameType: selectedGameType,
    });
  };

  const handleUpdateSettings = (newSettings) => {
    if (!room) return;
    socket.emit("room:update_settings", { roomId: room.id, settings: newSettings });
  };

  const handleStartGame = () => {
    if (!room) return;
    socket.emit("game:start", { roomId: room.id });
  };

  const handleAddBot = () => {
    if (!room) return;
    socket.emit("room:add_bot", { roomId: room.id });
  };

  const handleRemoveBot = (botSocketId) => {
    if (!room) return;
    socket.emit("room:remove_bot", { roomId: room.id, botSocketId });
  };

  const handleReturnToLobby = () => {
    if (!room) return;
    socket.emit("room:return_lobby", { roomId: room.id });
  };

  const handleConfirmCancelGame = () => {
    if (!room) return;
    socket.emit("room:return_lobby", { roomId: room.id });
    setShowCancelGameModal(false);
  };


  const handleMarkReady = () => {
    if (!room || isReadyConfirmed) return;
    setIsReadyConfirmed(true);
    socket.emit("player:ready", { roomId: room.id });
  };

  const handleToggleDiscussionReady = () => {
    if (!room || room.status !== "DISCUSSION_PHASE") return;
    socket.emit("discussion:ready_toggle", { roomId: room.id });
  };

  const handleSendClue = (e) => {
    if (e) e.preventDefault();
    if (!clueInput.trim() || !room) return;
    socket.emit("clue:send", { roomId: room.id, text: clueInput.trim() });
    setClueInput("");
  };

  const handleSendDiscussionMessage = (text) => {
    if (!room || !text) return;
    socket.emit("discussion:send", { roomId: room.id, text });
  };

  const handleSendLobbyMessage = (e) => {
    if (e) e.preventDefault();
    if (!lobbyMsgInput.trim() || !room) return;
    handleSendDiscussionMessage(lobbyMsgInput.trim());
    setLobbyMsgInput("");
    playSound("message");
  };

  const handleQuickLobbyChip = (text) => {
    if (!room || !text) return;
    handleSendDiscussionMessage(text);
    playSound("message");
  };

  const handleSkipDiscussionToVoting = () => {
    if (!room) return;
    socket.emit("discussion:skip", { roomId: room.id });
  };

  const handleCastVote = (targetSocketId) => {
    if (votedTarget || !room) return;
    setVotedTarget(targetSocketId);
    socket.emit("vote:submit", { roomId: room.id, targetSocketId });
  };

  const handleMrWhiteSubmit = (e) => {
    if (e) e.preventDefault();
    if (!mrWhiteInput.trim() || !room) return;
    socket.emit("mrwhite:guess_submit", {
      roomId: room.id,
      guessText: mrWhiteInput.trim(),
    });
    setMrWhiteInput("");
  };

  const handleRoomIdChange = (val) => {
    let clean = (val || "").trim();
    const match = clean.match(/[?&]room=([a-zA-Z0-9]+)/i);
    if (match && match[1]) {
      setRoomId(match[1].toUpperCase().slice(0, 6));
      showAlert(`✓ Kode ruangan ${match[1].toUpperCase()} berhasil dimasukkan dari link!`);
      return;
    }
    setRoomId(clean.toUpperCase().slice(0, 6));
  };

  const handleRoomIdPaste = (e) => {
    const text = e.clipboardData?.getData("text");
    if (text) {
      e.preventDefault();
      handleRoomIdChange(text);
    }
  };

  const handleToggleSound = () => {
    const muted = toggleSoundMute();
    setSoundMuted(muted);
  };

  const handleCopyRoomCode = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!room) return;
    const shareUrl = `${window.location.origin}/?room=${room.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCode(true);
    showAlert(`🔗 Link undangan disalin: ${shareUrl}`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareRoom = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!room) return;
    const shareUrl = `${window.location.origin}/?room=${room.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Party Games Suite",
          text: `Ayo main game bersamaku! Gabung ruangan dengan kode: ${room.id}`,
          url: shareUrl,
        });
        return;
      } catch (err) {}
    }
    handleCopyRoomCode(e);
  };

  const handleDismissEliminationModal = () => {
    eliminationModalRef.current = null;
    setEliminationModalData(null);
    if (pendingGameOverData) {
      const pData = pendingGameOverData;
      setGameOverData(pData);
      setRoom((prev) => (prev ? { ...prev, status: "GAME_OVER" } : prev));
      setMyRoleData((currentRole) => {
        const amIWinner =
          currentRole &&
          (currentRole.role === pData.winnerRole ||
            currentRole.isWinner ||
            (pData.winnerRole === "UNDERCOVER" && currentRole.role === "UNDERCOVER") ||
            (pData.winnerRole === "CREWMATE" && currentRole.role === "CREWMATE") ||
            (pData.winnerRole === "IMPOSTOR" && currentRole.role === "IMPOSTOR"));
        playSound(amIWinner ? "win" : "defeat");
        return currentRole;
      });
      setPendingGameOverData(null);
    }
  };

  const handleResetLeaderboard = async () => {
    try {
      socket.emit("leaderboard:reset");
      const res = await fetch("/api/leaderboard/reset", { method: "POST" });
      await res.json();
      setLeaderboardData([]);
      showAlert("✓ Podium & statistik pemain berhasil direset!");
    } catch (e) {
      console.error("Reset leaderboard error:", e);
    }
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem("stealth_room_id");
    setIsJoined(false);
    setRoom(null);
    setMyRoleData(null);
    setGameOverData(null);
    setPendingGameOverData(null);
    eliminationModalRef.current = null;
    setEliminationModalData(null);
    window.location.reload();
  };

  const myPlayerObj = room?.players?.find(
    (p) =>
      p.socketId === socket.id ||
      (identity.playerId && p.playerId === identity.playerId) ||
      (nickname && p.name && p.name.trim().toLowerCase() === nickname.trim().toLowerCase()),
  );
  const isSpectator = myPlayerObj ? !!myPlayerObj.isSpectator : false;
  const isMyPlayerAlive = myPlayerObj ? myPlayerObj.isAlive && !myPlayerObj.isSpectator : true;

  const isMyTurn = Boolean(
    (currentTurnSocketId && currentTurnSocketId === socket.id) ||
    (currentTurnPlayerId && identity.playerId && currentTurnPlayerId === identity.playerId) ||
    (myPlayerObj && currentTurnSocketId && myPlayerObj.socketId === currentTurnSocketId) ||
    (myPlayerObj && currentTurnPlayerId && myPlayerObj.playerId === currentTurnPlayerId) ||
    (currentTurnName && nickname && currentTurnName.trim().toLowerCase() === nickname.trim().toLowerCase()),
  );
  const isHost = Boolean(
    (room?.hostId && room.hostId === socket.id) ||
    (myPlayerObj && room?.hostId && myPlayerObj.socketId === room.hostId) ||
    (identity.playerId && room?.hostPlayerId && identity.playerId === room.hostPlayerId),
  );

  const GameComponent = activeGameMeta.GameComponent;
  const RulesComponent = activeGameMeta.RulesComponent;

  if (isCamouflaged) {
    return <WorkplaceCamouflage onDismiss={() => setIsCamouflaged(false)} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between font-sans relative pb-32 sm:pb-36 selection:bg-[#50B5FF] selection:text-white">
      {/* Sleek Floating In-Game HUD */}
      {isJoined && (
        <div className="w-full max-w-6xl xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 flex items-center justify-between gap-3 animate-pop-spring">
          {/* Left: Floating Player Profile & Room Chip */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-[#F6E6D0] shadow-sm">
            <Avatar name={nickname || "Player"} size="xs" />
            <span className="font-extrabold text-xs text-[#3A332C]">
              {nickname || "Player"}
            </span>
            {room && (
              <>
                <span className="text-[#D9C4AB]">•</span>
                <button
                  onClick={handleCopyRoomCode}
                  title="Klik untuk salin kode room"
                  className="flex items-center gap-1 font-mono text-[#50B5FF] font-black text-xs bg-[#EFF8FF] px-2.5 py-0.5 rounded-full border border-[#8CD3FF] hover:bg-[#DDF0FF] transition cursor-pointer"
                >
                  <span>{room.id}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-[#24A654]" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#50B5FF]" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right: Floating Active Phase Timer Indicator & Host Cancel Button */}
          <div className="flex items-center gap-2">
            {room?.status !== "LOBBY" && room?.status !== "GAME_OVER" && isHost && (
              <button
                type="button"
                onClick={() => setShowCancelGameModal(true)}
                title="Batalkan permainan dan kembali ke lobby"
                className="flex items-center gap-1.5 text-xs font-black bg-[#FFF0ED] hover:bg-[#FFE0D9] text-[#E64B2D] border-2 border-[#FFB2A1] px-3 py-1.5 rounded-full transition shadow-xs cursor-pointer active:scale-95 shrink-0 animate-pop-spring"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Batalkan Game</span>
              </button>
            )}

            {room?.status === "MEMORIZE_PHASE" && memorizeEndsAt && (
              <TimerDisplay endsAt={memorizeEndsAt} duration={25} />
            )}
            {room?.status === "CLUE_PHASE" && currentTurnEndsAt && (
              <TimerDisplay endsAt={currentTurnEndsAt} duration={25} />
            )}
            {room?.status === "DISCUSSION_PHASE" && discussionEndsAt && (
              <TimerDisplay endsAt={discussionEndsAt} duration={120} />
            )}
            {room?.status === "INQUIRY_PHASE" && inquiryEndsAt && (
              <TimerDisplay endsAt={inquiryEndsAt} duration={(room.settings?.roundDurationMinutes || 5) * 60} />
            )}
            {room?.status === "NIGHT_PHASE" && nightEndsAt && (
              <TimerDisplay endsAt={nightEndsAt} duration={25} />
            )}
            {room?.status === "DAY_PHASE" && dayDiscussionEndsAt && (
              <TimerDisplay endsAt={dayDiscussionEndsAt} duration={room.settings?.dayDiscussionSeconds || 90} />
            )}
            {room?.status === "WORD_CHOICE_PHASE" && choiceEndsAt && (
              <TimerDisplay endsAt={choiceEndsAt} duration={15} />
            )}
            {room?.status === "DRAWING_PHASE" && drawEndsAt && (
              <TimerDisplay endsAt={drawEndsAt} duration={room.settings?.drawTimeLimit || 60} />
            )}
          </div>
        </div>
      )}

      {/* Main App Container with Safe Bottom Spacing */}
      <main className="flex-1 max-w-6xl xl:max-w-[1380px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col space-y-4 pb-28 sm:pb-24">
        {/* Global Floating Toast (Non-blocking & 100% Horizontally Centered via React Portal) */}
        {bannerAlert && typeof document !== "undefined" && createPortal(
          <div className="fixed top-5 inset-x-0 z-[9999] pointer-events-none flex justify-center px-4">
            <div className="pointer-events-auto max-w-lg w-auto min-w-[280px] max-w-[92vw] px-4 sm:px-5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-[#FFA012] shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-extrabold text-[#3A332C] animate-pop-spring">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-[#FFF8EC] text-[#D97E00] border border-[#FFA012]/50 shrink-0">
                  <Sparkles className="w-4 h-4 text-[#FFA012]" />
                </div>
                <span className="break-words font-black text-[#3A332C]">{bannerAlert}</span>
              </div>
              <button
                onClick={closeAlert}
                className="p-1 text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8] rounded-lg transition cursor-pointer shrink-0 font-black ml-1"
                title="Tutup Notifikasi"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}

        {!isJoined ? (
          activeOfflineGame === "undercover" ? (
            /* ================= OFFLINE PASS & PLAY MODE ================= */
            <UndercoverOffline onExit={() => setActiveOfflineGame(null)} />
          ) : (
            /* ================= SCREEN 1: LANDING GAME ARCADE & HUB ================= */
            <LandingHub
              nickname={nickname}
              onNicknameChange={setNickname}
              roomId={roomId}
              onRoomIdChange={handleRoomIdChange}
              onRoomIdPaste={handleRoomIdPaste}
              onCreateRoom={(gameId) => handleCreateRoom(gameId)}
              onJoinRoom={handleJoinRoom}
              onSelectOfflineGame={(gameId) => setActiveOfflineGame(gameId)}
            />
          )
        ) : (
          /* ================= SCREEN 2: ACTIVE ROOM ================= */
          <div className="flex-1 flex flex-col space-y-4">
            {room?.status === "LOBBY" ? (
              /* 1. LOBBY MODE */
              <div className="space-y-4">
                {/* Active Game Showcase Banner */}
                <ActiveGameBanner
                  gameType={activeGameType}
                  isHost={isHost}
                  onOpenGameSelector={() => setShowGameSelector(true)}
                  onOpenRules={() => setLobbyTab("guide")}
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Player List & Dynamic Game Settings */}
                  <div className="md:col-span-6 lg:col-span-6">
                    <PlayerList
                      players={room?.players || []}
                      hostId={room?.hostId}
                      currentSocketId={socket.id}
                      currentPlayerId={identity.playerId}
                      currentNickname={nickname}
                      currentTurnSocketId={currentTurnSocketId}
                      currentTurnPlayerId={currentTurnPlayerId}
                      status={room?.status}
                      gameType={activeGameType}
                      isHost={isHost}
                      settings={room?.settings}
                      onStartGame={handleStartGame}
                      onUpdateSettings={handleUpdateSettings}
                      onAddBot={handleAddBot}
                      onRemoveBot={handleRemoveBot}
                    />

                  </div>

                  {/* Right Column: Live Chat & Rules Tab */}
                  <div className="md:col-span-6 lg:col-span-6 flex flex-col gap-4">
                    <div className="clay-card p-5 sm:p-7 shadow-sm flex flex-col space-y-4 bg-white">
                      {/* Header with Tab Switcher */}
                      <div className="flex items-center justify-between pb-3 border-b-2 border-[#F6E6D0]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLobbyTab("chat")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                              lobbyTab === "chat"
                                ? "bg-[#50B5FF] text-white shadow-xs"
                                : "bg-[#FFFBF5] text-[#8C8275] hover:text-[#3A332C] border border-[#F0DDC5]"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Percakapan ({room?.discussionMessages?.length || 0})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLobbyTab("guide")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                              lobbyTab === "guide"
                                ? "bg-[#FFA012] text-white shadow-xs"
                                : "bg-[#FFFBF5] text-[#8C8275] hover:text-[#3A332C] border border-[#F0DDC5]"
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Panduan ({activeGameMeta.name})</span>
                          </button>
                        </div>

                        <span className="text-[10px] font-black text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#24A654] animate-pulse"></span>
                          <span>Ruang Tunggu</span>
                        </span>
                      </div>

                      {/* TAB 1: LOBBY LIVE CHAT */}
                      {lobbyTab === "chat" ? (
                        <div className="flex flex-col space-y-3">
                          <div
                            ref={lobbyChatContainerRef}
                            className="overflow-y-auto max-h-[220px] sm:max-h-[260px] min-h-[160px] p-3 rounded-2xl bg-[#FFFBF5] border-2 border-[#F0DDC5] space-y-2.5 scroll-smooth"
                          >
                            {room?.discussionMessages && room.discussionMessages.length > 0 ? (
                              room.discussionMessages.map((msg, idx) => {
                                const isMe = Boolean(
                                  (msg.senderSocketId && msg.senderSocketId === socket.id) ||
                                  (msg.senderId && identity.playerId && msg.senderId === identity.playerId) ||
                                  (msg.senderPlayerId && identity.playerId && msg.senderPlayerId === identity.playerId) ||
                                  (msg.senderName && nickname && msg.senderName.trim().toLowerCase() === nickname.trim().toLowerCase()),
                                );
                                const isMsgSpectator = !!msg.isSpectator;

                                return (
                                  <div
                                    key={idx}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-pop-spring`}
                                  >
                                    <div className="flex items-center gap-1 text-[10px] text-[#8C8275] mb-0.5 font-bold">
                                      <span>{msg.senderName}</span>
                                      {isMe && (
                                        <span className="text-[9px] font-black text-[#1C8BE0] bg-[#EFF8FF] px-1.5 py-0.2 rounded-full border border-[#8CD3FF]">
                                          Anda
                                        </span>
                                      )}
                                      {isMsgSpectator && (
                                        <span className="text-[9px] text-[#D97E00] bg-[#FFF8EC] border border-[#FFA012] px-1.5 py-0.2 rounded-full font-black flex items-center gap-0.5">
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Penonton</span>
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>{msg.timestamp}</span>
                                    </div>
                                    <div
                                      className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] break-words font-semibold shadow-2xs ${
                                        isMe
                                          ? "bg-[#50B5FF] text-white rounded-br-none"
                                          : "bg-white text-[#3A332C] border border-[#F0DDC5] rounded-bl-none"
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-xs font-bold text-[#8C8275] flex flex-col items-center justify-center gap-1.5">
                                <Smile className="w-7 h-7 text-[#FFA012] opacity-60 animate-bounce" />
                                <span>Belum ada percakapan. Sapa teman-temanmu sebelum mulai!</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Banter Chips */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                            {["Siap main! 🚀", "Siapa yang jago bohong nih? 😏", "Tunggu 1 lagi ya! ⏳", "Halo semua! 👋"].map(
                              (chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleQuickLobbyChip(chip)}
                                  className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#FFF5E8] hover:bg-[#FFE8CC] text-[#D97E00] border border-[#F0DDC5] font-bold transition cursor-pointer active:scale-95 shrink-0"
                                >
                                  {chip}
                                </button>
                              ),
                            )}
                          </div>

                          {/* Chat Input Form */}
                          <form onSubmit={handleSendLobbyMessage} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Ketik pesan di ruang tunggu..."
                              value={lobbyMsgInput}
                              onChange={(e) => setLobbyMsgInput(e.target.value)}
                              className="flex-1 min-w-0 clay-input px-3 py-2 text-xs sm:text-sm font-semibold text-[#3A332C]"
                            />
                            <button
                              type="submit"
                              disabled={!lobbyMsgInput.trim()}
                              className="btn-3d-blue px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-40 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Kirim</span>
                            </button>
                          </form>
                        </div>
                      ) : (
                        /* TAB 2: DYNAMIC GAME RULES */
                        <div>
                          {RulesComponent ? (
                            <RulesComponent />
                          ) : (
                            <div className="p-4 text-xs font-semibold text-[#8C8275]">
                              Panduan permainan belum tersedia.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Share & Room Code Card */}
                    <div className="clay-card p-5 sm:p-6 shadow-sm bg-white space-y-3">
                      <button
                        onClick={handleCopyRoomCode}
                        className="w-full btn-3d-peach text-sm font-black py-3.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-5 h-5 text-white" />
                            <span>Link Undangan Disalin! ({room?.id})</span>
                          </>
                        ) : (
                          <>
                            <Link className="w-5 h-5" />
                            <span>Salin Link Undangan ({room?.id})</span>
                          </>
                        )}
                      </button>

                      {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                        <button
                          onClick={handleShareRoom}
                          className="w-full btn-3d-blue text-xs font-black py-2.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Bagikan ke Teman (WhatsApp / App)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : room?.status === "GAME_OVER" && gameOverData ? (
              /* 2. GAME OVER MODE */
              <div className="w-full">
                <GameOverModal
                  gameOverData={gameOverData}
                  messages={room?.discussionMessages || []}
                  isHost={isHost}
                  currentPlayerId={identity.playerId}
                  currentNickname={nickname}
                  onRematch={handleStartGame}
                  onReturnToLobby={handleReturnToLobby}
                  onSendMessage={handleSendDiscussionMessage}
                />
              </div>
            ) : (
              /* 3. ACTIVE GAMEPLAY MODE (Game interaction is rendered FIRST on mobile) */
              <div className="flex flex-col md:grid md:grid-cols-12 gap-5 lg:gap-8 items-start">
                {/* Right Column: Dynamic In-Game Component (Order 1 on Mobile) */}
                <div className="order-1 md:order-2 md:col-span-7 lg:col-span-8 flex flex-col gap-4 sm:gap-5 w-full">
                  {/* Spectator Waiting Banner */}
                  {isSpectator && (
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FFF8EC] to-[#FFF0ED] border-2 border-[#FFA012] rounded-3xl flex items-center gap-3.5 shadow-sm animate-pop-spring">
                      <div className="p-2 sm:p-2.5 bg-white rounded-2xl text-[#FFA012] border border-[#FFA012]/40 shrink-0 animate-bounce">
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFA012]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-[#3A332C]">
                          👀 Anda Berada di Ruang Tunggu (Sedang Menonton Game)
                        </h4>
                        <p className="text-[11px] sm:text-xs text-[#8C8275] font-semibold mt-0.5 leading-tight">
                          Anda bergabung di tengah game yang sedang berlangsung. Anda otomatis ikut bermain saat game berikutnya dimulai!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Render the Active Game Component */}
                  {GameComponent && (
                    <GameComponent
                      room={room}
                      socket={socket}
                      identity={identity}
                      nickname={nickname}
                      myRoleData={myRoleData}
                      isHost={isHost}
                      isSpectator={isSpectator}
                      isMyPlayerAlive={isMyPlayerAlive}
                      isMyTurn={isMyTurn}
                      currentTurnName={currentTurnName}
                      currentTurnSocketId={currentTurnSocketId}
                      currentTurnPlayerId={currentTurnPlayerId}
                      clueInput={clueInput}
                      onClueInputChange={setClueInput}
                      onSendClue={handleSendClue}
                      isReadyConfirmed={isReadyConfirmed}
                      readyStats={readyStats}
                      onMarkReady={handleMarkReady}
                      discussionEndsAt={discussionEndsAt}
                      isDiscussionReady={isDiscussionReady}
                      discussionReadyStats={discussionReadyStats}
                      onToggleDiscussionReady={handleToggleDiscussionReady}
                      onSendDiscussionMessage={handleSendDiscussionMessage}
                      onSkipDiscussionToVoting={handleSkipDiscussionToVoting}
                      votingCandidates={votingCandidates}
                      votingEndsAt={votingEndsAt}
                      votedTarget={votedTarget}
                      voteStats={voteStats}
                      onCastVote={handleCastVote}
                      mrWhiteGuessTarget={mrWhiteGuessTarget}
                      mrWhiteInput={mrWhiteInput}
                      onMrWhiteInputChange={setMrWhiteInput}
                      onSubmitMrWhiteGuess={handleMrWhiteSubmit}
                    />
                  )}
                </div>

                {/* Left Column: Player List (Order 2 on Mobile) */}
                <div className="order-2 md:order-1 md:col-span-5 lg:col-span-4 w-full">
                  <PlayerList
                    players={room?.players || []}
                    hostId={room?.hostId}
                    currentSocketId={socket.id}
                    currentPlayerId={identity.playerId}
                    currentNickname={nickname}
                    currentTurnSocketId={currentTurnSocketId}
                    currentTurnPlayerId={currentTurnPlayerId}
                    status={room?.status}
                    gameType={activeGameType}
                    isHost={isHost}
                    settings={room?.settings}
                    discussionReadySocketIds={discussionReadyStats.readySocketIds}
                    onStartGame={handleStartGame}
                    onUpdateSettings={handleUpdateSettings}
                    onCancelGame={() => setShowCancelGameModal(true)}
                  />
                </div>
              </div>
            )}

            {/* Elimination Result Modal */}
            <EliminationModal
              data={eliminationModalData}
              onClose={handleDismissEliminationModal}
            />
          </div>
        )}
      </main>

      {/* Floating Bottom Pill Navigation Dock & Toggle Pill */}
      <footer className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        {isBottomDockOpen ? (
          <div className="floating-dock pointer-events-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-around gap-2.5 sm:gap-4 shadow-2xl max-w-md w-full animate-dock-enter border-2 border-[#FFA012]/40">
            {/* Sound Mute Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundMuted ? "Aktifkan Suara" : "Matikan Suara"}
              className="p-2 rounded-full text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8] transition cursor-pointer active:scale-95 shrink-0"
            >
              {soundMuted ? (
                <VolumeX className="w-5 h-5 text-[#E64B2D]" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#1C8BE0]" />
              )}
            </button>

            {/* 3D Podium Leaderboard Button */}
            <button
              onClick={() => {
                fetch("/api/leaderboard")
                  .then((r) => r.json())
                  .then((data) => setLeaderboardData(data))
                  .catch(() => {});
                setShowLeaderboard(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm bg-[#FFF8EC] hover:bg-[#FFEACD] border-2 border-[#FFA012]/60 text-[#D97E00] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full transition font-extrabold cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Trophy className="w-4 h-4 text-[#FFA012]" />
              <span>Podium</span>
            </button>

            {/* Panic Key */}
            <button
              onClick={() => setIsCamouflaged(true)}
              title="Sembunyikan Game (ESC / Ctrl+B)"
              className="flex items-center gap-1 text-xs sm:text-sm bg-[#FFF0ED] hover:bg-[#FFE0D9] border-2 border-[#FFB2A1] text-[#E64B2D] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition font-extrabold cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <ShieldAlert className="w-4 h-4 text-[#E64B2D]" />
              <span>ESC</span>
            </button>

            {/* Leave Room Button */}
            {isJoined && (
              <button
                onClick={handleLeaveRoom}
                title="Keluar Room"
                className="p-2 rounded-full text-[#8C8275] hover:text-[#E64B2D] hover:bg-[#FFF0ED] transition cursor-pointer active:scale-95 shrink-0"
              >
                <DoorOpen className="w-5 h-5" />
              </button>
            )}

            {/* Hide / Collapse Dock Button */}
            <button
              onClick={() => setIsBottomDockOpen(false)}
              title="Sembunyikan Menu Bawah"
              className="p-2 rounded-full text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8] transition cursor-pointer active:scale-95 shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Floating Mini Toggle Trigger Pill */
          <div className="pointer-events-auto flex items-center justify-end w-full max-w-6xl">
            <button
              onClick={() => setIsBottomDockOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border-2 border-[#F6E6D0] hover:border-[#FFA012] text-[#8C8275] hover:text-[#D97E00] shadow-md transition-all duration-200 text-xs font-black cursor-pointer active:scale-95 animate-pop-spring"
              title="Buka Navigasi Cepat (Podium, Suara, ESC)"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#FFA012]" />
              <span className="hidden sm:inline">Navigasi</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </footer>

      {/* Game Selection Modal for Host */}
      <GameSelectorModal
        isOpen={showGameSelector}
        currentGameType={activeGameType}
        onClose={() => setShowGameSelector(false)}
        onSelectGame={handleChangeGame}
      />

      {/* 3D Podium Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        data={leaderboardData}
        isHost={isHost}
        onReset={handleResetLeaderboard}
      />

      {/* Confirmation Modal for Cancelling/Aborting Active Game */}
      {showCancelGameModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 sm:p-7 max-w-md w-full m-auto bg-white space-y-4 border-3 border-[#FFB2A1] shadow-2xl animate-pop-spring text-center">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#FFF0ED] border-2 border-[#FFB2A1] flex items-center justify-center text-[#E64B2D] shadow-xs">
              <AlertTriangle className="w-7 h-7 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-[#3A332C]">
                Batalkan Permainan?
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#8C8275] leading-relaxed">
                Permainan yang sedang berlangsung akan dihentikan dan seluruh pemain akan dikembalikan ke <strong>Ruang Tunggu (Lobby)</strong>. Anda dapat mengganti jenis game atau menunggu teman lain bergabung.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelGameModal(false)}
                className="btn-3d-peach text-xs sm:text-sm font-black py-3 rounded-2xl cursor-pointer"
              >
                Lanjut Main
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelGame}
                className="py-3 rounded-2xl bg-[#E64B2D] hover:bg-[#CC3B1E] text-white font-black text-xs sm:text-sm border-2 border-[#B82B10] shadow-[0_4px_0_#991B0B] active:translate-y-1 active:shadow-none transition cursor-pointer"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
