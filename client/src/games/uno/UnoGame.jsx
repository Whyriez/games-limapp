import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Avatar";
import TimerDisplay from "../../components/TimerDisplay";
import { playSound } from "../../utils/sound";
import {
  Layers,
  Sparkles,
  Trophy,
  Clock,
  Trash2,
  Flame,
  RotateCcw,
  RotateCw,
  Check,
  Zap,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

const COLOR_MAP = {
  red: {
    bg: "bg-[#FF3B30]",
    border: "border-[#D7261B]",
    shadow: "shadow-[0_6px_0_#B81B11]",
    ring: "ring-[#FF3B30]/40",
    text: "text-[#FF3B30]",
    name: "Merah",
  },
  yellow: {
    bg: "bg-[#FFCC00]",
    border: "border-[#D6A700]",
    shadow: "shadow-[0_6px_0_#B38B00]",
    ring: "ring-[#FFCC00]/40",
    text: "text-[#C79600]",
    name: "Kuning",
  },
  green: {
    bg: "bg-[#34C759]",
    border: "border-[#249B42]",
    shadow: "shadow-[0_6px_0_#1E8237]",
    ring: "ring-[#34C759]/40",
    text: "text-[#249B42]",
    name: "Hijau",
  },
  blue: {
    bg: "bg-[#007AFF]",
    border: "border-[#005EC4]",
    shadow: "shadow-[0_6px_0_#004DA3]",
    ring: "ring-[#007AFF]/40",
    text: "text-[#007AFF]",
    name: "Biru",
  },
  wild: {
    bg: "bg-gradient-to-tr from-[#FF3B30] via-[#FFCC00] via-[#34C759] to-[#007AFF]",
    border: "border-[#3A332C]",
    shadow: "shadow-[0_6px_0_#221F1C]",
    ring: "ring-[#FFA012]/40",
    text: "text-white",
    name: "WILD",
  },
};

function isCardPlayableClient(card, activeColor, topCard) {
  if (!card) return false;
  if (card.color === "wild" || card.type === "wild" || card.type === "wild4") return true;
  if (card.color === activeColor) return true;
  if (card.type === "number" && topCard && topCard.type === "number" && card.value === topCard.value) return true;
  if (topCard && card.type === topCard.type && card.type !== "number") return true;
  return false;
}

export default function UnoGame({
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
  const [topCard, setTopCard] = useState(null);
  const [activeColor, setActiveColor] = useState("red");
  const [turnDirection, setTurnDirection] = useState(1);
  const [drawPileCount, setDrawPileCount] = useState(40);
  const [playersHandCount, setPlayersHandCount] = useState({});
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);
  const [unoAlert, setUnoAlert] = useState(null);

  // Wild Color Picker Modal State
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Internal turn tracking
  const [turnSocketId, setTurnSocketId] = useState(propTurnSocketId || room?.currentTurnSocketId || null);
  const [turnPlayerId, setTurnPlayerId] = useState(propTurnPlayerId || room?.currentTurnPlayerId || null);
  const [turnName, setTurnName] = useState(propTurnName || room?.currentTurnName || "Pemain Lain");
  const [turnEndsAt, setTurnEndsAt] = useState(room?.currentTurnEndsAt || null);
  const [turnDuration, setTurnDuration] = useState(room?.settings?.turnTimeLimit || 30);

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

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data) => {
      setHand(data.hand || []);
      setTopCard(data.topCard || null);
      setActiveColor(data.activeColor || "red");
      setTurnDirection(data.turnDirection || 1);
      setDrawPileCount(data.drawPileCount || 0);
      setPlayersHandCount(data.playersHandCount || {});
      if (data.currentTurnSocketId) {
        setTurnSocketId(data.currentTurnSocketId);
        setTurnPlayerId(data.currentTurnPlayerId);
        setTurnName(data.currentTurnName);
        setTurnEndsAt(data.currentTurnEndsAt);
      }
      if (data.turnTimeLimit) setTurnDuration(data.turnTimeLimit);
      setHasDrawnThisTurn(false);
    };

    const handleHandUpdated = (data) => {
      setHand(data.hand || []);
      if (data.drawnCards) {
        setHasDrawnThisTurn(true);
        playSound("reveal");
      }
    };

    const handleTableUpdated = (data) => {
      if (data.topCard) setTopCard(data.topCard);
      if (data.activeColor) setActiveColor(data.activeColor);
      if (data.turnDirection) setTurnDirection(data.turnDirection);
      if (data.drawPileCount !== undefined) setDrawPileCount(data.drawPileCount);
      if (data.playersHandCount) setPlayersHandCount(data.playersHandCount);
      if (data.lastActionAlert) {
        setActionAlert(data.lastActionAlert);
        setTimeout(() => setActionAlert(null), 5000);
      }
    };

    const handleTurnChange = (data) => {
      setTurnSocketId(data.currentTurnSocketId);
      setTurnPlayerId(data.currentTurnPlayerId);
      setTurnName(data.currentTurnName);
      setTurnEndsAt(data.endsAt);
      if (data.duration) setTurnDuration(data.duration);
      if (data.topCard) setTopCard(data.topCard);
      if (data.activeColor) setActiveColor(data.activeColor);
      if (data.turnDirection) setTurnDirection(data.turnDirection);
      if (data.drawPileCount !== undefined) setDrawPileCount(data.drawPileCount);
      if (data.lastActionAlert) {
        setActionAlert(data.lastActionAlert);
        setTimeout(() => setActionAlert(null), 5000);
      }

      const isTurn = Boolean(
        data.currentTurnSocketId === socket.id ||
        (data.currentTurnPlayerId && identity?.playerId && data.currentTurnPlayerId === identity.playerId) ||
        (data.currentTurnName && nickname && data.currentTurnName.trim().toLowerCase() === nickname.trim().toLowerCase())
      );

      if (isTurn) {
        setHasDrawnThisTurn(false);
        playSound("turn", { isMyTurn: true });
      }
    };

    const handleCalledUno = (data) => {
      setUnoAlert(data.message || `${data.playerName} BERTERIAK "UNO!"`);
      playSound("victory");
      setTimeout(() => setUnoAlert(null), 6000);
    };

    socket.on("uno:game_started", handleGameStarted);
    socket.on("uno:hand_updated", handleHandUpdated);
    socket.on("uno:table_updated", handleTableUpdated);
    socket.on("uno:turn_change", handleTurnChange);
    socket.on("uno:called_uno", handleCalledUno);

    // Sync state
    if (room?.id) {
      socket.emit("uno:sync_state", { roomId: room.id });
    }

    return () => {
      socket.off("uno:game_started", handleGameStarted);
      socket.off("uno:hand_updated", handleHandUpdated);
      socket.off("uno:table_updated", handleTableUpdated);
      socket.off("uno:turn_change", handleTurnChange);
      socket.off("uno:called_uno", handleCalledUno);
    };
  }, [socket, room?.id, identity?.playerId, nickname]);

  // Actions
  const handlePlayCard = (card) => {
    if (!isMyTurn) {
      showTemporaryWarning("⏳ Tunggu giliranmu untuk mengeluarkan kartu!");
      return;
    }

    if (!isCardPlayableClient(card, activeColor, topCard)) {
      showTemporaryWarning("⚠️ Kartu ini tidak cocok dengan warna atau angka saat ini!");
      return;
    }

    if (card.color === "wild") {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    // Play standard colored card
    socket.emit("uno:play_card", {
      roomId: room.id,
      cardId: card.id,
      chosenColor: card.color,
    });
    playSound("message");
  };

  const handleSelectWildColor = (color) => {
    if (!pendingWildCard) return;
    socket.emit("uno:play_card", {
      roomId: room.id,
      cardId: pendingWildCard.id,
      chosenColor: color,
    });
    setShowColorPicker(false);
    setPendingWildCard(null);
    playSound("reveal");
  };

  const handleDrawCard = () => {
    if (!isMyTurn) {
      showTemporaryWarning("⏳ Tunggu giliranmu untuk menarik kartu!");
      return;
    }
    if (hasDrawnThisTurn) {
      showTemporaryWarning("⚠️ Kamu sudah menarik kartu. Silakan mainkan kartu atau klik Lewati (Pass)!");
      return;
    }
    socket.emit("uno:draw_card", { roomId: room.id });
  };

  const handlePassTurn = () => {
    if (!isMyTurn) return;
    if (!hasDrawnThisTurn) {
      showTemporaryWarning("⚠️ Ambil 1 kartu dari dek terlebih dahulu!");
      return;
    }
    socket.emit("uno:pass_turn", { roomId: room.id });
  };

  const handleCallUno = () => {
    if (!room) return;
    socket.emit("uno:call_uno", { roomId: room.id });
  };

  const [stepWarning, setStepWarning] = useState(null);
  const showTemporaryWarning = (msg) => {
    setStepWarning(msg);
    setTimeout(() => setStepWarning(null), 4000);
  };

  // Sorting
  const handleSortByColor = () => {
    const sorted = [...hand].sort((a, b) => a.color.localeCompare(b.color));
    setHand(sorted);
  };

  const handleSortByValue = () => {
    const sorted = [...hand].sort((a, b) => (a.score || 0) - (b.score || 0));
    setHand(sorted);
  };

  const otherPlayers = (room?.players || []).filter((p) => p.socketId !== socket?.id && p.connected);
  const hasPlayableCardInHand = hand.some((c) => isCardPlayableClient(c, activeColor, topCard));

  return (
    <div className="flex flex-col space-y-4 animate-pop-spring w-full max-w-full overflow-hidden">
      {/* 1. TOP STATUS BAR & OTHER PLAYERS */}
      <div className="clay-card p-4 sm:p-5 shadow-md border-2 border-[#F6E6D0] bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-[#FFF0ED] rounded-2xl text-[#FF3B30] border-2 border-[#FFB2A1] shadow-2xs shrink-0">
              <Flame className="w-6 h-6" />
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

                {/* Active Color Tag */}
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-white ${COLOR_MAP[activeColor]?.bg || "bg-gray-500"} shadow-2xs`}>
                  Warna: {COLOR_MAP[activeColor]?.name || activeColor}
                </span>

                {/* Turn Direction Tag */}
                <span className="text-[10px] font-black text-[#8C8275] bg-[#FAF6EE] border border-[#E8DCCB] px-2 py-0.5 rounded-full flex items-center gap-1">
                  {turnDirection === 1 ? <RotateCw className="w-3 h-3 text-[#1C8BE0]" /> : <RotateCcw className="w-3 h-3 text-[#E64B2D]" />}
                  <span>{turnDirection === 1 ? "Searah" : "Berlawanan"}</span>
                </span>
              </div>

              <h3 className="text-xs sm:text-sm md:text-base font-black text-[#3A332C] mt-0.5 truncate">
                {isMyTurn
                  ? hasPlayableCardInHand
                    ? "👉 Pilih salah satu kartu yang bersinar di tanganmu untuk dimainkan!"
                    : !hasDrawnThisTurn
                    ? "👉 Klik Tumpukan Dek untuk mengambil 1 kartu!"
                    : "👉 Kartu tidak bisa dimainkan, klik 'Lewati Giliran' (Pass)!"
                  : `Menunggu ${activeTurnName || "pemain"} mengeluarkan kartu...`}
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
                    <span className={count === 1 ? "text-[#E64B2D] font-black animate-bounce" : ""}>
                      {count} Kartu {count === 1 && "🔥 UNO!"}
                    </span>
                    {isTurn && <span className="text-[#FFA012] font-black">• Main</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ALERTS & NOTIFICATIONS */}
      {unoAlert && (
        <div className="p-3.5 bg-gradient-to-r from-[#FF3B30] to-[#FFA012] text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg border-2 border-white animate-bounce">
          <Flame className="w-5 h-5 text-white animate-pulse" />
          <span>{unoAlert}</span>
        </div>
      )}

      {actionAlert && (
        <div className="p-3 bg-[#EFF8FF] border-2 border-[#8CD3FF] text-[#1C8BE0] text-xs font-black rounded-2xl flex items-center gap-2 shadow-xs animate-pop-spring">
          <Zap className="w-4 h-4 text-[#1C8BE0] shrink-0" />
          <span>{actionAlert}</span>
        </div>
      )}

      {stepWarning && (
        <div className="p-3 bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D] text-xs font-black rounded-2xl flex items-center justify-between shadow-sm animate-pop-spring">
          <span>{stepWarning}</span>
          <button type="button" onClick={() => setStepWarning(null)} className="text-[#8C8275] font-black ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 3. TABLE ARENA: DECK & DISCARD PILE */}
      <div className="clay-card p-5 sm:p-7 shadow-md border-2 border-[#F6E6D0] bg-gradient-to-b from-[#FAF6EE] to-[#F2EDE1] flex flex-col items-center justify-center space-y-4 rounded-3xl relative">
        <div className="flex items-center justify-center gap-6 sm:gap-14 w-full">
          {/* Tumpukan Dek (Draw Pile) */}
          <div className="flex flex-col items-center space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#8C8275] tracking-wider">
              Tumpukan Dek
            </span>
            <button
              type="button"
              onClick={handleDrawCard}
              disabled={!isMyTurn || hasDrawnThisTurn}
              className={`w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-3 bg-gradient-to-br from-[#1C1A18] via-[#2E2924] to-[#1C1A18] shadow-[0_8px_0_#0F0E0D] flex flex-col items-center justify-between p-3 text-white transition-all cursor-pointer group ${
                isMyTurn && !hasPlayableCardInHand && !hasDrawnThisTurn
                  ? "border-[#FFA012] ring-4 ring-[#FFA012]/40 hover:-translate-y-2 hover:shadow-[0_12px_0_#0F0E0D] animate-bounce active:scale-95"
                  : "border-[#4A4238] disabled:cursor-not-allowed opacity-90"
              }`}
            >
              <div className="w-full text-right text-[9px] font-black opacity-70">DEK</div>
              <div className="w-20 h-24 rounded-2xl border-2 border-[#FF3B30] bg-[#FF3B30] flex flex-col items-center justify-center shadow-md transform -rotate-6 group-hover:rotate-0 transition">
                <span className="text-xl sm:text-2xl font-black text-white italic tracking-tighter drop-shadow-md">UNO</span>
                <span className="text-[9px] font-black text-[#FFCC00] mt-0.5">{drawPileCount}</span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs ${
                isMyTurn && !hasPlayableCardInHand ? "bg-[#FFA012] text-white animate-pulse" : "bg-white/20 text-white"
              }`}>
                {isMyTurn ? "👆 AMBIL KARTU" : "TUMPUKAN"}
              </span>
            </button>
          </div>

          {/* Tumpukan Buangan (Discard Pile) */}
          <div className="flex flex-col items-center space-y-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#8C8275] tracking-wider">
              Kartu Aktif di Meja
            </span>
            {topCard ? (
              <div
                className={`w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-3 ${COLOR_MAP[topCard.color]?.bg || "bg-gray-700"} ${COLOR_MAP[topCard.color]?.border || "border-black"} ${COLOR_MAP[topCard.color]?.shadow || "shadow-md"} flex flex-col justify-between p-3 text-white relative shadow-lg ring-4 ${
                  activeColor === "red"
                    ? "ring-[#FF3B30]/50"
                    : activeColor === "yellow"
                    ? "ring-[#FFCC00]/50"
                    : activeColor === "green"
                    ? "ring-[#34C759]/50"
                    : "ring-[#007AFF]/50"
                }`}
              >
                {/* Top-left symbol */}
                <div className="text-left leading-none font-black text-sm sm:text-base drop-shadow-xs">
                  {topCard.type === "number"
                    ? topCard.value
                    : topCard.type === "skip"
                    ? "🚫"
                    : topCard.type === "reverse"
                    ? "🔄"
                    : topCard.type === "draw2"
                    ? "+2"
                    : topCard.type === "wild4"
                    ? "+4"
                    : "🌈"}
                </div>

                {/* Center Big Oval */}
                <div className="w-18 sm:w-22 h-20 sm:h-24 bg-white/20 backdrop-blur-xs rounded-full border-2 border-white/60 mx-auto flex items-center justify-center transform -rotate-12 shadow-inner">
                  <span className="text-2xl sm:text-4xl font-black drop-shadow-md text-white">
                    {topCard.type === "number"
                      ? topCard.value
                      : topCard.type === "skip"
                      ? "🚫"
                      : topCard.type === "reverse"
                      ? "🔄"
                      : topCard.type === "draw2"
                      ? "+2"
                      : topCard.type === "wild4"
                      ? "+4"
                      : "🌈"}
                  </span>
                </div>

                {/* Bottom row active color badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black bg-black/40 px-2 py-0.5 rounded-full uppercase">
                    {COLOR_MAP[activeColor]?.name || activeColor}
                  </span>
                  <div className="text-right leading-none font-black text-sm sm:text-base drop-shadow-xs">
                    {topCard.type === "number" ? topCard.value : ""}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-28 xs:w-32 sm:w-36 h-38 xs:h-42 sm:h-48 rounded-2xl border-2 border-dashed border-[#D9C4AB] bg-white/50 flex flex-col items-center justify-center text-xs font-bold text-[#8C8275] p-3 text-center">
                <span>Belum Ada Kartu</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. PLAYER IDENTITY & HAND CARDS RACK */}
      <div className={`clay-card p-4 sm:p-5 shadow-md border-2 bg-white space-y-4 transition-all w-full ${
        isMyTurn ? "border-[#FFA012] ring-2 ring-[#FFA012]/30" : "border-[#F6E6D0]"
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

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {hand.length === 1 && (
              <span className="text-[10px] font-black bg-[#FF3B30] text-white px-3 py-1 rounded-full animate-bounce shadow-xs border border-white">
                🔥 SISA 1 KARTU (UNO)!
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
              Kartu di Tangan ({hand.length} Kartu)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleSortByColor}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#3A332C] border border-[#F0DDC5] transition cursor-pointer shadow-2xs active:scale-95"
            >
              Warna 🎨
            </button>
            <button
              type="button"
              onClick={handleSortByValue}
              className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-[#FFFBF5] hover:bg-[#FFF5E8] text-[#3A332C] border border-[#F0DDC5] transition cursor-pointer shadow-2xs active:scale-95"
            >
              Angka 🔢
            </button>
          </div>
        </div>

        {/* Cards Row Display */}
        <div className="relative w-full min-h-[140px] sm:min-h-[180px] flex items-center justify-center flex-wrap gap-1.5 xs:gap-2 sm:gap-3 pt-6 pb-4 px-1">
          {hand.map((card) => {
            const playable = isMyTurn && isCardPlayableClient(card, activeColor, topCard);
            const colorCfg = COLOR_MAP[card.color] || COLOR_MAP.wild;

            return (
              <div key={card.id} className="relative select-none transition-all duration-200">
                {playable && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#24A654] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white whitespace-nowrap z-20 animate-pulse">
                    BISA MAIN ✓
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handlePlayCard(card)}
                  disabled={!isMyTurn || !playable}
                  className={`w-14 xs:w-16 sm:w-22 md:w-24 h-22 xs:h-26 sm:h-34 md:h-38 rounded-xl sm:rounded-2xl border-3 ${colorCfg.bg} ${colorCfg.border} ${colorCfg.shadow} flex flex-col justify-between p-1.5 sm:p-2.5 transition-all text-white text-left ${
                    playable
                      ? "-translate-y-3 ring-4 ring-[#FFA012] shadow-xl hover:-translate-y-5 cursor-pointer scale-105"
                      : isMyTurn
                      ? "opacity-50 grayscale-40 cursor-not-allowed"
                      : "cursor-default"
                  }`}
                >
                  {/* Top-left */}
                  <div className="text-left leading-none font-black text-xs sm:text-base drop-shadow-xs">
                    {card.type === "number"
                      ? card.value
                      : card.type === "skip"
                      ? "🚫"
                      : card.type === "reverse"
                      ? "🔄"
                      : card.type === "draw2"
                      ? "+2"
                      : card.type === "wild4"
                      ? "+4"
                      : "🌈"}
                  </div>

                  {/* Center Oval */}
                  <div className="w-9 xs:w-11 sm:w-15 h-11 xs:h-13 sm:h-18 bg-white/25 rounded-full border border-white/60 mx-auto flex items-center justify-center transform -rotate-12 shadow-inner">
                    <span className="text-sm xs:text-base sm:text-2xl font-black drop-shadow-md">
                      {card.type === "number"
                        ? card.value
                        : card.type === "skip"
                        ? "🚫"
                        : card.type === "reverse"
                        ? "🔄"
                        : card.type === "draw2"
                        ? "+2"
                        : card.type === "wild4"
                        ? "+4"
                        : "🌈"}
                    </span>
                  </div>

                  {/* Bottom-right */}
                  <div className="text-right leading-none font-black text-xs sm:text-base drop-shadow-xs">
                    {card.type === "number" ? card.value : ""}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* 5. ACTION CONTROL BAR */}
        <div className="pt-3 border-t border-[#F6E6D0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hand.length <= 2 && (
              <button
                type="button"
                onClick={handleCallUno}
                className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#FF3B30] to-[#FFA012] text-white shadow-lg border-2 border-white animate-bounce cursor-pointer active:scale-95"
              >
                🔥 TERIAK "UNO!"
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isMyTurn && hasDrawnThisTurn && (
              <button
                type="button"
                onClick={handlePassTurn}
                className="px-5 py-2.5 rounded-xl text-xs font-black btn-3d-peach text-white cursor-pointer shadow-xs active:scale-95"
              >
                Lewati Giliran (Pass) ➔
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. WILD COLOR PICKER MODAL */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-pop-spring">
          <div className="clay-card p-6 bg-white border-2 border-[#F6E6D0] rounded-3xl max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="text-base font-black text-[#3A332C]">Pilih Warna Kartu Berikutnya</h3>
            <p className="text-xs text-[#8C8275]">
              Kartu Wild berhasil dimainkan! Pilih warna baru untuk ronde ini:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectWildColor("red")}
                className="py-6 rounded-2xl bg-[#FF3B30] hover:bg-[#D7261B] text-white font-black text-sm shadow-md border-2 border-white cursor-pointer active:scale-95 transition"
              >
                🔴 MERAH
              </button>
              <button
                type="button"
                onClick={() => handleSelectWildColor("yellow")}
                className="py-6 rounded-2xl bg-[#FFCC00] hover:bg-[#D6A700] text-[#3A332C] font-black text-sm shadow-md border-2 border-white cursor-pointer active:scale-95 transition"
              >
                🟡 KUNING
              </button>
              <button
                type="button"
                onClick={() => handleSelectWildColor("green")}
                className="py-6 rounded-2xl bg-[#34C759] hover:bg-[#249B42] text-white font-black text-sm shadow-md border-2 border-white cursor-pointer active:scale-95 transition"
              >
                🟢 HIJAU
              </button>
              <button
                type="button"
                onClick={() => handleSelectWildColor("blue")}
                className="py-6 rounded-2xl bg-[#007AFF] hover:bg-[#005EC4] text-white font-black text-sm shadow-md border-2 border-white cursor-pointer active:scale-95 transition"
              >
                🔵 BIRU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
