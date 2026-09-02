import React from "react";
import { createPortal } from "react-dom";
import { getAvailableGames } from "../games/registry";
import { Sparkles, Users, Clock, Check, X, Gamepad2, ArrowRight } from "lucide-react";

export default function GameSelectorModal({
  isOpen = false,
  currentGameType = "undercover",
  onClose,
  onSelectGame,
}) {
  if (!isOpen) return null;

  const games = getAvailableGames();

  const modalContent = (
    <div className="fixed inset-0 z-[999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="clay-card p-6 sm:p-8 max-w-2xl w-full m-auto bg-white space-y-5 border-2 border-[#F6E6D0] max-h-[90vh] flex flex-col shadow-2xl animate-pop-spring">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#F6E6D0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#3A332C]">
                Katalog Party Games
              </h2>
              <p className="text-xs font-semibold text-[#8C8275]">
                Pilih game yang ingin dimainkan bersama teman-temanmu di ruangan ini!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C8275] hover:text-[#3A332C] p-1 rounded-xl hover:bg-[#FFFBF5] text-lg font-black cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {games.map((game) => {
            const Icon = game.icon || Sparkles;
            const isSelected = currentGameType === game.id;

            return (
              <div
                key={game.id}
                onClick={() => {
                  onSelectGame(game.id);
                  onClose();
                }}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group active:scale-98 ${
                  isSelected
                    ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                    : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#50B5FF] hover:bg-[#EFF8FF] shadow-2xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs"
                        style={{
                          backgroundColor:
                            game.id === "spyfall" || game.id === "uno" || game.id === "remi"
                              ? "#FFF0ED"
                              : game.id === "werewolf"
                              ? "#F7F1FF"
                              : game.id === "drawguess"
                              ? "#EDFCF2"
                              : "#EFF8FF",
                          borderColor:
                            game.id === "spyfall" || game.id === "uno" || game.id === "remi"
                              ? "#FFB2A1"
                              : game.id === "werewolf"
                              ? "#D5B8FF"
                              : game.id === "drawguess"
                              ? "#89EFA9"
                              : "#8CD3FF",
                          color:
                            game.id === "uno"
                              ? "#FF3B30"
                              : game.id === "spyfall" || game.id === "remi"
                              ? "#E64B2D"
                              : game.id === "werewolf"
                              ? "#7B33ED"
                              : game.id === "drawguess"
                              ? "#24A654"
                              : "#1C8BE0",
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${game.badgeColor}`}>
                          {game.badge}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-[#3A332C] leading-tight">
                          {game.name}
                        </h3>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#24A654] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#8C8275] font-semibold leading-relaxed line-clamp-3">
                    {game.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-[#F0DDC5]/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#8C8275]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#50B5FF]" />
                      <span>{game.minPlayers}-{game.maxPlayers} Pemain</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FFA012]" />
                      <span>{game.duration}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {game.tags?.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-extrabold bg-white px-2 py-0.5 rounded-md border border-[#F0DDC5] text-[#8C8275]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-[#24A654] text-white shadow-xs"
                        : "bg-white text-[#3A332C] border border-[#F0DDC5] group-hover:bg-[#50B5FF] group-hover:text-white group-hover:border-[#50B5FF]"
                    }`}
                  >
                    <span>{isSelected ? "Sedang Aktif ✓" : "Pilih Game Ini"}</span>
                    {!isSelected && <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
