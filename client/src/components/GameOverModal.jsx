import React, { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import ConfettiEffect from "./ConfettiEffect";
import {
  Trophy,
  RefreshCw,
  MessageSquare,
  Send,
  Radio,
  Shield,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Eye,
  Ghost,
  Settings2,
  Flame,
  Palette,
  Layers,
} from "lucide-react";

export default function GameOverModal({
  gameOverData,
  messages = [],
  isHost,
  currentPlayerId,
  currentNickname,
  onRematch,
  onReturnToLobby,
  onSendMessage,
}) {
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  // Reliable internal container scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (!gameOverData) return null;

  const {
    winnerRole,
    winnerSide,
    winnerName,
    summaryMessage,
    wordPair,
    secretLocation,
    players = [],
    gameType,
  } = gameOverData;

  const roleStyles = {
    UNO_WINNER: {
      border: "border-[#FF3B30]",
      badge: "bg-[#FFF0ED] text-[#FF3B30] border-[#FFB2A1]",
      title: `${winnerName || "Pemain"} Menang UNO! 🌈`,
      iconBg: "bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#FF3B30]",
      icon: <Flame className="w-4 h-4" />,
    },
    REMI_WINNER: {
      border: "border-[#FFA012]",
      badge: "bg-[#FFF8EC] text-[#FFA012] border-[#F0DDC5]",
      title: `${winnerName || "Pemain"} Menang Remi! 🃏`,
      iconBg: "bg-[#FFF8EC] border-2 border-[#F0DDC5] text-[#FFA012]",
      icon: <Trophy className="w-4 h-4" />,
    },
    DRAWGUESS_WINNER: {
      border: "border-[#24A654]",
      badge: "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]",
      title: `${winnerName || "Pemain"} Juara Tebak Gambar! 🎨`,
      iconBg: "bg-[#EDFCF2] border-2 border-[#89EFA9] text-[#24A654]",
      icon: <Trophy className="w-4 h-4" />,
    },
    CIVILIAN: {
      border: "border-[#8CD3FF]",
      badge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      title: "Civilian Menang! 🎉",
      iconBg: "bg-[#EFF8FF] border-2 border-[#8CD3FF] text-[#1C8BE0]",
      icon: <Shield className="w-4 h-4" />,
    },
    CITIZEN: {
      border: "border-[#8CD3FF]",
      badge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      title: "Warga Lokasi Menang! 🎉",
      iconBg: "bg-[#EFF8FF] border-2 border-[#8CD3FF] text-[#1C8BE0]",
      icon: <Shield className="w-4 h-4" />,
    },
    UNDERCOVER: {
      border: "border-[#FFB2A1]",
      badge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      title: "Undercover Menang! 😈",
      iconBg: "bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D]",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    SPY: {
      border: "border-[#FFB2A1]",
      badge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      title: "Agen Rahasia (Spy) Menang! 🕵️",
      iconBg: "bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D]",
      icon: <Eye className="w-4 h-4" />,
    },
    MR_WHITE: {
      border: "border-[#C9A0FF]",
      badge: "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]",
      title: "Mr. White Menang! 🎩",
      iconBg: "bg-[#F7F1FF] border-2 border-[#C9A0FF] text-[#7B33ED]",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    WEREWOLF: {
      border: "border-[#FFB2A1]",
      badge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      title: "Werewolf Menang! 🐺",
      iconBg: "bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D]",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    VILLAGER: {
      border: "border-[#8CD3FF]",
      badge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      title: "Warga Desa Menang! ☀️",
      iconBg: "bg-[#EFF8FF] border-2 border-[#8CD3FF] text-[#1C8BE0]",
      icon: <Shield className="w-4 h-4" />,
    },
  };

  const keyRole = winnerRole || winnerSide;
  const style = roleStyles[keyRole] || roleStyles.CIVILIAN;

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !onSendMessage) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleQuickChip = (text) => {
    if (onSendMessage) onSendMessage(text);
  };

  return (
    <>
      {/* Pastel Confetti Shower on Victory */}
      <ConfettiEffect durationMs={6000} />

      <div className={`clay-card p-6 sm:p-8 border-3 ${style.border} shadow-xl animate-pop-spring relative overflow-hidden space-y-6 bg-white w-full`}>
        {/* Top Header: Victory Banner & Secret / Word Reveal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b-2 border-[#F6E6D0]">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl ${style.iconBg} shadow-sm shrink-0 animate-bounce`}>
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#3A332C] tracking-tight">
                  {style.title}
                </h2>
                <span className={`text-xs font-black px-3 py-1 rounded-full border-2 uppercase tracking-wide hidden sm:inline-block ${style.badge}`}>
                  Match Over
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8C8275] font-semibold mt-1 max-w-xl leading-relaxed">
                {summaryMessage}
              </p>
            </div>
          </div>

          {/* Word Pair Comparison Card (Undercover only) */}
          {wordPair && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#FFFBF5] px-4 py-3 rounded-2xl border-2 border-[#F0DDC5] text-xs font-mono shrink-0 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-[#8C8275] font-bold">Civilian:</span>
                <span className="text-[#1C8BE0] font-extrabold text-sm bg-white px-3 py-1 rounded-xl border border-[#8CD3FF] shadow-xs">
                  {wordPair.civilian}
                </span>
              </div>
              <span className="text-[#D97E00] hidden sm:inline font-bold">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-[#8C8275] font-bold">Undercover:</span>
                <span className="text-[#E64B2D] font-extrabold text-sm bg-white px-3 py-1 rounded-xl border border-[#FFB2A1] shadow-xs">
                  {wordPair.undercover}
                </span>
              </div>
            </div>
          )}

          {/* Secret Location Card (Spyfall only) */}
          {secretLocation && (
            <div className="flex items-center gap-3 bg-[#FFF8EC] px-4 py-3 rounded-2xl border-2 border-[#FFA012] text-xs shrink-0 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-[#D97E00]">
                  Lokasi Rahasia Sebenarnya:
                </span>
                <span className="text-base font-black text-[#3A332C]">
                  {secretLocation.name || secretLocation}
                </span>
                {secretLocation.category && (
                  <span className="text-[10px] font-bold text-[#8C8275]">
                    Kategori: {secretLocation.category}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main 2-Column Section: Left = Full Player Identities, Right = Post-Match Public Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Columns: Player Identity Breakdown */}
          <div className="lg:col-span-6 bg-[#FFFBF5] border-2 border-[#F0DDC5] rounded-3xl p-5 flex flex-col space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-[#F0DDC5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFA012]" />
                <h3 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
                  {gameType === "uno" || gameType === "remi" ? "Hasil Kartu Seluruh Pemain" : "Identitas Seluruh Pemain"}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#8C8275] bg-white px-2.5 py-0.5 rounded-full border border-[#F0DDC5]">
                {players.length} Pemain
              </span>
            </div>

            {/* Players Grid with Scrollable Container (Aligned to top) */}
            <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1.5 py-1">
              {players.map((p, idx) => {
                const isMe = Boolean(
                  (currentPlayerId && p.playerId && p.playerId === currentPlayerId) ||
                  (currentNickname && p.name && p.name.trim().toLowerCase() === currentNickname.trim().toLowerCase())
                );
                const roleKey = p.isSpy ? "SPY" : p.role || "CIVILIAN";
                const roleTag = roleStyles[roleKey] || (p.isWinner ? roleStyles.UNO_WINNER : roleStyles.CIVILIAN);

                let statusSubtitle = p.isAlive !== false ? "Bertahan Hidup" : "Tereliminasi";
                if (gameType === "uno") {
                  statusSubtitle = p.isWinner
                    ? "🏆 Menang (Kartu Habis!)"
                    : `Sisa ${p.remainingCardsCount !== undefined ? p.remainingCardsCount : (p.hand || []).length} Kartu`;
                } else if (gameType === "remi") {
                  statusSubtitle = p.isWinner
                    ? "🏆 Menang (Tutup Remi!)"
                    : `Kartu Mati: ${p.deadwoodScore !== undefined ? p.deadwoodScore : 0} Poin`;
                }

                return (
                  <div
                    key={p.playerId || idx}
                    className={`border-2 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-[#D9C4AB] transition-colors ${
                      isMe ? "bg-[#F0F8FF] border-[#50B5FF] ring-1 ring-[#50B5FF]/30" : "bg-white border-[#F0DDC5]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={p.name} size="sm" isAlive={p.isAlive !== false} />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-extrabold text-sm text-[#3A332C] truncate block">
                            {p.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-black text-white bg-gradient-to-r from-[#50B5FF] to-[#1C8BE0] px-2.5 py-0.5 rounded-full shadow-xs tracking-wide shrink-0">
                              👤 Anda
                            </span>
                          )}
                          {p.isWinner && (
                            <span className="text-[10px] font-black text-[#D97E00] bg-[#FFF8EC] border border-[#FFA012]/40 px-2 py-0.2 rounded-md shrink-0">
                              🏆 Juara
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8C8275] font-semibold">
                          {statusSubtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border-2 uppercase ${roleTag.badge}`}>
                        {roleTag.icon}
                        <span>
                          {gameType === "uno" || gameType === "remi"
                            ? p.isWinner ? "JUARA" : "PEMAIN"
                            : p.isSpy ? "SPY" : p.role || "Pemain"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 6 Columns: Post-Match Public Chat Feed */}
          <div className="lg:col-span-6 bg-[#FFFBF5] border-2 border-[#F0DDC5] rounded-3xl p-5 flex flex-col space-y-3.5 shadow-inner overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-[#F0DDC5]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#1C8BE0]" />
                <h3 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
                  Obrolan Pasca-Match
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#8C8275] bg-white px-2.5 py-0.5 rounded-full border border-[#F0DDC5]">
                Bincang Bebas
              </span>
            </div>

            {/* Scrollable Chat Stream Container */}
            <div
              ref={chatContainerRef}
              className="overflow-y-auto overflow-x-hidden space-y-2.5 py-2 pr-1.5 h-[220px] sm:h-[260px] max-h-[280px] border border-transparent rounded-2xl"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8C8275] text-xs">
                  <MessageSquare className="w-8 h-8 text-[#D9C4AB] mb-1.5" />
                  <p className="font-bold text-[#3A332C]">Belum ada obrolan pasca-match.</p>
                  <p className="text-[11px] text-[#8C8275] mt-0.5">
                    Tanya rekanmu: lanjut ronde baru lagi gak nih?
                  </p>
                </div>
              ) : (
                  messages.map((msg, idx) => {
                    const isMsgSpectator = !!msg.isSpectator;
                    const isMsgEliminated = !msg.isSpectator && !msg.isAlive;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-xs space-y-1 shadow-xs animate-pop-spring border ${
                          isMsgSpectator
                            ? "bg-[#FFFBF5] border-[#FFA012]/40"
                            : isMsgEliminated
                              ? "bg-[#FFF8F7] border-[#FFB2A1]/60"
                              : "bg-white border-[#F0DDC5]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <Avatar name={msg.senderName} size="xs" isAlive={isMsgSpectator ? true : msg.isAlive} />
                            <span className="font-extrabold text-sm text-[#3A332C] truncate">
                              {msg.senderName}
                            </span>
                            {isMsgSpectator && (
                              <span className="text-[10px] text-[#D97E00] bg-[#FFF8EC] border border-[#FFA012] px-2 py-0.5 rounded-full font-black flex items-center gap-1 shrink-0">
                                <Eye className="w-3 h-3" />
                                <span>Penonton</span>
                              </span>
                            )}
                            {isMsgEliminated && (
                              <span className="text-[10px] text-[#E64B2D] bg-[#FFF0ED] border border-[#FFB2A1] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                                <Ghost className="w-3 h-3" />
                                <span>Gugur</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#8C8275] bg-[#FFFBF5] px-2 py-0.5 rounded-full border border-[#F0DDC5] shrink-0">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="text-[#3A332C] font-semibold text-sm pl-8">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 py-1 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => handleQuickChip("Lanjut 1 ronde lagi! 🔥")}
                className="text-xs bg-[#FFF5E8] hover:bg-[#FFEACD] border border-[#F6E6D0] text-[#3A332C] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
              >
                Lanjut lagi! 🔥
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip("GG WP semuanya! 👏")}
                className="text-xs bg-[#EFF8FF] hover:bg-[#DDF0FF] border border-[#8CD3FF] text-[#1C8BE0] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
              >
                GG WP! 👏
              </button>
              <button
                type="button"
                onClick={() => handleQuickChip("Tadi seru banget 😂")}
                className="text-xs bg-[#FFF0ED] hover:bg-[#FFE0D9] border border-[#FFB2A1] text-[#E64B2D] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
              >
                Seru banget 😂
              </button>
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} className="pt-2 border-t-2 border-[#F0DDC5] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ketik obrolan pasca-game..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 clay-input px-4 py-3 text-xs sm:text-sm text-[#3A332C] placeholder:text-[#8C8275] font-semibold"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn-3d-blue disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-2xl transition flex items-center justify-center cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Host Rematch & Return to Lobby Control Footer */}
        <div className="pt-4 border-t-2 border-[#F6E6D0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#8C8275]">
            <Radio className="w-4 h-4 text-[#1C8BE0] animate-pulse shrink-0" />
            <span>
              {isHost
                ? "Sebagai Host, Anda dapat kembali ke Lobby untuk mengatur jumlah peran atau langsung mulai match baru."
                : "Menunggu Host kembali ke Lobby atau memulai match baru..."}
            </span>
          </div>

          {isHost ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onReturnToLobby}
                className="w-full sm:w-auto btn-3d-peach ring-4 ring-[#FFA012]/30 text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Settings2 className="w-4 h-4" />
                <span>Kembali ke Lobby (Atur Peran)</span>
              </button>

              <button
                type="button"
                onClick={onRematch}
                className="w-full sm:w-auto btn-3d-green text-xs sm:text-sm font-black px-7 py-3.5 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Mulai Game Baru</span>
              </button>
            </div>
          ) : (
            <div className="text-center text-xs font-bold text-[#8C8275] py-2 px-4 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]">
              ⏳ Menunggu aksi Host...
            </div>
          )}
        </div>
      </div>
    </>
  );
}
