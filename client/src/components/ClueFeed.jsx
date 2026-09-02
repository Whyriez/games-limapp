import React, { useRef, useEffect } from "react";
import Avatar from "./Avatar";
import { MessageSquare, Send, Sparkles, AlertCircle, Lightbulb } from "lucide-react";

export default function ClueFeed({
  clues = [],
  status,
  roundNumber = 1,
  isMyTurn,
  currentTurnName,
  clueInput = "",
  onClueInputChange,
  onSubmitClue,
}) {
  const clueContainerRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);

  // Reliable internal container scroll to bottom
  useEffect(() => {
    if (clueContainerRef.current) {
      clueContainerRef.current.scrollTop = clueContainerRef.current.scrollHeight;
    }
  }, [clues.length]);

  // When it's my turn, automatically focus input and smooth scroll it into center view
  useEffect(() => {
    if (isMyTurn && status === "CLUE_PHASE") {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [isMyTurn, status]);

  const handleChange = (e) => {
    onClueInputChange(e.target.value);
  };

  return (
    <div className="clay-card p-4 sm:p-7 flex flex-col justify-between shadow-sm space-y-4 sm:space-y-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-[#F6E6D0]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF] shadow-xs shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-lg font-black text-[#3A332C]">
                Aliran Petunjuk Resmi
              </h3>
              <span className="text-[10px] sm:text-[11px] bg-[#FFF8EC] text-[#D97E00] font-black px-2 sm:px-2.5 py-0.5 rounded-full border border-[#FFA012]/50 shadow-xs">
                Ronde {roundNumber || 1}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8C8275] font-medium hidden sm:block">
              Petunjuk resmi tiap putaran yang diberikan bergiliran oleh masing-masing pemain.
            </p>
          </div>
        </div>
        <span className="text-[11px] sm:text-xs bg-[#EFF8FF] text-[#1C8BE0] font-black px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#8CD3FF] shrink-0">
          {clues.length} Kata
        </span>
      </div>

      {/* Clues Stream Timeline with Reliable Fixed Scroll Container */}
      <div
        ref={clueContainerRef}
        className="overflow-y-auto overflow-x-hidden space-y-2.5 sm:space-y-3 py-1 sm:py-2 pr-1 h-[190px] sm:h-[260px] md:h-[320px] max-h-[360px] min-h-[140px] border border-transparent rounded-2xl"
      >
        {clues.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 text-[#8C8275] space-y-1.5 sm:space-y-2">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#D97E00] animate-pulse" />
            <span className="font-bold text-xs sm:text-base text-[#3A332C]">
              Belum ada petunjuk yang diberikan
            </span>
            <p className="text-[11px] sm:text-xs text-[#8C8275] max-w-sm">
              {status === "MEMORIZE_PHASE"
                ? "Pemain sedang menghafal kata rahasia masing-masing..."
                : "Saat giliran dimulai, pemain akan mendeskripsikan katamu secara bergantian."}
            </p>
          </div>
        ) : (
          clues.map((clue, idx) => (
            <div
              key={idx}
              className="bg-[#FFFBF5] border border-[#F0DDC5] p-3 sm:p-4 rounded-2xl text-xs sm:text-sm space-y-1 sm:space-y-1.5 shadow-xs hover:border-[#D9C4AB] transition-colors animate-pop-spring"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Avatar name={clue.senderName} size="xs" />
                  <span className="font-black text-xs sm:text-sm text-[#3A332C] truncate">
                    {clue.senderName}
                  </span>
                  {clue.roundNumber && (
                    <span className="text-[9px] sm:text-[10px] bg-[#FFF5E8] text-[#D97E00] px-2 py-0.2 rounded-full border border-[#F0DDC5] font-extrabold shrink-0">
                      Ronde {clue.roundNumber}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] sm:text-xs text-[#8C8275] bg-white px-2 sm:px-2.5 py-0.5 rounded-full border border-[#F0DDC5] shrink-0">
                  {clue.timestamp}
                </span>
              </div>
              <p className="text-[#1C8BE0] font-black text-sm sm:text-base pl-8 sm:pl-9 tracking-wide">
                "{clue.text}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* Turn Submission Form Bar */}
      {status === "CLUE_PHASE" && (
        <form
          ref={formRef}
          onSubmit={onSubmitClue}
          className="pt-3 sm:pt-4 border-t-2 border-[#F6E6D0] space-y-2 sm:space-y-2.5 shrink-0 animate-pop-spring"
        >
          {isMyTurn ? (
            <div className="space-y-2.5 sm:space-y-3">
              {/* Highlighted Banner Callout */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#D97E00] bg-[#FFF8EC] p-3 sm:p-3.5 rounded-2xl border-2 border-[#FFA012] shadow-sm animate-bounce">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFA012] shrink-0" />
                <span>⚡ GILIRAN ANDA SEKARANG! Ketik 1 kalimat petunjuk lalu klik Kirim:</span>
              </div>

              {/* Glowing Input Box */}
              <div className="flex gap-2 sm:gap-2.5">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ketik kalimat petunjukmu..."
                  value={clueInput}
                  onChange={handleChange}
                  autoFocus
                  className="flex-1 min-w-0 clay-input ring-4 ring-[#FFA012]/40 border-2 border-[#FFA012] px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-base text-[#3A332C] placeholder:text-[#8C8275] font-black shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!clueInput.trim()}
                  className="btn-3d-blue disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-base font-black px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>
              </div>

              {/* Helpful Strategy Tip */}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#8C8275] bg-[#FFFBF5] px-3 py-1.5 rounded-xl border border-[#F0DDC5]">
                <Lightbulb className="w-3.5 h-3.5 text-[#FFA012] shrink-0" />
                <span>💡 Berikan petunjuk yang cukup jelas bagi teman tapi ambigu bagi lawan.</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 sm:py-4 bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5] text-xs sm:text-sm font-extrabold text-[#8C8275] flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#50B5FF] animate-ping" />
              <span>Menunggu giliran: <strong className="text-[#3A332C]">{currentTurnName || "Pemain lain"}</strong>...</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
