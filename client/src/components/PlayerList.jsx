import { useState } from "react";
import Avatar from "./Avatar";
import {
  Users,
  Play,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { getGameMeta } from "../games/registry";

export default function PlayerList({
  players = [],
  hostId,
  currentSocketId,
  currentPlayerId,
  currentNickname,
  currentTurnSocketId,
  currentTurnPlayerId,
  status,
  gameType = "undercover",
  isHost,
  settings = {},
  discussionReadySocketIds = [],
  onStartGame,
  onUpdateSettings,
  onCancelGame,
  onAddBot,
  onRemoveBot,
}) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const aliveCount = players.filter((p) => p.isAlive && !p.isSpectator).length;
  const activeCount = players.filter((p) => p.connected).length;
  const spectatorCount = players.filter((p) => p.isSpectator).length;

  const gameMeta = getGameMeta(gameType);
  const minPlayersNeeded = gameMeta.minPlayers || 3;
  const canStart = activeCount >= minPlayersNeeded;
  const SettingsComponent = gameMeta.SettingsComponent;

  const isInGame = status && status !== "LOBBY" && status !== "GAME_OVER";

  return (
    <div className="space-y-4">
      {/* 1. Players List Card */}
      <div className="clay-card p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 bg-white border-2 border-[#F6E6D0]">
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b-2 border-[#F6E6D0]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF] shadow-xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
                Daftar Pemain ({players.length})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status !== "LOBBY" ? (
              <span className="text-[11px] bg-[#EDFCF2] text-[#24A654] font-extrabold px-3 py-1 rounded-full border border-[#89EFA9] shadow-xs">
                {aliveCount} Hidup
              </span>
            ) : (
              <span className="text-[11px] bg-[#EFF8FF] text-[#1C8BE0] font-extrabold px-3 py-1 rounded-full border border-[#8CD3FF] shadow-xs">
                {activeCount} Siap
              </span>
            )}

            {status === "LOBBY" && isHost && onAddBot && (
              <button
                type="button"
                onClick={onAddBot}
                title="Tambah Bot AI untuk bermain bersama"
                className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-[#FFF8EC] hover:bg-[#FFEACD] text-[#D97E00] border border-[#FFA012] transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>+ Bot AI</span>
              </button>
            )}

            {/* Mobile In-Game Collapse/Expand Toggle Button */}
            {isInGame && (
              <button
                type="button"
                onClick={() => setIsMobileExpanded((prev) => !prev)}
                className="md:hidden p-1.5 rounded-xl bg-[#FFF8EC] text-[#D97E00] border border-[#FFA012]/40 transition cursor-pointer"
                title={isMobileExpanded ? "Ciutkan Daftar" : "Buka Daftar"}
              >
                {isMobileExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Compact Mobile Strip when Collapsed during in-game */}
        {isInGame && !isMobileExpanded && (
          <div className="md:hidden flex items-center justify-between gap-2 py-1 px-2 rounded-xl bg-[#FFFBF5] border border-[#F0DDC5]">
            <div className="flex items-center -space-x-2 overflow-hidden py-1">
              {players.slice(0, 7).map((p) => (
                <div
                  key={p.playerId || p.socketId}
                  className="ring-2 ring-white rounded-full"
                >
                  <Avatar
                    name={p.name}
                    size="xs"
                    isAlive={!p.isSpectator && p.isAlive}
                  />
                </div>
              ))}
              {players.length > 7 && (
                <span className="w-6 h-6 rounded-full bg-[#FFF0ED] text-[#E64B2D] text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  +{players.length - 7}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileExpanded(true)}
              className="text-[11px] font-black text-[#1C8BE0] hover:underline shrink-0"
            >
              Lihat Detail ({players.length}) ↓
            </button>
          </div>
        )}

        {/* Players List Grid/Scroll - Always open on desktop, collapsible on mobile during active gameplay */}
        <div
          className={`py-1 sm:py-2 px-1 space-y-2 sm:space-y-2.5 overflow-y-auto max-h-[260px] sm:max-h-[340px] pr-1 box-border ${
            isInGame && !isMobileExpanded ? "hidden md:block" : "block"
          }`}
        >
          {players.map((player) => {
            const isMe = Boolean(
              (player.socketId && player.socketId === currentSocketId) ||
              (currentPlayerId &&
                player.playerId &&
                player.playerId === currentPlayerId) ||
              (currentNickname &&
                player.name &&
                player.name.trim().toLowerCase() ===
                  currentNickname.trim().toLowerCase()),
            );
            const isTurn =
              (player.socketId === currentTurnSocketId ||
                (currentTurnPlayerId &&
                  player.playerId === currentTurnPlayerId)) &&
              status === "CLUE_PHASE";
            const isPlayerHost = player.socketId === hostId;
            const isSpectating = !!player.isSpectator;

            return (
              <div
                key={player.playerId || player.socketId}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs flex items-center justify-between transition-all duration-200 border-2 box-border ${
                  isSpectating
                    ? "bg-[#FFFBF5] text-[#8C8275] border-[#E8DEC7] border-dashed"
                    : !player.isAlive
                      ? "bg-[#F7F2EB] text-[#A69989] border-[#E8DEC7] opacity-60"
                      : isTurn
                        ? "bg-[#FFF8EC] border-2 border-[#FFA012] text-[#3A332C] shadow-sm ring-2 ring-[#FFA012]/40 ring-inset"
                        : isMe
                          ? "bg-[#F0F8FF] border-2 border-[#50B5FF] text-[#3A332C] shadow-xs ring-1 ring-[#50B5FF]/30"
                          : "bg-[#FFFBF5] border-[#F0DDC5] text-[#3A332C] hover:border-[#D9C4AB] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <Avatar
                    name={player.name}
                    size="sm"
                    isHost={isPlayerHost}
                    isAlive={isSpectating ? true : player.isAlive}
                    isConnected={player.connected}
                    isCurrentTurn={isTurn}
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`font-extrabold text-xs sm:text-sm truncate ${!player.isAlive && !isSpectating ? "line-through text-[#A69989]" : "text-[#3A332C]"}`}
                      >
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] sm:text-[10px] font-black text-white bg-gradient-to-r from-[#50B5FF] to-[#1C8BE0] px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full shadow-xs tracking-wide shrink-0">
                          👤 Anda
                        </span>
                      )}
                      {player.isBot && (
                        <span className="text-[9px] sm:text-[10px] font-black text-[#7B33ED] bg-[#F7F1FF] border border-[#C9A0FF] px-2 py-0.2 rounded-full shadow-2xs tracking-wide shrink-0">
                          🤖 Bot
                        </span>
                      )}
                    </div>
                    {!player.connected && (
                      <span className="text-[10px] text-[#E64B2D] font-bold">
                        (Terputus...)
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSpectating && (
                    <span className="text-[10px] text-[#8C8275] bg-[#F7F2EB] border border-[#E8DEC7] px-2 py-0.5 rounded-full font-bold">
                      👁️ Menonton
                    </span>
                  )}
                  {!isSpectating &&
                    status === "DISCUSSION_PHASE" &&
                    player.isAlive &&
                    discussionReadySocketIds.includes(player.socketId) && (
                      <span className="text-[10px] text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-0.5">
                        <span>✓ Fix</span>
                      </span>
                    )}
                  {!isSpectating && isTurn && player.isAlive && (
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] bg-gradient-to-b from-[#FFA012] to-[#E68A00] text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-extrabold uppercase shadow-sm animate-pulse">
                      <Radio className="w-3 h-3" />
                      <span>Giliran</span>
                    </span>
                  )}
                  {!isSpectating && !player.isAlive && (
                    <span className="text-[10px] text-[#E64B2D] bg-[#FFF0ED] border border-[#FFB2A1] px-2 py-0.5 rounded-full font-bold uppercase">
                      Gugur
                    </span>
                  )}
                  {player.isBot && isHost && status === "LOBBY" && onRemoveBot && (
                    <button
                      type="button"
                      onClick={() => onRemoveBot(player.socketId)}
                      title="Hapus Bot"
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-[#FF4D4D] bg-[#FFF0ED] hover:bg-[#FFE0D9] border border-[#FFB2A1] transition cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Dynamic Game Settings (Only in LOBBY mode) */}
      {status === "LOBBY" && SettingsComponent && (
        <SettingsComponent
          settings={settings}
          activeCount={activeCount}
          isHost={isHost}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {/* 3. Host Start Game Control (Only in LOBBY mode) */}
      {status === "LOBBY" && (
        <div className="clay-card p-4 sm:p-5 shadow-sm space-y-3 bg-white border-2 border-[#F6E6D0]">
          {isHost ? (
            <div className="space-y-3">
              {canStart ? (
                <div className="flex items-center gap-1.5 text-xs font-black text-[#1C8BE0] bg-[#EFF8FF] p-2.5 rounded-xl border border-[#8CD3FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Pemain sudah siap ({activeCount}/{minPlayersNeeded})! Klik
                    tombol untuk memulai {gameMeta.name}:
                  </span>
                </div>
              ) : (
                <div className="text-center text-xs font-bold text-[#8C8275] py-2.5 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5] space-y-2">
                  <p>
                    ⏳ Butuh minimal <strong>{minPlayersNeeded} pemain</strong>{" "}
                    untuk memulai {gameMeta.name} (Sekarang: {activeCount}). Ajak
                    temanmu atau tambah Bot AI!
                  </p>
                  {isHost && onAddBot && (
                    <button
                      type="button"
                      onClick={onAddBot}
                      className="btn-3d-peach text-xs font-black px-3.5 py-1.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>+ Tambah Bot AI Cepat (+1)</span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${
                  canStart
                    ? "btn-3d-blue text-white ring-4 ring-[#50B5FF]/50 animate-pulse"
                    : "bg-[#FAF6EE] text-[#A69989] border-2 border-[#E8DEC7] opacity-60 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {canStart
                    ? `Mulai Game ${gameMeta.name}`
                    : `Mulai Game (Min. ${minPlayersNeeded} Pemain)`}
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center text-xs font-bold text-[#8C8275] py-2.5 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]">
              Menunggu Host memulai game {gameMeta.name}...
            </div>
          )}
        </div>
      )}

      {/* 4. Host In-Game Abort / Return to Lobby Control (Active In-Game Mode) */}
      {isInGame && isHost && onCancelGame && (
        <div className="clay-card p-4 sm:p-5 shadow-sm space-y-2 bg-[#FFFBF5] border-2 border-[#F0DDC5] animate-pop-spring">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#D97E00] flex items-center gap-1.5">
              <span>👑 Kontrol Host Ruangan</span>
            </span>
            <span className="text-[10px] font-bold text-[#8C8275] bg-white px-2 py-0.5 rounded-full border border-[#F0DDC5]">
              Game Sedang Jalan
            </span>
          </div>

          <p className="text-[11px] font-semibold text-[#8C8275] leading-snug">
            Salah klik mulai, ingin ganti game, atau mau tunggu teman lain join?
          </p>

          <button
            type="button"
            onClick={onCancelGame}
            className="w-full btn-3d-peach text-xs sm:text-sm font-black py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 text-[#E64B2D] border-2 border-[#FFB2A1]"
          >
            <StopCircle className="w-4 h-4 text-[#E64B2D]" />
            <span>Batalkan Permainan (Kembali ke Lobby)</span>
          </button>
        </div>
      )}
    </div>
  );
}
