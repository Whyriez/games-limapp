import React from "react";
import { getGameMeta } from "../games/registry";
import { Sparkles, HelpCircle, Users, Clock, ArrowRightLeft, CheckCircle2 } from "lucide-react";

export default function ActiveGameBanner({
  gameType = "undercover",
  isHost = false,
  onOpenGameSelector,
  onOpenRules,
}) {
  const meta = getGameMeta(gameType);
  const Icon = meta.icon || Sparkles;

  return (
    <div className="clay-card p-4 sm:p-5 shadow-sm border-2 border-[#F6E6D0] bg-white animate-pop-spring relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        {/* Left: Game Title & Badges */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-2xs shrink-0"
            style={{
              backgroundColor: meta.id === "spyfall" ? "#FFF8EC" : "#EFF8FF",
              borderColor: meta.id === "spyfall" ? "#FFA012" : "#8CD3FF",
              color: meta.id === "spyfall" ? "#D97E00" : "#1C8BE0",
            }}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${meta.badgeColor}`}>
                {meta.badge}
              </span>
              <span className="text-[10px] font-bold text-[#8C8275]">
                {meta.category}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-[#3A332C] leading-tight mt-0.5">
              {meta.fullName}
            </h2>

            <div className="flex items-center gap-2.5 text-[11px] font-bold text-[#8C8275] mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-[#50B5FF]" />
                <span>{meta.minPlayers}-{meta.maxPlayers} Pemain</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FFA012]" />
                <span>{meta.duration}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Switch Game (Host) & View Rules */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isHost ? (
            <button
              type="button"
              onClick={onOpenGameSelector}
              className="w-full sm:w-auto btn-3d-peach px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Ganti Game</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-[#8C8275] bg-[#FFFBF5] px-3 py-1.5 rounded-xl border border-[#F0DDC5]">
              Dipilih oleh Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
