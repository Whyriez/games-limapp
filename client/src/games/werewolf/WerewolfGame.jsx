import React, { useState, useEffect, useRef } from "react";
import Avatar from "../../components/Avatar";
import VotingModal from "../../components/VotingModal";
import TimerDisplay from "../../components/TimerDisplay";
import {
  Moon,
  Sun,
  Eye,
  HeartPulse,
  ShieldAlert,
  UserCheck,
  Check,
  X,
  AlertTriangle,
  Skull,
  Send,
  HelpCircle,
  Sparkles,
  FastForward,
  MessageSquare,
  Ghost,
  Clock,
  Users,
} from "lucide-react";

export default function WerewolfGame({
  room,
  socket,
  identity,
  nickname,
  myRoleData,
  isHost,
  isSpectator,
  isMyPlayerAlive,
  isReadyConfirmed,
  readyStats,
  onMarkReady,
  votingCandidates,
  votingEndsAt,
  votedTarget,
  voteStats,
  onCastVote,
  onSendDiscussionMessage,
}) {
  const [seerTarget, setSeerTarget] = useState(null);
  const [seerResult, setSeerResult] = useState(null);
  const [doctorTarget, setDoctorTarget] = useState(null);
  const [wolfTarget, setWolfTarget] = useState(null);
  const [wolfVotes, setWolfVotes] = useState({});
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  const role = myRoleData?.role || "VILLAGER";
  const isWerewolf = role === "WEREWOLF";
  const isSeer = role === "SEER";
  const isDoctor = role === "DOCTOR";
  const isVillager = role === "VILLAGER";

  const alivePlayers = (room?.players || []).filter((p) => p.isAlive && p.connected && !p.isSpectator);
  const otherAlivePlayers = alivePlayers.filter((p) => p.socketId !== socket?.id);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [room?.discussionMessages?.length]);

  // Listen to Werewolf specific socket unicasts
  useEffect(() => {
    if (!socket) return;

    const handleSeerResult = (data) => {
      setSeerResult(data);
    };

    const handlePackVote = (data) => {
      setWolfVotes(data.wolfVotes || {});
    };

    socket.on("werewolf:seer_result", handleSeerResult);
    socket.on("werewolf:pack_vote_update", handlePackVote);

    return () => {
      socket.off("werewolf:seer_result", handleSeerResult);
      socket.off("werewolf:pack_vote_update", handlePackVote);
    };
  }, [socket]);

  const handleSeerPeek = (targetSocketId) => {
    if (!isSeer || !room) return;
    setSeerTarget(targetSocketId);
    socket.emit("werewolf:seer_peek", { roomId: room.id, targetSocketId });
  };

  const handleDoctorProtect = (targetSocketId) => {
    if (!isDoctor || !room) return;
    setDoctorTarget(targetSocketId);
    socket.emit("werewolf:doctor_protect", { roomId: room.id, targetSocketId });
  };

  const handleWolfVote = (targetSocketId) => {
    if (!isWerewolf || !room) return;
    setWolfTarget(targetSocketId);
    socket.emit("werewolf:wolf_vote", { roomId: room.id, targetSocketId });
  };

  const handleSkipNight = () => {
    if (!room || !isHost) return;
    socket.emit("werewolf:skip_night", { roomId: room.id });
  };

  const handleSkipDay = () => {
    if (!room || !isHost) return;
    socket.emit("werewolf:skip_day", { roomId: room.id });
  };

  const handleSkipVoting = () => {
    if (!room || !isHost) return;
    socket.emit("werewolf:skip_voting", { roomId: room.id });
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !room) return;
    if (onSendDiscussionMessage) {
      onSendDiscussionMessage(chatInput.trim());
    }
    setChatInput("");
  };

  const handleQuickChip = (text) => {
    if (onSendDiscussionMessage) {
      onSendDiscussionMessage(text);
    }
  };

  const getRoleIcon = () => {
    if (isWerewolf) return <ShieldAlert className="w-8 h-8 text-[#E64B2D]" />;
    if (isSeer) return <Eye className="w-8 h-8 text-[#9D5CFF]" />;
    if (isDoctor) return <HeartPulse className="w-8 h-8 text-[#24A654]" />;
    return <UserCheck className="w-8 h-8 text-[#1C8BE0]" />;
  };

  const getRoleBadge = () => {
    if (isWerewolf) return "bg-[#FFF0ED] text-[#E64B2D] border-[#FFB2A1]";
    if (isSeer) return "bg-[#F7F1FF] text-[#7B33ED] border-[#C9A0FF]";
    if (isDoctor) return "bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]";
    return "bg-[#EFF8FF] text-[#1C8BE0] border-[#8CD3FF]";
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. SECRET ROLE IDENTITY CLAY CARD */}
      {myRoleData && (
        <div className="clay-card p-5 sm:p-7 shadow-md border-2 border-[#F6E6D0] bg-white animate-pop-spring relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-xs shrink-0 ${
                  isWerewolf
                    ? "bg-[#FFF0ED] border-[#FFB2A1]"
                    : isSeer
                      ? "bg-[#F7F1FF] border-[#C9A0FF]"
                      : isDoctor
                        ? "bg-[#F0FDF4] border-[#86EFAC]"
                        : "bg-[#EFF8FF] border-[#8CD3FF]"
                }`}
              >
                {getRoleIcon()}
              </div>

              <div className="flex flex-col text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getRoleBadge()}`}>
                    Peran Rahasiamu
                  </span>
                  {room?.status === "NIGHT_PHASE" && (
                    <span className="text-[10px] font-black bg-[#2D2A4A] text-[#C9A0FF] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      <span>Malam Hari</span>
                    </span>
                  )}
                  {room?.status === "DAY_PHASE" && (
                    <span className="text-[10px] font-black bg-[#FFF8EC] text-[#FFA012] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      <span>Siang Hari</span>
                    </span>
                  )}
                  {room?.status === "VOTING_PHASE" && (
                    <span className="text-[10px] font-black bg-[#FFF0ED] text-[#E64B2D] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Skull className="w-3 h-3" />
                      <span>Fase Voting</span>
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#3A332C] mt-0.5">
                  {role === "WEREWOLF"
                    ? "WEREWOLF (SERIGALA)"
                    : role === "SEER"
                      ? "SEER (PENERAWANG)"
                      : role === "DOCTOR"
                        ? "DOCTOR (DOKTER DESA)"
                        : "VILLAGER (WARGA DESA)"}
                </h2>

                {isWerewolf && myRoleData.teammates && myRoleData.teammates.length > 1 && (
                  <p className="text-[11px] font-bold text-[#E64B2D] mt-0.5">
                    Kawanan Serigala: {myRoleData.teammates.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Memorize Confirmation Button */}
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
                  <span>{isReadyConfirmed ? "Sudah Siap ✓" : "Saya Sudah Paham"}</span>
                </button>
                <span className="text-[11px] font-bold text-[#8C8275]">
                  Siap: {readyStats?.readyCount || 0} / {readyStats?.totalPlayers || alivePlayers.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. NIGHT PHASE INTERACTION SCREEN */}
      {room?.status === "NIGHT_PHASE" && (
        <div className="clay-card p-5 sm:p-7 shadow-lg border-2 border-[#5C5499] bg-[#231E3D] text-white space-y-5 rounded-3xl animate-pop-spring">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#5C5499]">
            <div className="flex items-center gap-2.5 text-[#FFA012]">
              <Moon className="w-5 h-5 text-[#C9A0FF] animate-pulse" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  🌙 Malam Hari (Putaran ke-{room.roundNumber || 1})
                </h3>
                <p className="text-xs text-[#B4ADDD]">
                  Aksi rahasia berlangsung dalam keheningan malam!
                </p>
              </div>
            </div>

            {/* Timer & Host Skip Night */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {room.nightEndsAt && <TimerDisplay endsAt={room.nightEndsAt} duration={25} />}
              {isHost && (
                <button
                  type="button"
                  onClick={handleSkipNight}
                  title="Lewati sisa waktu malam dan langsung sambut fajar"
                  className="bg-[#FFA012] hover:bg-[#E08A0A] text-white border-2 border-[#FFE3B3] px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>⚡ Lewati Malam</span>
                </button>
              )}
            </div>
          </div>

          {!isMyPlayerAlive ? (
            <div className="p-6 bg-[#332C59] rounded-2xl border border-[#5C5499] text-center space-y-2">
              <span className="text-sm font-black text-[#FFB2A1] block">
                👻 Anda Sudah Gugur (Arwah Menonton)
              </span>
              <p className="text-xs text-[#B4ADDD]">
                Sebagai arwah, Anda dapat menyaksikan aksi malam hari tanpa dapat ikut campur.
              </p>
            </div>
          ) : (
            <>
              {/* WEREWOLF ACTION */}
              {isWerewolf && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#FFB2A1]">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Pilih 1 Warga untuk Dimangsa Malam Ini:
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {otherAlivePlayers.map((p) => {
                      const isTarget = wolfTarget === p.socketId;
                      return (
                        <button
                          key={p.socketId}
                          type="button"
                          onClick={() => handleWolfVote(p.socketId)}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer ${
                            isTarget
                              ? "bg-[#E64B2D] border-[#FFA012] text-white shadow-md font-black"
                              : "bg-[#332C59] border-[#5C5499] text-[#EAE6FF] hover:bg-[#433B70]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar name={p.name} size="sm" />
                            <span className="text-xs">{p.name}</span>
                          </div>
                          {isTarget && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEER ACTION */}
              {isSeer && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#C9A0FF]">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Pilih 1 Pemain untuk Diterawang Identitasnya:
                    </span>
                  </div>

                  {seerResult ? (
                    <div className="p-4 bg-[#332C59] rounded-2xl border-2 border-[#C9A0FF] text-center space-y-1 animate-pop-spring">
                      <span className="text-xs font-bold text-[#C9A0FF]">
                        Hasil Terawangan Spiritual:
                      </span>
                      <h4 className="text-sm font-black text-white">
                        {seerResult.targetName} adalah:{" "}
                        <span className={seerResult.isWerewolf ? "text-[#FF7F66]" : "text-[#89EFA9]"}>
                          {seerResult.isWerewolf ? "🐺 SERIGALA (WEREWOLF)!" : "👤 BUKAN SERIGALA (WARGA BAIK)"}
                        </span>
                      </h4>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {otherAlivePlayers.map((p) => (
                        <button
                          key={p.socketId}
                          type="button"
                          onClick={() => handleSeerPeek(p.socketId)}
                          className={`p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer ${
                            seerTarget === p.socketId
                              ? "bg-[#7B33ED] border-[#FFA012] text-white shadow-md font-black"
                              : "bg-[#332C59] border-[#5C5499] text-[#EAE6FF] hover:bg-[#433B70]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar name={p.name} size="sm" />
                            <span className="text-xs">{p.name}</span>
                          </div>
                          {seerTarget === p.socketId && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCTOR ACTION */}
              {isDoctor && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#89EFA9]">
                    <HeartPulse className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Pilih 1 Pemain untuk Dilindungi Malam Ini:
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {alivePlayers.map((p) => (
                      <button
                        key={p.socketId}
                        type="button"
                        onClick={() => handleDoctorProtect(p.socketId)}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between transition cursor-pointer ${
                          doctorTarget === p.socketId
                            ? "bg-[#24A654] border-[#FFA012] text-white shadow-md font-black"
                            : "bg-[#332C59] border-[#5C5499] text-[#EAE6FF] hover:bg-[#433B70]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} size="sm" />
                          <span className="text-xs">{p.name} {p.socketId === socket?.id ? "(Diri Sendiri)" : ""}</span>
                        </div>
                        {doctorTarget === p.socketId && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VILLAGER WAITING */}
              {isVillager && (
                <div className="p-6 bg-[#332C59] rounded-2xl border border-[#5C5499] text-center space-y-2">
                  <span className="text-base font-black text-[#C9A0FF] block">
                    😴 Desa Sedang Tertidur Pulas
                  </span>
                  <p className="text-xs text-[#B4ADDD]">
                    Kamu adalah Warga Desa biasa. Tutup matamu dan berdoa semoga kamu selamat dari mangsa serigala semalam!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 3. DAY PHASE ANNOUNCEMENT & BUBBLE DISCUSSION */}
      {room?.status === "DAY_PHASE" && (
        <div className="space-y-4">
          {/* Morning Announcement Banner */}
          {room.dayAnnouncement && (
            <div
              className={`p-5 rounded-3xl border-2 shadow-sm animate-pop-spring flex items-center gap-3.5 ${
                room.dayAnnouncement.victim
                  ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#E64B2D]"
                  : "bg-[#EDFCF2] border-[#89EFA9] text-[#24A654]"
              }`}
            >
              <div className="p-3 bg-white rounded-2xl shrink-0 shadow-2xs">
                {room.dayAnnouncement.victim ? (
                  <Skull className="w-6 h-6 text-[#E64B2D]" />
                ) : (
                  <Sun className="w-6 h-6 text-[#24A654]" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider">
                  Pengumuman Fajar Pagi Hari
                </h4>
                <p className="text-xs sm:text-sm font-bold mt-0.5 text-[#3A332C]">
                  {room.dayAnnouncement.message}
                </p>
              </div>
            </div>
          )}

          {/* Upgraded Modern Pastel Bubble Discussion Box */}
          <div className="clay-card p-4 sm:p-6 shadow-sm border-2 border-[#F6E6D0] bg-white space-y-4">
            {/* Header with Title, Timer & Host Fast-Forward Skip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#F6E6D0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#FFF8EC] border-2 border-[#FFA012] text-[#D97E00] shadow-xs shrink-0">
                  <Sun className="w-5 h-5 text-[#FFA012]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#3A332C]">
                    Musyawarah Desa (Debat Warga)
                  </h3>
                  <p className="text-xs text-[#8C8275] font-semibold mt-0.5">
                    Diskusikan siapa yang mencurigakan sebelum voting eksekusi dimulai!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {room.dayDiscussionEndsAt && (
                  <TimerDisplay
                    endsAt={room.dayDiscussionEndsAt}
                    duration={room.settings?.dayDiscussionSeconds || 90}
                  />
                )}
                {isHost && (
                  <button
                    type="button"
                    onClick={handleSkipDay}
                    title="Lewati sisa waktu diskusi dan langsung buka voting"
                    className="btn-3d-peach px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>⚡ Buka Voting</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bubble Chat Stream */}
            <div
              ref={chatContainerRef}
              className="max-h-[260px] overflow-y-auto space-y-3 p-3.5 bg-[#FFFBF5] rounded-2xl border-2 border-[#F0DDC5] shadow-inner"
            >
              {room?.discussionMessages && room.discussionMessages.length > 0 ? (
                room.discussionMessages.map((msg, idx) => {
                  const isMe =
                    (identity?.playerId && msg.playerId && msg.playerId === identity.playerId) ||
                    (nickname && msg.senderName && msg.senderName.trim().toLowerCase() === nickname.trim().toLowerCase());
                  const isSpectatorMsg = !!msg.isSpectator;
                  const isDead = !msg.isSpectator && !msg.isAlive;

                  return (
                    <div
                      key={idx}
                      className={`flex gap-2.5 animate-pop-spring ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="shrink-0 mt-0.5">
                          <Avatar name={msg.senderName} size="xs" isAlive={!isDead} />
                        </div>
                      )}

                      <div className={`max-w-[78%] sm:max-w-[70%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black ${isMe ? "justify-end text-[#1C8BE0]" : "text-[#8C8275]"}`}>
                          <span>{isMe ? "Anda" : msg.senderName}</span>
                          {isDead && (
                            <span className="text-[9px] bg-[#FFF0ED] text-[#E64B2D] px-1.5 py-0.2 rounded-md border border-[#FFB2A1] flex items-center gap-0.5">
                              <Ghost className="w-2.5 h-2.5" />
                              <span>Arwah</span>
                            </span>
                          )}
                          {isSpectatorMsg && (
                            <span className="text-[9px] bg-[#FFF8EC] text-[#D97E00] px-1.5 py-0.2 rounded-md border border-[#FFA012]/40">
                              Penonton
                            </span>
                          )}
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed break-words shadow-2xs border-2 ${
                            isMe
                              ? "bg-[#EFF8FF] border-[#8CD3FF] text-[#1C8BE0] rounded-tr-xs"
                              : "bg-white border-[#F0DDC5] text-[#3A332C] rounded-tl-xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs font-bold text-[#8C8275] flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="w-8 h-8 text-[#D9C4AB] opacity-60" />
                  <p className="font-extrabold text-[#3A332C]">Belum ada pesan di musyawarah desa.</p>
                  <p className="text-[11px] text-[#8C8275]">
                    Mulai obrolan atau gunakan tombol saran argumen cepat di bawah!
                  </p>
                </div>
              )}
            </div>

            {/* Quick Werewolf Debate Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-smooth">
              {[
                "🔍 Ada yang mencurigakan...",
                "🛡️ Saya warga biasa asli!",
                "🔮 Seer, bagikan hasil terawangmu!",
                "❤️ Dokter, lindungi yang penting!",
                "⚖️ Dengarkan argumen dulu!",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickChip(chip)}
                  className="px-2.5 py-1 rounded-xl bg-[#FFFBF5] hover:bg-[#FFF5E8] border border-[#F0DDC5] hover:border-[#FFA012] text-[11px] font-bold text-[#8C8275] hover:text-[#3A332C] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik pendapatmu di musyawarah desa..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 min-w-0 clay-input px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#3A332C]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn-3d-blue px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. VOTING PHASE MODAL */}
      {room?.status === "VOTING_PHASE" && (
        <div className="space-y-3">
          {/* Host Fast-Forward Skip Voting Countdown Button */}
          {isHost && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSkipVoting}
                title="Lewati sisa waktu dan langsung hitung hasil voting"
                className="btn-3d-peach px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>⚡ Langsung Hitung Suara</span>
              </button>
            </div>
          )}

          <VotingModal
            candidates={votingCandidates || []}
            currentSocketId={socket?.id}
            isAlive={isMyPlayerAlive}
            votedTarget={votedTarget}
            votedCount={voteStats?.votedCount || 0}
            totalAlive={voteStats?.totalAlive || alivePlayers.length}
            endsAt={votingEndsAt}
            onCastVote={onCastVote}
          />
        </div>
      )}
    </div>
  );
}
