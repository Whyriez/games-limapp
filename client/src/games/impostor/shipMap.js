/**
 * Spaceship Map Architecture (The Skeld - Pastel Clay Edition)
 * Arena Dimensions: 1400 x 950
 */

export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 950;

export const ROOMS_MAP = {
  cafeteria: {
    id: "cafeteria",
    name: "Cafeteria",
    x: 520,
    y: 70,
    w: 360,
    h: 260,
    color: "#FFF4E6",
    borderColor: "#FFA012",
    accentColor: "#FFA012",
  },
  weapons: {
    id: "weapons",
    name: "Weapons",
    x: 960,
    y: 80,
    w: 240,
    h: 190,
    color: "#FFF0ED",
    borderColor: "#FF7F66",
    accentColor: "#FF7F66",
  },
  o2: {
    id: "o2",
    name: "O2",
    x: 900,
    y: 320,
    w: 190,
    h: 170,
    color: "#EDFCF2",
    borderColor: "#4DD97B",
    accentColor: "#4DD97B",
  },
  navigation: {
    id: "navigation",
    name: "Navigation",
    x: 1140,
    y: 440,
    w: 220,
    h: 220,
    color: "#EFF8FF",
    borderColor: "#50B5FF",
    accentColor: "#50B5FF",
  },
  shields: {
    id: "shields",
    name: "Shields",
    x: 960,
    y: 690,
    w: 220,
    h: 190,
    color: "#F0F5FF",
    borderColor: "#3B82F6",
    accentColor: "#3B82F6",
  },
  comms: {
    id: "comms",
    name: "Communications",
    x: 740,
    y: 720,
    w: 180,
    h: 160,
    color: "#FFF9EB",
    borderColor: "#F59E0B",
    accentColor: "#F59E0B",
  },
  storage: {
    id: "storage",
    name: "Storage",
    x: 480,
    y: 640,
    w: 220,
    h: 240,
    color: "#FAF5FF",
    borderColor: "#8B5CF6",
    accentColor: "#8B5CF6",
  },
  admin: {
    id: "admin",
    name: "Admin",
    x: 730,
    y: 400,
    w: 180,
    h: 180,
    color: "#FDF4FF",
    borderColor: "#D946EF",
    accentColor: "#D946EF",
  },
  electrical: {
    id: "electrical",
    name: "Electrical",
    x: 290,
    y: 570,
    w: 200,
    h: 210,
    color: "#FEFCE8",
    borderColor: "#EAB308",
    accentColor: "#EAB308",
  },
  security: {
    id: "security",
    name: "Security",
    x: 270,
    y: 380,
    w: 170,
    h: 150,
    color: "#EFF6FF",
    borderColor: "#60A5FA",
    accentColor: "#60A5FA",
  },
  reactor: {
    id: "reactor",
    name: "Reactor",
    x: 50,
    y: 330,
    w: 180,
    h: 260,
    color: "#F5F3FF",
    borderColor: "#9D5CFF",
    accentColor: "#9D5CFF",
  },
  medbay: {
    id: "medbay",
    name: "Medbay",
    x: 320,
    y: 170,
    w: 170,
    h: 170,
    color: "#ECFDF5",
    borderColor: "#10B981",
    accentColor: "#10B981",
  },
};

// Walkable connecting corridors (hallways)
export const CORRIDORS = [
  // Cafeteria to Weapons (east)
  { x: 880, y: 140, w: 90, h: 70 },
  // Weapons to O2 & Navigation
  { x: 1040, y: 270, w: 70, h: 70 },
  { x: 1080, y: 340, w: 70, h: 120 },
  // O2 to Shields
  { x: 990, y: 490, w: 70, h: 200 },
  // Navigation to Shields
  { x: 1140, y: 640, w: 70, h: 80 },
  // Shields to Comms
  { x: 920, y: 760, w: 50, h: 70 },
  // Comms to Storage
  { x: 700, y: 760, w: 50, h: 70 },
  // Storage to Cafeteria (central vertical corridor via Admin)
  { x: 650, y: 330, w: 90, h: 90 },
  { x: 570, y: 330, w: 90, h: 320 },
  // Admin to East Hallway
  { x: 890, y: 440, w: 70, h: 70 },
  // Storage to Electrical
  { x: 470, y: 690, w: 50, h: 70 },
  // Electrical to Security
  { x: 330, y: 520, w: 70, h: 60 },
  // Security to Reactor & Upper/Lower corridor
  { x: 210, y: 410, w: 70, h: 70 },
  // Cafeteria to Medbay (west)
  { x: 470, y: 200, w: 60, h: 70 },
  // Medbay to Security
  { x: 360, y: 330, w: 70, h: 60 },
  // Reactor to corridors
  { x: 110, y: 270, w: 80, h: 70 },
  { x: 110, y: 580, w: 80, h: 70 },
  { x: 180, y: 270, w: 150, h: 60 },
  { x: 180, y: 590, w: 130, h: 60 },
];

// Solid obstacles inside rooms that block walking
export const SOLID_OBSTACLES = [
  // Cafeteria Round Table in center (circle approx: x: 700, y: 200, r: 60)
  { type: "circle", x: 700, y: 200, r: 58 },
  // Admin central table
  { type: "rect", x: 780, y: 460, w: 80, h: 60 },
  // Reactor Core pillar in center
  { type: "rect", x: 100, y: 410, w: 80, h: 100 },
  // Medbay Scanner bed
  { type: "circle", x: 400, y: 255, r: 35 },
  // Security CCTV desk
  { type: "rect", x: 320, y: 410, w: 70, h: 35 },
  // Storage central boxes
  { type: "rect", x: 550, y: 720, w: 80, h: 60 },
  // Electrical generator block
  { type: "rect", x: 340, y: 640, w: 80, h: 60 },
];

// Emergency Button Location
export const EMERGENCY_BUTTON = {
  x: 700,
  y: 200,
  room: "cafeteria",
  label: "Emergency Button",
};

// Task Stations
export const TASK_STATIONS = [
  {
    id: "swipe_card",
    name: "Gesek Kartu ID",
    room: "cafeteria",
    x: 820,
    y: 110,
    color: "#FFA012",
    icon: "CreditCard",
  },
  {
    id: "wiring",
    name: "Sambung Kabel Listrik",
    room: "electrical",
    x: 330,
    y: 600,
    color: "#EAB308",
    icon: "Zap",
  },
  {
    id: "divert_power",
    name: "Salurkan Saklar Daya",
    room: "electrical",
    x: 440,
    y: 730,
    color: "#EAB308",
    icon: "Sliders",
  },
  {
    id: "calibrate_distributor",
    name: "Kalibrasi Distributor",
    room: "electrical",
    x: 450,
    y: 610,
    color: "#EAB308",
    icon: "Cpu",
  },
  {
    id: "manifolds",
    name: "Buka Kunci Reaktor (1-10)",
    room: "reactor",
    x: 90,
    y: 360,
    color: "#9D5CFF",
    icon: "Keypad",
  },
  {
    id: "clean_filter",
    name: "Bersihkan Filter O2",
    room: "o2",
    x: 1040,
    y: 360,
    color: "#4DD97B",
    icon: "Trash2",
  },
  {
    id: "medbay_scan",
    name: "Pindai Kesehatan (Scan)",
    room: "medbay",
    x: 400,
    y: 255,
    color: "#10B981",
    icon: "Activity",
  },
  {
    id: "chart_course",
    name: "Atur Arah Navigasi",
    room: "navigation",
    x: 1300,
    y: 530,
    color: "#50B5FF",
    icon: "Navigation",
  },
];

// Vent Grates
export const VENT_LOCATIONS = [
  { id: "vent_cafeteria", room: "cafeteria", x: 840, y: 280, connectsTo: ["admin", "o2"] },
  { id: "vent_electrical", room: "electrical", x: 320, y: 740, connectsTo: ["medbay", "security"] },
  { id: "vent_medbay", room: "medbay", x: 450, y: 200, connectsTo: ["electrical", "security"] },
  { id: "vent_security", room: "security", x: 400, y: 490, connectsTo: ["electrical", "medbay"] },
  { id: "vent_reactor_top", room: "reactor", x: 170, y: 350, connectsTo: ["o2", "navigation"] },
  { id: "vent_o2", room: "o2", x: 940, y: 450, connectsTo: ["reactor", "navigation"] },
  { id: "vent_navigation", room: "navigation", x: 1180, y: 610, connectsTo: ["reactor", "o2"] },
  { id: "vent_weapons", room: "weapons", x: 1160, y: 120, connectsTo: ["navigation", "shields"] },
  { id: "vent_shields", room: "shields", x: 1130, y: 830, connectsTo: ["weapons", "navigation"] },
];

// Sabotage Interactive Terminals
export const SABOTAGE_STATIONS = {
  reactor: { room: "reactor", x: 80, y: 520, label: "Reactor Meltdown Panel" },
  o2: { room: "o2", x: 1040, y: 440, label: "O2 Depletion Keypad" },
  lights: { room: "electrical", x: 450, y: 670, label: "Electrical Switchboard" },
};

/**
 * Check if a point (x, y) is inside any walkable room or corridor
 */
export function isPointInShip(x, y) {
  // Margin check
  if (x < 30 || x > MAP_WIDTH - 30 || y < 30 || y > MAP_HEIGHT - 30) return false;

  // 1. Check rooms
  for (const key of Object.keys(ROOMS_MAP)) {
    const r = ROOMS_MAP[key];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return true;
    }
  }

  // 2. Check corridors
  for (const c of CORRIDORS) {
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a point hits any solid obstacle (tables, pillars, consoles)
 */
export function isPointHittingObstacle(x, y, radius = 16) {
  for (const obs of SOLID_OBSTACLES) {
    if (obs.type === "circle") {
      const dist = Math.hypot(x - obs.x, y - obs.y);
      if (dist < obs.r + radius) return true;
    } else if (obs.type === "rect") {
      if (
        x >= obs.x - radius &&
        x <= obs.x + obs.w + radius &&
        y >= obs.y - radius &&
        y <= obs.y + obs.h + radius
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Full walkable check for player character
 */
export function isWalkable(x, y, isGhost = false) {
  if (isGhost) {
    // Ghosts can float anywhere inside ship boundaries
    return x >= 20 && x <= MAP_WIDTH - 20 && y >= 20 && y <= MAP_HEIGHT - 20;
  }
  return isPointInShip(x, y) && !isPointHittingObstacle(x, y);
}

/**
 * Get room ID from player coordinates
 */
export function getRoomAt(x, y) {
  for (const key of Object.keys(ROOMS_MAP)) {
    const r = ROOMS_MAP[key];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return r.id;
    }
  }
  return "corridor";
}

/**
 * Palette of Among Us Astronaut Suit Colors
 */
export const ASTRONAUT_COLORS = [
  { id: "red", name: "Red", primary: "#C51111", dark: "#7A0838", light: "#FF4D4D" },
  { id: "blue", name: "Blue", primary: "#132ED1", dark: "#09158E", light: "#50B5FF" },
  { id: "green", name: "Green", primary: "#117F2D", dark: "#0A4D19", light: "#4DD97B" },
  { id: "pink", name: "Pink", primary: "#ED54BA", dark: "#AB2BAB", light: "#FFA3E5" },
  { id: "orange", name: "Orange", primary: "#EF7D0D", dark: "#B04B06", light: "#FFA012" },
  { id: "yellow", name: "Yellow", primary: "#F5F557", dark: "#C2870F", light: "#FFF975" },
  { id: "purple", name: "Purple", primary: "#6B2FBC", dark: "#3B177C", light: "#9D5CFF" },
  { id: "cyan", name: "Cyan", primary: "#38FEDC", dark: "#24A895", light: "#90FFF1" },
  { id: "lime", name: "Lime", primary: "#50EF39", dark: "#1D980F", light: "#89FFA5" },
  { id: "brown", name: "Brown", primary: "#71491E", dark: "#44240B", light: "#B57B42" },
  { id: "white", name: "White", primary: "#D6E0F0", dark: "#8394BF", light: "#FFFFFF" },
  { id: "black", name: "Black", primary: "#3F474E", dark: "#1E1F26", light: "#7B8B9A" },
];

export function getPlayerColor(index = 0) {
  return ASTRONAUT_COLORS[index % ASTRONAUT_COLORS.length];
}
