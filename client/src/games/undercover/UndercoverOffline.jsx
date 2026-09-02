import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Avatar";
import ConfettiEffect from "../../components/ConfettiEffect";
import { playSound, isSoundMuted, toggleSoundMute } from "../../utils/sound";
import {
  DEFAULT_WORD_PAIRS,
  CATEGORIES,
  getRandomWordPair,
  getAutoRoleDistribution,
  normalizeWord,
} from "./undercoverWords";
import {
  Sparkles,
  Users,
  UserCheck,
  Shield,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Dice5,
  Plus,
  Minus,
  Sliders,
  Send,
  MessageSquare,
  HelpCircle,
  Trophy,
  Check,
  AlertCircle,
  Home,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DEFAULT_PLAYERS_STORAGE_KEY = "undercover_offline_players";

const DEFAULT_NAMES = [
  "Budi Santai",
  "Siti Cerdas",
  "Andi Penyelidik",
  "Rian Lincah",
  "Dewi Keren",
  "Eko Misterius",
  "Maya Detektif",
  "Doni Santuy",
];

export default function UndercoverOffline({ onExit }) {
  // Sound state
  const [soundMuted, setSoundMuted] = useState(() => isSoundMuted());

  // Game Engine Phase
  // "SETUP" | "SECRET_REVEAL_COVER" | "SECRET_REVEAL_CARD" | "CLUE_ROUND" | "DISCUSSION" | "VOTING_PASS" | "VOTING_OPEN" | "ELIMINATION_REVEAL" | "MR_WHITE_GUESS" | "GAME_OVER"
  const [phase, setPhase] = useState("SETUP");

  // Setup configuration state
  const [playerList, setPlayerList] = useState(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_PLAYERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
      }
    } catch (e) {}
    return DEFAULT_NAMES.slice(0, 4);
  });

  const [isAutoBalance, setIsAutoBalance] = useState(true);
  const [manualUndercoverCount, setManualUndercoverCount] = useState(1);
  const [manualMrWhiteCount, setManualMrWhiteCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [customCivilianWord, setCustomCivilianWord] = useState("");
  const [customUndercoverWord, setCustomUndercoverWord] = useState("");
  const [isCustomWordsMode, setIsCustomWordsMode] = useState(false);
  const [clueInputMode, setClueInputMode] = useState(true); // true = type on phone, false = verbal with timer

  // Active Game State
  const [activeWordPair, setActiveWordPair] = useState(null);
  const [players, setPlayers] = useState([]); // [{ id, name, role, word, isAlive: true, eliminatedRound: null }]
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);

  // Round & Clue State
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentCluePlayerIndex, setCurrentCluePlayerIndex] = useState(0);
  const [currentClueInput, setCurrentClueInput] = useState("");
  const [allClues, setAllClues] = useState([]); // [{ round, playerId, playerName, text, timestamp }]

  // Discussion & Voting State
  const [votingMethod, setVotingMethod] = useState("open"); // "open" | "pass"
  const [passVoteCurrentIndex, setPassVoteCurrentIndex] = useState(0);
  const [passVoteCoverOpen, setPassVoteCoverOpen] = useState(true);
  const [passVoteSelectedCandidate, setPassVoteSelectedCandidate] = useState(null);
  const [passVotesRecord, setPassVotesRecord] = useState({}); // { voterId: candidateId }

  // Elimination & Mr White state
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [mrWhiteGuessInput, setMrWhiteGuessInput] = useState("");
  const [mrWhiteGuessResult, setMrWhiteGuessResult] = useState(null); // { isCorrect: bool, guess: str }

  // Game Over state
  const [winnerTeam, setWinnerTeam] = useState(null); // "CIVILIAN" | "UNDERCOVER" | "MR_WHITE"
  const [gameOverReason, setGameOverReason] = useState("");

  // Custom Inline Confirmation States (No native window.confirm popups)
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedEliminateTarget, setSelectedEliminateTarget] = useState(null);

  // Persist player list whenever changed in setup
  useEffect(() => {
    try {
      localStorage.setItem(DEFAULT_PLAYERS_STORAGE_KEY, JSON.stringify(playerList));
    } catch (e) {}
  }, [playerList]);

  // Compute role counts
  const totalPlayerCount = playerList.length;
  const autoRoles = getAutoRoleDistribution(totalPlayerCount);
  const undercoverCount = isAutoBalance ? autoRoles.undercoverCount : manualUndercoverCount;
  const mrWhiteCount = isAutoBalance ? autoRoles.mrWhiteCount : manualMrWhiteCount;
  const civilianCount = Math.max(1, totalPlayerCount - undercoverCount - mrWhiteCount);

  const handleToggleSound = () => {
    const muted = toggleSoundMute();
    setSoundMuted(muted);
  };

  // -------------------------------------------------------------
  // SETUP ACTIONS
  // -------------------------------------------------------------
  const handleAddPlayer = () => {
    if (playerList.length >= 16) return;
    const nextIdx = playerList.length + 1;
    const fallbackName = `Pemain ${nextIdx}`;
    setPlayerList((prev) => [...prev, fallbackName]);
    playSound("join");
  };

  const handleRemovePlayer = (idx) => {
    if (playerList.length <= 3) return;
    setPlayerList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePlayerNameChange = (idx, newName) => {
    setPlayerList((prev) => {
      const copy = [...prev];
      copy[idx] = newName;
      return copy;
    });
  };

  const handleRandomizeSingleName = (idx) => {
    const random = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
    handlePlayerNameChange(idx, `${random} ${idx + 1}`);
    playSound("vote");
  };

  const handleRandomizeAllNames = () => {
    const shuffled = [...DEFAULT_NAMES].sort(() => Math.random() - 0.5);
    setPlayerList((prev) =>
      prev.map((_, i) => shuffled[i % shuffled.length] || `Pemain ${i + 1}`)
    );
    playSound("vote");
  };

  // -------------------------------------------------------------
  // START GAME (INITIALIZE ROLES & WORDS)
  // -------------------------------------------------------------
  const handleStartGame = () => {
    // 1. Pick Word Pair
    let selectedWord;
    if (isCustomWordsMode && customCivilianWord.trim() && customUndercoverWord.trim()) {
      selectedWord = {
        category: "Kustom",
        civilian: customCivilianWord.trim(),
        undercover: customUndercoverWord.trim(),
      };
    } else {
      selectedWord = getRandomWordPair(selectedCategory);
    }
    setActiveWordPair(selectedWord);

    // 2. Assign Roles
    const rolesArray = [];
    for (let i = 0; i < undercoverCount; i++) rolesArray.push("UNDERCOVER");
    for (let i = 0; i < mrWhiteCount; i++) rolesArray.push("MR_WHITE");
    while (rolesArray.length < totalPlayerCount) rolesArray.push("CIVILIAN");

    // Shuffle roles
    rolesArray.sort(() => Math.random() - 0.5);

    // 3. Create Player Objects
    const assignedPlayers = playerList.map((name, i) => {
      const role = rolesArray[i];
      let word = "";
      if (role === "CIVILIAN") word = selectedWord.civilian;
      else if (role === "UNDERCOVER") word = selectedWord.undercover;
      else word = "???";

      return {
        id: `p_${i + 1}`,
        name: name.trim() || `Pemain ${i + 1}`,
        role,
        word,
        isAlive: true,
        eliminatedRound: null,
      };
    });

    setPlayers(assignedPlayers);
    setCurrentRevealIndex(0);
    setRoundNumber(1);
    setAllClues([]);
    setEliminatedPlayer(null);
    setMrWhiteGuessResult(null);
    setWinnerTeam(null);
    setGameOverReason("");
    setPassVotesRecord({});
    setPhase("SECRET_REVEAL_COVER");
    playSound("join");
  };

  // -------------------------------------------------------------
  // SECRET REVEAL ACTIONS
  // -------------------------------------------------------------
  const handleOpenSecretCard = () => {
    setPhase("SECRET_REVEAL_CARD");
    playSound("reveal");
  };

  const handleNextSecretCard = () => {
    if (currentRevealIndex + 1 < players.length) {
      setCurrentRevealIndex((prev) => prev + 1);
      setPhase("SECRET_REVEAL_COVER");
      playSound("vote");
    } else {
      // All players have seen their words! Start Round 1 Clues
      setCurrentCluePlayerIndex(0);
      setCurrentClueInput("");
      setPhase("CLUE_ROUND");
      playSound("turn");
    }
  };

  // -------------------------------------------------------------
  // CLUE ROUND ACTIONS
  // -------------------------------------------------------------
  const alivePlayers = players.filter((p) => p.isAlive);
  const currentCluePlayer = alivePlayers[currentCluePlayerIndex] || alivePlayers[0];

  const handleSendClue = (e) => {
    if (e) e.preventDefault();
    if (!currentCluePlayer) return;

    const clueText = currentClueInput.trim() || "✓ Sudah memberikan petunjuk lisan";

    const newClueItem = {
      round: roundNumber,
      playerId: currentCluePlayer.id,
      playerName: currentCluePlayer.name,
      text: clueText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAllClues((prev) => [...prev, newClueItem]);
    setCurrentClueInput("");
    playSound("chat", { isSelf: false });

    // Check if more alive players need to give clues in this round
    if (currentCluePlayerIndex + 1 < alivePlayers.length) {
      setCurrentCluePlayerIndex((prev) => prev + 1);
      playSound("turn");
    } else {
      // All alive players gave clues! Move to Discussion phase
      setPhase("DISCUSSION");
      playSound("turn");
    }
  };

  // -------------------------------------------------------------
  // DISCUSSION & VOTING ACTIONS
  // -------------------------------------------------------------
  const handleStartVotingFromDiscussion = (method = "open") => {
    setVotingMethod(method);
    if (method === "pass") {
      setPassVoteCurrentIndex(0);
      setPassVoteCoverOpen(true);
      setPassVoteSelectedCandidate(null);
      setPassVotesRecord({});
      setPhase("VOTING_PASS");
    } else {
      setPhase("VOTING_OPEN");
    }
    playSound("vote");
  };

  // Open Voting Direct Elimination Pick
  const handleOpenVoteEliminate = (targetPlayer) => {
    executeElimination(targetPlayer);
  };

  // Pass-and-Play Secret Voting
  const handlePassVoteSubmit = () => {
    if (!passVoteSelectedCandidate) return;
    const voter = alivePlayers[passVoteCurrentIndex];
    if (!voter) return;

    const newRecords = {
      ...passVotesRecord,
      [voter.id]: passVoteSelectedCandidate.id,
    };
    setPassVotesRecord(newRecords);
    playSound("vote");

    if (passVoteCurrentIndex + 1 < alivePlayers.length) {
      setPassVoteCurrentIndex((prev) => prev + 1);
      setPassVoteSelectedCandidate(null);
      setPassVoteCoverOpen(true);
    } else {
      // All votes cast! Tally votes
      const voteCounts = {};
      Object.values(newRecords).forEach((candId) => {
        voteCounts[candId] = (voteCounts[candId] || 0) + 1;
      });

      let maxCount = -1;
      let topCandidateId = null;
      let isTie = false;

      Object.entries(voteCounts).forEach(([candId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCandidateId = candId;
          isTie = false;
        } else if (count === maxCount) {
          isTie = true;
        }
      });

      const eliminated = players.find((p) => p.id === topCandidateId) || alivePlayers[0];
      executeElimination(eliminated);
    }
  };

  // -------------------------------------------------------------
  // ELIMINATION & WIN CHECK
  // -------------------------------------------------------------
  const executeElimination = (targetPlayer) => {
    setEliminatedPlayer(targetPlayer);

    // Mark player eliminated
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === targetPlayer.id
          ? { ...p, isAlive: false, eliminatedRound: roundNumber }
          : p
      )
    );

    playSound("eliminated");

    // If eliminated player is Mr. White, give them a chance to guess the civilian word!
    if (targetPlayer.role === "MR_WHITE") {
      setMrWhiteGuessInput("");
      setMrWhiteGuessResult(null);
      setPhase("MR_WHITE_GUESS");
    } else {
      setPhase("ELIMINATION_REVEAL");
    }
  };

  const handleMrWhiteGuessSubmit = (e) => {
    if (e) e.preventDefault();
    const guessClean = normalizeWord(mrWhiteGuessInput);
    const civilianClean = normalizeWord(activeWordPair?.civilian);

    const isMatch = guessClean.length > 0 && guessClean === civilianClean;

    setMrWhiteGuessResult({
      isCorrect: isMatch,
      guess: mrWhiteGuessInput.trim(),
    });

    if (isMatch) {
      // Mr. White Wins instantly!
      setWinnerTeam("MR_WHITE");
      setGameOverReason(
        `Mr. White (${eliminatedPlayer?.name}) berhasil menebak kata Warga Sipil "${activeWordPair?.civilian}" dengan tepat!`
      );
      setPhase("GAME_OVER");
      playSound("win");
    } else {
      // Mr. White guessed wrong, proceed to standard elimination reveal
      setPhase("ELIMINATION_REVEAL");
      playSound("defeat");
    }
  };

  const handleContinueAfterElimination = () => {
    // Re-evaluate alive counts after elimination
    const currentAlive = players.filter(
      (p) => p.id !== eliminatedPlayer?.id && p.isAlive
    );
    const aliveCivilians = currentAlive.filter((p) => p.role === "CIVILIAN").length;
    const aliveUndercovers = currentAlive.filter((p) => p.role === "UNDERCOVER").length;
    const aliveMrWhites = currentAlive.filter((p) => p.role === "MR_WHITE").length;
    const aliveImpostors = aliveUndercovers + aliveMrWhites;

    // Check Win Conditions
    if (aliveImpostors === 0) {
      // Civilians Win!
      setWinnerTeam("CIVILIAN");
      setGameOverReason("Semua Undercover & Mr. White telah berhasil dieliminasi!");
      setPhase("GAME_OVER");
      playSound("win");
      return;
    }

    if (aliveUndercovers >= aliveCivilians) {
      // Undercover Wins!
      setWinnerTeam("UNDERCOVER");
      setGameOverReason(
        "Jumlah Undercover telah mengimbangi atau melebihi jumlah Warga Sipil yang tersisa!"
      );
      setPhase("GAME_OVER");
      playSound("win");
      return;
    }

    // Game continues to next round
    setRoundNumber((prev) => prev + 1);
    setCurrentCluePlayerIndex(0);
    setCurrentClueInput("");
    setEliminatedPlayer(null);
    setMrWhiteGuessResult(null);
    setPhase("CLUE_ROUND");
    playSound("turn");
  };

  // Replay Game with same players & new words
  const handleReplayGame = () => {
    handleStartGame();
  };

  // -------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "UNDERCOVER":
        return {
          bg: "bg-[#EFF8FF]",
          border: "border-[#8CD3FF]",
          text: "text-[#1C8BE0]",
          label: "Undercover (Penyusup)",
          icon: Users,
        };
      case "MR_WHITE":
        return {
          bg: "bg-[#FFF1F2]",
          border: "border-[#FECDD3]",
          text: "text-[#E11D48]",
          label: "Mr. White (Hantu)",
          icon: ShieldAlert,
        };
      default:
        return {
          bg: "bg-[#F0FDF4]",
          border: "border-[#86EFAC]",
          text: "text-[#15803D]",
          label: "Civilian (Warga Sipil)",
          icon: UserCheck,
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-5 space-y-5 animate-pop-spring">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <div className="clay-card p-4 sm:p-5 bg-white border-2 border-[#F6E6D0] shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2.5 rounded-2xl bg-[#FFF8EC] hover:bg-[#FFF2DE] border border-[#F0DDC5] text-[#8C8275] hover:text-[#3A332C] transition cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-black shadow-2xs"
            title="Kembali ke Menu Utama"
          >
            <Home className="w-4 h-4 text-[#FFA012]" />
            <span className="hidden sm:inline">Menu Utama</span>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] border border-[#FFA012]/40 px-2 py-0.2 rounded-full">
                Mode 1 HP (Offline)
              </span>
              {phase !== "SETUP" && phase !== "GAME_OVER" && (
                <span className="text-[10px] font-black text-[#50B5FF] bg-[#EFF8FF] border border-[#8CD3FF] px-2 py-0.2 rounded-full">
                  Ronde {roundNumber}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#3A332C] tracking-tight mt-0.5">
              Undercover: Pass & Play
            </h2>
          </div>
        </div>

        {/* Right Actions: Sound & Restart */}
        <div className="flex items-center gap-2">
          {phase !== "SETUP" && (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-2.5 rounded-2xl bg-[#FAF6EE] hover:bg-[#F2EDE1] text-[#8C8275] hover:text-[#3A332C] border border-[#E8DCCB] transition cursor-pointer text-xs font-black flex items-center gap-1"
              title="Atur Ulang Game"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Atur Ulang</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2.5 rounded-2xl bg-[#FFF8EC] hover:bg-[#FFF2DE] border border-[#FFA012]/40 text-[#D97E00] transition cursor-pointer"
            title={soundMuted ? "Aktifkan Suara" : "Matikan Suara"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Inline Reset Confirmation Card */}
      {showResetConfirm && (
        <div className="clay-card p-4 sm:p-5 bg-[#FFF0ED] border-2 border-[#FFB2A1] shadow-md animate-pop-spring space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-[#E64B2D] border border-[#FFB2A1] shrink-0">
              <RotateCcw className="w-5 h-5 text-[#E64B2D]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#3A332C]">
                Atur Ulang Permainan?
              </h4>
              <p className="text-xs text-[#8C8275] font-semibold">
                Seluruh progres ronde dan kartu rahasia saat ini akan dimulai dari awal.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 rounded-xl bg-white text-[#8C8275] hover:text-[#3A332C] border border-[#E8DCCB] text-xs font-black transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResetConfirm(false);
                setPhase("SETUP");
              }}
              className="px-5 py-2 rounded-xl bg-[#E64B2D] hover:bg-[#D43D1F] text-white text-xs font-black transition cursor-pointer shadow-xs active:scale-95"
            >
              Ya, Atur Ulang
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 1: SETUP LOBBY */}
      {/* ========================================================================= */}
      {phase === "SETUP" && (
        <div className="clay-card p-5 sm:p-7 bg-white border-2 border-[#F6E6D0] shadow-md space-y-6 animate-pop-spring">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#F6E6D0]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#3A332C] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#50B5FF]" />
                <span>Pengaturan Pemain & Peran</span>
              </h3>
              <p className="text-xs text-[#8C8275] font-semibold mt-0.5">
                Ketik nama teman-temanmu yang akan bermain bersama di 1 perangkat ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomizeAllNames}
                className="px-3 py-1.5 rounded-xl bg-[#FFF8EC] hover:bg-[#FFF2DE] border border-[#FFA012]/40 text-[#D97E00] text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>Acak Semua Nama</span>
              </button>
            </div>
          </div>

          {/* 1. Player List Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
                Daftar Pemain ({playerList.length} Orang)
              </label>
              <span className="text-[11px] font-bold text-[#8C8275]">Min: 3 | Max: 16</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 scroll-smooth">
              {playerList.map((name, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-[#FFFBF5] border border-[#F0DDC5] shadow-2xs transition hover:border-[#50B5FF]"
                >
                  <div className="shrink-0">
                    <Avatar name={name || `P ${idx + 1}`} size="sm" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    placeholder={`Pemain ${idx + 1}`}
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-extrabold text-[#3A332C] outline-hidden placeholder:text-[#B0A495]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRandomizeSingleName(idx)}
                    title="Acak nama ini"
                    className="p-1.5 text-[#FFA012] hover:text-[#D97E00] hover:bg-[#FFF2DE] rounded-xl transition cursor-pointer"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                  </button>
                  {playerList.length > 3 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      title="Hapus pemain ini"
                      className="p-1.5 text-[#E64B2D] hover:bg-[#FFF0ED] rounded-xl transition cursor-pointer text-xs font-black"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {playerList.length < 16 && (
              <button
                type="button"
                onClick={handleAddPlayer}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-[#50B5FF]/60 hover:border-[#50B5FF] bg-[#EFF8FF]/50 hover:bg-[#EFF8FF] text-[#1C8BE0] font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pemain Baru</span>
              </button>
            )}
          </div>

          {/* 2. Role Distribution Section */}
          <div className="p-4 rounded-2xl bg-[#FFFBF5] border-2 border-[#F0DDC5] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#FFA012]" />
                <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
                  Distribusi Peran
                </span>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-[#F0DDC5]">
                <button
                  type="button"
                  onClick={() => setIsAutoBalance(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    isAutoBalance
                      ? "bg-[#50B5FF] text-white shadow-2xs"
                      : "text-[#8C8275] hover:text-[#3A332C]"
                  }`}
                >
                  ✨ Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setIsAutoBalance(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    !isAutoBalance
                      ? "bg-[#FFA012] text-white shadow-2xs"
                      : "text-[#8C8275] hover:text-[#3A332C]"
                  }`}
                >
                  ⚙️ Kustom
                </button>
              </div>
            </div>

            {/* Badges Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-center">
                <span className="text-[10px] font-black text-[#15803D] uppercase block">
                  Civilian (Warga)
                </span>
                <span className="text-lg font-black text-[#15803D]">{civilianCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFF8FF] border border-[#8CD3FF] text-center">
                <span className="text-[10px] font-black text-[#1C8BE0] uppercase block">
                  Undercover
                </span>
                <span className="text-lg font-black text-[#1C8BE0]">{undercoverCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-center">
                <span className="text-[10px] font-black text-[#E11D48] uppercase block">
                  Mr. White
                </span>
                <span className="text-lg font-black text-[#E11D48]">{mrWhiteCount}</span>
              </div>
            </div>

            {/* Steppers in manual mode */}
            {!isAutoBalance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#F0DDC5]">
                  <span className="text-xs font-bold text-[#3A332C]">Jumlah Undercover</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualUndercoverCount((prev) => Math.max(1, prev - 1))
                      }
                      className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#3A332C] font-black flex items-center justify-center hover:bg-[#F2EDE1] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-sm text-[#1C8BE0] w-5 text-center">
                      {manualUndercoverCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setManualUndercoverCount((prev) =>
                          Math.min(prev + 1, totalPlayerCount - manualMrWhiteCount - 1)
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#3A332C] font-black flex items-center justify-center hover:bg-[#F2EDE1] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#F0DDC5]">
                  <span className="text-xs font-bold text-[#3A332C]">Jumlah Mr. White</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualMrWhiteCount((prev) => Math.max(0, prev - 1))
                      }
                      className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#3A332C] font-black flex items-center justify-center hover:bg-[#F2EDE1] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-sm text-[#E11D48] w-5 text-center">
                      {manualMrWhiteCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setManualMrWhiteCount((prev) =>
                          Math.min(
                            prev + 1,
                            totalPlayerCount - manualUndercoverCount - 1
                          )
                        )
                      }
                      className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#3A332C] font-black flex items-center justify-center hover:bg-[#F2EDE1] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Word Category & Mode Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
                Pilih Kategori Kata
              </label>
              <button
                type="button"
                onClick={() => setIsCustomWordsMode((prev) => !prev)}
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                  isCustomWordsMode
                    ? "bg-[#FFA012] text-white border-[#FFA012]"
                    : "bg-[#FFF8EC] text-[#D97E00] border-[#FFA012]/40"
                }`}
              >
                ✏️ Kustom Kata Sendiri
              </button>
            </div>

            {!isCustomWordsMode ? (
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#50B5FF] text-white shadow-2xs border-2 border-[#1C8BE0]"
                        : "bg-[#FFFBF5] text-[#8C8275] hover:text-[#3A332C] border border-[#F0DDC5]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FFF8EC] rounded-2xl border border-[#FFA012]/40 animate-pop-spring">
                <div>
                  <label className="block text-[10px] font-black text-[#15803D] uppercase mb-1">
                    Kata Rahasia Civilian (Warga)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi"
                    value={customCivilianWord}
                    onChange={(e) => setCustomCivilianWord(e.target.value)}
                    className="w-full clay-input px-3 py-2 text-xs font-bold text-[#3A332C]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#1C8BE0] uppercase mb-1">
                    Kata Rahasia Undercover (Penyusup)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Teh"
                    value={customUndercoverWord}
                    onChange={(e) => setCustomUndercoverWord(e.target.value)}
                    className="w-full clay-input px-3 py-2 text-xs font-bold text-[#3A332C]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Clue Input Style Option */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#F0DDC5]">
            <div>
              <span className="text-xs font-black text-[#3A332C] block">
                Format Input Kalimat Petunjuk
              </span>
              <span className="text-[11px] font-semibold text-[#8C8275]">
                {clueInputMode
                  ? "Pemain bergantian mengetik 1 kalimat petunjuk di HP (Tercatat rapi di papan rangkuman)"
                  : "Pemain berbicara langsung secara lisan (HP hanya untuk urutan bicara)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setClueInputMode((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ml-3 ${
                clueInputMode
                  ? "bg-[#24A654] text-white shadow-2xs"
                  : "bg-[#FAF6EE] text-[#8C8275] border border-[#E8DCCB]"
              }`}
            >
              {clueInputMode ? "⌨️ Ketik di HP" : "🗣️ Lisan / Bicara"}
            </button>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full btn-3d-blue py-4 rounded-2xl text-sm sm:text-base font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Mulai Permainan (Bagi Kartu Rahasia)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 2A: SECRET REVEAL - COVER SCREEN (OPER HP KE PEMAIN) */}
      {/* ========================================================================= */}
      {phase === "SECRET_REVEAL_COVER" && (
        <div className="clay-card p-6 sm:p-10 bg-white border-2 border-[#FFA012] shadow-xl text-center space-y-6 max-w-lg mx-auto animate-pop-spring">
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-xs font-black text-[#8C8275] border-b pb-2 border-[#F6E6D0]">
            <span>Pembagian Kartu Rahasia</span>
            <span className="text-[#FFA012]">
              Pemain {currentRevealIndex + 1} dari {players.length}
            </span>
          </div>

          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF8EC] border-4 border-[#FFA012] p-1.5 shadow-md flex items-center justify-center">
              <Avatar name={players[currentRevealIndex]?.name || "Player"} size="lg" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#8C8275] uppercase tracking-wider">
                Oper HP ke:
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#3A332C]">
                {players[currentRevealIndex]?.name}
              </h3>
            </div>

            <div className="p-3.5 bg-[#FFF0ED] border border-[#FFB2A1] rounded-2xl text-xs text-[#E64B2D] font-bold">
              🔒 <strong>Peringatan Rahasia:</strong> Jangan biarkan pemain lain melihat layarmu!
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenSecretCard}
            className="w-full btn-3d-peach py-4 rounded-2xl text-sm sm:text-base font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
          >
            <Eye className="w-5 h-5" />
            <span>Buka Kartu Rahasia</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 2B: SECRET REVEAL - OPEN CARD VIEW */}
      {/* ========================================================================= */}
      {phase === "SECRET_REVEAL_CARD" && (
        <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#50B5FF] shadow-2xl space-y-6 max-w-lg mx-auto animate-pop-spring">
          {(() => {
            const currentPlayer = players[currentRevealIndex];
            const roleStyle = getRoleBadgeStyle(currentPlayer?.role);
            const RoleIcon = roleStyle.icon;

            return (
              <>
                <div className="flex items-center justify-between border-b pb-3 border-[#F6E6D0]">
                  <div className="flex items-center gap-2">
                    <Avatar name={currentPlayer?.name} size="sm" />
                    <span className="text-sm font-black text-[#3A332C]">
                      {currentPlayer?.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleStyle.label}</span>
                  </span>
                </div>

                {/* Secret Word Showcase Box */}
                <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-b from-[#FFFBF5] to-[#FFF5E5] border-2 border-[#FFA012]/50 text-center space-y-3 shadow-inner">
                  <span className="text-xs font-black text-[#8C8275] uppercase tracking-widest block">
                    Kata Rahasiamu:
                  </span>

                  {currentPlayer?.role === "MR_WHITE" ? (
                    <div className="space-y-2">
                      <div className="text-3xl sm:text-4xl font-black text-[#E11D48] tracking-widest font-mono">
                        ???
                      </div>
                      <p className="text-xs font-extrabold text-[#E11D48] leading-relaxed">
                        Kamu tidak menerima kata! Dengarkan baik-baik kalimat pemain lain, berpura-puralah tahu kata tersebut, dan tebak kata Civilian saat eliminasi!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-black text-[#1C8BE0] tracking-wide">
                        {currentPlayer?.word}
                      </div>
                      <p className="text-[11px] font-bold text-[#8C8275]">
                        Kategori: <span className="text-[#3A332C]">{activeWordPair?.category}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Strategy Hint */}
                <div className="p-3 bg-[#EFF8FF] rounded-2xl border border-[#8CD3FF] text-[11px] text-[#1C8BE0] font-bold text-center">
                  💡 {currentPlayer?.role === "CIVILIAN" && "Berikan kalimat petunjuk yang masuk akal namun jangan terlalu gamblang agar Undercover tidak mudah menebak!"}
                  {currentPlayer?.role === "UNDERCOVER" && "Berikan kalimat petunjuk yang mirip dengan warga sipil agar kamu tidak dicurigai!"}
                  {currentPlayer?.role === "MR_WHITE" && "Simak kalimat pemain sebelum kamu dan tiru vibe petunjuk mereka!"}
                </div>

                {/* Close and Pass CTA */}
                <button
                  type="button"
                  onClick={handleNextSecretCard}
                  className="w-full btn-3d-blue py-4 rounded-2xl text-sm sm:text-base font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <EyeOff className="w-5 h-5" />
                  <span>
                    {currentRevealIndex + 1 < players.length
                      ? "Sudah Hafal & Oper ke Pemain Berikutnya"
                      : "Semua Sudah Siap! Mulai Ronde 1"}
                  </span>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 3: CLUE ROUND (GILIRAN KALIMAT MASING-MASING) */}
      {/* ========================================================================= */}
      {phase === "CLUE_ROUND" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-pop-spring">
          {/* Left Column: Active Player Turn Form */}
          <div className="lg:col-span-7 clay-card p-5 sm:p-7 bg-white border-2 border-[#50B5FF] shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#F6E6D0]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#3A332C]">
                    Giliran Kalimat Petunjuk
                  </h3>
                  <p className="text-xs text-[#8C8275] font-semibold">
                    Ronde {roundNumber} • Pemain {currentCluePlayerIndex + 1} dari {alivePlayers.length}
                  </p>
                </div>
              </div>

              <span className="text-xs font-black text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-3 py-1 rounded-full">
                Giliran Aktif
              </span>
            </div>

            {/* Current Turn Spotlight */}
            <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-b from-[#FFFBF5] to-[#FFF6EB] border-2 border-[#FFA012]/40 flex items-center gap-4">
              <Avatar name={currentCluePlayer?.name} size="md" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#FFA012] tracking-wider">
                  Oper HP Sekarang Ke:
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-[#3A332C]">
                  {currentCluePlayer?.name}
                </h4>
                <p className="text-xs text-[#8C8275] font-bold">
                  Ketik / sebutkan 1 kalimat petunjuk tentang katamu!
                </p>
              </div>
            </div>

            {/* Clue Input Form */}
            <form onSubmit={handleSendClue} className="space-y-4">
              {clueInputMode ? (
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase tracking-wider mb-1.5">
                    Kalimat Petunjuk ({currentCluePlayer?.name})
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    placeholder="Contoh: Sangat nikmat diminum saat santai di pagi hari..."
                    value={currentClueInput}
                    onChange={(e) => setCurrentClueInput(e.target.value)}
                    className="w-full clay-input p-3.5 text-xs sm:text-sm font-bold text-[#3A332C] placeholder:text-[#B0A495] resize-none"
                  />
                </div>
              ) : (
                <div className="p-4 bg-[#EDFCF2] border border-[#89EFA9] rounded-2xl text-center space-y-2">
                  <span className="text-xs font-black text-[#24A654] block">
                    🗣️ Mode Bicara Lisan
                  </span>
                  <p className="text-xs text-[#24A654]/80 font-bold">
                    Silakan ucapkan 1 kalimat petunjukmu secara lantang di hadapan teman-teman, lalu klik tombol di bawah!
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-3d-blue py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                <span>
                  {currentCluePlayerIndex + 1 < alivePlayers.length
                    ? `Kirim & Lanjut ke ${alivePlayers[currentCluePlayerIndex + 1]?.name}`
                    : "Selesai Ronde Kalimat (Lanjut ke Diskusi)"}
                </span>
              </button>
            </form>

            {/* Alive Players Queue */}
            <div className="pt-2">
              <span className="text-[11px] font-black text-[#8C8275] uppercase block mb-2">
                Urutan Giliran Ronde {roundNumber}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {alivePlayers.map((p, i) => (
                  <span
                    key={p.id}
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                      i === currentCluePlayerIndex
                        ? "bg-[#50B5FF] text-white border-[#1C8BE0] shadow-xs"
                        : i < currentCluePlayerIndex
                        ? "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]"
                        : "bg-[#FFFBF5] text-[#8C8275] border-[#F0DDC5]"
                    }`}
                  >
                    {i < currentCluePlayerIndex && <Check className="w-3 h-3 text-[#24A654]" />}
                    <span>{p.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Clue Board / Summary Recap */}
          <div className="lg:col-span-5 clay-card p-5 sm:p-6 bg-white border-2 border-[#F6E6D0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <h4 className="text-xs font-black text-[#3A332C] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFA012]" />
                <span>Papan Petunjuk Semua Pemain</span>
              </h4>
              <span className="text-[10px] font-black text-[#50B5FF] bg-[#EFF8FF] px-2 py-0.5 rounded-full">
                {allClues.length} Kalimat
              </span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scroll-smooth">
              {allClues.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-[#B0A495] bg-[#FFFBF5] rounded-2xl border border-dashed border-[#F0DDC5]">
                  Belum ada kalimat yang dimasukkan di ronde ini.
                </div>
              ) : (
                allClues.map((clue, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#FFFBF5] border border-[#F0DDC5] space-y-1 animate-pop-spring shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={clue.playerName} size="xs" />
                        <span className="text-xs font-black text-[#3A332C]">
                          {clue.playerName}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-[#FFA012] bg-[#FFF8EC] px-1.5 py-0.2 rounded-md">
                        Ronde {clue.round}
                      </span>
                    </div>
                    <p className="text-xs text-[#3A332C] font-semibold pl-6">
                      "{clue.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 4: DISCUSSION & CLUE BOARD */}
      {/* ========================================================================= */}
      {phase === "DISCUSSION" && (
        <div className="clay-card p-5 sm:p-7 bg-white border-2 border-[#FFA012] shadow-lg space-y-6 animate-pop-spring">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#F6E6D0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-[#FFF8EC] text-[#D97E00] border border-[#FFA012]/40">
                  <Flame className="w-4 h-4 text-[#FFA012]" />
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#3A332C]">
                  Fase Musyawarah & Diskusi (Ronde {roundNumber})
                </h3>
              </div>
              <p className="text-xs text-[#8C8275] font-semibold mt-1">
                Bahas kalimat-kalimat petunjuk di bawah! Cari tahu siapa yang mencurigakan (Undercover / Mr. White).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartVotingFromDiscussion("open")}
                className="btn-3d-peach px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span>🗳️ Pilih Yang Dieliminasi</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartVotingFromDiscussion("pass")}
                className="btn-3d-blue px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <span>📱 Vote Rahasia (Oper HP)</span>
              </button>
            </div>
          </div>

          {/* Full Clue Recap Board */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
              Rekap Seluruh Kalimat Petunjuk:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto p-1 scroll-smooth">
              {allClues.map((clue, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#F0DDC5] space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={clue.playerName} size="xs" />
                      <span className="text-xs font-black text-[#3A332C]">
                        {clue.playerName}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#1C8BE0] bg-[#EFF8FF] px-2 py-0.5 rounded-full">
                      Ronde {clue.round}
                    </span>
                  </div>
                  <p className="text-xs text-[#3A332C] font-semibold italic bg-white p-2.5 rounded-xl border border-[#F0DDC5]">
                    "{clue.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 5A: OPEN VOTING (PILIH TERELIMINASI LANGSUNG) */}
      {/* ========================================================================= */}
      {phase === "VOTING_OPEN" && (
        <div className="clay-card p-5 sm:p-7 bg-white border-2 border-[#E64B2D] shadow-xl space-y-6 max-w-xl mx-auto animate-pop-spring">
          <div className="text-center space-y-1 pb-3 border-b border-[#F6E6D0]">
            <h3 className="text-xl sm:text-2xl font-black text-[#3A332C]">
              Pilih Pemain Yang Dieliminasi
            </h3>
            <p className="text-xs text-[#8C8275] font-semibold">
              Berdasarkan hasil musyawarah, klik pemain yang disepakati untuk dieliminasi di Ronde {roundNumber}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alivePlayers.map((p) => {
              const isSelected = selectedEliminateTarget?.id === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedEliminateTarget(p)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer shadow-xs active:scale-95 text-left group ${
                    isSelected
                      ? "bg-[#FFF0ED] border-[#E64B2D] shadow-[0_4px_0_#D94627]"
                      : "bg-[#FFFBF5] hover:bg-[#FFF0ED] border-[#F0DDC5] hover:border-[#E64B2D]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="md" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-black text-[#3A332C] group-hover:text-[#E64B2D]">
                        {p.name}
                      </h4>
                      <span className="text-[10px] font-black text-[#8C8275] group-hover:text-[#E64B2D]">
                        {isSelected ? "Terpilih ✓" : "Pilih untuk Eliminasi ➔"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2.5 py-1 rounded-full bg-[#E64B2D] text-white text-[11px] font-black shadow-2xs">
                      Pilihan
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Prominent Action Confirmation Card */}
          {selectedEliminateTarget ? (
            <div className="p-4 bg-[#FFF0ED] rounded-2xl border-2 border-[#FFB2A1] space-y-3 animate-pop-spring text-center">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-[#E64B2D]">
                <Avatar name={selectedEliminateTarget.name} size="xs" />
                <span>Yakin ingin mengeliminasi {selectedEliminateTarget.name}?</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setSelectedEliminateTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#8C8275] border border-[#E8DEC7] text-xs font-black transition cursor-pointer hover:text-[#3A332C]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedEliminateTarget;
                    setSelectedEliminateTarget(null);
                    handleOpenVoteEliminate(target);
                  }}
                  className="btn-3d-coral px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black cursor-pointer shadow-md"
                >
                  ✓ Ya, Eliminasi {selectedEliminateTarget.name}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs font-semibold text-[#8C8275] py-1">
              Klik salah satu nama pemain di atas untuk memilih yang dieliminasi.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSelectedEliminateTarget(null);
              setPhase("DISCUSSION");
            }}
            className="w-full py-3 rounded-2xl bg-[#FAF6EE] text-[#8C8275] hover:text-[#3A332C] font-black text-xs transition cursor-pointer"
          >
            ← Kembali ke Diskusi
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 5B: PASS & PLAY SECRET VOTING */}
      {/* ========================================================================= */}
      {phase === "VOTING_PASS" && (
        <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#50B5FF] shadow-xl space-y-6 max-w-lg mx-auto animate-pop-spring">
          {passVoteCoverOpen ? (
            /* Cover Screen before voter votes */
            <div className="text-center space-y-5">
              <div className="flex items-center justify-between text-xs font-black text-[#8C8275] border-b pb-2 border-[#F6E6D0]">
                <span>Voting Rahasia Bergantian</span>
                <span className="text-[#50B5FF]">
                  Pemain {passVoteCurrentIndex + 1} dari {alivePlayers.length}
                </span>
              </div>

              <div className="w-16 h-16 mx-auto rounded-full bg-[#EFF8FF] border-4 border-[#50B5FF] p-1 shadow-md flex items-center justify-center">
                <Avatar name={alivePlayers[passVoteCurrentIndex]?.name || "Voter"} size="md" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[#8C8275] uppercase">
                  Oper HP ke:
                </span>
                <h3 className="text-2xl font-black text-[#3A332C]">
                  {alivePlayers[passVoteCurrentIndex]?.name}
                </h3>
                <p className="text-xs text-[#8C8275] font-semibold">
                  Pilih kandidat yang ingin kamu eliminasi secara rahasia!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPassVoteCoverOpen(false)}
                className="w-full btn-3d-blue py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
              >
                <Eye className="w-4 h-4" />
                <span>Buka Layar Pemilihan Vote</span>
              </button>
            </div>
          ) : (
            /* Candidate Selection */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
                <div className="flex items-center gap-2">
                  <Avatar name={alivePlayers[passVoteCurrentIndex]?.name} size="xs" />
                  <span className="text-xs font-black text-[#3A332C]">
                    {alivePlayers[passVoteCurrentIndex]?.name} sedang voting
                  </span>
                </div>
              </div>

              <span className="text-xs font-black text-[#3A332C] uppercase block">
                Pilih Siapa Yang Ingin Kamu Eliminasi:
              </span>

              <div className="space-y-2">
                {alivePlayers.map((cand) => {
                  const isSelected = passVoteSelectedCandidate?.id === cand.id;
                  const isMe = cand.id === alivePlayers[passVoteCurrentIndex]?.id;

                  return (
                    <button
                      key={cand.id}
                      type="button"
                      disabled={isMe}
                      onClick={() => setPassVoteSelectedCandidate(cand)}
                      className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-[#EFF8FF] border-[#1C8BE0] shadow-xs"
                          : isMe
                          ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                          : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#50B5FF]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={cand.name} size="sm" />
                        <span className="text-xs sm:text-sm font-black text-[#3A332C]">
                          {cand.name} {isMe && "(Dirimu)"}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-black text-[#1C8BE0] bg-white px-2.5 py-1 rounded-full border border-[#8CD3FF]">
                          Dipilih ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!passVoteSelectedCandidate}
                onClick={handlePassVoteSubmit}
                className="w-full btn-3d-peach py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>
                  {passVoteCurrentIndex + 1 < alivePlayers.length
                    ? "Kunci Pilihan & Oper ke Pemain Berikutnya"
                    : "Kunci Pilihan Terakhir & Hitung Suara"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 6: MR. WHITE GUESS OVERLAY (IF MR. WHITE IS ELIMINATED) */}
      {/* ========================================================================= */}
      {phase === "MR_WHITE_GUESS" && (
        <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#FFA012] shadow-2xl space-y-6 max-w-lg mx-auto text-center animate-pop-spring">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF1F2] border-4 border-[#E11D48] p-1 shadow-md flex items-center justify-center text-[#E11D48]">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black text-[#E11D48] uppercase tracking-wider">
              Peluang Terakhir Mr. White!
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#3A332C]">
              {eliminatedPlayer?.name} adalah Mr. White!
            </h3>
            <p className="text-xs text-[#8C8275] font-semibold">
              Sebagai Mr. White, kamu berhak menebak <strong>Kata Rahasia Warga Sipil</strong>. Jika tebakanmu tepat, kamu langsung menang!
            </p>
          </div>

          <form onSubmit={handleMrWhiteGuessSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              placeholder="Ketik tebakan kata Civilian..."
              value={mrWhiteGuessInput}
              onChange={(e) => setMrWhiteGuessInput(e.target.value)}
              className="w-full clay-input px-4 py-3.5 text-center text-sm sm:text-base font-black text-[#3A332C] border-2 border-[#FFA012]"
            />

            <button
              type="submit"
              disabled={!mrWhiteGuessInput.trim()}
              className="w-full btn-3d-peach py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kirim Tebakan Mr. White!</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 7: ELIMINATION REVEAL SUSPENSE CARD */}
      {/* ========================================================================= */}
      {phase === "ELIMINATION_REVEAL" && (
        <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#E64B2D] shadow-2xl space-y-6 max-w-lg mx-auto text-center animate-pop-spring">
          {(() => {
            const roleStyle = getRoleBadgeStyle(eliminatedPlayer?.role);
            const RoleIcon = roleStyle.icon;

            return (
              <>
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF0ED] border-4 border-[#E64B2D] p-1.5 shadow-md flex items-center justify-center">
                    <Avatar name={eliminatedPlayer?.name} size="lg" />
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-[#E64B2D] uppercase tracking-wider">
                      Hasil Eliminasi Ronde {roundNumber}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#3A332C]">
                      {eliminatedPlayer?.name} Tereliminasi!
                    </h3>
                  </div>

                  {/* Revealed Role Card (Kata rahasia tetap dirahasiakan) */}
                  <div
                    className={`p-5 rounded-2xl border-2 space-y-2 ${roleStyle.bg} ${roleStyle.border}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border bg-white ${roleStyle.text} ${roleStyle.border} shadow-xs`}
                    >
                      <RoleIcon className="w-4 h-4" />
                      <span>{roleStyle.label}</span>
                    </div>

                    <p className="text-xs font-bold text-[#3A332C] leading-relaxed">
                      {eliminatedPlayer?.role === "CIVILIAN" && "Warga salah menuduh kawan sendiri! Satu Warga Sipil telah gugur."}
                      {eliminatedPlayer?.role === "UNDERCOVER" && "Penyusup berhasil dibongkar dan dieliminasi oleh warga!"}
                      {eliminatedPlayer?.role === "MR_WHITE" && (mrWhiteGuessResult && !mrWhiteGuessResult.isCorrect ? `Mr. White gagal menebak kata (Tebakan: "${mrWhiteGuessResult.guess}") dan tereliminasi!` : "Mr. White berhasil dieliminasi!")}
                    </p>

                    <div className="pt-1 text-[11px] font-bold text-[#8C8275] bg-white/80 py-1.5 px-3 rounded-xl border border-[#E8DCCB] inline-block">
                      🔒 Kata rahasia tetap dirahasiakan hingga akhir permainan.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinueAfterElimination}
                  className="w-full btn-3d-blue py-4 rounded-2xl text-sm sm:text-base font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Lanjutkan Permainan</span>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 8: GAME OVER & SUMMARY PODIUM */}
      {/* ========================================================================= */}
      {phase === "GAME_OVER" && (
        <div className="clay-card p-6 sm:p-8 bg-white border-2 border-[#F6E6D0] shadow-2xl space-y-6 animate-pop-spring relative overflow-hidden">
          <ConfettiEffect active={true} />

          {/* Victory Banner */}
          <div className="text-center space-y-2 pb-4 border-b-2 border-[#F6E6D0]">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF8EC] border-4 border-[#FFA012] p-1.5 shadow-md flex items-center justify-center text-[#FFA012]">
              <Trophy className="w-8 h-8" />
            </div>

            <span className="text-xs font-black uppercase text-[#FFA012] bg-[#FFF8EC] px-3 py-1 rounded-full border border-[#FFA012]/40">
              Permainan Selesai
            </span>

            <h3 className="text-2xl sm:text-4xl font-black text-[#3A332C] tracking-tight">
              {winnerTeam === "CIVILIAN" && "🎉 Kemenangan Warga Sipil!"}
              {winnerTeam === "UNDERCOVER" && "🕵️ Kemenangan Undercover!"}
              {winnerTeam === "MR_WHITE" && "🎭 Kemenangan Mr. White!"}
            </h3>

            <p className="text-xs sm:text-sm font-bold text-[#8C8275] max-w-lg mx-auto">
              {gameOverReason}
            </p>
          </div>

          {/* Word Pair Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border-2 border-[#86EFAC] text-center space-y-0.5">
              <span className="text-[10px] font-black text-[#15803D] uppercase">
                Kata Warga Sipil (Civilian)
              </span>
              <div className="text-xl font-black text-[#15803D]">
                {activeWordPair?.civilian}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFF8FF] border-2 border-[#8CD3FF] text-center space-y-0.5">
              <span className="text-[10px] font-black text-[#1C8BE0] uppercase">
                Kata Undercover (Penyusup)
              </span>
              <div className="text-xl font-black text-[#1C8BE0]">
                {activeWordPair?.undercover}
              </div>
            </div>
          </div>

          {/* Full Player Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
              Rekap Peran & Status Seluruh Pemain:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 scroll-smooth">
              {players.map((p) => {
                const roleStyle = getRoleBadgeStyle(p.role);
                const RoleIcon = roleStyle.icon;
                const isWinner =
                  (winnerTeam === "CIVILIAN" && p.role === "CIVILIAN") ||
                  (winnerTeam === "UNDERCOVER" && p.role === "UNDERCOVER") ||
                  (winnerTeam === "MR_WHITE" && p.role === "MR_WHITE");

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between shadow-2xs ${
                      isWinner
                        ? "bg-[#FFFBF5] border-[#FFA012]"
                        : "bg-white border-[#F0DDC5] opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-[#3A332C]">
                            {p.name}
                          </span>
                          {isWinner && (
                            <span className="text-[9px] font-black text-[#D97E00] bg-[#FFF8EC] px-1.5 py-0.2 rounded-md">
                              Juara 🏆
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.2 rounded-full border inline-flex items-center gap-1 ${roleStyle.bg} ${roleStyle.border} ${roleStyle.text}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          <span>{roleStyle.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs font-black">
                      {p.isAlive ? (
                        <span className="text-[#24A654]">Selamat ✓</span>
                      ) : (
                        <span className="text-[#E64B2D]">
                          Ronde {p.eliminatedRound} ✕
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleReplayGame}
              className="btn-3d-peach py-4 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Lagi (Kata Baru, Pemain Sama)</span>
            </button>

            <button
              type="button"
              onClick={() => setPhase("SETUP")}
              className="py-4 rounded-2xl bg-[#FAF6EE] hover:bg-[#F2EDE1] text-[#3A332C] border-2 border-[#E8DCCB] text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
            >
              <Sliders className="w-4 h-4 text-[#FFA012]" />
              <span>Ubah Pemain & Pengaturan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
