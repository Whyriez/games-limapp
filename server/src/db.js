import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "stats.db"));

// Initialize Per-Game Stats Table
db.exec(`
  CREATE TABLE IF NOT EXISTS player_game_stats (
    player_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    nickname TEXT NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    times_voted_out INTEGER DEFAULT 0,
    role_wins_data TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, game_type)
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    player_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    times_voted_out INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe auto-migration for legacy databases
try {
  const pStatsCols = db.prepare("PRAGMA table_info(player_stats)").all().map((c) => c.name);
  if (!pStatsCols.includes("total_wins")) {
    db.exec("ALTER TABLE player_stats ADD COLUMN total_wins INTEGER DEFAULT 0");
  }
  if (!pStatsCols.includes("total_games")) {
    db.exec("ALTER TABLE player_stats ADD COLUMN total_games INTEGER DEFAULT 0");
  }
  if (!pStatsCols.includes("times_voted_out")) {
    db.exec("ALTER TABLE player_stats ADD COLUMN times_voted_out INTEGER DEFAULT 0");
  }
  if (!pStatsCols.includes("updated_at")) {
    db.exec("ALTER TABLE player_stats ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  }

  const pGameStatsCols = db.prepare("PRAGMA table_info(player_game_stats)").all().map((c) => c.name);
  if (!pGameStatsCols.includes("total_wins")) {
    db.exec("ALTER TABLE player_game_stats ADD COLUMN total_wins INTEGER DEFAULT 0");
  }
  if (!pGameStatsCols.includes("total_points")) {
    db.exec("ALTER TABLE player_game_stats ADD COLUMN total_points INTEGER DEFAULT 0");
  }
  if (!pGameStatsCols.includes("times_voted_out")) {
    db.exec("ALTER TABLE player_game_stats ADD COLUMN times_voted_out INTEGER DEFAULT 0");
  }
  if (!pGameStatsCols.includes("role_wins_data")) {
    db.exec("ALTER TABLE player_game_stats ADD COLUMN role_wins_data TEXT DEFAULT '{}'");
  }
} catch (migErr) {
  console.warn("DB migration warning:", migErr.message);
}

export function updatePlayerGameResult({
  playerId,
  nickname,
  gameType = "undercover",
  role,
  isWinner = false,
  points = 0,
  wasVotedOut = false,
  mrWhiteGuessCorrect = false,
  extraData = {},
}) {
  if (!playerId) return;

  try {
    const cleanGameType = gameType || "undercover";

    // 1. Update Per-Game Stats
    const getStmt = db.prepare(
      "SELECT * FROM player_game_stats WHERE player_id = ? AND game_type = ?",
    );
    const existing = getStmt.get(playerId, cleanGameType);

    let roleData = {};
    if (existing && existing.role_wins_data) {
      try {
        roleData = JSON.parse(existing.role_wins_data);
      } catch (e) {}
    }

    if (isWinner && role) {
      roleData[role] = (roleData[role] || 0) + 1;
    }
    if (mrWhiteGuessCorrect) {
      roleData["mrwhite_clutch"] = (roleData["mrwhite_clutch"] || 0) + 1;
    }

    const roleDataStr = JSON.stringify(roleData);

    if (!existing) {
      db.prepare(
        `
        INSERT INTO player_game_stats (player_id, game_type, nickname, total_games, total_wins, total_points, times_voted_out, role_wins_data)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?)
      `,
      ).run(
        playerId,
        cleanGameType,
        nickname,
        isWinner ? 1 : 0,
        points || 0,
        wasVotedOut ? 1 : 0,
        roleDataStr,
      );
    } else {
      db.prepare(
        `
        UPDATE player_game_stats SET
          nickname = ?,
          total_games = total_games + 1,
          total_wins = total_wins + ?,
          total_points = total_points + ?,
          times_voted_out = times_voted_out + ?,
          role_wins_data = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ? AND game_type = ?
      `,
      ).run(
        nickname,
        isWinner ? 1 : 0,
        points || 0,
        wasVotedOut ? 1 : 0,
        roleDataStr,
        playerId,
        cleanGameType,
      );
    }

    // 2. Update Global Player Stats
    const globalStmt = db.prepare("SELECT * FROM player_stats WHERE player_id = ?");
    const globalPlayer = globalStmt.get(playerId);

    if (!globalPlayer) {
      db.prepare(
        `
        INSERT INTO player_stats (player_id, nickname, total_games, total_wins, times_voted_out)
        VALUES (?, ?, 1, ?, ?)
      `,
      ).run(playerId, nickname, isWinner ? 1 : 0, wasVotedOut ? 1 : 0);
    } else {
      db.prepare(
        `
        UPDATE player_stats SET
          nickname = ?,
          total_games = total_games + 1,
          total_wins = total_wins + ?,
          times_voted_out = times_voted_out + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_id = ?
      `,
      ).run(nickname, isWinner ? 1 : 0, wasVotedOut ? 1 : 0, playerId);
    }
  } catch (err) {
    console.error("Error updating player stats in DB:", err);
  }
}

export function getLeaderboardByGame(gameType = "all") {
  if (gameType === "all") {
    const stmt = db.prepare(`
      SELECT 
        player_id,
        nickname,
        SUM(total_games) AS total_games,
        SUM(total_wins) AS total_wins,
        SUM(total_points) AS total_points,
        ROUND(CAST(SUM(total_wins) AS FLOAT) / SUM(total_games) * 100, 1) AS win_rate,
        SUM(times_voted_out) AS times_voted_out
      FROM player_game_stats
      GROUP BY player_id, nickname
      HAVING total_games > 0
      ORDER BY win_rate DESC, total_wins DESC, total_points DESC
      LIMIT 15
    `);
    return stmt.all();
  }

  if (gameType === "drawguess") {
    const stmt = db.prepare(`
      SELECT 
        player_id,
        game_type,
        nickname,
        total_games,
        total_wins,
        total_points,
        ROUND(CAST(total_wins AS FLOAT) / total_games * 100, 1) AS win_rate,
        role_wins_data
      FROM player_game_stats
      WHERE game_type = 'drawguess' AND total_games > 0
      ORDER BY total_points DESC, total_wins DESC
      LIMIT 15
    `);
    return stmt.all();
  }

  const stmt = db.prepare(`
    SELECT 
      player_id,
      game_type,
      nickname,
      total_games,
      total_wins,
      total_points,
      ROUND(CAST(total_wins AS FLOAT) / total_games * 100, 1) AS win_rate,
      times_voted_out,
      role_wins_data
    FROM player_game_stats
    WHERE game_type = ? AND total_games > 0
    ORDER BY win_rate DESC, total_wins DESC
    LIMIT 15
  `);
  return stmt.all(gameType);
}

export function getLeaderboard() {
  return {
    all: getLeaderboardByGame("all"),
    undercover: getLeaderboardByGame("undercover"),
    spyfall: getLeaderboardByGame("spyfall"),
    werewolf: getLeaderboardByGame("werewolf"),
    drawguess: getLeaderboardByGame("drawguess"),
    remi: getLeaderboardByGame("remi"),
  };
}

export function resetLeaderboard() {
  db.prepare("DELETE FROM player_game_stats").run();
  db.prepare("DELETE FROM player_stats").run();
  return { success: true, message: "Seluruh data podium & statistik pemain berhasil direset" };
}
