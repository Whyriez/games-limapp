import React, { useRef, useEffect } from "react";
import TimerDisplay from "./TimerDisplay";
import Avatar from "./Avatar";
import { Sparkles, Send, Target } from "lucide-react";

export default function MrWhiteGuessModal({
  mrWhiteData,
  isMrWhite,
  guessInput,
  onGuessInputChange,
  onSubmitGuess,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (isMrWhite && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMrWhite]);

  if (!mrWhiteData) return null;

  return (
    <div
      ref={containerRef}
      className="clay-card p-5 sm:p-6 border-2 border-[#C9A0FF] shadow-lg animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-[#F6E6D0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#F7F1FF] border-2 border-[#C9A0FF] text-[#7B33ED] shadow-xs shrink-0 animate-bounce">
            <Sparkles className="w-5 h-5 text-[#7B33ED]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#3A332C]">
              Peluang Terakhir Mr. White! 🎩
            </h3>
            <p className="text-xs text-[#8C8275] font-semibold mt-0.5">
              {isMrWhite
                ? "Tebak kata rahasia milik Civilian dengan tepat untuk mencuri kemenangan instan!"
                : `${mrWhiteData.mrWhiteName} adalah Mr. White dan sedang mencoba menebak kata Civilian!`}
            </p>
          </div>
        </div>

        {mrWhiteData.endsAt && (
          <div className="self-end sm:self-auto shrink-0">
            <TimerDisplay endsAt={mrWhiteData.endsAt} duration={30} />
          </div>
        )}
      </div>

      <div className="mt-4">
        {isMrWhite ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#7B33ED] bg-[#F7F1FF] p-3 rounded-2xl border border-[#C9A0FF]">
              <Target className="w-4 h-4 text-[#7B33ED] shrink-0" />
              <span>👉 Ketik tebakan kata Civilian di bawah ini lalu klik 'Kirim Tebakan':</span>
            </div>

            <form onSubmit={onSubmitGuess} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Ketik tebakan kata Civilian..."
                value={guessInput}
                onChange={(e) => onGuessInputChange(e.target.value)}
                className="flex-1 clay-input ring-4 ring-[#C9A0FF]/50 border-2 border-[#7B33ED] px-4 py-3.5 text-sm sm:text-base text-[#3A332C] placeholder:text-[#8C8275] font-black shadow-inner"
              />
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="btn-3d-purple disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
              >
                <span>Kirim Tebakan</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4 text-xs font-bold text-[#3A332C] bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5]">
            <Avatar name={mrWhiteData.mrWhiteName} size="xs" />
            <span>
              Menunggu <strong className="text-[#7B33ED]">{mrWhiteData.mrWhiteName}</strong> memasukkan tebakan kata...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
