import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Send, X, Smile, Eye, Sparkles } from "lucide-react";

const GAME_BANTER = {
  impostor: [
    "Di mana lokasinya? 📍",
    "Aku tadi di Medbay! 🧪",
    "Aku ngerjain tugas di Electrical ⚡",
    "Mencurigakan banget... 🤔",
    "Skip dulu aja kali ini! ⏭️",
    "Ada mayat guys! 💀",
  ],
  drawguess: [
    "Keren banget gambarnya! 🎨",
    "Hampir bener! 💡",
    "Ayo dikit lagi! 🔥",
    "Susah banget nebaknya 😂",
    "Pinter yang gambar! 👍",
  ],
  werewolf: [
    "Aku cuma warga biasa! 🧑‍🌾",
    "Seer, siapa yang dicek semalam? 🔮",
    "Ada yang diem-diem bae, sus! 👀",
    "Ayo bersuara jangan afk! 🗣️",
    "Vote dia aja, yakin serigala! 🐺",
  ],
  spyfall: [
    "Pertanyaan yang aneh... 🤔",
    "Saya tahu pasti lokasinya! 🗺️",
    "Apakah tempat ini berisik? 🔊",
    "Kamu agen rahasianya ya? 🕵️",
  ],
  undercover: [
    "Kata kunciku agak beda nih... 🧐",
    "Petunjukmu terlalu jelas! 🤫",
    "Pasti dia Mr. White! ⚪",
    "Vote yang paling mencurigakan! 🗳️",
  ],
  uno: [
    "Tinggal 1 kartu nih! 🎴",
    "Jangan kasih dia menang! 🛑",
    "Kena +4 nangis dah 😂",
    "UNO!! 🔥",
  ],
  remi: [
    "Sedikit lagi tutup remi! 🃏",
    "Siapa yang buang kartu enak? 😋",
    "Kombinasiku hampir lengkap! ✨",
  ],
};

export default function GameChatModal({
  isOpen,
  onClose,
  messages = [],
  currentSocketId,
  currentPlayerId,
  currentNickname,
  onSendMessage,
  activeGameType = "undercover",
  isAlive = true,
  isSpectator = false,
  container,
}) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;
  const banterChips = GAME_BANTER[activeGameType] || GAME_BANTER.undercover;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleChipClick = (chip) => {
    onSendMessage(chip);
  };

  const targetContainer =
    container ||
    (typeof document !== "undefined"
      ? document.fullscreenElement || document.body
      : null);

  if (!isOpen || !targetContainer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border-2 sm:border-3 border-[#F6E6D0] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-pop-spring z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FFFBF5] to-[#FFF5E8] border-b-2 border-[#F6E6D0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF] shrink-0 shadow-xs">
              <MessageSquare className="w-4 h-4 text-[#1C8BE0]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-[#3A332C]">
                  Obrolan Game
                </h3>
                <span className="text-[10px] font-black bg-[#50B5FF] text-white px-2 py-0.2 rounded-full shadow-2xs">
                  {messages.length}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#8C8275]">
                Bicara & berdiskusi strategi bersama
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-2xl bg-[#FFF5E8] hover:bg-[#FFE0D9] text-[#8C8275] hover:text-[#E64B2D] border border-[#F0DDC5] transition cursor-pointer active:scale-95 shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] bg-[#FFFDF9]/60">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8C8275]">
              <div className="p-3 bg-[#FFF5E8] rounded-full border border-[#F0DDC5] mb-2">
                <Smile className="w-6 h-6 text-[#FFA012]" />
              </div>
              <p className="text-xs sm:text-sm font-black text-[#3A332C]">
                Belum ada pesan obrolan
              </p>
              <p className="text-[11px] mt-0.5 max-w-[220px]">
                Gunakan obrolan ini untuk saling berinteraksi atau pilih pesan cepat di bawah!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe =
                (currentSocketId && msg.senderSocketId === currentSocketId) ||
                (currentPlayerId && msg.senderPlayerId === currentPlayerId) ||
                (currentNickname &&
                  msg.senderName?.trim().toLowerCase() ===
                    currentNickname.trim().toLowerCase());
              const isDeadSender = msg.isDead || msg.isSpectator;

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-black text-[#8C8275]">
                      {msg.senderName}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-bold bg-[#EFF8FF] text-[#1C8BE0] px-1.5 py-0.2 rounded-full border border-[#8CD3FF]">
                        Anda
                      </span>
                    )}
                    {isDeadSender && (
                      <span className="text-[9px] font-black bg-[#FFF0ED] text-[#E64B2D] px-1.5 py-0.2 rounded-full border border-[#FFB2A1] flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Hantu</span>
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold break-words shadow-2xs ${
                      isMe
                        ? "bg-gradient-to-r from-[#50B5FF] to-[#1C8BE0] text-white rounded-tr-xs"
                        : isDeadSender
                          ? "bg-[#FFF0ED] text-[#E64B2D] border border-[#FFB2A1] rounded-tl-xs"
                          : "bg-white text-[#3A332C] border-2 border-[#F6E6D0] rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-[#A69989] font-medium mt-0.5 px-1">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="px-3 py-2 bg-[#FFFBF5] border-t border-[#F6E6D0] flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <span className="text-[10px] font-black text-[#8C8275] uppercase shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#FFA012]" />
            <span>Cepat:</span>
          </span>
          {banterChips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white hover:bg-[#FFE8CC] text-[#D97E00] border border-[#F0DDC5] font-bold transition cursor-pointer active:scale-95 shrink-0 shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t-2 border-[#F6E6D0] flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              !isAlive && !isSpectator
                ? "Kirim pesan sebagai penonton/hantu..."
                : "Ketik pesan diskusi..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-w-0 clay-input px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#3A332C]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-3d-blue px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>,
    targetContainer
  );
}
