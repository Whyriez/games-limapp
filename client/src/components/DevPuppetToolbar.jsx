import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Zap,
  Trash2,
  Users,
  Vote,
  Radio,
} from "lucide-react";

export default function DevPuppetToolbar({
  room,
  currentSocketId,
  activePuppetSocketId,
  devPuppetData = {},
  onSelectPuppet,
  onAddBot,
  onAddBotsBatch,
  onRemoveBot,
  onRemoveAllBots,
  onQuickAction,
  currentTurnSocketId,
  isHost,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [quickClueText, setQuickClueText] = useState("");

  if (!room) return null;

  const players = room.players || [];
  const botPlayers = players.filter((p) => p.isBot);
  const isInGame = room.status && room.status !== "LOBBY" && room.status !== "GAME_OVER";
  const activePuppet = activePuppetSocketId
    ? devPuppetData[activePuppetSocketId] || players.find((p) => p.socketId === activePuppetSocketId)
    : null;

  const isCurrentPuppetTurn = activePuppetSocketId && activePuppetSocketId === currentTurnSocketId;

  // Preset fast clue chips
  const FAST_CLUES = ["Segar", "Enak", "Manis", "Hangat", "Dingin", "Sehari-hari", "Warna-warni", "Penting"];

  const handleSendQuickClue = (textToSend) => {
    const text = textToSend || quickClueText;
    if (!text.trim()) return;
    onQuickAction("clue", { text: text.trim(), asSocketId: activePuppetSocketId });
    setQuickClueText("");
  };

  const handleReadyAllBots = () => {
    onQuickAction("ready_all_bots", { botSocketIds: botPlayers.map((b) => b.socketId) });
  };

  const handleDiscussionReadyAllBots = () => {
    onQuickAction("discussion_ready_all_bots", { botSocketIds: botPlayers.map((b) => b.socketId) });
  };

  return (
    <aside
      aria-label="Development Puppet & Bot Tools"
      className="clay-card border-2 border-purple-300 bg-gradient-to-r from-[#FAF5FF] via-[#FFFFFF] to-[#FDF4FF] shadow-md p-3 sm:p-4 mb-4 transition-all duration-200 w-full max-w-full overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DEV MODE</span>
          </span>

          <span className="text-xs font-extrabold text-[#581C87] flex items-center gap-1">
            <Bot className="w-4 h-4 text-purple-600" />
            <span>Puppet Switcher (Solo Multi-Play)</span>
          </span>

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
            {botPlayers.length} Bot di Ruangan
          </span>

          {activePuppet && (
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
              🎮 Mengontrol: {activePuppet.name}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 rounded-lg text-purple-600 hover:bg-purple-100 transition cursor-pointer text-xs flex items-center gap-1 font-bold"
          title={isExpanded ? "Sembunyikan Dev Tools" : "Buka Dev Tools"}
        >
          <span>{isExpanded ? "Tutup" : "Buka"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* In LOBBY Controls */}
          {room.status === "LOBBY" && isHost && (
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Tambah Bot Cepat untuk testing:</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={onAddBot}
                  className="px-2.5 py-1 text-xs font-black bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>+ 1 Bot</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAddBotsBatch && onAddBotsBatch(3)}
                  className="px-2.5 py-1 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>+ 3 Bot Cepat</span>
                </button>

                {botPlayers.length > 0 && onRemoveAllBots && (
                  <button
                    type="button"
                    onClick={onRemoveAllBots}
                    className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Semua Bot</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Seat Switcher: Select Player / Bot to Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px] font-bold text-slate-600">
              <span>🎭 Klik tombol pemain di bawah untuk beralih kursi & mengontrol giliran mereka:</span>
              {activePuppetSocketId && (
                <button
                  type="button"
                  onClick={() => onSelectPuppet(null)}
                  className="text-purple-600 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-3 h-3" />
                  <span>Kembali ke Diri Sendiri (Host)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Host / Self Seat */}
              <button
                type="button"
                onClick={() => onSelectPuppet(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border-2 ${
                  !activePuppetSocketId
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>👤 Anda (Host)</span>
                {currentTurnSocketId === currentSocketId && (
                  <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full animate-pulse">
                    Giliran!
                  </span>
                )}
              </button>

              {/* Bot Seats */}
              {botPlayers.map((bot) => {
                const isSelected = activePuppetSocketId === bot.socketId;
                const isTurn = currentTurnSocketId === bot.socketId;
                const puppetInfo = devPuppetData[bot.socketId] || bot;

                return (
                  <button
                    key={bot.socketId}
                    type="button"
                    onClick={() => onSelectPuppet(bot.socketId)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 border-2 ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-300"
                        : "bg-white text-slate-700 border-purple-100 hover:border-purple-300"
                    } ${!bot.isAlive ? "opacity-50 line-through" : ""}`}
                  >
                    <Bot className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-purple-600"}`} />
                    <span>{bot.name}</span>

                    {/* Reveal Role/Word in Dev Mode */}
                    {puppetInfo.role && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                          isSelected
                            ? "bg-purple-800 text-purple-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {puppetInfo.role}
                        {puppetInfo.word ? `: ${puppetInfo.word}` : ""}
                      </span>
                    )}

                    {isTurn && (
                      <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                        <Radio className="w-2.5 h-2.5" />
                        <span>Giliran</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Puppet Control Actions Deck */}
          {isInGame && activePuppet && (
            <div className="p-3 bg-purple-50/90 rounded-xl border border-purple-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-purple-900">
                    Sedang memainkan: <span className="underline">{activePuppet.name}</span>
                  </span>
                  {activePuppet.role && (
                    <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                      Peran: <strong className="text-purple-700">{activePuppet.role}</strong>
                      {activePuppet.word && (
                        <span>
                          {" "}
                          | Kata: <strong className="text-purple-700">"{activePuppet.word}"</strong>
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPuppet(null)}
                  className="text-xs font-black text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Lepas Kontrol (Bermain Sebagai Diri Sendiri)
                </button>
              </div>

              {/* Contextual Fast Actions based on Room Phase */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-purple-200/60">
                {/* 1. Memorize Phase Ready Button */}
                {room.status === "MEMORIZE_PHASE" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onQuickAction("ready", { asSocketId: activePuppet.socketId })}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai {activePuppet.name} Siap</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReadyAllBots}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Tandai SEMUA Bot Siap</span>
                    </button>
                  </>
                )}

                {/* 2. Discussion Phase Ready Button */}
                {room.status === "DISCUSSION_PHASE" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onQuickAction("discussion_ready", { asSocketId: activePuppet.socketId })}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activePuppet.name}: Siap Voting</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDiscussionReadyAllBots}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Semua Bot Siap Voting</span>
                    </button>
                  </>
                )}

                {/* 3. Clue Phase Turn */}
                {room.status === "CLUE_PHASE" && isCurrentPuppetTurn && (
                  <div className="w-full space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Saat ini giliran {activePuppet.name} memberikan petunjuk!</span>
                    </div>

                    {/* Fast Clue Chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">Pilih Cepat:</span>
                      {FAST_CLUES.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleSendQuickClue(chip)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-purple-800 border border-purple-200 hover:bg-purple-100 transition cursor-pointer active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={quickClueText}
                        onChange={(e) => setQuickClueText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendQuickClue()}
                        placeholder={`Ketik petunjuk untuk ${activePuppet.name}...`}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendQuickClue()}
                        className="px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 hover:bg-purple-700 text-white transition active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Voting Phase Candidates */}
                {room.status === "VOTING_PHASE" && activePuppet.isAlive && (
                  <div className="w-full space-y-1.5">
                    <div className="text-xs font-extrabold text-purple-900 flex items-center gap-1">
                      <Vote className="w-3.5 h-3.5" />
                      <span>Pilih siapa yang divote oleh {activePuppet.name}:</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {players
                        .filter((p) => p.isAlive && p.socketId !== activePuppet.socketId)
                        .map((cand) => (
                          <button
                            key={cand.socketId}
                            type="button"
                            onClick={() =>
                              onQuickAction("vote", {
                                targetSocketId: cand.socketId,
                                asSocketId: activePuppet.socketId,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100 text-slate-800 transition active:scale-95 cursor-pointer"
                          >
                            Vote {cand.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="text-[10px] text-purple-600/80 font-medium">
            💡 <strong>Info Dev Mode:</strong> Anda dapat mengklik kursi bot mana saja untuk mengendalikan aksi mereka secara langsung dari 1 browser tab ini, tanpa perlu membuka tab baru atau window penyamaran.
          </div>
        </div>
      )}
    </aside>
  );
}
