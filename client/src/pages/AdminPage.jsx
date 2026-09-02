import React, { useState, useEffect } from "react";
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  UploadCloud,
  Layers,
  BookOpen,
  AlertCircle,
  ArrowLeft,
  Lock,
  Download,
  KeyRound,
  LogOut,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  Cpu,
  Trophy,
  RotateCcw,
  MapPin,
  Palette,
  Users,
  Moon,
  Tag,
  HelpCircle,
  CheckCircle2,
  X,
  Compass,
} from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_session_auth") === "true";
  });
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");

  // Top Game Selector: "undercover", "spyfall", "drawguess", "werewolf"
  const [selectedGame, setSelectedGame] = useState("undercover");
  // Sub-tabs: "ai", "list", "add", "bulk" (or "overview" for werewolf)
  const [activeTab, setActiveTab] = useState("ai");

  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ----------------------------------------------------
  // 1. UNDERCOVER STATE
  // ----------------------------------------------------
  const [ucWords, setUcWords] = useState([]);
  const [ucCategories, setUcCategories] = useState([]);
  const [ucTotalCount, setUcTotalCount] = useState(0);
  const [ucSearch, setUcSearch] = useState("");
  const [ucCategory, setUcCategory] = useState("semua");
  const [ucLoading, setUcLoading] = useState(false);

  // Undercover AI
  const [ucAiCount, setUcAiCount] = useState(10);
  const [ucAiCategory, setUcAiCategory] = useState("Random / Campur");
  const [ucAiThemeHint, setUcAiThemeHint] = useState("");
  const [ucAiGenerating, setUcAiGenerating] = useState(false);
  const [ucAiCandidates, setUcAiCandidates] = useState([]);
  const [ucAiReport, setUcAiReport] = useState(null);
  const [ucAiSaving, setUcAiSaving] = useState(false);

  // Undercover Add / Edit / Bulk
  const [ucNewCategory, setUcNewCategory] = useState("Umum");
  const [ucNewCivilian, setUcNewCivilian] = useState("");
  const [ucNewUndercover, setUcNewUndercover] = useState("");
  const [ucEditingIndex, setUcEditingIndex] = useState(null);
  const [ucEditCategory, setUcEditCategory] = useState("");
  const [ucEditCivilian, setUcEditCivilian] = useState("");
  const [ucEditUndercover, setUcEditUndercover] = useState("");
  const [ucBulkJson, setUcBulkJson] = useState("");

  // ----------------------------------------------------
  // 2. SPYFALL STATE
  // ----------------------------------------------------
  const [spyLocations, setSpyLocations] = useState([]);
  const [spyCategories, setSpyCategories] = useState([]);
  const [spyTotalCount, setSpyTotalCount] = useState(0);
  const [spySearch, setSpySearch] = useState("");
  const [spyCategory, setSpyCategory] = useState("semua");
  const [spyLoading, setSpyLoading] = useState(false);

  // Spyfall AI
  const [spyAiCount, setSpyAiCount] = useState(5);
  const [spyAiCategory, setSpyAiCategory] = useState("Random / Campur");
  const [spyAiThemeHint, setSpyAiThemeHint] = useState("");
  const [spyAiGenerating, setSpyAiGenerating] = useState(false);
  const [spyAiCandidates, setSpyAiCandidates] = useState([]);
  const [spyAiReport, setSpyAiReport] = useState(null);
  const [spyAiSaving, setSpyAiSaving] = useState(false);

  // Spyfall Add / Edit / Bulk
  const [spyNewName, setSpyNewName] = useState("");
  const [spyNewCategory, setSpyNewCategory] = useState("Pariwisata");
  const [spyNewRoleInput, setSpyNewRoleInput] = useState("");
  const [spyNewRolesList, setSpyNewRolesList] = useState(["Petugas", "Pengunjung", "Manajer"]);
  const [spyEditingId, setSpyEditingId] = useState(null);
  const [spyEditName, setSpyEditName] = useState("");
  const [spyEditCategory, setSpyEditCategory] = useState("");
  const [spyEditRoles, setSpyEditRoles] = useState([]);
  const [spyEditRoleInput, setSpyEditRoleInput] = useState("");
  const [spyBulkJson, setSpyBulkJson] = useState("");

  // ----------------------------------------------------
  // 3. DRAW & GUESS STATE
  // ----------------------------------------------------
  const [drawWords, setDrawWords] = useState([]);
  const [drawCategories, setDrawCategories] = useState([]);
  const [drawTotalCount, setDrawTotalCount] = useState(0);
  const [drawSearch, setDrawSearch] = useState("");
  const [drawCategory, setDrawCategory] = useState("semua");
  const [drawLoading, setDrawLoading] = useState(false);

  // Draw AI
  const [drawAiCount, setDrawAiCount] = useState(10);
  const [drawAiCategory, setDrawAiCategory] = useState("Random / Campur");
  const [drawAiDifficulty, setDrawAiDifficulty] = useState("Mudah");
  const [drawAiThemeHint, setDrawAiThemeHint] = useState("");
  const [drawAiGenerating, setDrawAiGenerating] = useState(false);
  const [drawAiCandidates, setDrawAiCandidates] = useState([]);
  const [drawAiReport, setDrawAiReport] = useState(null);
  const [drawAiSaving, setDrawAiSaving] = useState(false);

  // Draw Add / Edit / Bulk
  const [drawNewWord, setDrawNewWord] = useState("");
  const [drawNewCategory, setDrawNewCategory] = useState("Benda");
  const [drawNewDifficulty, setDrawNewDifficulty] = useState("Mudah");
  const [drawEditingIndex, setDrawEditingIndex] = useState(null);
  const [drawEditWord, setDrawEditWord] = useState("");
  const [drawEditCategory, setDrawEditCategory] = useState("");
  const [drawEditDifficulty, setDrawEditDifficulty] = useState("Mudah");
  const [drawBulkJson, setDrawBulkJson] = useState("");

  const notify = (msg, isError = false) => {
    setNotification({ text: msg, isError });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.trim() === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_session_auth", "true");
      setPassError("");
    } else {
      setPassError("Passcode salah! Gunakan 'admin123'");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_session_auth");
    setPasscode("");
  };

  // ----------------------------------------------------
  // DATA FETCHING HOOKS
  // ----------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Fetch Undercover Words
    if (selectedGame === "undercover") {
      setUcLoading(true);
      const params = new URLSearchParams();
      if (ucSearch) params.append("search", ucSearch);
      if (ucCategory && ucCategory !== "semua") params.append("category", ucCategory);

      fetch(`/api/words?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setUcWords(data.words || []);
          setUcCategories(data.categories || []);
          setUcTotalCount(data.total || 0);
          setUcLoading(false);
        })
        .catch(() => setUcLoading(false));
    }

    // 2. Fetch Spyfall Locations
    if (selectedGame === "spyfall") {
      setSpyLoading(true);
      const params = new URLSearchParams();
      if (spySearch) params.append("search", spySearch);
      if (spyCategory && spyCategory !== "semua") params.append("category", spyCategory);

      fetch(`/api/spyfall/locations?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setSpyLocations(data.locations || []);
          setSpyCategories(data.categories || []);
          setSpyTotalCount(data.total || 0);
          setSpyLoading(false);
        })
        .catch(() => setSpyLoading(false));
    }

    // 3. Fetch Draw & Guess Words
    if (selectedGame === "drawguess") {
      setDrawLoading(true);
      const params = new URLSearchParams();
      if (drawSearch) params.append("search", drawSearch);
      if (drawCategory && drawCategory !== "semua") params.append("category", drawCategory);

      fetch(`/api/drawguess/words?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setDrawWords(data.words || []);
          setDrawCategories(data.categories || []);
          setDrawTotalCount(data.total || 0);
          setDrawLoading(false);
        })
        .catch(() => setDrawLoading(false));
    }
  }, [
    isAuthenticated,
    selectedGame,
    ucSearch,
    ucCategory,
    spySearch,
    spyCategory,
    drawSearch,
    drawCategory,
    refreshKey,
  ]);

  // Initial stats fetch on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/words").then((res) => res.json()).then((d) => setUcTotalCount(d.total || 0)).catch(() => {});
    fetch("/api/spyfall/locations").then((res) => res.json()).then((d) => setSpyTotalCount(d.total || 0)).catch(() => {});
    fetch("/api/drawguess/words").then((res) => res.json()).then((d) => setDrawTotalCount(d.total || 0)).catch(() => {});
  }, [isAuthenticated, refreshKey]);

  // ----------------------------------------------------
  // 1. UNDERCOVER HANDLERS
  // ----------------------------------------------------
  const handleUcGenerateAI = async () => {
    setUcAiGenerating(true);
    setUcAiCandidates([]);
    setUcAiReport(null);
    try {
      const res = await fetch("/api/words/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: ucAiCount, category: ucAiCategory, themeHint: ucAiThemeHint }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUcAiCandidates(data.candidates || []);
      setUcAiReport(data);
      notify(`✨ AI berhasil menghasilkan ${data.candidates.length} pasangan kata unik!`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setUcAiGenerating(false);
    }
  };

  const handleUcConfirmAI = async () => {
    if (ucAiCandidates.length === 0) return;
    setUcAiSaving(true);
    try {
      const res = await fetch("/api/words/ai-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: ucAiCandidates }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`🎉 ${data.message || "Berhasil disimpan!"}`);
      setUcAiCandidates([]);
      setUcAiReport(null);
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    } finally {
      setUcAiSaving(false);
    }
  };

  const handleUcAddSingle = async (e) => {
    e.preventDefault();
    if (!ucNewCivilian.trim() || !ucNewUndercover.trim()) {
      notify("Kata Civilian dan Undercover wajib diisi!", true);
      return;
    }
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: ucNewCategory, civilian: ucNewCivilian, undercover: ucNewUndercover }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Pasangan kata "${ucNewCivilian}" vs "${ucNewUndercover}" berhasil ditambahkan!`);
      setUcNewCivilian("");
      setUcNewUndercover("");
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUcDelete = async (index) => {
    if (!window.confirm("Yakin ingin menghapus pasangan kata ini?")) return;
    try {
      const res = await fetch(`/api/words/${index}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Pasangan kata berhasil dihapus!");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUcSaveEdit = async () => {
    if (ucEditingIndex === null) return;
    try {
      const res = await fetch(`/api/words/${ucEditingIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: ucEditCategory, civilian: ucEditCivilian, undercover: ucEditUndercover }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Perubahan kata berhasil disimpan!");
      setUcEditingIndex(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUcBulkImport = async () => {
    try {
      const parsed = JSON.parse(ucBulkJson);
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa Array [...]");
      const res = await fetch("/api/words/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Berhasil mengimpor ${data.importedCount} kata baru!`);
      setUcBulkJson("");
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(`Format JSON tidak valid: ${err.message}`, true);
    }
  };

  // ----------------------------------------------------
  // 2. SPYFALL HANDLERS
  // ----------------------------------------------------
  const handleSpyGenerateAI = async () => {
    setSpyAiGenerating(true);
    setSpyAiCandidates([]);
    setSpyAiReport(null);
    try {
      const res = await fetch("/api/spyfall/locations/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: spyAiCount, category: spyAiCategory, themeHint: spyAiThemeHint }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSpyAiCandidates(data.candidates || []);
      setSpyAiReport(data);
      notify(`✨ AI berhasil merancang ${data.candidates.length} lokasi Spyfall lengkap!`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSpyAiGenerating(false);
    }
  };

  const handleSpyConfirmAI = async () => {
    if (spyAiCandidates.length === 0) return;
    setSpyAiSaving(true);
    try {
      const res = await fetch("/api/spyfall/locations/ai-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: spyAiCandidates }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`🎉 ${data.message || "Lokasi Spyfall berhasil disimpan!"}`);
      setSpyAiCandidates([]);
      setSpyAiReport(null);
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    } finally {
      setSpyAiSaving(false);
    }
  };

  const handleSpyAddSingle = async (e) => {
    e.preventDefault();
    if (!spyNewName.trim()) {
      notify("Nama lokasi wajib diisi!", true);
      return;
    }
    if (spyNewRolesList.length < 2) {
      notify("Lokasi minimal harus memiliki 2 peran!", true);
      return;
    }
    try {
      const res = await fetch("/api/spyfall/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: spyNewName, category: spyNewCategory, roles: spyNewRolesList }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Lokasi "${spyNewName}" berhasil ditambahkan!`);
      setSpyNewName("");
      setSpyNewRolesList(["Petugas", "Pengunjung", "Manajer"]);
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleSpyDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus lokasi Spyfall ini?")) return;
    try {
      const res = await fetch(`/api/spyfall/locations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Lokasi Spyfall berhasil dihapus!");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleSpySaveEdit = async () => {
    if (!spyEditingId) return;
    try {
      const res = await fetch(`/api/spyfall/locations/${spyEditingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: spyEditName, category: spyEditCategory, roles: spyEditRoles }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Perubahan lokasi berhasil disimpan!");
      setSpyEditingId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleSpyBulkImport = async () => {
    try {
      const parsed = JSON.parse(spyBulkJson);
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa Array of Locations");
      const res = await fetch("/api/spyfall/locations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Berhasil mengimpor ${data.importedCount} lokasi baru!`);
      setSpyBulkJson("");
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(`Format JSON tidak valid: ${err.message}`, true);
    }
  };

  // ----------------------------------------------------
  // 3. DRAW & GUESS HANDLERS
  // ----------------------------------------------------
  const handleDrawGenerateAI = async () => {
    setDrawAiGenerating(true);
    setDrawAiCandidates([]);
    setDrawAiReport(null);
    try {
      const res = await fetch("/api/drawguess/words/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: drawAiCount,
          category: drawAiCategory,
          difficulty: drawAiDifficulty,
          themeHint: drawAiThemeHint,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDrawAiCandidates(data.candidates || []);
      setDrawAiReport(data);
      notify(`✨ AI berhasil menghasilkan ${data.candidates.length} kata tebak gambar!`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setDrawAiGenerating(false);
    }
  };

  const handleDrawConfirmAI = async () => {
    if (drawAiCandidates.length === 0) return;
    setDrawAiSaving(true);
    try {
      const res = await fetch("/api/drawguess/words/ai-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: drawAiCandidates }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`🎉 ${data.message || "Kata tebak gambar berhasil disimpan!"}`);
      setDrawAiCandidates([]);
      setDrawAiReport(null);
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    } finally {
      setDrawAiSaving(false);
    }
  };

  const handleDrawAddSingle = async (e) => {
    e.preventDefault();
    if (!drawNewWord.trim()) {
      notify("Kata gambar wajib diisi!", true);
      return;
    }
    try {
      const res = await fetch("/api/drawguess/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: drawNewWord, category: drawNewCategory, difficulty: drawNewDifficulty }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Kata "${drawNewWord}" berhasil ditambahkan!`);
      setDrawNewWord("");
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDrawDelete = async (index) => {
    if (!window.confirm("Yakin ingin menghapus kata tebak gambar ini?")) return;
    try {
      const res = await fetch(`/api/drawguess/words/${index}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Kata gambar berhasil dihapus!");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDrawSaveEdit = async () => {
    if (drawEditingIndex === null) return;
    try {
      const res = await fetch(`/api/drawguess/words/${drawEditingIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: drawEditWord, category: drawEditCategory, difficulty: drawEditDifficulty }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify("✓ Perubahan kata berhasil disimpan!");
      setDrawEditingIndex(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDrawBulkImport = async () => {
    try {
      const parsed = JSON.parse(drawBulkJson);
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa Array of Words");
      const res = await fetch("/api/drawguess/words/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      notify(`✓ Berhasil mengimpor ${data.importedCount} kata baru!`);
      setDrawBulkJson("");
      setRefreshKey((k) => k + 1);
      setActiveTab("list");
    } catch (err) {
      notify(`Format JSON tidak valid: ${err.message}`, true);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!window.confirm("⚠️ PERINGATAN: Yakin ingin mereset seluruh leaderboard global?")) return;
    try {
      const res = await fetch("/api/leaderboard/reset", { method: "POST" });
      const data = await res.json();
      notify("🏆 Leaderboard global telah berhasil direset!");
    } catch (err) {
      notify(err.message, true);
    }
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md clay-card p-8 shadow-xl border-2 border-[#F6E6D0] bg-white rounded-3xl animate-pop-spring">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#FFF0ED] text-[#E64B2D] border-2 border-[#FFB2A1] rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-[#3A332C]">Admin Portal</h1>
            <p className="text-xs text-[#8C8275] mt-1">
              Kelola dataset dinamis Undercover, Spyfall, Tebak Gambar & Werewolf
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#3A332C] uppercase tracking-wider mb-2">
                Passcode Akses
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Masukkan passcode admin..."
                  className="w-full pl-11 pr-4 py-3 bg-[#FAF6EE] border-2 border-[#E8DCCB] rounded-2xl text-sm font-black text-[#3A332C] focus:outline-none focus:border-[#FFA012] transition shadow-inner"
                  autoFocus
                />
                <KeyRound className="w-5 h-5 text-[#8C8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {passError && (
                <p className="text-xs font-bold text-[#E64B2D] mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{passError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn-3d-peach rounded-2xl text-sm font-black text-white shadow-md cursor-pointer transition active:scale-95"
            >
              Masuk Dashboard Admin
            </button>

            <a
              href="/"
              className="w-full py-2.5 bg-transparent hover:bg-[#FAF6EE] text-[#8C8275] hover:text-[#3A332C] rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition block text-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Permainan</span>
            </a>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#3A332C] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-pop-spring">
        {/* TOAST NOTIFICATION */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border-2 shadow-xl flex items-center gap-3 animate-pop-spring ${
              notification.isError
                ? "bg-[#FFF0ED] border-[#FFB2A1] text-[#E64B2D]"
                : "bg-[#EDFCF2] border-[#89EFA9] text-[#24A654]"
            }`}
          >
            {notification.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
            <span className="text-xs sm:text-sm font-black">{notification.text}</span>
          </div>
        )}

        {/* 1. HEADER & QUICK STATS BAR */}
        <div className="clay-card p-5 sm:p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-[#FFA012] to-[#FFD15C] text-white rounded-2xl shadow-sm border border-[#FFD15C]">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#3A332C]">Admin Game Control Hub</h1>
                <span className="text-[10px] font-black bg-[#EDFCF2] text-[#24A654] border border-[#89EFA9] px-2 py-0.5 rounded-full">
                  LIVE DATABASE
                </span>
              </div>
              <p className="text-xs text-[#8C8275] font-semibold mt-0.5">
                Kelola bank kata, dataset peran lokasi, generator AI, & pengaturan game
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
            <button
              onClick={handleResetLeaderboard}
              title="Reset Skor Global"
              className="px-3 py-2 bg-[#FFF0ED] hover:bg-[#FFE3DE] text-[#E64B2D] border border-[#FFB2A1] rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Leaderboard</span>
            </button>
            <a
              href="/"
              className="px-3.5 py-2 bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#3A332C] border border-[#E8DCCB] rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Main Game</span>
            </a>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-[#3A332C] hover:bg-[#2A241F] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* 2. GAME SELECTION TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Undercover */}
          <button
            onClick={() => {
              setSelectedGame("undercover");
              setActiveTab("ai");
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition flex items-center gap-3 cursor-pointer text-left ${
              selectedGame === "undercover"
                ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                : "bg-white border-[#F6E6D0] hover:bg-[#FAF6EE]"
            }`}
          >
            <div className="p-2.5 bg-[#FFF0ED] text-[#E64B2D] rounded-xl border border-[#FFB2A1]">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#3A332C] truncate">Undercover</div>
              <div className="text-[10px] text-[#8C8275] font-bold">{ucTotalCount} Pasangan Kata</div>
            </div>
          </button>

          {/* Spyfall */}
          <button
            onClick={() => {
              setSelectedGame("spyfall");
              setActiveTab("ai");
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition flex items-center gap-3 cursor-pointer text-left ${
              selectedGame === "spyfall"
                ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                : "bg-white border-[#F6E6D0] hover:bg-[#FAF6EE]"
            }`}
          >
            <div className="p-2.5 bg-[#EFF8FF] text-[#1C8BE0] rounded-xl border border-[#8CD3FF]">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#3A332C] truncate">Spyfall</div>
              <div className="text-[10px] text-[#8C8275] font-bold">{spyTotalCount} Lokasi Rahasia</div>
            </div>
          </button>

          {/* Draw & Guess */}
          <button
            onClick={() => {
              setSelectedGame("drawguess");
              setActiveTab("ai");
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition flex items-center gap-3 cursor-pointer text-left ${
              selectedGame === "drawguess"
                ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                : "bg-white border-[#F6E6D0] hover:bg-[#FAF6EE]"
            }`}
          >
            <div className="p-2.5 bg-[#EDFCF2] text-[#24A654] rounded-xl border border-[#89EFA9]">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#3A332C] truncate">Tebak Gambar</div>
              <div className="text-[10px] text-[#8C8275] font-bold">{drawTotalCount} Bank Kata</div>
            </div>
          </button>

          {/* Werewolf */}
          <button
            onClick={() => {
              setSelectedGame("werewolf");
              setActiveTab("overview");
            }}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition flex items-center gap-3 cursor-pointer text-left ${
              selectedGame === "werewolf"
                ? "bg-[#FFF8EC] border-[#FFA012] shadow-md ring-2 ring-[#FFA012]/30"
                : "bg-white border-[#F6E6D0] hover:bg-[#FAF6EE]"
            }`}
          >
            <div className="p-2.5 bg-[#F7F1FF] text-[#7B33ED] rounded-xl border border-[#D5B8FF]">
              <Moon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#3A332C] truncate">Werewolf</div>
              <div className="text-[10px] text-[#8C8275] font-bold">Katalog Peran & Aturan</div>
            </div>
          </button>
        </div>

        {/* 3. SUB-NAVIGATION TABS */}
        {selectedGame !== "werewolf" && (
          <div className="flex items-center gap-2 border-b border-[#F6E6D0] pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === "ai"
                  ? "bg-[#FFA012] text-white shadow-sm"
                  : "bg-white text-[#8C8275] hover:bg-[#FAF6EE] border border-[#F0DDC5]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>🤖 AI Generator Otomatis</span>
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === "list"
                  ? "bg-[#FFA012] text-white shadow-sm"
                  : "bg-white text-[#8C8275] hover:bg-[#FAF6EE] border border-[#F0DDC5]"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📋 Daftar Stok Data</span>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === "add"
                  ? "bg-[#FFA012] text-white shadow-sm"
                  : "bg-white text-[#8C8275] hover:bg-[#FAF6EE] border border-[#F0DDC5]"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>➕ Tambah Manual</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === "bulk"
                  ? "bg-[#FFA012] text-white shadow-sm"
                  : "bg-white text-[#8C8275] hover:bg-[#FAF6EE] border border-[#F0DDC5]"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>📤 Import JSON Bulk</span>
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* GAME SECTION 1: UNDERCOVER                                           */}
        {/* ==================================================================== */}
        {selectedGame === "undercover" && (
          <div className="space-y-6">
            {/* AI Generator Tab */}
            {activeTab === "ai" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#3A332C] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FFA012]" />
                    <span>AI Generator Pasangan Kata Undercover</span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-1">
                    Hasilkan puluhan pasangan kata baru otomatis dengan Gemini AI tanpa duplikasi terhadap bank kata aktif.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Jumlah Kata</label>
                    <select
                      value={ucAiCount}
                      onChange={(e) => setUcAiCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                      <option value={5}>5 Pasang</option>
                      <option value={10}>10 Pasang</option>
                      <option value={15}>15 Pasang</option>
                      <option value={25}>25 Pasang</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Kategori</label>
                    <input
                      type="text"
                      value={ucAiCategory}
                      onChange={(e) => setUcAiCategory(e.target.value)}
                      placeholder="Misal: Kuliner, Pop Culture, Sekolah..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                    </input>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Arahan Tema (Opsional)</label>
                    <input
                      type="text"
                      value={ucAiThemeHint}
                      onChange={(e) => setUcAiThemeHint(e.target.value)}
                      placeholder="Misal: Jajanan Anak 90an, K-Pop..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUcGenerateAI}
                  disabled={ucAiGenerating}
                  className="w-full py-3.5 btn-3d-peach text-white font-black text-sm rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {ucAiGenerating ? "⏳ Sedang Menghasilkan Kata..." : "✨ Generate Pasangan Kata Sekarang"}
                </button>

                {/* AI Preview Candidates */}
                {ucAiCandidates.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#F6E6D0]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#24A654] bg-[#EDFCF2] px-3 py-1 rounded-full border border-[#89EFA9]">
                        ✓ {ucAiCandidates.length} Pasangan Kata Unik Siap Dimasukkan
                      </span>
                      <button
                        onClick={handleUcConfirmAI}
                        disabled={ucAiSaving}
                        className="px-6 py-2.5 btn-3d-blue text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                      >
                        {ucAiSaving ? "Menyimpan..." : "📥 Simpan Semua ke Database"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto p-2 bg-[#FAF6EE] rounded-2xl border border-[#E8DCCB]">
                      {ucAiCandidates.map((item, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-[#F0DDC5] shadow-xs">
                          <span className="text-[9px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <div className="text-xs font-black text-[#3A332C] mt-1.5 flex items-center justify-between">
                            <span>{item.civilian}</span>
                            <span className="text-[#8C8275] font-normal">vs</span>
                            <span className="text-[#E64B2D]">{item.undercover}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List Tab */}
            {activeTab === "list" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={ucSearch}
                      onChange={(e) => setUcSearch(e.target.value)}
                      placeholder="Cari kata atau kategori..."
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                    <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={ucCategory}
                      onChange={(e) => setUcCategory(e.target.value)}
                      className="p-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                      <option value="semua">Semua Kategori</option>
                      {ucCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-1">
                  {ucWords.map((w, idx) => (
                    <div key={idx} className="p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] shadow-xs flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] px-2 py-0.5 rounded">
                          {w.category}
                        </span>
                        <div className="text-xs font-black text-[#3A332C] mt-2 flex items-center justify-between">
                          <span className="text-[#3A332C]">{w.civilian}</span>
                          <span className="text-[10px] text-[#8C8275]">vs</span>
                          <span className="text-[#E64B2D]">{w.undercover}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#F0DDC5]">
                        <button
                          onClick={() => {
                            setUcEditingIndex(idx);
                            setUcEditCategory(w.category);
                            setUcEditCivilian(w.civilian);
                            setUcEditUndercover(w.undercover);
                          }}
                          className="p-1.5 hover:bg-[#EFF8FF] text-[#1C8BE0] rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUcDelete(idx)}
                          className="p-1.5 hover:bg-[#FFF0ED] text-[#E64B2D] rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tab */}
            {activeTab === "add" && (
              <form onSubmit={handleUcAddSingle} className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4 max-w-xl mx-auto">
                <h3 className="text-base font-black text-[#3A332C]">Tambah Pasangan Kata Manual</h3>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kategori</label>
                  <input
                    type="text"
                    value={ucNewCategory}
                    onChange={(e) => setUcNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Makanan, Teknologi, Profesi..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kata Civilian (Mayoritas)</label>
                  <input
                    type="text"
                    value={ucNewCivilian}
                    onChange={(e) => setUcNewCivilian(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Kopi"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kata Undercover (Penyusup)</label>
                  <input
                    type="text"
                    value={ucNewUndercover}
                    onChange={(e) => setUcNewUndercover(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Teh"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-3 btn-3d-peach text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Simpan Pasangan Kata
                </button>
              </form>
            )}

            {/* Bulk Tab */}
            {activeTab === "bulk" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <h3 className="text-base font-black text-[#3A332C]">Import JSON Bulk Undercover</h3>
                <p className="text-xs text-[#8C8275]">
                  Tempelkan array JSON dengan format: <code>[{`{"category": "Makanan", "civilian": "Kopi", "undercover": "Teh"}`}]</code>
                </p>
                <textarea
                  rows={8}
                  value={ucBulkJson}
                  onChange={(e) => setUcBulkJson(e.target.value)}
                  placeholder="Paste JSON array di sini..."
                  className="w-full p-3 font-mono text-xs bg-[#FAF6EE] border border-[#E8DCCB] rounded-2xl"
                />
                <button onClick={handleUcBulkImport} className="w-full py-3 btn-3d-blue text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Proses Import JSON
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* GAME SECTION 2: SPYFALL (AGEN RAHASIA)                                */}
        {/* ==================================================================== */}
        {selectedGame === "spyfall" && (
          <div className="space-y-6">
            {/* AI Generator Tab */}
            {activeTab === "ai" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#3A332C] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FFA012]" />
                    <span>AI Generator Lokasi & Peran Spyfall</span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-1">
                    Hasilkan lokasi baru lengkap dengan 5–7 peran karakter realistis per lokasi menggunakan Gemini AI.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Jumlah Lokasi</label>
                    <select
                      value={spyAiCount}
                      onChange={(e) => setSpyAiCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                      <option value={3}>3 Lokasi</option>
                      <option value={5}>5 Lokasi</option>
                      <option value={10}>10 Lokasi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Kategori</label>
                    <input
                      type="text"
                      value={spyAiCategory}
                      onChange={(e) => setSpyAiCategory(e.target.value)}
                      placeholder="Misal: Pariwisata, Militer, Hiburan..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Tema / Arahan Spesifik</label>
                    <input
                      type="text"
                      value={spyAiThemeHint}
                      onChange={(e) => setSpyAiThemeHint(e.target.value)}
                      placeholder="Misal: Tempat Ikonik Jakarta, Luar Angkasa..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSpyGenerateAI}
                  disabled={spyAiGenerating}
                  className="w-full py-3.5 btn-3d-peach text-white font-black text-sm rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {spyAiGenerating ? "⏳ Sedang Merancang Lokasi Spyfall..." : "✨ Generate Lokasi Spyfall Sekarang"}
                </button>

                {/* AI Preview Candidates */}
                {spyAiCandidates.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#F6E6D0]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#24A654] bg-[#EDFCF2] px-3 py-1 rounded-full border border-[#89EFA9]">
                        ✓ {spyAiCandidates.length} Lokasi Siap Ditambahkan
                      </span>
                      <button
                        onClick={handleSpyConfirmAI}
                        disabled={spyAiSaving}
                        className="px-6 py-2.5 btn-3d-blue text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                      >
                        {spyAiSaving ? "Menyimpan..." : "📥 Simpan Semua ke Spyfall"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2 bg-[#FAF6EE] rounded-2xl border border-[#E8DCCB]">
                      {spyAiCandidates.map((loc, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-2xl border border-[#F0DDC5] shadow-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-[#3A332C]">{loc.name}</h4>
                            <span className="text-[9px] font-black uppercase text-[#1C8BE0] bg-[#EFF8FF] px-2 py-0.5 rounded">
                              {loc.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {loc.roles.map((r, rIdx) => (
                              <span key={rIdx} className="text-[10px] font-bold bg-[#FAF6EE] text-[#5A5044] px-2 py-0.5 rounded-md border border-[#E8DCCB]">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List Tab */}
            {activeTab === "list" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={spySearch}
                      onChange={(e) => setSpySearch(e.target.value)}
                      placeholder="Cari lokasi atau peran..."
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                    <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <select
                    value={spyCategory}
                    onChange={(e) => setSpyCategory(e.target.value)}
                    className="p-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold w-full sm:w-auto"
                  >
                    <option value="semua">Semua Kategori</option>
                    {spyCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto p-1">
                  {spyLocations.map((loc) => (
                    <div key={loc.id} className="p-4 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] shadow-xs flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-[#3A332C] flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#E64B2D]" />
                            <span>{loc.name}</span>
                          </h4>
                          <span className="text-[9px] font-black uppercase text-[#1C8BE0] bg-[#EFF8FF] px-2 py-0.5 rounded">
                            {loc.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          {(loc.roles || []).map((r, rIdx) => (
                            <span key={rIdx} className="text-[10px] font-semibold bg-white text-[#5A5044] px-2 py-0.5 rounded-md border border-[#E8DCCB]">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0DDC5]">
                        <button
                          onClick={() => {
                            setSpyEditingId(loc.id);
                            setSpyEditName(loc.name);
                            setSpyEditCategory(loc.category);
                            setSpyEditRoles(loc.roles || []);
                          }}
                          className="p-1.5 hover:bg-[#EFF8FF] text-[#1C8BE0] rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSpyDelete(loc.id)}
                          className="p-1.5 hover:bg-[#FFF0ED] text-[#E64B2D] rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tab */}
            {activeTab === "add" && (
              <form onSubmit={handleSpyAddSingle} className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4 max-w-xl mx-auto">
                <h3 className="text-base font-black text-[#3A332C]">Tambah Lokasi Spyfall Manual</h3>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Nama Lokasi</label>
                  <input
                    type="text"
                    value={spyNewName}
                    onChange={(e) => setSpyNewName(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Stasiun Kereta Cepat"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kategori</label>
                  <input
                    type="text"
                    value={spyNewCategory}
                    onChange={(e) => setSpyNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Transportasi, Pariwisata..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Daftar Peran Karakter</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={spyNewRoleInput}
                      onChange={(e) => setSpyNewRoleInput(e.target.value)}
                      placeholder="Ketik peran lalu klik Tambah..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (spyNewRoleInput.trim()) {
                            setSpyNewRolesList([...spyNewRolesList, spyNewRoleInput.trim()]);
                            setSpyNewRoleInput("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (spyNewRoleInput.trim()) {
                          setSpyNewRolesList([...spyNewRolesList, spyNewRoleInput.trim()]);
                          setSpyNewRoleInput("");
                        }
                      }}
                      className="px-4 py-2.5 btn-3d-peach text-white text-xs font-black rounded-xl"
                    >
                      Tambah
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {spyNewRolesList.map((r, idx) => (
                      <span key={idx} className="text-xs font-bold bg-[#FAF6EE] text-[#3A332C] px-2.5 py-1 rounded-lg border border-[#E8DCCB] flex items-center gap-1">
                        <span>{r}</span>
                        <button
                          type="button"
                          onClick={() => setSpyNewRolesList(spyNewRolesList.filter((_, i) => i !== idx))}
                          className="text-[#E64B2D] hover:text-red-700 font-black cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-3 btn-3d-peach text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Simpan Lokasi Spyfall
                </button>
              </form>
            )}

            {/* Bulk Tab */}
            {activeTab === "bulk" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <h3 className="text-base font-black text-[#3A332C]">Import JSON Bulk Spyfall</h3>
                <p className="text-xs text-[#8C8275]">
                  Format JSON: <code>[{`{"name": "Bandara", "category": "Transportasi", "roles": ["Pilot", "Pramugari", "Penumpang"]}`}]</code>
                </p>
                <textarea
                  rows={8}
                  value={spyBulkJson}
                  onChange={(e) => setSpyBulkJson(e.target.value)}
                  placeholder="Paste JSON array lokasi di sini..."
                  className="w-full p-3 font-mono text-xs bg-[#FAF6EE] border border-[#E8DCCB] rounded-2xl"
                />
                <button onClick={handleSpyBulkImport} className="w-full py-3 btn-3d-blue text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Proses Import Lokasi
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* GAME SECTION 3: DRAW & GUESS (TEBAK GAMBAR)                          */}
        {/* ==================================================================== */}
        {selectedGame === "drawguess" && (
          <div className="space-y-6">
            {/* AI Generator Tab */}
            {activeTab === "ai" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#3A332C] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FFA012]" />
                    <span>AI Generator Kata Tebak Gambar</span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-1">
                    Hasilkan konsep visual konkret baru yang seru digambar dan ditebak secara real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Jumlah Kata</label>
                    <select
                      value={drawAiCount}
                      onChange={(e) => setDrawAiCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                      <option value={5}>5 Kata</option>
                      <option value={10}>10 Kata</option>
                      <option value={20}>20 Kata</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Kategori</label>
                    <input
                      type="text"
                      value={drawAiCategory}
                      onChange={(e) => setDrawAiCategory(e.target.value)}
                      placeholder="Misal: Hewan, Makanan, Benda..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Tingkat Kesulitan</label>
                    <select
                      value={drawAiDifficulty}
                      onChange={(e) => setDrawAiDifficulty(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Sulit">Sulit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#3A332C] uppercase mb-1.5">Arahan Tema</label>
                    <input
                      type="text"
                      value={drawAiThemeHint}
                      onChange={(e) => setDrawAiThemeHint(e.target.value)}
                      placeholder="Misal: Kartun, Alam Tropis..."
                      className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDrawGenerateAI}
                  disabled={drawAiGenerating}
                  className="w-full py-3.5 btn-3d-peach text-white font-black text-sm rounded-2xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {drawAiGenerating ? "⏳ Sedang Merancang Kata Gambar..." : "✨ Generate Kata Gambar Sekarang"}
                </button>

                {/* AI Preview Candidates */}
                {drawAiCandidates.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[#F6E6D0]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#24A654] bg-[#EDFCF2] px-3 py-1 rounded-full border border-[#89EFA9]">
                        ✓ {drawAiCandidates.length} Kata Gambar Siap Dimasukkan
                      </span>
                      <button
                        onClick={handleDrawConfirmAI}
                        disabled={drawAiSaving}
                        className="px-6 py-2.5 btn-3d-blue text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
                      >
                        {drawAiSaving ? "Menyimpan..." : "📥 Simpan Semua ke Tebak Gambar"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto p-2 bg-[#FAF6EE] rounded-2xl border border-[#E8DCCB]">
                      {drawAiCandidates.map((w, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-[#F0DDC5] shadow-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] px-2 py-0.5 rounded">
                              {w.category}
                            </span>
                            <span className="text-[9px] font-bold text-[#8C8275]">{w.difficulty}</span>
                          </div>
                          <div className="text-xs font-black text-[#3A332C] mt-1 truncate">{w.word}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List Tab */}
            {activeTab === "list" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={drawSearch}
                      onChange={(e) => setDrawSearch(e.target.value)}
                      placeholder="Cari kata gambar..."
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                    <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <select
                    value={drawCategory}
                    onChange={(e) => setDrawCategory(e.target.value)}
                    className="p-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold w-full sm:w-auto"
                  >
                    <option value="semua">Semua Kategori</option>
                    {drawCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1">
                  {drawWords.map((w, idx) => (
                    <div key={idx} className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#F0DDC5] shadow-xs flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase text-[#FFA012] bg-[#FFF8EC] px-1.5 py-0.5 rounded">
                            {w.category}
                          </span>
                          <span className="text-[9px] font-bold text-[#8C8275]">{w.difficulty || "Mudah"}</span>
                        </div>
                        <div className="text-xs font-black text-[#3A332C] mt-1.5 truncate">{w.word}</div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-[#F0DDC5]">
                        <button
                          onClick={() => {
                            setDrawEditingIndex(idx);
                            setDrawEditWord(w.word);
                            setDrawEditCategory(w.category);
                            setDrawEditDifficulty(w.difficulty || "Mudah");
                          }}
                          className="p-1 hover:bg-[#EFF8FF] text-[#1C8BE0] rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDrawDelete(idx)}
                          className="p-1 hover:bg-[#FFF0ED] text-[#E64B2D] rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Tab */}
            {activeTab === "add" && (
              <form onSubmit={handleDrawAddSingle} className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4 max-w-xl mx-auto">
                <h3 className="text-base font-black text-[#3A332C]">Tambah Kata Tebak Gambar Manual</h3>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kata Gambar</label>
                  <input
                    type="text"
                    value={drawNewWord}
                    onChange={(e) => setDrawNewWord(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Helikopter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Kategori</label>
                  <input
                    type="text"
                    value={drawNewCategory}
                    onChange={(e) => setDrawNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    placeholder="Misal: Kendaraan, Hewan, Benda..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#3A332C] uppercase mb-1">Tingkat Kesulitan</label>
                  <select
                    value={drawNewDifficulty}
                    onChange={(e) => setDrawNewDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 btn-3d-peach text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Simpan Kata Gambar
                </button>
              </form>
            )}

            {/* Bulk Tab */}
            {activeTab === "bulk" && (
              <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-4">
                <h3 className="text-base font-black text-[#3A332C]">Import JSON Bulk Tebak Gambar</h3>
                <p className="text-xs text-[#8C8275]">
                  Format JSON: <code>[{`{"word": "Gajah", "category": "Hewan", "difficulty": "Mudah"}`}]</code>
                </p>
                <textarea
                  rows={8}
                  value={drawBulkJson}
                  onChange={(e) => setDrawBulkJson(e.target.value)}
                  placeholder="Paste JSON array kata gambar di sini..."
                  className="w-full p-3 font-mono text-xs bg-[#FAF6EE] border border-[#E8DCCB] rounded-2xl"
                />
                <button onClick={handleDrawBulkImport} className="w-full py-3 btn-3d-blue text-white font-black text-xs rounded-xl shadow-md cursor-pointer">
                  Proses Import Kata Gambar
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* GAME SECTION 4: WEREWOLF (DESA SERIGALA)                              */}
        {/* ==================================================================== */}
        {selectedGame === "werewolf" && (
          <div className="clay-card p-6 border-2 border-[#F6E6D0] bg-white rounded-3xl shadow-md space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#3A332C] flex items-center gap-2">
                <Moon className="w-5 h-5 text-[#7B33ED]" />
                <span>Katalog Peran & Mekanik Game Werewolf</span>
              </h3>
              <p className="text-xs text-[#8C8275] mt-1">
                Werewolf menggunakan sistem alokasi peran dinamis proporsional berdasarkan jumlah pemain yang terhubung.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Werewolf */}
              <div className="p-4 bg-[#FFF0ED] border-2 border-[#FFB2A1] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐺</span>
                  <div>
                    <h4 className="text-sm font-black text-[#E64B2D]">Werewolf</h4>
                    <span className="text-[10px] font-bold text-[#8C8275]">Fraksi Serigala</span>
                  </div>
                </div>
                <p className="text-xs text-[#5A5044]">
                  Memilih 1 warga desa untuk dimangsa setiap fase malam secara konsensus.
                </p>
              </div>

              {/* Seer */}
              <div className="p-4 bg-[#F7F1FF] border-2 border-[#D5B8FF] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <h4 className="text-sm font-black text-[#7B33ED]">Seer (Penerawang)</h4>
                    <span className="text-[10px] font-bold text-[#8C8275]">Fraksi Warga</span>
                  </div>
                </div>
                <p className="text-xs text-[#5A5044]">
                  Menerawang identitas asli 1 pemain setiap malam untuk mencari serigala.
                </p>
              </div>

              {/* Doctor */}
              <div className="p-4 bg-[#EDFCF2] border-2 border-[#89EFA9] rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💉</span>
                  <div>
                    <h4 className="text-sm font-black text-[#24A654]">Doctor (Dokter)</h4>
                    <span className="text-[10px] font-bold text-[#8C8275]">Fraksi Warga</span>
                  </div>
                </div>
                <p className="text-xs text-[#5A5044]">
                  Melindungi 1 pemain dari serangan Werewolf di malam hari.
                </p>
              </div>

              {/* Villager */}
              <div className="p-4 bg-[#FFF8EC] border-2 border-[#FFA012]/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👨‍🌾</span>
                  <div>
                    <h4 className="text-sm font-black text-[#FFA012]">Villager (Warga)</h4>
                    <span className="text-[10px] font-bold text-[#8C8275]">Fraksi Warga</span>
                  </div>
                </div>
                <p className="text-xs text-[#5A5044]">
                  Berdiskusi dan melakukan voting eliminasi di siang hari untuk menggantung Werewolf.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8DCCB] text-xs font-semibold text-[#5A5044] space-y-1.5">
              <div className="font-black text-[#3A332C]">📊 Tabel Alokasi Otomatis:</div>
              <div>• 4–5 Pemain: 1 Werewolf, 1 Seer, 1 Doctor, sisa Warga.</div>
              <div>• 6–8 Pemain: 2 Werewolf, 1 Seer, 1 Doctor, sisa Warga.</div>
              <div>• 9+ Pemain: 3 Werewolf, 1 Seer, 1 Doctor, sisa Warga.</div>
            </div>
          </div>
        )}

        {/* 4. MODALS FOR EDITING */}
        {/* Undercover Edit Modal */}
        {ucEditingIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="clay-card p-6 bg-white border-2 border-[#F6E6D0] rounded-3xl max-w-md w-full space-y-4 animate-pop-spring shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#3A332C]">Edit Pasangan Kata Undercover</h3>
                <button onClick={() => setUcEditingIndex(null)} className="text-[#8C8275] font-black cursor-pointer">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Kategori</label>
                  <input
                    type="text"
                    value={ucEditCategory}
                    onChange={(e) => setUcEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Civilian</label>
                  <input
                    type="text"
                    value={ucEditCivilian}
                    onChange={(e) => setUcEditCivilian(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Undercover</label>
                  <input
                    type="text"
                    value={ucEditUndercover}
                    onChange={(e) => setUcEditUndercover(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setUcEditingIndex(null)} className="px-4 py-2 bg-[#FAF6EE] rounded-xl text-xs font-bold text-[#8C8275]">Batal</button>
                <button onClick={handleUcSaveEdit} className="px-5 py-2 btn-3d-peach text-white rounded-xl text-xs font-black shadow-sm">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* Spyfall Edit Modal */}
        {spyEditingId !== null && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="clay-card p-6 bg-white border-2 border-[#F6E6D0] rounded-3xl max-w-md w-full space-y-4 animate-pop-spring shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#3A332C]">Edit Lokasi & Peran Spyfall</h3>
                <button onClick={() => setSpyEditingId(null)} className="text-[#8C8275] font-black cursor-pointer">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Nama Lokasi</label>
                  <input
                    type="text"
                    value={spyEditName}
                    onChange={(e) => setSpyEditName(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Kategori</label>
                  <input
                    type="text"
                    value={spyEditCategory}
                    onChange={(e) => setSpyEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Peran Karakter</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={spyEditRoleInput}
                      onChange={(e) => setSpyEditRoleInput(e.target.value)}
                      placeholder="Tambah peran..."
                      className="w-full p-2 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (spyEditRoleInput.trim()) {
                          setSpyEditRoles([...spyEditRoles, spyEditRoleInput.trim()]);
                          setSpyEditRoleInput("");
                        }
                      }}
                      className="px-3 py-2 btn-3d-peach text-white text-xs font-black rounded-xl"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto">
                    {spyEditRoles.map((r, idx) => (
                      <span key={idx} className="text-[11px] font-bold bg-[#FAF6EE] text-[#3A332C] px-2 py-0.5 rounded-md border border-[#E8DCCB] flex items-center gap-1">
                        <span>{r}</span>
                        <button
                          type="button"
                          onClick={() => setSpyEditRoles(spyEditRoles.filter((_, i) => i !== idx))}
                          className="text-[#E64B2D] font-black"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setSpyEditingId(null)} className="px-4 py-2 bg-[#FAF6EE] rounded-xl text-xs font-bold text-[#8C8275]">Batal</button>
                <button onClick={handleSpySaveEdit} className="px-5 py-2 btn-3d-peach text-white rounded-xl text-xs font-black shadow-sm">Simpan</button>
              </div>
            </div>
          </div>
        )}

        {/* Draw & Guess Edit Modal */}
        {drawEditingIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="clay-card p-6 bg-white border-2 border-[#F6E6D0] rounded-3xl max-w-md w-full space-y-4 animate-pop-spring shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#3A332C]">Edit Kata Tebak Gambar</h3>
                <button onClick={() => setDrawEditingIndex(null)} className="text-[#8C8275] font-black cursor-pointer">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Kata Gambar</label>
                  <input
                    type="text"
                    value={drawEditWord}
                    onChange={(e) => setDrawEditWord(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Kategori</label>
                  <input
                    type="text"
                    value={drawEditCategory}
                    onChange={(e) => setDrawEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#8C8275] mb-1">Tingkat Kesulitan</label>
                  <select
                    value={drawEditDifficulty}
                    onChange={(e) => setDrawEditDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF6EE] border border-[#E8DCCB] rounded-xl text-xs font-bold"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setDrawEditingIndex(null)} className="px-4 py-2 bg-[#FAF6EE] rounded-xl text-xs font-bold text-[#8C8275]">Batal</button>
                <button onClick={handleDrawSaveEdit} className="px-5 py-2 btn-3d-peach text-white rounded-xl text-xs font-black shadow-sm">Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
