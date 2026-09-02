import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Avatar";
import TimerDisplay from "../../components/TimerDisplay";
import { playSound } from "../../utils/sound";
import {
  Layers,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowDown,
  Trash2,
  Flame,
  ArrowRight,
  ShieldCheck,
  Check,
  HelpCircle,
  Sparkle,
  Info,
  Zap,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Suit icons & colors
const SUIT_SYMBOLS = {
  hearts: "❤️",
  diamonds: "♦️",
  clubs: "♣️",
  spades: "♠️",
};

const SUIT_NAMES = {
  hearts: "Hati",
  diamonds: "Wajik",
  clubs: "Keriting",
  spades: "Sekop",
};

// Check if a group of cards is a valid Set (3 or 4 cards with same rank, different suits)
function isValidSet(cards) {
  if (!cards || cards.length < 3 || cards.length > 4) return false;
  const r = cards[0].rank;
  if (!cards.every((c) => c.rank === r)) return false;
  const s = new Set(cards.map((c) => c.suit));
  return s.size === cards.length;
}

// Check if a group of cards is a valid Run / Seri (3 or more consecutive cards of same suit)
function isValidRun(cards) {
  if (!cards || cards.length < 3) return false;
  const s = cards[0].suit;
  if (!cards.every((c) => c.suit === s)) return false;
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  let isNormal = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].value !== sorted[i].value + 1) {
      isNormal = false;
      break;
    }
  }
  if (isNormal) return true;
  // Ace-high check (Q, K, A)
  if (sorted.some((c) => c.rank === "A")) {
    const nonAces = sorted.filter((c) => c.rank !== "A");
    const highSorted = [...nonAces, { value: 14 }].sort((a, b) => a.value - b.value);
    let isHigh = true;
    for (let i = 0; i < highSorted.length - 1; i++) {
      if (highSorted[i + 1].value !== highSorted[i].value + 1) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) return true;
  }
  return false;
}

// Client-side quick meld validator for 7 cards Remi Out
function checkClientIsRemi(hand) {
  if (!hand || hand.length !== 7) return false;
  const n = hand.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const g1 = [hand[i], hand[j], hand[k]];
        const g2 = hand.filter((_, idx) => idx !== i && idx !== j && idx !== k);
        if ((isValidSet(g1) || isValidRun(g1)) && (isValidSet(g2) || isValidRun(g2))) {
          return { isRemi: true, meld1: g1, meld2: g2 };
        }
      }
    }
  }
  return false;
}

// Find all current sub-melds (runs and sets) in hand to highlight for player assistance
function detectCurrentMelds(hand) {
  if (!hand || hand.length < 3) return { meldCardIds: new Set(), meldDescriptions: [] };

  const meldCardIds = new Set();
  const meldDescriptions = [];

  // 1. Detect Sets (3 or 4 same rank)
  const byRank = {};
  hand.forEach((c) => {
    byRank[c.rank] = byRank[c.rank] || [];
    byRank[c.rank].push(c);
  });

  Object.entries(byRank).forEach(([rank, cards]) => {
    if (cards.length >= 3) {
      const suits = new Set(cards.map((c) => c.suit));
      if (suits.size === cards.length) {
        cards.forEach((c) => meldCardIds.add(c.id));
        meldDescriptions.push(`Set ${rank} (${cards.map((c) => SUIT_SYMBOLS[c.suit]).join("")})`);
      }
    }
  });

  // 2. Detect Runs (3 or more same suit in sequence)
  const bySuit = {};
  hand.forEach((c) => {
    bySuit[c.suit] = bySuit[c.suit] || [];
    bySuit[c.suit].push(c);
  });

  Object.entries(bySuit).forEach(([suit, cards]) => {
    if (cards.length >= 3) {
      const sorted = [...cards].sort((a, b) => a.value - b.value);
      for (let i = 0; i <= sorted.length - 3; i++) {
        const trio = [sorted[i], sorted[i + 1], sorted[i + 2]];
        if (isValidRun(trio)) {
          trio.forEach((c) => meldCardIds.add(c.id));
          meldDescriptions.push(`Seri ${SUIT_SYMBOLS[suit]} (${trio.map((c) => c.rank).join("-")})`);
        }
      }
    }
  });

  return { meldCardIds, meldDescriptions };
}

export default function RemiGame({
  room,
  socket,
  identity,
  nickname,
  isHost,
  isSpectator,
  currentTurnSocketId: propTurnSocketId,
  currentTurnPlayerId: propTurnPlayerId,
  currentTurnName: propTurnName,
}) {
  const [hand, setHand] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [drawPileCount, setDrawPileCount] = useState(30);
  const [topDiscardCard, setTopDiscardCard] = useState(null);
  const [playersHandCount, setPlayersHandCount] = useState({});
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [drawnAlert, setDrawnAlert] = useState(null);
  const [stepWarning, setStepWarning] = useState(null);
  const lastCardClickRef = useRef({ id: null, time: 0 });

  // Internal turn tracking to guarantee instantaneous updates & no sync delays
  const [turnSocketId, setTurnSocketId] = useState(propTurnSocketId || room?.currentTurnSocketId || null);
  const [turnPlayerId, setTurnPlayerId] = useState(propTurnPlayerId || room?.currentTurnPlayerId || null);
  const [turnName, setTurnName] = useState(propTurnName || room?.currentTurnName || "Pemain Lain");
  const [turnEndsAt, setTurnEndsAt] = useState(room?.currentTurnEndsAt || null);
  const [turnDuration, setTurnDuration] = useState(room?.settings?.turnTimeLimit || 30);

  // Sync turn state when props or room change
  useEffect(() => {
    if (propTurnSocketId) setTurnSocketId(propTurnSocketId);
    if (propTurnPlayerId) setTurnPlayerId(propTurnPlayerId);
    if (propTurnName) setTurnName(propTurnName);
    if (room?.currentTurnEndsAt) setTurnEndsAt(room.currentTurnEndsAt);
    if (room?.settings?.turnTimeLimit) setTurnDuration(room.settings.turnTimeLimit);
  }, [propTurnSocketId, propTurnPlayerId, propTurnName, room?.currentTurnEndsAt, room?.settings?.turnTimeLimit]);

  const activeTurnSocketId = turnSocketId || propTurnSocketId || room?.currentTurnSocketId;
  const activeTurnPlayerId = turnPlayerId || propTurnPlayerId || room?.currentTurnPlayerId;
  const activeTurnName = turnName || propTurnName || room?.currentTurnName || "Pemain Lain";

  const isMyTurn = Boolean(
    (activeTurnSocketId && activeTurnSocketId === socket?.id) ||
    (activeTurnPlayerId && identity?.playerId && activeTurnPlayerId === identity.playerId) ||
    (activeTurnName && nickname && activeTurnName.trim().toLowerCase() === nickname.trim().toLowerCase())
  );

  // Setup Socket listeners & sync on mount
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data) => {
      setHand(data.hand || []);
      setDrawPileCount(data.drawPileCount || 0);
      setTopDiscardCard(data.topDiscardCard || null);
      setPlayersHandCount(data.playersHandCount || {});
      if (data.currentTurnSocketId) {
        setTurnSocketId(data.currentTurnSocketId);
        setTurnPlayerId(data.currentTurnPlayerId);
        setTurnName(data.currentTurnName);
        setTurnEndsAt(data.currentTurnEndsAt);
      }
      if (data.turnTimeLimit) {
        setTurnDuration(data.turnTimeLimit);
      }
      if (data.hasDrawnThisTurn !== undefined) {
        setHasDrawnThisTurn(data.hasDrawnThisTurn);
      } else {
        setHasDrawnThisTurn(false);
      }
    };

    const handleHandUpdated = (data) => {
      setHand(data.hand || []);
      if (data.drawnCard) {
        setHasDrawnThisTurn(true);
        setDrawnAlert(`Kartu ditarik: ${data.drawnCard.rank} ${SUIT_SYMBOLS[data.drawnCard.suit]}`);
        playSound("reveal");
        setTimeout(() => setDrawnAlert(null), 5000);
      }
    };

    const handleTableUpdated = (data) => {
      setDrawPileCount(data.drawPileCount || 0);
      if (data.topDiscardCard) setTopDiscardCard(data.topDiscardCard);
      if (data.playersHandCount) setPlayersHandCount(data.playersHandCount);
    };

    const handleTurnChange = (data) => {
      setTurnSocketId(data.currentTurnSocketId);
      setTurnPlayerId(data.currentTurnPlayerId);
      setTurnName(data.currentTurnName);
      setTurnEndsAt(data.endsAt);
      if (data.duration) setTurnDuration(data.duration);
      setDrawPileCount(data.drawPileCount || 0);
      setTopDiscardCard(data.topDiscardCard || null);

      const isTurn = Boolean(
        data.currentTurnSocketId === socket.id ||
        (data.currentTurnPlayerId && identity?.playerId && data.currentTurnPlayerId === identity.playerId) ||
        (data.currentTurnName && nickname && data.currentTurnName.trim().toLowerCase() === nickname.trim().toLowerCase())
      );

      if (isTurn) {
        setHasDrawnThisTurn(false);
        setSelectedCardId(null);
        setStepWarning(null);
        playSound("turn", { isMyTurn: true });
      }
    };

    socket.on("remi:game_started", handleGameStarted);
    socket.on("remi:hand_updated", handleHandUpdated);
    socket.on("remi:table_updated", handleTableUpdated);
    socket.on("remi:turn_change", handleTurnChange);

    // Request sync in case we missed initial event or reconnected
    if (room?.id) {
      socket.emit("remi:sync_state", { roomId: room.id });
    }

    return () => {
      socket.off("remi:game_started", handleGameStarted);
      socket.off("remi:hand_updated", handleHandUpdated);
      socket.off("remi:table_updated", handleTableUpdated);
      socket.off("remi:turn_change", handleTurnChange);
    };
  }, [socket, room?.id, identity?.playerId, nickname]);

  // Keyboard shortcut listener (Space to draw from deck, Enter to discard selected)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (!isMyTurn) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!hasDrawnThisTurn) {
          handleDrawFromDeck();
        }
      } else if (e.code === "Enter" || e.code === "Delete") {
        e.preventDefault();
        if (hasDrawnThisTurn && selectedCardId) {
          handleDiscardSelectedCard(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMyTurn, hasDrawnThisTurn, selectedCardId]);

  // Actions
  const handleDrawFromDeck = () => {
    if (!isMyTurn) {
      showTemporaryWarning("⏳ Tunggu giliranmu untuk menarik kartu!");
      return;
    }
    if (hasDrawnThisTurn) {
      showTemporaryWarning("⚠️ Kamu sudah menarik kartu di giliran ini. Sekarang pilih 1 kartu di bawah untuk dibuang!");
      return;
    }
    if (!room) return;
    socket.emit("remi:draw_card", { roomId: room.id, source: "deck" });
    setStepWarning(null);
  };

  const handleDrawFromDiscard = () => {
    if (!isMyTurn) {
      showTemporaryWarning("⏳ Tunggu giliranmu untuk menarik kartu!");
      return;
    }
    if (hasDrawnThisTurn) {
      showTemporaryWarning("⚠️ Kamu sudah menarik kartu di giliran ini. Sekarang pilih 1 kartu di bawah untuk dibuang!");
      return;
    }
    if (!topDiscardCard) {
      showTemporaryWarning("⚠️ Tumpukan buangan masih kosong!");
      return;
    }
    if (!room) return;
    socket.emit("remi:draw_card", { roomId: room.id, source: "discard" });
    setStepWarning(null);
  };

  const handleCardClick = (cardId) => {
    const now = Date.now();
    const isDouble = lastCardClickRef.current.id === cardId && now - lastCardClickRef.current.time < 350;
    lastCardClickRef.current = { id: cardId, time: now };

    if (!isMyTurn) {
      setSelectedCardId(selectedCardId === cardId ? null : cardId);
      return;
    }

    if (!hasDrawnThisTurn) {
      setSelectedCardId(cardId);
      showTemporaryWarning("💡 Langkah 1: Klik Dek atau Buangan di atas dulu untuk mengambil kartu, baru buang kartu ini!");
      return;
    }

    // If double clicked when already drawn, discard immediately!
    if (isDouble && selectedCardId === cardId) {
      handleDiscardSelectedCard(false);
      return;
    }

    setSelectedCardId(selectedCardId === cardId ? null : cardId);
    playSound("message");
  };

  const handleDiscardSelectedCard = (isDeclareWin = false) => {
    if (!isMyTurn) {
      showTemporaryWarning("⏳ Bukan giliranmu!");
      return;
    }
    if (!hasDrawnThisTurn) {
      showTemporaryWarning("⚠️ Kamu harus menarik 1 kartu dari Dek atau Buangan terlebih dahulu!");
      return;
    }
    if (!selectedCardId) {
      showTemporaryWarning("👆 Pilih 1 kartu di tanganmu yang ingin kamu buang!");
      return;
    }
    if (!room) return;

    socket.emit("remi:discard_card", {
      roomId: room.id,
      cardId: selectedCardId,
      isDeclareWin,
    });

    playSound(isDeclareWin ? "victory" : "message");
    setSelectedCardId(null);
    setHasDrawnThisTurn(false);
  };

  const showTemporaryWarning = (msg) => {
    setStepWarning(msg);
    setTimeout(() => setStepWarning(null), 5000);
  };

  // Sorting and moving utilities
  const handleSortBySuit = () => {
    const sorted = [...hand].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.value - b.value;
    });
    setHand(sorted);
  };

  const handleSortByRank = () => {
    const sorted = [...hand].sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value;
      return a.suit.localeCompare(b.suit);
    });
    setHand(sorted);
  };

  const handleMoveLeft = () => {
    if (!selectedCardId) return;
    const idx = hand.findIndex((c) => c.id === selectedCardId);
    if (idx <= 0) return;
    const newHand = [...hand];
    const [c] = newHand.splice(idx, 1);
    newHand.splice(idx - 1, 0, c);
    setHand(newHand);
  };

  const handleMoveRight = () => {
    if (!selectedCardId) return;
    const idx = hand.findIndex((c) => c.id === selectedCardId);
    if (idx === -1 || idx >= hand.length - 1) return;
    const newHand = [...hand];
    const [c] = newHand.splice(idx, 1);
    newHand.splice(idx + 1, 0, c);
    setHand(newHand);
  };

  // Check if remaining 7 cards form full Remi when a card is selected to discard
  const isSelectedCardCanRemi = () => {
    if (!hasDrawnThisTurn || !selectedCardId || hand.length !== 8) return false;
    const remainingHand = hand.filter((c) => c.id !== selectedCardId);
    const result = checkClientIsRemi(remainingHand);
    return Boolean(result && result.isRemi);
  };

  const isCurrentHandFullRemi = checkClientIsRemi(hand.length === 7 ? hand : hand.slice(0, 7));
  const { meldCardIds, meldDescriptions } = detectCurrentMelds(hand);
  const otherPlayers = (room?.players || []).filter((p) => p.socketId !== socket?.id && p.connected);

  const selectedCardObj = hand.find((c) => c.id === selectedCardId);

  return (
    <div className="flex flex-col space-y-4 animate-pop-spring w-full max-w-full overflow-hidden">
      {/* 1. TOP STATUS BAR & OTHER PLAYERS */}
      <div className="clay-card p-4 sm:p-5 shadow-md border-2 border-[#F6E6D0] bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-[#FFF0ED] rounded-2xl text-[#E64B2D] border-2 border-[#FFB2A1] shadow-2xs shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    isMyTurn
                      ? "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9] animate-pulse"
                      : "bg-[#FFF8EC] text-[#FFA012] border-[#F0DDC5]"
                  }`}
                >
                  {isMyTurn ? "🔥 Giliranmu Sekarang!" : `⏳ Giliran: ${activeTurnName || "Pemain Lain"}`}
                </span>

                {isMyTurn && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
                    {!hasDrawnThisTurn ? "1. Ambil Kartu" : "2. Buang Kartu"}
                  </span>
                )}
              </div>

              <h3 className="text-xs sm:text-sm md:text-base font-black text-[#3A332C] mt-0.5 truncate">
                {isMyTurn
                  ? !hasDrawnThisTurn
                    ? "👉 LANGKAH 1: Klik Tumpukan Dek / Buangan di bawah untuk mengambil 1 kartu!"
                    : "👉 LANGKAH 2: Pilih 1 kartu di tanganmu lalu klik 'Buang Kartu' (atau 'Tutup Remi')!"
                  : `Menunggu ${activeTurnName || "pemain"} mengambil & membuang kartu...`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {turnEndsAt && <TimerDisplay endsAt={turnEndsAt} duration={turnDuration} />}
            <span className="text-xs font-black text-[#1C8BE0] bg-[#EFF8FF] border border-[#8CD3FF] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Sisa Dek: {drawPileCount}</span>
            </span>
          </div>
        </div>

        {/* Other Players Cards Count Row */}
        <div className="flex items-center gap-2.5 overflow-x-auto pt-3 pb-1">
          {otherPlayers.map((p) => {
            const isTurn = p.socketId === activeTurnSocketId;
            const count = playersHandCount[p.socketId] || 7;
            const isBotPlayer = !!p.isBot;
            return (
              <div
                key={p.socketId}
                className={`p-2 sm:p-2.5 rounded-2xl border-2 flex items-center gap-2 transition shrink-0 ${
                  isTurn
                    ? "bg-[#FFF8EC] border-[#FFA012] shadow-sm ring-2 ring-[#FFA012]/40"
                    : "bg-[#FFFBF5] border-[#F0DDC5]"
                }`}
              >
                <Avatar name={p.name} size="xs" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-[#3A332C] block truncate max-w-[80px] sm:max-w-[100px]">
                      {p.name}
                    </span>
                    {isBotPlayer && (
                      <span className="text-[8px] font-black text-[#7B33ED] bg-[#F7F1FF] px-1 rounded">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#8C8275] flex items-center gap-1">
                    <span>{count} Kartu</span>
                    {isTurn && <span className="text-[#FFA012] font-black">• Main</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. GAMEPLAY STEP BANNER NOTIFICATION */}
      {stepWarning && (
        <div className="p-3 bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D] text-xs font-black rounded-2xl flex items-center justify-between shadow-sm animate-pop-spring">
          <span>{stepWarning}</span>
          <button
            type="button"
            onClick={() => setStepWarning(null)}
            className="text-[#8C8275] hover:text-[#3A332C] font-black ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {drawnAlert && (
        <div className="p-3 bg-[#EDFCF2] border-2 border-[#89EFA9] text-[#24A654] text-xs font-black rounded-2xl flex items-center gap-2 shadow-sm animate-pop-spring">
          <Sparkles className="w-4 h-4 text-[#24A654] shrink-0" />
          <span>✓ {drawnAlert} — Sekarang pilih 1 kartu di tangan untuk dibuang!</span>
        </div>
      )}

      {/* 3. TABLE ARENA: DRAW PILE & DISCARD PILE */}
      <div className="clay-card p-4 sm:p-6 shadow-md border-2 border-[#F6E6D0] bg-gradient-to-b from-[#FAF6EE] to-[#F2EDE1] flex flex-col items-center justify-center space-y-4 rounded-3xl relative">
        {/* Turn Step Guide Header */}
        <div className="px-3.5 py-1.5 bg-white/95 border-2 border-[#E8DCCB] rounded-full shadow-xs text-[11px] sm:text-xs font-black text-[#3A332C] flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-[#24A654] animate-ping" : "bg-[#FFA012]"}`}></span>
          <span className="truncate">
            {isMyTurn
              ? !hasDrawnThisTurn
                ? "👉 LANGKAH 1 DARI 2: Klik salah satu tumpukan di bawah untuk mengambil kartu!"
                : "👉 LANGKAH 2 DARI 2: Kartu berhasil diambil! Pilih 1 kartu di tanganmu lalu buang."
              : "Sedang menunggu giliran pemain lain..."}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-10 md:gap-14 w-full">
          {/* Tumpukan Tertutup (Draw Pile) */}
          <div className="flex flex-col items-center space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#8C8275] tracking-wider">
              1. Tumpukan Dek
            </span>
            <button
              type="button"
              onClick={handleDrawFromDeck}
              disabled={!isMyTurn || hasDrawnThisTurn || drawPileCount === 0}
              className={`w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-2 bg-gradient-to-b from-[#68D0FF] to-[#30B5FA] shadow-[0_6px_0_#248BC7] sm:shadow-[0_8px_0_#248BC7] flex flex-col items-center justify-between p-2.5 sm:p-3 text-white transition-all cursor-pointer group ${
                isMyTurn && !hasDrawnThisTurn
                  ? "border-[#FFA012] ring-4 ring-[#50B5FF] hover:-translate-y-2 hover:shadow-[0_10px_0_#248BC7] animate-bounce active:scale-95"
                  : "border-[#50B5FF] opacity-85 disabled:cursor-not-allowed"
              }`}
            >
              <div className="w-full text-right text-[9px] sm:text-[10px] font-black opacity-80">DEK</div>
              <div className="w-16 sm:w-20 h-20 sm:h-24 rounded-xl border-2 border-dashed border-white/60 flex flex-col items-center justify-center p-1">
                <Layers className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                <span className="text-sm sm:text-base font-black mt-0.5">{drawPileCount}</span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase opacity-80">Kartu</span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xs ${
                isMyTurn && !hasDrawnThisTurn ? "bg-[#FFA012] text-white animate-pulse" : "bg-white/20 text-white"
              }`}>
                {isMyTurn && !hasDrawnThisTurn ? "👆 KLIK AMBIL" : "TUMPUKAN"}
              </span>
            </button>
          </div>

          {/* Tumpukan Terbuka (Discard Pile) */}
          <div className="flex flex-col items-center space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#8C8275] tracking-wider">
              2. Tumpukan Buangan
            </span>
            {topDiscardCard ? (
              <button
                type="button"
                onClick={handleDrawFromDiscard}
                disabled={!isMyTurn || hasDrawnThisTurn}
                className={`w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-2 bg-white shadow-[0_6px_0_#D9C4AB] sm:shadow-[0_8px_0_#D9C4AB] flex flex-col justify-between p-2.5 sm:p-3 transition-all cursor-pointer ${
                  isMyTurn && !hasDrawnThisTurn
                    ? "border-[#FFA012] ring-4 ring-[#FFA012]/40 hover:-translate-y-2 hover:shadow-[0_10px_0_#D9C4AB] animate-bounce active:scale-95"
                    : "border-[#F0DDC5] disabled:cursor-default"
                }`}
              >
                {/* Top-left rank & suit */}
                <div
                  className={`text-left leading-none font-black text-xs sm:text-base ${
                    topDiscardCard.suit === "hearts" || topDiscardCard.suit === "diamonds"
                      ? "text-[#E64B2D]"
                      : "text-[#3A332C]"
                  }`}
                >
                  <div>{topDiscardCard.rank}</div>
                  <div className="text-[11px] sm:text-xs">{SUIT_SYMBOLS[topDiscardCard.suit]}</div>
                </div>

                {/* Center Big Suit */}
                <div className="text-center text-3xl sm:text-5xl select-none">
                  {SUIT_SYMBOLS[topDiscardCard.suit]}
                </div>

                {/* Bottom row button */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isMyTurn && !hasDrawnThisTurn ? "bg-[#FFA012] text-white" : "bg-[#FAF6EE] text-[#8C8275]"
                  }`}>
                    {isMyTurn && !hasDrawnThisTurn ? "👆 AMBIL" : "BUANGAN"}
                  </span>
                  <div
                    className={`text-right leading-none font-black text-xs sm:text-base ${
                      topDiscardCard.suit === "hearts" || topDiscardCard.suit === "diamonds"
                        ? "text-[#E64B2D]"
                        : "text-[#3A332C]"
                    }`}
                  >
                    <div className="text-[11px] sm:text-xs">{SUIT_SYMBOLS[topDiscardCard.suit]}</div>
                    <div>{topDiscardCard.rank}</div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-2 border-dashed border-[#D9C4AB] bg-white/50 flex flex-col items-center justify-center text-xs font-bold text-[#8C8275] p-3 text-center">
                <Trash2 className="w-6 sm:w-8 h-6 sm:h-8 text-[#C7B69F] mb-1" />
                <span>Buangan Kosong</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PLAYER IDENTITY & HAND CARDS RACK (Generous vertical clearance & responsive wrapping to prevent overflow) */}
      <div className={`clay-card p-4 sm:p-5 shadow-md border-2 bg-white space-y-4 transition-all w-full ${
        isMyTurn && hasDrawnThisTurn ? "border-[#24A654] ring-2 ring-[#24A654]/30" : "border-[#F6E6D0]"
      }`}>
        {/* Player Profile & Identity Card Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-gradient-to-r from-[#FFFBF5] to-[#FAF6EE] rounded-2xl border-2 border-[#F0DDC5] shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={nickname || identity?.cachedName || "Pemain"} size="sm" isAlive={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-[#3A332C] truncate">
                  {nickname || identity?.cachedName || "Pemain"}
                </span>
                <span className="text-[10px] font-black text-white bg-gradient-to-r from-[#50B5FF] to-[#1C8BE0] px-2.5 py-0.5 rounded-full shadow-xs">
                  👤 Kamu (Pemain)
                </span>
                {isHost && (
                  <span className="text-[9px] font-black text-[#FFA012] bg-[#FFF8EC] border border-[#F0DDC5] px-2 py-0.5 rounded-md">
                    👑 Host
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8C8275] font-semibold flex items-center gap-2 mt-0.5">
                <span>Memegang <strong className="text-[#3A332C] font-black">{hand.length} Kartu</strong></span>
                <span>•</span>
                <span className={isMyTurn ? "text-[#24A654] font-black animate-pulse" : "text-[#FFA012] font-bold"}>
                  {isMyTurn ? "🔥 Giliranmu Sekarang!" : "⏳ Menunggu Giliran Lawan"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hand Toolbar & Meld Assistant */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider shrink-0">
              Kartu Tangan ({hand.length} Kartu)
            </span>

            {/* Combination Detection Badges */}
            {meldDescriptions.map((desc, idx) => (
              <span
                key={idx}
                className="text-[10px] font-black bg-[#EDFCF2] text-[#24A654] border border-[#89EFA9] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-[#24A654] shrink-0" />
                <span>{desc}</span>
              </span>
            ))}

            {isCurrentHandFullRemi && (
              <span className="text-[10px] font-black bg-gradient-to-r from-[#FFD15C] to-[#FFA012] text-[#3A332C] border border-white px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-bounce shadow-xs">
                <Trophy className="w-3 h-3 text-[#3A332C] shrink-0" />
                <span>Kombinasi Lengkap!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedCardId && (
              <>
                <button
                  type="button"
                  onClick={handleMoveLeft}
                  title="Geser kartu ke kiri"
                  className="p-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF] transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleMoveRight}
                  title="Geser kartu ke kanan"
                  className="p-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF] transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleSortBySuit}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#3A332C] border border-[#F0DDC5] transition cursor-pointer shadow-2xs active:scale-95"
            >
              Corak 🔀
            </button>
            <button
              type="button"
              onClick={handleSortByRank}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#3A332C] border border-[#F0DDC5] transition cursor-pointer shadow-2xs active:scale-95"
            >
              Angka 🔢
            </button>
          </div>
        </div>

        {/* 3D Playing Cards Hand Display (High z-index, ample top clearance, flexible wrap & spacing) */}
        <div className="relative w-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center flex-wrap gap-1.5 xs:gap-2 sm:gap-3 pt-10 pb-6 px-1">
          {hand.map((card, idx) => {
            const isSelected = selectedCardId === card.id;
            const isRed = card.suit === "hearts" || card.suit === "diamonds";
            const isInMeld = meldCardIds.has(card.id);

            return (
              <div
                key={card.id}
                className={`relative select-none transition-all duration-200 ${
                  isSelected ? "z-30" : "z-10 hover:z-20"
                }`}
              >
                {/* Floating Action Button ON TOP of selected card */}
                {isSelected && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 animate-pop-spring pointer-events-auto">
                    {isMyTurn && hasDrawnThisTurn ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscardSelectedCard(false);
                        }}
                        className="bg-[#E64B2D] hover:bg-[#D43819] text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1 cursor-pointer active:scale-95 animate-pulse whitespace-nowrap"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>BUANG</span>
                      </button>
                    ) : (
                      <span className="bg-[#FFA012] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm border border-white whitespace-nowrap">
                        DIPILIH
                      </span>
                    )}
                  </div>
                )}

                {/* Sub-meld Badge if in set/run */}
                {!isSelected && isInMeld && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#24A654] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white whitespace-nowrap z-20">
                    KOMBO
                  </div>
                )}

                {/* Card Button */}
                <button
                  type="button"
                  onClick={() => handleCardClick(card.id)}
                  className={`w-14 xs:w-16 sm:w-22 md:w-26 h-22 xs:h-26 sm:h-34 md:h-40 rounded-xl sm:rounded-2xl border-2 bg-white flex flex-col justify-between p-1.5 sm:p-2.5 transition-all cursor-pointer text-left ${
                    isSelected
                      ? "-translate-y-4 border-3 sm:border-4 border-[#FFA012] bg-[#FFFFFC] shadow-[0_8px_0_#D97E00] sm:shadow-[0_12px_0_#D97E00] ring-3 sm:ring-4 ring-[#FFA012]/40 scale-105"
                      : isInMeld
                      ? "border-[#89EFA9] bg-[#FAFDFB] shadow-[0_4px_0_#62C685] hover:-translate-y-1.5"
                      : "border-[#F0DDC5] shadow-[0_4px_0_#D9C4AB] hover:-translate-y-1.5 hover:shadow-[0_6px_0_#D9C4AB]"
                  }`}
                >
                  {/* Top-left rank & suit */}
                  <div className={`leading-tight font-black text-xs sm:text-base ${isRed ? "text-[#E64B2D]" : "text-[#3A332C]"}`}>
                    <div>{card.rank}</div>
                    <div className="text-[10px] sm:text-xs">{SUIT_SYMBOLS[card.suit]}</div>
                  </div>

                  {/* Center Big Suit */}
                  <div className="text-center text-xl xs:text-2xl sm:text-4xl select-none">
                    {SUIT_SYMBOLS[card.suit]}
                  </div>

                  {/* Bottom-right inverted */}
                  <div className={`text-right leading-tight font-black text-xs sm:text-base ${isRed ? "text-[#E64B2D]" : "text-[#3A332C]"}`}>
                    <div className="text-[10px] sm:text-xs">{SUIT_SYMBOLS[card.suit]}</div>
                    <div>{card.rank}</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* 5. ALWAYS-VISIBLE ACTION CONTROL BAR */}
        <div className="pt-2 border-t border-[#F6E6D0]">
          {isMyTurn ? (
            !hasDrawnThisTurn ? (
              /* State 1: Need to draw first */
              <div className="p-3.5 bg-[#FFF8EC] rounded-2xl border-2 border-[#FFA012]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl text-[#FFA012] border border-[#F0DDC5] shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#3A332C]">
                      Langkah 1: Ambil 1 Kartu Terlebih Dahulu
                    </h4>
                    <p className="text-[11px] text-[#8C8275] font-semibold">
                      Klik <strong>Tumpukan Dek</strong> atau <strong>Tumpukan Buangan</strong> di atas!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDrawFromDeck}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black btn-3d-blue text-white transition cursor-pointer shadow-xs active:scale-95"
                  >
                    Ambil Dek 🎴
                  </button>
                  {topDiscardCard && (
                    <button
                      type="button"
                      onClick={handleDrawFromDiscard}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black btn-3d-peach text-white transition cursor-pointer shadow-xs active:scale-95"
                    >
                      Ambil Buangan 🃏
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* State 2: Has drawn, ready to discard */
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-pop-spring">
                <button
                  type="button"
                  onClick={() => handleDiscardSelectedCard(false)}
                  disabled={!selectedCardId}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-2xl font-black text-xs sm:text-sm btn-3d-peach transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {selectedCardObj
                      ? `Buang Kartu ${selectedCardObj.rank} ${SUIT_SYMBOLS[selectedCardObj.suit]}`
                      : "Pilih 1 Kartu di Atas untuk Dibuang (atau Klik Ganda Kartu)"}
                  </span>
                </button>

                {isSelectedCardCanRemi() && (
                  <button
                    type="button"
                    onClick={() => handleDiscardSelectedCard(true)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#FFD15C] to-[#FFA012] text-[#3A332C] border-2 border-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer animate-bounce active:scale-95"
                  >
                    <Trophy className="w-5 h-5 text-[#3A332C]" />
                    <span>🏆 TUTUP REMI & DEKLARASIKAN MENANG!</span>
                  </button>
                )}
              </div>
            )
          ) : (
            /* State 3: Waiting for another player */
            <div className="p-3 bg-[#FAF6EE] rounded-2xl border border-[#E8DCCB] text-center text-xs font-bold text-[#8C8275] flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#FFA012]" />
              <span>
                Sedang menunggu <strong>{activeTurnName || "pemain"}</strong> menyelesaikan gilirannya...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
