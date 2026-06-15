/* ============================================================================
   POP CRM — app shell, tweaks & mount
   ========================================================================== */
const { useState: useApp, useEffect: useFx } = React;

const NAV = [
  { sec: 'Operate', items: [
    { id: 'overview', label: 'Overview', icon: 'dashboard', color: 'oklch(0.60 0.17 255)' },
    { id: 'pipeline', label: 'Pipeline', icon: 'pipeline', color: 'oklch(0.62 0.17 300)' },
    { id: 'email', label: 'Email Routing', icon: 'mail', badge: 6, color: 'oklch(0.62 0.16 25)' },
  ]},
  { sec: 'Records', items: [
    { id: 'accounts', label: 'Accounts', icon: 'building', color: 'oklch(0.60 0.15 200)' },
    { id: 'contacts', label: 'Contacts', icon: 'contact', color: 'oklch(0.62 0.15 165)' },
    { id: 'meetings', label: 'Meetings', icon: 'calendar', color: 'oklch(0.66 0.15 60)' },
  ]},
  { sec: 'Workflow', items: [
    { id: 'notes', label: 'Notes', icon: 'notes', badge: 0, color: 'oklch(0.64 0.15 130)' },
    { id: 'tasks', label: 'Tasks', icon: 'tasks', badge: 5, muted: true, color: 'oklch(0.64 0.16 95)' },
    { id: 'approvals', label: 'Approvals', icon: 'shield', badge: 4, muted: true, color: 'oklch(0.60 0.16 340)' },
    { id: 'settings', label: 'Settings', icon: 'settings', color: 'oklch(0.55 0.02 256)' },
  ]},
];

function Sidebar({ route, go, collapsed }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><Icon name="route" style={{ width: 16, height: 16 }} /></div>
        <div className="brand-text"><b>POP CRM</b><span>Customer Operations</span></div>
      </div>
      <nav className="nav">
        {NAV.map(group => (
          <div key={group.sec}>
            <div className="nav-section-label">{group.sec}</div>
            {group.items.map(it => (
              <button key={it.id} className={`nav-item ${route === it.id ? 'active' : ''}`} onClick={() => go(it.id)} title={it.label}>
                <span className="nav-ico" style={{ background: `linear-gradient(150deg, ${it.color}, color-mix(in oklch, ${it.color} 72%, black))` }}><Icon name={it.icon} /></span>
                <span className="nav-label">{it.label}</span>
                {it.badge ? <span className={`nav-badge ${it.muted ? 'muted' : ''}`}>{it.badge}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="health-dot ok" />
        <div className="sidebar-foot-text"><b>All systems normal</b>Directus · data.designflow.app</div>
      </div>
    </aside>
  );
}

function Topbar({ dark, setDark }) {
  return (
    <header className="topbar">
      <button className="icon-btn" style={{ marginLeft: -4 }}><Icon name="menu" /></button>
      <div className="searchbar">
        <Icon name="search" />
        <span style={{ flex: 1 }}>Search accounts, contacts, programs…</span>
        <span className="kbd">⌘K</span>
      </div>
      <span className="spacer" />
      <div className="topbar-meta">
        <span className="mono">#a1vb55b</span>
        <span>Jun 11, 2026 · 9:42 AM EDT</span>
      </div>
      <button className="icon-btn bordered" onClick={() => setDark(d => !d)} title="Toggle theme"><Icon name={dark ? 'sun' : 'moon'} /></button>
      <button className="icon-btn bordered" title="Refresh data"><Icon name="refresh" /></button>
      <button className="icon-btn" title="Notifications"><Icon name="bell" /></button>
      <Avatar name="Erin Walsh" />
    </header>
  );
}

function Tweaks({ dark, setDark, density, setDensity }) {
  const [open, setOpen] = useApp(false);
  return (
    <div className="tweaks">
      {open && (
        <div className="card" style={{ width: 230, marginBottom: 10, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <div className="card-head"><h3>Tweaks</h3><button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setOpen(false)}><Icon name="x" /></button></div>
          <div className="card-pad col" style={{ gap: 14 }}>
            <div>
              <div className="field-label">Theme</div>
              <div className="segmented" style={{ width: '100%' }}>
                <button className={`seg ${!dark ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDark(false)}><Icon name="sun" style={{ width: 14, height: 14 }} />Light</button>
                <button className={`seg ${dark ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDark(true)}><Icon name="moon" style={{ width: 14, height: 14 }} />Dark</button>
              </div>
            </div>
            <div>
              <div className="field-label">Table density</div>
              <div className="segmented" style={{ width: '100%' }}>
                <button className={`seg ${density === 'comfortable' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDensity('comfortable')}>Comfortable</button>
                <button className={`seg ${density === 'compact' ? 'active' : ''}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDensity('compact')}>Compact</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <button className="btn primary" style={{ borderRadius: 99, boxShadow: 'var(--shadow-md)', height: 40 }} onClick={() => setOpen(o => !o)}>
        <Icon name="settings" />Tweaks
      </button>
    </div>
  );
}

function App() {
  const [route, setRoute] = useApp(() => localStorage.getItem('popcrm_route') || 'overview');
  const [dark, setDark] = useApp(() => localStorage.getItem('popcrm_dark') === '1');
  const [density, setDensity] = useApp(() => localStorage.getItem('popcrm_density') || 'comfortable');

  useFx(() => { localStorage.setItem('popcrm_route', route); }, [route]);
  useFx(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('popcrm_dark', dark ? '1' : '0');
  }, [dark]);
  useFx(() => { localStorage.setItem('popcrm_density', density); }, [density]);

  const go = setRoute;
  const screens = {
    overview: <OverviewPage go={go} />,
    pipeline: <PipelinePage />,
    email: <EmailPage />,
    accounts: <AccountsPage />,
    contacts: <ContactsPage />,
    meetings: <MeetingsPage />,
    notes: <NotesPage />,
    tasks: <TasksPage />,
    approvals: <ApprovalsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className={`app ${density === 'compact' ? 'density-compact' : ''}`}>
      <Sidebar route={route} go={go} />
      <div className="main">
        <Topbar dark={dark} setDark={setDark} />
        {screens[route]}
      </div>
      <Tweaks dark={dark} setDark={setDark} density={density} setDensity={setDensity} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
