import React from "react";
import { createPortal } from "react-dom";
import Avatar from "./Avatar";
import {
  Skull,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Scale,
  X,
  Trophy,
  Eye,
  Moon,
  Compass,
} from "lucide-react";

export default function EliminationModal({ data, onClose }) {
  if (!data) return null;

  const isTie = !!data.isTie;
  const isGameOver = !!data.isGameOver;
  const { name, role, message, tiedCandidates = [] } = data;

  const roleStyles = {
    CIVILIAN: {
      border: "border-[#8CD3FF]",
      bgBadge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      roleTitle: "CIVILIAN (Warga Biasa)",
      desc: "Warga salah menuduh kawan sendiri! Satu Civilian gugur.",
      color: "text-[#1C8BE0]",
      icon: <HelpCircle className="w-5 h-5 text-[#1C8BE0]" />,
    },
    UNDERCOVER: {
      border: "border-[#FFB2A1]",
      bgBadge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      roleTitle: "UNDERCOVER (Penyusup)",
      desc: "Penyusup berhasil dibongkar dan dieliminasi oleh warga!",
      color: "text-[#E64B2D]",
      icon: <CheckCircle className="w-5 h-5 text-[#E64B2D]" />,
    },
    MR_WHITE: {
      border: "border-[#C9A0FF]",
      bgBadge: "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]",
      roleTitle: "MR. WHITE (Agen Buta)",
      desc: "Mr. White tereliminasi! Diberikan 1 peluang terakhir untuk menebak kata Civilian.",
      color: "text-[#7B33ED]",
      icon: <ShieldAlert className="w-5 h-5 text-[#7B33ED]" />,
    },
    SPY: {
      border: "border-[#FFB2A1]",
      bgBadge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      roleTitle: "AGEN RAHASIA (SPY)",
      desc: "Mata-mata berhasil dibongkar dan dieliminasi oleh warga!",
      color: "text-[#E64B2D]",
      icon: <Eye className="w-5 h-5 text-[#E64B2D]" />,
    },
    "AGEN RAHASIA (SPY)": {
      border: "border-[#FFB2A1]",
      bgBadge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      roleTitle: "AGEN RAHASIA (SPY)",
      desc: "Mata-mata berhasil dibongkar dan dieliminasi oleh warga!",
      color: "text-[#E64B2D]",
      icon: <Eye className="w-5 h-5 text-[#E64B2D]" />,
    },
    CITIZEN: {
      border: "border-[#8CD3FF]",
      bgBadge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      roleTitle: "WARGA LOKASI",
      desc: "Warga salah menuduh sesama warga!",
      color: "text-[#1C8BE0]",
      icon: <Compass className="w-5 h-5 text-[#1C8BE0]" />,
    },
    WEREWOLF: {
      border: "border-[#FFB2A1]",
      bgBadge: "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]",
      roleTitle: "WEREWOLF (Serigala)",
      desc: "Serigala berhasil dibongkar dan dieliminasi!",
      color: "text-[#E64B2D]",
      icon: <Moon className="w-5 h-5 text-[#E64B2D]" />,
    },
    VILLAGER: {
      border: "border-[#8CD3FF]",
      bgBadge: "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]",
      roleTitle: "WARGA DESA (Villager)",
      desc: "Warga desa yang tidak bersalah telah gugur!",
      color: "text-[#1C8BE0]",
      icon: <HelpCircle className="w-5 h-5 text-[#1C8BE0]" />,
    },
  };

  const style = isTie
    ? {
        border: "border-[#FFA012]",
        bgBadge: "bg-[#FFF8EC] text-[#D97E00] border-[#FFA012]",
        roleTitle: "HASIL SERI / TIE",
        desc: message || "Suara terbanyak seimbang. Tidak ada yang dieliminasi putaran ini.",
        color: "text-[#D97E00]",
        icon: <Scale className="w-5 h-5 text-[#D97E00]" />,
      }
    : roleStyles[role] || {
        border: "border-[#F0DDC5]",
        bgBadge: "bg-[#FFFBF5] text-[#3A332C] border-[#F0DDC5]",
        roleTitle: role || "Pemain Gugur",
        desc: message || "Pemain telah tereliminasi.",
        color: "text-[#3A332C]",
        icon: <Skull className="w-5 h-5 text-[#E64B2D]" />,
      };

  const modalContent = (
    <div className="fixed inset-0 z-[999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className={`clay-card w-full max-w-md m-auto rounded-[32px] p-6 sm:p-8 border-3 ${style.border} text-center shadow-2xl animate-pop-spring relative overflow-hidden bg-white`}>
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FFF5E8] transition cursor-pointer font-black"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isGameOver && (
          <div className="mb-2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1] text-xs font-black animate-bounce shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>Eliminasi Penentu Kemenangan!</span>
          </div>
        )}

        {isTie ? (
          /* ================= TIE VOTE RESULT ================= */
          <div className="space-y-4 pt-1">
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 rounded-3xl bg-[#FFF8EC] border-2 border-[#FFA012] text-[#D97E00] shadow-sm mb-2">
                <Scale className="w-10 h-10 text-[#D97E00]" />
              </div>
              <span className="text-xs font-black tracking-wider uppercase text-[#D97E00]">
                Hasil Voting: Putaran Seri
              </span>
              <h2 className="text-2xl font-black text-[#3A332C] tracking-tight mt-1">
                Tidak Ada Eliminasi
              </h2>
            </div>

            {tiedCandidates.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                {tiedCandidates.map((cName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#FFFBF5] px-3.5 py-1.5 rounded-full border-2 border-[#FFA012]/40 shadow-xs"
                  >
                    <Avatar name={cName} size="xs" />
                    <span className="text-xs font-black text-[#3A332C]">{cName}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5] text-center space-y-2 shadow-inner">
              <p className="text-xs sm:text-sm text-[#3A332C] leading-relaxed font-bold">
                {message || "Suara terbanyak imbang, maka tidak ada pemain yang keluar. Putaran petunjuk akan dilanjutkan!"}
              </p>
            </div>
          </div>
        ) : (
          /* ================= ELIMINATED PLAYER RESULT ================= */
          <div className="pt-1">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative mb-2">
                <Avatar name={name} size="xl" isAlive={false} />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-[#FF7F66] to-[#F56447] text-white p-1.5 rounded-full border-2 border-white shadow-md">
                  <Skull className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs font-extrabold tracking-wider uppercase text-[#E64B2D] mt-1">
                Hasil Voting: Pemain Tereliminasi
              </span>
              <h2 className="text-2xl font-extrabold text-[#3A332C] tracking-tight mt-0.5">
                {name}
              </h2>
            </div>

            {/* Role Reveal Card */}
            <div className="my-5 p-4 bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5] text-center space-y-2 shadow-inner">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Peran Sebenarnya
              </span>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-extrabold text-sm uppercase tracking-wide ${style.bgBadge}`}>
                {style.icon}
                <span>{style.roleTitle}</span>
              </div>
              <p className="text-xs text-[#3A332C] leading-relaxed pt-1 font-semibold">
                {message || style.desc}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 pt-2 flex items-center justify-center">
          <button
            onClick={onClose}
            className={`w-full ${isGameOver ? "btn-3d-green" : "btn-3d-blue"} text-sm font-black py-4 px-6 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95`}
          >
            <span>
              {isGameOver
                ? "Lihat Hasil Pertandingan"
                : isTie
                  ? "Lanjut Putaran Petunjuk"
                  : "Lanjut Permainan"}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
