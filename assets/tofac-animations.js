/* ============================================================
   TOFAC ANIMATIONS — Granola-style prompt → UI explainers
   Usage:
     <div class="tofac-anim" data-tofac-anim="squad">…markup…</div>
     <script src="/assets/tofac-animations.js" defer></script>
   The script auto-mounts on DOMContentLoaded. Each animation is
   self-contained and loops forever; embeds use IntersectionObserver
   so they only run while visible.
   ============================================================ */
(() => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- Terminal helpers ----------
  function termRow(termEl) {
    const div = document.createElement('div');
    div.className = 'ta-row';
    termEl.appendChild(div);
    return div;
  }
  function setCaret(termEl, row) {
    termEl.querySelectorAll('.ta-caret').forEach(c => c.remove());
    const caret = document.createElement('span');
    caret.className = 'ta-caret';
    row.appendChild(caret);
  }
  async function typeChunks(termEl, row, chunks, speed = 16, signal) {
    setCaret(termEl, row);
    const caret = row.querySelector('.ta-caret');
    for (const [text, cls] of chunks) {
      const span = document.createElement('span');
      if (cls) span.className = `ta-${cls}`;
      caret.before(span);
      for (const ch of text) {
        if (signal && signal.cancelled) return;
        span.appendChild(document.createTextNode(ch));
        await sleep(speed + Math.random() * 22);
      }
    }
  }
  function clearTerm(termEl) {
    termEl.innerHTML = '';
  }

  // ---------- Animation 01: BUILD THE SQUAD ----------
  async function runSquad(root, signal) {
    const term = root.querySelector('[data-ta-term]');
    const builder = root.querySelector('[data-ta-builder]');
    const teamNameEl = root.querySelector('[data-ta-teamname]');
    const taglineEl  = root.querySelector('[data-ta-tagline]');
    const slotsEl    = root.querySelector('[data-ta-slots]');

    const ROLES = [
      { key: 'CAPTAIN',  className: 'captain' },
      { key: 'WINGMAN',  className: '' },
      { key: 'CLOSER',   className: '' },
      { key: 'WILDCARD', className: '' },
    ];
    const PLAYERS = [
      { name: 'Mike Melchiot', initials: 'MM' },
      { name: 'Paul Reed',     initials: 'PR' },
      { name: 'Bailey Cox',    initials: 'BC' },
      { name: 'Dave Singh',    initials: 'DS' },
    ];
    const TEAM_NAME = 'The Putter Kings';
    const TAGLINE   = 'Last to the buffet, first on the leaderboard.';

    function buildSlots() {
      slotsEl.innerHTML = '';
      ROLES.forEach((r, i) => {
        const slot = document.createElement('div');
        slot.className = `ta-slot empty ${r.className}`;
        slot.innerHTML = `
          <div class="ta-avatar">${r.key[0]}</div>
          <div class="ta-body">
            <span class="ta-role">${r.key}${i === 0 ? ' · pays once' : ''}</span>
            <span class="ta-name">Open seat</span>
          </div>
          <div class="ta-check">✓</div>`;
        slotsEl.appendChild(slot);
      });
    }
    function fillSlot(i) {
      const slot = slotsEl.children[i];
      const p = PLAYERS[i];
      slot.classList.remove('empty');
      slot.classList.add('filled');
      slot.querySelector('.ta-avatar').textContent = p.initials;
      slot.querySelector('.ta-name').textContent = p.name;
    }
    function reveal(step) {
      const el = builder.querySelector(`[data-step="${step}"]`);
      if (el) el.classList.add('ta-show');
    }
    async function typeText(el, text, sp = 40) {
      el.textContent = '';
      for (const ch of text) {
        if (signal.cancelled) return;
        el.textContent += ch;
        await sleep(sp);
      }
    }
    function reset() {
      clearTerm(term);
      teamNameEl.innerHTML = '&nbsp;';
      taglineEl.innerHTML = '&nbsp;';
      buildSlots();
      builder.querySelectorAll('.ta-field').forEach(f => f.classList.remove('ta-show'));
    }

    reset();
    await sleep(400); if (signal.cancelled) return;

    await typeChunks(term, termRow(term), [['› ', 'prompt'], ['build squad ', 'str'], ['--captain ', 'key'], ['"Mike Melchiot"', 'str']], 22, signal);
    await sleep(280);

    await typeChunks(term, termRow(term), [['→ team ', 'dim'], ['"The Putter Kings"', 'str']], 14, signal);
    reveal('team');
    await sleep(100);
    await typeText(teamNameEl, TEAM_NAME, 45);
    await sleep(550);

    await typeChunks(term, termRow(term), [['→ tagline ', 'dim'], ['"Last to the buffet…"', 'str']], 12, signal);
    reveal('tagline');
    await sleep(60);
    await typeText(taglineEl, TAGLINE, 18);
    await sleep(550);

    await typeChunks(term, termRow(term), [['→ scaffolding lineup ', 'dim'], ['[CAPTAIN · WINGMAN · CLOSER · WILDCARD]', 'str']], 10, signal);
    reveal('slots');
    await sleep(350);

    const lines = [
      [['→ ', 'dim'], ['CAPTAIN  ', 'key'], ['Mike Melchiot ', 'str'], ['· verified', 'ok']],
      [['→ ', 'dim'], ['WINGMAN  ', 'key'], ['Paul Reed ',     'str'], ['· verified', 'ok']],
      [['→ ', 'dim'], ['CLOSER   ', 'key'], ['Bailey Cox ',    'str'], ['· verified', 'ok']],
      [['→ ', 'dim'], ['WILDCARD ', 'key'], ['Dave Singh ',    'str'], ['· verified', 'ok']],
    ];
    for (let i = 0; i < ROLES.length; i++) {
      if (signal.cancelled) return;
      await typeChunks(term, termRow(term), lines[i], 9, signal);
      fillSlot(i);
      await sleep(220);
    }

    await typeChunks(term, termRow(term), [['→ price ', 'dim'], ['$600 ', 'str'], ['(foursome · early-bird) ', 'dim'], ['save $50', 'ok']], 11, signal);
    reveal('summary');
    await sleep(400);

    await typeChunks(term, termRow(term), [['✓ squad ready · add to cart', 'ok']], 11, signal);
    term.querySelectorAll('.ta-caret').forEach(c => c.remove());
  }

  // ---------- Animation 02: LIGHT UP THE LEADERBOARD ----------
  async function runLeaderboard(root, signal) {
    const term = root.querySelector('[data-ta-term]');
    const list = root.querySelector('[data-ta-board-list]');
    const eyebrow = root.querySelector('[data-ta-board-eyebrow]');

    // Initial leaderboard state (sorted ascending by strokes — best at top)
    let teams = [
      { id: 'BIRDIE',   name: 'Birdie Brigade',   strokes: 48, thru: 12 },
      { id: 'EAGLE',    name: 'Eagle Hunters',    strokes: 50, thru: 13 },
      { id: 'SLICE',    name: 'Slice of Heaven',  strokes: 52, thru: 13 },
      { id: 'PUTTER',   name: 'The Putter Kings', strokes: 54, thru: 13 },
      { id: 'BOGEY',    name: 'Bogey Boys',       strokes: 56, thru: 13 },
      { id: 'MULLIGAN', name: 'Mulligan Mafia',   strokes: 58, thru: 12 },
    ];

    function renderBoard() {
      list.innerHTML = '';
      teams.forEach((t, i) => {
        const row = document.createElement('div');
        row.className = 'ta-board-row';
        row.dataset.id = t.id;
        row.innerHTML = `
          <div class="ta-rank">${i + 1}<span class="ta-rank-move"></span></div>
          <div class="ta-team">${t.name}</div>
          <div class="ta-strokes">${t.strokes}</div>
          <div class="ta-thru">thru ${t.thru}</div>`;
        list.appendChild(row);
      });
    }

    async function applyScore(teamId, deltaStrokes, deltaThru = 1, moveLabel = null) {
      const target = teams.find(t => t.id === teamId);
      if (!target) return;
      const oldIdx = teams.indexOf(target);
      // Update stats
      target.strokes += deltaStrokes;
      target.thru += deltaThru;
      // Flash row
      const row = list.querySelector(`[data-id="${teamId}"]`);
      if (row) {
        row.classList.add('flash');
        row.querySelector('.ta-strokes').textContent = target.strokes;
        row.querySelector('.ta-thru').textContent = `thru ${target.thru}`;
        await sleep(320);
        row.classList.remove('flash');
      }
      // Re-sort
      teams.sort((a, b) => a.strokes - b.strokes || a.id.localeCompare(b.id));
      const newIdx = teams.indexOf(target);
      // Re-render with rank-move indicators
      list.innerHTML = '';
      teams.forEach((t, i) => {
        const r = document.createElement('div');
        r.className = 'ta-board-row';
        r.dataset.id = t.id;
        let moveSpan = '';
        if (t.id === teamId && newIdx < oldIdx) moveSpan = `<span class="ta-rank-up">▲${oldIdx - newIdx}</span>`;
        else if (t.id === teamId && newIdx > oldIdx) moveSpan = `<span class="ta-rank-down">▼${newIdx - oldIdx}</span>`;
        r.innerHTML = `
          <div class="ta-rank">${i + 1}${moveSpan}</div>
          <div class="ta-team">${t.name}</div>
          <div class="ta-strokes">${t.strokes}</div>
          <div class="ta-thru">thru ${t.thru}</div>`;
        list.appendChild(r);
      });
      // Flash new position
      const newRow = list.querySelector(`[data-id="${teamId}"]`);
      if (newRow) {
        newRow.classList.add('flash');
        await sleep(400);
        newRow.classList.remove('flash');
      }
    }

    function reset() {
      clearTerm(term);
      teams = [
        { id: 'BIRDIE',   name: 'Birdie Brigade',   strokes: 48, thru: 12 },
        { id: 'EAGLE',    name: 'Eagle Hunters',    strokes: 50, thru: 13 },
        { id: 'SLICE',    name: 'Slice of Heaven',  strokes: 52, thru: 13 },
        { id: 'PUTTER',   name: 'The Putter Kings', strokes: 54, thru: 13 },
        { id: 'BOGEY',    name: 'Bogey Boys',       strokes: 56, thru: 13 },
        { id: 'MULLIGAN', name: 'Mulligan Mafia',   strokes: 58, thru: 12 },
      ];
      renderBoard();
    }

    reset();
    await sleep(400); if (signal.cancelled) return;

    await typeChunks(term, termRow(term), [['› ', 'prompt'], ['scoreboard ', 'str'], ['--live', 'key']], 22, signal);
    await sleep(250);
    await typeChunks(term, termRow(term), [['→ listening for scores on holes 1-18 …', 'dim']], 12, signal);
    await sleep(500);

    // Stream a few scores
    const scoreEvents = [
      { team: 'PUTTER',   strokes: 3, thru: 1, label: 'birdie · hole 14',  log: [['→ score ', 'dim'], ['"Putter Kings" ', 'str'], ['hole 14 · ', 'dim'], ['birdie', 'ok']] },
      { team: 'EAGLE',    strokes: 5, thru: 1, label: 'bogey · hole 14',   log: [['→ score ', 'dim'], ['"Eagle Hunters" ', 'str'], ['hole 14 · ', 'dim'], ['bogey', 'warn']] },
      { team: 'PUTTER',   strokes: 3, thru: 1, label: 'birdie · hole 15',  log: [['→ score ', 'dim'], ['"Putter Kings" ', 'str'], ['hole 15 · ', 'dim'], ['birdie', 'ok']] },
      { team: 'BIRDIE',   strokes: 6, thru: 1, label: 'double · hole 13',  log: [['→ score ', 'dim'], ['"Birdie Brigade" ', 'str'], ['hole 13 · ', 'dim'], ['double bogey', 'warn']] },
      { team: 'PUTTER',   strokes: 4, thru: 1, label: 'par · hole 16',     log: [['→ score ', 'dim'], ['"Putter Kings" ', 'str'], ['hole 16 · ', 'dim'], ['par', 'str']] },
    ];

    for (const ev of scoreEvents) {
      if (signal.cancelled) return;
      await typeChunks(term, termRow(term), ev.log, 10, signal);
      await sleep(180);
      await applyScore(ev.team, ev.strokes, ev.thru);
      await sleep(280);
    }

    await typeChunks(term, termRow(term), [['✓ leaderboard live · refreshing every 30s', 'ok']], 10, signal);
    term.querySelectorAll('.ta-caret').forEach(c => c.remove());
  }

  // ---------- Animation 03: PUBLISH THE SQUAD PAGE ----------
  async function runPublish(root, signal) {
    const term = root.querySelector('[data-ta-term]');
    const phoneTitle = root.querySelector('[data-ta-phone-title]');
    const urlTyped  = root.querySelector('[data-ta-url-typed]');
    const lineup    = root.querySelector('[data-ta-lineup]');
    const builder   = root.querySelector('[data-ta-builder]');

    const PLAYERS = [
      { name: 'Mike Melchiot', initials: 'MM', role: 'CAPTAIN',  captain: true },
      { name: 'Paul Reed',     initials: 'PR', role: 'WINGMAN' },
      { name: 'Bailey Cox',    initials: 'BC', role: 'CLOSER' },
      { name: 'Dave Singh',    initials: 'DS', role: 'WILDCARD' },
    ];

    function reset() {
      clearTerm(term);
      phoneTitle.textContent = '';
      urlTyped.textContent = '';
      lineup.innerHTML = '';
      PLAYERS.forEach(p => {
        const row = document.createElement('div');
        row.className = `ta-phone-player ${p.captain ? 'captain' : ''}`;
        row.innerHTML = `
          <div class="ta-mini-avatar">${p.initials}</div>
          <div style="display:flex;flex-direction:column;">
            <span class="ta-mini-name">${p.name}</span>
            <span class="ta-mini-role">${p.role}</span>
          </div>`;
        lineup.appendChild(row);
      });
      builder.querySelectorAll('.ta-field').forEach(f => f.classList.remove('ta-show'));
    }
    function reveal(step) {
      const el = builder.querySelector(`[data-step="${step}"]`);
      if (el) el.classList.add('ta-show');
    }
    async function typeUrl(text) {
      for (const ch of text) {
        if (signal.cancelled) return;
        urlTyped.textContent += ch;
        await sleep(28);
      }
    }
    async function typeTitle(text) {
      for (const ch of text) {
        if (signal.cancelled) return;
        phoneTitle.textContent += ch;
        await sleep(35);
      }
    }

    reset();
    await sleep(400); if (signal.cancelled) return;

    await typeChunks(term, termRow(term), [['› ', 'prompt'], ['publish squad-page ', 'str'], ['--team ', 'key'], ['"the-putter-kings"', 'str']], 22, signal);
    await sleep(280);

    reveal('phone');
    await typeChunks(term, termRow(term), [['→ provisioning URL ', 'dim']], 12, signal);
    await sleep(80);
    await typeUrl('golf.ryannreed.com/squad/the-putter-kings');
    await sleep(280);

    await typeChunks(term, termRow(term), [['→ rendering hero ', 'dim'], ['(team brand color · captain photo)', 'str']], 10, signal);
    await sleep(120);
    await typeTitle('THE PUTTER KINGS');
    await sleep(280);

    reveal('lineup-section');
    await typeChunks(term, termRow(term), [['→ assembling lineup card', 'dim']], 10, signal);
    const rows = lineup.querySelectorAll('.ta-phone-player');
    for (let i = 0; i < rows.length; i++) {
      if (signal.cancelled) return;
      await sleep(180);
      rows[i].classList.add('show');
    }
    await sleep(280);

    reveal('share-section');
    await typeChunks(term, termRow(term), [['→ wiring share menu ', 'dim'], ['[iMessage · WhatsApp · Email]', 'str']], 10, signal);
    await sleep(450);

    reveal('live-section');
    await typeChunks(term, termRow(term), [['→ attaching live-score widget ', 'dim'], ['(thru 13 · pos 4)', 'str']], 10, signal);
    await sleep(450);

    await typeChunks(term, termRow(term), [['✓ live · 4 teammates notified by SMS', 'ok']], 10, signal);
    term.querySelectorAll('.ta-caret').forEach(c => c.remove());
  }

  // ---------- Animation 04: CHECK IN THE CREW ----------
  async function runCheckin(root, signal) {
    const term = root.querySelector('[data-ta-term]');
    const builder = root.querySelector('[data-ta-builder]');
    const fill    = root.querySelector('[data-ta-progress-fill]');
    const num     = root.querySelector('[data-ta-progress-num]');
    const welcome = root.querySelector('[data-ta-welcome]');

    function reveal(step) {
      const el = builder.querySelector(`[data-step="${step}"]`);
      if (el) el.classList.add('ta-show');
    }
    function reset() {
      clearTerm(term);
      welcome.innerHTML = 'Welcome,&nbsp;<em>—</em>';
      fill.style.transform = 'scaleX(0)';
      num.textContent = '041 / 248';
      builder.querySelectorAll('.ta-field').forEach(f => f.classList.remove('ta-show'));
    }
    async function typeWelcome(name) {
      const em = welcome.querySelector('em');
      em.textContent = '';
      for (const ch of name) {
        if (signal.cancelled) return;
        em.textContent += ch;
        await sleep(45);
      }
    }

    reset();
    await sleep(400); if (signal.cancelled) return;

    await typeChunks(term, termRow(term), [['› ', 'prompt'], ['checkin ', 'str'], ['--bib ', 'key'], ['042 ', 'str'], ['--name ', 'key'], ['"Bailey Cox"', 'str']], 22, signal);
    await sleep(280);

    await typeChunks(term, termRow(term), [['→ matched ', 'dim'], ['Bailey Cox ', 'str'], ['(team: The Putter Kings)', 'dim']], 12, signal);
    reveal('welcome');
    await sleep(80);
    await typeWelcome('Bailey');
    await sleep(450);

    await typeChunks(term, termRow(term), [['→ printing bag tag ', 'dim'], ['#042', 'str']], 11, signal);
    reveal('tag');
    await sleep(550);

    await typeChunks(term, termRow(term), [['→ assigning cart ', 'dim'], ['#14 · QR paired', 'str']], 11, signal);
    reveal('cart');
    await sleep(550);

    await typeChunks(term, termRow(term), [['→ entitlements ', 'dim'], ['[range · buffet · raffle ×3]', 'str']], 11, signal);
    reveal('badges');
    await sleep(550);

    reveal('progress');
    await sleep(40);
    fill.style.transform = 'scaleX(0.17)';
    num.textContent = '042 / 248';
    await sleep(600);

    await typeChunks(term, termRow(term), [['✓ checked in · 042 of 248 · 8:34 AM', 'ok']], 10, signal);
    term.querySelectorAll('.ta-caret').forEach(c => c.remove());
  }

  // ---------- Mount + loop ----------
  const RUNNERS = {
    squad:       { fn: runSquad,       gap: 5200 },
    leaderboard: { fn: runLeaderboard, gap: 5200 },
    publish:     { fn: runPublish,     gap: 5200 },
    checkin:     { fn: runCheckin,     gap: 5200 },
  };

  function mount(root) {
    const kind = root.dataset.tofacAnim;
    const runner = RUNNERS[kind];
    if (!runner) return;

    let signal = { cancelled: false };
    let loopTimer = null;
    let visible = false;
    let running = false;

    async function loop() {
      if (running) return;
      running = true;
      while (visible && !signal.cancelled) {
        try { await runner.fn(root, signal); } catch (_) { /* ignore */ }
        if (!visible || signal.cancelled) break;
        await new Promise(r => loopTimer = setTimeout(r, runner.gap));
      }
      running = false;
    }
    function start() {
      signal.cancelled = false;
      visible = true;
      loop();
    }
    function stop() {
      visible = false;
      signal.cancelled = true;
      clearTimeout(loopTimer);
      // Don't reset signal here; loop() will exit naturally.
      // Next start() creates a fresh signal.
    }

    // Replay button
    const replay = root.querySelector('[data-ta-replay]');
    if (replay) {
      replay.addEventListener('click', () => {
        signal.cancelled = true;
        clearTimeout(loopTimer);
        signal = { cancelled: false };
        running = false;
        visible = true;
        loop();
      });
    }

    // Only run while visible
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!visible) {
              signal = { cancelled: false };
              start();
            }
          } else {
            stop();
          }
        }
      }, { threshold: 0.15 });
      io.observe(root);
    } else {
      start();
    }
  }

  function mountAll() {
    document.querySelectorAll('.tofac-anim[data-tofac-anim]').forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }
})();
