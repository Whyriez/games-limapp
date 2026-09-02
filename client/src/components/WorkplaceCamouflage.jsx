import React, { useState } from "react";
import {
  Layers,
  Clock,
  GitBranch,
  CheckCircle2,
  Activity,
  Server,
  Cpu,
  Search,
  Shield,
} from "lucide-react";

export default function WorkplaceCamouflage({ onDismiss }) {
  const [activeTab, setActiveTab] = useState("sprint");

  return (
    <div className="fixed inset-0 z-50 bg-[#090c10] text-slate-200 overflow-y-auto p-4 md:p-6 font-sans select-text">
      {/* Top Header Navbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-600/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm text-slate-100 tracking-tight">
                INFRA-CORE // Architecture Sprint 14
              </h1>
              <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800/60 px-1.5 py-0.5 rounded">
                v2.4.0-prod
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Target: Microservices Resilience & WebSocket Low-Latency Routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="hidden lg:flex items-center gap-2 bg-subsurface px-3 py-1.5 rounded-lg border border-white/5 text-xs text-slate-400 font-mono">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search commits, PRs (⌘K)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-xs px-2.5 py-1 rounded-lg font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems 99.99% Nominal</span>
          </div>

          <button
            onClick={onDismiss}
            title="Klik atau tekan ESC untuk kembali ke sesi game"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-1.5 rounded-lg border border-white/10 transition-all font-mono flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Resume Task</span>
            <span className="text-[10px] text-slate-400 bg-black/40 px-1 rounded">ESC</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2 text-xs font-medium text-slate-400 overflow-x-auto">
        <button
          onClick={() => setActiveTab("sprint")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "sprint"
              ? "bg-white/10 text-white font-semibold"
              : "hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          Active Sprint Board
        </button>
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "telemetry"
              ? "bg-white/10 text-white font-semibold"
              : "hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          Live Telemetry & Logs
        </button>
      </div>

      {activeTab === "sprint" ? (
        /* Sprint Kanban Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: In Progress */}
          <div className="obsidian-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span className="font-semibold text-slate-300">In Progress (3)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-3">
              <div className="bg-subsurface p-3.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-blue-400 font-semibold">INFRA-8021</span>
                  <span className="text-rose-400 text-[10px]">P1 High</span>
                </div>
                <p className="text-xs font-medium text-slate-200">
                  Refactor WebSocket Keep-Alive heartbeat interval for Cloudflare Tunnel Edge Routers
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Backend Core</span>
                  <span>•</span>
                  <span>Assignee: budi.backend</span>
                </div>
              </div>

              <div className="bg-subsurface p-3.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-blue-400 font-semibold">DB-409</span>
                  <span className="text-amber-400 text-[10px]">P2 Med</span>
                </div>
                <p className="text-xs font-medium text-slate-200">
                  Verify SQLite WAL mode concurrency under multi-tenant concurrent write locks
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Database</span>
                  <span>•</span>
                  <span>Assignee: lead.infra</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: In Review */}
          <div className="obsidian-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span className="font-semibold text-slate-300">Under Review (2)</span>
              <GitBranch className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-3">
              <div className="bg-subsurface p-3.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-blue-400 font-semibold">SEC-1102</span>
                  <span className="text-rose-400 text-[10px]">P1 High</span>
                </div>
                <p className="text-xs font-medium text-slate-200">
                  Audit Zero-Trust JWT claims and ephemeral token rotation policies
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Security</span>
                  <span>•</span>
                  <span>PR #342</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="obsidian-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span className="font-semibold text-slate-300">Completed (4)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <div className="bg-subsurface p-3.5 rounded-xl border border-white/5 opacity-75 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-slate-500">CORE-301</span>
                  <span className="text-emerald-400 text-[10px]">Merged</span>
                </div>
                <p className="text-xs font-medium text-slate-300">
                  Clean up ephemeral session cache buffers and garbage collection timers on teardown
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                  <span>Completed in Sprint 13</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Telemetry & Metrics Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="obsidian-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Avg Latency (p99)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              14.2 ms
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Region: ap-southeast-1 (Jakarta)
            </div>
          </div>

          <div className="obsidian-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Memory Footprint</span>
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400">
              48.6 MB
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              V8 Heap Allocation: Normal
            </div>
          </div>

          <div className="obsidian-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Active WebSocket Sockets</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              128 Conns
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Keep-Alive Heartbeat: 20s
            </div>
          </div>

          <div className="obsidian-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Database Locks</span>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              0 Deadlocks
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Journal Mode: WAL Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
