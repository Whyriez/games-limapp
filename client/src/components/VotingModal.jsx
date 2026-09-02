import React, { useRef, useEffect } from "react";
import Avatar from "./Avatar";
import TimerDisplay from "./TimerDisplay";
import { Vote, Check, Ban, Hand } from "lucide-react";
import { playSound } from "../utils/sound";

export default function VotingModal({
  candidates = [],
  currentSocketId,
  isAlive = true,
  votedTarget,
  votedCount = 0,
  totalAlive = 0,
  endsAt,
  onCastVote,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleSelectCandidate = (socketId) => {
    if (!isAlive || votedTarget || socketId === currentSocketId) return;
    playSound("vote");
    onCastVote(socketId);
  };

  return (
    <div
      ref={containerRef}
      className="clay-card p-4 sm:p-8 shadow-md border-2 border-[#FFA012]/40 animate-pop-spring space-y-4 sm:space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b-2 border-[#F6E6D0]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FFF8EC] border-2 border-[#FFA012] text-[#D97E00] shadow-xs shrink-0">
            <Vote className="w-5 h-5 sm:w-6 sm:h-6 text-[#D97E00]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-[#3A332C]">
              Fase Voting Eliminasi
            </h3>
            <p className="text-[11px] sm:text-xs text-[#8C8275] font-medium mt-0.5">
              {isAlive
                ? "Pilih pemain yang paling mencurigakan (tidak dapat memilih diri sendiri)."
                : "Anda berstatus penonton / gugur dan sedang menyaksikan pemungutan suara."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {totalAlive > 0 && (
            <span className="text-[11px] sm:text-xs bg-[#FFF8EC] text-[#D97E00] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-[#FFA012]/50 font-black shadow-xs">
              {votedCount} / {totalAlive} Suara
            </span>
          )}
          {endsAt && <TimerDisplay endsAt={endsAt} duration={35} />}
        </div>
      </div>

      {/* Prominent Guidance Banner */}
      {!isAlive ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#8C8275] bg-[#FFFBF5] p-2.5 sm:p-3 rounded-2xl border-2 border-[#F0DDC5]">
          <span>👁️ Mode Penonton (Gugur 👻): Sedang menyaksikan voting pemain aktif.</span>
        </div>
      ) : !votedTarget ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#D97E00] bg-[#FFF8EC] p-2.5 sm:p-3 rounded-2xl border-2 border-[#FFA012]/50 animate-bounce">
          <Hand className="w-4 h-4 text-[#FFA012] shrink-0" />
          <span>👉 Klik kartu nama pemain di bawah untuk memberikan suaramu:</span>
        </div>
      ) : null}

      {/* Candidate Squircle Grid with Desktop 3-4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
        {candidates.map((cand) => {
          const isMe = cand.socketId === currentSocketId;
          const isSelected = votedTarget === cand.socketId;
          const isDisabled = !isAlive || votedTarget !== null || isMe;

          return (
            <button
              key={cand.socketId}
              disabled={isDisabled}
              onClick={() => handleSelectCandidate(cand.socketId)}
              title={isMe ? "Anda tidak dapat memilih diri sendiri" : `Vote ${cand.name}`}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-between min-h-[62px] sm:min-h-[74px] ${
                isMe
                  ? "bg-[#F7F2EB] border-[#E8DEC7] text-[#A69989] opacity-50 cursor-not-allowed"
                  : isSelected
                    ? "bg-[#FFF8EC] border-2 border-[#FFA012] text-[#3A332C] shadow-[0_4px_0_#D97E00] sm:shadow-[0_6px_0_#D97E00] translate-y-[-2px] cursor-pointer"
                    : votedTarget !== null
                      ? "bg-[#FFFBF5] border-[#F0DDC5] text-[#8C8275] opacity-50 cursor-not-allowed"
                      : "bg-[#FFFFFF] border-2 border-[#F0DDC5] hover:border-[#FFA012] hover:bg-[#FFFBF5] text-[#3A332C] cursor-pointer shadow-[0_4px_0_#E2CEB5] hover:shadow-[0_5px_0_#FFA012] active:translate-y-[3px] active:shadow-[0_1px_0_#FFA012]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={cand.name} size="sm" isAlive={true} />
                <div className="truncate text-left">
                  <span className="truncate font-black text-xs sm:text-base text-[#3A332C] block">
                    {cand.name}
                  </span>
                  {isMe && (
                    <span className="text-[9px] sm:text-xs font-bold text-[#8C8275]">
                      (Anda - Tidak bisa vote)
                    </span>
                  )}
                </div>
              </div>

              {isSelected && (
                <span className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-[#D97E00] bg-[#FFEACD] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#FFA012] shrink-0 ml-2 shadow-xs">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Pilihanmu</span>
                </span>
              )}

              {isMe && !isSelected && (
                <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-[#A69989] shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {votedTarget && (
        <div className="mt-4 text-center text-xs sm:text-sm font-black text-[#D97E00] bg-[#FFF8EC] py-3.5 rounded-2xl border-2 border-[#FFA012]/40 shadow-xs animate-pop-spring">
          ✓ Pilihanmu telah dikirim. Menunggu suara pemain lainnya...
        </div>
      )}
    </div>
  );
}
