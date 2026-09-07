import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Users, X, Crown, Skull, Eye, CheckCircle2, Bot } from "lucide-react";
import Avatar from "./Avatar";

export default function GameRosterModal({
  isOpen,
  onClose,
  players = [],
  hostId,
  currentSocketId,
  currentPlayerId,
  currentTurnSocketId,
  currentTurnPlayerId,
  gameType,
  container,
}) {
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

  const targetContainer =
    container ||
    (typeof document !== "undefined"
      ? document.fullscreenElement || document.body
      : null);

  if (!isOpen || !targetContainer) return null;

  const livingPlayers = players.filter((p) => p.isAlive && !p.isSpectator);
  const deadPlayers = players.filter((p) => !p.isAlive && !p.isSpectator);
  const spectators = players.filter((p) => p.isSpectator);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Floating Roster Modal Panel */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-2 sm:border-3 border-[#F6E6D0] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-pop-spring z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FFFBF5] to-[#FFF5E8] border-b-2 border-[#F6E6D0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#FFF8EC] text-[#D97E00] border border-[#FFA012] shrink-0 shadow-xs">
              <Users className="w-4 h-4 text-[#FFA012]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-[#3A332C]">
                  Daftar Pemain
                </h3>
                <span className="text-[10px] font-black bg-[#24A654] text-white px-2 py-0.2 rounded-full shadow-2xs">
                  {livingPlayers.length} Hidup
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#8C8275] font-semibold">
                Status seluruh peserta di ruangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8C8275] hover:text-[#3A332C] transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FFFDF9]">
          {/* Active / Living Players */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-[#8C8275] tracking-wider block">
              Pemain Aktif ({livingPlayers.length})
            </span>
            <div className="grid grid-cols-1 gap-2">
              {livingPlayers.map((player) => {
                const isMe = Boolean(
                  (player.socketId && currentSocketId && player.socketId === currentSocketId) ||
                  (player.playerId && currentPlayerId && player.playerId === currentPlayerId)
                );
                const isHostPlayer = Boolean(
                  (hostId && player.socketId === hostId) ||
                  (player.isHost)
                );
                const isTurn = Boolean(
                  (currentTurnSocketId && player.socketId === currentTurnSocketId) ||
                  (currentTurnPlayerId && player.playerId === currentTurnPlayerId)
                );

                return (
                  <div
                    key={player.socketId || player.playerId}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition ${
                      isTurn
                        ? "bg-[#FFF8EC] border-[#FFA012] shadow-xs"
                        : isMe
                        ? "bg-[#EFF8FF] border-[#8CD3FF]"
                        : "bg-white border-[#F0DDC5]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={player.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-[#3A332C] truncate">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-black text-[#1C8BE0] bg-[#DDF0FF] px-1.5 py-0.2 rounded-full border border-[#8CD3FF]">
                              Anda
                            </span>
                          )}
                          {player.isBot && (
                            <span className="text-[9px] font-black text-[#7B33ED] bg-[#F7F1FF] px-1.5 py-0.2 rounded-full border border-[#C9A0FF] flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5" /> Bot
                            </span>
                          )}
                          {isHostPlayer && (
                            <span className="text-[9px] font-black text-[#D97E00] bg-[#FFF8EC] px-1.5 py-0.2 rounded-full border border-[#FFA012] flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 text-[#FFA012]" /> Host
                            </span>
                          )}
                        </div>
                        {isTurn && (
                          <span className="text-[10px] font-black text-[#D97E00] animate-pulse">
                            Sedang Giliran
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-black text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#24A654]" />
                      Hidup
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dead / Eliminated Players */}
          {deadPlayers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#F0DDC5]">
              <span className="text-[11px] font-black uppercase text-[#E64B2D] tracking-wider block">
                Tereliminasi / Gugur ({deadPlayers.length})
              </span>
              <div className="grid grid-cols-1 gap-2">
                {deadPlayers.map((player) => (
                  <div
                    key={player.socketId || player.playerId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFF5E8] border border-[#F0DDC5] opacity-75"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 grayscale">
                      <Avatar name={player.name} size="xs" />
                      <span className="text-xs font-bold text-[#8C8275] line-through truncate">
                        {player.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#E64B2D] bg-[#FFF0ED] border border-[#FFB2A1] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Skull className="w-3 h-3" /> Gugur
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spectators */}
          {spectators.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#F0DDC5]">
              <span className="text-[11px] font-black uppercase text-[#8C8275] tracking-wider block">
                Penonton ({spectators.length})
              </span>
              <div className="grid grid-cols-1 gap-2">
                {spectators.map((player) => (
                  <div
                    key={player.socketId || player.playerId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFFBF5] border border-[#F0DDC5]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={player.name} size="xs" />
                      <span className="text-xs font-semibold text-[#8C8275] truncate">
                        {player.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#8C8275] bg-[#F6E6D0] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Eye className="w-3 h-3" /> Menonton
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FFFBF5] border-t border-[#F6E6D0] text-center text-[11px] font-bold text-[#8C8275]">
          Tekan <kbd className="px-1.5 py-0.5 bg-white border border-[#F0DDC5] rounded-md font-mono text-[10px]">Esc</kbd> untuk menutup
        </div>
      </div>
    </div>,
    targetContainer
  );
}
