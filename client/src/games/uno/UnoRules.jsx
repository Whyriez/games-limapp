import React from "react";
import { Sparkles, Layers, ShieldCheck, Flame, RotateCcw, AlertTriangle } from "lucide-react";

export default function UnoRules() {
  return (
    <div className="space-y-4 text-left">
      {/* Intro Box */}
      <div className="p-4 bg-gradient-to-r from-[#FFF8EC] to-[#FAF6EE] border-2 border-[#F0DDC5] rounded-2xl shadow-xs">
        <h4 className="text-sm font-black text-[#3A332C] flex items-center gap-1.5 mb-1">
          <Sparkles className="w-4 h-4 text-[#FFA012]" />
          <span>Tujuan Utama Permainan</span>
        </h4>
        <p className="text-xs text-[#5A5044] leading-relaxed font-semibold">
          Jadilah pemain pertama yang berhasil <strong>menghabiskan seluruh kartu di tanganmu</strong> dengan mencocokkan kartu berdasarkan <strong>Warna</strong> atau <strong>Angka/Simbol</strong>!
        </p>
      </div>

      {/* Card Types Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
          Jenis Kartu & Fungsinya
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Number Cards */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#007AFF] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              0-9
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Angka (0–9)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Cocokkan dengan warna aktif atau angka yang sama di atas meja.
              </p>
            </div>
          </div>

          {/* Skip Card */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FF3B30] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              🚫
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Skip (Lewati)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Pemain giliran berikutnya kehilangan kesempatan bermain.
              </p>
            </div>
          </div>

          {/* Reverse Card */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#34C759] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              🔄
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Reverse (Putar Arah)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Membalikkan arah putaran giliran (searah ⇄ berlawanan).
              </p>
            </div>
          </div>

          {/* Draw 2 Card */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FFCC00] text-[#3A332C] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              +2
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Draw 2 (+2)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Pemain berikutnya wajib mengambil 2 kartu dan kehilangan giliran.
              </p>
            </div>
          </div>

          {/* Wild Card */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF3B30] via-[#FFCC00] to-[#007AFF] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              🌈
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Wild (Pilih Warna)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Bisa dimainkan kapan saja! Pemain bebas memilih warna baru.
              </p>
            </div>
          </div>

          {/* Wild Draw 4 Card */}
          <div className="p-3 bg-white border border-[#F0DDC5] rounded-xl shadow-xs flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#9D5CFF] via-[#FF3B30] to-[#FFCC00] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              +4
            </span>
            <div>
              <h5 className="text-xs font-black text-[#3A332C]">Kartu Wild Draw 4 (+4)</h5>
              <p className="text-[11px] text-[#8C8275] leading-tight">
                Pilih warna baru + pemain berikutnya mengambil 4 kartu & lewati giliran!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* UNO Shout Rule */}
      <div className="p-3.5 bg-[#FFF0ED] border-2 border-[#FFB2A1] rounded-2xl flex items-start gap-3 text-xs">
        <Flame className="w-5 h-5 text-[#E64B2D] shrink-0 mt-0.5" />
        <div className="text-[#3A332C]">
          <strong className="text-[#E64B2D]">Aturan Penting: Berteriak "UNO!"</strong>
          <p className="text-[11px] text-[#5A5044] mt-0.5 leading-normal">
            Saat kamu memainkan kartu hingga tersisa <strong>hanya 1 kartu</strong> di tangan, klik tombol <strong>"UNO!"</strong> untuk mendeklarasikan sisa kartumu!
          </p>
        </div>
      </div>
    </div>
  );
}
