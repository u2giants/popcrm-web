/* ============================================================================
   POP CRM — shared components & helpers
   ========================================================================== */
const { useState, useMemo, useEffect, useRef } = React;

/* ── format helpers (mirror src/features/crm/format.ts) ─────────────────── */
function label(v) {
  if (!v) return 'Unspecified';
  return v.toLowerCase().split('_').map(p => (p[0]?.toUpperCase() ?? '') + p.slice(1)).join(' ');
}
function initials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
}
function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function money(m) { return '$' + m.toFixed(2) + 'M'; }
const C = window.CRM;
const retailerName = id => C.retailers.find(r => r.id === id)?.name || '—';
const deptName = id => C.depts.find(d => d.id === id)?.name || null;
const buyerById = id => C.buyers.find(b => b.id === id);
const buyerName = id => { const b = buyerById(id); return b ? `${b.first} ${b.last}` : '—'; };
const oppById = id => C.opps.find(o => o.id === id);
const teamById = id => C.team.find(t => t.id === id);

const ROUTING_TONE = { ROUTED: 'success', SKIPPED: 'neutral', COMPANY_ONLY: 'info', COMPANY_DEPT: 'info', UNROUTED: 'danger', CUSTOMER_EMAIL_NO_COMPANY: 'danger' };
const TASK_TONE = { DONE: 'success', IN_PROGRESS: 'info', CANCELED: 'neutral', TODO: 'warning' };
const APPROVAL_TONE = { APPROVED: 'success', REJECTED: 'danger', REVISION_REQUESTED: 'warning', SUBMITTED: 'info', PENDING: 'neutral' };
const STATUS_TONE = { ACTIVE: 'success', PROSPECT: 'info', AT_RISK: 'warning', CHURNED: 'danger' };

function needsRouting(s) { return s && s !== 'ROUTED' && s !== 'SKIPPED'; }

/* ── Chip ───────────────────────────────────────────────────────────────── */
function Chip({ tone = 'neutral', dot, children, className = '' }) {
  return <span className={`chip ${tone} ${className}`}>{dot && <span className="dot" />}{children}</span>;
}
function StageChip({ stage }) {
  return <span className={`stage-chip stage-${stage}`}>{label(stage)}</span>;
}
function Avatar({ name, size = '', hue }) {
  const style = hue != null ? { background: `linear-gradient(140deg, oklch(0.62 0.15 ${hue}), oklch(0.55 0.16 ${hue + 40}))` } : undefined;
  return <div className={`avatar ${size}`} style={style}>{initials(name)}</div>;
}

/* ── Charts (hand-built SVG, token-colored) ─────────────────────────────── */
function Donut({ data, size = 132, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.value / total) * circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
          strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />;
        offset += len;
        return el;
      })}
    </svg>
  );
}

function HBars({ data, max }) {
  const m = max || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '128px 1fr 34px', alignItems: 'center', gap: 10 }}>
          <span className="truncate" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{d.label}</span>
          <div style={{ height: 9, borderRadius: 99, background: 'var(--muted)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / m) * 100}%`, background: d.color || 'var(--chart-1)', borderRadius: 99, transition: 'width .5s cubic-bezier(.22,.61,.36,1)' }} />
          </div>
          <span className="tnum" style={{ fontSize: 12, fontWeight: 650, textAlign: 'right' }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function AreaChart({ series, w = 520, h = 150 }) {
  const pad = { t: 10, r: 6, b: 18, l: 6 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(...series.map(d => d.total)) * 1.1;
  const x = i => pad.l + (i / (series.length - 1)) * iw;
  const y = v => pad.t + ih - (v / max) * ih;
  const line = key => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');
  const area = key => `${line(key)} L${x(series.length - 1)} ${pad.t + ih} L${pad.l} ${pad.t + ih} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaTotal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1={pad.l} x2={w - pad.r} y1={pad.t + ih * f} y2={pad.t + ih * f} stroke="var(--border)" strokeDasharray="2 4" />)}
      <path d={area('total')} fill="url(#areaTotal)" />
      <path d={line('total')} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" />
      <path d={line('routed')} fill="none" stroke="var(--chart-3)" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
      {series.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.total)} r="2.4" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="1.6" />)}
    </svg>
  );
}

function Sparkline({ points, color = 'var(--chart-1)', w = 74, h = 30 }) {
  const max = Math.max(...points), min = Math.min(...points), rng = max - min || 1;
  const x = i => (i / (points.length - 1)) * w;
  const y = v => h - 3 - ((v - min) / rng) * (h - 6);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  return (
    <svg className="kpi-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity="0.10" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── KPI tile ───────────────────────────────────────────────────────────── */
function Kpi({ label, value, icon, tone, delta, deltaDir, foot, spark, onClick, color }) {
  const tint = color && tone !== 'danger'
    ? { background: `color-mix(in oklch, ${color} 15%, transparent)`, color }
    : undefined;
  return (
    <button className={`kpi ${onClick ? 'clickable' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-ico ${tone || ''}`} style={tint}><Icon name={icon} /></span>
      </div>
      <div className={`kpi-val ${tone === 'danger' ? 'danger' : ''}`}>{value}</div>
      <div className="kpi-foot">
        {delta != null && (
          <span className={`delta ${deltaDir}`}>
            <Icon name={deltaDir === 'up' ? 'chevUp' : deltaDir === 'down' ? 'chevDown' : 'arrowRight'} />{delta}
          </span>
        )}
        <span>{foot}</span>
      </div>
      {spark && <Sparkline points={spark} color={tone === 'danger' ? 'var(--destructive)' : (color || 'var(--chart-1)')} />}
    </button>
  );
}

/* ── AG-Grid-style data table ───────────────────────────────────────────────
   Per-column sort + floating filter, drag-resize, drag-reorder, show/hide.   */
function DataTable({ columns, rows, getId, onRow, selectedId, empty }) {
  const initWidth = c => c.width || c.thStyle?.width || 160;
  const [sort, setSort] = useState(null);
  const [order, setOrder] = useState(() => columns.map(c => c.key));
  const [widths, setWidths] = useState(() => Object.fromEntries(columns.map(c => [c.key, initWidth(c)])));
  const [hidden, setHidden] = useState({});
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [colMenu, setColMenu] = useState(false);
  const dragKey = useRef(null);
  const [dropKey, setDropKey] = useState(null);
  const resizing = useRef(null);

  const byKey = useMemo(() => Object.fromEntries(columns.map(c => [c.key, c])), [columns]);
  const ordered = order.map(k => byKey[k]).filter(Boolean);
  const visible = ordered.filter(c => !hidden[c.key]);
  const activeFilters = Object.entries(filters).filter(([, v]) => v && v.trim());

  function toggleSort(c) {
    if (!c.sortVal) return;
    setSort(s => s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' });
  }

  const processed = useMemo(() => {
    let r = rows;
    for (const [k, v] of activeFilters) {
      const col = byKey[k]; const needle = v.trim().toLowerCase();
      const get = col?.filterVal || col?.sortVal;
      if (get) r = r.filter(row => String(get(row) ?? '').toLowerCase().includes(needle));
    }
    if (sort) {
      const col = byKey[sort.key];
      if (col?.sortVal) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        r = [...r].sort((a, b) => { const av = col.sortVal(a), bv = col.sortVal(b); return (av < bv ? -1 : av > bv ? 1 : 0) * dir; });
      }
    }
    return r;
  }, [rows, sort, filters, byKey]);

  // resize
  function onResizeDown(e, key) {
    e.preventDefault(); e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startW: widths[key] || 160 };
    const move = ev => {
      const r = resizing.current; if (!r) return;
      const w = Math.max(byKey[r.key]?.minWidth || 80, r.startW + (ev.clientX - r.startX));
      setWidths(prev => ({ ...prev, [r.key]: w }));
    };
    const up = () => { resizing.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }
  // reorder
  function onDrop(targetKey) {
    const from = dragKey.current; if (!from || from === targetKey) { setDropKey(null); return; }
    setOrder(prev => {
      const next = prev.filter(k => k !== from);
      const i = next.indexOf(targetKey);
      next.splice(i, 0, from); return next;
    });
    dragKey.current = null; setDropKey(null);
  }

  return (
    <div className="tbl-wrap" onClick={() => colMenu && setColMenu(false)}>
      <div className="tbl-toolbar" onClick={e => e.stopPropagation()}>
        <span className="left">{processed.length.toLocaleString()} rows{activeFilters.length ? ` · ${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''}` : ''}</span>
        <span className="spacer" />
        <button className={`btn sm ${showFilters ? 'primary' : 'ghost'}`} onClick={() => setShowFilters(s => !s)}><Icon name="filter" />Filters</button>
        <div className="colmenu">
          <button className="btn sm ghost" onClick={e => { e.stopPropagation(); setColMenu(m => !m); }}><Icon name="panel" />Columns</button>
          {colMenu && (
            <div className="colmenu-pop" onClick={e => e.stopPropagation()}>
              {ordered.map(c => (
                <button key={c.key} className="colmenu-item" draggable
                  onDragStart={() => (dragKey.current = c.key)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(c.key)}
                  onClick={() => setHidden(h => ({ ...h, [c.key]: !h[c.key] }))}>
                  <span className="grip"><Icon name="grip" /></span>
                  <span className={`colmenu-check ${!hidden[c.key] ? 'on' : ''}`}>{!hidden[c.key] && <Icon name="check" />}</span>
                  <span style={{ flex: 1 }}>{c.header}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <colgroup>{visible.map(c => <col key={c.key} style={{ width: widths[c.key] }} />)}</colgroup>
          <thead>
            <tr>
              {visible.map(c => (
                <th key={c.key}
                  className={`${c.sortVal ? 'sortable' : ''} ${dropKey === c.key ? 'drop-target' : ''}`}
                  draggable
                  onDragStart={() => (dragKey.current = c.key)}
                  onDragOver={e => { e.preventDefault(); if (dropKey !== c.key) setDropKey(c.key); }}
                  onDragLeave={() => setDropKey(k => k === c.key ? null : k)}
                  onDrop={() => onDrop(c.key)}>
                  <span className="th-flex" onClick={() => toggleSort(c)}>
                    <span className="th-text">{c.header}</span>
                    {c.sortVal && <Icon name={sort?.key === c.key ? (sort.dir === 'asc' ? 'chevUp' : 'chevDown') : 'chevDown'} className={`th-sort ${sort?.key === c.key ? '' : 'idle'}`} />}
                    {(c.filterVal || c.sortVal) && (
                      <span className={`th-funnel ${filters[c.key] ? 'on' : ''}`} title="Filter"
                        onClick={e => { e.stopPropagation(); setShowFilters(true); setTimeout(() => document.getElementById('flt-' + c.key)?.focus(), 30); }}>
                        <Icon name="filter" />
                      </span>
                    )}
                  </span>
                  <span className="th-resize" onMouseDown={e => onResizeDown(e, c.key)} onClick={e => e.stopPropagation()} />
                </th>
              ))}
            </tr>
            {showFilters && (
              <tr className="floating">
                {visible.map(c => (
                  <th key={c.key}>
                    {(c.filterVal || c.sortVal) ? (
                      <span className="float-wrap">
                        <Icon name="search" />
                        <input id={'flt-' + c.key} className="float-input" placeholder="Filter…"
                          value={filters[c.key] || ''} onChange={e => setFilters(f => ({ ...f, [c.key]: e.target.value }))} />
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {processed.map(row => (
              <tr key={getId(row)} className={selectedId === getId(row) ? 'selected' : ''} onClick={() => onRow?.(row)}>
                {visible.map(c => <td key={c.key} style={c.tdStyle}>{c.cell(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!processed.length && <div className="empty"><Icon name={empty?.icon || 'inbox'} />{empty?.text || 'Nothing here yet.'}</div>}
      </div>
    </div>
  );
}

/* ── Drawer ─────────────────────────────────────────────────────────────── */
function Drawer({ open, onClose, children }) {
  useEffect(() => {
    function k(e) { if (e.key === 'Escape') onClose(); }
    if (open) window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <React.Fragment>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">{children}</aside>
    </React.Fragment>
  );
}
function DrawerHead({ title, sub, badge, onClose }) {
  return (
    <div className="drawer-head">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 8, marginBottom: 3 }}>{badge}</div>
        <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{title}</div>
        {sub && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
    </div>
  );
}
function DL({ items }) {
  return (
    <dl className="dl">
      {items.filter(Boolean).map(([k, v], i) => <React.Fragment key={i}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
    </dl>
  );
}
function Section({ icon, title, action, children }) {
  return (
    <div className="col" style={{ gap: 9 }}>
      <div className="row">
        <span className="section-label">{icon && <Icon name={icon} />}{title}</span>
        <span className="spacer" />
        {action}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, {
  label, initials, fmtDate, fmtDateTime, money, retailerName, deptName, buyerById, buyerName, oppById, teamById,
  ROUTING_TONE, TASK_TONE, APPROVAL_TONE, STATUS_TONE, needsRouting,
  Chip, StageChip, Avatar, Donut, HBars, AreaChart, Sparkline, Kpi, DataTable, Drawer, DrawerHead, DL, Section,
});
