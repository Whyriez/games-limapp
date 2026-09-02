import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, Lock, CheckCircle2, Sparkles, Shield, HelpCircle, ArrowDown } from "lucide-react";
import { playSound } from "../utils/sound";

export default function SecretCard({
  roleData,
  isMemorizePhase = false,
  isReady = false,
  readyCount = 0,
  totalPlayers = 0,
  onMarkReady,
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const readySectionRef = useRef(null);

  // Auto-scroll into view when entering memorize phase so button is never hidden off-screen
  useEffect(() => {
    if (isMemorizePhase && !isReady && readySectionRef.current) {
      readySectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isMemorizePhase, isReady]);

  if (!roleData) return null;

  const { role, word, category } = roleData;
  const isMrWhite = role === "MR_WHITE";

  // Authentic Blind Undercover Mechanic:
  // Civilian and Undercover share identical neutral styling & label ("Pemain Rahasia")
  // so neither knows whether their word is the majority (Civilian) or minority (Undercover).
  // Mr. White is 100% Blind (no secret word & category is completely hidden/dirahasiakan).
  const cardConfig = isMrWhite
    ? {
        border: "border-[#C9A0FF]",
        badgeBg: "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]",
        iconColor: "text-[#7B33ED]",
        label: "Mr. White (Agen Buta)",
        textColor: "text-[#7B33ED]",
        categoryDisplay: "??? (Dirahasiakan)",
        hint: "Kamu tidak memiliki kata dan kategori dirahasiakan (100% Blind)! Dengarkan petunjuk rekanmu, berbaurlah, dan tebak kata Civilian saat voting.",
        icon: <HelpCircle className="w-5 h-5" />,
      }
    : {
        border: "border-[#8CD3FF]",
        badgeBg: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
        iconColor: "text-[#1C8BE0]",
        label: "Pemain Rahasia",
        textColor: "text-[#1C8BE0]",
        categoryDisplay: category || "Umum",
        hint: "Berikan petunjuk tentang katamu. Dengarkan petunjuk rekan lain untuk mencari tahu apakah katamu sama (Civilian) atau berbeda (Undercover)!",
        icon: <Shield className="w-5 h-5" />,
      };

  const isVisible = isRevealed || isHeld;

  const handleStartHold = () => {
    if (!isVisible) playSound("reveal");
    setIsHeld(true);
  };

  const handleEndHold = () => {
    setIsHeld(false);
  };

  const handleToggleClick = () => {
    const nextState = !isRevealed;
    if (nextState) playSound("reveal");
    setIsRevealed(nextState);
  };

  const handleReadyClick = () => {
    playSound("vote");
    if (onMarkReady) onMarkReady();
  };

  return (
    <div className={`clay-card p-4 sm:p-6 transition-all duration-200 relative overflow-hidden border-2 ${cardConfig.border} mb-3 sm:mb-4 shadow-sm`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Role Info & Category */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 sm:p-3 rounded-2xl border-2 shadow-xs shrink-0 ${cardConfig.badgeBg}`}>
            {cardConfig.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border-2 uppercase tracking-wide ${cardConfig.badgeBg}`}>
                {cardConfig.label}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-[#8C8275] bg-[#FFF5E8] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#F6E6D0]">
                Kategori: <strong className={isMrWhite ? "text-[#7B33ED] italic" : "text-[#3A332C]"}>{cardConfig.categoryDisplay}</strong>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8C8275] mt-1 max-w-md line-clamp-2 md:line-clamp-none font-medium leading-relaxed">
              {cardConfig.hint}
            </p>
          </div>
        </div>

        {/* Right: Secret Word Container with Soft Clay Blur */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 bg-[#FFFBF5] border-2 border-[#F0DDC5] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-inner shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-[#8C8275]">
              {isMrWhite ? "Status Kata" : "Kata Rahasiamu"}
            </span>
            <div className="relative min-w-[110px] sm:min-w-[130px] h-7 flex items-center">
              <span
                className={`text-sm sm:text-base font-extrabold tracking-wide transition-all duration-200 ${
                  isVisible
                    ? `${cardConfig.textColor} filter-none opacity-100 select-text`
                    : "text-transparent bg-[#E8D3BD]/50 filter blur-md opacity-40 select-none rounded-lg"
                }`}
              >
                {word}
              </span>
              {!isVisible && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] text-[#A69989] font-mono tracking-widest uppercase pointer-events-none font-bold">
                  [TERKUNCI]
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Hold to Peek & Toggle Lock */}
          <div className="flex items-center gap-1.5 pl-2.5 sm:pl-3 border-l-2 border-[#F0DDC5]">
            <button
              onMouseDown={handleStartHold}
              onMouseUp={handleEndHold}
              onTouchStart={handleStartHold}
              onTouchEnd={handleEndHold}
              title="Tahan untuk mengintip"
              className={`p-2.5 sm:p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                isHeld
                  ? "bg-[#50B5FF] border-[#2B8EE0] text-white shadow-sm"
                  : "bg-white border-[#F0DDC5] text-[#6E6254] hover:bg-[#FFF5E8] active:scale-95 cursor-pointer shadow-xs"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Tahan</span>
            </button>

            <button
              onClick={handleToggleClick}
              title={isRevealed ? "Sembunyikan kata" : "Buka kunci tampilan"}
              className={`p-2.5 sm:p-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer shadow-xs ${
                isRevealed
                  ? "bg-[#EFF8FF] border-[#8CD3FF] text-[#1C8BE0]"
                  : "bg-white border-[#F0DDC5] text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8]"
              }`}
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Ready Confirmation Banner during MEMORIZE_PHASE */}
      {isMemorizePhase && (
        <div
          ref={readySectionRef}
          className="mt-4 pt-4 border-t-2 border-[#F6E6D0] flex flex-col space-y-3 bg-[#FFFBF5] p-3.5 sm:p-4 rounded-2xl border border-[#F0DDC5] animate-pop-spring"
        >
          {/* Prominent Onboarding Pointer for New Players */}
          {!isReady && (
            <div className="flex items-center gap-2 text-xs font-black text-[#24A654] bg-[#EDFCF2] p-2.5 rounded-xl border border-[#89EFA9] animate-bounce">
              <ArrowDown className="w-4 h-4 text-[#24A654] shrink-0" />
              <span>
                Sudah hafal kata rahasiamu? Klik tombol hijau di bawah agar game langsung dimulai tanpa menunggu waktu habis!
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3A332C]">
              <Sparkles className="w-4 h-4 text-[#FFA012]" />
              <span>
                Kesiapan Pemain:{" "}
                <strong className="text-[#1C8BE0] font-extrabold">
                  {readyCount} / {totalPlayers} Sudah Siap
                </strong>
              </span>
            </div>

            {!isReady ? (
              <button
                onClick={handleReadyClick}
                className="w-full sm:w-auto btn-3d-green ring-4 ring-[#24A654]/40 animate-pulse text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Saya Sudah Hafal! (Siap Main)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#24A654] bg-[#EDFCF2] border-2 border-[#89EFA9] px-4 py-2.5 rounded-2xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#24A654]" />
                <span>Anda Siap! Menunggu pemain lainnya...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
