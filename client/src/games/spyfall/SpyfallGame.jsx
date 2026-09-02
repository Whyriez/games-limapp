import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  Clock,
  Sparkles,
  Users,
  Compass,
  Check,
  X,
  Target,
  FastForward,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import Avatar from "../../components/Avatar";
import TimerDisplay from "../../components/TimerDisplay";

export default function SpyfallGame({
  room,
  socket,
  identity,
  nickname,
  myRoleData,
  isHost,
  isSpectator,
  isReadyConfirmed,
  readyStats,
  onMarkReady,
  onSendDiscussionMessage,
}) {
  const [excludedLocations, setExcludedLocations] = useState(new Set());
  const [showAccuseModal, setShowAccuseModal] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [showSpyGuessModal, setShowSpyGuessModal] = useState(false);
  const [selectedGuessLocation, setSelectedGuessLocation] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);

  const isSpy = Boolean(myRoleData?.isSpy);
  const allLocations = myRoleData?.allLocations || room?.allLocations || [];

  const toggleLocationExclusion = (locName) => {
    setExcludedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locName)) next.delete(locName);
      else next.add(locName);
      return next;
    });
  };

  const handleStartAccusation = (suspectSocketId) => {
    if (!room || !suspectSocketId) return;
    socket.emit("spyfall:accuse", {
      roomId: room.id,
      targetSocketId: suspectSocketId,
    });
    setShowAccuseModal(false);
  };

  const handleCastAccusationVote = (isAgree) => {
    if (!room) return;
    socket.emit("spyfall:vote", {
      roomId: room.id,
      isAgree,
    });
  };

  const handleSubmitSpyGuess = (locationName) => {
    if (!room || !locationName) return;
    socket.emit("spyfall:spy_guess", {
      roomId: room.id,
      locationName,
    });
    setShowSpyGuessModal(false);
  };

  const handleSkipInquiry = () => {
    if (!room) return;
    socket.emit("spyfall:skip_inquiry", {
      roomId: room.id,
    });
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !room) return;
    if (onSendDiscussionMessage) {
      onSendDiscussionMessage(chatInput.trim());
    }
    setChatInput("");
  };

  const activePlayers = (room?.players || []).filter((p) => p.connected && !p.isSpectator);
  const otherPlayers = activePlayers.filter((p) => p.socketId !== socket?.id);

  return (
    <div className="flex flex-col space-y-4 animate-pop-spring">
      {/* 1. SECRET IDENTITY & DIRECT ROLE MISSION CARD */}
      {myRoleData && (
        <div className="clay-card p-4 sm:p-6 shadow-md border-2 border-[#F6E6D0] bg-white relative overflow-hidden space-y-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-xs shrink-0 ${
                  isSpy
                    ? "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]"
                    : "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]"
                }`}
              >
                {isSpy ? <Eye className="w-8 h-8" /> : <MapPin className="w-8 h-8" />}
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      isSpy
                        ? "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]"
                        : "bg-[#EDFCF2] text-[#24A654] border-[#89EFA9]"
                    }`}
                  >
                    {isSpy ? "Penyusup Rahasia" : "Warga Lokasi"}
                  </span>
                  {!isSpy && myRoleData.locationCategory && (
                    <span className="text-[10px] font-bold text-[#8C8275]">
                      • {myRoleData.locationCategory}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#3A332C] mt-0.5">
                  {isSpy ? "AGEN RAHASIA (SPY)" : myRoleData.location}
                </h2>

                <p className="text-xs sm:text-sm font-extrabold text-[#D97E00] mt-0.5">
                  Peranmu: <span className="underline decoration-2">{myRoleData.role}</span>
                </p>
              </div>
            </div>

            {/* Memorize Ready Button */}
            {room?.status === "MEMORIZE_PHASE" && (
              <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onMarkReady}
                  disabled={isReadyConfirmed}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isReadyConfirmed
                      ? "bg-[#24A654] text-white cursor-default"
                      : "btn-3d-peach active:scale-95"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isReadyConfirmed ? "Sudah Hafal ✓" : "Saya Sudah Paham"}</span>
                </button>
                <span className="text-[11px] font-bold text-[#8C8275]">
                  Siap: {readyStats?.readyCount || 0} / {readyStats?.totalPlayers || activePlayers.length}
                </span>
              </div>
            )}
          </div>

          {/* Direct Role Play Guidance Banner */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border-2 text-xs space-y-1 ${
              isSpy
                ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#991B1B]"
                : "bg-[#F0FDF4] border-[#86EFAC] text-[#166534]"
            }`}
          >
            {isSpy ? (
              <div className="space-y-1">
                <div className="font-black flex items-center gap-1.5 text-[#E64B2D]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>🎯 CARA MAIN SPY: Anda TIDAK TAHU apa lokasinya!</span>
                </div>
                <p className="font-semibold leading-relaxed">
                  Dengarkan obrolan pemain lain, berpura-puralah tahu tempatnya, dan cocokkan dengan <strong>Papan Referensi Lokasi</strong> di bawah. Jika kamu sudah tahu lokasinya, klik tombol biru <strong>"Tebak Lokasi"</strong> untuk menang!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-black flex items-center gap-1.5 text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>🎯 CARA MAIN WARGA: Anda berada di "{myRoleData.location}"</span>
                </div>
                <p className="font-semibold leading-relaxed">
                  Tanyakan hal-hal terkait tempat ini ke pemain lain <em>(tanpa menyebut nama lokasinya langsung)</em>. Cari siapa yang jawabannya ngawur/bingung karena dia adalah <strong>SPY</strong>! Jika sudah yakin, klik tombol <strong>"Tuduh Seseorang"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. IN-GAME INQUIRY & ACTION CONTROLS */}
      {room?.status === "INQUIRY_PHASE" && (
        <div className="space-y-3">
          {/* Main Action Bar with Timer & Skip Button */}
          <div className="clay-card p-4 sm:p-5 shadow-xs bg-[#FFFBF5] border-2 border-[#F0DDC5] flex flex-col md:flex-row items-center justify-between gap-3.5">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2.5 bg-white rounded-2xl text-[#FFA012] border border-[#F0DDC5] shrink-0 shadow-xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
                    Sesi Tanya Jawab
                  </span>
                  {room?.inquiryEndsAt && (
                    <TimerDisplay endsAt={room.inquiryEndsAt} duration={room?.settings?.roundDurationMinutes * 60 || 180} />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#8C8275]">
                  Saling bertanya secara bergantian untuk mencari tahu siapa Spy-nya.
                </span>
              </div>
            </div>

            {/* Action Buttons: Accuse, Spy Guess, and Host Skip Timer */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              {/* Accuse Button for anyone */}
              <button
                type="button"
                onClick={() => setShowAccuseModal(true)}
                className="btn-3d-peach px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Target className="w-4 h-4" />
                <span>🎯 Tuduh Seseorang</span>
              </button>

              {/* Spy Guess Button for Spy */}
              {isSpy && (
                <button
                  type="button"
                  onClick={() => setShowSpyGuessModal(true)}
                  className="btn-3d-blue px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs animate-bounce"
                >
                  <MapPin className="w-4 h-4" />
                  <span>🗺️ Tebak Lokasi (Spy)</span>
                </button>
              )}

              {/* Skip Duration Fast Forward Button for Host */}
              {isHost && (
                <button
                  type="button"
                  onClick={handleSkipInquiry}
                  title="Lewati sisa waktu dan langsung buka voting akhir / tebakan spy"
                  className="py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-2xl bg-[#FFF8EC] hover:bg-[#FFEACD] border-2 border-[#FFA012] text-[#D97E00] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition"
                >
                  <FastForward className="w-3.5 h-3.5 text-[#FFA012]" />
                  <span>⚡ Lewati Waktu</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Quick Question Guide & Tips */}
          <div className="clay-card p-3 sm:p-4 bg-white border-2 border-[#F6E6D0] rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setShowQuestionGuide((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-black text-[#3A332C] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#FFA012]" />
                <span>💡 Bingung Mau Tanya Apa? Klik di sini untuk Contoh Pertanyaan & Trik!</span>
              </div>
              {showQuestionGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showQuestionGuide && (
              <div className="mt-3 pt-3 border-t border-[#F6E6D0] space-y-2 text-xs animate-pop-spring">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#334155]">
                  <div className="p-2.5 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5] space-y-1">
                    <span className="font-black text-[#D97E00] block">Contoh Pertanyaan Penguji:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#6E6254]">
                      <li>"Apakah orang biasanya memakai baju santai atau seragam di sini?"</li>
                      <li>"Apakah kamu datang ke tempat ini sendirian atau bareng keluarga?"</li>
                      <li>"Apakah tempat ini berisik atau cenderung hening?"</li>
                      <li>"Apakah orang perlu membayar tiket saat masuk ke tempat ini?"</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-[#EFF8FF] rounded-xl border border-[#8CD3FF] space-y-1">
                    <span className="font-black text-[#1C8BE0] block">Trik Bertahan Spy:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#0369A1]">
                      <li>Beri jawaban aman: "Tempatnya lumayan fleksibel sih", "Tergantung situasinya".</li>
                      <li>Coret lokasi yang tidak cocok di Papan Referensi di bawah.</li>
                      <li>Jika sudah tahu lokasinya, langsung klik "Tebak Lokasi" untuk menang!</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE LOCATION REFERENCE BOARD */}
      <div className="clay-card p-5 sm:p-6 shadow-sm border-2 border-[#F6E6D0] bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#F6E6D0]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EFF8FF] text-[#1C8BE0] border border-[#8CD3FF]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#3A332C] uppercase tracking-wider">
                Papan Referensi Lokasi ({allLocations.length})
              </h3>
              <p className="text-[10px] sm:text-xs font-semibold text-[#8C8275]">
                Klik lokasi untuk menandai/mencoret lokasi yang sudah kamu eliminasi!
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black text-[#D97E00] bg-[#FFF8EC] border border-[#FFA012]/40 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
            Taktil & Interaktif
          </span>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {allLocations.map((loc) => {
            const locName = typeof loc === "string" ? loc : loc.name;
            const isExcluded = excludedLocations.has(locName);

            return (
              <button
                key={locName}
                type="button"
                onClick={() => toggleLocationExclusion(locName)}
                className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[72px] cursor-pointer active:scale-95 ${
                  isExcluded
                    ? "bg-[#F3F4F6] border-[#D1D5DB] opacity-40 grayscale"
                    : "bg-[#FFFBF5] border-[#F0DDC5] hover:border-[#50B5FF] hover:bg-[#EFF8FF] shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={`text-xs font-black leading-tight ${
                      isExcluded ? "line-through text-[#9CA3AF]" : "text-[#3A332C]"
                    }`}
                  >
                    {locName}
                  </span>
                  {isExcluded ? (
                    <X className="w-3.5 h-3.5 text-[#E64B2D] shrink-0" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-[#50B5FF] shrink-0 opacity-75" />
                  )}
                </div>
                {loc.category && (
                  <span className="text-[9px] font-bold text-[#8C8275] mt-1 truncate">
                    {loc.category}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. INQUIRY LIVE CHAT */}
      <div className="clay-card p-4 sm:p-5 shadow-xs border-2 border-[#F6E6D0] bg-white space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
          <span className="text-xs font-black text-[#3A332C] uppercase tracking-wider">
            Obrolan & Catatan Interogasi
          </span>
        </div>

        <div className="max-h-[160px] overflow-y-auto space-y-2 p-2 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5]">
          {room?.discussionMessages && room.discussionMessages.length > 0 ? (
            room.discussionMessages.map((msg, idx) => (
              <div key={idx} className="text-xs flex items-baseline gap-1.5">
                <span className="font-black text-[#3A332C]">{msg.senderName}:</span>
                <span className="font-semibold text-[#8C8275]">{msg.text}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs font-bold text-[#8C8275]">
              Gunakan chat atau obrolan suara langsung untuk menginterogasi satu sama lain!
            </div>
          )}
        </div>

        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis pesan interogasi / catatan..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 min-w-0 clay-input px-3 py-2 text-xs font-semibold text-[#3A332C]"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="btn-3d-blue px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      </div>

      {/* MODAL 1: START ACCUSATION MODAL */}
      {showAccuseModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 max-w-md w-full m-auto bg-white space-y-4 border-2 border-[#F6E6D0] shadow-2xl animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2 text-[#E64B2D]">
                <Target className="w-5 h-5" />
                <h3 className="text-sm font-black text-[#3A332C] uppercase tracking-wider">
                  Pilih Siapa yang Ingin Kamu Tuduh!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccuseModal(false)}
                className="text-[#8C8275] hover:text-[#3A332C] font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8C8275] font-semibold">
              Jika kamu yakin seseorang adalah Agen Rahasia (Spy), pilih namanya. Semua pemain lain akan voting apakah mereka setuju!
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {otherPlayers.map((p) => (
                <button
                  key={p.socketId}
                  type="button"
                  onClick={() => setSelectedSuspectId(p.socketId)}
                  className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer ${
                    selectedSuspectId === p.socketId
                      ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#E64B2D]"
                      : "bg-[#FFFBF5] border-[#F0DDC5] hover:bg-[#FFF5E8] text-[#3A332C]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.name} size="sm" />
                    <span className="font-extrabold text-xs">{p.name}</span>
                  </div>
                  {selectedSuspectId === p.socketId && (
                    <Check className="w-4 h-4 text-[#E64B2D]" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAccuseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#F0DDC5] text-xs font-black text-[#8C8275] hover:text-[#3A332C] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selectedSuspectId}
                onClick={() => handleStartAccusation(selectedSuspectId)}
                className="flex-1 btn-3d-peach py-2.5 rounded-xl text-xs font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ajukan Tuduhan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: ACTIVE ACCUSATION VOTING MODAL */}
      {room?.status === "ACCUSATION_PHASE" && room?.activeAccusation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 max-w-md w-full m-auto bg-white space-y-4 border-2 border-[#FFA012] shadow-2xl animate-pop-spring">
            {/* Accusation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2 text-[#E64B2D]">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <h3 className="text-sm font-black text-[#3A332C] uppercase tracking-wider">
                  Tuduhan Sedang Diadili
                </h3>
              </div>
              {room.activeAccusation.endsAt && (
                <TimerDisplay endsAt={room.activeAccusation.endsAt} duration={30} />
              )}
            </div>

            {/* Accusation Narrative */}
            <div className="text-center space-y-1.5 p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5]">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#D97E00] block">
                Sidang Tuduhan Spy
              </span>
              <p className="text-sm font-extrabold text-[#3A332C]">
                <span className="text-[#1C8BE0] font-black">{room.activeAccusation.accuserName}</span>{" "}
                menuduh{" "}
                <span className="underline decoration-2 text-[#E64B2D] font-black">
                  {room.activeAccusation.suspectName}
                </span>{" "}
                adalah Agen Rahasia!
              </p>
            </div>

            {/* Voting States */}
            {(() => {
              const isSuspect = room.activeAccusation.suspectSocketId === socket?.id;
              const isAccuser = room.activeAccusation.accuserSocketId === socket?.id;
              const votes = room.activeAccusation.votes || {};
              const myVote = votes[socket?.id];
              const hasVoted = isAccuser || myVote !== undefined;
              const totalVoters = room.activeAccusation.totalVoters || Math.max(1, otherPlayers.length);
              const votedCount = room.activeAccusation.votedCount || Object.keys(votes).length || (isAccuser ? 1 : 0);

              if (isSuspect) {
                return (
                  <div className="p-4 bg-[#FFF8EC] rounded-2xl border-2 border-[#FFA012]/50 text-center space-y-2">
                    <span className="text-xs font-black text-[#D97E00] block">
                      ⚠️ Anda Sedang Dituduh!
                    </span>
                    <p className="text-xs text-[#8C8275] font-semibold">
                      Pemain lain sedang voting untuk menentukan apakah Anda adalah Spy.
                    </p>
                    <div className="pt-2 border-t border-[#FFA012]/30 flex items-center justify-center gap-2 text-xs font-black text-[#3A332C]">
                      <Users className="w-4 h-4 text-[#FFA012]" />
                      <span>{votedCount} dari {totalVoters} pemain telah voting</span>
                    </div>
                  </div>
                );
              }

              if (hasVoted) {
                const votedYes = isAccuser || myVote === true;
                return (
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-2xl border-2 text-center space-y-1.5 shadow-inner ${
                        votedYes
                          ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#E64B2D]"
                          : "bg-[#EFF8FF] border-[#8CD3FF] text-[#1C8BE0]"
                      }`}
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {isAccuser
                            ? "Anda Penuduh (Otomatis: Ya, Dia Spy!)"
                            : votedYes
                              ? "Suara Anda: Ya, Dia Spy!"
                              : "Suara Anda: Bukan Dia"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#3A332C]">
                        ✓ Suara Anda telah berhasil dicatat oleh server!
                      </p>
                    </div>

                    <div className="p-3 bg-[#FFFBF5] rounded-xl border border-[#F0DDC5] flex items-center justify-between text-xs font-bold text-[#8C8275]">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#FFA012]" />
                        <span>Progres Voting:</span>
                      </span>
                      <span className="font-black text-[#3A332C]">
                        {votedCount} / {totalVoters} Pemain
                      </span>
                    </div>

                    {!isAccuser && (
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleCastAccusationVote(!votedYes)}
                          className="text-[11px] font-bold text-[#8C8275] hover:text-[#3A332C] underline cursor-pointer"
                        >
                          Ubah pilihan suara saya
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <p className="text-xs text-center font-bold text-[#8C8275]">
                    Apakah Anda setuju bahwa <strong>{room.activeAccusation.suspectName}</strong> adalah Spy?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCastAccusationVote(true)}
                      className="btn-3d-peach py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Ya, Dia Spy!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCastAccusationVote(false)}
                      className="btn-3d-blue py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      <span>Bukan Dia</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#F0DDC5] flex items-center justify-between text-xs font-bold text-[#8C8275]">
                    <span>Pemain yang telah memilih:</span>
                    <span className="font-black text-[#3A332C]">{votedCount} / {totalVoters}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: SPY LOCATION GUESS MODAL */}
      {(showSpyGuessModal || room?.status === "SPY_GUESS_PHASE") && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] min-h-[100dvh] w-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="clay-card p-6 max-w-lg w-full m-auto bg-white space-y-4 border-2 border-[#50B5FF] shadow-2xl animate-pop-spring">
            <div className="flex items-center justify-between pb-2 border-b border-[#F6E6D0]">
              <div className="flex items-center gap-2 text-[#1C8BE0]">
                <MapPin className="w-5 h-5" />
                <h3 className="text-sm font-black text-[#3A332C] uppercase tracking-wider">
                  Tebak Nama Lokasi Rahasia
                </h3>
              </div>
              {room?.status !== "SPY_GUESS_PHASE" && (
                <button
                  type="button"
                  onClick={() => setShowSpyGuessModal(false)}
                  className="text-[#8C8275] hover:text-[#3A332C] font-black cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-xs text-[#8C8275] font-semibold">
              Pilih satu lokasi di bawah ini. Jika tebakanmu tepat, kamu (Spy) menang seketika! Jika salah, Warga yang menang!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto p-1">
              {allLocations.map((loc) => {
                const locName = typeof loc === "string" ? loc : loc.name;
                const isSelected = selectedGuessLocation === locName;

                return (
                  <button
                    key={locName}
                    type="button"
                    onClick={() => setSelectedGuessLocation(locName)}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#EFF8FF] border-[#50B5FF] text-[#1C8BE0] font-black shadow-xs"
                        : "bg-[#FFFBF5] border-[#F0DDC5] text-[#3A332C] font-bold hover:bg-[#FFF5E8]"
                    }`}
                  >
                    <span className="text-xs leading-tight block">{locName}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              {room?.status !== "SPY_GUESS_PHASE" && (
                <button
                  type="button"
                  onClick={() => setShowSpyGuessModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#F0DDC5] text-xs font-black text-[#8C8275] hover:text-[#3A332C] cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                disabled={!selectedGuessLocation}
                onClick={() => handleSubmitSpyGuess(selectedGuessLocation)}
                className="flex-1 btn-3d-blue py-3 rounded-xl text-xs font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                Kunci Jawaban ({selectedGuessLocation || "Pilih Lokasi"})
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
