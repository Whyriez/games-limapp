import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Avatar from "../../components/Avatar";
import TimerDisplay from "../../components/TimerDisplay";
import {
  Palette,
  Eraser,
  RotateCcw,
  Trash2,
  Send,
  Sparkles,
  Trophy,
  CheckCircle2,
  Check,
  Clock,
  HelpCircle,
  FastForward,
  Users,
  MessageSquare,
  Flame,
  AlertCircle,
  Eye,
} from "lucide-react";
import { playSound } from "../../utils/sound";

const COLORS = [
  "#3A332C", // Dark Espresso / Black
  "#50B5FF", // Sky Blue
  "#FF7F66", // Coral Red
  "#4DD97B", // Green
  "#FFA012", // Peach Orange
  "#9D5CFF", // Purple
  "#FFD15C", // Yellow
  "#8C5E3C", // Brown
  "#FFFFFF", // White
];

const BRUSH_SIZES = [3, 6, 12];

export default function DrawGuessGame({
  room,
  socket,
  identity,
  nickname,
  myRoleData,
  isHost,
  isSpectator,
  onSendDiscussionMessage,
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const chatContainerRef = useRef(null);

  const [selectedColor, setSelectedColor] = useState("#3A332C");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const [wordChoices, setWordChoices] = useState([]);
  const [drawerState, setDrawerState] = useState(null);
  const [guesserState, setGuesserState] = useState(null);
  const [turnSummary, setTurnSummary] = useState(null);
  const [correctGuessAlert, setCorrectGuessAlert] = useState(null);
  const [scores, setScores] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [warningMessage, setWarningMessage] = useState(null);

  const turnInfo = room?.drawTurnInfo || {};
  const activeDrawerSocketId = room?.currentDrawerSocketId || turnInfo?.drawerSocketId;
  const activeDrawerName =
    drawerState?.drawerName ||
    guesserState?.drawerName ||
    turnInfo?.drawerName ||
    room?.players?.find((p) => p.socketId === activeDrawerSocketId)?.name ||
    "Pelukis";

  const isCurrentDrawer = Boolean(
    (activeDrawerSocketId && activeDrawerSocketId === socket?.id) ||
    drawerState?.word
  );

  const correctGuessers = turnInfo?.correctGuessers || [];
  const hasAlreadyGuessed = correctGuessers.some(
    (g) => g.socketId === socket?.id || (identity?.playerId && g.playerId === identity.playerId)
  );
  const myGuessRecord = correctGuessers.find(
    (g) => g.socketId === socket?.id || (identity?.playerId && g.playerId === identity.playerId)
  );

  const totalGuessers =
    turnInfo?.totalGuessers ||
    room?.players?.filter((p) => p.connected && !p.isSpectator && p.socketId !== activeDrawerSocketId).length ||
    1;
  const guessedCount = correctGuessers.length;
  const turnEndsAt = room?.drawEndsAt || drawerState?.endsAt || guesserState?.endsAt || turnInfo?.drawEndsAt;

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [room?.discussionMessages?.length]);

  // Setup Socket listeners for Drawing & Guessing
  useEffect(() => {
    if (!socket) return;

    const handleWordChoices = (data) => {
      setWordChoices(data.options || []);
      setTurnSummary(null);
    };

    const handleWaitingDrawer = (data) => {
      setTurnSummary(null);
      if (data.scores) setScores(data.scores);
    };

    const handleTurnActiveDrawer = (data) => {
      setDrawerState(data);
      setGuesserState(null);
      setWordChoices([]);
      setTurnSummary(null);
      clearCanvasLocal();
    };

    const handleTurnActiveGuesser = (data) => {
      setGuesserState(data);
      setDrawerState(null);
      setWordChoices([]);
      setTurnSummary(null);
      clearCanvasLocal();
    };

    const handleStrokeReceived = (stroke) => {
      drawRemoteStroke(stroke);
    };

    const handleCanvasCleared = () => {
      clearCanvasLocal();
    };

    const handleCorrectGuess = (data) => {
      setCorrectGuessAlert(data);
      playSound("victory");
      if (data.scores) setScores(data.scores);
      setTimeout(() => setCorrectGuessAlert(null), 3500);
    };

    const handleTurnSummary = (data) => {
      setTurnSummary(data);
      if (data.scores) setScores(data.scores);
    };

    const handleWarning = (data) => {
      setWarningMessage(data.message);
      setTimeout(() => setWarningMessage(null), 3500);
    };

    socket.on("draw:word_choices", handleWordChoices);
    socket.on("draw:waiting_for_drawer", handleWaitingDrawer);
    socket.on("draw:turn_active_drawer", handleTurnActiveDrawer);
    socket.on("draw:turn_active_guesser", handleTurnActiveGuesser);
    socket.on("draw:stroke_received", handleStrokeReceived);
    socket.on("draw:canvas_cleared", handleCanvasCleared);
    socket.on("draw:correct_guess", handleCorrectGuess);
    socket.on("draw:turn_summary", handleTurnSummary);
    socket.on("draw:warning", handleWarning);

    return () => {
      socket.off("draw:word_choices", handleWordChoices);
      socket.off("draw:waiting_for_drawer", handleWaitingDrawer);
      socket.off("draw:turn_active_drawer", handleTurnActiveDrawer);
      socket.off("draw:turn_active_guesser", handleTurnActiveGuesser);
      socket.off("draw:stroke_received", handleStrokeReceived);
      socket.off("draw:canvas_cleared", handleCanvasCleared);
      socket.off("draw:correct_guess", handleCorrectGuess);
      socket.off("draw:turn_summary", handleTurnSummary);
      socket.off("draw:warning", handleWarning);
    };
  }, [socket]);

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (e) => {
    if (!isCurrentDrawer) return;
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
  };

  const handleMoveDraw = (e) => {
    if (!isCurrentDrawer || !isDrawingRef.current) return;
    if (e.cancelable) e.preventDefault();

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const color = isEraser ? "#FFFFFF" : selectedColor;
    const size = isEraser ? brushSize * 2 : brushSize;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Emit stroke
    const strokeData = {
      fromX: lastPosRef.current.x / canvas.width,
      fromY: lastPosRef.current.y / canvas.height,
      toX: coords.x / canvas.width,
      toY: coords.y / canvas.height,
      color,
      size,
    };

    socket.emit("draw:stroke", { roomId: room.id, strokeData });
    lastPosRef.current = coords;
  };

  const handleEndDraw = () => {
    isDrawingRef.current = false;
  };

  const drawRemoteStroke = (stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(stroke.fromX * canvas.width, stroke.fromY * canvas.height);
    ctx.lineTo(stroke.toX * canvas.width, stroke.toY * canvas.height);
    ctx.stroke();
  };

  const handleClearAll = () => {
    if (!isCurrentDrawer || !room) return;
    clearCanvasLocal();
    socket.emit("draw:clear", { roomId: room.id });
  };

  const handleSelectWord = (word, category) => {
    if (!room) return;
    socket.emit("draw:select_word", { roomId: room.id, word, category });
    setWordChoices([]);
  };

  const handleSkipTurn = () => {
    if (!room || !isHost) return;
    socket.emit("draw:skip_turn", { roomId: room.id });
  };

  const handleSkipSummary = () => {
    if (!room || !isHost) return;
    socket.emit("draw:skip_summary", { roomId: room.id });
  };

  const handleSendGuess = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !room) return;
    socket.emit("draw:guess", { roomId: room.id, text: chatInput.trim() });
    setChatInput("");
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. TOP HEADER: ACTIVE DRAWER BANNER, CLUE & TIMER */}
      <div className="clay-card p-4 sm:p-5 shadow-md border-2 border-[#F6E6D0] bg-white animate-pop-spring">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`p-3 rounded-2xl border-2 shrink-0 shadow-xs flex items-center justify-center ${
                isCurrentDrawer
                  ? "bg-[#EFF8FF] border-[#8CD3FF] text-[#1C8BE0]"
                  : "bg-[#FFF8EC] border-[#FFA012] text-[#D97E00]"
              }`}
            >
              <Palette className="w-6 h-6 animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-[#8C8275] bg-[#FFFBF5] px-2 py-0.5 rounded-full border border-[#F0DDC5]">
                  {isCurrentDrawer ? "🎨 Giliranmu Menggambar!" : `🎨 Pelukis: ${activeDrawerName}`}
                </span>
                <span className="text-[10px] font-black text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span>Ronde {room?.roundNumber || 1} / {room?.settings?.maxRounds || 3}</span>
                </span>
              </div>

              {isCurrentDrawer && drawerState?.word ? (
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-lg sm:text-xl font-black text-[#1C8BE0]">
                    Kata Rahasia: "{drawerState.word}"
                  </h2>
                  <span className="text-xs font-bold text-[#8C8275]">
                    ({drawerState.category || "Umum"})
                  </span>
                </div>
              ) : guesserState?.maskedWord ? (
                <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#FFA012] tracking-widest bg-[#FFF8EC] px-3 py-0.5 rounded-xl border-2 border-[#FFA012]/40 shadow-xs">
                    {guesserState.maskedWord}
                  </span>
                  <span className="text-xs font-black text-[#8C8275]">
                    ({guesserState.wordLength} Huruf • Kategori: {guesserState.category || "Umum"})
                  </span>
                </div>
              ) : (
                <span className="text-sm font-black text-[#3A332C] block mt-1">
                  {room?.status === "WORD_CHOICE_PHASE"
                    ? `${activeDrawerName} sedang memilih kata rahasia...`
                    : "Mulai menebak gambar!"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {turnEndsAt && <TimerDisplay endsAt={turnEndsAt} duration={room?.settings?.drawTimeLimit || 60} />}
            {isHost && (
              <button
                type="button"
                onClick={handleSkipTurn}
                title="Lewati giliran ini dan ganti pelukis berikutnya"
                className="btn-3d-peach text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>⚡ Lewati Giliran</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME GUESSERS PROGRESS & STATUS STRIP */}
      <div className="clay-card p-3 sm:p-4 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#3A332C] pb-2 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-1.5 text-[#1C8BE0]">
            <Users className="w-4 h-4" />
            <span>Status Tebakan Ronde Ini</span>
          </div>
          <span className="font-bold text-[#8C8275]">
            <strong className="text-[#24A654]">{guessedCount}</strong> dari <strong>{totalGuessers}</strong> pemain berhasil menebak
          </span>
        </div>

        {/* Live Player Guess Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {(room?.players || []).filter((p) => p.connected).map((p) => {
            const isDrawer = p.socketId === activeDrawerSocketId;
            const guessedInfo = correctGuessers.find(
              (g) => g.socketId === p.socketId || (p.playerId && g.playerId === p.playerId)
            );
            const isGuessed = Boolean(guessedInfo);

            return (
              <div
                key={p.socketId}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs font-black transition-all ${
                  isDrawer
                    ? "bg-[#EFF8FF] border-[#8CD3FF] text-[#1C8BE0]"
                    : isGuessed
                      ? "bg-[#EDFCF2] border-[#89EFA9] text-[#24A654] shadow-2xs"
                      : "bg-[#FFFBF5] border-[#F0DDC5] text-[#8C8275]"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar name={p.name} size="xs" />
                  <span className="truncate">{p.name}</span>
                </div>

                {isDrawer ? (
                  <span className="text-[10px] bg-[#50B5FF] text-white px-1.5 py-0.2 rounded-md font-black shrink-0">
                    Pelukis
                  </span>
                ) : isGuessed ? (
                  <span className="text-[10px] bg-[#24A654] text-white px-1.5 py-0.2 rounded-md font-black flex items-center gap-0.5 shrink-0 animate-pop-spring">
                    <Check className="w-2.5 h-2.5" />
                    <span>+{guessedInfo.points}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8C8275] font-bold shrink-0">
                    Menebak...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. GUESSER SUCCESS BANNER (Shown to players who already guessed) */}
      {hasAlreadyGuessed && !isCurrentDrawer && (
        <div className="p-4 bg-[#EDFCF2] rounded-2xl border-2 border-[#89EFA9] shadow-sm text-center space-y-1.5 animate-pop-spring">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#24A654] bg-white px-3 py-1 rounded-full shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#24A654]" />
            <span>✓ Tebakan Anda Benar! (+{myGuessRecord?.points || 100} Poin • Juara ke-{myGuessRecord?.rank || 1})</span>
          </div>
          <p className="text-xs font-bold text-[#3A332C]">
            🤫 <strong>Sssstt...</strong> Menunggu teman yang lain ({guessedCount}/{totalGuessers}). Jika semua sudah menebak, giliran langsung lanjut otomatis!
          </p>
        </div>
      )}

      {/* 4. MAIN CANVAS & TOOLBAR STAGE */}
      <div className="clay-card p-4 sm:p-5 shadow-md border-2 border-[#F6E6D0] bg-white flex flex-col space-y-3">
        {/* Canvas Element with Fixed Aspect Ratio */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-white rounded-2xl border-2 border-[#F0DDC5] overflow-hidden shadow-inner touch-none">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onMouseDown={handleStartDraw}
            onMouseMove={handleMoveDraw}
            onMouseUp={handleEndDraw}
            onMouseLeave={handleEndDraw}
            onTouchStart={handleStartDraw}
            onTouchMove={handleMoveDraw}
            onTouchEnd={handleEndDraw}
            className={`w-full h-full block ${
              isCurrentDrawer ? "cursor-crosshair" : "cursor-default pointer-events-none"
            }`}
          />

          {/* Correct Guess Shiny Alert */}
          {correctGuessAlert && (
            <div className="absolute top-3 inset-x-0 mx-auto max-w-sm p-3 rounded-2xl bg-[#EDFCF2] border-2 border-[#24A654] text-[#15803D] text-xs font-black text-center shadow-lg animate-pop-spring">
              🎉 {correctGuessAlert.playerName} berhasil menebak kata! (+{correctGuessAlert.points} Poin)
            </div>
          )}

          {/* Warning Anti-Leak Alert */}
          {warningMessage && (
            <div className="absolute top-3 inset-x-0 mx-auto max-w-md p-3 rounded-2xl bg-[#FFF0ED] border-2 border-[#E64B2D] text-[#E64B2D] text-xs font-black text-center shadow-lg animate-pop-spring">
              ⚠️ {warningMessage}
            </div>
          )}
        </div>

        {/* Drawer Toolbar (Only visible to Drawer) */}
        {isCurrentDrawer && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] animate-pop-spring">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-7 h-7 rounded-xl transition-all cursor-pointer shadow-2xs border ${
                    !isEraser && selectedColor === c
                      ? "ring-2 ring-[#50B5FF] scale-110 border-white"
                      : "border-black/10"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Brush Sizes & Tools */}
            <div className="flex items-center gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setBrushSize(size)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                    brushSize === size && !isEraser
                      ? "bg-[#50B5FF] text-white border-[#50B5FF]"
                      : "bg-white text-[#3A332C] border-[#F0DDC5]"
                  }`}
                >
                  {size === 3 ? "Tipis" : size === 6 ? "Sedang" : "Tebal"}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsEraser((prev) => !prev)}
                className={`p-2 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1 ${
                  isEraser
                    ? "bg-[#FFA012] text-white border-[#FFA012]"
                    : "bg-white text-[#3A332C] border-[#F0DDC5]"
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-xl text-xs font-black bg-white text-[#E64B2D] border border-[#FFB2A1] hover:bg-[#FFF0ED] transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bersihkan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. LIVE GUESS CHAT FEED */}
      <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
          <div className="flex items-center gap-1.5 text-[#3A332C]">
            <MessageSquare className="w-4 h-4 text-[#FFA012]" />
            <span className="text-xs font-black uppercase tracking-wider">
              Tebakan & Obrolan
            </span>
          </div>
          <span className="text-[10px] text-[#8C8275] font-bold">
            {hasAlreadyGuessed ? "✓ Anda sudah berhasil menebak" : "Ketik jawabanmu di bawah untuk menebak!"}
          </span>
        </div>

        <div
          ref={chatContainerRef}
          className="max-h-[180px] overflow-y-auto space-y-2 p-3 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]"
        >
          {room?.discussionMessages && room.discussionMessages.length > 0 ? (
            room.discussionMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-xs flex items-baseline gap-1.5 ${
                  msg.isGuessedAlready ? "text-[#24A654] font-black" : "text-[#3A332C]"
                }`}
              >
                <span className="font-black">
                  {msg.senderName}
                  {msg.isGuessedAlready && " (✓ Tebakan Benar)"}:
                </span>
                <span className="font-semibold">{msg.text}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-xs font-bold text-[#8C8275]">
              Mulai tebak gambarnya di form chat di bawah!
            </div>
          )}
        </div>

        {!isCurrentDrawer && (
          <form onSubmit={handleSendGuess} className="flex gap-2">
            <input
              type="text"
              placeholder={hasAlreadyGuessed ? "Ketik obrolan santai..." : "Ketik tebakanmu di sini..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 min-w-0 clay-input px-3 py-2 text-xs font-semibold text-[#3A332C]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="btn-3d-blue px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-40 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{hasAlreadyGuessed ? "Kirim" : "Tebak"}</span>
            </button>
          </form>
        )}
      </div>

      {/* MODAL 1: WORD CHOICE MODAL FOR DRAWER */}
      {wordChoices && wordChoices.length > 0 && isCurrentDrawer && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-full flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 max-w-md w-full m-auto bg-white space-y-4 border-2 border-[#50B5FF] shadow-2xl animate-pop-spring">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-[#EFF8FF] text-[#1C8BE0] rounded-full border border-[#8CD3FF] animate-bounce">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-[#3A332C]">
                Giliranmu Menggambar!
              </h3>
              <p className="text-xs font-semibold text-[#8C8275]">
                Pilih 1 kata rahasia yang ingin kamu gambar:
              </p>
            </div>

            <div className="space-y-2">
              {wordChoices.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectWord(opt.word, opt.category)}
                  className="w-full p-3.5 rounded-2xl border-2 border-[#F0DDC5] bg-[#FFFBF5] hover:bg-[#EFF8FF] hover:border-[#50B5FF] text-[#3A332C] font-black text-sm text-left flex items-center justify-between transition cursor-pointer active:scale-98 shadow-xs"
                >
                  <span>{opt.word}</span>
                  <span className="text-[10px] font-bold text-[#8C8275] bg-white px-2 py-0.5 rounded-md border border-[#F0DDC5]">
                    {opt.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}

      {/* MODAL 2: TURN SUMMARY MODAL */}
      {turnSummary && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-full flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 max-w-md w-full m-auto bg-white space-y-4 border-2 border-[#FFA012] text-center shadow-2xl animate-pop-spring">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] border border-[#FFA012]/40 px-2.5 py-0.5 rounded-full">
                {turnSummary.reasonMessage || "Giliran Selesai!"}
              </span>
              <h3 className="text-base font-black text-[#3A332C] pt-1">
                Kata Rahasia Adalah:
              </h3>
              <p className="text-2xl font-black text-[#1C8BE0]">
                "{turnSummary.revealedWord}"
              </p>
              <span className="text-xs font-bold text-[#8C8275]">
                Kategori: {turnSummary.category} • Dilukis oleh: {turnSummary.drawerName}
              </span>
            </div>

            {/* Current Turn Scores */}
            <div className="space-y-2 pt-2 border-t border-[#F0DDC5]">
              <span className="text-xs font-black text-[#3A332C] block">
                Papan Skor Sementara:
              </span>
              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                {turnSummary.scores?.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FFFBF5] border border-[#F0DDC5] text-xs font-bold"
                  >
                    <span>{idx + 1}. {p.name}</span>
                    <span className="text-[#FFA012] font-black">{p.score} Poin</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Skip Summary Button */}
            {isHost && (
              <button
                type="button"
                onClick={handleSkipSummary}
                className="btn-3d-peach w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 mt-2"
              >
                <FastForward className="w-4 h-4" />
                <span>Lanjut ke Giliran Berikutnya ➔</span>
              </button>
            )}
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}
    </div>
  );
}
