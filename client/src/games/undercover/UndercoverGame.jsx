import React from "react";
import SecretCard from "../../components/SecretCard";
import ClueFeed from "../../components/ClueFeed";
import DiscussionBox from "../../components/DiscussionBox";
import VotingModal from "../../components/VotingModal";
import MrWhiteGuessModal from "../../components/MrWhiteGuessModal";

export default function UndercoverGame({
  room,
  socket,
  identity,
  nickname,
  myRoleData,
  isHost,
  isSpectator,
  isMyPlayerAlive,
  isMyTurn,
  currentTurnName,
  currentTurnSocketId,
  currentTurnPlayerId,
  clueInput,
  onClueInputChange,
  onSendClue,
  isReadyConfirmed,
  readyStats,
  onMarkReady,
  discussionEndsAt,
  isDiscussionReady,
  discussionReadyStats,
  onToggleDiscussionReady,
  onSendDiscussionMessage,
  onSkipDiscussionToVoting,
  votingCandidates,
  votingEndsAt,
  votedTarget,
  voteStats,
  onCastVote,
  mrWhiteGuessTarget,
  mrWhiteInput,
  onMrWhiteInputChange,
  onSubmitMrWhiteGuess,
}) {
  return (
    <div className="flex flex-col space-y-4">
      {/* 1. Secret Word Clay Card (During Memorize & In-Game) */}
      {myRoleData && room?.status !== "GAME_OVER" && (
        <SecretCard
          roleData={myRoleData}
          isMemorizePhase={room?.status === "MEMORIZE_PHASE"}
          isReady={isReadyConfirmed}
          readyCount={readyStats?.readyCount || 0}
          totalPlayers={readyStats?.totalPlayers || room?.players?.length || 0}
          onMarkReady={onMarkReady}
        />
      )}

      {/* 2. Phase-Specific Interaction Hub */}
      <div className="flex flex-col gap-5">
        {/* Discussion Phase */}
        {room?.status === "DISCUSSION_PHASE" && (
          <DiscussionBox
            clues={room?.clues || []}
            messages={room?.discussionMessages || []}
            isHost={isHost}
            isAlive={isMyPlayerAlive}
            isSpectator={isSpectator}
            endsAt={discussionEndsAt}
            isReady={isDiscussionReady}
            readyCount={discussionReadyStats?.readyCount || 0}
            totalAlive={discussionReadyStats?.totalAlive || 0}
            readySocketIds={discussionReadyStats?.readySocketIds || []}
            onToggleReady={onToggleDiscussionReady}
            onSendMessage={onSendDiscussionMessage}
            onSkipToVoting={onSkipDiscussionToVoting}
          />
        )}

        {/* Voting Phase */}
        {room?.status === "VOTING_PHASE" && (
          <VotingModal
            candidates={
              votingCandidates && votingCandidates.length > 0
                ? votingCandidates
                : (room?.players || [])
                    .filter((p) => p.isAlive)
                    .map((p) => ({
                      socketId: p.socketId,
                      playerId: p.playerId,
                      name: p.name,
                    }))
            }
            currentSocketId={socket?.id}
            isAlive={isMyPlayerAlive}
            votedTarget={votedTarget}
            votedCount={voteStats?.votedCount || 0}
            totalAlive={
              voteStats?.totalAlive ||
              (room?.players || []).filter((p) => p.isAlive).length
            }
            endsAt={votingEndsAt}
            onCastVote={onCastVote}
          />
        )}

        {/* Mr. White Guess Overlay */}
        {room?.status === "MR_WHITE_GUESS" && mrWhiteGuessTarget && (
          <MrWhiteGuessModal
            mrWhiteData={mrWhiteGuessTarget}
            isMrWhite={mrWhiteGuessTarget.mrWhiteSocketId === socket?.id}
            guessInput={mrWhiteInput}
            onGuessInputChange={onMrWhiteInputChange}
            onSubmitGuess={onSubmitMrWhiteGuess}
          />
        )}

        {/* Clue Turn Feed */}
        {room?.status !== "DISCUSSION_PHASE" &&
          room?.status !== "VOTING_PHASE" &&
          room?.status !== "MR_WHITE_GUESS" && (
            <ClueFeed
              clues={room?.clues || []}
              status={room?.status}
              roundNumber={room?.roundNumber || 1}
              isMyTurn={isMyTurn}
              currentTurnName={currentTurnName}
              clueInput={clueInput}
              onClueInputChange={onClueInputChange}
              onSubmitClue={onSendClue}
            />
          )}
      </div>
    </div>
  );
}
