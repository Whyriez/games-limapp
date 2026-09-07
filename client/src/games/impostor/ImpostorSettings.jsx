import React from "react";
import { Rocket, Skull, Sliders, Users, Clock, Plus, Minus, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function ImpostorSettings({
  settings = { impostorCount: 1, killCooldown: 25, discussionDuration: 60, tasksPerPlayer: 3 },
  activeCount = 4,
  isHost = false,
  onUpdateSettings,
}) {
  const impCount = settings.impostorCount || 1;
  const killCooldown = settings.killCooldown || 25;
  const discussionSecs = settings.discussionDuration || 60;
  const tasksPerPlayer = settings.tasksPerPlayer || 3;

  const maxImpostors = Math.max(1, Math.min(3, Math.floor((activeCount - 1) / 2) || 1));
  const calculatedCrewmates = Math.max(0, activeCount - impCount);

  const handleImpChange = (delta) => {
    if (!isHost || !onUpdateSettings) return;
    const nextVal = Math.max(1, Math.min(impCount + delta, maxImpostors));
    onUpdateSettings({
      ...settings,
      impostorCount: nextVal,
    });
  };

  const handleCooldownChange = (delta) => {
    if (!isHost || !onUpdateSettings) return;
    const nextVal = Math.max(10, Math.min(killCooldown + delta, 60));
    onUpdateSettings({
      ...settings,
      killCooldown: nextVal,
    });
  };

  const handleTasksChange = (delta) => {
    if (!isHost || !onUpdateSettings) return;
    const nextVal = Math.max(1, Math.min(tasksPerPlayer + delta, 6));
    onUpdateSettings({
      ...settings,
      tasksPerPlayer: nextVal,
    });
  };

  const handleDiscussionDuration = (secs) => {
    if (!isHost || !onUpdateSettings) return;
    onUpdateSettings({
      ...settings,
      discussionDuration: parseInt(secs, 10),
    });
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FFF0ED] text-[#FF4D4D] border border-[#FFB2A1]">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan Misi Luar Angkasa
          </span>
        </div>
      </div>

      {/* Role Composition Summary */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-2xl bg-[#FFF0ED] border border-[#FFB2A1] flex items-center justify-between px-3.5">
          <div className="text-left">
            <span className="text-[10px] font-black text-[#FF4D4D] uppercase block">Impostor (Penyusup)</span>
            <span className="text-[10px] text-[#8C8275] font-semibold">Sabotase & Eliminasi</span>
          </div>
          <span className="text-base font-black text-[#FF4D4D]">{impCount}</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-[#EFF8FF] border border-[#8CD3FF] flex items-center justify-between px-3.5">
          <div className="text-left">
            <span className="text-[10px] font-black text-[#1C8BE0] uppercase block">Crewmate (Astronot)</span>
            <span className="text-[10px] text-[#8C8275] font-semibold">Selesaikan Tugas Kapal</span>
          </div>
          <span className="text-base font-black text-[#1C8BE0]">{calculatedCrewmates}</span>
        </div>
      </div>

      {/* Impostor Count Stepper */}
      <div className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#3A332C]">Jumlah Impostor</span>
          <span className="text-[10px] font-semibold text-[#8C8275]">
            Maksimal {maxImpostors} untuk {activeCount} pemain aktif
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleImpChange(-1)}
            disabled={!isHost || impCount <= 1}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-black text-sm text-[#FF4D4D] w-5 text-center">
            {impCount}
          </span>
          <button
            type="button"
            onClick={() => handleImpChange(1)}
            disabled={!isHost || impCount >= maxImpostors}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Kill Cooldown Stepper */}
      <div className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#3A332C]">Kill Cooldown (Jeda Eliminasi)</span>
          <span className="text-[10px] font-semibold text-[#8C8275]">Waktu jeda antar eliminasi Impostor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCooldownChange(-5)}
            disabled={!isHost || killCooldown <= 10}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-black text-xs text-[#3A332C] min-w-[36px] text-center">
            {killCooldown}s
          </span>
          <button
            type="button"
            onClick={() => handleCooldownChange(5)}
            disabled={!isHost || killCooldown >= 60}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tasks Per Player Stepper */}
      <div className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#3A332C]">Jumlah Tugas (Tasks) per Pemain</span>
          <span className="text-[10px] font-semibold text-[#8C8275]">Semakin banyak, durasi permainan bertambah</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTasksChange(-1)}
            disabled={!isHost || tasksPerPlayer <= 1}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono font-black text-xs text-[#1C8BE0] w-5 text-center">
            {tasksPerPlayer}
          </span>
          <button
            type="button"
            onClick={() => handleTasksChange(1)}
            disabled={!isHost || tasksPerPlayer >= 6}
            className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Discussion Duration Chips */}
      <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#3A332C]">Durasi Diskusi Meeting</span>
          <span className="font-mono font-black text-xs text-[#FFA012]">{discussionSecs} detik</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[30, 60, 90, 120].map((dur) => (
            <button
              key={dur}
              type="button"
              disabled={!isHost}
              onClick={() => handleDiscussionDuration(dur)}
              className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                discussionSecs === dur
                  ? "bg-[#FFA012] text-white border-[#D97E00] shadow-xs"
                  : "bg-white text-[#8C8275] border-[#F0DDC5] hover:bg-[#FFF5E8]"
              }`}
            >
              {dur}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
