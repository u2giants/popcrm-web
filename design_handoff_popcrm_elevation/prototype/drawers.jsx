/* ============================================================================
   POP CRM — domain detail drawers (inspector panels)
   ========================================================================== */
const { useState: useStateD } = React;

function OpportunityDrawer({ opp, onClose }) {
  if (!opp) return null;
  const relEmails = window.CRM.emails.filter(e => e.retailer === opp.retailer).length;
  const relTasks = window.CRM.tasks.filter(t => t.opp === opp.id);
  return (
    <Drawer open={!!opp} onClose={onClose}>
      <DrawerHead
        title={opp.name}
        sub={`${retailerName(opp.retailer)}${deptName(opp.dept) ? ' · ' + deptName(opp.dept) : ''}`}
        badge={<><StageChip stage={opp.stage} /><Chip tone="outline">{opp.licensor}</Chip></>}
        onClose={onClose}
      />
      <div className="drawer-body">
        {opp.ai && (
          <div className="ai-box">
            <div className="ai-head"><Icon name="sparkles" />AI program summary</div>
            <p>{opp.summary}</p>
          </div>
        )}
        <Section icon="tag" title="Program details">
          <DL items={[
            ['Stage', <StageChip stage={opp.stage} />],
            ['Account', retailerName(opp.retailer)],
            ['Department', deptName(opp.dept) || '—'],
            ['Licensor', opp.licensor],
            ['Season', opp.season],
            ['Est. value', <span className="amount">{money(opp.amount)}</span>],
            ['Close date', fmtDate(opp.close_date)],
            opp.po && ['Production PO', <span className="mono">{opp.po}</span>],
            opp.so && ['Sales order', <span className="mono">{opp.so}</span>],
          ]} />
        </Section>
        <Section icon="route" title="Move stage">
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {window.CRM.stages.map(s => (
              <button key={s} className={`stage-chip stage-${s}`} style={{ cursor: 'pointer', opacity: s === opp.stage ? 1 : 0.45, outline: s === opp.stage ? '2px solid var(--ring)' : 'none', outlineOffset: 1 }}>
                {label(s)}
              </button>
            ))}
          </div>
        </Section>
        <Section icon="link" title="Related" action={<span className="muted" style={{ fontSize: 11 }}>{relEmails} emails · {relTasks.length} tasks</span>}>
          <div className="tbl-wrap">
            {relTasks.length ? relTasks.map(t => (
              <button key={t.id} className="aitem">
                <span className={`kpi-ico`} style={{ width: 24, height: 24 }}><Icon name="tasks" /></span>
                <div className="ai-main"><div className="ai-pri truncate">{t.title}</div><div className="ai-sec">Due {fmtDate(t.due)}</div></div>
                <Chip tone={TASK_TONE[t.status]} dot>{label(t.status)}</Chip>
              </button>
            )) : <div className="empty" style={{ padding: 22 }}>No linked tasks.</div>}
          </div>
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="check" />Save changes</button>
      </div>
    </Drawer>
  );
}

function EmailDrawer({ email, onClose }) {
  const [status, setStatus] = useStateD(email?.status);
  React.useEffect(() => { setStatus(email?.status); }, [email]);
  if (!email) return null;
  return (
    <Drawer open={!!email} onClose={onClose}>
      <DrawerHead
        title={email.subject}
        sub={`From ${email.sender} · ${fmtDateTime(email.received)}`}
        badge={<Chip tone={ROUTING_TONE[email.status] || 'warning'} dot>{label(email.status)}</Chip>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <Section icon="mail" title="Message">
          <div className="card card-pad" style={{ background: 'var(--muted)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--card-foreground)' }}>
            {email.preview}
          </div>
        </Section>
        <Section icon="route" title="Manual routing">
          <div className="col" style={{ gap: 11 }}>
            <div>
              <div className="field-label">Routing status</div>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
                {['UNROUTED', 'COMPANY_ONLY', 'COMPANY_DEPT', 'ROUTED', 'SKIPPED'].map(s => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            <div>
              <div className="field-label">Account</div>
              <select className="select" defaultValue={email.retailer || ''} style={{ width: '100%' }}>
                <option value="">— Select account —</option>
                {window.CRM.retailers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <div className="field-label">Department</div>
              <select className="select" defaultValue={email.dept || ''} style={{ width: '100%' }}>
                <option value="">— Optional —</option>
                {window.CRM.depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <div className="field-label">Opportunity</div>
              <select className="select" defaultValue="" style={{ width: '100%' }}>
                <option value="">— Link a program —</option>
                {window.CRM.opps.filter(o => o.retailer === email.retailer).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
        </Section>
        <Section icon="filter" title="Routing method">
          <DL items={[['Detected by', label(email.method)], ['Confidence', <span className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><div className="progress" style={{ width: 70 }}><i style={{ width: '82%' }} /></div>82%</span>]]} />
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn ghost"><Icon name="filter" />Create ignore rule</button>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary"><Icon name="check" />Apply routing</button>
      </div>
    </Drawer>
  );
}

function AccountDrawer({ account, onClose }) {
  if (!account) return null;
  const contacts = window.CRM.buyers.filter(b => b.retailer === account.id);
  const programs = window.CRM.opps.filter(o => o.retailer === account.id);
  return (
    <Drawer open={!!account} onClose={onClose}>
      <DrawerHead
        title={account.name}
        sub={account.domain}
        badge={<><Chip tone={STATUS_TONE[account.customer_status]} dot>{label(account.customer_status)}</Chip><Chip tone="outline">{label(account.chain_type)}</Chip></>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <div className="grid-2" style={{ gap: 10 }}>
          <div className="card card-pad"><div className="kpi-label">YTD revenue</div><div style={{ fontSize: 21, fontWeight: 680, letterSpacing: '-0.02em', marginTop: 4 }}>{money(account.ytd)}</div></div>
          <div className="card card-pad"><div className="kpi-label">Open programs</div><div style={{ fontSize: 21, fontWeight: 680, letterSpacing: '-0.02em', marginTop: 4 }}>{account.programs}</div></div>
        </div>
        <Section icon="building" title="Account">
          <DL items={[
            ['Domain', account.domain],
            ['Status', <Chip tone={STATUS_TONE[account.customer_status]} dot>{label(account.customer_status)}</Chip>],
            ['Chain type', label(account.chain_type)],
            ['Routing aliases', <span className="mono" style={{ fontSize: 11 }}>{account.aliases}</span>],
            ['Contacts', account.contacts],
          ]} />
        </Section>
        <Section icon="contact" title="Contacts" action={<span className="muted" style={{ fontSize: 11 }}>{contacts.length} shown</span>}>
          <div className="tbl-wrap">
            {contacts.map(b => (
              <div key={b.id} className="aitem">
                <Avatar name={`${b.first} ${b.last}`} size="sm" />
                <div className="ai-main"><div className="ai-pri">{b.first} {b.last}</div><div className="ai-sec truncate">{b.title}</div></div>
              </div>
            ))}
          </div>
        </Section>
        <Section icon="pipeline" title="Programs">
          <div className="tbl-wrap">
            {programs.map(o => (
              <div key={o.id} className="aitem">
                <div className="ai-main"><div className="ai-pri truncate">{o.name}</div><div className="ai-sec">{money(o.amount)} · {o.season}</div></div>
                <StageChip stage={o.stage} />
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="arrowUpRight" />Open account</button>
      </div>
    </Drawer>
  );
}

function ContactDrawer({ contact, onClose }) {
  if (!contact) return null;
  return (
    <Drawer open={!!contact} onClose={onClose}>
      <DrawerHead
        title={`${contact.first} ${contact.last}`}
        sub={contact.title}
        badge={<><Chip tone="info">{label(contact.type)}</Chip><Chip tone="outline">{label(contact.scope)}</Chip></>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <Section icon="user" title="Contact">
          <DL items={[
            ['Email', <a className="link" href="#">{contact.email}</a>],
            ['Title', contact.title],
            ['Account', retailerName(contact.retailer)],
            ['Department', deptName(contact.dept) || '—'],
            ['Type', label(contact.type)],
            ['Scope', label(contact.scope)],
          ]} />
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="mail" />Compose</button>
      </div>
    </Drawer>
  );
}

Object.assign(window, { OpportunityDrawer, EmailDrawer, AccountDrawer, ContactDrawer });

function MeetingDrawer({ meeting, onClose }) {
  if (!meeting) return null;
  const actions = (meeting.actions || '').split(';').map(s => s.trim()).filter(Boolean);
  return (
    <Drawer open={!!meeting} onClose={onClose}>
      <DrawerHead
        title={meeting.name}
        sub={`${fmtDate(meeting.date)} · ${retailerName(meeting.retailer)}`}
        badge={<><Chip tone={meeting.source === 'FIREFLIES' ? 'info' : 'neutral'} dot>{label(meeting.source)}</Chip></>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <div className="ai-box">
          <div className="ai-head"><Icon name="sparkles" />AI meeting summary</div>
          <p>{meeting.summary}</p>
        </div>
        <Section icon="check" title="Action items">
          <div className="tbl-wrap">
            {actions.map((a, i) => (
              <div key={i} className="aitem">
                <span className="colmenu-check" style={{ borderColor: 'var(--border-strong)' }} />
                <div className="ai-main"><div className="ai-pri" style={{ fontWeight: 500 }}>{a}</div></div>
              </div>
            ))}
          </div>
        </Section>
        <Section icon="user" title="Participants">
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {meeting.participants.split(',').map((p, i) => (
              <span key={i} className="chip neutral" style={{ paddingLeft: 4 }}><Avatar name={p.trim()} size="xs" hue={(p.charCodeAt(2) * 11) % 360} />{p.trim()}</span>
            ))}
          </div>
        </Section>
        <Section icon="link" title="Linked records">
          <DL items={[
            ['Account', retailerName(meeting.retailer)],
            ['Contact', buyerName(meeting.contact)],
            ['Source', label(meeting.source)],
            meeting.source === 'FIREFLIES' && ['Transcript', <span className="mono" style={{ fontSize: 11 }}>ff_{meeting.id}_x82</span>],
          ]} />
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="tasks" />Create task</button>
      </div>
    </Drawer>
  );
}

function NoteDrawer({ note, onClose }) {
  if (!note) return null;
  return (
    <Drawer open={!!note} onClose={onClose}>
      <DrawerHead
        title={note.title}
        sub={`${fmtDate(note.date)} · ${label(note.source)}`}
        badge={<Chip tone="neutral" dot>{label(note.source)}</Chip>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <Section icon="notes" title="Note">
          <div className="card card-pad" style={{ background: 'var(--muted)', fontSize: 12.5, lineHeight: 1.55 }}>{note.body}</div>
        </Section>
        <Section icon="link" title="Linked records">
          <DL items={[
            ['Account', note.retailer ? retailerName(note.retailer) : '—'],
            ['Program', note.opp ? (oppById(note.opp)?.name || '—') : '—'],
            ['Source', label(note.source)],
          ]} />
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn ghost"><Icon name="x" />Delete</button>
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="check" />Save</button>
      </div>
    </Drawer>
  );
}

function TaskDrawer({ task, onClose }) {
  const [status, setStatus] = useStateD(task?.status);
  React.useEffect(() => { setStatus(task?.status); }, [task]);
  if (!task) return null;
  const opp = oppById(task.opp);
  return (
    <Drawer open={!!task} onClose={onClose}>
      <DrawerHead
        title={task.title}
        sub={opp ? opp.name : '—'}
        badge={<Chip tone={TASK_TONE[task.status]} dot>{label(task.status)}</Chip>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <Section icon="tasks" title="Task">
          <div className="col" style={{ gap: 11 }}>
            <div>
              <div className="field-label">Status</div>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
                {['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED'].map(s => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            <DL items={[
              ['Due date', fmtDate(task.due)],
              ['Assignee', <span className="row" style={{ justifyContent: 'flex-end', gap: 6 }}><Avatar name={teamById(task.assignee)?.name || '—'} size="xs" hue={200} />{teamById(task.assignee)?.name || '—'}</span>],
              ['Program', opp ? opp.name : '—'],
              opp && ['Account', retailerName(opp.retailer)],
            ]} />
          </div>
        </Section>
        <Section icon="notes" title="Details">
          <div className="card card-pad" style={{ background: 'var(--muted)', fontSize: 12.5, lineHeight: 1.55 }}>
            {task.body || 'Follow up with the buyer and update the program record once complete.'}
          </div>
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="check" />Save task</button>
      </div>
    </Drawer>
  );
}

function ApprovalDrawer({ approval, onClose }) {
  if (!approval) return null;
  const opp = oppById(approval.opp);
  return (
    <Drawer open={!!approval} onClose={onClose}>
      <DrawerHead
        title={approval.name}
        sub={`${approval.licensor} · submitted ${fmtDate(approval.submitted)}`}
        badge={<Chip tone={APPROVAL_TONE[approval.status]} dot>{label(approval.status)}</Chip>}
        onClose={onClose}
      />
      <div className="drawer-body">
        <Section icon="shield" title="Approval">
          <DL items={[
            ['Status', <Chip tone={APPROVAL_TONE[approval.status]} dot>{label(approval.status)}</Chip>],
            ['Licensor', approval.licensor],
            ['Submitted', fmtDate(approval.submitted)],
            ['Program', opp ? opp.name : '—'],
            opp && ['Account', retailerName(opp.retailer)],
          ]} />
        </Section>
        <Section icon="notes" title="Latest comment">
          <div className="card card-pad" style={{ background: 'var(--muted)', fontSize: 12.5, lineHeight: 1.55 }}>{approval.comment}</div>
        </Section>
        <Section icon="route" title="Update status">
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {['PENDING', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED'].map(s => (
              <button key={s} className={`chip ${APPROVAL_TONE[s]}`} style={{ cursor: 'pointer', opacity: s === approval.status ? 1 : 0.45, outline: s === approval.status ? '2px solid var(--ring)' : 'none', outlineOffset: 1 }}>{label(s)}</button>
            ))}
          </div>
        </Section>
      </div>
      <div className="drawer-foot">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary"><Icon name="check" />Save</button>
      </div>
    </Drawer>
  );
}

Object.assign(window, { MeetingDrawer, NoteDrawer, TaskDrawer, ApprovalDrawer });
