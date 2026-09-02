import React from "react";
import {
  Compass,
  Eye,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Clock,
  Target,
  MessageSquare,
  Trophy,
} from "lucide-react";

export default function SpyfallRules() {
  return (
    <div className="space-y-4">
      {/* 1. CORE CONCEPT SUMMARY */}
      <div className="bg-[#FFFBF5] p-4.5 sm:p-5 rounded-2xl border-2 border-[#F0DDC5] space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFF0DD] text-[#FFA012] rounded-xl border border-[#F6D0A0]">
            <Compass className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
            Konsep Permainan Spyfall (Agen Rahasia)
          </h4>
        </div>
        <p className="text-xs text-[#6E6254] font-medium leading-relaxed">
          Semua pemain berada di satu <strong>Lokasi Rahasia yang Sama</strong> (misal: <em>Rumah Sakit, Kapal Pesiar, Bioskop</em>), <strong>KECUALI 1 pemain yang menjadi SPY (Mata-mata)</strong> yang tidak tahu tempatnya sama sekali!
        </p>

        {/* Roles Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Citizens */}
          <div className="p-3.5 bg-[#F0FDF4] rounded-2xl border-2 border-[#86EFAC] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-xs text-[#15803D]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Warga / Anggota Lokasi</span>
            </div>
            <p className="text-[11px] font-semibold text-[#166534] leading-relaxed">
              Tahu nama lokasi & peranmu. Bertanyalah ke pemain lain untuk membongkar siapa yang tidak tahu lokasinya, <strong>tanpa menyebut nama tempat secara terang-terangan!</strong>
            </p>
          </div>

          {/* Spy */}
          <div className="p-3.5 bg-[#FFF0ED] rounded-2xl border-2 border-[#FFB2A1] space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-xs text-[#E64B2D]">
              <Eye className="w-4 h-4" />
              <span>Agen Rahasia (Spy)</span>
            </div>
            <p className="text-[11px] font-semibold text-[#991B1B] leading-relaxed">
              <strong>TIDAK TAHU</strong> di mana kamu berada! Dengarkan obrolan, berikan jawaban yang aman/ambigu, dan tebak nama lokasi dari daftar papan referensi sebelum tertangkap.
            </p>
          </div>
        </div>
      </div>

      {/* 2. HOW TURNS & QUESTIONS WORK */}
      <div className="bg-[#EFF8FF] p-4.5 rounded-2xl border-2 border-[#8CD3FF] space-y-2.5">
        <div className="flex items-center gap-1.5 font-black text-xs text-[#1C8BE0]">
          <MessageSquare className="w-4 h-4" />
          <span>Cara Saling Bertanya (Contoh Pertanyaan Bagus)</span>
        </div>
        <p className="text-[11px] text-[#0369A1] font-semibold leading-relaxed">
          Pemain bebas bertanya secara bergiliran. Pertanyaan harus menguji situasi lokasi tapi tetap terselubung:
        </p>
        <div className="space-y-1.5 text-[11px] text-[#334155] bg-white/90 p-3 rounded-xl border border-[#BAE6FD]">
          <div className="flex items-start gap-2">
            <span className="text-[#1C8BE0] font-black">💬</span>
            <span><em>"Apakah kamu sering memakai seragam khusus saat berada di sini?"</em></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#1C8BE0] font-black">💬</span>
            <span><em>"Apakah tempat ini biasanya banyak didatangi anak-anak?"</em></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#1C8BE0] font-black">💬</span>
            <span><em>"Apakah tempat ini berada di dalam ruangan (indoor) atau luar ruangan (outdoor)?"</em></span>
          </div>
        </div>
      </div>

      {/* 3. HOW THE GAME ENDS & HOW TO WIN */}
      <div className="bg-[#FFF8EC] p-4 rounded-2xl border border-[#FFA012]/40 text-[11px] sm:text-xs text-[#D97E00] font-semibold space-y-2">
        <div className="flex items-center gap-1.5 font-black text-[#D97E00]">
          <Trophy className="w-3.5 h-3.5" />
          <span>3 Cara Permainan Selesai & Menang</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[#6E6254]">
          <li>
            <strong>Warga Menang:</strong> Berhasil menuduh Spy dengan voting suara terbanyak (atau waktu habis & Spy gagal menebak).
          </li>
          <li>
            <strong>Spy Menang (Tebakan Tepat):</strong> Spy menekan tombol <strong>"Tebak Lokasi"</strong> kapan saja dan tebakannya benar!
          </li>
          <li>
            <strong>Spy Menang (Warga Salah Tuduh):</strong> Jika Warga salah menuduh rekannya sendiri yang bukan Spy.
          </li>
        </ul>
      </div>
    </div>
  );
}
