import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Recycle, PackagePlus, Factory, Boxes, Receipt, ChevronRight, ArrowRight } from "lucide-react";

const PLASTIC_TYPES = ["PET", "HDPE", "PP"];
const STAGES = ["Sorting", "Shredding", "Washing", "Pelletizing", "Completed"];

const initialRaw = [
  { id: "RM-101", date: "2026-09-02", supplier: "Sambalpur Scrap Co.", type: "PET", weight: 820, grade: "A" },
  { id: "RM-102", date: "2026-09-04", supplier: "Odisha Waste Traders", type: "HDPE", weight: 540, grade: "B" },
  { id: "RM-103", date: "2026-09-06", supplier: "Sambalpur Scrap Co.", type: "PP", weight: 310, grade: "A" },
  { id: "RM-104", date: "2026-09-08", supplier: "GreenLoop Collectors", type: "PET", weight: 460, grade: "B" },
];

const initialBatches = [
  { id: "B-01", date: "2026-09-03", type: "PET", weight: 300, stage: "Pelletizing" },
  { id: "B-02", date: "2026-09-05", type: "HDPE", weight: 200, stage: "Washing" },
  { id: "B-03", date: "2026-09-07", type: "PET", weight: 150, stage: "Completed" },
];

const initialSales = [
  { id: "S-01", date: "2026-09-08", customer: "Kalinga Polymers Pvt Ltd", type: "PET", weight: 100, rate: 48, total: 4800 },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nextId(prefix, list) {
  const n = list.length + 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

export default function PlasticsERP() {
  const [view, setView] = useState("dashboard");
  const [raw, setRaw] = useState(initialRaw);
  const [batches, setBatches] = useState(initialBatches);
  const [sales, setSales] = useState(initialSales);

  // ---- derived stock numbers ----
  const stock = useMemo(() => {
    const byType = {};
    PLASTIC_TYPES.forEach((t) => (byType[t] = { rawIn: 0, consumed: 0, finished: 0, sold: 0 }));
    raw.forEach((r) => (byType[r.type].rawIn += r.weight));
    batches.forEach((b) => {
      byType[b.type].consumed += b.weight;
      if (b.stage === "Completed") byType[b.type].finished += b.weight;
    });
    sales.forEach((s) => (byType[s.type].sold += s.weight));
    const rows = PLASTIC_TYPES.map((t) => {
      const rawStock = byType[t].rawIn - byType[t].consumed;
      const inProduction = batches
        .filter((b) => b.type === t && b.stage !== "Completed")
        .reduce((a, b) => a + b.weight, 0);
      const finishedStock = byType[t].finished - byType[t].sold;
      return { type: t, rawStock, inProduction, finishedStock };
    });
    return rows;
  }, [raw, batches, sales]);

  const totals = useMemo(() => {
    const rawTotal = stock.reduce((a, r) => a + r.rawStock, 0);
    const wipTotal = stock.reduce((a, r) => a + r.inProduction, 0);
    const finishedTotal = stock.reduce((a, r) => a + r.finishedStock, 0);
    const soldTotal = sales.reduce((a, s) => a + s.weight, 0);
    const revenue = sales.reduce((a, s) => a + s.total, 0);
    return { rawTotal, wipTotal, finishedTotal, soldTotal, revenue };
  }, [stock, sales]);

  // ---- actions ----
  function addRaw(entry) {
    setRaw((r) => [...r, { ...entry, id: nextId("RM-1", r) }]);
  }
  function addBatch(entry) {
    setBatches((b) => [...b, { ...entry, id: nextId("B", b), stage: "Sorting" }]);
  }
  function advanceStage(id) {
    setBatches((bs) =>
      bs.map((b) => {
        if (b.id !== id) return b;
        const idx = STAGES.indexOf(b.stage);
        const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
        return { ...b, stage: next };
      })
    );
  }
  function addSale(entry) {
    setSales((s) => [...s, { ...entry, id: nextId("S", s) }]);
  }

  return (
    <div className="erp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .erp-root {
          --bg: #F3F2ED;
          --panel: #FFFFFF;
          --ink: #22261F;
          --ink-soft: #5B5F54;
          --line: #DCD9CE;
          --nav-bg: #1B1F1A;
          --nav-ink: #E9E9E1;
          --nav-ink-dim: #9A9C8E;
          --accent: #4C6B47;
          --accent-soft: #DCE6D6;
          --warn: #B4552B;
          --warn-soft: #F3DFD2;
          --pet: #4C6B47;
          --hdpe: #2E6B7A;
          --pp: #B4552B;

          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 600px;
          display: flex;
          border: 1px solid var(--line);
        }
        .erp-root * { box-sizing: border-box; }
        .erp-head, .num, .stage-label, .kpi-num { font-family: 'Space Grotesk', sans-serif; }

        .nav {
          width: 220px;
          background: var(--nav-bg);
          color: var(--nav-ink);
          padding: 20px 14px;
          flex-shrink: 0;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 15px;
          padding: 0 8px 20px 8px;
          border-bottom: 1px solid #333730;
          margin-bottom: 16px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; margin-bottom: 2px;
          border-radius: 3px; cursor: pointer;
          font-size: 13.5px; color: var(--nav-ink-dim);
          border-left: 2px solid transparent;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .nav-item:hover { color: var(--nav-ink); }
        .nav-item.active {
          background: #262C22; color: #fff;
          border-left: 2px solid var(--accent);
        }
        .nav-foot {
          margin-top: 24px; padding: 10px 8px 0 8px;
          border-top: 1px solid #333730;
          font-size: 11px; color: var(--nav-ink-dim); line-height: 1.5;
        }

        .main { flex: 1; padding: 26px 30px; background: var(--panel); overflow-x: auto; }
        .page-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700; font-size: 20px; margin: 0 0 4px 0;
        }
        .page-sub { color: var(--ink-soft); font-size: 13px; margin: 0 0 22px 0; }

        .flow-row { display: flex; align-items: stretch; gap: 0; margin-bottom: 26px; }
        .flow-card {
          flex: 1; border: 1px solid var(--line); padding: 14px 16px;
          background: var(--bg);
        }
        .flow-arrow { display: flex; align-items: center; padding: 0 10px; color: var(--ink-soft); }
        .flow-k { font-size: 11.5px; color: var(--ink-soft); margin-bottom: 6px; }
        .flow-v { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 24px; }
        .flow-u { font-size: 11px; color: var(--ink-soft); margin-left: 4px; }

        .grid2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 22px; margin-bottom: 24px; }
        .panel { border: 1px solid var(--line); padding: 16px 18px; }
        .panel-title { font-size: 12.5px; font-weight: 600; color: var(--ink-soft); margin: 0 0 14px 0; text-transform: none; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; font-weight: 600; color: var(--ink-soft); font-size: 11.5px; padding: 7px 10px; border-bottom: 1px solid var(--line); }
        td { padding: 8px 10px; border-bottom: 1px solid #EEECE3; }
        tr:last-child td { border-bottom: none; }

        .pill { display: inline-block; padding: 2px 8px; font-size: 11px; border: 1px solid var(--line); }
        .pill-pet { border-color: var(--pet); color: var(--pet); }
        .pill-hdpe { border-color: var(--hdpe); color: var(--hdpe); }
        .pill-pp { border-color: var(--pp); color: var(--pp); }

        .stage-pill { font-size: 11px; padding: 3px 9px; background: var(--accent-soft); color: var(--accent); border: none; }
        .stage-pill.done { background: #E4E4DC; color: var(--ink-soft); }

        .btn {
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--accent); color: #fff; border: none;
          padding: 8px 14px; font-size: 13px; cursor: pointer;
        }
        .btn:hover { opacity: 0.9; }
        .btn-ghost {
          background: transparent; color: var(--accent); border: 1px solid var(--accent);
          padding: 5px 10px; font-size: 12px; cursor: pointer;
        }
        .btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
        label { display: block; font-size: 11.5px; color: var(--ink-soft); margin-bottom: 4px; }
        input, select {
          width: 100%; padding: 7px 9px; border: 1px solid var(--line);
          font-size: 13px; font-family: 'IBM Plex Sans', sans-serif; background: #fff; color: var(--ink);
        }
        input:focus, select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }

        .section-gap { margin-bottom: 26px; }
      `}</style>

      <nav className="nav">
        <div className="nav-brand">
          <Recycle size={18} />
          <span>ReclaimOS</span>
        </div>
        {[
          { key: "dashboard", label: "Dashboard", icon: Boxes },
          { key: "intake", label: "Raw Intake", icon: PackagePlus },
          { key: "production", label: "Production", icon: Factory },
          { key: "inventory", label: "Inventory", icon: Boxes },
          { key: "sales", label: "Sales", icon: Receipt },
        ].map((item) => (
          <div
            key={item.key}
            className={`nav-item ${view === item.key ? "active" : ""}`}
            onClick={() => setView(item.key)}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="nav-foot">
          Demo build for plastics recycling operations. Sample data shown — connect real intake, production and sales records to replace it.
        </div>
      </nav>

      <main className="main">
        {view === "dashboard" && (
          <Dashboard totals={totals} stock={stock} batches={batches} />
        )}
        {view === "intake" && <Intake raw={raw} onAdd={addRaw} />}
        {view === "production" && (
          <Production batches={batches} stock={stock} onAdd={addBatch} onAdvance={advanceStage} />
        )}
        {view === "inventory" && <Inventory stock={stock} />}
        {view === "sales" && <Sales sales={sales} stock={stock} onAdd={addSale} />}
      </main>
    </div>
  );
}

function typePill(type) {
  const cls = type === "PET" ? "pill-pet" : type === "HDPE" ? "pill-hdpe" : "pill-pp";
  return <span className={`pill ${cls}`}>{type}</span>;
}

function Dashboard({ totals, stock, batches }) {
  const chartData = stock.map((s) => ({ type: s.type, "Raw stock": s.rawStock, "Finished stock": s.finishedStock }));
  const recentBatches = [...batches].slice(-4).reverse();

  return (
    <div>
      <h1 className="page-title">Factory overview</h1>
      <p className="page-sub">Material flow from intake to sale, current as of today.</p>

      <div className="flow-row">
        <div className="flow-card">
          <div className="flow-k">Raw material in stock</div>
          <div className="flow-v">{totals.rawTotal.toLocaleString()}<span className="flow-u">kg</span></div>
        </div>
        <div className="flow-arrow"><ArrowRight size={16} /></div>
        <div className="flow-card">
          <div className="flow-k">In production</div>
          <div className="flow-v">{totals.wipTotal.toLocaleString()}<span className="flow-u">kg</span></div>
        </div>
        <div className="flow-arrow"><ArrowRight size={16} /></div>
        <div className="flow-card">
          <div className="flow-k">Finished stock</div>
          <div className="flow-v">{totals.finishedTotal.toLocaleString()}<span className="flow-u">kg</span></div>
        </div>
        <div className="flow-arrow"><ArrowRight size={16} /></div>
        <div className="flow-card">
          <div className="flow-k">Sold to date</div>
          <div className="flow-v">{totals.soldTotal.toLocaleString()}<span className="flow-u">kg</span></div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <p className="panel-title">Stock by material type (kg)</p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEECE3" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} axisLine={{ stroke: "#DCD9CE" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: "IBM Plex Sans" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
                <Bar dataKey="Raw stock" fill="#4C6B47" />
                <Bar dataKey="Finished stock" fill="#B4552B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <p className="panel-title">Revenue to date</p>
          <div className="kpi-num" style={{ fontSize: 30, fontWeight: 700 }}>₹{totals.revenue.toLocaleString()}</div>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>
            From {totals.soldTotal.toLocaleString()} kg of processed material sold.
          </p>
        </div>
      </div>

      <div className="panel">
        <p className="panel-title">Recent production activity</p>
        <table>
          <thead>
            <tr><th>Batch</th><th>Type</th><th>Weight</th><th>Stage</th></tr>
          </thead>
          <tbody>
            {recentBatches.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{typePill(b.type)}</td>
                <td>{b.weight} kg</td>
                <td><span className={`stage-pill ${b.stage === "Completed" ? "done" : ""}`}>{b.stage}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Intake({ raw, onAdd }) {
  const [form, setForm] = useState({ date: todayStr(), supplier: "", type: "PET", weight: "", grade: "A" });
  function submit(e) {
    e.preventDefault();
    if (!form.supplier || !form.weight) return;
    onAdd({ ...form, weight: Number(form.weight) });
    setForm({ date: todayStr(), supplier: "", type: "PET", weight: "", grade: "A" });
  }
  return (
    <div>
      <h1 className="page-title">Raw material intake</h1>
      <p className="page-sub">Log scrap plastic as it arrives from suppliers and collectors.</p>

      <div className="panel section-gap">
        <p className="panel-title">Log new intake</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>Supplier</label>
              <input placeholder="e.g. Sambalpur Scrap Co." value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div>
              <label>Plastic type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {PLASTIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Weight (kg)</label>
              <input type="number" min="0" placeholder="e.g. 500" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div>
              <label>Quality grade</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="A">A — clean, sorted</option>
                <option value="B">B — mixed, needs sorting</option>
                <option value="C">C — contaminated</option>
              </select>
            </div>
          </div>
          <button className="btn" type="submit">Log intake</button>
        </form>
      </div>

      <div className="panel">
        <p className="panel-title">Intake records ({raw.length})</p>
        <table>
          <thead>
            <tr><th>ID</th><th>Date</th><th>Supplier</th><th>Type</th><th>Weight</th><th>Grade</th></tr>
          </thead>
          <tbody>
            {[...raw].reverse().map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.date}</td>
                <td>{r.supplier}</td>
                <td>{typePill(r.type)}</td>
                <td>{r.weight} kg</td>
                <td>{r.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Production({ batches, stock, onAdd, onAdvance }) {
  const [form, setForm] = useState({ date: todayStr(), type: "PET", weight: "" });
  const available = stock.find((s) => s.type === form.type)?.rawStock ?? 0;

  function submit(e) {
    e.preventDefault();
    const w = Number(form.weight);
    if (!w || w <= 0 || w > available) return;
    onAdd({ date: form.date, type: form.type, weight: w });
    setForm({ date: todayStr(), type: form.type, weight: "" });
  }

  return (
    <div>
      <h1 className="page-title">Production tracking</h1>
      <p className="page-sub">Move batches through sorting, shredding, washing and pelletizing.</p>

      <div className="panel section-gap">
        <p className="panel-title">Start a new batch</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>Plastic type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, weight: "" })}>
                {PLASTIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Weight (kg) — {available} kg raw stock available</label>
              <input type="number" min="0" max={available} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit" disabled={available === 0}>Start batch</button>
        </form>
      </div>

      <div className="panel">
        <p className="panel-title">Active & completed batches</p>
        <table>
          <thead>
            <tr><th>Batch</th><th>Date</th><th>Type</th><th>Weight</th><th>Stage</th><th></th></tr>
          </thead>
          <tbody>
            {[...batches].reverse().map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.date}</td>
                <td>{typePill(b.type)}</td>
                <td>{b.weight} kg</td>
                <td><span className={`stage-pill ${b.stage === "Completed" ? "done" : ""}`}>{b.stage}</span></td>
                <td>
                  <button
                    className="btn-ghost"
                    disabled={b.stage === "Completed"}
                    onClick={() => onAdvance(b.id)}
                  >
                    Advance <ChevronRight size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Inventory({ stock }) {
  return (
    <div>
      <h1 className="page-title">Inventory</h1>
      <p className="page-sub">Current stock across raw material, work-in-progress and finished goods.</p>

      <div className="panel">
        <table>
          <thead>
            <tr><th>Type</th><th>Raw stock</th><th>In production</th><th>Finished stock</th></tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.type}>
                <td>{typePill(s.type)}</td>
                <td>{s.rawStock.toLocaleString()} kg</td>
                <td>{s.inProduction.toLocaleString()} kg</td>
                <td>{s.finishedStock.toLocaleString()} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sales({ sales, stock, onAdd }) {
  const [form, setForm] = useState({ date: todayStr(), customer: "", type: "PET", weight: "", rate: "" });
  const available = stock.find((s) => s.type === form.type)?.finishedStock ?? 0;
  const total = (Number(form.weight) || 0) * (Number(form.rate) || 0);

  function submit(e) {
    e.preventDefault();
    const w = Number(form.weight);
    const rate = Number(form.rate);
    if (!form.customer || !w || w <= 0 || w > available || !rate) return;
    onAdd({ date: form.date, customer: form.customer, type: form.type, weight: w, rate, total: w * rate });
    setForm({ date: todayStr(), customer: "", type: form.type, weight: "", rate: "" });
  }

  return (
    <div>
      <h1 className="page-title">Sales & billing</h1>
      <p className="page-sub">Sell finished pellets and flakes, and keep a running invoice log.</p>

      <div className="panel section-gap">
        <p className="panel-title">Record a sale</p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>Customer</label>
              <input placeholder="e.g. Kalinga Polymers Pvt Ltd" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
            </div>
            <div>
              <label>Material type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, weight: "" })}>
                {PLASTIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Weight (kg) — {available} kg finished stock available</label>
              <input type="number" min="0" max={available} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div>
              <label>Rate (₹ per kg)</label>
              <input type="number" min="0" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
            <div>
              <label>Total</label>
              <input value={`₹${total.toLocaleString()}`} readOnly />
            </div>
          </div>
          <button className="btn" type="submit" disabled={available === 0}>Record sale</button>
        </form>
      </div>

      <div className="panel">
        <p className="panel-title">Sales log</p>
        <table>
          <thead>
            <tr><th>ID</th><th>Date</th><th>Customer</th><th>Type</th><th>Weight</th><th>Rate</th><th>Total</th></tr>
          </thead>
          <tbody>
            {[...sales].reverse().map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.date}</td>
                <td>{s.customer}</td>
                <td>{typePill(s.type)}</td>
                <td>{s.weight} kg</td>
                <td>₹{s.rate}</td>
                <td>₹{s.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
