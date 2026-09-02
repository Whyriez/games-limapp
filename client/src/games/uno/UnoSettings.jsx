import React from "react";
import { Clock, Layers, ShieldCheck, Zap } from "lucide-react";

export default function UnoSettings({ settings = {}, onUpdateSettings, isHost = false }) {
  const timeLimit = settings.turnTimeLimit || 30;

  const handleTimeChange = (val) => {
    if (!isHost) return;
    onUpdateSettings({ ...settings, turnTimeLimit: parseInt(val, 10) });
  };

  return (
    <div className="space-y-4">
      {/* Turn Time Limit */}
      <div className="p-4 rounded-2xl bg-white border border-[#F0DDC5] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFA012]" />
            <span className="text-xs font-black text-[#3A332C]">Batas Waktu Giliran</span>
          </div>
          <span className="text-xs font-black text-[#FFA012] bg-[#FFF8EC] px-2 py-0.5 rounded-md border border-[#F0DDC5]">
            {timeLimit} Detik
          </span>
        </div>

        {isHost ? (
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[15, 30, 45, 60].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTimeChange(t)}
                className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  timeLimit === t
                    ? "bg-[#FFA012] text-white border-[#D97E00] shadow-xs"
                    : "bg-[#FAF6EE] text-[#8C8275] border-[#E8DCCB] hover:bg-[#F0EAE0]"
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#8C8275] font-semibold">
            Hanya Host yang dapat mengubah durasi giliran.
          </p>
        )}
      </div>

      <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E8DCCB] text-[11px] font-semibold text-[#8C8275] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#24A654] shrink-0" />
        <span>Sistem kartu resmi standar UNO 108 kartu aktif.</span>
      </div>
    </div>
  );
}
