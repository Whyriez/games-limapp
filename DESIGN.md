# DESIGN.md — Undercover: Casual Pastel 3D Edition

## 1. Brand Identity & Visual Atmosphere

Desain mengadopsi estetika **Warm Pastel Clay & Soft 3D**: ramah, cerah, bersih, dan sangat nyaman dipandang di layar ponsel.

### 1.1 Color Palette & Design Tokens

- **Canvas Background:** `linear-gradient(180deg, #FFE4BE 0%, #FFF3DE 50%, #E8F4FD 100%)`
- **Card Surface (White Clay):** `#FFFFFF` dengan `rounded-[26px]` dan `shadow-[0_10px_25px_rgba(235,160,85,0.12)]`
- **Primary Sky Blue (Action / Tiles):** `#50B5FF` (Gradient: `from-[#60C0FF] to-[#3AA5F8]`, Shadow: `shadow-[0_6px_0_#2B8EE0]`)
- **Secondary Peach / Gold (Badges & Streak):** `#FFB347` / `#FFA012`
- **Podium Colors:**
  - **Rank 1 (Purple):** `#9D5CFF` (Gradient: `from-[#B077FF] to-[#8740FA]`)
  - **Rank 2 (Sky Cyan):** `#48C3FF` (Gradient: `from-[#68D0FF] to-[#30B5FA]`)
  - **Rank 3 (Coral Pink):** `#FF7F66` (Gradient: `from-[#FF9782] to-[#F56447]`)
- **Typography Color:**
  - **Title & Headings:** `#3A332C` (Warm Espresso Brown)
  - **Body / Subtitle:** `#8C8275` (Muted Warm Gray)
  - **Pill Text:** `#6E6254`
- **Font Family:** `Nunito`, `Plus Jakarta Sans`, atau `Poppins` (Bold, rounded corner fonts).

---

## 2. Tailwind Configuration Preset

Tambahkan ekstensi tema ini ke `client/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          start: "#FFE4BE",
          mid: "#FFF3DE",
          end: "#E8F4FD",
        },
        clay: {
          white: "#FFFFFF",
          card: "#FFFBF5",
          border: "#F6E6D0",
          dark: "#3A332C",
          muted: "#8C8275",
        },
        pastel: {
          blue: "#50B5FF",
          blueShadow: "#2B8EE0",
          purple: "#9D5CFF",
          coral: "#FF7F66",
          yellow: "#FFB347",
          green: "#4DD97B",
        },
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        "clay-card":
          "0 10px 25px -4px rgba(215, 145, 75, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
        "clay-btn": "0 5px 0 #2B8EE0",
        "clay-btn-active": "0 0 0 #2B8EE0",
        pill: "0 4px 12px rgba(220, 160, 90, 0.15)",
      },
    },
  },
  plugins: [],
};
```
