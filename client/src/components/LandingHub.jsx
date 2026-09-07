import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getAvailableGames } from "../games/registry";
import Avatar from "./Avatar";
import {
  Sparkles,
  Users,
  Clock,
  LogIn,
  Gamepad2,
  Dice5,
  X,
  Flame,
  ArrowRight,
  Smartphone,
} from "lucide-react";

const RANDOM_NICKNAMES = [
  "Detektif Santai",
  "Agen Rahasia",
  "Kapten Kucing",
  "Penyelidik Cerdas",
  "Serigala Malam",
  "Ninja Bayangan",
  "Pelukis Ajaib",
  "Master Remi",
  "Kelinci Lincah",
  "Rubah Cerdik",
  "Elang Emas",
  "Panda Gemoy",
  "Ksatria Kopi",
  "Bintang Pesta",
  "Jagoan Mabar",
  "Sultan Rebahan",
  "Warga Teladan",
  "Mata-Mata Keren",
];

export default function LandingHub({
  nickname = "",
  onNicknameChange,
  roomId = "",
  onRoomIdChange,
  onRoomIdPaste,
  onCreateRoom,
  onJoinRoom,
  onSelectOfflineGame,
}) {
  const games = getAvailableGames();
  const [nameError, setNameError] = useState(false);
  const [pendingGameModal, setPendingGameModal] = useState(null); // game object if modal open
  const [modalInputName, setModalInputName] = useState("");
  const nameInputRef = useRef(null);

  const handleRandomizeName = (isModal = false) => {
    const randomName = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    if (isModal) {
      setModalInputName(randomName);
    } else {
      setNameError(false);
      onNicknameChange(randomName);
    }
  };

  const handleStartGameCreation = (game) => {
    const currentName = nickname.trim();
    if (!currentName) {
      // Pick a random default suggestion for the modal
      const defaultSuggested = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
      setModalInputName(defaultSuggested);
      setPendingGameModal(game);
      return;
    }
    onCreateRoom(game.id);
  };

  const handleModalSubmit = (e) => {
    if (e) e.preventDefault();
    const finalName = modalInputName.trim();
    if (!finalName) return;
    onNicknameChange(finalName);
    const targetGameId = pendingGameModal ? pendingGameModal.id : "undercover";
    setPendingGameModal(null);
    onCreateRoom(targetGameId);
  };

  const getGameCardStyle = (gameId) => {
    switch (gameId) {
      case "spyfall":
        return {
          bgIcon: "#FFF0ED",
          borderIcon: "#FFB2A1",
          textIcon: "#E64B2D",
          btnClass: "btn-3d-peach",
        };
      case "werewolf":
        return {
          bgIcon: "#F7F1FF",
          borderIcon: "#C9A0FF",
          textIcon: "#7B33ED",
          btnClass: "bg-[#7B33ED] text-white hover:bg-[#6825D4] shadow-md border-b-4 border-[#5219AC]",
        };
      case "drawguess":
        return {
          bgIcon: "#EDFCF2",
          borderIcon: "#89EFA9",
          textIcon: "#24A654",
          btnClass: "bg-[#24A654] text-white hover:bg-[#1E8A46] shadow-md border-b-4 border-[#166633]",
        };
      case "remi":
        return {
          bgIcon: "#FFF0ED",
          borderIcon: "#FFB2A1",
          textIcon: "#E64B2D",
          btnClass: "btn-3d-peach",
        };
      case "impostor":
        return {
          bgIcon: "#FFF0ED",
          borderIcon: "#FFB2A1",
          textIcon: "#FF4D4D",
          btnClass: "bg-[#FF4D4D] text-white hover:bg-[#E63939] shadow-md border-b-4 border-[#CC2B2B]",
        };
      default:
        return {
          bgIcon: "#EFF8FF",
          borderIcon: "#8CD3FF",
          textIcon: "#1C8BE0",
          btnClass: "btn-3d-blue",
        };
    }
  };

  return (
    <div className="w-full max-w-6xl xl:max-w-[1380px] mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-pop-spring">
      {/* 1. HERO & PROFILE BAR */}
      <div className="clay-card p-5 sm:p-7 shadow-lg border-2 border-[#F6E6D0] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Brand Identity & Avatar */}
          <div className="lg:col-span-4 flex items-center gap-3.5">
            <div className="shrink-0 p-1 bg-[#FFF8EC] rounded-full border-2 border-[#FFA012]/40 shadow-xs">
              <Avatar name={nickname || "Player"} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-[#24A654] bg-[#EDFCF2] border border-[#89EFA9] px-2 py-0.2 rounded-full">
                  Party Games Suite
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#3A332C] tracking-tight mt-0.5">
                Ruang Game Pesta
              </h1>
              <p className="text-xs text-[#8C8275] font-semibold mt-0.5">
                Pilih game di bawah untuk membuat ruangan baru!
              </p>
            </div>
          </div>

          {/* Middle: Nickname Input Form with Randomize Button */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-black text-[#3A332C] uppercase tracking-wider">
                Nickname / Nama Panggilan
              </label>
              <button
                type="button"
                onClick={() => handleRandomizeName(false)}
                className="text-[10px] font-black text-[#FFA012] hover:text-[#D97E00] flex items-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>🎲 Acak Nama</span>
              </button>
            </div>
            <div className="relative flex gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Ketik namamu (contoh: Budi Santai)"
                value={nickname}
                onChange={(e) => {
                  setNameError(false);
                  onNicknameChange(e.target.value);
                }}
                className={`flex-1 min-w-0 clay-input px-4 py-3 text-xs sm:text-sm text-[#3A332C] placeholder:text-[#8C8275] font-bold transition-all ${
                  nameError
                    ? "border-2 border-[#E64B2D] bg-[#FFF0ED] ring-2 ring-[#E64B2D]/30"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => handleRandomizeName(false)}
                title="Acak Nama Otomatis"
                className="px-3 py-3 rounded-2xl bg-[#FFF8EC] hover:bg-[#FFF2DE] border-2 border-[#FFA012]/40 text-[#D97E00] font-black text-xs flex items-center justify-center cursor-pointer transition shadow-2xs active:scale-95 shrink-0"
              >
                <Dice5 className="w-4 h-4" />
              </button>
            </div>
            {nameError && (
              <span className="block text-[10px] font-black text-[#E64B2D] mt-1">
                ⚠️ Silakan isi namamu terlebih dahulu!
              </span>
            )}
          </div>

          {/* Right: Quick Join Room Input */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-black text-[#3A332C] uppercase tracking-wider mb-1.5">
              Punya Kode Ruangan dari Teman?
            </label>
            <form onSubmit={onJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="4 DIGIT KODE / LINK"
                value={roomId}
                onPaste={onRoomIdPaste}
                onChange={(e) => onRoomIdChange(e.target.value)}
                className="flex-1 min-w-0 clay-input px-3.5 py-3 text-xs sm:text-sm font-mono text-center uppercase tracking-widest text-[#3A332C] placeholder:text-[#8C8275] placeholder:tracking-normal font-black"
              />
              <button
                type="submit"
                className="btn-3d-blue px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0 active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Gabung</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* QUICK OFFLINE PASS & PLAY PROMO BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#FFF8EC] via-[#FFF3DF] to-[#EFF8FF] border-2 border-[#FFA012]/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FFA012] flex items-center justify-center text-[#FFA012] shadow-2xs shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-[#D97E00] bg-[#FFF0DD] px-2 py-0.2 rounded-full border border-[#F6D0A0]">
                Fitur Baru 🎉
              </span>
              <span className="text-[10px] font-black text-[#1C8BE0] bg-[#EFF8FF] px-2 py-0.2 rounded-full border border-[#8CD3FF]">
                1 Perangkat / HP
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#3A332C] mt-0.5">
              Mau Main Undercover Bareng di 1 HP (Offline Pass & Play)?
            </h3>
            <p className="text-xs text-[#8C8275] font-semibold">
              Bisa main tanpa internet! Cukup oper HP bergantian untuk lihat kata rahasia & kalimat masing-masing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectOfflineGame && onSelectOfflineGame("undercover")}
          className="btn-3d-peach px-5 py-3 rounded-2xl text-xs sm:text-sm font-black text-white shadow-md flex items-center gap-2 cursor-pointer shrink-0 active:scale-95 transition"
        >
          <Smartphone className="w-4 h-4" />
          <span>Mulai Main Offline (1 HP)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. GAME CATALOG SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-[#3A332C] flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-[#50B5FF]" />
              <span>Pilih Game & Mulai Ruangan</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#8C8275] font-semibold mt-0.5">
              Klik salah satu game di bawah untuk membuat room langsung dengan game tersebut.
            </p>
          </div>
          <span className="text-xs font-black text-[#1C8BE0] bg-[#EFF8FF] border border-[#8CD3FF] px-3 py-1 rounded-full w-fit">
            {games.length} Game Pesta Siap Dimainkan
          </span>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
          {games.map((game) => {
            const Icon = game.icon || Sparkles;
            const style = getGameCardStyle(game.id);
            const isUndercover = game.id === "undercover";

            return (
              <div
                key={game.id}
                className="clay-card p-5 sm:p-6 shadow-md border-2 border-[#F6E6D0] bg-white flex flex-col justify-between space-y-4 relative group hover:border-[#50B5FF] transition-all hover:shadow-lg rounded-3xl"
              >
                <div className="space-y-3">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-2xs"
                      style={{
                        backgroundColor: style.bgIcon,
                        borderColor: style.borderIcon,
                        color: style.textIcon,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#3A332C]">
                      {game.fullName}
                    </h3>
                    <p className="text-[11px] font-bold text-[#FFA012] mt-0.5">
                      {game.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#8C8275] font-semibold leading-relaxed line-clamp-3">
                    {game.description}
                  </p>

                  {/* Metadata Specs */}
                  <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] flex items-center justify-around text-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-[#8C8275] block uppercase">Pemain</span>
                      <span className="font-black text-[#1C8BE0] flex items-center justify-center gap-0.5">
                        <Users className="w-3 h-3" />
                        <span>{game.minPlayers}-{game.maxPlayers}</span>
                      </span>
                    </div>
                    <div className="h-6 border-r border-[#F0DDC5]"></div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8C8275] block uppercase">Durasi</span>
                      <span className="font-black text-[#FFA012] flex items-center justify-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{game.duration}</span>
                      </span>
                    </div>
                    <div className="h-6 border-r border-[#F0DDC5]"></div>
                    <div>
                      <span className="text-[9px] font-bold text-[#8C8275] block uppercase">Kategori</span>
                      <span className="font-black text-[#24A654] text-[10px]">
                        {game.category}
                      </span>
                    </div>
                  </div>

                  {/* Tag Chips */}
                  <div className="flex flex-wrap gap-1">
                    {game.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-extrabold bg-[#FFF8EC] text-[#D97E00] px-2 py-0.5 rounded-md border border-[#F0DDC5]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Buttons Container */}
                <div className="space-y-2 pt-1">
                  {/* Create Room Button */}
                  <button
                    type="button"
                    onClick={() => handleStartGameCreation(game)}
                    className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 ${style.btnClass}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isUndercover ? "🌐 Main Online (Bikin Room)" : `Buat Ruangan ${game.name}`}</span>
                  </button>

                  {/* Special Offline Pass & Play for Undercover */}
                  {isUndercover && (
                    <button
                      type="button"
                      onClick={() => onSelectOfflineGame && onSelectOfflineGame("undercover")}
                      className="w-full py-2.5 rounded-2xl text-xs font-black bg-[#FFF8EC] hover:bg-[#FFF2DE] border-2 border-[#FFA012]/40 text-[#D97E00] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>📱 Main Offline (1 HP / Pass & Play)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK NAME ENTRY MODAL IF CLICKED WITHOUT NICKNAME */}
      {pendingGameModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-full flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 sm:p-7 max-w-md w-full m-auto bg-white border-2 border-[#FFA012] shadow-2xl rounded-3xl space-y-5 animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFF8EC] rounded-xl text-[#FFA012] border border-[#F0DDC5]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#3A332C]">
                    Mulai Ruangan {pendingGameModal.name}
                  </h3>
                  <p className="text-xs text-[#8C8275] font-semibold">
                    Ketik namamu atau acak otomatis di bawah!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGameModal(null)}
                className="p-1.5 rounded-full text-[#8C8275] hover:text-[#3A332C] hover:bg-[#FAF6EE] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black text-[#3A332C] uppercase tracking-wider">
                    Namamu di Game
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRandomizeName(true)}
                    className="text-[10px] font-black text-[#FFA012] hover:text-[#D97E00] flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>🎲 Acak Nama Baru</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Contoh: Budi Santai"
                    value={modalInputName}
                    onChange={(e) => setModalInputName(e.target.value)}
                    className="flex-1 min-w-0 clay-input px-4 py-3 text-sm font-bold text-[#3A332C] border-2 border-[#FFA012]/50 focus:border-[#FFA012]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRandomizeName(true)}
                    title="Acak Nama"
                    className="px-3.5 py-3 rounded-2xl bg-[#FFF8EC] hover:bg-[#FFF2DE] border-2 border-[#FFA012]/40 text-[#D97E00] font-black text-xs flex items-center justify-center cursor-pointer transition shadow-2xs shrink-0 active:scale-95"
                  >
                    <Dice5 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingGameModal(null)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black bg-[#FAF6EE] hover:bg-[#F2EDE1] text-[#8C8275] border border-[#E8DCCB] transition cursor-pointer active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!modalInputName.trim()}
                  className="flex-1 py-3.5 rounded-2xl text-xs sm:text-sm font-black btn-3d-peach text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Ruangan Sekarang!</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.fullscreenElement || document.body
      )}
    </div>
  );
}
