import React, { useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "./Avatar";
import {
  Trophy,
  X,
  Crown,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Check,
  ShieldAlert,
  Sparkles,
  Compass,
  Moon,
  Palette,
  Layers,
  Flame,
  TrendingUp,
} from "lucide-react";

const GAME_TABS = [
  { id: "all", label: "Semua Game", icon: Trophy, color: "#FFA012" },
  { id: "undercover", label: "Undercover", icon: Sparkles, color: "#50B5FF" },
  { id: "spyfall", label: "Spyfall", icon: Compass, color: "#FF7F66" },
  { id: "werewolf", label: "Werewolf", icon: Moon, color: "#9D5CFF" },
  { id: "drawguess", label: "Tebak Gambar", icon: Palette, color: "#24A654" },
  { id: "remi", label: "Remi", icon: Layers, color: "#E64B2D" },
];

export default function LeaderboardModal({
  isOpen,
  onClose,
  data = {},
  isHost = false,
  onReset,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle data whether it's an object with tabs or a flat array (for backwards compatibility)
  const currentList = Array.isArray(data)
    ? data
    : data[activeTab] || [];

  const top1 = currentList[0] || null;
  const top2 = currentList[1] || null;
  const top3 = currentList[2] || null;

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      if (onReset) {
        await onReset();
      } else {
        const res = await fetch("/api/leaderboard/reset", { method: "POST" });
        await res.json();
      }
      setResetSuccess(true);
      setShowConfirmReset(false);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error("Gagal mereset leaderboard:", err);
    } finally {
      setResetting(false);
    }
  };

  const isDrawGuessTab = activeTab === "drawguess";

  const modalContent = (
    <div className="fixed inset-0 z-[999] min-h-[100dvh] w-full flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="clay-card w-full max-w-5xl m-auto rounded-[32px] p-5 sm:p-7 border-2 border-[#F6E6D0] shadow-2xl animate-pop-spring relative bg-white max-h-[92vh] flex flex-col space-y-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#F6E6D0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FFF8EC] border-2 border-[#FFA012] text-[#D97E00] shadow-xs animate-bounce">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFA012]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#3A332C]">
                Podium & Klasemen Juara
              </h3>
              <p className="text-xs text-[#8C8275] font-medium">
                Peringkat 3D per-kategori game pesta & performa statistik pemain.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8] transition cursor-pointer border border-transparent hover:border-[#F0DDC5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher per Game */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scroll-smooth">
          {GAME_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs ${
                  isActive
                    ? "bg-[#3A332C] text-white shadow-xs"
                    : "bg-[#FFFBF5] text-[#8C8275] hover:text-[#3A332C] border border-[#F0DDC5] hover:bg-[#FFF5E8]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? "#FFA012" : tab.color }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Reset Success Banner */}
        {resetSuccess && (
          <div className="my-1 p-3 bg-[#EDFCF2] border-2 border-[#89EFA9] text-[#24A654] rounded-2xl text-xs font-black flex items-center gap-2 animate-pop-spring shrink-0">
            <Check className="w-4 h-4" />
            <span>✓ Seluruh data podium & statistik pemain berhasil direset ke 0!</span>
          </div>
        )}

        {/* Confirmation Dialog for Reset */}
        {showConfirmReset && (
          <div className="my-2 p-4 sm:p-5 bg-[#FFF0ED] border-2 border-[#FFB2A1] rounded-3xl space-y-3 animate-pop-spring shadow-sm shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-xl text-[#E64B2D] border border-[#FFB2A1] shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#E64B2D]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#3A332C]">
                  Konfirmasi Reset Seluruh Podium & Statistik
                </h4>
                <p className="text-xs text-[#8C8275] font-semibold leading-relaxed">
                  Apakah Anda yakin ingin mengosongkan statistik kemenangan, win rate, dan ranking seluruh pemain? Tindakan ini permanen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#FFB2A1]/50">
              <button
                onClick={() => setShowConfirmReset(false)}
                disabled={resetting}
                className="px-4 py-2 text-xs font-black rounded-xl bg-white text-[#8C8275] hover:text-[#3A332C] border border-[#F0DDC5] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={resetting}
                className="px-5 py-2 text-xs font-black rounded-xl bg-[#E64B2D] hover:bg-[#D43F22] text-white transition cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {resetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Reset Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Main Content: 2-Column Grid Layout */}
        <div className="flex-1 overflow-y-auto my-1 pr-1">
          {currentList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: 3D PODIUM STAND (Top 3) */}
              <div className="lg:col-span-5 bg-[#FFFBF5] p-5 rounded-3xl border-2 border-[#F0DDC5] flex flex-col space-y-3 shadow-xs">
                <div className="text-center pb-2 border-b border-[#F0DDC5]">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FFA012] flex items-center justify-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Top 3 ({GAME_TABS.find((t) => t.id === activeTab)?.label})</span>
                  </span>
                </div>

                <div className="flex items-end justify-center gap-2 sm:gap-3 max-w-sm mx-auto pt-6 pb-2 w-full">
                  {/* Rank 2 (Left - Sky Cyan) */}
                  {top2 ? (
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative mb-2 flex flex-col items-center animate-float">
                        <Avatar name={top2.nickname} size="sm" />
                        <span className="text-[9px] font-extrabold text-white bg-[#3AA5F8] px-1.5 py-0.2 rounded-full mt-1 border border-white shadow-xs">
                          #2
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#3A332C] truncate max-w-[80px] block text-center">
                        {top2.nickname}
                      </span>
                      <span className="text-[10px] font-bold text-[#1C8BE0]">
                        {isDrawGuessTab
                          ? `${top2.total_points || 0} Poin`
                          : `${top2.total_wins}W (${top2.win_rate}%)`}
                      </span>
                      {/* Podium Stand 2 */}
                      <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-[#68D0FF] to-[#30B5FA] border-2 border-[#8CD3FF] shadow-[0_5px_0_#248BC7] flex items-center justify-center text-white font-extrabold text-lg mt-2 animate-podium-rise">
                        2
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 opacity-20 flex flex-col items-center">
                      <div className="w-full h-16 rounded-t-2xl bg-gray-300"></div>
                    </div>
                  )}

                  {/* Rank 1 (Center - Purple King) */}
                  {top1 ? (
                    <div className="flex-1 flex flex-col items-center -mt-5">
                      <div
                        className="relative mb-2 flex flex-col items-center animate-float"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <Crown className="w-5 h-5 text-[#FFA012] fill-[#FFE259] -mb-1 animate-bounce" />
                        <Avatar name={top1.nickname} size="md" />
                        <span className="text-[10px] font-extrabold text-white bg-[#8740FA] px-2 py-0.5 rounded-full mt-1 border-2 border-white shadow-sm">
                          👑 #1
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#3A332C] truncate max-w-[95px] block text-center">
                        {top1.nickname}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#7B33ED]">
                        {isDrawGuessTab
                          ? `${top1.total_points || 0} Poin`
                          : `${top1.total_wins}W (${top1.win_rate}%)`}
                      </span>
                      {/* Podium Stand 1 */}
                      <div className="w-full h-28 sm:h-32 rounded-t-2xl bg-gradient-to-b from-[#B077FF] to-[#8740FA] border-2 border-[#C9A0FF] shadow-[0_5px_0_#6220C4] flex items-center justify-center text-white font-extrabold text-xl mt-2 animate-podium-rise">
                        1
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 opacity-20 flex flex-col items-center">
                      <div className="w-full h-24 rounded-t-2xl bg-gray-300"></div>
                    </div>
                  )}

                  {/* Rank 3 (Right - Coral Pink) */}
                  {top3 ? (
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className="relative mb-2 flex flex-col items-center animate-float"
                        style={{ animationDelay: "0.4s" }}
                      >
                        <Avatar name={top3.nickname} size="sm" />
                        <span className="text-[9px] font-extrabold text-white bg-[#F56447] px-1.5 py-0.2 rounded-full mt-1 border border-white shadow-xs">
                          #3
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#3A332C] truncate max-w-[80px] block text-center">
                        {top3.nickname}
                      </span>
                      <span className="text-[10px] font-bold text-[#E64B2D]">
                        {isDrawGuessTab
                          ? `${top3.total_points || 0} Poin`
                          : `${top3.total_wins}W (${top3.win_rate}%)`}
                      </span>
                      {/* Podium Stand 3 */}
                      <div className="w-full h-16 sm:h-18 rounded-t-2xl bg-gradient-to-b from-[#FF9782] to-[#F56447] border-2 border-[#FFB2A1] shadow-[0_5px_0_#C9452C] flex items-center justify-center text-white font-extrabold text-base mt-2 animate-podium-rise">
                        3
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 opacity-20 flex flex-col items-center">
                      <div className="w-full h-12 rounded-t-2xl bg-gray-300"></div>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 border-t border-[#F0DDC5] text-[11px] font-bold text-[#8C8275]">
                  🏆 Diperbarui otomatis setelah setiap match {GAME_TABS.find((t) => t.id === activeTab)?.label} selesai.
                </div>
              </div>

              {/* RIGHT COLUMN: COMPLETE RANKINGS TABLE */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#1C8BE0]" />
                    <span>Daftar Klasemen ({currentList.length} Pemain)</span>
                  </span>
                  <span className="text-[10px] text-[#8C8275] font-bold">
                    {isDrawGuessTab ? "Urutan: Total Poin" : "Urutan: Win Rate % ➔ Kemenangan"}
                  </span>
                </div>

                {/* Full Scrollable Ranks Container */}
                <div className="overflow-y-auto max-h-[360px] lg:max-h-[400px] space-y-2 pr-1.5">
                  {currentList.map((player, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    const cardBg = isTop1
                      ? "bg-[#F7F1FF] border-[#C9A0FF] shadow-xs"
                      : isTop2
                        ? "bg-[#EFF8FF] border-[#8CD3FF]"
                        : isTop3
                          ? "bg-[#FFF0ED] border-[#FFB2A1]"
                          : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#D9C4AB]";

                    const badgeColor = isTop1
                      ? "bg-[#8740FA] text-white"
                      : isTop2
                        ? "bg-[#1C8BE0] text-white"
                        : isTop3
                          ? "bg-[#E64B2D] text-white"
                          : "bg-[#F0DDC5] text-[#8C8275]";

                    return (
                      <div
                        key={player.player_id || idx}
                        className={`p-3 rounded-2xl border-2 ${cardBg} flex items-center justify-between gap-3 text-xs transition duration-150`}
                      >
                        {/* Left: Rank badge & avatar & name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${badgeColor}`}
                          >
                            {idx + 1}
                          </span>
                          <Avatar name={player.nickname} size="xs" />
                          <div className="min-w-0 truncate">
                            <span className="font-black text-xs sm:text-sm text-[#3A332C] truncate block">
                              {player.nickname}
                            </span>
                            <span className="text-[10px] text-[#8C8275] font-semibold">
                              {player.total_games} Total Match
                            </span>
                          </div>
                        </div>

                        {/* Right: Stats badges */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                          {isDrawGuessTab ? (
                            <>
                              <div>
                                <span className="text-[9px] text-[#8C8275] block uppercase font-bold">
                                  Total Poin
                                </span>
                                <span className="text-xs sm:text-sm text-[#24A654] font-black">
                                  {player.total_points || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#8C8275] block uppercase font-bold">
                                  Juara Match
                                </span>
                                <span className="text-xs sm:text-sm text-[#1C8BE0] font-black">
                                  {player.total_wins || 0}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[9px] text-[#8C8275] block uppercase font-bold">
                                  Menang
                                </span>
                                <span className="text-xs sm:text-sm text-[#1C8BE0] font-black">
                                  {player.total_wins || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#8C8275] block uppercase font-bold">
                                  Win Rate
                                </span>
                                <span className="text-xs sm:text-sm text-[#24A654] font-black">
                                  {player.win_rate || 0}%
                                </span>
                              </div>
                              {player.times_voted_out !== undefined && (
                                <div className="hidden sm:block">
                                  <span className="text-[9px] text-[#8C8275] block uppercase font-bold">
                                    Tervote
                                  </span>
                                  <span className="text-xs text-[#E64B2D] font-bold">
                                    {player.times_voted_out || 0}x
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-14 text-xs font-bold text-[#8C8275] bg-[#FFFBF5] rounded-3xl border-2 border-[#F0DDC5] my-2">
              <Trophy className="w-10 h-10 text-[#FFA012] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-extrabold text-[#3A332C]">
                Belum Ada Data Pertandingan ({GAME_TABS.find((t) => t.id === activeTab)?.label})
              </p>
              <p className="text-xs text-[#8C8275] mt-1">
                Mainkan game ini bersama teman-teman untuk mulai mencatat podium & statistik!
              </p>
            </div>
          )}
        </div>

        {/* Footer with Reset Podium Action Button */}
        <div className="pt-3 border-t-2 border-[#F6E6D0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => setShowConfirmReset(true)}
            title="Reset seluruh ranking dan statistik pemain"
            className="flex items-center gap-1.5 text-xs font-black bg-[#FFF0ED] hover:bg-[#FFE0D9] text-[#E64B2D] border-2 border-[#FFB2A1] px-4 py-2.5 rounded-2xl transition cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Podium</span>
          </button>

          <button
            onClick={onClose}
            className="btn-3d-blue text-xs font-extrabold px-6 py-2.5 rounded-2xl transition cursor-pointer"
          >
            Tutup Matrix
          </button>
        </div>
      </div>
    </div>
  );

  const targetContainer =
    typeof document !== "undefined"
      ? document.fullscreenElement || document.body
      : null;

  return targetContainer ? createPortal(modalContent, targetContainer) : modalContent;
}
