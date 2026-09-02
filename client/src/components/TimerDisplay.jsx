import React, { useState, useEffect, useRef } from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { playSound } from "../utils/sound";

export default function TimerDisplay({ endsAt, duration = 25 }) {
  const [timeLeft, setTimeLeft] = useState(() =>
    endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0,
  );
  const lastTickRef = useRef(-1);

  useEffect(() => {
    if (!endsAt) return;

    const calculateRemaining = () => {
      const remainingSeconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

      // Play tick audio on final 5 seconds
      if (remainingSeconds <= 5 && remainingSeconds > 0 && lastTickRef.current !== remainingSeconds) {
        lastTickRef.current = remainingSeconds;
        playSound("tick");
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 100);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt || timeLeft <= 0) return null;

  const isUrgent = timeLeft <= 5;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (timeLeft / duration) * 100)) : 100;

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-150 ${
        isUrgent
          ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#E64B2D] shadow-sm animate-pulse"
          : "bg-[#FFF8EC] border-[#FFA012]/60 text-[#D97E00] shadow-xs"
      }`}>
        {isUrgent ? <AlertTriangle className="w-3.5 h-3.5 text-[#E64B2D]" /> : <Timer className="w-3.5 h-3.5 text-[#FFA012]" />}
        <span className="font-extrabold text-sm">{timeLeft}s</span>
      </div>

      {/* Mini Progress Clay Bar */}
      <div className="w-14 h-2 bg-[#E8D3BD] rounded-full overflow-hidden hidden sm:block border border-[#D9C4AB]/50 shadow-inner">
        <div
          className={`h-full transition-all duration-100 ease-linear rounded-full ${
            isUrgent
              ? "bg-gradient-to-r from-[#FF7F66] to-[#F56447]"
              : "bg-gradient-to-r from-[#60C0FF] to-[#3AA5F8]"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
