import React from "react";
import { getPlayerTheme } from "../utils/avatar";
import { Crown, Skull } from "lucide-react";

export default function Avatar({
  name = "Pemain",
  size = "md",
  isHost = false,
  isAlive = true,
  isConnected = true,
  isCurrentTurn = false,
  className = "",
}) {
  const theme = getPlayerTheme(name);

  const sizeConfigs = {
    xs: {
      box: "w-7 h-7",
      emoji: "text-xs",
      icon: "w-3 h-3",
    },
    sm: {
      box: "w-9 h-9",
      emoji: "text-base",
      icon: "w-4 h-4",
    },
    md: {
      box: "w-12 h-12",
      emoji: "text-2xl",
      icon: "w-5 h-5",
    },
    lg: {
      box: "w-14 h-14",
      emoji: "text-3xl",
      icon: "w-6 h-6",
    },
    xl: {
      box: "w-20 h-20",
      emoji: "text-4xl",
      icon: "w-8 h-8",
    },
  };

  const currentSize = sizeConfigs[size] || sizeConfigs.md;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`
          ${currentSize.box}
          rounded-[20px] bg-gradient-to-b ${theme.bg}
          flex items-center justify-center text-white
          border-2 ${theme.border} ${theme.shadow} shadow-md
          transition-all duration-200 select-none
          ${!isAlive ? "filter grayscale opacity-40 scale-95" : "hover:scale-105"}
          ${!isConnected ? "opacity-35" : ""}
          ${isCurrentTurn && isAlive ? "ring-2 ring-[#FFA012] shadow-md animate-pulse" : ""}
        `}
      >
        {isAlive ? (
          <span className={`${currentSize.emoji} drop-shadow-sm filter leading-none`}>
            {theme.emoji}
          </span>
        ) : (
          <Skull className={`${currentSize.icon} text-white/90`} />
        )}
      </div>

      {/* Host Gold Crown Pin */}
      {isHost && (
        <span
          title="Room Host"
          className="absolute -top-1.5 -right-1.5 bg-gradient-to-b from-[#FFE259] to-[#FFA751] text-[#7A4B00] p-1 rounded-full border-2 border-white shadow-sm z-10"
        >
          <Crown className="w-2.5 h-2.5 fill-current" />
        </span>
      )}

      {/* Disconnected Dot */}
      {!isConnected && (
        <span
          title="Terputus"
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white"
        />
      )}
    </div>
  );
}
