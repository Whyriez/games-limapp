import React from "react";
import { Layers, Clock, Sliders, Trophy } from "lucide-react";

export default function RemiSettings({
  settings = { turnTimeLimit: 30, handSize: 7 },
  activeCount = 2,
  isHost = false,
  onUpdateSettings,
}) {
  const timeLimit = settings.turnTimeLimit || 30;

  const handleTimeChange = (sec) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      turnTimeLimit: parseInt(sec, 10),
    });
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan (Game Remi)
          </span>
        </div>
      </div>

      {/* Turn Time Limit */}
      <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#3A332C]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FFA012]" />
            <span>Batas Waktu Giliran</span>
          </span>
          <span className="font-mono text-[#1C8BE0] bg-white px-2 py-0.5 rounded-full border border-[#F0DDC5]">
            {timeLimit} Detik
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[20, 30, 45].map((s) => (
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

      {/* Hand Size Info Card */}
      <div className="p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-[#3A332C] block">Format Kartu</span>
          <span className="text-[11px] font-semibold text-[#8C8275]">7 Kartu Tangan (Standar Seri & Triple)</span>
        </div>
        <span className="text-xs font-black text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2.5 py-1 rounded-full">
          7 Kartu
        </span>
      </div>
    </div>
  );
}
