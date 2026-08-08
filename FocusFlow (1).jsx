import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home, CheckSquare, Calendar as CalendarIcon, FolderKanban, Target,
  BarChart3, Settings as SettingsIcon, User, Search, Plus, Bell, X,
  Edit2, Trash2, ChevronLeft, ChevronRight, Play, Pause,
  Flame, Trophy, Award, Zap, Clock, CheckCircle2, Circle, ArrowRight,
  Sparkles, AlertCircle, BellRing, BellOff, PartyPopper, Inbox
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";

/* ---------------------------------------------------------------
   FocusFlow — Smart Productivity & Task Management Platform
   Palette: warm beige / caramel / brown / white
   Display face: Sora (confident, geometric — the register real
   productivity SaaS products use: Linear, Notion-adjacent tools)
   Body: Inter · Data/mono: JetBrains Mono
----------------------------------------------------------------*/

const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  :root{
    --bg:#F7F1E6;
    --surface:#FFFFFF;
    --beige:#ECDFC7;
    --beige-dark:#D9C4A0;
    --caramel:#C1834B;
    --caramel-dark:#9C6A38;
    --brown:#6B4A33;
    --brown-dark:#3F2C20;
    --text:#3B2A1E;
    --text-soft:#8A7361;
    --line:#E3D3B8;
    --high:#B15535;
    --med:#C1954A;
    --low:#7C8759;
  }
  .ff-root{ font-family:'Inter',sans-serif; color:var(--text); background:var(--bg); }
  .ff-display{ font-family:'Sora',sans-serif; font-weight:700; letter-spacing:-0.02em; }
  .ff-mono{ font-family:'JetBrains Mono',monospace; }

  .ff-root button{ transition: transform .16s ease, box-shadow .16s ease, background-color .16s ease, color .16s ease, opacity .16s ease; }
  .ff-hover-lift:hover{ transform: translateY(-3px); box-shadow: 0 10px 24px rgba(63,44,32,0.10); }
  .ff-hover-tint:hover{ background: var(--beige) !important; }
  .ff-nav-item:hover{ background: rgba(217,196,160,0.55); }
  .ff-row:hover{ background: rgba(236,223,199,0.45); border-radius: 12px; }

  @keyframes ffFadeUp { from{ opacity:0; transform: translateY(10px);} to{ opacity:1; transform:translateY(0);} }
  .ff-page{ animation: ffFadeUp .38s ease both; }
  .ff-stagger > * { animation: ffFadeUp .5s ease both; }
  .ff-stagger > *:nth-child(1){ animation-delay: .02s; }
  .ff-stagger > *:nth-child(2){ animation-delay: .08s; }
  .ff-stagger > *:nth-child(3){ animation-delay: .14s; }
  .ff-stagger > *:nth-child(4){ animation-delay: .20s; }

  @keyframes ffPop { 0%{ transform:scale(0.4); opacity:0;} 60%{ transform:scale(1.15);} 100%{ transform:scale(1); opacity:1;} }
  .ff-pop{ animation: ffPop .38s cubic-bezier(.34,1.56,.64,1) both; }

  @keyframes ffRing { from{ stroke-dashoffset: var(--ring-from);} to{ stroke-dashoffset: var(--ring-to);} }

  @keyframes ffConfetti {
    0%{ transform: translate(0,0) rotate(0deg); opacity:1; }
    100%{ transform: translate(var(--xdrift), 78vh) rotate(var(--rotate)); opacity:0; }
  }
  .ff-confetti-piece{ position:absolute; top:22%; border-radius:2px; animation-name: ffConfetti; animation-timing-function: cubic-bezier(.22,.61,.36,1); animation-fill-mode:forwards; }

  @keyframes ffToast { 0%{ opacity:0; transform: translate(-50%,-14px);} 12%{ opacity:1; transform: translate(-50%,0);} 88%{ opacity:1; transform: translate(-50%,0);} 100%{ opacity:0; transform: translate(-50%,-10px);} }
  .ff-toast{ animation: ffToast 2.4s ease both; }

  @keyframes ffStrike { from{ background-size: 0% 2px; } to{ background-size: 100% 2px; } }
  .ff-struck{
    background-image: linear-gradient(var(--text-soft), var(--text-soft));
    background-repeat:no-repeat; background-position: 0 55%;
    animation: ffStrike .4s ease forwards;
  }
`;

/* ---------------------------- seed data ---------------------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const seedProjects = [
  { id: "p1", name: "University", icon: "🎓", color: "var(--high)" },
  { id: "p2", name: "Portfolio", icon: "💻", color: "var(--caramel)" },
  { id: "p3", name: "React Learning", icon: "📚", color: "var(--low)" },
];

let uid = 100;
const nextId = () => String(uid++);

const seedTasks = [
  { id: "t1", title: "Complete Portfolio Homepage", description: "Design and build the hero + about sections.", priority: "high", category: "Personal", project: "p2", dueDate: todayISO(), time: "18:00", duration: 90, completed: false, reminderOn: true, reminderLead: "30 minutes before", subtasks: [{ id: "s1", title: "Design homepage", done: true }, { id: "s2", title: "Build navbar", done: false }, { id: "s3", title: "Add projects section", done: false }] },
  { id: "t2", title: "Practice React API calls", description: "Fetch + useEffect practice with a public API.", priority: "medium", category: "Learning", project: "p3", dueDate: addDays(1), time: "11:00", duration: 60, completed: false, reminderOn: true, reminderLead: "1 hour before", subtasks: [] },
  { id: "t3", title: "Organize GitHub repositories", description: "Clean up READMEs and pin best repos.", priority: "low", category: "Personal", project: "p2", dueDate: addDays(2), time: "16:00", duration: 30, completed: false, reminderOn: false, reminderLead: "30 minutes before", subtasks: [] },
  { id: "t4", title: "FYP Documentation", description: "Write chapter 3 methodology.", priority: "high", category: "University", project: "p1", dueDate: addDays(1), time: "09:00", duration: 90, completed: false, reminderOn: true, reminderLead: "1 day before", subtasks: [] },
  { id: "t5", title: "Study for Database exam", description: "Normalization + ER diagrams.", priority: "high", category: "University", project: "p1", dueDate: addDays(-1), time: "10:00", duration: 60, completed: false, reminderOn: true, reminderLead: "30 minutes before", subtasks: [] },
  { id: "t6", title: "Lunch break", description: "", priority: "low", category: "Personal", project: null, dueDate: todayISO(), time: "12:00", duration: 45, completed: false, reminderOn: false, reminderLead: "30 minutes before", subtasks: [] },
  { id: "t7", title: "Gym session", description: "", priority: "low", category: "Personal", project: null, dueDate: todayISO(), time: "18:00", duration: 60, completed: true, reminderOn: false, reminderLead: "30 minutes before", subtasks: [] },
  { id: "t8", title: "Contact form component", description: "", priority: "medium", category: "Work", project: "p2", dueDate: addDays(3), time: "14:00", duration: 60, completed: false, reminderOn: true, reminderLead: "10 minutes before", subtasks: [] },
  { id: "t9", title: "Read React Hooks docs", description: "", priority: "medium", category: "Learning", project: "p3", dueDate: todayISO(), time: "09:00", duration: 45, completed: true, reminderOn: false, reminderLead: "30 minutes before", subtasks: [] },
  { id: "t10", title: "Assignment 2 submission", description: "", priority: "high", category: "University", project: "p1", dueDate: todayISO(), time: "15:00", duration: 40, completed: true, reminderOn: false, reminderLead: "30 minutes before", subtasks: [] },
];

const weeklyCompleted = [
  { day: "Mon", tasks: 7 }, { day: "Tue", tasks: 9 }, { day: "Wed", tasks: 5 },
  { day: "Thu", tasks: 6 }, { day: "Fri", tasks: 8 }, { day: "Sat", tasks: 4 }, { day: "Sun", tasks: 3 },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "tasks", label: "My Tasks", icon: CheckSquare },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "focus", label: "Focus Mode", icon: Target },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

const priorityMeta = {
  high: { label: "High priority", color: "var(--high)", dot: "🔴" },
  medium: { label: "Medium priority", color: "var(--med)", dot: "🟡" },
  low: { label: "Low priority", color: "var(--low)", dot: "🟢" },
};

/* ---------------------------- small building blocks ---------------------------- */

function Dot({ color }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />;
}

function ProgressBar({ value, height = 8, color = "var(--caramel)" }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "var(--beige)" }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

function RingProgress({ value, size = 64, stroke = 7, color = "var(--caramel-dark)", track = "var(--beige)", label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          style={{ "--ring-from": c, "--ring-to": offset, animation: "ffRing 1s ease-out both", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="ff-mono font-semibold" style={{ fontSize: size * 0.22, color: "var(--brown-dark)" }}>{label}</span>
        {sub && <span style={{ fontSize: size * 0.11, color: "var(--text-soft)" }}>{sub}</span>}
      </div>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0"
      style={{ width: 40, height: 22, borderRadius: 999, background: checked ? "var(--caramel-dark)" : "var(--beige-dark)" }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200"
        style={{ left: 3, transform: checked ? "translateX(18px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
      />
    </button>
  );
}

function Card({ children, className = "", style = {}, hover = false }) {
  return (
    <div
      className={`rounded-2xl p-5 ${hover ? "ff-hover-lift cursor-pointer" : ""} ${className}`}
      style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 1px 2px rgba(63,44,32,0.04)", transition: "transform .18s ease, box-shadow .18s ease", ...style }}
    >
      {children}
    </div>
  );
}

/* ---------------------------- Celebration effects ---------------------------- */

function Confetti({ trigger }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ["#C1834B", "#B15535", "#7C8759", "#6B4A33", "#D9C4A0", "#C1954A"];
    const batch = Array.from({ length: 70 }).map((_, i) => {
      const fromLeftSide = Math.random() < 0.5;
      return {
        id: `${trigger}-${i}`,
        left: fromLeftSide ? Math.random() * 12 : 88 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.9,
        rotate: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        xdrift: (fromLeftSide ? 1 : -1) * (60 + Math.random() * 260),
      };
    });
    setParticles(batch);
    const t = setTimeout(() => setParticles([]), 2100);
    return () => clearTimeout(t);
  }, [trigger]);
  if (particles.length === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="ff-confetti-piece"
          style={{
            left: `${p.left}%`, width: p.w, height: p.h, background: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
            "--xdrift": `${p.xdrift}px`, "--rotate": `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

function CelebrationToast({ show }) {
  if (!show) return null;
  return (
    <div className="ff-toast fixed top-5 left-1/2 z-[101] px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium text-white" style={{ background: "var(--brown-dark)", boxShadow: "0 12px 30px rgba(63,44,32,0.25)" }}>
      🎉 Nice work — task completed!
    </div>
  );
}

/* ---------------------------- Sidebar / TopBar ---------------------------- */

function Sidebar({ page, setPage, isMobile }) {
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 flex justify-around py-2 z-40" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        {NAV.map((n) => (
          <button key={n.key} onClick={() => setPage(n.key)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ff-hover-tint" style={{ color: page === n.key ? "var(--caramel-dark)" : "var(--text-soft)" }}>
            <n.icon size={18} />
            <span className="text-[10px]">{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 py-6 px-4" style={{ background: "var(--beige)", borderRight: "1px solid var(--beige-dark)" }}>
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--brown)" }}>
          <Sparkles size={16} color="var(--bg)" />
        </div>
        <span className="ff-display text-lg" style={{ color: "var(--brown-dark)" }}>FocusFlow</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const activeItem = page === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setPage(n.key)}
              className={`ff-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative`}
              style={{ background: activeItem ? "var(--surface)" : "transparent", color: activeItem ? "var(--brown-dark)" : "var(--text-soft)" }}
            >
              {activeItem && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full" style={{ background: "var(--caramel)" }} />}
              <n.icon size={17} />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <button onClick={() => setPage("settings")} className="ff-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: page === "settings" ? "var(--brown-dark)" : "var(--text-soft)", background: page === "settings" ? "var(--surface)" : "transparent" }}>
          <SettingsIcon size={17} /> Settings
        </button>
        <button onClick={() => setPage("profile")} className="ff-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: page === "profile" ? "var(--brown-dark)" : "var(--text-soft)", background: page === "profile" ? "var(--surface)" : "transparent" }}>
          <User size={17} /> Profile
        </button>
      </div>
    </div>
  );
}

function relativeDay(iso) {
  const diff = Math.round((new Date(iso) - new Date(todayISO())) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  return `${Math.abs(diff)}d overdue`;
}

function NotifRow({ icon: Icon, iconColor, iconBg, title, subtitle }) {
  return (
    <div className="flex gap-3 py-2.5 px-2 rounded-xl hover:bg-[color:var(--beige)] transition-colors">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={14} color={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight truncate">{title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-soft)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function NotificationsPanel({ tasks }) {
  const today = todayISO();
  const reminders = tasks.filter((t) => t.reminderOn && !t.completed && t.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3);
  const overdue = tasks.filter((t) => !t.completed && t.dueDate < today).slice(0, 2);
  const completedToday = tasks.filter((t) => t.completed && t.dueDate === today).length;
  const empty = reminders.length === 0 && overdue.length === 0 && completedToday === 0;

  return (
    <div className="ff-page absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50" style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 16px 40px rgba(63,44,32,0.16)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--beige)" }}>
        <span className="ff-display text-sm" style={{ color: "var(--brown-dark)" }}>Notifications</span>
        {(reminders.length + overdue.length) > 0 && (
          <span className="ff-mono text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: "var(--caramel-dark)" }}>{reminders.length + overdue.length} new</span>
        )}
      </div>

      <div className="p-2 max-h-80 overflow-y-auto">
        {empty && (
          <div className="flex flex-col items-center text-center py-8 gap-2">
            <Inbox size={22} color="var(--text-soft)" />
            <p className="text-xs" style={{ color: "var(--text-soft)" }}>You're all caught up.</p>
          </div>
        )}

        {overdue.length > 0 && (
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide px-2 pt-1 pb-1" style={{ color: "var(--high)" }}>Overdue</p>
            {overdue.map((t) => (
              <NotifRow key={t.id} icon={AlertCircle} iconColor="var(--high)" iconBg="rgba(177,85,53,0.14)" title={t.title} subtitle={relativeDay(t.dueDate)} />
            ))}
          </div>
        )}

        {reminders.length > 0 && (
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide px-2 pt-2 pb-1" style={{ color: "var(--caramel-dark)" }}>Reminders</p>
            {reminders.map((t) => (
              <NotifRow key={t.id} icon={BellRing} iconColor="var(--caramel-dark)" iconBg="rgba(193,131,75,0.16)" title={t.title} subtitle={`${t.reminderLead} · ${relativeDay(t.dueDate)} at ${t.time}`} />
            ))}
          </div>
        )}

        {completedToday > 0 && (
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide px-2 pt-2 pb-1" style={{ color: "var(--low)" }}>Today</p>
            <NotifRow icon={PartyPopper} iconColor="var(--low)" iconBg="rgba(124,135,89,0.16)" title={`${completedToday} task${completedToday === 1 ? "" : "s"} completed today`} subtitle="Nice pace — keep it up" />
          </div>
        )}
      </div>
    </div>
  );
}

function TopBar({ onAddTask, search, setSearch, tasks }) {
  const [showNotif, setShowNotif] = useState(false);
  const today = todayISO();
  const notifCount = tasks.filter((t) => (t.reminderOn && !t.completed && t.dueDate >= today) || (!t.completed && t.dueDate < today)).length;
  return (
    <div className="flex items-center gap-3 px-6 py-4 sticky top-0 z-30" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-2 flex-1 max-w-xs rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
        <Search size={15} color="var(--text-soft)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="bg-transparent outline-none text-sm w-full placeholder:text-[color:var(--text-soft)]" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onAddTask} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white hover:-translate-y-0.5 hover:shadow-md" style={{ background: "var(--caramel-dark)" }}>
          <Plus size={15} /> Add Task
        </button>
        <div className="relative">
          <button onClick={() => setShowNotif((s) => !s)} className="p-2.5 rounded-xl relative hover:-translate-y-0.5 hover:shadow-md" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
            <Bell size={16} color="var(--brown)" />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "var(--high)" }} />}
          </button>
          {showNotif && <NotificationsPanel tasks={tasks} />}
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center ff-display text-sm text-white" style={{ background: "var(--brown)" }}>A</div>
      </div>
    </div>
  );
}

/* ---------------------------- Task Modal ---------------------------- */

function TaskModal({ initial, projects, onClose, onSave }) {
  const [form, setForm] = useState(initial || { title: "", description: "", priority: "medium", category: "Personal", project: projects[0]?.id || null, dueDate: todayISO(), time: "09:00", duration: 30, reminderOn: true, reminderLead: "30 minutes before" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(63,44,32,0.35)" }}>
      <Card className="ff-page w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="ff-display text-lg" style={{ color: "var(--brown-dark)" }}>{initial ? "Edit task" : "Create new task"}</h3>
          <button onClick={onClose} className="hover:opacity-60"><X size={18} color="var(--text-soft)" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Task title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--caramel)]" style={{ border: "1px solid var(--line)" }} placeholder="e.g. Complete Portfolio Website" />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid var(--line)" }} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Priority</label>
            <div className="flex gap-2 mt-1">
              {["low", "medium", "high"].map((p) => (
                <button key={p} onClick={() => set("priority", p)} className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize hover:-translate-y-0.5" style={{ background: form.priority === p ? priorityMeta[p].color : "var(--beige)", color: form.priority === p ? "#fff" : "var(--text)" }}>{p}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }}>
                {["Personal", "Work", "University", "Learning"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Project</label>
              <select value={form.project || ""} onChange={(e) => set("project", e.target.value || null)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Due date</label>
              <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="w-full mt-1 rounded-lg px-2 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Time</label>
              <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className="w-full mt-1 rounded-lg px-2 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Minutes</label>
              <input type="number" value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} className="w-full mt-1 rounded-lg px-2 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }} />
            </div>
          </div>

          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "var(--beige)" }}>
            {form.reminderOn ? <BellRing size={16} color="var(--caramel-dark)" /> : <BellOff size={16} color="var(--text-soft)" />}
            <div className="flex-1">
              <p className="text-sm font-medium">Reminder</p>
              <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>{form.reminderOn ? "This task will appear on the calendar with a bell" : "No reminder — task still saves, just no alert"}</p>
            </div>
            <Switch checked={form.reminderOn} onChange={(v) => set("reminderOn", v)} />
          </div>
          {form.reminderOn && (
            <div className="ff-page">
              <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>Remind me</label>
              <select value={form.reminderLead} onChange={(e) => set("reminderLead", e.target.value)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--line)" }}>
                {["10 minutes before", "30 minutes before", "1 hour before", "1 day before"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium hover:-translate-y-0.5" style={{ background: "var(--beige)", color: "var(--text)" }}>Cancel</button>
          <button onClick={() => form.title.trim() && onSave({ ...form, id: initial?.id || nextId(), completed: initial?.completed || false, subtasks: initial?.subtasks || [], reminderOn: form.reminderOn ?? true, reminderLead: form.reminderLead || "30 minutes before" })} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:-translate-y-0.5 hover:shadow-md" style={{ background: "var(--caramel-dark)" }}>
            {initial ? "Save changes" : "Create task"}
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Task row / detail ---------------------------- */

function TaskRow({ task, project, onToggle, onEdit, onDelete, onOpen }) {
  const overdue = !task.completed && task.dueDate < todayISO();
  const meta = priorityMeta[task.priority];

  if (task.completed) {
    return (
      <div className="flex items-center gap-3 py-2.5 px-3 my-1 rounded-xl ff-pop" style={{ background: "rgba(124,135,89,0.08)", border: "1px solid rgba(124,135,89,0.18)" }}>
        <button onClick={() => onToggle(task.id)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ff-pop" style={{ background: "var(--low)" }}>
          <CheckCircle2 size={15} color="#fff" />
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(task)}>
          <p className="text-sm font-medium truncate ff-struck" style={{ color: "var(--text-soft)" }}>{task.title}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-md" style={{ color: "var(--low)", background: "rgba(124,135,89,0.15)" }}>Done</span>
        <button onClick={() => onDelete(task.id)} className="p-1 hover:opacity-70"><Trash2 size={13} color="var(--text-soft)" /></button>
      </div>
    );
  }

  return (
    <div className="ff-row flex items-center gap-3 py-3 px-2 group">
      <button onClick={() => onToggle(task.id)}><Circle size={20} color="var(--text-soft)" /></button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(task)}>
        <p className="text-sm font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px]" style={{ color: "var(--text-soft)" }}>
          <span className="flex items-center gap-1"><Dot color={meta.color} /> {task.priority}</span>
          {project && <span>{project.icon} {project.name}</span>}
          <span className="ff-mono" style={{ color: overdue ? "var(--high)" : "var(--text-soft)" }}>{overdue ? "Overdue · " : ""}{task.dueDate === todayISO() ? "Today" : task.dueDate}</span>
          <span className="ff-mono flex items-center gap-1"><Clock size={10} /> {task.duration}m</span>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-md hover:bg-[color:var(--beige)]" style={{ color: "var(--text-soft)" }}><Edit2 size={14} /></button>
        <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-md hover:bg-[color:var(--beige)]" style={{ color: "var(--high)" }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function TaskDetail({ task, project, onClose, onToggleSubtask, onToggle, onEdit }) {
  if (!task) return null;
  const meta = priorityMeta[task.priority];
  const done = task.subtasks.filter((s) => s.done).length;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(63,44,32,0.3)" }} onClick={onClose}>
      <div className="ff-page w-full max-w-sm h-full overflow-y-auto p-6" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="ff-display text-xl leading-snug" style={{ color: "var(--brown-dark)" }}>{task.title}</h3>
          <button onClick={onClose} className="hover:opacity-60"><X size={18} color="var(--text-soft)" /></button>
        </div>
        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: meta.color }}><Dot color={meta.color} /> {meta.label}</span>
        {task.description && <p className="text-sm mt-4" style={{ color: "var(--text-soft)" }}>{task.description}</p>}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl p-3" style={{ background: "var(--beige)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>Deadline</p>
            <p className="text-sm font-medium ff-mono">{task.dueDate} · {task.time}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--beige)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>Estimated time</p>
            <p className="text-sm font-medium ff-mono">{task.duration} min</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--beige)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>Category</p>
            <p className="text-sm font-medium">{task.category}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--beige)" }}>
            <p className="text-[11px]" style={{ color: "var(--text-soft)" }}>Project</p>
            <p className="text-sm font-medium">{project ? `${project.icon} ${project.name}` : "—"}</p>
          </div>
          <div className="rounded-xl p-3 col-span-2 flex items-center gap-2" style={{ background: "var(--beige)" }}>
            {task.reminderOn ? <BellRing size={14} color="var(--caramel-dark)" /> : <BellOff size={14} color="var(--text-soft)" />}
            <p className="text-sm font-medium">{task.reminderOn ? `Reminder on · ${task.reminderLead}` : "Reminder off"}</p>
          </div>
        </div>
        {task.subtasks.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-soft)" }}>Subtasks · {done}/{task.subtasks.length}</p>
            <ProgressBar value={(done / task.subtasks.length) * 100} />
            <div className="flex flex-col mt-3 gap-2">
              {task.subtasks.map((s) => (
                <button key={s.id} onClick={() => onToggleSubtask(task.id, s.id)} className="flex items-center gap-2 text-sm text-left hover:opacity-80">
                  {s.done ? <CheckCircle2 size={16} color="var(--low)" /> : <Circle size={16} color="var(--text-soft)" />}
                  <span className={s.done ? "ff-struck" : ""} style={{ color: s.done ? "var(--text-soft)" : "var(--text)" }}>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-6">
          <button onClick={() => onEdit(task)} className="flex-1 py-2 rounded-lg text-sm font-medium hover:-translate-y-0.5" style={{ background: "var(--beige)" }}>Edit</button>
          <button onClick={() => onToggle(task.id)} className="flex-1 py-2 rounded-lg text-sm font-medium text-white hover:-translate-y-0.5 hover:shadow-md" style={{ background: task.completed ? "var(--text-soft)" : "var(--low)" }}>
            {task.completed ? "Mark incomplete" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Dashboard ---------------------------- */

function scoreTask(t) {
  const weight = { high: 3, medium: 2, low: 1 }[t.priority];
  const overdue = t.dueDate < todayISO() ? 5 : 0;
  const dueToday = t.dueDate === todayISO() ? 3 : 0;
  return weight * 2 + overdue + dueToday;
}

function Dashboard({ tasks, projects, onOpen, onStartFocus, setPage }) {
  const [tab, setTab] = useState("priorities");
  const today = todayISO();
  const todays = tasks.filter((t) => t.dueDate === today);
  const completedToday = todays.filter((t) => t.completed).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate < today).length;
  const pending = tasks.filter((t) => !t.completed && t.dueDate >= today).length;
  const progress = todays.length ? (completedToday / todays.length) * 100 : 0;

  const byPriority = ["high", "medium", "low"].map((p) => ({
    p, task: tasks.filter((t) => !t.completed && t.priority === p).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0],
  })).filter((x) => x.task);

  const schedule = [...todays].sort((a, b) => a.time.localeCompare(b.time));
  const recommended = [...tasks].filter((t) => !t.completed).sort((a, b) => scoreTask(b) - scoreTask(a))[0];

  return (
    <div className="flex flex-col gap-7 ff-stagger">
      <div>
        <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>Good morning, Arooj</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-soft)" }}>Here's what deserves your attention today.</p>
      </div>

      {recommended && (
        <Card style={{ background: "linear-gradient(135deg, var(--brown-dark), var(--brown))" }} className="text-white flex items-center gap-6 flex-wrap">
          <RingProgress value={progress} size={76} stroke={7} color="#F0DDBB" track="rgba(255,255,255,0.18)" label={`${Math.round(progress)}%`} sub="today" />
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-1.5 mb-1.5 opacity-90"><Zap size={14} /><span className="text-xs font-semibold uppercase tracking-wide">Focus recommendation</span></div>
            <p className="ff-display text-lg">{recommended.title}</p>
            <p className="text-xs mt-1 opacity-80">{priorityMeta[recommended.priority].label} · {recommended.dueDate === today ? "due today" : `due ${recommended.dueDate}`} · {recommended.duration} min estimated</p>
          </div>
          <button onClick={() => onStartFocus(recommended)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg" style={{ background: "var(--surface)", color: "var(--brown-dark)" }}>
            <Play size={14} /> Start focus
          </button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Completed today", value: completedToday, total: Math.max(todays.length, 1), color: "var(--low)" },
          { label: "Pending", value: pending, total: Math.max(tasks.length, 1), color: "var(--med)" },
          { label: "Overdue", value: overdue, total: Math.max(tasks.length, 1), color: "var(--high)" },
        ].map((s) => (
          <Card key={s.label} hover className="flex items-center gap-3">
            <RingProgress value={(s.value / s.total) * 100} size={48} stroke={5} color={s.color} label={s.value} />
            <p className="text-xs font-medium leading-tight" style={{ color: "var(--text-soft)" }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: "var(--beige)" }}>
          {[["priorities", "Priorities"], ["schedule", "Today's schedule"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className="px-3.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: tab === key ? "var(--surface)" : "transparent", color: tab === key ? "var(--brown-dark)" : "var(--text-soft)" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "priorities" && (
          <div className="flex flex-col gap-2 ff-page">
            {byPriority.length === 0 && <p className="text-sm py-4" style={{ color: "var(--text-soft)" }}>Nothing pending — great work!</p>}
            {byPriority.map(({ p, task }) => (
              <div key={p} className="ff-row flex items-center justify-between p-3 cursor-pointer" onClick={() => onOpen(task)}>
                <div className="flex items-center gap-3">
                  <Dot color={priorityMeta[p].color} />
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-soft)" }}>{task.dueDate === today ? "Due today" : `Due ${task.dueDate}`}</p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-soft)" />
              </div>
            ))}
          </div>
        )}

        {tab === "schedule" && (
          <div className="flex flex-col ff-page">
            {schedule.length === 0 && <p className="text-sm py-4" style={{ color: "var(--text-soft)" }}>Nothing scheduled for today.</p>}
            {schedule.map((t) => (
              <div key={t.id} className="flex gap-3 pb-4 relative">
                <div className="flex flex-col items-center">
                  <span className="ff-mono text-xs font-medium w-12" style={{ color: "var(--caramel-dark)" }}>{t.time}</span>
                  <div className="w-px flex-1 mt-1" style={{ background: "var(--line)" }} />
                </div>
                <div className="cursor-pointer" onClick={() => onOpen(t)}>
                  <p className={`text-sm font-medium ${t.completed ? "ff-struck" : ""}`} style={{ color: t.completed ? "var(--text-soft)" : "var(--text)" }}>{t.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-soft)" }}>{t.duration} min</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------- Tasks Page ---------------------------- */

function TasksPage({ tasks, projects, search, onOpen, onEdit, onToggle, onDelete }) {
  const [filter, setFilter] = useState("all");
  const today = todayISO();
  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "today") return t.dueDate === today;
    if (filter === "upcoming") return t.dueDate > today && !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "overdue") return !t.completed && t.dueDate < today;
    return true;
  });
  const tabs = ["all", "today", "upcoming", "completed", "overdue"];

  return (
    <div className="flex flex-col gap-4 ff-page">
      <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>My Tasks</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tKey) => (
          <button key={tKey} onClick={() => setFilter(tKey)} className="px-3.5 py-1.5 rounded-full text-xs font-medium capitalize hover:-translate-y-0.5" style={{ background: filter === tKey ? "var(--brown)" : "var(--beige)", color: filter === tKey ? "#fff" : "var(--text)" }}>
            {tKey}
          </button>
        ))}
      </div>
      <Card>
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-soft)" }}>No tasks here. Add one to get started.</p>
        ) : (
          filtered.map((t) => <TaskRow key={t.id} task={t} project={projects.find((p) => p.id === t.project)} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onOpen={onOpen} />)
        )}
      </Card>
    </div>
  );
}

/* ---------------------------- Calendar Page ---------------------------- */

function CalendarPage({ tasks, onOpen }) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array(daysInMonth).keys()].map((d) => (d === null ? null : d + 1));
  const tasksOn = (day) => { const iso = new Date(year, month, day).toISOString().slice(0, 10); return tasks.filter((t) => t.dueDate === iso); };

  return (
    <div className="flex flex-col gap-4 ff-page">
      <div className="flex items-center justify-between">
        <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>{cursor.toLocaleString("default", { month: "long" })} {year}</h1>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:-translate-y-0.5" style={{ background: "var(--beige)" }}><ChevronLeft size={16} /></button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-2 rounded-lg text-xs font-medium hover:-translate-y-0.5" style={{ background: "var(--beige)" }}>Today</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:-translate-y-0.5" style={{ background: "var(--beige)" }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <Card>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: "var(--text-soft)" }}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dayTasks = tasksOn(day);
            const reminderCount = dayTasks.filter((t) => t.reminderOn).length;
            const isToday = new Date(year, month, day).toISOString().slice(0, 10) === todayISO();
            return (
              <div key={i} className="min-h-[80px] rounded-xl p-1.5 transition-colors hover:bg-[color:var(--beige)]" style={{ background: isToday ? "var(--beige)" : "var(--bg)", border: isToday ? "1px solid var(--caramel)" : "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <span
                    className="ff-display text-[12px] flex items-center justify-center"
                    style={{
                      color: isToday ? "#fff" : "var(--text)",
                      background: isToday ? "var(--caramel-dark)" : "transparent",
                      width: 20, height: 20, borderRadius: "50%",
                    }}
                  >
                    {day}
                  </span>
                  {reminderCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <BellRing size={10} color="var(--caramel-dark)" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onOpen(t)}
                      className="text-[10px] font-medium truncate text-left px-1.5 py-0.5 rounded-md hover:opacity-80 flex items-center gap-1"
                      style={{ background: priorityMeta[t.priority].color + "1F", color: priorityMeta[t.priority].color }}
                    >
                      {t.reminderOn && <BellRing size={9} />}
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {dayTasks.length > 3 && <span className="text-[10px] font-medium px-1.5" style={{ color: "var(--text-soft)" }}>+{dayTasks.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Projects Page ---------------------------- */

function ProjectsPage({ projects, tasks, onOpen }) {
  const [openProject, setOpenProject] = useState(null);
  return (
    <div className="flex flex-col gap-4 ff-page">
      <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>My Projects</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const pTasks = tasks.filter((t) => t.project === p.id);
          const done = pTasks.filter((t) => t.completed).length;
          const pct = pTasks.length ? (done / pTasks.length) * 100 : 0;
          return (
            <Card key={p.id} hover style={{ borderColor: openProject === p.id ? p.color : "var(--line)" }}>
              <div onClick={() => setOpenProject(openProject === p.id ? null : p.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg">{p.icon} <span className="ff-display text-base" style={{ color: "var(--brown-dark)" }}>{p.name}</span></div>
                  <RingProgress value={pct} size={40} stroke={4} color={p.color} label={`${Math.round(pct)}`} />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-soft)" }}>{pTasks.length} tasks · {done} done</p>
              </div>
              {openProject === p.id && (
                <div className="mt-4 pt-4 flex flex-col gap-2 ff-page" style={{ borderTop: "1px solid var(--line)" }}>
                  {pTasks.length === 0 && <p className="text-xs" style={{ color: "var(--text-soft)" }}>No tasks yet in this project.</p>}
                  {pTasks.map((t) => (
                    <button key={t.id} onClick={() => onOpen(t)} className="flex items-center gap-2 text-left text-sm hover:opacity-70">
                      {t.completed ? <CheckCircle2 size={14} color="var(--low)" /> : <Circle size={14} color="var(--text-soft)" />}
                      <span className={t.completed ? "ff-struck" : ""} style={{ color: t.completed ? "var(--text-soft)" : "var(--text)" }}>{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- Focus Mode ---------------------------- */

function FocusMode({ tasks, activeTask, setActiveTask, hoursBudget, setHoursBudget }) {
  const [seconds, setSeconds] = useState((activeTask?.duration || 30) * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState("silent");
  const intervalRef = useRef(null);

  useEffect(() => { setSeconds((activeTask?.duration || 30) * 60); setRunning(false); }, [activeTask]);
  useEffect(() => {
    if (running) intervalRef.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const total = (activeTask?.duration || 30) * 60;
  const pct = ((total - seconds) / total) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const plan = useMemo(() => {
    let budget = hoursBudget * 60;
    const candidates = [...tasks].filter((t) => !t.completed).sort((a, b) => scoreTask(b) - scoreTask(a));
    const chosen = []; let clock = 9 * 60;
    for (const t of candidates) {
      if (budget <= 0) break;
      const use = Math.min(t.duration, budget);
      chosen.push({ task: t, start: clock, len: use });
      clock += use + 10; budget -= use;
    }
    return chosen;
  }, [tasks, hoursBudget]);

  const fmt = (mins) => { const h = Math.floor(mins / 60).toString().padStart(2, "0"); const m = (mins % 60).toString().padStart(2, "0"); return `${h}:${m}`; };
  const r = 80, c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col gap-8 items-center ff-page">
      <h1 className="ff-display text-2xl self-start" style={{ color: "var(--brown-dark)" }}>Focus Mode</h1>
      <Card className="w-full max-w-md flex flex-col items-center py-10">
        {activeTask ? (
          <>
            <p className="ff-display text-lg text-center px-4" style={{ color: "var(--brown-dark)" }}>{activeTask.title}</p>
            <div className="relative my-6">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={r} fill="none" stroke="var(--beige)" strokeWidth="12" />
                <circle cx="100" cy="100" r={r} fill="none" stroke="var(--caramel-dark)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform="rotate(-90 100 100)" style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="ff-mono text-3xl font-semibold" style={{ color: "var(--brown-dark)" }}>{mm}:{ss}</span>
              </div>
            </div>
            <button onClick={() => setRunning((r) => !r)} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white hover:-translate-y-0.5 hover:shadow-md" style={{ background: "var(--caramel-dark)" }}>
              {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
            </button>
            <div className="flex gap-2 mt-6">
              {[["silent", "🔇 Silent"], ["rain", "🌧 Rain"], ["cafe", "☕ Cafe"], ["waves", "🌊 Waves"]].map(([k, label]) => (
                <button key={k} onClick={() => setSound(k)} className="px-2.5 py-1.5 rounded-lg text-[11px] hover:-translate-y-0.5" style={{ background: sound === k ? "var(--beige)" : "transparent", color: "var(--text-soft)" }}>{label}</button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center px-6">
            <Target size={28} color="var(--text-soft)" className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "var(--text-soft)" }}>Pick a task below to start a focus session.</p>
          </div>
        )}
      </Card>

      {!activeTask && (
        <div className="w-full grid gap-2">
          {tasks.filter((t) => !t.completed).slice(0, 5).map((t) => (
            <button key={t.id} onClick={() => setActiveTask(t)} className="flex items-center justify-between p-3 rounded-xl text-left ff-hover-lift" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              <span className="text-sm font-medium">{t.title}</span>
              <span className="text-xs ff-mono flex items-center gap-1" style={{ color: "var(--text-soft)" }}><Dot color={priorityMeta[t.priority].color} /> {t.duration}m</span>
            </button>
          ))}
        </div>
      )}

      <Card className="w-full">
        <p className="text-sm font-semibold mb-1">Plan My Day</p>
        <p className="text-xs mb-3" style={{ color: "var(--text-soft)" }}>How much time do you have today?</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {[0.5, 1, 2, 4].map((h) => (
            <button key={h} onClick={() => setHoursBudget(h)} className="px-3.5 py-1.5 rounded-full text-xs font-medium hover:-translate-y-0.5" style={{ background: hoursBudget === h ? "var(--brown)" : "var(--beige)", color: hoursBudget === h ? "#fff" : "var(--text)" }}>
              {h < 1 ? "30 minutes" : h === 1 ? "1 hour" : h === 4 ? "4+ hours" : `${h} hours`}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {plan.map(({ task, start, len }, i) => (
            <div key={i} className="ff-row flex items-center gap-3 p-2.5">
              <span className="ff-mono text-xs w-28" style={{ color: "var(--caramel-dark)" }}>{fmt(start)}–{fmt(start + len)}</span>
              <Dot color={priorityMeta[task.priority].color} />
              <span className="text-sm flex-1">{task.title}</span>
              <button onClick={() => setActiveTask(task)} className="text-xs font-medium hover:opacity-70" style={{ color: "var(--caramel-dark)" }}>Start</button>
            </div>
          ))}
          {plan.length === 0 && <p className="text-sm" style={{ color: "var(--text-soft)" }}>No pending tasks to schedule.</p>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Analytics Page ---------------------------- */

const PIE_COLORS = ["var(--low)", "var(--med)", "var(--high)"];

function AnalyticsPage({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate < todayISO()).length;
  const pending = total - completed - overdue;

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
    { name: "Overdue", value: overdue },
  ];

  const categories = ["University", "Work", "Personal", "Learning"].map((c) => ({ name: c, count: tasks.filter((t) => t.category === c).length })).filter((c) => c.count > 0);

  const highDone = tasks.filter((t) => t.priority === "high");
  const highRate = highDone.length ? Math.round((highDone.filter((t) => t.completed).length / highDone.length) * 100) : 0;
  const lowDone = tasks.filter((t) => t.priority === "low");
  const lowRate = lowDone.length ? Math.round((lowDone.filter((t) => t.completed).length / lowDone.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 ff-page">
      <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>Productivity Analytics</h1>

      <Card>
        <p className="text-sm font-semibold mb-4">Weekly Progress</p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyCompleted}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8A7361" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8A7361" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E3D3B8", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="tasks" fill="#C1834B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-6">
          <div style={{ width: 140, height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E3D3B8", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold mb-1">This week</p>
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <Dot color={PIE_COLORS[i]} /> <span style={{ color: "var(--text-soft)" }}>{d.name}</span> <span className="ff-mono font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold mb-3">Category Breakdown</p>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={categories} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#8A7361" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E3D3B8", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6B4A33" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><AlertCircle size={15} color="var(--caramel-dark)" /> Productivity Insights</p>
        <div className="flex flex-col gap-2.5 text-sm">
          <p>You complete <span className="ff-mono font-medium">{highRate}%</span> of high-priority tasks, but only <span className="ff-mono font-medium">{lowRate}%</span> of low-priority tasks.</p>
          <p>You have <span className="ff-mono font-medium">{overdue}</span> overdue task{overdue === 1 ? "" : "s"} right now.</p>
          <p>Your busiest category this month is <span className="font-medium">{categories.sort((a, b) => b.count - a.count)[0]?.name || "—"}</span>.</p>
          <p>Average estimated task length across your list is <span className="ff-mono font-medium">{tasks.length ? Math.round(tasks.reduce((a, t) => a + t.duration, 0) / tasks.length) : 0} min</span>.</p>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Settings / Profile ---------------------------- */

function SettingsPage({ settings, setSettings }) {
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  return (
    <div className="flex flex-col gap-6 max-w-lg ff-page">
      <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>Settings</h1>
      <Card>
        <p className="text-sm font-semibold mb-3">Appearance</p>
        <div className="flex gap-2">
          {["Light", "Warm", "System"].map((t) => (
            <button key={t} onClick={() => set("theme", t)} className="flex-1 py-2 rounded-lg text-xs font-medium hover:-translate-y-0.5" style={{ background: settings.theme === t ? "var(--brown)" : "var(--beige)", color: settings.theme === t ? "#fff" : "var(--text)" }}>{t}</button>
          ))}
        </div>
      </Card>
      <Card>
        <p className="text-sm font-semibold mb-3">Notifications</p>
        {[["taskReminders", "Task reminders"], ["deadlineAlerts", "Deadline alerts"], ["dailyReminder", "Daily productivity reminder"]].map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm py-1.5 cursor-pointer">
            <input type="checkbox" checked={settings[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[var(--caramel-dark)]" />
            {label}
          </label>
        ))}
      </Card>
      <Card>
        <p className="text-sm font-semibold mb-3">Productivity</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs" style={{ color: "var(--text-soft)" }}>Daily goal</label><input type="number" value={settings.dailyGoal} onChange={(e) => set("dailyGoal", Number(e.target.value))} className="w-full mt-1 rounded-lg px-2 py-1.5 text-sm outline-none" style={{ border: "1px solid var(--line)" }} /></div>
          <div><label className="text-xs" style={{ color: "var(--text-soft)" }}>Focus (min)</label><input type="number" value={settings.focusMin} onChange={(e) => set("focusMin", Number(e.target.value))} className="w-full mt-1 rounded-lg px-2 py-1.5 text-sm outline-none" style={{ border: "1px solid var(--line)" }} /></div>
          <div><label className="text-xs" style={{ color: "var(--text-soft)" }}>Break (min)</label><input type="number" value={settings.breakMin} onChange={(e) => set("breakMin", Number(e.target.value))} className="w-full mt-1 rounded-lg px-2 py-1.5 text-sm outline-none" style={{ border: "1px solid var(--line)" }} /></div>
        </div>
      </Card>
      <p className="text-xs" style={{ color: "var(--text-soft)" }}>This preview keeps settings in memory for the session — connect a backend to persist them across visits.</p>
    </div>
  );
}

function ProfilePage({ tasks }) {
  const completed = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const achievements = [{ icon: Trophy, label: "First 10 Tasks" }, { icon: Flame, label: "3 Day Streak" }, { icon: Award, label: "Focus Master" }, { icon: Zap, label: "Fast Finisher" }];
  return (
    <div className="flex flex-col gap-6 max-w-lg ff-page">
      <h1 className="ff-display text-2xl" style={{ color: "var(--brown-dark)" }}>Profile</h1>
      <Card className="flex items-center gap-4">
        <RingProgress value={pct} size={64} stroke={6} color="var(--caramel-dark)" label={`${pct}%`} />
        <div className="flex-1">
          <p className="ff-display text-lg" style={{ color: "var(--brown-dark)" }}>Arooj Fatima</p>
          <p className="text-xs" style={{ color: "var(--text-soft)" }}>Productivity level</p>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        <Card hover><p className="text-xs" style={{ color: "var(--text-soft)" }}>Tasks completed</p><p className="ff-mono text-2xl font-semibold mt-1" style={{ color: "var(--brown-dark)" }}>{completed}</p></Card>
        <Card hover><p className="text-xs" style={{ color: "var(--text-soft)" }}>Current streak</p><p className="ff-mono text-2xl font-semibold mt-1 flex items-center gap-1" style={{ color: "var(--caramel-dark)" }}><Flame size={18} /> 7</p></Card>
      </div>
      <Card>
        <p className="text-sm font-semibold mb-3">Achievements</p>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div key={a.label} className="flex items-center gap-2 p-2.5 rounded-xl ff-hover-lift" style={{ background: "var(--beige)" }}>
              <a.icon size={16} color="var(--caramel-dark)" />
              <span className="text-xs font-medium">{a.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------- Root App ---------------------------- */

export default function FocusFlowApp() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState(seedTasks);
  const [projects] = useState(seedProjects);
  const [search, setSearch] = useState("");
  const [modalTask, setModalTask] = useState(undefined);
  const [detailTask, setDetailTask] = useState(null);
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [hoursBudget, setHoursBudget] = useState(2);
  const [settings, setSettings] = useState({ theme: "Warm", taskReminders: true, deadlineAlerts: true, dailyReminder: false, dailyGoal: 5, focusMin: 45, breakMin: 10 });
  const [celebrate, setCelebrate] = useState(0);
  const [toast, setToast] = useState(false);

  const saveTask = (t) => {
    setTasks((ts) => { const exists = ts.some((x) => x.id === t.id); return exists ? ts.map((x) => (x.id === t.id ? t : x)) : [...ts, t]; });
    setModalTask(undefined);
  };

  const toggleTask = (id) => {
    setTasks((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const nowCompleted = !t.completed;
      if (nowCompleted) {
        setCelebrate((c) => c + 1);
        setToast(true);
        setTimeout(() => setToast(false), 2300);
      }
      return { ...t, completed: nowCompleted };
    }));
  };

  const deleteTask = (id) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const toggleSubtask = (taskId, subId) => setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) } : t)));
  const openDetail = (t) => setDetailTask(t);
  const editFromDetail = (t) => { setDetailTask(null); setModalTask(t); };
  const projectFor = (t) => projects.find((p) => p.id === t?.project);

  return (
    <div className="ff-root min-h-screen w-full flex">
      <style>{TOKENS}</style>
      <Confetti trigger={celebrate} />
      <CelebrationToast show={toast} />
      <Sidebar page={page} setPage={setPage} />
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        <TopBar onAddTask={() => setModalTask(null)} search={search} setSearch={setSearch} tasks={tasks} />
        <div className="px-6 pb-10" key={page}>
          {page === "dashboard" && <Dashboard tasks={tasks} projects={projects} onOpen={openDetail} onStartFocus={(t) => { setActiveFocusTask(t); setPage("focus"); }} setPage={setPage} />}
          {page === "tasks" && <TasksPage tasks={tasks} projects={projects} search={search} onOpen={openDetail} onEdit={(t) => setModalTask(t)} onToggle={toggleTask} onDelete={deleteTask} />}
          {page === "calendar" && <CalendarPage tasks={tasks} onOpen={openDetail} />}
          {page === "projects" && <ProjectsPage projects={projects} tasks={tasks} onOpen={openDetail} />}
          {page === "focus" && <FocusMode tasks={tasks} activeTask={activeFocusTask} setActiveTask={setActiveFocusTask} hoursBudget={hoursBudget} setHoursBudget={setHoursBudget} />}
          {page === "analytics" && <AnalyticsPage tasks={tasks} />}
          {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
          {page === "profile" && <ProfilePage tasks={tasks} />}
        </div>
      </div>
      <Sidebar page={page} setPage={setPage} isMobile />
      {modalTask !== undefined && <TaskModal initial={modalTask} projects={projects} onClose={() => setModalTask(undefined)} onSave={saveTask} />}
      {detailTask && <TaskDetail task={detailTask} project={projectFor(detailTask)} onClose={() => setDetailTask(null)} onToggleSubtask={toggleSubtask} onToggle={(id) => { toggleTask(id); setDetailTask(null); }} onEdit={editFromDetail} />}
    </div>
  );
}
