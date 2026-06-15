/* ============================================================================
   POP CRM — realistic mock data
   POP Creations supplies licensed consumer products (plush, toys, gifting,
   seasonal, home) to major retailers. Data mirrors the Directus collections
   in src/lib/types.ts.
   ========================================================================== */
(function () {
  const RETAILERS = [
    { id: 'r1', name: 'Walmart', domain: 'walmart.com', customer_status: 'ACTIVE', chain_type: 'MASS', aliases: 'walmart.com, wal-mart', contacts: 42, programs: 31, ytd: 4.82 },
    { id: 'r2', name: 'Target', domain: 'target.com', customer_status: 'ACTIVE', chain_type: 'MASS', aliases: 'target.com, tgt', contacts: 38, programs: 27, ytd: 3.41 },
    { id: 'r3', name: 'Costco Wholesale', domain: 'costco.com', customer_status: 'ACTIVE', chain_type: 'CLUB', aliases: 'costco.com', contacts: 19, programs: 14, ytd: 2.96 },
    { id: 'r4', name: "Kohl's", domain: 'kohls.com', customer_status: 'ACTIVE', chain_type: 'DEPARTMENT', aliases: 'kohls.com', contacts: 24, programs: 12, ytd: 1.27 },
    { id: 'r5', name: 'Five Below', domain: 'fivebelow.com', customer_status: 'ACTIVE', chain_type: 'VALUE', aliases: 'fivebelow.com', contacts: 16, programs: 18, ytd: 1.88 },
    { id: 'r6', name: 'Macy\u2019s', domain: 'macys.com', customer_status: 'ACTIVE', chain_type: 'DEPARTMENT', aliases: 'macys.com', contacts: 21, programs: 9, ytd: 0.94 },
    { id: 'r7', name: 'Kroger', domain: 'kroger.com', customer_status: 'ACTIVE', chain_type: 'GROCERY', aliases: 'kroger.com, fred meyer', contacts: 13, programs: 7, ytd: 0.71 },
    { id: 'r8', name: 'Sam\u2019s Club', domain: 'samsclub.com', customer_status: 'ACTIVE', chain_type: 'CLUB', aliases: 'samsclub.com', contacts: 11, programs: 8, ytd: 1.44 },
    { id: 'r9', name: 'CVS Pharmacy', domain: 'cvs.com', customer_status: 'PROSPECT', chain_type: 'DRUG', aliases: 'cvs.com', contacts: 7, programs: 3, ytd: 0.22 },
    { id: 'r10', name: 'Hobby Lobby', domain: 'hobbylobby.com', customer_status: 'ACTIVE', chain_type: 'SPECIALTY', aliases: 'hobbylobby.com', contacts: 9, programs: 6, ytd: 0.58 },
    { id: 'r11', name: 'Party City', domain: 'partycity.com', customer_status: 'AT_RISK', chain_type: 'SPECIALTY', aliases: 'partycity.com', contacts: 8, programs: 4, ytd: 0.31 },
    { id: 'r12', name: 'Meijer', domain: 'meijer.com', customer_status: 'ACTIVE', chain_type: 'GROCERY', aliases: 'meijer.com', contacts: 10, programs: 5, ytd: 0.49 },
  ];

  const DEPTS = [
    { id: 'd1', name: 'Seasonal & Holiday', division: 'Seasonal', retailer: 'r1' },
    { id: 'd2', name: 'Toys', division: 'Toys', retailer: 'r1' },
    { id: 'd3', name: 'Plush', division: 'Toys', retailer: 'r2' },
    { id: 'd4', name: 'Gifting & Novelty', division: 'Gifting', retailer: 'r2' },
    { id: 'd5', name: 'Home & Décor', division: 'Home', retailer: 'r3' },
    { id: 'd6', name: 'Impulse / Front-End', division: 'Impulse', retailer: 'r5' },
    { id: 'd7', name: 'Licensed Apparel', division: 'Apparel', retailer: 'r4' },
  ];

  const LICENSORS = ['Disney', 'Marvel', 'Warner Bros.', 'NFL Properties', 'NBA', 'Sanrio', 'Pokémon Co.', 'Nickelodeon', 'Peanuts Worldwide', 'Universal'];

  const BUYERS = [
    { id: 'b1', first: 'Danielle', last: 'Reyes', title: 'Senior Buyer, Seasonal', email: 'danielle.reyes@walmart.com', retailer: 'r1', dept: 'd1', type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b2', first: 'Marcus', last: 'Cohen', title: 'DMM, Toys', email: 'marcus.cohen@walmart.com', retailer: 'r1', dept: 'd2', type: 'DMM', scope: 'DIVISION' },
    { id: 'b3', first: 'Priya', last: 'Anand', title: 'Buyer, Plush', email: 'priya.anand@target.com', retailer: 'r2', dept: 'd3', type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b4', first: 'Tom', last: 'Whitfield', title: 'Category Manager, Gifting', email: 'tom.whitfield@target.com', retailer: 'r2', dept: 'd4', type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b5', first: 'Angela', last: 'Brooks', title: 'Senior Buyer, Home', email: 'angela.brooks@costco.com', retailer: 'r3', dept: 'd5', type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b6', first: 'Derek', last: 'Yamamoto', title: 'Assistant Buyer', email: 'derek.y@fivebelow.com', retailer: 'r5', dept: 'd6', type: 'ASSISTANT', scope: 'CATEGORY' },
    { id: 'b7', first: 'Sandra', last: 'Liu', title: 'Buyer, Licensed Apparel', email: 'sandra.liu@kohls.com', retailer: 'r4', dept: 'd7', type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b8', first: 'James', last: 'Okafor', title: 'Replenishment Buyer', email: 'james.okafor@kroger.com', retailer: 'r7', dept: null, type: 'BUYER', scope: 'CATEGORY' },
    { id: 'b9', first: 'Rachel', last: 'Stein', title: 'VP Merchandising', email: 'rachel.stein@macys.com', retailer: 'r6', dept: null, type: 'EXEC', scope: 'DIVISION' },
    { id: 'b10', first: 'Carlos', last: 'Mendez', title: 'Buyer, Seasonal', email: 'carlos.mendez@samsclub.com', retailer: 'r8', dept: null, type: 'BUYER', scope: 'CATEGORY' },
  ];

  const TEAM = [
    { id: 'u1', name: 'Erin Walsh', email: 'erin.walsh@popcreations.com' },
    { id: 'u2', name: 'Nate Fischer', email: 'nate.fischer@popcreations.com' },
    { id: 'u3', name: 'Lena Park', email: 'lena.park@popcreations.com' },
  ];

  const STAGES = ['DIRECTIVE_RECEIVED', 'DESIGN_IN_PROGRESS', 'BUYER_REVIEW', 'PRICING_AND_SAMPLING', 'AWAITING_SALES_ORDER', 'IN_PRODUCTION', 'SHIPPED', 'CLOSED'];

  const oppNames = [
    ['Halloween 2026 Plush Assortment', 'r2', 'd3', 'Disney', 'Fall 2026', 1.24, 'IN_PRODUCTION', 'PO-44821', 'SO-90112'],
    ['Holiday 2026 Light-Up Décor Program', 'r1', 'd1', 'Disney', 'Holiday 2026', 2.10, 'PRICING_AND_SAMPLING', 'PO-44903', null],
    ['Marvel Avengers Gifting Set — Q3', 'r2', 'd4', 'Marvel', 'Fall 2026', 0.86, 'BUYER_REVIEW', null, null],
    ['NFL Team Plush Refresh', 'r1', 'd2', 'NFL Properties', 'Fall 2026', 1.55, 'DESIGN_IN_PROGRESS', null, null],
    ['Pokémon Mystery Box Front-End', 'r5', 'd6', 'Pokémon Co.', 'Spring 2026', 0.92, 'IN_PRODUCTION', 'PO-44510', 'SO-89740'],
    ['Sanrio Hello Kitty Home Capsule', 'r3', 'd5', 'Sanrio', 'Spring 2026', 1.38, 'AWAITING_SALES_ORDER', null, 'SO-90233'],
    ['Peanuts Holiday Snow Globe Line', 'r6', null, 'Peanuts Worldwide', 'Holiday 2026', 0.44, 'DIRECTIVE_RECEIVED', null, null],
    ['Warner Looney Tunes Plush — Club', 'r3', 'd5', 'Warner Bros.', 'Fall 2026', 1.90, 'SHIPPED', 'PO-44190', 'SO-89102'],
    ['NBA Mascot Bobble Program', 'r4', 'd7', 'NBA', 'Winter 2026', 0.37, 'BUYER_REVIEW', null, null],
    ['Nickelodeon SpongeBob Novelty', 'r5', 'd6', 'Nickelodeon', 'Spring 2026', 0.61, 'DESIGN_IN_PROGRESS', null, null],
    ['Universal Jurassic Plush Wave 2', 'r1', 'd2', 'Universal', 'Summer 2026', 1.12, 'PRICING_AND_SAMPLING', 'PO-45002', null],
    ['Disney Princess Gifting Tower', 'r2', 'd4', 'Disney', 'Holiday 2026', 1.74, 'DIRECTIVE_RECEIVED', null, null],
    ['Marvel Spidey Light-Up Plush', 'r8', null, 'Marvel', 'Fall 2026', 0.79, 'IN_PRODUCTION', 'PO-44777', 'SO-90004'],
    ['NFL Gameday Tailgate Set', 'r12', null, 'NFL Properties', 'Fall 2026', 0.53, 'AWAITING_SALES_ORDER', null, 'SO-90341'],
    ['Pokémon Plush Endcap Refresh', 'r2', 'd3', 'Pokémon Co.', 'Spring 2026', 1.05, 'SHIPPED', 'PO-43980', 'SO-88820'],
    ['Sanrio Stationery Impulse Line', 'r5', 'd6', 'Sanrio', 'Spring 2026', 0.48, 'CLOSED', 'PO-43110', 'SO-87740'],
  ];
  const OPPS = oppNames.map((o, i) => ({
    id: 'o' + (i + 1), name: o[0], retailer: o[1], dept: o[2], licensor: o[3], season: o[4],
    amount: o[5], stage: o[6], po: o[7], so: o[8],
    close_date: ['2026-08-15', '2026-09-30', '2026-07-22', '2026-08-01', '2026-05-12', '2026-06-18', '2026-10-05', '2026-07-09', '2026-11-20', '2026-05-28', '2026-06-30', '2026-09-15', '2026-08-08', '2026-08-25', '2026-04-30', '2026-03-15'][i],
    ai: i % 3 !== 1,
    summary: 'Buyer confirmed assortment scope of 6 SKUs across two price points. Awaiting licensor art approval before sampling. Hard delivery tied to retail floor-set; risk if approval slips past month-end.',
  }));

  const subjects = [
    ['RE: Halloween plush — revised costing attached', 'danielle.reyes@walmart.com', 'UNROUTED', 'r1'],
    ['Art approval needed: Avengers gifting set', 'tom.whitfield@target.com', 'COMPANY_DEPT', 'r2'],
    ['PO-44821 confirmed — ship window', 'priya.anand@target.com', 'ROUTED', 'r2'],
    ['Costco buyer intro — home capsule', 'angela.brooks@costco.com', 'COMPANY_ONLY', 'r3'],
    ['Newsletter: Q3 retail floor-set calendar', 'updates@retaildive.com', 'SKIPPED', null],
    ['Sample feedback — SpongeBob novelty', 'derek.y@fivebelow.com', 'UNROUTED', 'r5'],
    ['Re: pricing on Jurassic plush wave 2', 'marcus.cohen@walmart.com', 'COMPANY_DEPT', 'r1'],
    ['Licensor: Disney style guide update v4', 'approvals@disney.com', 'CUSTOMER_EMAIL_NO_COMPANY', null],
    ['Tailgate set — final art sign-off', 'carlos.mendez@samsclub.com', 'UNROUTED', 'r8'],
    ['Out of office: Sandra Liu', 'sandra.liu@kohls.com', 'SKIPPED', 'r4'],
    ['SO-90233 — revised quantities', 'angela.brooks@costco.com', 'ROUTED', 'r3'],
    ['Meeting recap: Macy\u2019s holiday line review', 'rachel.stein@macys.com', 'COMPANY_ONLY', 'r6'],
    ['New directive — Princess gifting tower', 'tom.whitfield@target.com', 'UNROUTED', 'r2'],
    ['Re: Hello Kitty home — packaging specs', 'angela.brooks@costco.com', 'COMPANY_DEPT', 'r3'],
    ['Promotional offer from logistics vendor', 'sales@freightco.com', 'SKIPPED', null],
  ];
  const EMAILS = subjects.map((s, i) => ({
    id: 'e' + (i + 1), subject: s[0], sender: s[1], status: s[2], retailer: s[3],
    dept: s[3] === 'r1' ? 'd1' : s[3] === 'r2' ? 'd4' : null,
    method: s[2] === 'ROUTED' ? 'ALIAS_MATCH' : s[2] === 'COMPANY_DEPT' ? 'AI_CLASSIFY' : s[2] === 'COMPANY_ONLY' ? 'DOMAIN_MATCH' : 'MANUAL',
    received: `2026-06-${String(11 - Math.floor(i / 3)).padStart(2, '0')}T${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`,
    preview: 'Hi team — following up on the items we discussed. Please see the attached revisions and let me know if the timing still works for the floor-set window. Thanks,',
  }));

  const MEETINGS = [
    { id: 'm1', name: 'Target Plush Line Review — Fall', date: '2026-06-09', retailer: 'r2', contact: 'b3', participants: 'P. Anand, E. Walsh, L. Park', source: 'FIREFLIES', summary: 'Reviewed the 6-SKU Fall plush assortment. Buyer is enthusiastic but wants two opening price points and confirmation on the floor-set window before committing.', actions: 'Send revised costing at two price points; confirm Disney art timing; circulate updated line sheet by Friday.' },
    { id: 'm2', name: 'Walmart Seasonal Directive Kickoff', date: '2026-06-05', retailer: 'r1', contact: 'b1', participants: 'D. Reyes, M. Cohen, N. Fischer', source: 'FIREFLIES', summary: 'Kickoff for the Holiday 2026 light-up décor directive. DMM aligned scope across Seasonal and Toys; emphasized exclusive SKUs and aggressive delivery dates.', actions: 'Stand up the program in pipeline; assign factory; draft sampling calendar.' },
    { id: 'm3', name: 'Costco Home Capsule — Pricing', date: '2026-06-03', retailer: 'r3', contact: 'b5', participants: 'A. Brooks, E. Walsh', source: 'FIREFLIES', summary: 'Pricing alignment on the Hello Kitty home capsule. Buyer pushed for a sharper landed cost; agreed to revisit packaging to hit the target.', actions: 'Re-quote with simplified packaging; submit Sanrio packaging approval.' },
    { id: 'm4', name: 'Macy\u2019s Holiday Line Walkthrough', date: '2026-05-28', retailer: 'r6', contact: 'b9', participants: 'R. Stein, L. Park', source: 'MANUAL', summary: 'Walked the holiday snow globe concept with the merchandising VP. Positive reception; flagged a potential exclusive conflict to verify with the licensor.', actions: 'Verify exclusivity with Peanuts; prepare concept boards for next review.' },
    { id: 'm5', name: 'Five Below Impulse Refresh', date: '2026-05-22', retailer: 'r5', contact: 'b6', participants: 'D. Yamamoto, N. Fischer', source: 'FIREFLIES', summary: 'Reviewed the SpongeBob novelty refresh for front-end impulse. Buyer wants a $5 price point and a mystery-box mechanic similar to the Pokémon program.', actions: 'Develop $5 mystery-box concept; share Pokémon sell-through data.' },
  ];

  const NOTES = [
    { id: 'n1', title: 'Walmart floor-set window moved up', body: 'Reyes confirmed the seasonal floor-set is now two weeks earlier. All Halloween programs need to compress sampling — flag any at-risk delivery dates.', retailer: 'r1', opp: 'o1', source: 'MANUAL', date: '2026-06-10' },
    { id: 'n2', title: 'Disney style guide v4 — key changes', body: 'New trademark placement rules on hangtags and revised color tolerances. Applies to all in-flight Disney programs; re-check submitted art.', retailer: null, opp: 'o3', source: 'EMAIL', date: '2026-06-08' },
    { id: 'n3', title: 'Costco landed-cost target', body: 'Brooks needs the Hello Kitty capsule under target landed. Simplifying packaging is the fastest lever; factory re-quote pending.', retailer: 'r3', opp: 'o6', source: 'MEETING', date: '2026-06-03' },
    { id: 'n4', title: 'Five Below mystery-box mechanic', body: 'Strong interest in repeating the Pokémon mystery-box format for SpongeBob. Margin works at $5 if we hold piece count to four.', retailer: 'r5', opp: 'o10', source: 'MEETING', date: '2026-05-22' },
    { id: 'n5', title: 'NFL Pantone resubmission', body: 'Bears logo came back off-spec. Corrected files sent to the licensor; expect turnaround within a week.', retailer: 'r1', opp: 'o4', source: 'MANUAL', date: '2026-06-07' },
  ];

  const TASKS = [
    { id: 't1', title: 'Send revised Halloween costing to Walmart', status: 'IN_PROGRESS', due: '2026-06-12', opp: 'o1', assignee: 'u1' },
    { id: 't2', title: 'Chase Disney art approval — Avengers set', status: 'TODO', due: '2026-06-13', opp: 'o3', assignee: 'u2' },
    { id: 't3', title: 'Build sample request for Hello Kitty home', status: 'TODO', due: '2026-06-16', opp: 'o6', assignee: 'u1' },
    { id: 't4', title: 'Confirm ship window on PO-44821', status: 'IN_PROGRESS', due: '2026-06-11', opp: 'o1', assignee: 'u3' },
    { id: 't5', title: 'Prep NBA bobble deck for buyer review', status: 'TODO', due: '2026-06-18', opp: 'o9', assignee: 'u2' },
    { id: 't6', title: 'Close out Sanrio stationery program', status: 'DONE', due: '2026-06-02', opp: 'o16', assignee: 'u1' },
  ];

  const APPROVALS = [
    { id: 'a1', name: 'Avengers Gifting Set — Final Art', licensor: 'Marvel', status: 'SUBMITTED', submitted: '2026-06-08', opp: 'o3', comment: 'Submitted v3 with revised trademark placement per last round.' },
    { id: 'a2', name: 'Halloween Plush — Hangtag', licensor: 'Disney', status: 'APPROVED', submitted: '2026-05-30', opp: 'o1', comment: 'Approved. Cleared for production.' },
    { id: 'a3', name: 'NFL Team Plush — Color', licensor: 'NFL Properties', status: 'REVISION_REQUESTED', submitted: '2026-06-06', opp: 'o4', comment: 'Pantone on Bears logo off-spec; resubmit.' },
    { id: 'a4', name: 'Hello Kitty Home — Packaging', licensor: 'Sanrio', status: 'PENDING', submitted: '2026-06-10', opp: 'o6', comment: 'Awaiting initial submission to licensor portal.' },
    { id: 'a5', name: 'Looney Tunes Plush — Sculpt', licensor: 'Warner Bros.', status: 'APPROVED', submitted: '2026-05-18', opp: 'o8', comment: 'Sculpt approved; shipped.' },
    { id: 'a6', name: 'Princess Gifting Tower — Concept', licensor: 'Disney', status: 'REJECTED', submitted: '2026-06-04', opp: 'o12', comment: 'Concept conflicts with exclusive; revise direction.' },
  ];

  // 12-week email volume + routed series for the area chart
  const EMAIL_TREND = [310, 288, 342, 401, 377, 420, 455, 398, 510, 540, 502, 583].map((v, i) => ({
    week: i, total: v, routed: Math.round(v * (0.62 + i * 0.018)),
  }));

  window.CRM = {
    retailers: RETAILERS, depts: DEPTS, buyers: BUYERS, team: TEAM, opps: OPPS,
    emails: EMAILS, meetings: MEETINGS, tasks: TASKS, approvals: APPROVALS,
    licensors: LICENSORS, stages: STAGES, emailTrend: EMAIL_TREND, notes: NOTES,
    stats: {
      accounts: 3744, contacts: 8612, openOpportunities: 47, needsRouting: 6,
      emails: 10712, routed: 7218, skipped: 1840, meetings: 27, openTasks: 5,
      pendingApprovals: 4, pipelineValue: 18.4,
    },
  };
})();
