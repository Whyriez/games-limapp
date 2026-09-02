import React from "react";
import { Clock, Eye, Sliders, MapPin } from "lucide-react";

export default function SpyfallSettings({
  settings = { roundDurationMinutes: 5, spyCount: 1 },
  activeCount = 3,
  isHost = false,
  onUpdateSettings,
}) {
  const roundMinutes = settings.roundDurationMinutes || 3;
  const spyCount = settings.spyCount || 1;

  const handleDurationChange = (val) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      roundDurationMinutes: parseInt(val, 10),
    });
  };

  const handleSpyCountChange = (count) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      spyCount: count,
    });
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1]">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan Permainan (Spyfall)
          </span>
        </div>
      </div>

      {/* Round Duration Slider & Quick Presets */}
      <div className="p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#3A332C] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FFA012]" />
            <span>Durasi Ronde Tanya Jawab</span>
          </span>
          <span className="text-xs font-mono font-black text-[#1C8BE0] bg-white px-2.5 py-0.5 rounded-full border border-[#F0DDC5]">
            {roundMinutes} Menit
          </span>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "1m (Kilat)", val: 1 },
            { label: "2m (Cepat)", val: 2 },
            { label: "3m (Pas)", val: 3 },
            { label: "5m (Santai)", val: 5 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              disabled={!isHost}
              onClick={() => handleDurationChange(preset.val)}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition cursor-pointer text-center ${
                roundMinutes === preset.val
                  ? "bg-[#50B5FF] text-white shadow-xs"
                  : "bg-white text-[#8C8275] border border-[#F0DDC5] hover:bg-[#FFF5E8]"
              } ${!isHost ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <input
          type="range"
          min="1"
          max="8"
          step="1"
          value={roundMinutes}
          disabled={!isHost}
          onChange={(e) => handleDurationChange(e.target.value)}
          className="w-full accent-[#50B5FF] cursor-pointer disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] font-bold text-[#8C8275]">
          <span>1 Menit (Super Cepat)</span>
          <span>3 Menit (Standar)</span>
          <span>8 Menit</span>
        </div>
      </div>

      {/* Number of Spies */}
      <div className="p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#3A332C] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#E64B2D]" />
            <span>Jumlah Agen Rahasia (Spy)</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSpyCountChange(1)}
            disabled={!isHost}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              spyCount === 1
                ? "bg-[#50B5FF] text-white shadow-xs"
                : "bg-white text-[#8C8275] border border-[#F0DDC5]"
            } ${!isHost ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <span>1 Spy</span>
          </button>
          <button
            type="button"
            onClick={() => handleSpyCountChange(2)}
            disabled={!isHost || activeCount < 6}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              spyCount === 2
                ? "bg-[#E64B2D] text-white shadow-xs"
                : "bg-white text-[#8C8275] border border-[#F0DDC5]"
            } ${!isHost || activeCount < 6 ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <span>2 Spy (Min 6 Pemain)</span>
          </button>
        </div>
      </div>

      {/* Location Pack Info */}
      <div className="p-3 bg-[#EFF8FF] rounded-xl border border-[#8CD3FF] flex items-center justify-between text-xs">
        <span className="font-bold text-[#1C8BE0] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>Paket Lokasi: Indonesia (15 Tempat)</span>
        </span>
        <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full text-[#1C8BE0]">
          Aktif
        </span>
      </div>
    </div>
  );
}
