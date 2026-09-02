import React from "react";
import { Layers, Sparkles, Trophy, CheckCircle2, ArrowRight, Play } from "lucide-react";

export default function RemiRules() {
  return (
    <div className="space-y-4">
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFF0ED] text-[#E64B2D] rounded-xl border border-[#FFB2A1]">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Panduan & Aturan Kombinasi Game Remi
          </h4>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-[#8C8275]">
          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#1C8BE0]">
              <Layers className="w-4 h-4" />
              <span>1. Kombinasi Seri / Run (Urutan Kartu Corak Sama)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              3 atau lebih kartu dengan corak yang sama yang memiliki angka berurutan.
              <br />
              <span className="font-mono text-[#E64B2D] font-bold">Contoh:</span> <span className="font-mono font-bold bg-[#EFF8FF] px-1.5 py-0.5 rounded text-[#1C8BE0]">4♠ 5♠ 6♠</span> atau <span className="font-mono font-bold bg-[#FFF0ED] px-1.5 py-0.5 rounded text-[#E64B2D]">10❤️ J❤️ Q❤️ K❤️</span>.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#FFA012]">
              <Sparkles className="w-4 h-4" />
              <span>2. Kombinasi Set / Triple (Angka Sama Beda Corak)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              3 atau 4 kartu dengan angka yang sama tetapi dari corak yang berbeda.
              <br />
              <span className="font-mono text-[#FFA012] font-bold">Contoh:</span> <span className="font-mono font-bold bg-[#FFF8EC] px-1.5 py-0.5 rounded text-[#D97E00]">7❤️ 7♦️ 7♣️</span> atau <span className="font-mono font-bold bg-[#F7F1FF] px-1.5 py-0.5 rounded text-[#7B33ED]">K❤️ K♦️ K♣️ K♠️</span>.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#24A654]">
              <Play className="w-4 h-4" />
              <span>3. Alur Giliran Bermain</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              <strong>Langkah 1:</strong> Ambil 1 kartu dari <em>Tumpukan Tertutup</em> atau <em>Tumpukan Terbuka (Buangan)</em>.
              <br />
              <strong>Langkah 2:</strong> Susun kartu di tanganmu (gunakan tombol Auto-Sort).
              <br />
              <strong>Langkah 3:</strong> Buang 1 kartu yang tidak terpakai ke tumpukan buang.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#EDFCF2] p-4 rounded-2xl border border-[#89EFA9] text-[11px] sm:text-xs text-[#15803D] font-semibold space-y-1.5">
        <div className="flex items-center gap-1.5 font-black text-[#15803D]">
          <Trophy className="w-3.5 h-3.5" />
          <span>Kondisi Menang (Tutup Remi)</span>
        </div>
        <p>
          Pemain yang pertama kali berhasil menyusun seluruh 7 kartunya menjadi kombinasi valid (misal: 3 Seri + 4 Set) dapat mengklik <strong>"TUTUP REMI 🏆"</strong> saat membuang kartu untuk memenangkan ronde seketika!
        </p>
      </div>
    </div>
  );
}
