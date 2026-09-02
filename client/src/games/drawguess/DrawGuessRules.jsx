import React from "react";
import { Palette, Sparkles, Trophy, Clock, CheckCircle2, MessageSquare } from "lucide-react";

export default function DrawGuessRules() {
  return (
    <div className="space-y-4">
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#EFF8FF] text-[#1C8BE0] rounded-xl border border-[#8CD3FF]">
            <Palette className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Panduan Bermain Tebak Gambar (Draw & Guess)
          </h4>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-[#8C8275]">
          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#FFA012]">
              <Palette className="w-4 h-4" />
              <span>Sebagai Pelukis (Drawer)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Pilih 1 dari 3 kata rahasia yang diberikan. Gambar kata tersebut di kanvas interaktif sebaik mungkin. Jangan menuliskan huruf atau kata langsung di kanvas! Kamu mendapat poin bonus setiap ada pemain yang berhasil menebak.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#F0DDC5] space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-[#24A654]">
              <MessageSquare className="w-4 h-4" />
              <span>Sebagai Penebak (Guesser)</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
              Perhatikan goresan gambar di kanvas dan jumlah huruf (petunjuk blank <code className="font-mono bg-[#FFF5E8] px-1 py-0.2 rounded text-[#D97E00]">_ _ _ _</code>). Ketik tebakanmu langsung di kotak obrolan. Semakin cepat kamu menebak dengan tepat, semakin besar poin yang kamu dapatkan!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#FFF8EC] p-4 rounded-2xl border border-[#FFA012]/40 text-[11px] sm:text-xs text-[#D97E00] font-semibold space-y-1.5">
        <div className="flex items-center gap-1.5 font-black text-[#D97E00]">
          <Trophy className="w-3.5 h-3.5" />
          <span>Sistem Poin & Kemenangan</span>
        </div>
        <p>
          Penebak ke-1 mendapat +100 poin, ke-2 +80 poin, ke-3 +60 poin. Pelukis mendapat +35 poin untuk setiap penebak yang sukses. Pemain dengan akumulasi skor tertinggi setelah seluruh ronde selesai keluar sebagai juara!
        </p>
      </div>
    </div>
  );
}
