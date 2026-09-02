import React, { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import TimerDisplay from "./TimerDisplay";
import { MessageSquare, Send, SkipForward, HelpCircle, Flame, CheckCircle2, Check, Clock, Eye, Ghost } from "lucide-react";

export default function DiscussionBox({
  clues = [],
  messages = [],
  isHost,
  isAlive,
  isSpectator = false,
  endsAt,
  isReady = false,
  readyCount = 0,
  totalAlive = 0,
  readySocketIds = [],
  onToggleReady,
  onSendMessage,
  onSkipToVoting,
}) {
  const [inputText, setInputText] = useState("");
  const chatContainerRef = useRef(null);

  // Reliable internal container scroll to bottom (without scrolling the window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleQuickTag = (tag) => {
    onSendMessage(tag);
  };

  const readyPercentage = totalAlive > 0 ? Math.min(100, Math.round((readyCount / totalAlive) * 100)) : 0;
  const isPlayingActive = isAlive && !isSpectator;

  return (
    <div className="clay-card p-4 sm:p-7 flex flex-col justify-between shadow-sm animate-pop-spring space-y-3.5 sm:space-y-4 overflow-hidden">
      {/* Header with Phase Title, Timer & Host Skip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-3.5 border-b-2 border-[#F6E6D0]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-2xl bg-[#FFF0ED] border-2 border-[#FFB2A1] text-[#E64B2D] shadow-xs shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#E64B2D] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-lg font-black text-[#3A332C]">
                Fase Diskusi Bebas
              </h3>
              <span className="text-[10px] sm:text-xs bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1] px-2 sm:px-2.5 py-0.5 rounded-full font-black">
                2 Menit Terbuka
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8C8275] font-semibold mt-0.5">
              Bahas petunjuk rekanmu atau klik <strong>"Sudah Fix"</strong> bila siap voting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {endsAt && <TimerDisplay endsAt={endsAt} duration={120} />}
          {isHost && (
            <button
              onClick={onSkipToVoting}
              title="Lewati sisa waktu dan langsung buka voting"
              className="btn-3d-peach text-xs sm:text-sm font-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Buka Voting</span>
            </button>
          )}
        </div>
      </div>

      {/* Discussion Ready / Fix Status Bar (Only for in-game active players) */}
      {isPlayingActive && (
        <div className="p-3 sm:p-4 bg-[#FFF8EC] rounded-2xl border-2 border-[#FFA012]/50 shadow-xs space-y-2 sm:space-y-2.5 animate-pop-spring">
          {/* Helpful Guidance Callout */}
          {!isReady && (
            <div className="text-[10px] sm:text-[11px] font-bold text-[#D97E00] bg-white/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#FFA012]/40 flex items-center gap-1.5">
              <span>👉 Klik <strong>'Saya Sudah Fix'</strong> bila siap menuju voting!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFA012]" />
                <span className="text-xs sm:text-sm font-black text-[#3A332C]">
                  Status Kesiapan Voting ({readyCount}/{totalAlive} Pemain Fix)
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#8C8275] font-semibold">
                {readyCount === totalAlive
                  ? "Semua pemain telah fix! Menuju fase voting..."
                  : "Jika semua pemain fix, voting langsung dimulai."}
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleReady}
              className={`w-full sm:w-auto text-xs sm:text-sm font-black px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                isReady
                  ? "bg-[#EDFCF2] text-[#24A654] border-2 border-[#89EFA9] hover:bg-[#DDF9E6]"
                  : "btn-3d-green ring-4 ring-[#24A654]/40 animate-pulse text-white"
              }`}
            >
              {isReady ? (
                <>
                  <Check className="w-4 h-4 text-[#24A654]" />
                  <span>✓ Anda Sudah Fix ({readyCount}/{totalAlive})</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Saya Sudah Fix / Siap Voting ({readyCount}/{totalAlive})</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Indicator Bar */}
          <div className="w-full bg-[#F0DDC5] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FFA012] to-[#24A654] h-full transition-all duration-300 rounded-full"
              style={{ width: `${readyPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Clues Quick Reference Box */}
      {clues.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-[#FFFBF5] border-2 border-[#F0DDC5] rounded-2xl shadow-inner space-y-2 shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#3A332C]">
            <HelpCircle className="w-4 h-4 text-[#FFA012]" />
            <span>Petunjuk Terkumpul (Semua Ronde):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-28 overflow-y-auto pr-1">
            {clues.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#F0DDC5] text-xs hover:border-[#D9C4AB] transition-colors shadow-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Avatar name={c.senderName} size="xs" />
                  <span className="font-extrabold text-[#3A332C] truncate">
                    {c.senderName}
                  </span>
                  {c.roundNumber && (
                    <span className="text-[9px] bg-[#FFF5E8] text-[#D97E00] px-1.5 py-0.2 rounded-full border border-[#F0DDC5] font-bold shrink-0">
                      R{c.roundNumber}
                    </span>
                  )}
                </div>
                <span className="text-[#1C8BE0] font-bold italic truncate ml-2">
                  "{c.text}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strictly Scrollable Discussion Chat Container with Fixed Height Boundaries */}
      <div
        ref={chatContainerRef}
        className="overflow-y-auto overflow-x-hidden space-y-2 py-1 pr-1 h-[170px] sm:h-[220px] md:h-[270px] max-h-[290px] min-h-[130px] border border-transparent rounded-2xl"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8C8275] text-xs sm:text-sm">
            <MessageSquare className="w-9 h-9 text-[#D9C4AB] mb-1.5" />
            <p className="font-bold text-[#3A332C] text-sm sm:text-base">Mulai diskusi bebas!</p>
            <p className="text-xs text-[#A69989] mt-0.5">Ketik pendapatmu atau gunakan chip reaksi cepat di bawah.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMsgSenderReady = readySocketIds.includes(msg.senderSocketId);
            const isMsgSpectator = !!msg.isSpectator;
            const isMsgEliminated = !msg.isSpectator && !msg.isAlive;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs sm:text-sm space-y-1 transition-colors shadow-xs animate-pop-spring border ${
                  isMsgSpectator
                    ? "bg-[#FFFBF5] border-[#FFA012]/40"
                    : isMsgEliminated
                      ? "bg-[#FFF8F7] border-[#FFB2A1]/60"
                      : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#D9C4AB]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Avatar name={msg.senderName} size="xs" isAlive={isMsgSpectator ? true : msg.isAlive} />
                    <span className="font-black text-xs sm:text-sm text-[#3A332C] truncate">
                      {msg.senderName}
                    </span>

                    {/* Spectator Indicator Badge */}
                    {isMsgSpectator && (
                      <span className="text-[10px] text-[#D97E00] bg-[#FFF8EC] border border-[#FFA012] px-2 py-0.5 rounded-full font-black flex items-center gap-1 shrink-0">
                        <Eye className="w-3 h-3" />
                        <span>Penonton</span>
                      </span>
                    )}

                    {/* Eliminated Player Badge */}
                    {isMsgEliminated && (
                      <span className="text-[10px] text-[#E64B2D] bg-[#FFF0ED] border border-[#FFB2A1] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                        <Ghost className="w-3 h-3" />
                        <span>Gugur</span>
                      </span>
                    )}

                    {/* Ready/Fix Badge for Active Players */}
                    {!isMsgSpectator && isMsgSenderReady && (
                      <span className="text-[10px] text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2 py-0.2 rounded-full font-extrabold flex items-center gap-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5" />
                        <span>Fix</span>
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] sm:text-[11px] text-[#8C8275] bg-white px-2 py-0.5 rounded-full border border-[#F0DDC5] shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-[#3A332C] font-semibold text-xs sm:text-sm pl-8">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Reaction Suggestion Chips */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 shrink-0">
        {isPlayingActive ? (
          <>
            <button
              type="button"
              onClick={() => handleQuickTag("Petunjukmu terlalu ambigu 🧐")}
              className="text-xs sm:text-sm bg-[#FFF5E8] hover:bg-[#FFEACD] border border-[#F6E6D0] text-[#3A332C] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Petunjukmu ambigu 🧐
            </button>
            <button
              type="button"
              onClick={() => handleQuickTag("Aku Civilian asli! 🛡️")}
              className="text-xs sm:text-sm bg-[#EFF8FF] hover:bg-[#DDF0FF] border border-[#8CD3FF] text-[#1C8BE0] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Aku Civilian asli! 🛡️
            </button>
            <button
              type="button"
              onClick={() => handleQuickTag("Kenapa cocok-cocokin kata? 👀")}
              className="text-xs sm:text-sm bg-[#FFF0ED] hover:bg-[#FFE0D9] border border-[#FFB2A1] text-[#E64B2D] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Cocok-cocokin kata? 👀
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleQuickTag("Seru banget nih! 🍿")}
              className="text-xs sm:text-sm bg-[#FFF8EC] hover:bg-[#FFE8CC] border border-[#FFA012] text-[#D97E00] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Seru banget! 🍿
            </button>
            <button
              type="button"
              onClick={() => handleQuickTag("Kira-kira siapa Undercover-nya ya? 🧐")}
              className="text-xs sm:text-sm bg-[#EFF8FF] hover:bg-[#DDF0FF] border border-[#8CD3FF] text-[#1C8BE0] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Siapa Undercover-nya? 🧐
            </button>
            <button
              type="button"
              onClick={() => handleQuickTag("Nonton dulu ah 👀")}
              className="text-xs sm:text-sm bg-[#FFF5E8] hover:bg-[#FFEACD] border border-[#F6E6D0] text-[#3A332C] px-3.5 py-1.5 rounded-full shrink-0 transition cursor-pointer font-bold shadow-xs active:scale-95"
            >
              Nonton dulu ah 👀
            </button>
          </>
        )}
      </div>

      {/* Chat Input Bar - Open for ALL users (active players, spectators, and eliminated players) */}
      <form onSubmit={handleSend} className="pt-2 border-t-2 border-[#F6E6D0] flex gap-2 shrink-0">
        <input
          type="text"
          placeholder={
            isSpectator
              ? "Ketik pesan / obrolan (Mode Penonton 👁️)..."
              : !isAlive
                ? "Ketik pesan / obrolan (Status Gugur 👻)..."
                : "Ketik pendapat/kecurigaanmu dalam diskusi bebas..."
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 clay-input px-3.5 sm:px-4 py-3 text-xs sm:text-sm text-[#3A332C] placeholder:text-[#8C8275] font-semibold"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-3d-blue disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-2xl transition flex items-center justify-center cursor-pointer shadow-md shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
