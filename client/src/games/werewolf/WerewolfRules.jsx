import React from "react";
import { Moon, Sun, Sparkles, ShieldAlert, Eye, UserCheck, HelpCircle, HeartPulse, Compass } from "lucide-react";

export default function WerewolfRules() {
  return (
    <div className="space-y-4">
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFF0ED] text-[#E64B2D] rounded-xl border border-[#FFB2A1]">
            <Moon className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Aturan & Pembagian Peran Desa Serigala
          </h4>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-[#8C8275]">
          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#E64B2D]">
              <ShieldAlert className="w-4 h-4" />
              <span>Werewolf (Serigala)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Membuka mata di malam hari dan berunding bersama kawanan serigala untuk memilih 1 korban yang akan dimangsa. Di siang hari, berbaurlah dan jangan sampai dicurigai!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#9D5CFF]">
              <Eye className="w-4 h-4" />
              <span>Seer (Penerawang / Dukun)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Setiap malam dapat menerawang 1 pemain untuk mengetahui apakah dia adalah Serigala atau Warga Baik. Bimbing warga di siang hari tanpa membocorkan identitasmu secara ceroboh!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#24A654]">
              <HeartPulse className="w-4 h-4" />
              <span>Doctor (Dokter / Pengawal)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Setiap malam memilih 1 pemain untuk dilindungi. Jika targetmu diserang serigala malam itu, dia akan selamat dari kematian!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#1C8BE0]">
              <UserCheck className="w-4 h-4" />
              <span>Villager (Warga Desa)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Warga desa biasa yang tidak memiliki kekuatan malam. Berdiskusilah dengan jeli di siang hari dan gunakan hak suaramu untuk mengeksekusi serigala!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#EFF8FF] p-4 rounded-2xl border border-[#8CD3FF] text-[11px] sm:text-xs text-[#1C8BE0] font-semibold space-y-1.5">
        <div className="flex items-center gap-1.5 font-black text-[#1C8BE0]">
          <Sun className="w-3.5 h-3.5" />
          <span>Kondisi Kemenangan</span>
        </div>
        <p>
          <strong>Warga Desa Menang</strong> jika seluruh Serigala berhasil dieksekusi. <strong>Serigala Menang</strong> jika jumlah serigala yang masih hidup sama atau melebihi jumlah warga yang tersisa.
        </p>
      </div>
    </div>
  );
}
