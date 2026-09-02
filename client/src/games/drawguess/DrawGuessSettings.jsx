import React from "react";
import { Palette, Clock, Sliders, Trophy, Plus, Minus } from "lucide-react";

export default function DrawGuessSettings({
  settings = { drawTimeLimit: 60, maxRounds: 3 },
  activeCount = 2,
  isHost = false,
  onUpdateSettings,
}) {
  const timeLimit = settings.drawTimeLimit || 60;
  const maxRounds = settings.maxRounds || 3;

  const handleTimeChange = (sec) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      drawTimeLimit: parseInt(sec, 10),
    });
  };

  const handleRoundsChange = (delta) => {
    if (!isHost || !onUpdateSettings) return;
    const nextVal = Math.max(1, Math.min(maxRounds + delta, 5));
    onUpdateSettings({
      ...settings,
      maxRounds: nextVal,
    });
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan (Tebak Gambar)
          </span>
        </div>
      </div>

      {/* Drawing Time Limit Selector */}
      <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#3A332C]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FFA012]" />
            <span>Waktu Menggambar per Giliran</span>
          </span>
          <span className="font-mono text-[#1C8BE0] bg-white px-2 py-0.5 rounded-full border border-[#F0DDC5]">
            {timeLimit} Detik
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[45, 60, 90].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleTimeChange(s)}
              disabled={!isHost}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                timeLimit === s
                  ? "bg-[#50B5FF] text-white shadow-xs"
                  : "bg-white text-[#8C8275] border border-[#F0DDC5]"
              } ${!isHost ? "cursor-not-allowed" : ""}`}
            >
              {s} Detik
            </button>
          ))}
        </div>
      </div>

      {/* Rounds Count Stepper */}
      <div className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#3A332C]">Jumlah Ronde</span>
          <span className="text-[10px] font-semibold text-[#8C8275]">Setiap pemain menggambar 1x per ronde</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRoundsChange(-1)}
            disabled={!isHost || maxRounds <= 1}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-black text-sm text-[#FFA012] w-5 text-center">
            {maxRounds}
          </span>
          <button
            type="button"
            onClick={() => handleRoundsChange(1)}
            disabled={!isHost || maxRounds >= 5}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
