export function getOrCreatePlayerIdentity() {
  let playerId = localStorage.getItem("stealth_player_id");
  if (!playerId) {
    playerId =
      "usr_" +
      Math.random().toString(36).substring(2, 9) +
      Date.now().toString(36);
    localStorage.setItem("stealth_player_id", playerId);
  }
  const cachedName = localStorage.getItem("stealth_player_name") || "";
  return { playerId, cachedName };
}

export function savePlayerName(name) {
  localStorage.setItem("stealth_player_name", name);
}
