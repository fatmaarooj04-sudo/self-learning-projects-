import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Home, Users, Stethoscope, Milk, Leaf, Syringe, Baby, Map as MapIcon,
  Wallet, BarChart3, Bell, Search, X, Check, AlertTriangle, Plus,
  Calendar, Droplets, HeartPulse, QrCode, ChevronRight, TrendingUp,
  TrendingDown, MapPin, Sparkles, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  THEME                                                                  */
/* ---------------------------------------------------------------------- */
const T = {
  cream: "#F7F1E4",
  creamDark: "#EDE2C9",
  paper: "#FCF9F1",
  ink: "#233821",
  green900: "#1D2F1E",
  green800: "#25402A",
  green700: "#33573A",
  green600: "#456F45",
  green500: "#5C8A52",
  green400: "#83A96C",
  green300: "#AFC79A",
  green200: "#D3E0C1",
  gold: "#C99A3E",
  goldSoft: "#E4C687",
  red: "#B4503B",
  redSoft: "#E9C4B7",
  amber: "#C68A2E",
  amberSoft: "#EFD9A8",
  blue: "#4C7793",
};

const STATUS_COLOR = { healthy: T.green500, monitoring: T.amber, critical: T.red };
const STATUS_LABEL = { healthy: "Healthy", monitoring: "Monitoring", critical: "Needs Attention" };
const PIE_COLORS = [T.green600, T.green400, T.gold, T.blue, T.red, T.green300];

/* ---------------------------------------------------------------------- */
/*  MOCK DATA                                                              */
/* ---------------------------------------------------------------------- */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const REPRO_STAGES = [
  "Heat Detected", "AI Performed", "Pregnancy Check",
  "Confirmed Pregnant", "Expected Calving", "Calved", "Lactating",
];

const initialAnimals = [
  {
    id: "D-1047", shed: "A", breed: "Holstein Friesian", age: 4, weight: 480,
    status: "healthy", reproStage: "Lactating",
    sessions: { morning: 12.4, afternoon: 9.8, evening: 11.2 },
    weeklyMilk: [31, 32, 30, 33.4, 33.4, 34, 33],
    lastVet: "2026-08-05",
    timeline: [
      { date: "2026-01-12", type: "Vaccination", note: "FMD booster administered." },
      { date: "2026-02-03", type: "Illness", note: "Mild fever, treated with antipyretic." },
      { date: "2026-04-17", type: "Reproductive", note: "Artificial insemination performed." },
      { date: "2026-08-19", type: "Checkup", note: "Routine examination — all normal." },
    ],
  },
  {
    id: "D-2031", shed: "A", breed: "Jersey", age: 3, weight: 410,
    status: "monitoring", reproStage: "Lactating",
    sessions: { morning: 8.1, afternoon: 6.4, evening: 7.0 },
    weeklyMilk: [24, 23.5, 22, 21.9, 21.5, 21.5, 21.5],
    lastVet: "2026-08-18",
    timeline: [
      { date: "2026-03-02", type: "Vaccination", note: "Rabies vaccine administered." },
      { date: "2026-07-30", type: "Observation", note: "Slight discomfort during milking noted." },
      { date: "2026-08-18", type: "Diagnosis", note: "Suspected early-stage mastitis, flagged for vet." },
    ],
  },
  {
    id: "D-1198", shed: "A", breed: "Sahiwal", age: 5, weight: 460,
    status: "healthy", reproStage: "Confirmed Pregnant",
    sessions: { morning: 10.1, afternoon: 8.9, evening: 9.4 },
    weeklyMilk: [28, 28.3, 28.9, 28.5, 28.4, 28.7, 28.4],
    lastVet: "2026-08-10",
    timeline: [
      { date: "2026-02-14", type: "Reproductive", note: "Heat detected, AI scheduled." },
      { date: "2026-03-01", type: "Reproductive", note: "Artificial insemination performed." },
      { date: "2026-05-21", type: "Reproductive", note: "Pregnancy confirmed via ultrasound." },
      { date: "2026-08-10", type: "Checkup", note: "Prenatal checkup — healthy progression." },
    ],
  },
  {
    id: "D-1842", shed: "B", breed: "Holstein Friesian", age: 6, weight: 510,
    status: "healthy", reproStage: "Lactating",
    sessions: { morning: 13.0, afternoon: 10.5, evening: 12.1 },
    weeklyMilk: [35, 35.4, 35.9, 35.6, 35.5, 35.7, 35.6],
    lastVet: "2026-07-22",
    timeline: [
      { date: "2026-01-30", type: "Vaccination", note: "HS vaccine administered." },
      { date: "2026-07-22", type: "Checkup", note: "Routine examination — excellent condition." },
    ],
  },
  {
    id: "D-1821", shed: "B", breed: "Cholistani", age: 4, weight: 445,
    status: "monitoring", reproStage: "Expected Calving",
    sessions: { morning: 7.2, afternoon: 6.0, evening: 6.5 },
    weeklyMilk: [21, 20.5, 20, 19.8, 19.9, 19.7, 19.7],
    lastVet: "2026-08-15",
    dueInDays: 12,
    timeline: [
      { date: "2026-01-05", type: "Reproductive", note: "Artificial insemination performed." },
      { date: "2026-03-18", type: "Reproductive", note: "Pregnancy confirmed." },
      { date: "2026-08-15", type: "Checkup", note: "Prenatal checkup — calving preparation advised." },
    ],
  },
  {
    id: "D-1901", shed: "B", breed: "Jersey", age: 7, weight: 400,
    status: "critical", reproStage: "Lactating",
    sessions: { morning: 5.0, afternoon: 4.2, evening: 4.4 },
    weeklyMilk: [18, 17, 15.5, 14.8, 14.1, 13.8, 13.6],
    lastVet: "2026-08-19",
    timeline: [
      { date: "2026-06-11", type: "Vaccination", note: "FMD booster administered." },
      { date: "2026-08-17", type: "Observation", note: "Milk yield dropping steadily." },
      { date: "2026-08-19", type: "Alert", note: "Flagged urgent — production down 23% this week." },
    ],
  },
  {
    id: "D-2210", shed: "C", breed: "Sahiwal", age: 3, weight: 420,
    status: "healthy", reproStage: "AI Performed",
    sessions: { morning: 9.4, afternoon: 7.8, evening: 8.6 },
    weeklyMilk: [25, 25.4, 25.7, 25.8, 25.8, 25.9, 25.8],
    lastVet: "2026-08-02",
    timeline: [
      { date: "2026-07-29", type: "Reproductive", note: "Heat detected." },
      { date: "2026-08-02", type: "Reproductive", note: "Artificial insemination performed." },
    ],
  },
  {
    id: "D-1755", shed: "C", breed: "Holstein Friesian", age: 5, weight: 495,
    status: "healthy", reproStage: "Lactating",
    sessions: { morning: 12.8, afternoon: 10.1, evening: 11.6 },
    weeklyMilk: [33, 33.6, 34.1, 34.5, 34.3, 34.6, 34.5],
    lastVet: "2026-07-28",
    timeline: [
      { date: "2026-04-09", type: "Vaccination", note: "Rabies vaccine administered." },
      { date: "2026-07-28", type: "Checkup", note: "Routine examination — normal." },
    ],
  },
  {
    id: "D-2099", shed: "C", breed: "Cholistani", age: 2, weight: 360,
    status: "monitoring", reproStage: "Pregnancy Check",
    sessions: { morning: 6.5, afternoon: 5.4, evening: 5.9 },
    weeklyMilk: [19, 18.7, 18.5, 18.2, 18.1, 17.9, 17.8],
    lastVet: "2026-08-16",
    timeline: [
      { date: "2026-06-20", type: "Reproductive", note: "Artificial insemination performed." },
      { date: "2026-08-16", type: "Reproductive", note: "Pregnancy check scheduled." },
    ],
  },
];

const initialAlerts = [
  { id: "a1", level: "urgent", title: "Veterinary attention required", message: "Cow D-1901 milk yield fell 23.5% this week (18L → 13.6L).", animalId: "D-1901" },
  { id: "a2", level: "important", title: "5 vaccinations due this week", message: "Check the Vaccination Center for the full schedule.", animalId: null },
  { id: "a3", level: "important", title: "Possible mastitis", message: "Cow D-2031 showed discomfort during milking, flagged for exam.", animalId: "D-2031" },
  { id: "a4", level: "reminder", title: "Calving preparation", message: "Cow D-1821 expected to calve in 12 days — prepare the separate pen.", animalId: "D-1821" },
  { id: "a5", level: "info", title: "Production up farm-wide", message: "Today's total milk production is 8.4% higher than yesterday.", animalId: null },
];

const initialAppointments = [
  { id: "p1", time: "08:30", animalId: "D-1047", reason: "Routine examination", done: false },
  { id: "p2", time: "10:00", animalId: "D-2031", reason: "Possible mastitis", done: false },
  { id: "p3", time: "11:30", animalId: "D-1198", reason: "Pregnancy check", done: false },
  { id: "p4", time: "14:00", animalId: "D-1842", reason: "Vaccination", done: true },
  { id: "p5", time: "15:15", animalId: "D-1901", reason: "Urgent — falling milk yield", done: false },
];

const initialFeed = [
  { id: "f1", name: "Hay", emoji: "🌾", qty: 420 },
  { id: "f2", name: "Corn", emoji: "🌽", qty: 180 },
  { id: "f3", name: "Silage", emoji: "🥬", qty: 300 },
  { id: "f4", name: "Concentrate", emoji: "🌱", qty: 140 },
];

const initialVaccinations = [
  { id: "v1", animalId: "D-1198", vaccine: "Rabies", due: "Aug 20", done: false },
  { id: "v2", animalId: "D-2210", vaccine: "FMD", due: "Aug 22", done: false },
  { id: "v3", animalId: "D-1821", vaccine: "HS", due: "Aug 25", done: false },
  { id: "v4", animalId: "D-2099", vaccine: "Rabies", due: "Aug 27", done: false },
];

const initialExpenses = { feed: 42000, medicine: 9500, vet: 12000, labor: 58000, electricity: 11000, maintenance: 7500 };

const trendData = [
  { month: "Mar", milk: 920 }, { month: "Apr", milk: 980 }, { month: "May", milk: 1010 },
  { month: "Jun", milk: 1120 }, { month: "Jul", milk: 1210 }, { month: "Aug", milk: 1268 },
];

/* ---------------------------------------------------------------------- */
/*  HELPERS                                                                */
/* ---------------------------------------------------------------------- */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    let raf;
    const from = prevTarget.current;
    const start = performance.now();
    function step(ts) {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else prevTarget.current = target;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

function fmt1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
function fmt0(n) { return Math.round(n).toLocaleString(); }
function animalTotal(a) { return a.sessions.morning + a.sessions.afternoon + a.sessions.evening; }

function qrPattern(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells = [];
  for (let i = 0; i < 64; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >> 16) % 5 === 0 ? 0 : (h >> 3) % 2);
  }
  return cells;
}

/* ---------------------------------------------------------------------- */
/*  SMALL UI PRIMITIVES                                                    */
/* ---------------------------------------------------------------------- */
function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
      padding: "3px 10px", borderRadius: 999, color, background: bg, letterSpacing: 0.2,
    }}>{children}</span>
  );
}

function StatusDot({ status }) {
  return (
    <span style={{
      width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status],
      display: "inline-block", boxShadow: status === "critical" ? `0 0 0 4px ${T.redSoft}` : "none",
      animation: status === "critical" ? "pulseDot 1.6s ease-in-out infinite" : "none",
    }} />
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.green500, fontWeight: 700, marginBottom: 4 }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: T.green900, margin: 0, fontWeight: 600 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Card({ children, style, className }) {
  return (
    <div className={className} style={{
      background: T.paper, borderRadius: 16, border: `1px solid ${T.creamDark}`,
      boxShadow: "0 1px 2px rgba(35,56,33,0.04), 0 8px 24px -12px rgba(35,56,33,0.08)",
      ...style,
    }}>{children}</div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, accent, decimals }) {
  const n = useCountUp(value);
  return (
    <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, transition: "transform .25s ease, box-shadow .25s ease" }}
      className="hoverlift">
      <div style={{
        width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center",
        background: accent + "22", color: accent, flexShrink: 0,
      }}><Icon size={22} /></div>
      <div>
        <div style={{ fontSize: 12, color: T.green600, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: T.green900 }}>
          {decimals ? fmt1(n) : fmt0(n)}{suffix}
        </div>
      </div>
    </Card>
  );
}

function AnimalAvatar({ status, size = 34, wiggle }) {
  return (
    <div className={wiggle ? "wiggle" : ""} style={{
      width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center",
      background: STATUS_COLOR[status] + "26", border: `2px solid ${STATUS_COLOR[status]}`,
      fontSize: size * 0.5, cursor: "pointer", transition: "transform .18s ease",
    }}>🐄</div>
  );
}

/* ---------------------------------------------------------------------- */
/*  APP                                                                    */
/* ---------------------------------------------------------------------- */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "animals", label: "Animals", icon: Users },
  { key: "doctor", label: "Doctor Portal", icon: Stethoscope },
  { key: "milk", label: "Milk Production", icon: Milk },
  { key: "feed", label: "Feed", icon: Leaf },
  { key: "vaccination", label: "Vaccination", icon: Syringe },
  { key: "repro", label: "Reproductive", icon: Baby },
  { key: "map", label: "Farm Map", icon: MapIcon },
  { key: "finance", label: "Finance", icon: Wallet },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "alerts", label: "Alerts", icon: Bell },
];

export default function App() {
  const [view, setView] = useState("dashboard");
  const [animals, setAnimals] = useState(initialAnimals);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [feed, setFeed] = useState(initialFeed);
  const [vaccinations, setVaccinations] = useState(initialVaccinations);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [removingAlerts, setRemovingAlerts] = useState({});

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) || null;

  const todayTotal = useMemo(() => animals.reduce((s, a) => s + animalTotal(a), 0), [animals]);
  const yesterdayTotal = todayTotal / 1.084;
  const pctChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;

  const sickCount = animals.filter((a) => a.status !== "healthy").length;
  const pregnantCount = animals.filter((a) => ["Confirmed Pregnant", "Expected Calving"].includes(a.reproStage)).length;
  const treatmentsToday = appointments.length;
  const vetVisitsToday = appointments.length;

  function recordMilking(animalId, session, liters) {
    setAnimals((prev) => prev.map((a) => a.id === animalId
      ? { ...a, sessions: { ...a.sessions, [session]: +(a.sessions[session] + liters).toFixed(1) } }
      : a));
  }

  function dismissAlert(id) {
    setRemovingAlerts((r) => ({ ...r, [id]: true }));
    setTimeout(() => setAlerts((a) => a.filter((x) => x.id !== id)), 260);
  }

  function toggleAppointment(id) {
    setAppointments((prev) => prev.map((p) => p.id === id ? { ...p, done: !p.done } : p));
  }

  function addAppointment(entry) { setAppointments((prev) => [...prev, entry]); }

  function updateFeedQty(id, qty) { setFeed((prev) => prev.map((f) => f.id === id ? { ...f, qty } : f)); }

  function toggleVaccination(id) { setVaccinations((prev) => prev.map((v) => v.id === id ? { ...v, done: !v.done } : v)); }

  function addVaccination(entry) { setVaccinations((prev) => [...prev, entry]); }

  function updateExpense(key, val) { setExpenses((prev) => ({ ...prev, [key]: val })); }

  const weeklyFarmData = DAYS.map((d, i) => ({
    day: d,
    liters: +animals.reduce((s, a) => s + a.weeklyMilk[i], 0).toFixed(0),
  }));

  return (
    <div style={{
      fontFamily: "'Work Sans', sans-serif", background: T.cream, color: T.ink,
      minHeight: "100%", width: "100%", display: "flex",
    }}>
      <GlobalStyle />
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar
          animals={animals} setSelectedAnimalId={setSelectedAnimalId} view={view}
        />
        <div key={view} className="viewfade" style={{ padding: "22px 28px 40px", overflowY: "auto" }}>
          {view === "dashboard" && (
            <Dashboard
              animals={animals} alerts={alerts} appointments={appointments}
              todayTotal={todayTotal} pctChange={pctChange} sickCount={sickCount}
              pregnantCount={pregnantCount} treatmentsToday={treatmentsToday}
              vetVisitsToday={vetVisitsToday} weeklyFarmData={weeklyFarmData}
              setView={setView} setSelectedAnimalId={setSelectedAnimalId}
              dismissAlert={dismissAlert} removingAlerts={removingAlerts}
            />
          )}
          {view === "animals" && (
            <AnimalsView animals={animals} setSelectedAnimalId={setSelectedAnimalId} />
          )}
          {view === "doctor" && (
            <DoctorPortal
              appointments={appointments} animals={animals}
              toggleAppointment={toggleAppointment} addAppointment={addAppointment}
              setSelectedAnimalId={setSelectedAnimalId}
            />
          )}
          {view === "milk" && (
            <MilkView animals={animals} todayTotal={todayTotal} pctChange={pctChange}
              weeklyFarmData={weeklyFarmData} recordMilking={recordMilking}
              setSelectedAnimalId={setSelectedAnimalId} />
          )}
          {view === "feed" && <FeedView feed={feed} updateFeedQty={updateFeedQty} />}
          {view === "vaccination" && (
            <VaccinationView vaccinations={vaccinations} animals={animals}
              toggleVaccination={toggleVaccination} addVaccination={addVaccination} />
          )}
          {view === "repro" && (
            <ReproView animals={animals} setSelectedAnimalId={setSelectedAnimalId} />
          )}
          {view === "map" && (
            <FarmMapView animals={animals} setSelectedAnimalId={setSelectedAnimalId} />
          )}
          {view === "finance" && (
            <FinanceView expenses={expenses} updateExpense={updateExpense} todayTotal={todayTotal} />
          )}
          {view === "analytics" && <AnalyticsView animals={animals} />}
          {view === "alerts" && (
            <AlertsView alerts={alerts} dismissAlert={dismissAlert} removingAlerts={removingAlerts} setSelectedAnimalId={setSelectedAnimalId} />
          )}
        </div>
      </div>
      {selectedAnimal && (
        <AnimalModal animal={selectedAnimal} onClose={() => setSelectedAnimalId(null)} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GLOBAL STYLE                                                           */
/* ---------------------------------------------------------------------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      ::selection { background: ${T.green300}; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: ${T.green300}; border-radius: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      input, select { font-family: inherit; }
      button { font-family: inherit; cursor: pointer; }
      .hoverlift:hover { transform: translateY(-3px); box-shadow: 0 4px 8px rgba(35,56,33,.06), 0 16px 28px -14px rgba(35,56,33,.18) !important; }
      .navitem:hover { background: rgba(255,255,255,.08); }
      .wiggle:hover { animation: wiggle .5s ease; }
      @keyframes wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg) scale(1.08)} 75%{transform:rotate(8deg) scale(1.08)} }
      @keyframes pulseDot { 0%,100%{box-shadow:0 0 0 4px ${T.redSoft}} 50%{box-shadow:0 0 0 8px ${T.redSoft}} }
      @keyframes floatBob { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-4px);} }
      .bob { animation: floatBob 3.2s ease-in-out infinite; }
      @keyframes fadeSlideUp { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:translateY(0);} }
      .viewfade { animation: fadeSlideUp .35s ease; }
      @keyframes modalIn { from { opacity:0; transform: translateY(16px) scale(.98);} to {opacity:1; transform:translateY(0) scale(1);} }
      @keyframes overlayIn { from {opacity:0;} to {opacity:1;} }
      @keyframes rowOut { from { opacity:1; max-height:200px;} to {opacity:0; max-height:0; margin:0; padding:0;} }
      .alert-out { animation: rowOut .26s ease forwards; overflow:hidden; }
      @keyframes popCheck { 0%{transform:scale(.6);} 60%{transform:scale(1.15);} 100%{transform:scale(1);} }
      .pop { animation: popCheck .28s ease; }
      input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      .progress-bar-fill { transition: width .6s cubic-bezier(.22,.9,.35,1); }
    `}</style>
  );
}

/* ---------------------------------------------------------------------- */
/*  SIDEBAR                                                                */
/* ---------------------------------------------------------------------- */
function Sidebar({ view, setView }) {
  return (
    <div style={{
      width: 226, flexShrink: 0, background: `linear-gradient(185deg, ${T.green900}, ${T.green800})`,
      color: T.cream, display: "flex", flexDirection: "column", padding: "22px 14px",
      position: "sticky", top: 0, height: "100vh",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px" }}>
        <div style={{ fontSize: 26 }} className="bob">🐄</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>DairyVerse</div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.green300, textTransform: "uppercase" }}>Digital Farm</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
        {NAV.map((n) => {
          const active = view === n.key;
          return (
            <button key={n.key} onClick={() => setView(n.key)} className="navitem" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10,
              border: "none", background: active ? T.green500 : "transparent",
              color: active ? T.green900 : T.cream, fontWeight: active ? 700 : 500, fontSize: 13.5,
              textAlign: "left", transition: "background .18s ease, color .18s ease",
            }}>
              <n.icon size={16} strokeWidth={2.2} />
              {n.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: T.green400, padding: "10px 8px 0", borderTop: `1px solid ${T.green700}` }}>
        🌿 Punjab Dairy Collective
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TOP BAR                                                                */
/* ---------------------------------------------------------------------- */
function TopBar({ animals, setSelectedAnimalId, view }) {
  const [q, setQ] = useState("");
  const results = q.length > 0 ? animals.filter((a) =>
    a.id.toLowerCase().includes(q.toLowerCase()) || a.breed.toLowerCase().includes(q.toLowerCase())) : [];
  const active = NAV.find((n) => n.key === view);
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      padding: "16px 28px", borderBottom: `1px solid ${T.creamDark}`, background: T.cream,
      position: "sticky", top: 0, zIndex: 5,
    }}>
      <div>
        <div style={{ fontSize: 11, color: T.green500, fontWeight: 700, letterSpacing: 1 }}>{new Date("2026-08-19").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: T.green900 }}>{active?.label}</div>
      </div>
      <div style={{ position: "relative", width: 300 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: T.green500 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search animal tag or breed…"
          style={{
            width: "100%", padding: "9px 12px 9px 34px", borderRadius: 999, border: `1px solid ${T.creamDark}`,
            background: T.paper, fontSize: 13, outline: "none", color: T.ink,
          }} />
        {results.length > 0 && (
          <div style={{
            position: "absolute", top: 42, left: 0, right: 0, background: T.paper, borderRadius: 12,
            border: `1px solid ${T.creamDark}`, boxShadow: "0 12px 24px -8px rgba(35,56,33,.25)", zIndex: 20,
            maxHeight: 260, overflowY: "auto",
          }}>
            {results.map((a) => (
              <div key={a.id} onClick={() => { setSelectedAnimalId(a.id); setQ(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.creamDark}` }}>
                <AnimalAvatar status={a.status} size={26} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.id}</div>
                  <div style={{ fontSize: 11, color: T.green600 }}>{a.breed} · Shed {a.shed}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", background: T.green600, color: T.cream,
        display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
      }}>FO</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DASHBOARD                                                              */
/* ---------------------------------------------------------------------- */
function Dashboard({ animals, alerts, appointments, todayTotal, pctChange, sickCount, pregnantCount,
  treatmentsToday, vetVisitsToday, weeklyFarmData, setView, setSelectedAnimalId, dismissAlert, removingAlerts }) {
  return (
    <div>
      <Hero animals={animals} todayTotal={todayTotal} pctChange={pctChange} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 14, margin: "22px 0" }}>
        <StatCard icon={Users} label="Total Animals" value={animals.length} suffix="" accent={T.green600} />
        <StatCard icon={Milk} label="Milk Today (L)" value={todayTotal} suffix="" accent={T.blue} decimals />
        <StatCard icon={HeartPulse} label="Under Watch" value={sickCount} suffix="" accent={T.amber} />
        <StatCard icon={Baby} label="Pregnant" value={pregnantCount} suffix="" accent={T.gold} />
        <StatCard icon={Syringe} label="Treatments Today" value={treatmentsToday} suffix="" accent={T.red} />
        <StatCard icon={Stethoscope} label="Vet Visits Today" value={vetVisitsToday} suffix="" accent={T.green500} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle eyebrow="This Week" title="Farm-wide Milk Production" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weeklyFarmData}>
              <CartesianGrid strokeDasharray="3 5" stroke={T.creamDark} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.green700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.green600 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.creamDark}`, fontSize: 12 }} />
              <Bar dataKey="liters" radius={[6, 6, 0, 0]} fill={T.green500} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle eyebrow="Live" title="Farm Health Map" action={
            <button onClick={() => setView("map")} style={{
              display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
              color: T.green600, fontSize: 12, fontWeight: 700,
            }}>Open map <ChevronRight size={13} /></button>
          } />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, justifyItems: "center" }}>
            {animals.map((a) => (
              <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} title={a.id}>
                <AnimalAvatar status={a.status} wiggle />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.green700 }}>
                <StatusDot status={k} /> {v}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle eyebrow="Priority" title="Alert Center" action={
            <button onClick={() => setView("alerts")} style={{ background: "none", border: "none", color: T.green600, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              View all <ChevronRight size={13} />
            </button>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.slice(0, 3).map((a) => (
              <AlertRow key={a.id} alert={a} onDismiss={() => dismissAlert(a.id)} removing={removingAlerts[a.id]} compact />
            ))}
            {alerts.length === 0 && <EmptyNote text="No active alerts. The herd is calm." />}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle eyebrow="Schedule" title="Doctor's Visits Today" action={
            <button onClick={() => setView("doctor")} style={{ background: "none", border: "none", color: T.green600, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              Open portal <ChevronRight size={13} />
            </button>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {appointments.slice(0, 4).map((p) => (
              <div key={p.id} onClick={() => setSelectedAnimalId(p.animalId)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
                background: T.cream, cursor: "pointer", transition: "background .18s ease",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.green700, width: 46 }}>{p.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.animalId}</div>
                  <div style={{ fontSize: 11.5, color: T.green600 }}>{p.reason}</div>
                </div>
                {p.done ? <Pill color={T.green700} bg={T.green200}>Done</Pill> : <Pill color={T.amber} bg={T.amberSoft}>Pending</Pill>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Hero({ animals, todayTotal, pctChange }) {
  return (
    <div style={{
      position: "relative", borderRadius: 22, overflow: "hidden", padding: "34px 32px",
      background: `linear-gradient(120deg, ${T.green800} 0%, ${T.green600} 55%, ${T.green500} 100%)`,
      color: T.cream, marginBottom: 6,
    }}>
      <svg style={{ position: "absolute", inset: 0, opacity: 0.5 }} viewBox="0 0 800 220" preserveAspectRatio="none">
        <path d="M0,180 C150,120 300,220 480,150 C620,100 720,170 800,120 L800,220 L0,220 Z" fill={T.green700} opacity="0.55" />
        <path d="M0,200 C180,160 340,230 520,180 C660,145 740,200 800,170 L800,220 L0,220 Z" fill={T.green900} opacity="0.5" />
        <circle cx="700" cy="45" r="34" fill={T.goldSoft} opacity="0.7" />
      </svg>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: T.green200, fontWeight: 700, marginBottom: 10 }}>
            <Sparkles size={14} /> Digital Dairy Intelligence
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 600, lineHeight: 1.05, maxWidth: 480 }}>
            Good morning. The herd is mostly thriving today.
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: T.green200 }}>
            {animals.length} animals across 3 sheds · {animals.filter(a => a.status === "healthy").length} in good health
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,.1)", borderRadius: 16, padding: "18px 24px", backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,.18)", minWidth: 180,
        }}>
          <div style={{ fontSize: 11, color: T.green200, textTransform: "uppercase", letterSpacing: 1 }}>Today's Production</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700 }}>{fmt1(todayTotal)} L</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: pctChange >= 0 ? T.goldSoft : T.redSoft, fontWeight: 700 }}>
            {pctChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {fmt1(Math.abs(pctChange))}% vs yesterday
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: 13, color: T.green500, padding: "14px 4px", fontStyle: "italic" }}>{text}</div>;
}

/* ---------------------------------------------------------------------- */
/*  ALERTS                                                                 */
/* ---------------------------------------------------------------------- */
const ALERT_STYLE = {
  urgent: { color: T.red, bg: T.redSoft, icon: "🔴", label: "Urgent" },
  important: { color: T.amber, bg: T.amberSoft, icon: "🟠", label: "Important" },
  reminder: { color: "#8A7A2E", bg: "#F0E7B8", icon: "🟡", label: "Reminder" },
  info: { color: T.blue, bg: "#D6E6EE", icon: "🔵", label: "Info" },
};

function AlertRow({ alert, onDismiss, removing, compact, onClickAnimal }) {
  const s = ALERT_STYLE[alert.level];
  return (
    <div className={removing ? "alert-out" : ""} style={{
      display: "flex", gap: 10, alignItems: "flex-start", background: s.bg + "55",
      border: `1px solid ${s.bg}`, borderRadius: 12, padding: compact ? "9px 12px" : "12px 14px",
    }}>
      <div style={{ fontSize: 16, lineHeight: 1 }}>{s.icon}</div>
      <div style={{ flex: 1, cursor: alert.animalId ? "pointer" : "default" }} onClick={() => alert.animalId && onClickAnimal && onClickAnimal(alert.animalId)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.green900 }}>{alert.title}</div>
        <div style={{ fontSize: 12, color: T.green700, marginTop: 1 }}>{alert.message}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: T.green600, padding: 2 }}>
        <X size={14} />
      </button>
    </div>
  );
}

function AlertsView({ alerts, dismissAlert, removingAlerts, setSelectedAnimalId }) {
  const groups = ["urgent", "important", "reminder", "info"];
  return (
    <div>
      <SectionTitle eyebrow="Smart Alert Center" title="All Alerts" />
      {alerts.length === 0 && <EmptyNote text="Nothing needs your attention right now." />}
      {groups.map((g) => {
        const items = alerts.filter((a) => a.level === g);
        if (items.length === 0) return null;
        return (
          <div key={g} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ALERT_STYLE[g].color, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              {ALERT_STYLE[g].label} ({items.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((a) => (
                <AlertRow key={a.id} alert={a} onDismiss={() => dismissAlert(a.id)} removing={removingAlerts[a.id]} onClickAnimal={setSelectedAnimalId} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ANIMALS VIEW                                                           */
/* ---------------------------------------------------------------------- */
function AnimalsView({ animals, setSelectedAnimalId }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [shed, setShed] = useState("all");

  const filtered = animals.filter((a) =>
    (a.id.toLowerCase().includes(q.toLowerCase()) || a.breed.toLowerCase().includes(q.toLowerCase())) &&
    (status === "all" || a.status === status) &&
    (shed === "all" || a.shed === shed));

  return (
    <div>
      <SectionTitle eyebrow={`${filtered.length} of ${animals.length}`} title="Animal Registry" />
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: 10, color: T.green500 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tag or breed…" style={inputStyle(true)} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle()}>
          <option value="all">All statuses</option>
          <option value="healthy">Healthy</option>
          <option value="monitoring">Monitoring</option>
          <option value="critical">Needs Attention</option>
        </select>
        <select value={shed} onChange={(e) => setShed(e.target.value)} style={inputStyle()}>
          <option value="all">All sheds</option>
          <option value="A">Shed A</option>
          <option value="B">Shed B</option>
          <option value="C">Shed C</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))", gap: 14 }}>
        {filtered.map((a) => (
          <Card key={a.id} className="hoverlift" style={{ padding: 16, cursor: "pointer", transition: "transform .2s ease" }}>
            <div onClick={() => setSelectedAnimalId(a.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <AnimalAvatar status={a.status} size={40} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.id}</div>
                    <div style={{ fontSize: 12, color: T.green600 }}>{a.breed}</div>
                  </div>
                </div>
                <Pill color={STATUS_COLOR[a.status]} bg={STATUS_COLOR[a.status] + "22"}>{STATUS_LABEL[a.status]}</Pill>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12, color: T.green700 }}>
                <span>Shed {a.shed}</span><span>{a.age} yrs</span><span>{a.weight} kg</span>
              </div>
              <div style={{ marginTop: 10, borderTop: `1px dashed ${T.creamDark}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: T.green500 }}>Today</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: T.green900 }}>{fmt1(animalTotal(a))} L</div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <EmptyNote text="No animals match those filters." />}
      </div>
    </div>
  );
}

function inputStyle(withIcon) {
  return {
    padding: withIcon ? "9px 12px 9px 32px" : "9px 12px", borderRadius: 10, border: `1px solid ${T.creamDark}`,
    background: T.paper, fontSize: 13, outline: "none", color: T.ink, width: withIcon ? "100%" : "auto",
  };
}

/* ---------------------------------------------------------------------- */
/*  ANIMAL MODAL                                                           */
/* ---------------------------------------------------------------------- */
function AnimalModal({ animal, onClose }) {
  const qr = qrPattern(animal.id);
  const sessionData = [
    { name: "Morning", liters: animal.sessions.morning },
    { name: "Afternoon", liters: animal.sessions.afternoon },
    { name: "Evening", liters: animal.sessions.evening },
  ];
  const weekData = DAYS.map((d, i) => ({ day: d, liters: animal.weeklyMilk[i] }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(29,47,30,.45)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      animation: "overlayIn .2s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.paper, borderRadius: 20, width: "min(760px, 100%)", maxHeight: "88vh", overflowY: "auto",
        animation: "modalIn .28s cubic-bezier(.2,.8,.3,1)", border: `1px solid ${T.creamDark}`,
      }}>
        <div style={{
          padding: "22px 26px", background: `linear-gradient(120deg, ${T.green800}, ${T.green600})`,
          color: T.cream, borderRadius: "20px 20px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ fontSize: 40 }}>🐄</div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700 }}>{animal.id}</div>
              <div style={{ fontSize: 13, color: T.green200 }}>{animal.breed} · Shed {animal.shed} · {animal.age} yrs · {animal.weight} kg</div>
              <div style={{ marginTop: 6 }}><Pill color={T.green900} bg={T.cream}>{STATUS_LABEL[animal.status]}</Pill></div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: T.cream, padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Medical Timeline</div>
            <div style={{ borderLeft: `2px solid ${T.green300}`, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {animal.timeline.map((t, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -21, top: 3, width: 9, height: 9, borderRadius: "50%", background: T.green500, border: `2px solid ${T.paper}` }} />
                  <div style={{ fontSize: 11, color: T.green500, fontWeight: 700 }}>{t.date}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.green900 }}>{t.type}</div>
                  <div style={{ fontSize: 12.5, color: T.green700 }}>{t.note}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.green500, textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px" }}>Weekly Production (L)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={weekData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.green600 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="liters" stroke={T.green600} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Today's Sessions</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={sessionData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: T.green700 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="liters" radius={[0, 6, 6, 0]} fill={T.blue} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "right", fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: T.green900 }}>
              {fmt1(animalTotal(animal))} L total
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.green500, textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 10px" }}>Reproductive Stage</div>
            <Pill color={T.gold} bg={T.goldSoft}><Baby size={12} /> {animal.reproStage}</Pill>
            {animal.dueInDays && <div style={{ fontSize: 12, color: T.green700, marginTop: 6 }}>Expected calving in {animal.dueInDays} days</div>}

            <div style={{ fontSize: 12, fontWeight: 700, color: T.green500, textTransform: "uppercase", letterSpacing: 1, margin: "18px 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
              <QrCode size={13} /> Digital ID
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 5px)", gridTemplateRows: "repeat(8, 5px)", gap: 1, background: T.green900, padding: 6, borderRadius: 6 }}>
                {qr.map((c, i) => <div key={i} style={{ width: 5, height: 5, background: c ? T.cream : T.green900 }} />)}
              </div>
              <div style={{ fontSize: 11.5, color: T.green600, lineHeight: 1.4 }}>Scan on-farm to open<br />this profile instantly.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DOCTOR PORTAL                                                          */
/* ---------------------------------------------------------------------- */
function DoctorPortal({ appointments, animals, toggleAppointment, addAppointment, setSelectedAnimalId }) {
  const [form, setForm] = useState({ time: "", animalId: animals[0].id, reason: "" });
  return (
    <div>
      <SectionTitle eyebrow="DVM" title="Today's Schedule" />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {appointments.map((p) => {
            const a = animals.find((x) => x.id === p.animalId);
            return (
              <Card key={p.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "center", width: 56 }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 15, color: T.green900 }}>{p.time}</div>
                </div>
                <div style={{ width: 1, alignSelf: "stretch", background: T.creamDark }} />
                <div onClick={() => setSelectedAnimalId(p.animalId)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AnimalAvatar status={a?.status || "healthy"} size={26} />
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{p.animalId}</span>
                    {a && <Pill color={STATUS_COLOR[a.status]} bg={STATUS_COLOR[a.status] + "22"}>{STATUS_LABEL[a.status]}</Pill>}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.green700, marginTop: 3 }}>{p.reason}</div>
                </div>
                <button onClick={() => toggleAppointment(p.id)} className={p.done ? "pop" : ""} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "none",
                  background: p.done ? T.green200 : T.green600, color: p.done ? T.green800 : T.cream, fontWeight: 700, fontSize: 12,
                }}>
                  <Check size={13} /> {p.done ? "Done" : "Mark done"}
                </button>
              </Card>
            );
          })}
        </div>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.green900, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Add Appointment
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>Time
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={inputStyle(false)} />
            </label>
            <label style={labelStyle}>Animal
              <select value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })} style={{ ...inputStyle(false), width: "100%" }}>
                {animals.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.breed}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Reason
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Routine examination" style={{ ...inputStyle(false), width: "100%" }} />
            </label>
            <button onClick={() => {
              if (!form.time || !form.reason) return;
              addAppointment({ id: "p" + Date.now(), time: form.time, animalId: form.animalId, reason: form.reason, done: false });
              setForm({ time: "", animalId: animals[0].id, reason: "" });
            }} style={primaryBtn}>Schedule visit</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600, color: T.green700 };
const primaryBtn = {
  marginTop: 4, padding: "10px 14px", borderRadius: 10, border: "none", background: T.green600, color: T.cream,
  fontWeight: 700, fontSize: 13, transition: "background .18s ease",
};

/* ---------------------------------------------------------------------- */
/*  MILK VIEW                                                              */
/* ---------------------------------------------------------------------- */
function MilkView({ animals, todayTotal, pctChange, weeklyFarmData, recordMilking, setSelectedAnimalId }) {
  const [entry, setEntry] = useState({ animalId: animals[0].id, session: "morning", liters: "" });
  return (
    <div>
      <SectionTitle eyebrow="Command Center" title="Milk Production" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18 }}>
        <StatCard icon={Milk} label="Today's Production" value={todayTotal} suffix=" L" accent={T.blue} decimals />
        <StatCard icon={pctChange >= 0 ? TrendingUp : TrendingDown} label="vs Yesterday" value={Math.abs(pctChange)} suffix="%" accent={pctChange >= 0 ? T.green600 : T.red} decimals />
        <StatCard icon={Droplets} label="Avg per Animal" value={todayTotal / animals.length} suffix=" L" accent={T.gold} decimals />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, color: T.green900, marginBottom: 10, fontFamily: "'Fraunces', serif", fontSize: 16 }}>Weekly Production</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyFarmData}>
              <CartesianGrid strokeDasharray="3 5" stroke={T.creamDark} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.green700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.green600 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="liters" radius={[6, 6, 0, 0]} fill={T.green500} />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 16, fontWeight: 700, color: T.green900, marginBottom: 8, fontFamily: "'Fraunces', serif", fontSize: 16 }}>By Animal</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
            {animals.map((a) => {
              const total = animalTotal(a);
              const pct = Math.min((total / 15) * 100, 100);
              return (
                <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{a.id} <span style={{ color: T.green500, fontWeight: 400 }}>· {a.breed}</span></span>
                    <span style={{ fontWeight: 700, color: T.green800 }}>{fmt1(total)} L</span>
                  </div>
                  <div style={{ height: 6, background: T.creamDark, borderRadius: 4 }}>
                    <div className="progress-bar-fill" style={{ height: "100%", width: pct + "%", background: STATUS_COLOR[a.status], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.green900, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Record Milking
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>Animal
              <select value={entry.animalId} onChange={(e) => setEntry({ ...entry, animalId: e.target.value })} style={{ ...inputStyle(false), width: "100%" }}>
                {animals.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Session
              <select value={entry.session} onChange={(e) => setEntry({ ...entry, session: e.target.value })} style={{ ...inputStyle(false), width: "100%" }}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </label>
            <label style={labelStyle}>Liters
              <input type="number" min="0" step="0.1" value={entry.liters} onChange={(e) => setEntry({ ...entry, liters: e.target.value })} placeholder="e.g. 2.5" style={{ ...inputStyle(false), width: "100%" }} />
            </label>
            <button onClick={() => {
              const l = parseFloat(entry.liters);
              if (!l || l <= 0) return;
              recordMilking(entry.animalId, entry.session, l);
              setEntry({ ...entry, liters: "" });
            }} style={primaryBtn}>Add to record</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FEED VIEW                                                              */
/* ---------------------------------------------------------------------- */
function FeedView({ feed, updateFeedQty }) {
  const total = feed.reduce((s, f) => s + Number(f.qty), 0);
  return (
    <div>
      <SectionTitle eyebrow="Nutrition" title="Feed Center" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        {feed.map((f) => (
          <Card key={f.id} style={{ padding: 18 }}>
            <div style={{ fontSize: 30, marginBottom: 6 }} className="bob">{f.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.green900 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: T.green600, marginBottom: 10 }}>kg allocated today</div>
            <input type="range" min="0" max="600" value={f.qty} onChange={(e) => updateFeedQty(f.id, Number(e.target.value))}
              style={{ width: "100%", accentColor: T.green600 }} />
            <div style={{ textAlign: "right", fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: T.green900 }}>{f.qty} kg</div>
          </Card>
        ))}
      </div>
      <Card style={{ padding: 18, marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, color: T.green900 }}>Total feed allocated today</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: T.green700 }}>{total} kg</div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  VACCINATION VIEW                                                       */
/* ---------------------------------------------------------------------- */
function VaccinationView({ vaccinations, animals, toggleVaccination, addVaccination }) {
  const [form, setForm] = useState({ animalId: animals[0].id, vaccine: "", due: "" });
  return (
    <div>
      <SectionTitle eyebrow="Prevention" title="Vaccination Center" />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vaccinations.map((v) => {
            const a = animals.find((x) => x.id === v.animalId);
            return (
              <Card key={v.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 14, opacity: v.done ? 0.55 : 1, transition: "opacity .2s ease" }}>
                <AnimalAvatar status={a?.status || "healthy"} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, textDecoration: v.done ? "line-through" : "none" }}>{v.animalId} — {v.vaccine}</div>
                  <div style={{ fontSize: 12, color: T.green600, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> Due {v.due}</div>
                </div>
                <button onClick={() => toggleVaccination(v.id)} className={v.done ? "pop" : ""} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "none",
                  background: v.done ? T.green200 : T.gold, color: v.done ? T.green800 : T.green900, fontWeight: 700, fontSize: 12,
                }}>
                  <Syringe size={13} /> {v.done ? "Administered" : "Mark done"}
                </button>
              </Card>
            );
          })}
        </div>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.green900, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> Schedule Vaccination
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={labelStyle}>Animal
              <select value={form.animalId} onChange={(e) => setForm({ ...form, animalId: e.target.value })} style={{ ...inputStyle(false), width: "100%" }}>
                {animals.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Vaccine
              <input value={form.vaccine} onChange={(e) => setForm({ ...form, vaccine: e.target.value })} placeholder="e.g. FMD" style={{ ...inputStyle(false), width: "100%" }} />
            </label>
            <label style={labelStyle}>Due date
              <input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} placeholder="e.g. Sep 02" style={{ ...inputStyle(false), width: "100%" }} />
            </label>
            <button onClick={() => {
              if (!form.vaccine || !form.due) return;
              addVaccination({ id: "v" + Date.now(), animalId: form.animalId, vaccine: form.vaccine, due: form.due, done: false });
              setForm({ animalId: animals[0].id, vaccine: "", due: "" });
            }} style={primaryBtn}>Add to calendar</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  REPRODUCTIVE VIEW                                                      */
/* ---------------------------------------------------------------------- */
function ReproView({ animals, setSelectedAnimalId }) {
  return (
    <div>
      <SectionTitle eyebrow="Lifecycle" title="Reproductive Management" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {animals.map((a) => {
          const idx = REPRO_STAGES.indexOf(a.reproStage);
          return (
            <Card key={a.id} style={{ padding: 16 }}>
              <div onClick={() => setSelectedAnimalId(a.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                <AnimalAvatar status={a.status} size={30} />
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.id}</div>
                <div style={{ fontSize: 12, color: T.green600 }}>{a.breed}</div>
                {a.dueInDays && <Pill color={T.gold} bg={T.goldSoft}>Calving in {a.dueInDays}d</Pill>}
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {REPRO_STAGES.map((s, i) => (
                  <React.Fragment key={s}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 78 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: i <= idx ? T.green600 : T.creamDark,
                        border: i === idx ? `3px solid ${T.gold}` : "none",
                        transition: "background .3s ease",
                      }} />
                      <div style={{ fontSize: 9.5, color: i <= idx ? T.green800 : T.green400, textAlign: "center", marginTop: 5, fontWeight: i === idx ? 700 : 500 }}>{s}</div>
                    </div>
                    {i < REPRO_STAGES.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < idx ? T.green600 : T.creamDark, transition: "background .3s ease" }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FARM MAP VIEW                                                          */
/* ---------------------------------------------------------------------- */
function FarmMapView({ animals, setSelectedAnimalId }) {
  const sheds = ["A", "B", "C"];
  return (
    <div>
      <SectionTitle eyebrow="Digital Twin" title="Interactive Farm Map" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {sheds.map((s) => {
          const list = animals.filter((a) => a.shed === s);
          return (
            <Card key={s} style={{
              padding: 18, backgroundImage: `radial-gradient(circle at top right, ${T.green200}55, transparent 60%)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: T.green900, marginBottom: 12, fontFamily: "'Fraunces', serif", fontSize: 16 }}>
                <MapPin size={15} /> Shed {s}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, justifyItems: "center" }}>
                {list.map((a) => (
                  <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} title={`${a.id} · ${STATUS_LABEL[a.status]}`}>
                    <AnimalAvatar status={a.status} wiggle />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div className="bob" style={{ fontSize: 34 }}>🌾</div>
          <div style={{ fontWeight: 700, color: T.green900, marginTop: 6 }}>Feed Area</div>
          <div style={{ fontSize: 12, color: T.green600 }}>Daily rations prepared for all sheds</div>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div className="bob" style={{ fontSize: 34 }}>🥛</div>
          <div style={{ fontWeight: 700, color: T.green900, marginTop: 6 }}>Milking Area</div>
          <div style={{ fontSize: 12, color: T.green600 }}>3 sessions daily · automated logging</div>
        </Card>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.green700 }}>
            <StatusDot status={k} /> {v}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  FINANCE VIEW                                                           */
/* ---------------------------------------------------------------------- */
function FinanceView({ expenses, updateExpense, todayTotal }) {
  const milkPrice = 185;
  const income = { milk: Math.round(todayTotal * 30 * milkPrice), animalSales: 65000, other: 8000 };
  const totalIncome = income.milk + income.animalSales + income.other;
  const totalExpense = Object.values(expenses).reduce((a, b) => a + Number(b), 0);
  const profit = totalIncome - totalExpense;
  const costPerLiter = totalExpense / (todayTotal * 30);

  const pieData = Object.entries(expenses).map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), value: Number(v) }));

  return (
    <div>
      <SectionTitle eyebrow="Estimated Monthly" title="Farm Finance" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 }}>
        <StatCard icon={Wallet} label="Total Income (Rs)" value={totalIncome} suffix="" accent={T.green600} />
        <StatCard icon={TrendingDown} label="Total Expense (Rs)" value={totalExpense} suffix="" accent={T.red} />
        <StatCard icon={profit >= 0 ? TrendingUp : TrendingDown} label="Net Profit (Rs)" value={Math.abs(profit)} suffix="" accent={profit >= 0 ? T.gold : T.red} />
        <StatCard icon={Droplets} label="Cost / Liter (Rs)" value={costPerLiter} suffix="" accent={T.blue} decimals />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: 16, color: T.green900, marginBottom: 12 }}>Expense Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: 16, color: T.green900, marginBottom: 12 }}>Edit Monthly Expenses</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(expenses).map(([k, v]) => (
              <label key={k} style={{ ...labelStyle, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ textTransform: "capitalize" }}>{k}</span>
                <input type="number" value={v} onChange={(e) => updateExpense(k, Number(e.target.value))} style={{ ...inputStyle(false), width: 120, textAlign: "right" }} />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ANALYTICS VIEW                                                         */
/* ---------------------------------------------------------------------- */
function AnalyticsView({ animals }) {
  const statusCounts = ["healthy", "monitoring", "critical"].map((s) => ({
    name: STATUS_LABEL[s], value: animals.filter((a) => a.status === s).length, key: s,
  }));
  const kpis = [
    { label: "Milk Production", value: "+12%", up: true },
    { label: "Animal Health", value: "+8%", up: true },
    { label: "Feed Cost", value: "-5%", up: false },
    { label: "Treatment Cost", value: "-11%", up: false },
    { label: "Mortality", value: "-4%", up: false },
    { label: "Pregnancy Rate", value: "+9%", up: true },
  ];
  return (
    <div>
      <SectionTitle eyebrow="Farm Intelligence" title="Analytics" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: T.green600, fontWeight: 600 }}>{k.label}</div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700,
              color: k.up ? T.green600 : T.red, display: "flex", alignItems: "center", gap: 4, marginTop: 4,
            }}>
              {k.up ? <TrendingUp size={17} /> : <TrendingDown size={17} />} {k.value}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: 16, color: T.green900, marginBottom: 12 }}>6-Month Production Trend</div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 5" stroke={T.creamDark} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.green700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.green600 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="milk" stroke={T.green600} strokeWidth={3} dot={{ r: 4, fill: T.gold }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontFamily: "'Fraunces', serif", fontSize: 16, color: T.green900, marginBottom: 12 }}>Herd Health Distribution</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={statusCounts} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: T.green700 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {statusCounts.map((s, i) => <Cell key={i} fill={STATUS_COLOR[s.key]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
