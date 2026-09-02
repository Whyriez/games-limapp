import { updatePlayerGameResult, getLeaderboard } from "../../db.js";

const COLORS = ["red", "yellow", "green", "blue"];

export function createUnoDeck() {
  const deck = [];
  let cardIdCounter = 1;

  COLORS.forEach((color) => {
    // 1 card of 0
    deck.push({
      id: `uno_${cardIdCounter++}`,
      color,
      type: "number",
      value: 0,
      score: 0,
    });

    // 2 cards each of 1-9
    for (let num = 1; num <= 9; num++) {
      deck.push({
        id: `uno_${cardIdCounter++}`,
        color,
        type: "number",
        value: num,
        score: num,
      });
      deck.push({
        id: `uno_${cardIdCounter++}`,
        color,
        type: "number",
        value: num,
        score: num,
      });
    }

    // 2 cards each of Skip, Reverse, Draw 2 (+2)
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `uno_${cardIdCounter++}`,
        color,
        type: "skip",
        value: "skip",
        score: 20,
      });
      deck.push({
        id: `uno_${cardIdCounter++}`,
        color,
        type: "reverse",
        value: "reverse",
        score: 20,
      });
      deck.push({
        id: `uno_${cardIdCounter++}`,
        color,
        type: "draw2",
        value: "+2",
        score: 20,
      });
    }
  });

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `uno_${cardIdCounter++}`,
      color: "wild",
      type: "wild",
      value: "wild",
      score: 50,
    });
  }

  // 4 Wild Draw 4 (+4) cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `uno_${cardIdCounter++}`,
      color: "wild",
      type: "wild4",
      value: "+4",
      score: 50,
    });
  }

  return deck;
}

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function isCardPlayable(card, activeColor, topCard) {
  if (!card) return false;
  // Wild cards can always be played
  if (card.color === "wild" || card.type === "wild" || card.type === "wild4") {
    return true;
  }
  // Match active color
  if (card.color === activeColor) {
    return true;
  }
  // Match number
  if (card.type === "number" && topCard && topCard.type === "number" && card.value === topCard.value) {
    return true;
  }
  // Match action symbol (e.g. skip on skip, +2 on +2)
  if (topCard && card.type === topCard.type && card.type !== "number") {
    return true;
  }
  return false;
}

export class UnoHandler {
  constructor() {}

  initGame(room, io, gameManager) {
    room.players.forEach((p) => {
      p.isAlive = p.connected;
      p.isSpectator = false;
      p.score = 0;
      p.calledUno = false;
    });

    const activePlayers = room.players.filter((p) => p.connected);
    if (activePlayers.length < 2) {
      return { error: "Minimal butuh 2 pemain aktif untuk bermain UNO" };
    }

    gameManager.clearAllTimers(room);

    let fullDeck = shuffleDeck(createUnoDeck());
    const handSize = 7;

    room.playerHands = {};
    activePlayers.forEach((p) => {
      room.playerHands[p.socketId] = fullDeck.splice(0, handSize);
    });

    // Pick top card that is NOT a Wild Draw 4 for clean start
    let initialTopCard = fullDeck.pop();
    while (initialTopCard.type === "wild4") {
      fullDeck.unshift(initialTopCard);
      fullDeck = shuffleDeck(fullDeck);
      initialTopCard = fullDeck.pop();
    }

    room.discardPile = [initialTopCard];
    room.drawPile = fullDeck;
    room.activeColor = initialTopCard.color === "wild" ? COLORS[Math.floor(Math.random() * COLORS.length)] : initialTopCard.color;

    const shuffledPlayers = [...activePlayers].sort(() => 0.5 - Math.random());
    room.turnOrder = shuffledPlayers.map((p) => p.socketId);
    room.currentTurnIndex = 0;
    room.turnDirection = 1; // 1 = clockwise, -1 = counter-clockwise
    room.status = "PLAYING_PHASE";
    room.turnTimeLimit = room.settings?.turnTimeLimit || 30;
    room.hasDrawnThisTurn = false;
    room.drawnCardId = null;
    room.lastActionAlert = null;
    room.unoAlert = null;
    room.lastGameOverData = null;

    const currentSocketId = room.turnOrder[0];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);
    room.currentTurnSocketId = currentSocketId;
    room.currentTurnPlayerId = currentPlayer?.playerId;
    room.currentTurnName = currentPlayer?.name;
    room.currentTurnEndsAt = Date.now() + (room.turnTimeLimit || 30) * 1000;

    // Handle if initial card is an action card
    if (initialTopCard.type === "skip") {
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
      room.lastActionAlert = `🚫 Kartu awal SKIP! Giliran ${currentPlayer?.name} dilewati.`;
    } else if (initialTopCard.type === "reverse") {
      if (room.turnOrder.length === 2) {
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
      } else {
        room.turnDirection = -1;
        room.currentTurnIndex = (room.turnOrder.length - 1);
      }
      room.lastActionAlert = `🔄 Kartu awal REVERSE! Arah putaran dibalik.`;
    } else if (initialTopCard.type === "draw2") {
      const topP = room.players.find((p) => p.socketId === room.turnOrder[0]);
      if (topP) {
        const dCards = this.drawFromDeck(room, 2);
        room.playerHands[topP.socketId].push(...dCards);
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
        room.lastActionAlert = `📥 Kartu awal DRAW 2! ${topP.name} menarik 2 kartu dan dilewati.`;
      }
    }

    this.broadcastGameState(room, io, gameManager);
    this.startTurn(room, io, gameManager);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    return { room: gameManager.getSanitizedRoom(room.id) };
  }

  drawFromDeck(room, count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (room.drawPile.length === 0) {
        // Recycle discard pile
        if (room.discardPile.length > 1) {
          const topCard = room.discardPile.pop();
          room.drawPile = shuffleDeck(room.discardPile);
          room.discardPile = [topCard];
        } else {
          // No more cards available to recycle
          break;
        }
      }
      if (room.drawPile.length > 0) {
        drawn.push(room.drawPile.pop());
      }
    }
    return drawn;
  }

  updateSettings(room, socketId, newSettings, io, gameManager) {
    if (room.status !== "LOBBY") return;
    if (room.hostId !== socketId) return;

    let timeLimit = parseInt(newSettings.turnTimeLimit, 10) || 30;
    if (timeLimit < 15) timeLimit = 15;
    if (timeLimit > 60) timeLimit = 60;

    room.settings = {
      turnTimeLimit: timeLimit,
      stackDrawCards: newSettings.stackDrawCards === true,
      drawUntilMatch: newSettings.drawUntilMatch === true,
    };

    io.to(room.id).emit("room:settings_updated", room.settings);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  startTurn(room, io, gameManager) {
    gameManager.clearAllTimers(room);

    const len = room.turnOrder.length;
    const currentSocketId = room.turnOrder[((room.currentTurnIndex % len) + len) % len];
    const currentPlayer = room.players.find((p) => p.socketId === currentSocketId);

    if (!currentPlayer || !currentPlayer.connected) {
      this.advanceToNextTurn(room, 1, io, gameManager);
      return;
    }

    room.currentTurnSocketId = currentSocketId;
    room.currentTurnPlayerId = currentPlayer.playerId;
    room.currentTurnName = currentPlayer.name;
    room.hasDrawnThisTurn = false;
    room.drawnCardId = null;

    const duration = room.turnTimeLimit || 30;
    const endsAt = Date.now() + duration * 1000;
    room.currentTurnEndsAt = endsAt;

    const topCard = room.discardPile[room.discardPile.length - 1];

    io.to(room.id).emit("uno:turn_change", {
      currentTurnSocketId: currentSocketId,
      currentTurnPlayerId: currentPlayer.playerId,
      currentTurnName: currentPlayer.name,
      endsAt,
      duration,
      activeColor: room.activeColor,
      topCard,
      turnDirection: room.turnDirection,
      drawPileCount: room.drawPile.length,
      lastActionAlert: room.lastActionAlert,
    });

    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));

    // Turn auto-timeout (Auto-draw and pass)
    room.turnTimerTimeout = setTimeout(() => {
      if (room.status !== "PLAYING_PHASE" || room.currentTurnSocketId !== currentSocketId) return;
      // Auto-draw 1 card and pass
      const hand = room.playerHands[currentSocketId] || [];
      const drawn = this.drawFromDeck(room, 1);
      if (drawn.length > 0) {
        hand.push(...drawn);
        io.to(currentSocketId).emit("uno:hand_updated", { hand, drawnCards: drawn });
      }
      this.advanceToNextTurn(room, 1, io, gameManager);
    }, duration * 1000);

    // Automated play for Bot players
    if (currentPlayer.isBot) {
      const botDelay = 1000 + Math.random() * 1000;
      room.botTimerTimeout = setTimeout(() => {
        if (room.status !== "PLAYING_PHASE" || room.currentTurnSocketId !== currentSocketId) return;
        this.handleBotTurn(room, currentSocketId, io, gameManager);
      }, botDelay);
    }
  }

  handleBotTurn(room, botSocketId, io, gameManager) {
    const hand = room.playerHands[botSocketId] || [];
    const topCard = room.discardPile[room.discardPile.length - 1];
    const playableCards = hand.filter((c) => isCardPlayable(c, room.activeColor, topCard));

    if (playableCards.length > 0) {
      // Pick best playable card: prefer action/number card before wild
      let chosenCard = playableCards.find((c) => c.color !== "wild") || playableCards[0];
      let chosenColor = "red";

      if (chosenCard.color === "wild") {
        // Pick most frequent color in hand
        const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
        hand.forEach((c) => {
          if (counts[c.color] !== undefined) counts[c.color]++;
        });
        chosenColor = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      this.playCard(room, botSocketId, chosenCard.id, chosenColor, io, gameManager);
    } else {
      // Bot draws 1 card
      this.drawCard(room, botSocketId, io, gameManager, true);
    }
  }

  playCard(room, socketId, cardId, chosenColor, io, gameManager) {
    if (room.status !== "PLAYING_PHASE") return { error: "Game belum dimulai" };
    if (room.currentTurnSocketId !== socketId) return { error: "Bukan giliran Anda" };

    const hand = room.playerHands[socketId] || [];
    const cardIdx = hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return { error: "Kartu tidak ada di tangan Anda" };

    const card = hand[cardIdx];
    const topCard = room.discardPile[room.discardPile.length - 1];

    if (!isCardPlayable(card, room.activeColor, topCard)) {
      return { error: "Kartu ini tidak cocok dengan warna atau angka saat ini!" };
    }

    // Remove from hand and put on discard pile
    hand.splice(cardIdx, 1);
    room.discardPile.push(card);

    const player = room.players.find((p) => p.socketId === socketId);
    let nextSkipCount = 1;
    let actionAlert = null;

    // Update active color
    if (card.color === "wild") {
      const validColor = COLORS.includes(chosenColor) ? chosenColor : "red";
      room.activeColor = validColor;
      actionAlert = `🌈 ${player?.name} memainkan ${card.type === "wild4" ? "WILD +4" : "WILD"} dan memilih warna ${validColor.toUpperCase()}!`;
    } else {
      room.activeColor = card.color;
    }

    // Check UNO shout requirement
    if (hand.length === 1) {
      player.calledUno = true;
      io.to(room.id).emit("uno:called_uno", {
        socketId,
        playerId: player?.playerId,
        playerName: player?.name,
        message: `🔥 ${player?.name} BERTERIAK "UNO!" (SISA 1 KARTU!)`,
      });
    }

    // Check Win Condition (0 cards remaining)
    if (hand.length === 0) {
      this.endGame(room, player, "UNO_OUT", `${player.name} menghabiskan seluruh kartunya dan menang!`, io, gameManager);
      return { success: true };
    }

    // Execute Card Special Action
    if (card.type === "skip") {
      nextSkipCount = 2;
      actionAlert = `🚫 ${player?.name} memainkan SKIP! Giliran pemain berikutnya dilewati.`;
    } else if (card.type === "reverse") {
      if (room.turnOrder.length === 2) {
        nextSkipCount = 2;
        actionAlert = `🔄 ${player?.name} memainkan REVERSE! (Efek Skip pada 2 pemain).`;
      } else {
        room.turnDirection *= -1;
        actionAlert = `🔄 ${player?.name} memainkan REVERSE! Arah putaran dibalik (${room.turnDirection === 1 ? "Searah" : "Berlawanan"} jarum jam).`;
      }
    } else if (card.type === "draw2") {
      const targetSocketId = this.getNextSocketId(room, 1);
      const targetPlayer = room.players.find((p) => p.socketId === targetSocketId);
      if (targetPlayer) {
        const drawnCards = this.drawFromDeck(room, 2);
        room.playerHands[targetSocketId] = room.playerHands[targetSocketId] || [];
        room.playerHands[targetSocketId].push(...drawnCards);
        io.to(targetSocketId).emit("uno:hand_updated", {
          hand: room.playerHands[targetSocketId],
          drawnCards,
        });
        nextSkipCount = 2; // Target draws 2 and loses their turn
        actionAlert = `📥 ${player?.name} memainkan DRAW +2! ${targetPlayer.name} menarik 2 kartu dan kehilangan giliran.`;
      }
    } else if (card.type === "wild4") {
      const targetSocketId = this.getNextSocketId(room, 1);
      const targetPlayer = room.players.find((p) => p.socketId === targetSocketId);
      if (targetPlayer) {
        const drawnCards = this.drawFromDeck(room, 4);
        room.playerHands[targetSocketId] = room.playerHands[targetSocketId] || [];
        room.playerHands[targetSocketId].push(...drawnCards);
        io.to(targetSocketId).emit("uno:hand_updated", {
          hand: room.playerHands[targetSocketId],
          drawnCards,
        });
        nextSkipCount = 2; // Target draws 4 and loses turn
        actionAlert = `💥 ${player?.name} memainkan WILD +4! ${targetPlayer.name} menarik 4 kartu dan giliran dilewati. Warna: ${room.activeColor.toUpperCase()}`;
      }
    }

    room.lastActionAlert = actionAlert;

    // Send updated hand to current player
    io.to(socketId).emit("uno:hand_updated", { hand });

    // Broadcast table state update
    io.to(room.id).emit("uno:table_updated", {
      topCard: card,
      activeColor: room.activeColor,
      turnDirection: room.turnDirection,
      drawPileCount: room.drawPile.length,
      playersHandCount: this.getPlayersHandCount(room),
      lastActionAlert: actionAlert,
    });

    this.advanceToNextTurn(room, nextSkipCount, io, gameManager);
    return { success: true };
  }

  drawCard(room, socketId, io, gameManager, isBot = false) {
    if (room.status !== "PLAYING_PHASE") return { error: "Game belum dimulai" };
    if (room.currentTurnSocketId !== socketId) return { error: "Bukan giliran Anda" };

    if (room.hasDrawnThisTurn) {
      return { error: "Anda sudah menarik kartu pada giliran ini" };
    }

    const drawn = this.drawFromDeck(room, 1);
    if (drawn.length === 0) {
      return { error: "Tumpukan kartu dek habis" };
    }

    const drawnCard = drawn[0];
    const hand = room.playerHands[socketId] || [];
    hand.push(drawnCard);
    room.hasDrawnThisTurn = true;
    room.drawnCardId = drawnCard.id;

    const topCard = room.discardPile[room.discardPile.length - 1];
    const isPlayable = isCardPlayable(drawnCard, room.activeColor, topCard);

    io.to(socketId).emit("uno:hand_updated", {
      hand,
      drawnCards: drawn,
      canPlayDrawnCard: isPlayable,
      drawnCard,
    });

    io.to(room.id).emit("uno:table_updated", {
      topCard,
      activeColor: room.activeColor,
      turnDirection: room.turnDirection,
      drawPileCount: room.drawPile.length,
      playersHandCount: this.getPlayersHandCount(room),
    });

    // If Bot drew a card, play it if playable, else pass
    if (isBot) {
      if (isPlayable) {
        let chosenColor = "red";
        if (drawnCard.color === "wild") {
          chosenColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
        setTimeout(() => {
          this.playCard(room, socketId, drawnCard.id, chosenColor, io, gameManager);
        }, 800);
      } else {
        setTimeout(() => {
          this.advanceToNextTurn(room, 1, io, gameManager);
        }, 800);
      }
    }

    return { success: true, drawnCard, isPlayable };
  }

  passTurn(room, socketId, io, gameManager) {
    if (room.status !== "PLAYING_PHASE") return { error: "Game belum dimulai" };
    if (room.currentTurnSocketId !== socketId) return { error: "Bukan giliran Anda" };

    if (!room.hasDrawnThisTurn) {
      return { error: "Anda harus menarik kartu terlebih dahulu sebelum pass" };
    }

    this.advanceToNextTurn(room, 1, io, gameManager);
    return { success: true };
  }

  callUno(room, socketId, io) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return { error: "Pemain tidak ditemukan" };

    const hand = room.playerHands[socketId] || [];
    if (hand.length <= 2) {
      player.calledUno = true;
      io.to(room.id).emit("uno:called_uno", {
        socketId,
        playerId: player.playerId,
        playerName: player.name,
        message: `🔥 ${player.name} BERTERIAK "UNO!"`,
      });
      return { success: true };
    }
    return { error: "Kartu Anda belum tersisa 1!" };
  }

  getNextSocketId(room, offset = 1) {
    const len = room.turnOrder.length;
    const step = room.turnDirection * offset;
    const nextIdx = ((room.currentTurnIndex + step) % len + len) % len;
    return room.turnOrder[nextIdx];
  }

  advanceToNextTurn(room, skipCount = 1, io, gameManager) {
    gameManager.clearAllTimers(room);

    const len = room.turnOrder.length;
    const step = room.turnDirection * skipCount;
    room.currentTurnIndex = ((room.currentTurnIndex + step) % len + len) % len;

    this.startTurn(room, io, gameManager);
  }

  endGame(room, winner, winType, summaryMessage, io, gameManager) {
    gameManager.clearAllTimers(room);
    room.status = "GAME_OVER";
    room.playerHands = room.playerHands || {};

    // Calculate penalty points of remaining cards in other players hands
    const leaderboard = room.players.map((p) => {
      const pHand = room.playerHands?.[p.socketId] || [];
      const deadwoodScore = pHand.reduce((acc, c) => acc + (c.score || 0), 0);
      const isWinner = winner && winner.playerId === p.playerId;

      if (isWinner) {
        updatePlayerGameResult(p.playerId, p.name, true, 100);
      } else if (p.connected && !p.isSpectator) {
        updatePlayerGameResult(p.playerId, p.name, false, Math.max(0, 30 - deadwoodScore));
      }

      return {
        playerId: p.playerId,
        name: p.name,
        isWinner,
        score: isWinner ? 100 : Math.max(0, 50 - deadwoodScore),
        remainingCardsCount: pHand.length,
        deadwoodScore,
      };
    });

    leaderboard.sort((a, b) => b.score - a.score);

    const gameOverPayload = {
      gameType: "uno",
      winnerRole: "UNO_WINNER",
      winnerName: winner?.name || "Pemenang UNO",
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
          remainingCardsCount: pHand.length,
          role: isWinner ? "Juara UNO 🏆" : "Pemain",
        };
      }),
      allPlayerHands: room.players.map((p) => ({
        socketId: p.socketId,
        playerId: p.playerId,
        name: p.name,
        hand: room.playerHands?.[p.socketId] || [],
        isWinner: winner && winner.playerId === p.playerId,
      })),
      leaderboard,
    };

    room.lastGameOverData = gameOverPayload;

    io.to(room.id).emit("game:over", gameOverPayload);
    io.to(room.id).emit("room:updated", gameManager.getSanitizedRoom(room.id));
  }

  broadcastGameState(room, io, gameManager) {
    const topCard = room.discardPile ? room.discardPile[room.discardPile.length - 1] : null;
    room.players.forEach((p) => {
      if (p.connected) {
        io.to(p.socketId).emit("uno:game_started", {
          hand: room.playerHands?.[p.socketId] || [],
          topCard,
          activeColor: room.activeColor,
          turnDirection: room.turnDirection,
          drawPileCount: room.drawPile ? room.drawPile.length : 0,
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
    const topCard = room.discardPile ? room.discardPile[room.discardPile.length - 1] : null;

    io.to(socketId).emit("uno:game_started", {
      hand,
      topCard,
      activeColor: room.activeColor,
      turnDirection: room.turnDirection,
      drawPileCount: room.drawPile ? room.drawPile.length : 0,
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
      this.endGame(room, null, "DISCONNECT_FEW_PLAYERS", "Pemain tersisa kurang dari 2 orang.", io, gameManager);
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
      this.advanceToNextTurn(room, 1, io, gameManager);
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
    const topCard = room.discardPile ? room.discardPile[room.discardPile.length - 1] : null;
    return {
      gameType: "uno",
      hand,
      topCard,
      activeColor: room.activeColor,
      turnDirection: room.turnDirection,
      drawPileCount: room.drawPile ? room.drawPile.length : 0,
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
