import React from "react";
import { Moon, Eye, HeartPulse, Sliders, Users, Clock, Plus, Minus } from "lucide-react";

export default function WerewolfSettings({
  settings = { werewolfCount: 1, hasSeer: true, hasDoctor: true, dayDiscussionSeconds: 90 },
  activeCount = 4,
  isHost = false,
  onUpdateSettings,
}) {
  const wolfCount = settings.werewolfCount || 1;
  const hasSeer = settings.hasSeer !== false;
  const hasDoctor = settings.hasDoctor !== false;
  const dayDiscussionSecs = settings.dayDiscussionSeconds || 90;

  const specialCount = wolfCount + (hasSeer ? 1 : 0) + (hasDoctor ? 1 : 0);
  const calculatedVillagers = Math.max(0, activeCount - specialCount);

  const handleWolfChange = (delta) => {
    if (!isHost || !onUpdateSettings) return;
    const nextVal = Math.max(1, Math.min(wolfCount + delta, Math.floor((activeCount - 1) / 2) || 1));
    onUpdateSettings({
      ...settings,
      werewolfCount: nextVal,
    });
  };

  const handleToggleSeer = () => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      hasSeer: !hasSeer,
    });
  };

  const handleToggleDoctor = () => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      hasDoctor: !hasDoctor,
    });
  };

  const handleDiscussionDuration = (secs) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      dayDiscussionSeconds: parseInt(secs, 10),
    });
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1]">
            <Moon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan Peran (Werewolf)
          </span>
        </div>
      </div>

      {/* Role Composition Summary */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-[#FFF0ED] border border-[#FFB2A1]">
          <span className="text-[9px] font-black text-[#E64B2D] uppercase block">Serigala</span>
          <span className="text-sm font-black text-[#E64B2D]">{wolfCount}</span>
        </div>
        <div className="p-2 rounded-xl bg-[#F7F1FF] border border-[#C9A0FF]">
          <span className="text-[9px] font-black text-[#7B33ED] uppercase block">Seer</span>
          <span className="text-sm font-black text-[#7B33ED]">{hasSeer ? 1 : 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-[#F0FDF4] border border-[#86EFAC]">
          <span className="text-[9px] font-black text-[#15803D] uppercase block">Dokter</span>
          <span className="text-sm font-black text-[#15803D]">{hasDoctor ? 1 : 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-[#EFF8FF] border border-[#8CD3FF]">
          <span className="text-[9px] font-black text-[#1C8BE0] uppercase block">Warga</span>
          <span className="text-sm font-black text-[#1C8BE0]">{calculatedVillagers}</span>
        </div>
      </div>

      {/* Werewolf Stepper */}
      <div className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#3A332C]">Jumlah Serigala (Werewolf)</span>
          <span className="text-[10px] font-semibold text-[#8C8275]">Rekomendasi 1 untuk 4-5 pemain</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleWolfChange(-1)}
            disabled={!isHost || wolfCount <= 1}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-black text-sm text-[#E64B2D] w-5 text-center">
            {wolfCount}
          </span>
          <button
            type="button"
            onClick={() => handleWolfChange(1)}
            disabled={!isHost || specialCount >= activeCount - 1}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Special Roles Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleToggleSeer}
          disabled={!isHost}
          className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
            hasSeer
              ? "bg-[#F7F1FF] border-[#C9A0FF] text-[#7B33ED] font-black shadow-2xs"
              : "bg-[#FFFBF5] border-[#F0DDC5] text-[#8C8275]"
          } ${!isHost ? "cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs">Seer (Dukun)</span>
          </div>
          <span className="text-[10px] font-mono font-black">{hasSeer ? "AKTIF" : "OFF"}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleDoctor}
          disabled={!isHost}
          className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
            hasDoctor
              ? "bg-[#F0FDF4] border-[#86EFAC] text-[#15803D] font-black shadow-2xs"
              : "bg-[#FFFBF5] border-[#F0DDC5] text-[#8C8275]"
          } ${!isHost ? "cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4" />
            <span className="text-xs">Dokter Desa</span>
          </div>
          <span className="text-[10px] font-mono font-black">{hasDoctor ? "AKTIF" : "OFF"}</span>
        </button>
      </div>

      {/* Day Discussion Duration */}
      <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-[#3A332C]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FFA012]" />
            <span>Durasi Diskusi Siang</span>
          </span>
          <span className="font-mono text-[#1C8BE0]">{dayDiscussionSecs} Detik</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[30, 45, 60, 90, 120].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleDiscussionDuration(s)}
              disabled={!isHost}
              className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                dayDiscussionSecs === s
                  ? "bg-[#50B5FF] text-white shadow-xs"
                  : "bg-white text-[#8C8275] border border-[#F0DDC5]"
              } ${!isHost ? "cursor-not-allowed" : ""}`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
