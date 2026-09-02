import React from "react";
import { Users, UserCheck, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

export default function UndercoverRules() {
  return (
    <div className="space-y-4">
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFF0DD] text-[#FFA012] rounded-xl border border-[#F6D0A0]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Aturan & Pembagian Peran
          </h4>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-[#8C8275]">
          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#24A654]">
              <UserCheck className="w-4 h-4" />
              <span>Civilian (Warga Sipil)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Menerima kata mayoritas yang sama. Berikan petunjuk yang halus untuk mengidentifikasi sesama warga tanpa membongkar kata rahasiamu ke penyusup!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#1C8BE0]">
              <Users className="w-4 h-4" />
              <span>Undercover (Penyusup)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Menerima kata yang sangat mirip dengan kata Civilian. Berbaurlah dengan warga dan berikan petunjuk yang seolah-olah kamu memiliki kata yang sama!
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#E64B2D]">
              <ShieldAlert className="w-4 h-4" />
              <span>Mr. White (Hantu Tanpa Kata)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Tidak menerima kata sama sekali. Simak baik-baik petunjuk pemain lain, tebak kata warga sipil saat tereliminasi untuk menang seketika!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#EFF8FF] p-4 rounded-2xl border border-[#8CD3FF] text-[11px] sm:text-xs text-[#1C8BE0] font-semibold space-y-1.5">
        <div className="flex items-center gap-1.5 font-black text-[#1C8BE0]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tips Kemenangan</span>
        </div>
        <p>
          Jangan berikan petunjuk yang terlalu gamblang (misal: menyebut huruf depan). Semakin samar tapi tetap masuk akal, semakin sulit penyusup menebak!
        </p>
      </div>
    </div>
  );
}
