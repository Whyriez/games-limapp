import React from "react";
import { Sliders, Sparkles, Plus, Minus, Shield, Users, UserCheck } from "lucide-react";

export default function UndercoverSettings({
  settings = { autoBalance: true, undercoverCount: 1, mrWhiteCount: 0 },
  activeCount = 3,
  isHost = false,
  onUpdateSettings,
}) {
  const isAuto = settings?.autoBalance !== false;
  const undercoverCount = settings.undercoverCount || 1;
  const mrWhiteCount = settings.mrWhiteCount || 0;
  const maxImpostors = Math.max(1, activeCount - 1);
  const totalImpostors = undercoverCount + mrWhiteCount;
  const calculatedCivilians = Math.max(1, activeCount - totalImpostors);

  const calculateAutoRoleDistribution = (count) => {
    const c = Math.max(3, count || 3);
    let u = 1;
    let w = 0;

    if (c <= 3) {
      u = 1;
      w = 0;
    } else if (c <= 5) {
      u = 1;
      w = 1;
    } else if (c <= 7) {
      u = 2;
      w = 1;
    } else if (c <= 9) {
      u = 2;
      w = 1;
    } else {
      u = 3;
      w = 2;
    }

    const maxImp = c - 1;
    if (u + w > maxImp) {
      u = Math.max(1, Math.min(u, maxImp));
      w = Math.max(0, maxImp - u);
    }

    return { undercoverCount: u, mrWhiteCount: w };
  };

  const handleSetAutoMode = (auto) => {
    if (!isHost || !onUpdateSettings) return;
    if (auto) {
      const autoRoles = calculateAutoRoleDistribution(activeCount);
      onUpdateSettings({
        autoBalance: true,
        undercoverCount: autoRoles.undercoverCount,
        mrWhiteCount: autoRoles.mrWhiteCount,
      });
    } else {
      onUpdateSettings({
        autoBalance: false,
        undercoverCount: Math.max(1, undercoverCount),
        mrWhiteCount: Math.max(0, mrWhiteCount),
      });
    }
  };

  const handleUndercoverChange = (delta) => {
    if (!isHost || isAuto || !onUpdateSettings) return;
    const nextVal = Math.max(1, Math.min(undercoverCount + delta, maxImpostors - mrWhiteCount));
    if (nextVal !== undercoverCount) {
      onUpdateSettings({
        autoBalance: false,
        undercoverCount: nextVal,
        mrWhiteCount,
      });
    }
  };

  const handleMrWhiteChange = (delta) => {
    if (!isHost || isAuto || !onUpdateSettings) return;
    const nextVal = Math.max(0, Math.min(mrWhiteCount + delta, maxImpostors - undercoverCount));
    if (nextVal !== mrWhiteCount) {
      onUpdateSettings({
        autoBalance: false,
        undercoverCount,
        mrWhiteCount: nextVal,
      });
    }
  };

  return (
    <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#FFF8EC] text-[#D97E00] border border-[#FFA012]/40">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Pengaturan Peran (Undercover)
          </span>
        </div>
      </div>

      {/* Auto vs Manual Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-[#FFFBF5] p-1 rounded-2xl border border-[#F0DDC5]">
        <button
          type="button"
          onClick={() => handleSetAutoMode(true)}
          disabled={!isHost}
          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            isAuto
              ? "bg-[#50B5FF] text-white shadow-xs"
              : "text-[#8C8275] hover:text-[#3A332C]"
          } ${!isHost ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Otomatis (Seimbang)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetAutoMode(false)}
          disabled={!isHost}
          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            !isAuto
              ? "bg-[#FFA012] text-white shadow-xs"
              : "text-[#8C8275] hover:text-[#3A332C]"
          } ${!isHost ? "opacity-75 cursor-not-allowed" : ""}`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Kustom Manual</span>
        </button>
      </div>

      {/* Role Composition Summary Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-[#15803D] uppercase flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>Civilian</span>
          </span>
          <span className="text-base font-black text-[#15803D]">{calculatedCivilians}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#EFF8FF] border border-[#8CD3FF] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-[#1C8BE0] uppercase flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>Undercover</span>
          </span>
          <span className="text-base font-black text-[#1C8BE0]">{undercoverCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-[#E11D48] uppercase flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Mr. White</span>
          </span>
          <span className="text-base font-black text-[#E11D48]">{mrWhiteCount}</span>
        </div>
      </div>

      {/* Manual Steppers (Only enabled in Manual Mode for Host) */}
      {!isAuto && (
        <div className="space-y-2.5 pt-1 animate-pop-spring">
          {/* Undercover Stepper */}
          <div className="flex items-center justify-between p-2.5 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]">
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#3A332C]">Jumlah Undercover</span>
              <span className="text-[10px] font-semibold text-[#8C8275]">Min: 1 peran</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUndercoverChange(-1)}
                disabled={!isHost || undercoverCount <= 1}
                className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono font-black text-sm text-[#1C8BE0] w-5 text-center">
                {undercoverCount}
              </span>
              <button
                type="button"
                onClick={() => handleUndercoverChange(1)}
                disabled={!isHost || undercoverCount + mrWhiteCount >= maxImpostors}
                className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mr. White Stepper */}
          <div className="flex items-center justify-between p-2.5 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]">
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#3A332C]">Jumlah Mr. White</span>
              <span className="text-[10px] font-semibold text-[#8C8275]">Bisa 0 jika tidak diinginkan</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMrWhiteChange(-1)}
                disabled={!isHost || mrWhiteCount <= 0}
                className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono font-black text-sm text-[#E11D48] w-5 text-center">
                {mrWhiteCount}
              </span>
              <button
                type="button"
                onClick={() => handleMrWhiteChange(1)}
                disabled={!isHost || undercoverCount + mrWhiteCount >= maxImpostors}
                className="w-7 h-7 rounded-lg bg-white border border-[#F0DDC5] flex items-center justify-center text-[#3A332C] hover:bg-[#FFF5E8] disabled:opacity-30 disabled:cursor-not-allowed transition font-black cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
