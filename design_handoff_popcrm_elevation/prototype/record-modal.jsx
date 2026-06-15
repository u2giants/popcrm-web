/* ============================================================================
   POP CRM — Record modal (two-pane: details · activity)
   Opens when a pipeline card is clicked. Structure inspired by full-page task
   views: properties + fields on the left, activity/comments on the right.
   ========================================================================== */
const { useEffect: useRmFx } = React;

function RecordModal({ opp, onClose }) {
  useRmFx(() => {
    function k(e) { if (e.key === 'Escape') onClose(); }
    if (opp) window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [opp, onClose]);
  if (!opp) return null;

  const acct = window.CRM.retailers.find(r => r.id === opp.retailer);
  const dept = deptName(opp.dept);
  const relTasks = window.CRM.tasks.filter(t => t.opp === opp.id);

  const fields = [
    { ic: 'user', c: 'oklch(0.60 0.17 255)', name: 'Buyer', val: acct ? buyerName(window.CRM.buyers.find(b => b.retailer === opp.retailer)?.id) : '—' },
    { ic: 'calendar', c: 'oklch(0.62 0.17 300)', name: 'Licensor due date', val: fmtDate(opp.close_date) },
    { ic: 'factory', c: 'oklch(0.66 0.15 60)', name: 'Factory', val: 'Edge Manufacturing — Ningbo' },
    { ic: 'tag', c: 'oklch(0.64 0.15 130)', name: 'Category', val: opp.name.includes('Plush') ? 'Plush' : opp.name.includes('Gift') ? 'Gifting' : 'Seasonal' },
    { ic: 'building', c: 'oklch(0.60 0.15 200)', name: 'Customer / Retailer', val: retailerName(opp.retailer) },
    { ic: 'clock', c: 'oklch(0.62 0.16 25)', name: 'Date factory selected', val: '—', empty: true },
    { ic: 'shield', c: 'oklch(0.60 0.16 340)', name: 'Licensor', val: opp.licensor },
    { ic: 'dollar', c: 'oklch(0.64 0.16 152)', name: 'Est. program value', val: money(opp.amount) },
  ];

  return (
    <div className="rec-scrim" onClick={onClose}>
      <div className="rec-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="rec-topbar">
          <button className="icon-btn" style={{ width: 28, height: 28 }} title="Back"><Icon name="chevDown" style={{ transform: 'rotate(90deg)' }} /></button>
          <div className="rec-crumb">
            <span className="seg"><span className="avatar xs" style={{ width: 16, height: 16, fontSize: 8, borderRadius: 4 }}>P</span>POP Creations</span>
            <Icon name="chevRight" />
            <span className="seg"><Icon name="pipeline" style={{ opacity: 1, color: 'oklch(0.62 0.17 300)' }} />Pipeline</span>
            <Icon name="chevRight" />
            <span className="seg"><b>{label(opp.stage)}</b></span>
          </div>
          <span className="spacer" />
          <button className="btn sm ghost"><Icon name="sparkles" />Ask AI</button>
          <button className="btn sm ghost"><Icon name="link" />Share</button>
          <button className="icon-btn" style={{ width: 28, height: 28 }}><Icon name="expand" /></button>
          <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={onClose} title="Close"><Icon name="x" /></button>
        </div>

        <div className="rec-grid">
          {/* LEFT — details */}
          <div className="rec-main">
            <div className="rec-typebar">
              <span className="rec-typechip"><span className="tk" style={{ background: 'oklch(0.62 0.17 300)' }} />Program</span>
              <span className="muted" style={{ fontSize: 12 }}><Icon name="paperclip" style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> 3 files</span>
            </div>
            <h1 className="rec-title">{opp.name}</h1>

            <div className="rec-aistrip">
              <Icon name="sparkles" />
              <span><b>Ask AI</b> to draft the buyer follow-up, summarize the thread, or generate sampling subtasks</span>
            </div>

            <div className="rec-props">
              <PropRow icon="trend" label="Status">
                <span className={`stage-chip stage-${opp.stage}`}>{label(opp.stage)}</span>
              </PropRow>
              <PropRow icon="user" label="Owner">
                <Avatar name="Erin Walsh" size="xs" hue={255} /><span>Erin Walsh</span>
              </PropRow>
              <PropRow icon="calendar" label="Close date">{fmtDate(opp.close_date)}</PropRow>
              <PropRow icon="flag" label="Priority">
                <span className="chip warning" style={{ paddingLeft: 6 }}><Icon name="flag" style={{ width: 11, height: 11 }} />High</span>
              </PropRow>
              <PropRow icon="building" label="Account"><span className="truncate">{retailerName(opp.retailer)}</span></PropRow>
              <PropRow icon="dollar" label="Est. value"><span className="amount">{money(opp.amount)}</span></PropRow>
              <PropRow icon="tag" label="Season">{opp.season}</PropRow>
              <PropRow icon="shield" label="Licensor"><Chip tone="outline">{opp.licensor}</Chip></PropRow>
            </div>

            <div className="rec-section">
              <div className="rec-section-head"><span className="tt">Description</span></div>
              <p className="rec-desc">
                {opp.summary} Picks saved to <span className="mono">\\edgesynology1\\Sales Sheets\\{opp.season}</span>.
                {opp.po ? <> Production PO <span className="mono">{opp.po}</span>.</> : null}
                {opp.so ? <> Sales order <span className="mono">{opp.so}</span>.</> : null}
              </p>
            </div>

            <div className="rec-section">
              <div className="rec-section-head">
                <span className="tt">Fields</span>
                <span className="acts">
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="search" style={{ width: 14, height: 14 }} /></button>
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="expand" style={{ width: 14, height: 14 }} /></button>
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="plus" style={{ width: 14, height: 14 }} /></button>
                </span>
              </div>
              {fields.map(f => (
                <div className="field-row" key={f.name}>
                  <span className="field-ico" style={{ background: `linear-gradient(150deg, ${f.c}, color-mix(in oklch, ${f.c} 72%, black))` }}><Icon name={f.ic} /></span>
                  <span className="field-name">{f.name}</span>
                  <span className={`field-val ${f.empty ? 'empty' : ''}`}>{f.val}</span>
                </div>
              ))}
            </div>

            <div className="rec-section">
              <div className="rec-section-head"><span className="tt">Move stage</span></div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {window.CRM.stages.map(st => (
                  <button key={st} className={`stage-chip stage-${st}`} style={{ cursor: 'pointer', opacity: st === opp.stage ? 1 : 0.4, outline: st === opp.stage ? '2px solid var(--ring)' : 'none', outlineOffset: 1 }}>{label(st)}</button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — activity */}
          <div className="rec-side">
            <div className="rec-side-head">
              <span className="tt">Activity</span>
              <span className="spacer" />
              <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="search" style={{ width: 14, height: 14 }} /></button>
              <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="filter" style={{ width: 14, height: 14 }} /></button>
            </div>
            <div className="rec-feed">
              <div className="feed-event"><Icon name="plus" style={{ width: 13, height: 13 }} /><span><b>Erin Walsh</b> created this program · Apr 15</span></div>
              <div className="feed-event"><Icon name="trend" style={{ width: 13, height: 13 }} /><span>Stage → <b>{label(opp.stage)}</b> · May 2</span></div>
              {opp.ai && <div className="feed-event"><Icon name="sparkles" style={{ width: 13, height: 13, color: 'var(--chart-5)' }} /><span>AI summary refreshed · Jun 3</span></div>}
              <div className="comment">
                <Avatar name="Martina Cardoso" size="sm" hue={300} />
                <div className="body">
                  <div className="meta"><b>Martina Cardoso</b><span>Jun 3 · 11:02 am</span></div>
                  <div className="txt">Buyer confirmed the 6-SKU scope. Holding on licensor art before we cut samples — flagged to {opp.licensor}.</div>
                  <div className="attach"><span className="ext">PDF</span>{opp.name.split(' ').slice(0, 2).join('_')}_PICKS.pdf</div>
                </div>
              </div>
              <div className="comment">
                <Avatar name="Nate Fischer" size="sm" hue={200} />
                <div className="body">
                  <div className="meta"><b>Nate Fischer</b><span>Jun 8 · 9:21 am</span></div>
                  <div className="txt">Costing locked at two price points. Hard delivery still tied to the {opp.season} floor-set window.</div>
                </div>
              </div>
            </div>
            <div className="rec-composer">
              <div className="box">
                <div className="ph">Write a comment…</div>
                <div className="tools">
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="paperclip" style={{ width: 14, height: 14 }} /></button>
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="at" style={{ width: 14, height: 14 }} /></button>
                  <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="sparkles" style={{ width: 14, height: 14 }} /></button>
                  <span className="send"><Icon name="send" /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropRow({ icon, label, children }) {
  return (
    <div className="prop-row">
      <span className="prop-label"><Icon name={icon} />{label}</span>
      <span className="prop-val">{children}</span>
    </div>
  );
}

window.RecordModal = RecordModal;
