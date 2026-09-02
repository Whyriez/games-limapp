import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck() {
  const deck = [];
  let id = 1;
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      let value = i + 1; // A = 1, 2 = 2 ... 10 = 10, J = 11, Q = 12, K = 13
      let pointValue = value > 10 ? 10 : value;
      if (rank === "A") pointValue = 15; // Ace has high bonus in scoring
      deck.push({
        id: `card_${id++}`,
        suit,
        rank,
        value,
        pointValue,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check if a group of cards is a valid Set (3 or 4 cards with same rank, all different suits)
export function isValidSet(cards) {
  if (!cards || cards.length < 3 || cards.length > 4) return false;
  const firstRank = cards[0].rank;
  if (!cards.every((c) => c.rank === firstRank)) return false;
  const suits = new Set(cards.map((c) => c.suit));
  return suits.size === cards.length;
}

// Check if a group of cards is a valid Run / Seri (3 or more consecutive cards of same suit)
export function isValidRun(cards) {
  if (!cards || cards.length < 3) return false;
  const firstSuit = cards[0].suit;
  if (!cards.every((c) => c.suit === firstSuit)) return false;

  // Sort by rank value
  const sorted = [...cards].sort((a, b) => a.value - b.value);

  // Normal check: 1, 2, 3... or 10, 11, 12, 13
  let isNormalRun = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].value !== sorted[i].value + 1) {
      isNormalRun = false;
      break;
    }
  }
  if (isNormalRun) return true;

  // Ace-high check (e.g., Q, K, A -> 12, 13, 1)
  const hasAce = sorted.some((c) => c.rank === "A");
  if (hasAce) {
    const nonAces = sorted.filter((c) => c.rank !== "A");
    const highSorted = [...nonAces, { value: 14 }].sort((a, b) => a.value - b.value);
    let isHighRun = true;
    for (let i = 0; i < highSorted.length - 1; i++) {
      if (highSorted[i + 1].value !== highSorted[i].value + 1) {
        isHighRun = false;
        break;
      }
    }
    if (isHighRun) return true;
  }

  return false;
}

// Check if 7 cards can form a complete Remi hand (e.g. 3-card meld + 4-card meld)
export function checkIsRemiHand(hand) {
  if (!hand || hand.length !== 7) return false;

  // Try all combinations of 3 cards and remaining 4 cards
  const n = hand.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const group1 = [hand[i], hand[j], hand[k]];
        const group2 = hand.filter((_, idx) => idx !== i && idx !== j && idx !== k);

        const g1Valid = isValidSet(group1) || isValidRun(group1);
        const g2Valid = isValidSet(group2) || isValidRun(group2);

        if (g1Valid && g2Valid) {
          return {
            isRemi: true,
            meld1: group1,
            meld2: group2,
          };
        }
      }
    }
  }

  return { isRemi: false };
}

// Calculate deadwood score (unmelded card points)
export function calculateDeadwoodScore(hand) {
  if (!hand || hand.length === 0) return 0;
  return hand.reduce((sum, c) => sum + (c.pointValue || c.value || 5), 0);
}

export class RemiHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.score = 0;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 2) {
      return { error: "Minimal butuh 2 pemain aktif untuk bermain Remi" };
    }

    gameManager.clearAllTimers(room);

    const fullDeck = shuffleDeck(createDeck());
    const handSize = room.settings?.handSize || 7;

    room.playerHands = {};
    activePlayers.forEach((p) => {
      room.playerHands[p.socketId] = fullDeck.splice(0, handSize);
    });

    // 1 card for discard pile
    room.discardPile = [fullDeck.pop()];
    room.drawPile = fullDeck;

    const shuffledPlayers = [...activePlayers].sort(() => 0.5 - Math.random());
    room.turnOrder = shuffledPlayers.map((p) => p.socketId);
    room.currentTurnIndex = 0;
    room.roundNumber = 1;
    room.hasDrawnThisTurn = false;
    room.status = "PLAYING_PHASE";
    room.turnTimeLimit = room.settings?.turnTimeLimit || 30;
    room.lastGameOverData = null;

    const currentSocketId = room.turnOrder[0];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);
    room.currentTurnSocketId = currentSocketId;
    room.currentTurnPlayerId = currentPlayer?.playerId;
    room.currentTurnName = currentPlayer?.name;
    room.currentTurnEndsAt = Date.now() + (room.turnTimeLimit || 30) * 1000;

    this.broadcastGameState(room, io, gameManager);
    this.startTurn(room, io, gameManager);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let timeLimit = parseInt(newSettings.turnTimeLimit, 10) || 30;
    if (timeLimit < 15) timeLimit = 15;
    if (timeLimit > 60) timeLimit = 60;

    let handSize = parseInt(newSettings.handSize, 10) || 7;
    if (handSize !== 7 && handSize !== 10) handSize = 7;

    room.settings = {
      turnTimeLimit: timeLimit,
      handSize,
    };

    io.to(room.id).emit("room:settings_updated", room.settings);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  startTurn(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    const currentSocketId = room.turnOrder[room.currentTurnIndex % room.turnOrder.length];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);

    if (!currentPlayer || !currentPlayer.connected) {
      this.advanceToNextTurn(room, io, gameManager);
      return;
    }

    room.currentTurnSocketId = currentSocketId;
    room.currentTurnPlayerId = currentPlayer.playerId;
    room.currentTurnName = currentPlayer.name;
    room.hasDrawnThisTurn = false;

    const duration = room.turnTimeLimit || 30;
    const endsAt = Date.now() + duration * 1000;
    room.currentTurnEndsAt = endsAt;

    io.to(room.id).emit("remi:turn_change", {
      currentTurnSocketId: currentSocketId,
      currentTurnPlayerId: currentPlayer.playerId,
      currentTurnName: currentPlayer.name,
      endsAt,
      duration,
      drawPileCount: room.drawPile.length,
      topDiscardCard: room.discardPile[room.discardPile.length - 1],
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Handle automated play for Bot players
    if (currentPlayer.isBot) {
      const drawDelay = 1200 + Math.random() * 800;
      room.botTimerTimeout = setTimeout(() => {
        if (room.status !== "PLAYING_PHASE" || room.currentTurnSocketId !== currentSocketId) return;

        // Bot decides: draw from discard or deck
        let drawSource = "deck";
        const topDiscard = room.discardPile[room.discardPile.length - 1];
        const botHand = room.playerHands[currentSocketId] || [];
        if (topDiscard) {
          const matches = botHand.some(
            (c) => c.rank === topDiscard.rank || (c.suit === topDiscard.suit && Math.abs(c.value - topDiscard.value) <= 2)
          );
          if (matches && Math.random() > 0.3) {
            drawSource = "discard";
          }
        }

        this.drawCard(room, currentSocketId, drawSource, io, gameManager);

        const discardDelay = 1200 + Math.random() * 800;
        room.botTimerTimeout = setTimeout(() => {
          if (room.status !== "PLAYING_PHASE" || room.currentTurnSocketId !== currentSocketId) return;
          const updatedHand = room.playerHands[currentSocketId] || [];
          if (updatedHand.length === 0) return;

          // Check if bot can win (Tutup Remi)
          let bestDiscard = updatedHand[updatedHand.length - 1];
          let isWin = false;
          for (const card of updatedHand) {
            const remHand = updatedHand.filter((c) => c.id !== card.id);
            const meld = checkIsRemiHand(remHand);
            if (meld.isRemi) {
              bestDiscard = card;
              isWin = true;
              break;
            }
          }

          if (!isWin) {
            const rankCounts = {};
            updatedHand.forEach((c) => {
              rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
            });
            const isolated = updatedHand.filter((c) => rankCounts[c.rank] === 1);
            bestDiscard = isolated.length > 0 ? isolated[Math.floor(Math.random() * isolated.length)] : updatedHand[updatedHand.length - 1];
          }

          this.discardCard(room, currentSocketId, bestDiscard.id, isWin, io, gameManager);
        }, discardDelay);
      }, drawDelay);
      return;
    }

    room.turnTimerTimeout = setTimeout(() => {
      this.handleTurnTimeout(room, io, gameManager);
    }, duration * 1000);
  }


  handleTurnTimeout(room, io, gameManager) {
    const socketId = room.currentTurnSocketId;
    if (!socketId) return;

    // Auto-draw if not yet drawn
    if (!room.hasDrawnThisTurn) {
      this.drawCard(room, socketId, "deck", io, gameManager);
    }

    // Auto-discard the last card in hand
    const hand = room.playerHands[socketId] || [];
    if (hand.length > 0) {
      const lastCard = hand[hand.length - 1];
      this.discardCard(room, socketId, lastCard.id, false, io, gameManager);
    } else {
      this.advanceToNextTurn(room, io, gameManager);
    }
  }

  drawCard(room, socketId, source = "deck", io, gameManager) {
    if (room.status !== "PLAYING_PHASE") return { error: "Bukan fase permainan" };
    if (room.currentTurnSocketId !== socketId) return { error: "Bukan giliranmu" };
    if (room.hasDrawnThisTurn) return { error: "Kamu sudah menarik kartu giliran ini" };

    let drawnCard = null;

    if (source === "discard") {
      if (room.discardPile.length === 0) return { error: "Tumpukan buang kosong" };
      drawnCard = room.discardPile.pop();
    } else {
      // Draw from deck
      if (room.drawPile.length === 0) {
        // Reshuffle discard pile except top card
        if (room.discardPile.length > 1) {
          const topDiscard = room.discardPile.pop();
          room.drawPile = shuffleDeck(room.discardPile);
          room.discardPile = [topDiscard];
        } else {
          // No more cards, end game by lowest deadwood
          this.endGameByDeadwood(room, io, gameManager);
          return;
        }
      }
      drawnCard = room.drawPile.pop();
    }

    if (!drawnCard) return;

    if (!room.playerHands[socketId]) room.playerHands[socketId] = [];
    room.playerHands[socketId].push(drawnCard);
    room.hasDrawnThisTurn = true;

    // Unicast updated hand to drawer
    io.to(socketId).emit("remi:hand_updated", {
      hand: room.playerHands[socketId],
      drawnCard,
    });

    // Broadcast table state update
    io.to(room.id).emit("remi:table_updated", {
      drawPileCount: room.drawPile.length,
      topDiscardCard: room.discardPile[room.discardPile.length - 1] || null,
      drawerSocketId: socketId,
      source,
      playersHandCount: this.getPlayersHandCount(room),
    });
  }

  discardCard(room, socketId, cardId, isDeclareWin = false, io, gameManager) {
    if (room.status !== "PLAYING_PHASE") return { error: "Bukan fase permainan" };
    if (room.currentTurnSocketId !== socketId) return { error: "Bukan giliranmu" };
    if (!room.hasDrawnThisTurn) return { error: "Kamu harus menarik kartu terlebih dahulu" };

    const hand = room.playerHands[socketId] || [];
    const cardIndex = hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { error: "Kartu tidak ditemukan di tanganmu" };

    const [discardedCard] = hand.splice(cardIndex, 1);
    room.discardPile.push(discardedCard);

    // Unicast updated hand
    io.to(socketId).emit("remi:hand_updated", {
      hand,
    });

    // Check if player declared REMI WIN or if hand is fully melded
    if (isDeclareWin || hand.length === 7) {
      const meldResult = checkIsRemiHand(hand);
      if (meldResult.isRemi) {
        const winner = room.players.find((p) => p.socketId === socketId);
        this.endGame(room, winner, "TUTUP_REMI", meldResult, io, gameManager);
        return;
      }
    }

    // Broadcast table update
    io.to(room.id).emit("remi:table_updated", {
      drawPileCount: room.drawPile.length,
      topDiscardCard: discardedCard,
      playersHandCount: this.getPlayersHandCount(room),
    });

    this.advanceToNextTurn(room, io, gameManager);
  }

  advanceToNextTurn(room, io, gameManager) {
    room.currentTurnIndex++;
    this.startTurn(room, io, gameManager);
  }

  endGameByDeadwood(room, io, gameManager) {
    let minScore = Infinity;
    let winner = null;

    room.players.forEach((p) => {
      if (p.connected) {
        const hand = room.playerHands[p.socketId] || [];
        const score = calculateDeadwoodScore(hand);
        p.deadwoodScore = score;
        if (score < minScore) {
          minScore = score;
          winner = p;
        }
      }
    });

    this.endGame(room, winner, "DEADWOOD_LOWEST", null, io, gameManager);
  }

  endGame(room, winner, winType, meldResult, io, gameManager) {
    room.status = "GAME_OVER";
    gameManager.clearAllTimers(room);
    room.playerHands = room.playerHands || {};

    const summaryMessage =
      winType === "TUTUP_REMI"
        ? `🎉 REMI! Selamat kepada ${winner?.name || "Pemenang"} yang berhasil menyusun seluruh kartu menjadi kombinasi sempurna!`
        : `🃏 Dek Kartu Habis! Selamat kepada ${winner?.name || "Pemenang"} dengan nilai kartu sisa terendah (${winner?.deadwoodScore || 0} Poin)!`;

    room.players.forEach((p) => {
      const isWinner = winner && winner.playerId === p.playerId;
      const hand = room.playerHands?.[p.socketId] || [];
      const score = calculateDeadwoodScore(hand);

      updatePlayerGameResult({
        playerId: p.playerId,
        nickname: p.name,
        gameType: "remi",
        role: "PLAYER",
        isWinner,
        points: isWinner ? 100 : Math.max(0, 50 - score),
        wasVotedOut: false,
        mrWhiteGuessCorrect: false,
      });
    });

    const leaderboard = getLeaderboard();

    const gameOverPayload = {
      gameType: "remi",
      winnerRole: "REMI_WINNER",
      winnerName: winner?.name || "Pemenang",
      winnerSocketId: winner?.socketId,
      winType,
      summaryMessage,
      players: room.players.map((p) => {
        const pHand = room.playerHands?.[p.socketId] || [];
        const isWinner = winner && winner.playerId === p.playerId;
        return {
          socketId: p.socketId,
          playerId: p.playerId,
          name: p.name,
          isWinner,
          isAlive: true,
          hand: pHand,
          deadwoodScore: calculateDeadwoodScore(pHand),
          role: isWinner ? "Juara Remi 🏆" : "Pemain",
        };
      }),
      allPlayerHands: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        hand: room.playerHands?.[p.socketId] || [],
        deadwoodScore: calculateDeadwoodScore(room.playerHands?.[p.socketId] || []),
        isWinner: winner && winner.playerId === p.playerId,
      })),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  broadcastGameState(room, io, gameManager) {
    room.players.forEach((p) => {
      if (p.connected) {
        io.to(p.socketId).emit("remi:game_started", {
          hand: room.playerHands?.[p.socketId] || [],
          drawPileCount: room.drawPile ? room.drawPile.length : 0,
          topDiscardCard: room.discardPile ? room.discardPile[room.discardPile.length - 1] : null,
          playersHandCount: this.getPlayersHandCount(room),
          currentTurnSocketId: room.currentTurnSocketId,
          currentTurnPlayerId: room.currentTurnPlayerId,
          currentTurnName: room.currentTurnName,
          currentTurnEndsAt: room.currentTurnEndsAt,
          turnTimeLimit: room.turnTimeLimit || 30,
        });
      }
    });
  }

  syncState(room, socketId, io) {
    const hand = room.playerHands?.[socketId] || [];
    io.to(socketId).emit("remi:game_started", {
      hand,
      drawPileCount: room.drawPile ? room.drawPile.length : 0,
      topDiscardCard: room.discardPile ? room.discardPile[room.discardPile.length - 1] : null,
      playersHandCount: this.getPlayersHandCount(room),
      currentTurnSocketId: room.currentTurnSocketId,
      currentTurnPlayerId: room.currentTurnPlayerId,
      currentTurnName: room.currentTurnName,
      currentTurnEndsAt: room.currentTurnEndsAt,
      hasDrawnThisTurn: room.currentTurnSocketId === socketId ? room.hasDrawnThisTurn : false,
      turnTimeLimit: room.turnTimeLimit || 30,
    });
  }

  onPlayerDisconnect(room, socketId, io, gameManager) {
    if (room.status !== "PLAYING_PHASE") return;

    const connectedPlayers = room.players.filter((p) => p.connected && !p.isSpectator);
    if (connectedPlayers.length < 2) {
      this.endGame(room, null, "DISCONNECT_FEW_PLAYERS", null, io, gameManager);
      return;
    }

    if (room.currentTurnSocketId === socketId) {
      if (room.turnTimerTimeout) {
        clearTimeout(room.turnTimerTimeout);
        room.turnTimerTimeout = null;
      }
      if (room.botTimerTimeout) {
        clearTimeout(room.botTimerTimeout);
        room.botTimerTimeout = null;
      }
      this.advanceToNextTurn(room, io, gameManager);
    }
  }

  getPlayersHandCount(room) {
    const map = {};
    (room.players || []).forEach((p) => {
      map[p.socketId] = (room.playerHands?.[p.socketId] || []).length;
    });
    return map;
  }

  getReconnectData(room, player, socketId) {
    const hand = room.playerHands?.[socketId] || [];
    return {
      gameType: "remi",
      hand,
      drawPileCount: room.drawPile ? room.drawPile.length : 0,
      topDiscardCard: room.discardPile ? room.discardPile[room.discardPile.length - 1] : null,
      playersHandCount: this.getPlayersHandCount(room),
      currentTurnSocketId: room.currentTurnSocketId,
      currentTurnPlayerId: room.currentTurnPlayerId,
      currentTurnName: room.currentTurnName,
      currentTurnEndsAt: room.currentTurnEndsAt,
      hasDrawnThisTurn: room.hasDrawnThisTurn,
      gameOverData: room.status === "GAME_OVER" ? room.lastGameOverData : null,
    };
  }
}

