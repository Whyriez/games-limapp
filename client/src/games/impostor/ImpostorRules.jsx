import React from "react";
import { Rocket, Skull, ShieldAlert, CheckCircle2, Siren, Zap, Compass, Users } from "lucide-react";

export default function ImpostorRules() {
  return (
    <div className="space-y-4">
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFF0ED] text-[#FF4D4D] rounded-xl border border-[#FFB2A1]">
            <Rocket className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Panduan Bermain: Impostor Space Sabotage
          </h4>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-[#8C8275]">
          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#1C8BE0]">
              <CheckCircle2 className="w-4 h-4 text-[#1C8BE0]" />
              <span>Peran Crewmate (Astronot)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Berkelilinglah ke ruangan-ruangan kapal (*Electrical, Reactor, O2, Medbay, Navigation, Cafeteria*) untuk menyelesaikan mini-tasks interaktif. Laporkan mayat jika menemukan rekan yang gugur atau tekan Emergency Button di Cafeteria jika mencurigai seseorang!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#FF4D4D]">
              <Skull className="w-4 h-4 text-[#FF4D4D]" />
              <span>Peran Impostor (Penyusup)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Berbaur dan berpura-puralah mengerjakan task. Cari mangsa yang sendirian di ruangan sepi lalu tekan tombol <strong>Eliminate</strong>. Manfaatkan <strong>Ventilasi (Vent)</strong> untuk melarikan diri secara instan, dan picu <strong>Sabotase Kritis</strong> (Reactor / O2) untuk memecah konsentrasi kru!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#FFA012]">
              <Siren className="w-4 h-4 text-[#FFA012]" />
              <span>Emergency Meeting & Voting</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Saat alarm berbunyi, semua pemain dipanggil ke Kafetaria. Saling tanyakan alibi: *"Di mana lokasimu? Siapa yang tadi bareng kamu?"*. Lakukan voting untuk mengeluarkan tersangka atau pilih Skip jika bukti belum cukup kuat.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#EFF8FF] p-4 rounded-2xl border border-[#8CD3FF] text-[11px] sm:text-xs text-[#1C8BE0] font-semibold space-y-1.5">
        <div className="flex items-center gap-1.5 font-black text-[#1C8BE0]">
          <Compass className="w-3.5 h-3.5" />
          <span>Kondisi Kemenangan</span>
        </div>
        <p>
          🚀 <strong>Crewmate Menang:</strong> Berhasil mengeluarkan seluruh Impostor lewat voting, ATAU seluruh tugas kapal (Task Bar) mencapai 100%.
        </p>
        <p className="text-[#FF4D4D]">
          🔪 <strong>Impostor Menang:</strong> Jumlah Impostor menyamai/melebihi sisa Crewmate hidup, ATAU sabotase kritis gagal diperbaiki sebelum batas waktu habis!
        </p>
      </div>
    </div>
  );
}
