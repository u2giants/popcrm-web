/* ============================================================================
   POP CRM — page screens
   ========================================================================== */
const { useState: useS, useMemo: useM } = React;

function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div><div className="page-title">{title}</div>{sub && <div className="page-sub">{sub}</div>}</div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

// Single efficient row: title · subtitle · [spacer] · search · action · count
function ListBar({ title, sub, search, onSearch, placeholder, action, count, extra }) {
  return (
    <div className="list-head">
      <div className="lh-titles">
        <span className="lh-title">{title}</span>
        {sub && <span className="lh-sub">{sub}</span>}
      </div>
      <span className="spacer" />
      {extra}
      {onSearch && (
        <div className="searchbar" style={{ width: 260, maxWidth: '38vw' }}>
          <Icon name="search" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--foreground)' }} />
        </div>
      )}
      {action}
      {count && <span className="lh-count">{count}</span>}
    </div>
  );
}

/* ─────────────────────────────── OVERVIEW ─────────────────────────────── */
function OverviewPage({ go }) {
  const C = window.CRM, s = C.stats;
  const routing = [
    { key: 'ROUTED', label: 'Routed', value: s.routed, color: 'var(--chart-3)' },
    { key: 'COMPANY_DEPT', label: 'Company + dept', value: 1290, color: 'var(--chart-1)' },
    { key: 'COMPANY_ONLY', label: 'Company only', value: 364, color: 'var(--chart-2)' },
    { key: 'SKIPPED', label: 'Skipped', value: s.skipped, color: 'var(--muted-foreground)' },
    { key: 'UNROUTED', label: 'Needs routing', value: s.needsRouting, color: 'var(--chart-4)' },
  ];
  const stageBars = C.stages.map((st, i) => ({
    label: label(st), value: C.opps.filter(o => o.stage === st).length * (i === 0 ? 4 : 3) + 2,
    color: 'var(--chart-1)',
  }));
  const unrouted = C.emails.filter(e => needsRouting(e.status)).slice(0, 5);
  const approvals = C.approvals.filter(a => a.status !== 'APPROVED' && a.status !== 'REJECTED').slice(0, 5);

  return (
    <div className="page">
      <ListBar
        title="Overview" sub="Operational snapshot — accounts, routing health and program pipeline."
        action={<>
          <Chip tone="success" dot>Fireflies online</Chip>
          <button className="btn sm"><Icon name="download" />Export</button>
          <button className="btn sm primary"><Icon name="plus" />New program</button>
        </>}
      />
      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="kpi-grid">
          <Kpi label="Accounts" value={s.accounts.toLocaleString()} icon="building" color="oklch(0.60 0.15 200)" delta="2.1%" deltaDir="up" foot="vs last qtr" spark={[28, 30, 29, 33, 36, 35, 38, 40]} onClick={() => go('accounts')} />
          <Kpi label="Contacts" value={s.contacts.toLocaleString()} icon="contact" color="oklch(0.62 0.15 165)" delta="3.4%" deltaDir="up" foot="vs last qtr" spark={[60, 62, 61, 65, 68, 70, 72, 76]} onClick={() => go('contacts')} />
          <Kpi label="Open programs" value={s.openOpportunities} icon="pipeline" color="oklch(0.62 0.17 300)" delta="6" deltaDir="up" foot="new this month" spark={[30, 32, 35, 33, 38, 40, 44, 47]} onClick={() => go('pipeline')} />
          <Kpi label="Needs routing" value={s.needsRouting} icon="mail" tone="danger" delta="12" deltaDir="down" foot="cleared today" spark={[40, 32, 28, 22, 18, 14, 9, 6]} onClick={() => go('email')} />
          <Kpi label="Meetings" value={s.meetings} icon="calendar" color="oklch(0.66 0.15 60)" delta="4" deltaDir="up" foot="this month" spark={[12, 14, 13, 16, 18, 20, 24, 27]} onClick={() => go('meetings')} />
          <Kpi label="Open tasks" value={s.openTasks} icon="tasks" color="oklch(0.64 0.16 95)" delta="flat" deltaDir="flat" foot="on track" spark={[8, 7, 9, 6, 7, 5, 6, 5]} onClick={() => go('tasks')} />
          <Kpi label="Approvals" value={s.pendingApprovals} icon="shield" color="oklch(0.60 0.16 340)" delta="2" deltaDir="up" foot="awaiting licensor" spark={[2, 3, 2, 4, 3, 5, 4, 4]} onClick={() => go('approvals')} />
        </div>

        <div className="grid-dash">
          <div className="card">
            <div className="card-head"><h3>Email volume <span className="sub">· 12-week ingest vs. auto-routed</span></h3>
              <div className="row" style={{ gap: 12 }}>
                <span className="legend-row" style={{ fontSize: 11 }}><span className="sw" style={{ background: 'var(--chart-1)' }} />Ingested</span>
                <span className="legend-row" style={{ fontSize: 11 }}><span className="sw" style={{ background: 'var(--chart-3)' }} />Auto-routed</span>
              </div>
            </div>
            <div className="card-pad"><AreaChart series={C.emailTrend} /></div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Routing health</h3><button className="link" onClick={() => go('email')}>Open queue <Icon name="arrowRight" /></button></div>
            <div className="card-pad row" style={{ gap: 18, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Donut data={routing} />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div><div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>{Math.round((s.routed / s.emails) * 100)}%</div><div className="muted" style={{ fontSize: 10 }}>auto-routed</div></div>
                </div>
              </div>
              <div className="legend" style={{ flex: 1 }}>
                {routing.map(r => <div key={r.key} className="legend-row"><span className="sw" style={{ background: r.color }} /><span className="lab">{r.label}</span><span className="val tnum">{r.value.toLocaleString()}</span></div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid-dash">
          <div className="card">
            <div className="card-head"><h3>Pipeline distribution <span className="sub">· programs by stage</span></h3>
              <span className="amount" style={{ fontSize: 13 }}>{money(C.stats.pipelineValue)} total value</span></div>
            <div className="card-pad"><HBars data={stageBars} /></div>
          </div>
          <ActivityCard title="Needs routing" icon="mail" onView={() => go('email')} empty="Inbox zero — everything routed."
            items={unrouted.map(e => ({ id: e.id, pri: e.subject, sec: e.sender, tail: <Chip tone={ROUTING_TONE[e.status] || 'warning'}>{label(e.status)}</Chip> }))} />
        </div>

        <div className="grid-dash">
          <ActivityCard title="Recent meetings" icon="calendar" onView={() => go('meetings')} empty="No meetings yet."
            items={C.meetings.slice(0, 5).map(m => ({ id: m.id, pri: m.name, sec: retailerName(m.retailer), tail: <span className="muted" style={{ fontSize: 11 }}>{fmtDate(m.date)}</span> }))} />
          <ActivityCard title="Pending approvals" icon="shield" onView={() => go('approvals')} empty="No pending approvals."
            items={approvals.map(a => ({ id: a.id, pri: a.name, sec: a.licensor, tail: <Chip tone={APPROVAL_TONE[a.status]} dot>{label(a.status)}</Chip> }))} />
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ title, icon, items, empty, onView }) {
  return (
    <div className="card">
      <div className="card-head"><h3 className="row" style={{ gap: 7 }}><Icon name={icon} style={{ width: 15, height: 15, color: 'var(--muted-foreground)' }} />{title}</h3>
        <button className="link" onClick={onView}>View all <Icon name="arrowRight" /></button></div>
      {items.length ? <div className="alist">{items.map(it => (
        <button key={it.id} className="aitem">
          <div className="ai-main"><div className="ai-pri truncate">{it.pri}</div><div className="ai-sec truncate">{it.sec}</div></div>
          {it.tail}
        </button>
      ))}</div> : <div className="empty">{empty}</div>}
    </div>
  );
}

/* ────────────────────────────── EMAIL ROUTING ─────────────────────────── */
function EmailPage() {
  const C = window.CRM;
  const [seg, setSeg] = useS('needs');
  const [q, setQ] = useS('');
  const [sel, setSel] = useS(null);
  const segs = [
    { id: 'needs', label: 'Needs routing', n: C.emails.filter(e => needsRouting(e.status)).length },
    { id: 'routed', label: 'Routed', n: C.emails.filter(e => e.status === 'ROUTED').length },
    { id: 'skipped', label: 'Skipped', n: C.emails.filter(e => e.status === 'SKIPPED').length },
    { id: 'all', label: 'All', n: C.emails.length },
  ];
  const rows = useM(() => C.emails.filter(e => {
    if (seg === 'needs' && !needsRouting(e.status)) return false;
    if (seg === 'routed' && e.status !== 'ROUTED') return false;
    if (seg === 'skipped' && e.status !== 'SKIPPED') return false;
    if (q && !(e.subject + e.sender).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [seg, q]);

  const columns = [
    { key: 'received', header: 'Date', sortVal: e => e.received, thStyle: { width: 116 }, cell: e => <span className="cell-muted tnum" style={{ fontSize: 11.5 }}>{fmtDateTime(e.received)}</span> },
    { key: 'subject', header: 'Subject', sortVal: e => e.subject.toLowerCase(), cell: e => <div className="cell-stack" style={{ maxWidth: 360 }}><span className="cell-primary truncate">{e.subject}</span><span className="cell-sub truncate">{e.sender}</span></div> },
    { key: 'retailer', header: 'Account', sortVal: e => retailerName(e.retailer), cell: e => e.retailer ? <span>{retailerName(e.retailer)}</span> : <span className="cell-muted">—</span> },
    { key: 'method', header: 'Method', cell: e => <Chip tone="outline">{label(e.method)}</Chip> },
    { key: 'status', header: 'Status', sortVal: e => e.status, cell: e => <Chip tone={ROUTING_TONE[e.status] || 'warning'} dot>{label(e.status)}</Chip> },
  ];

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar
        title="Email Routing" sub="Outlook-ingested mail routed to accounts, departments and programs."
        search={q} onSearch={setQ} placeholder="Search subject, sender…"
        extra={
          <div className="segmented">
            {segs.map(sg => <button key={sg.id} className={`seg ${seg === sg.id ? 'active' : ''}`} onClick={() => setSeg(sg.id)}>{sg.label}<span className="seg-count">{sg.n}</span></button>)}
          </div>
        }
        action={<Chip tone="success" dot>Webhook live</Chip>}
      />
      <div className="page-body" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <DataTable columns={columns} rows={rows} getId={e => e.id} onRow={setSel} selectedId={sel?.id}
          empty={{ icon: 'mail', text: seg === 'needs' ? 'Inbox zero on routing.' : 'No messages match.' }} />
        <aside className="col" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-head"><h3>Worker cadence</h3></div>
            <div className="card-pad col" style={{ gap: 9 }}>
              {[['Outlook ingest', 'every 15 min'], ['Reroute pass', 'every 6 hrs'], ['Contact sync', 'daily'], ['Summaries', 'every 6 hrs']].map(w => (
                <div key={w[0]} className="row"><span className="muted" style={{ fontSize: 12 }}>{w[0]}</span><span className="spacer" /><Chip tone="outline">{w[1]}</Chip></div>
              ))}
              <div className="row" style={{ borderTop: '1px solid var(--border)', paddingTop: 9 }}><span className="muted" style={{ fontSize: 12 }}>Last ingest</span><span className="spacer" /><span className="row" style={{ gap: 6, fontSize: 12 }}><span className="health-dot ok" />4 min ago</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Ignore rules <span className="sub">· 23 active</span></h3></div>
            <div className="card-pad col" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 7 }}><input className="input" placeholder="Subject pattern…" style={{ flex: 1 }} /><button className="btn sm primary" style={{ padding: '0 9px' }}><Icon name="plus" /></button></div>
              {[['Out of office', 'CONTAINS', 412], ['Newsletter', 'CONTAINS', 308], ['noreply@', 'STARTS_WITH', 690]].map(r => (
                <div key={r[0]} className="card-pad" style={{ background: 'var(--muted)', borderRadius: 9, padding: '8px 10px' }}>
                  <div className="cell-primary" style={{ fontSize: 12 }}>{r[0]}</div>
                  <div className="cell-sub">{label(r[1])} · {r[2]} skipped</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <EmailDrawer email={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── PIPELINE ────────────────────────────── */
function PipelinePage() {
  const C = window.CRM;
  const [q, setQ] = useS('');
  const [ret, setRet] = useS('');
  const [sel, setSel] = useS(null);
  const filtered = useM(() => C.opps.filter(o =>
    (!q || (o.name + retailerName(o.retailer) + (o.po || '') + (o.so || '')).toLowerCase().includes(q.toLowerCase())) &&
    (!ret || o.retailer === ret)), [q, ret]);
  const grouped = C.stages.map(st => ({ stage: st, rows: filtered.filter(o => o.stage === st) }));

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar
        title="Pipeline" sub="Program opportunities by stage across all accounts."
        search={q} onSearch={setQ} placeholder="Search name, retailer, PO, SO…"
        extra={<>
          <select className="select" value={ret} onChange={e => setRet(e.target.value)}>
            <option value="">All accounts</option>
            {C.retailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="select"><option>All licensors</option>{C.licensors.map(l => <option key={l}>{l}</option>)}</select>
          <div className="segmented"><button className="seg active"><Icon name="panel" style={{ width: 14, height: 14 }} />Board</button><button className="seg"><Icon name="menu" style={{ width: 14, height: 14 }} />List</button></div>
        </>}
        action={<button className="btn sm primary"><Icon name="plus" />New program</button>}
        count={`${filtered.length} programs · ${money(C.stats.pipelineValue)}`}
      />
      <div className="board">
        {grouped.map(g => (
          <section key={g.stage} className="board-col">
            <div className="board-col-head"><StageChip stage={g.stage} /><Chip tone="neutral">{g.rows.length}</Chip></div>
            <div className="board-col-body">
              {g.rows.length === 0 && <div className="empty" style={{ padding: 18, fontSize: 11.5 }}>No programs</div>}
              {g.rows.map(o => (
                <button key={o.id} className="opp-card" onClick={() => setSel(o)}>
                  <div className="row" style={{ alignItems: 'flex-start', gap: 6 }}>
                    <span className="opp-title" style={{ flex: 1 }}>{o.name}</span>
                    {o.ai && <Icon name="sparkles" style={{ width: 13, height: 13, color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />}
                  </div>
                  <div className="opp-meta">
                    <span className="truncate">{retailerName(o.retailer)}</span>
                    <span className="row" style={{ gap: 5 }}><Chip tone="outline" className="" >{o.licensor}</Chip></span>
                    {(o.po || o.so) && <span className="mono truncate" style={{ fontSize: 10.5 }}>{o.po || o.so}</span>}
                  </div>
                  <div className="opp-foot">
                    <span className="amount">{money(o.amount)}</span>
                    <span className="muted" style={{ fontSize: 10.5 }}>{fmtDate(o.close_date)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <RecordModal opp={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── ACCOUNTS ────────────────────────────── */
function AccountsPage() {
  const C = window.CRM;
  const [q, setQ] = useS(''); const [sel, setSel] = useS(null);
  const rows = useM(() => C.retailers.filter(r =>
    (!q || (r.name + r.domain).toLowerCase().includes(q.toLowerCase()))), [q]);
  const columns = [
    { key: 'name', header: 'Account', sortVal: r => r.name.toLowerCase(), cell: r => <div className="cell-with-avatar"><Avatar name={r.name} size="xs" hue={(r.name.charCodeAt(0) * 7) % 360} /><div className="cell-stack"><span className="cell-primary">{r.name}</span><span className="cell-sub">{r.domain}</span></div></div> },
    { key: 'status', header: 'Status', sortVal: r => r.customer_status, cell: r => <Chip tone={STATUS_TONE[r.customer_status]} dot>{label(r.customer_status)}</Chip> },
    { key: 'chain', header: 'Chain', cell: r => <Chip tone="outline">{label(r.chain_type)}</Chip> },
    { key: 'contacts', header: 'Contacts', sortVal: r => r.contacts, thStyle: { textAlign: 'right' }, tdStyle: { textAlign: 'right' }, cell: r => <span className="tnum">{r.contacts}</span> },
    { key: 'programs', header: 'Programs', sortVal: r => r.programs, thStyle: { textAlign: 'right' }, tdStyle: { textAlign: 'right' }, cell: r => <span className="tnum">{r.programs}</span> },
    { key: 'ytd', header: 'YTD revenue', sortVal: r => r.ytd, thStyle: { textAlign: 'right' }, tdStyle: { textAlign: 'right' }, cell: r => <span className="amount">{money(r.ytd)}</span> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar
        title="Accounts" sub="Retailer accounts, customer status and program relationships."
        search={q} onSearch={setQ} placeholder="Search name or domain…"
        action={<button className="btn sm primary"><Icon name="plus" />New account</button>}
        count={`${rows.length} of ${C.stats.accounts.toLocaleString()} accounts`}
      />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={r => r.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'building', text: 'No accounts match.' }} />
      </div>
      <AccountDrawer account={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── CONTACTS ────────────────────────────── */
function ContactsPage() {
  const C = window.CRM;
  const [q, setQ] = useS(''); const [sel, setSel] = useS('');
  const rows = useM(() => C.buyers.filter(b => !q || (`${b.first} ${b.last} ${b.email}`).toLowerCase().includes(q.toLowerCase())), [q]);
  const columns = [
    { key: 'name', header: 'Contact', sortVal: b => b.last.toLowerCase(), cell: b => <div className="cell-with-avatar"><Avatar name={`${b.first} ${b.last}`} size="sm" hue={(b.last.charCodeAt(0) * 9) % 360} /><div className="cell-stack"><span className="cell-primary">{b.first} {b.last}</span><span className="cell-sub truncate">{b.email}</span></div></div> },
    { key: 'title', header: 'Title', sortVal: b => b.title, cell: b => <span className="truncate" style={{ display: 'block', maxWidth: 200 }}>{b.title}</span> },
    { key: 'retailer', header: 'Account', sortVal: b => retailerName(b.retailer), cell: b => retailerName(b.retailer) },
    { key: 'dept', header: 'Department', cell: b => deptName(b.dept) ? <span className="cell-muted">{deptName(b.dept)}</span> : <span className="cell-muted">—</span> },
    { key: 'type', header: 'Type', cell: b => <Chip tone="info">{label(b.type)}</Chip> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar
        title="Contacts" sub="Buyer and merchant contacts across all retail accounts."
        search={q} onSearch={setQ} placeholder="Search name or email…"
        action={<button className="btn sm primary"><Icon name="plus" />New contact</button>}
        count={`${rows.length} of ${C.stats.contacts.toLocaleString()} contacts`}
      />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={b => b.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'contact', text: 'No contacts match.' }} />
      </div>
      <ContactDrawer contact={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── MEETINGS ────────────────────────────── */
function MeetingsPage() {
  const C = window.CRM;
  const [q, setQ] = useS(''); const [sel, setSel] = useS(null);
  const rows = useM(() => C.meetings.filter(m => !q || (`${m.name} ${retailerName(m.retailer)} ${m.participants}`).toLowerCase().includes(q.toLowerCase())), [q]);
  const columns = [
    { key: 'date', header: 'Date', sortVal: m => m.date, width: 110, cell: m => <span className="cell-muted tnum" style={{ fontSize: 11.5 }}>{fmtDate(m.date)}</span> },
    { key: 'name', header: 'Meeting', sortVal: m => m.name.toLowerCase(), width: 300, cell: m => <div className="cell-stack"><span className="cell-primary truncate">{m.name}</span><span className="cell-sub truncate">{m.summary}</span></div> },
    { key: 'retailer', header: 'Account', sortVal: m => retailerName(m.retailer), width: 150, cell: m => retailerName(m.retailer) },
    { key: 'contact', header: 'Contact', filterVal: m => buyerName(m.contact), width: 150, cell: m => <span className="cell-muted">{buyerName(m.contact)}</span> },
    { key: 'participants', header: 'Participants', filterVal: m => m.participants, width: 200, cell: m => <span className="cell-muted truncate" style={{ display: 'block', maxWidth: 190 }}>{m.participants}</span> },
    { key: 'source', header: 'Source', sortVal: m => m.source, width: 110, cell: m => <Chip tone={m.source === 'FIREFLIES' ? 'info' : 'neutral'} dot>{label(m.source)}</Chip> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar title="Meetings" sub="Fireflies-ingested meeting notes, summaries and action items."
        search={q} onSearch={setQ} placeholder="Search title, account, participant…"
        action={<button className="btn sm primary"><Icon name="plus" />Log meeting</button>}
        count={`${rows.length} of ${C.stats.meetings} meetings`} />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={m => m.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'calendar', text: 'No meetings match.' }} />
      </div>
      <MeetingDrawer meeting={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── NOTES ───────────────────────────────── */
function NotesPage() {
  const C = window.CRM;
  const [q, setQ] = useS(''); const [sel, setSel] = useS(null);
  const rows = useM(() => C.notes.filter(n => !q || (`${n.title} ${n.body}`).toLowerCase().includes(q.toLowerCase())), [q]);
  const columns = [
    { key: 'date', header: 'Date', sortVal: n => n.date, width: 110, cell: n => <span className="cell-muted tnum" style={{ fontSize: 11.5 }}>{fmtDate(n.date)}</span> },
    { key: 'title', header: 'Note', sortVal: n => n.title.toLowerCase(), width: 360, cell: n => <div className="cell-stack"><span className="cell-primary truncate">{n.title}</span><span className="cell-sub truncate">{n.body}</span></div> },
    { key: 'retailer', header: 'Account', filterVal: n => n.retailer ? retailerName(n.retailer) : '', width: 150, cell: n => n.retailer ? retailerName(n.retailer) : <span className="cell-muted">—</span> },
    { key: 'opp', header: 'Program', filterVal: n => n.opp ? (oppById(n.opp)?.name || '') : '', width: 220, cell: n => <span className="cell-muted truncate" style={{ display: 'block', maxWidth: 210 }}>{n.opp ? (oppById(n.opp)?.name || '—') : '—'}</span> },
    { key: 'source', header: 'Source', sortVal: n => n.source, width: 110, cell: n => <Chip tone="outline">{label(n.source)}</Chip> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar title="Notes" sub="Manual CRM notes linked to accounts, contacts and programs."
        search={q} onSearch={setQ} placeholder="Search title or body…"
        action={<button className="btn sm primary"><Icon name="plus" />New note</button>}
        count={`${rows.length} notes`} />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={n => n.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'notes', text: 'No notes match.' }} />
      </div>
      <NoteDrawer note={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── TASKS ───────────────────────────────── */
function TasksPage() {
  const C = window.CRM;
  const [seg, setSeg] = useS('open');
  const [q, setQ] = useS(''); const [sel, setSel] = useS(null);
  const segs = [
    { id: 'open', label: 'Open', n: C.tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELED').length },
    { id: 'TODO', label: 'To do', n: C.tasks.filter(t => t.status === 'TODO').length },
    { id: 'IN_PROGRESS', label: 'In progress', n: C.tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { id: 'DONE', label: 'Done', n: C.tasks.filter(t => t.status === 'DONE').length },
    { id: 'all', label: 'All', n: C.tasks.length },
  ];
  const overdue = d => new Date(d) < new Date('2026-06-11');
  const rows = useM(() => C.tasks.filter(t => {
    if (seg === 'open' && (t.status === 'DONE' || t.status === 'CANCELED')) return false;
    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(seg) && t.status !== seg) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [seg, q]);
  const columns = [
    { key: 'title', header: 'Task', sortVal: t => t.title.toLowerCase(), width: 360, cell: t => <div className="cell-stack"><span className="cell-primary truncate">{t.title}</span><span className="cell-sub truncate">{oppById(t.opp)?.name || '—'}</span></div> },
    { key: 'status', header: 'Status', sortVal: t => t.status, width: 140, cell: t => <Chip tone={TASK_TONE[t.status]} dot>{label(t.status)}</Chip> },
    { key: 'due', header: 'Due', sortVal: t => t.due, width: 130, cell: t => <span className={overdue(t.due) && t.status !== 'DONE' ? '' : 'cell-muted'} style={overdue(t.due) && t.status !== 'DONE' ? { color: 'var(--destructive)', fontWeight: 600 } : undefined}>{fmtDate(t.due)}</span> },
    { key: 'account', header: 'Account', filterVal: t => retailerName(oppById(t.opp)?.retailer), width: 150, cell: t => <span className="cell-muted">{retailerName(oppById(t.opp)?.retailer)}</span> },
    { key: 'assignee', header: 'Assignee', filterVal: t => teamById(t.assignee)?.name, width: 170, cell: t => <span className="cell-with-avatar"><Avatar name={teamById(t.assignee)?.name || '—'} size="xs" hue={(teamById(t.assignee)?.name.charCodeAt(0) * 9) % 360} />{teamById(t.assignee)?.name}</span> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar title="Tasks" sub="Open work across the sales and licensing pipeline."
        search={q} onSearch={setQ} placeholder="Search tasks…"
        extra={<div className="segmented">{segs.map(sg => <button key={sg.id} className={`seg ${seg === sg.id ? 'active' : ''}`} onClick={() => setSeg(sg.id)}>{sg.label}<span className="seg-count">{sg.n}</span></button>)}</div>}
        action={<button className="btn sm primary"><Icon name="plus" />New task</button>} />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={t => t.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'tasks', text: 'No tasks match.' }} />
      </div>
      <TaskDrawer task={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── APPROVALS ───────────────────────────── */
function ApprovalsPage() {
  const C = window.CRM;
  const [seg, setSeg] = useS('pending');
  const [q, setQ] = useS(''); const [sel, setSel] = useS(null);
  const pending = a => a.status !== 'APPROVED' && a.status !== 'REJECTED';
  const segs = [
    { id: 'pending', label: 'Pending', n: C.approvals.filter(pending).length },
    { id: 'APPROVED', label: 'Approved', n: C.approvals.filter(a => a.status === 'APPROVED').length },
    { id: 'all', label: 'All', n: C.approvals.length },
  ];
  const rows = useM(() => C.approvals.filter(a => {
    if (seg === 'pending' && !pending(a)) return false;
    if (seg === 'APPROVED' && a.status !== 'APPROVED') return false;
    if (q && !(`${a.name} ${a.licensor}`).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [seg, q]);
  const columns = [
    { key: 'name', header: 'Submission', sortVal: a => a.name.toLowerCase(), width: 280, cell: a => <div className="cell-stack"><span className="cell-primary truncate">{a.name}</span><span className="cell-sub truncate">{oppById(a.opp)?.name || '—'}</span></div> },
    { key: 'licensor', header: 'Licensor', sortVal: a => a.licensor, width: 150, cell: a => <Chip tone="outline">{a.licensor}</Chip> },
    { key: 'status', header: 'Status', sortVal: a => a.status, width: 170, cell: a => <Chip tone={APPROVAL_TONE[a.status]} dot>{label(a.status)}</Chip> },
    { key: 'submitted', header: 'Submitted', sortVal: a => a.submitted, width: 130, cell: a => <span className="cell-muted tnum">{fmtDate(a.submitted)}</span> },
    { key: 'comment', header: 'Latest comment', filterVal: a => a.comment, width: 300, cell: a => <span className="cell-muted truncate" style={{ display: 'block', maxWidth: 290 }}>{a.comment}</span> },
  ];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar title="Approvals" sub="Licensor approval threads and submission status."
        search={q} onSearch={setQ} placeholder="Search submission or licensor…"
        extra={<div className="segmented">{segs.map(sg => <button key={sg.id} className={`seg ${seg === sg.id ? 'active' : ''}`} onClick={() => setSeg(sg.id)}>{sg.label}<span className="seg-count">{sg.n}</span></button>)}</div>}
        action={<button className="btn sm primary"><Icon name="plus" />New submission</button>} />
      <div className="page-body" style={{ flex: 1, minHeight: 0 }}>
        <DataTable columns={columns} rows={rows} getId={a => a.id} onRow={setSel} selectedId={sel?.id} empty={{ icon: 'shield', text: 'No approvals match.' }} />
      </div>
      <ApprovalDrawer approval={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ──────────────────────────────── SETTINGS ────────────────────────────── */
function SettingsPage() {
  const C = window.CRM;
  const [tab, setTab] = useS('models');
  const AI_MODELS = ['GPT_5_4', 'GPT_5_4_MINI', 'GEMINI_3_1_PRO', 'GEMINI_3_FLASH', 'CLAUDE_SONNET_4_6', 'CLAUDE_HAIKU_4_5'];
  const MODEL_FIELDS = [
    { key: 'email_routing_model', label: 'Email routing', desc: 'Classifies inbound Outlook mail to account / department.', val: 'CLAUDE_SONNET_4_6' },
    { key: 'fireflies_routing_model', label: 'Fireflies routing', desc: 'Routes meeting notes to the right account and program.', val: 'GPT_5_4' },
    { key: 'transcript_split_model', label: 'Transcript split', desc: 'Segments long transcripts into per-topic notes.', val: 'GEMINI_3_FLASH' },
    { key: 'opportunity_summary_model', label: 'Program summaries', desc: 'Generates the AI program summary on each opportunity.', val: 'CLAUDE_SONNET_4_6' },
  ];
  const WORKERS = [
    { label: 'Outlook ingest', cadence: 'every 15 min', last: '4 min ago', ok: true },
    { label: 'Reroute pass', cadence: 'every 6 hours', last: '2 hr ago', ok: true },
    { label: 'Contact sync', cadence: 'daily', last: '9 hr ago', ok: true },
    { label: 'Program summaries', cadence: 'every 6 hours', last: '2 hr ago', ok: true },
    { label: 'Fireflies webhook', cadence: 'realtime', last: 'live', ok: true },
  ];
  const TABS = [['models', 'AI Models'], ['workers', 'System health'], ['rules', 'Ignore rules'], ['integrations', 'Integrations']];
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <ListBar title="Settings" sub="AI model config, automation health, routing rules and integrations."
        extra={<div className="segmented">{TABS.map(([id, lab]) => <button key={id} className={`seg ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{lab}</button>)}</div>} />
      <div className="page-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', maxWidth: 920 }}>
        {tab === 'models' && (
          <div className="card">
            <div className="card-head"><h3>AI model configuration <span className="sub">· per automation task</span></h3></div>
            <div className="alist">
              {MODEL_FIELDS.map(f => (
                <div key={f.key} className="aitem" style={{ padding: '12px 16px' }}>
                  <span className="field-ico" style={{ background: 'linear-gradient(150deg, oklch(0.62 0.17 300), oklch(0.50 0.17 300))' }}><Icon name="sparkles" /></span>
                  <div className="ai-main"><div className="ai-pri">{f.label}</div><div className="ai-sec">{f.desc}</div></div>
                  <select className="select" defaultValue={f.val} style={{ minWidth: 190 }}>{AI_MODELS.map(m => <option key={m} value={m}>{label(m).replace(/ /g, ' ')}</option>)}</select>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'workers' && (
          <div className="card">
            <div className="card-head"><h3>Automation health</h3><Chip tone="success" dot>All systems normal</Chip></div>
            <div className="alist">
              {WORKERS.map(w => (
                <div key={w.label} className="aitem" style={{ padding: '12px 16px' }}>
                  <span className={`health-dot ${w.ok ? 'ok' : 'warn'}`} />
                  <div className="ai-main"><div className="ai-pri">{w.label}</div><div className="ai-sec">Runs {w.cadence}</div></div>
                  <span className="muted" style={{ fontSize: 12 }}>last run {w.last}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'rules' && (
          <div className="card">
            <div className="card-head"><h3>Ignore rules <span className="sub">· 23 active</span></h3><button className="btn sm primary"><Icon name="plus" />Add rule</button></div>
            <div className="alist">
              {[['Out of office', 'CONTAINS', 412], ['Newsletter', 'CONTAINS', 308], ['noreply@', 'STARTS_WITH', 690], ['Promotional offer', 'CONTAINS', 145], ['Delivery notification', 'CONTAINS', 233]].map(r => (
                <div key={r[0]} className="aitem" style={{ padding: '11px 16px' }}>
                  <span className="field-ico" style={{ background: 'linear-gradient(150deg, oklch(0.62 0.16 25), oklch(0.5 0.16 25))' }}><Icon name="filter" /></span>
                  <div className="ai-main"><div className="ai-pri mono" style={{ fontSize: 12.5 }}>{r[0]}</div><div className="ai-sec">{label(r[1])} · {r[2]} emails skipped</div></div>
                  <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="x" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'integrations' && (
          <div className="col" style={{ gap: 12 }}>
            {[['Directus', 'data.designflow.app', 'Backend data store & API', true], ['Microsoft Outlook', 'graph.microsoft.com', 'Email ingest every 15 minutes', true], ['Fireflies.ai', 'crm-fireflies.designflow.app', 'Meeting-notes webhook', true]].map(([n, host, desc, ok]) => (
              <div key={n} className="card">
                <div className="aitem" style={{ padding: '14px 16px', borderBottom: 'none' }}>
                  <span className="field-ico" style={{ background: 'linear-gradient(150deg, oklch(0.6 0.15 200), oklch(0.48 0.15 200))' }}><Icon name="link" /></span>
                  <div className="ai-main"><div className="ai-pri">{n}</div><div className="ai-sec">{desc} · <span className="mono">{host}</span></div></div>
                  <Chip tone={ok ? 'success' : 'danger'} dot>{ok ? 'Connected' : 'Error'}</Chip>
                </div>
              </div>
            ))}
            <p className="muted" style={{ fontSize: 11.5, paddingLeft: 2 }}>Credentials are managed server-side and never exposed in the browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GenericPage({ title, sub, icon }) {
  return (
    <div className="page">
      <PageHead title={title} sub={sub} />
      <div className="page-body"><div className="card"><div className="empty" style={{ padding: 64 }}><Icon name={icon} />This screen follows the same dense table + inspector pattern.<br />See Overview, Email Routing, Pipeline, Accounts and Contacts for the full treatment.</div></div></div>
    </div>
  );
}

Object.assign(window, { OverviewPage, EmailPage, PipelinePage, AccountsPage, ContactsPage, MeetingsPage, NotesPage, TasksPage, ApprovalsPage, SettingsPage, GenericPage });
