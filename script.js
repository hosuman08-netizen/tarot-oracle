// gg drawCount
var __tarotDraws=+(localStorage.getItem("tarotDraws")||0);
// ggDailyDraw
// p21 Tarot — UI 레이어. 리딩 규칙은 전부 tarot-core.js(TarotCore)에 있다.
// 이 파일은 화면 구성 · 기록 · 거울(패턴 집계) · 공유 이미지 · 크로스 연동만 담당.
'use strict';

const CODEX_KEY    = 'fateCodex';       // 다른 앱과 공유하는 기존 키 (호환 유지)
const READINGS_KEY = 'tarotReadings';   // 리딩 원본 기록 (거울/저널의 재료)
const PREFS_KEY    = 'tarotPrefs';
const STREAK_KEY   = 'tarotStreak';
const SALT_KEY     = 'tarotSalt';
const MAX_READINGS = 60;

// ── 상태 ────────────────────────────────────────────────────────────────────
let lastSpread = null;
let lastFocus = 'general';
let lastSpreadKey = 'one';
let lastQuestion = '';
let lastNarrative = '';

// ── 저장 유틸 (localStorage가 막혀 있어도 앱이 죽지 않게) ────────────────────
function readJSON(key, fallback){
  try{var _tp=+(localStorage.getItem('tarot_pulls')||0)+1;localStorage.setItem('tarot_pulls',_tp);}catch(e){}
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e){ return fallback; }
}
function writeJSON(key, val){
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch(e){ return false; }
}
function todayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function prefs(){
  return Object.assign({ reversals:true, reversalRate:0.30 }, readJSON(PREFS_KEY, {}));
}
function setPref(k, v){ const p = prefs(); p[k] = v; writeJSON(PREFS_KEY, p); }

// 설치별 고정 소금값 — '오늘의 카드'가 하루 동안 같은 결과를 유지하되
// 모든 사용자에게 똑같이 나오지는 않도록 한다.
function userSalt(){
  let s = null;
  try { s = localStorage.getItem(SALT_KEY); } catch(e){}
  if (!s){ s = Math.random().toString(36).slice(2, 10); try{ localStorage.setItem(SALT_KEY, s); }catch(e){} }
  return s;
}

function esc(str){
  return String(str == null ? '' : str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function $(id){ return document.getElementById(id); }

// ── 카드 렌더 ───────────────────────────────────────────────────────────────
// 이모지 대신 벡터 글리프. 역방향은 글리프를 180도 돌려 자산 없이 시각화한다.
function cardHTML(c, idx, opts){
  opts = opts || {};
  const G = window.TarotGlyphs;
  const dir = TarotCore.directionLabel(c);
  const mean = TarotCore.focusMeaning(c, lastFocus);
  const suitKo = c.suit === 'major' ? '메이저' : TarotCore.SUITS[c.suit].ko;
  return `<figure class="tcard${c.reversed ? ' is-rev' : ''}${c.noOrientation ? ' is-cross' : ''}"
      data-idx="${idx}" role="button" tabindex="0"
      aria-label="${esc(c.position)}: ${esc(c.ko)} ${esc(dir)}. 눌러서 자세히">
    <span class="tcard-rank">${G ? G.rankMark(c) : ''}</span>
    <span class="tcard-suit">${esc(suitKo)}</span>
    <div class="tcard-art">${G ? G.glyphFor(c) : ''}</div>
    <div class="tcard-ko">${esc(c.ko)}</div>
    <div class="tcard-en">${esc(c.name)}</div>
    <div class="tcard-dir"><span class="pill ${c.noOrientation ? 'pill-cross' : (c.reversed ? 'pill-rev' : 'pill-up')}">${esc(dir)}</span></div>
    ${opts.showMeaning === false ? '' : `<div class="tcard-mean">${esc(mean)}</div>`}
    <figcaption class="tcard-pos">${esc(c.position)}</figcaption>
  </figure>`;
}

// 켈틱 크로스는 전통 배치(중앙 십자 1~6 + 우측 지팡이 7~10)를 지킨다.
// 좁은 화면에서는 이 2블록 분할을 그대로 살려 세로 2섹션으로 접는다(CSS).
function renderSpread(spread, key){
  const host = $('cards');
  if (key === 'celtic'){
    host.className = 'spread-celtic';
    host.innerHTML =
      `<div class="celtic-cross">
        <div class="cc cc-3">${cardHTML(spread[2],2,{showMeaning:false})}</div>
        <div class="cc cc-5">${cardHTML(spread[4],4,{showMeaning:false})}</div>
        <div class="cc cc-center">
          ${cardHTML(spread[0],0,{showMeaning:false})}
          <div class="cc-crossed">${cardHTML(spread[1],1,{showMeaning:false})}</div>
        </div>
        <div class="cc cc-6">${cardHTML(spread[5],5,{showMeaning:false})}</div>
        <div class="cc cc-4">${cardHTML(spread[3],3,{showMeaning:false})}</div>
      </div>
      <div class="celtic-staff">
        <h3 class="block-label">지팡이 — 나와 바깥</h3>
        ${[6,7,8,9].map(i => cardHTML(spread[i], i, {showMeaning:false})).join('')}
      </div>`;
  } else {
    host.className = 'spread-row cols-' + spread.length;
    host.innerHTML = spread.map((c,i) => cardHTML(c,i)).join('');
  }
  // 카드가 한 장씩 넘어가는 등장 — 리딩의 의례감
  const els = host.querySelectorAll('.tcard');
  const step = spread.length > 6 ? 55 : 95;
  els.forEach((el,i) => {
    el.style.animationDelay = (i*step)+'ms';
    el.classList.add('flip-in');
    // 애니메이션이 끝나면 클래스를 뗀다. animation-fill-mode:both가 남아 있으면
    // 완료된 키프레임의 transform이 hover 효과와 교차카드 회전을 계속 덮어쓴다.
    el.addEventListener('animationend', () => {
      el.classList.remove('flip-in');
      el.style.animationDelay = '';
    }, { once:true });
  });
}

// ── 드로우 ──────────────────────────────────────────────────────────────────
function currentFocus(){
  const el = document.querySelector('input[name="focus"]:checked');
  return el ? el.value : 'general';
}

function drawReading(spreadKey){
  try{__tarotDraws++;localStorage.setItem("tarotDraws",__tarotDraws);}catch(e){}

  if (!window.TarotCore){ toast('타로 엔진을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.'); return; }
  const p = prefs();
  const spec = TarotCore.SPREADS[spreadKey] || TarotCore.SPREADS.one;
  const key = spec.key;

  lastFocus = currentFocus();
  lastSpreadKey = key;
  lastQuestion = ($('question') && $('question').value || '').trim().slice(0, 120);

  const spread = TarotCore.drawSpread(key, { reversals:p.reversals, reversalRate:p.reversalRate });
  lastSpread = spread;

  $('spreadTitle').textContent = spec.name;
  $('spreadMeta').textContent =
    `${TarotCore.FOCUS_LABEL[lastFocus]} · ${p.reversals ? '역방향 사용' : '역방향 미사용'}`
    + (lastQuestion ? ` · “${lastQuestion}”` : '');

  renderSpread(spread, key);

  const narrative = TarotCore.synthesize(spread, lastFocus, key);
  lastNarrative = narrative;

  let extra = '';
  if (key === 'yesno'){
    const v = TarotCore.yesNoVerdict(spread);
    extra = `<div class="verdict"><b>${esc(v.label)}</b><small>${esc(v.caveat)}</small></div>`;
  }

  const perCard = spread.map((c,i) =>
    `<li data-idx="${i}"><b>${esc(c.position)}</b> — <span class="li-card">${esc(c.ko)} ${esc(TarotCore.directionLabel(c))}</span><br>${esc(TarotCore.interpretCard(c, lastFocus))}</li>`
  ).join('');

  $('interp').innerHTML = extra
    + `<p class="narrative">${esc(narrative)}</p>`
    + `<h3 class="block-label">자리별로 읽기</h3>`
    + `<ul class="reading-list">${perCard}</ul>`
    + sajuLineHTML(spread);

  $('spread').hidden = false;
  $('spread').scrollIntoView({ behavior:'smooth', block:'start' });

  drawAura(spread);
  resetJournalForm();
  saveReading(spread, key, narrative);
  bumpStreak();
  renderMirror();
  renderHistory();
  offerSharePeak(spread, key);

  if (window.legionTrack) legionTrack('activate');
}

// share-at-peak: 뽑자마자 공유 의도 최고 — Contagious Emotion + Niobe peak share
function offerSharePeak(spread, key){
  const host = $('spread');
  if (!host) return;
  let peak = $('sharePeak');
  if (!peak){
    peak = document.createElement('div');
    peak.id = 'sharePeak';
    peak.className = 'share-peak';
    const actions = host.querySelector('.share-row, .actions, #shareBtn');
    if (actions && actions.parentNode) actions.parentNode.insertBefore(peak, actions);
    else host.appendChild(peak);
  }
  const major = (spread || []).filter(c => c && c.suit === 'major').length;
  const line = major >= 2
    ? '메이저 카드가 강해요 — 지금 이미지로 남기면 가장 선명해요'
    : '리딩이 완성됐어요 — 한 장으로 공유해볼까요?';
  peak.innerHTML = `<p>✨ ${line}</p>
    <div class="share-peak-row">
      <button type="button" class="btn-primary" id="sharePeakBtn">결과 이미지 공유</button>
      <button type="button" class="btn-quiet" id="sharePeakLater">나중에</button>
    </div>`;
  peak.hidden = false;
  const b = $('sharePeakBtn'); if (b) b.onclick = () => { if (window.legionTrack) try{legionTrack('share_peak');}catch(e){} shareReading(); };
  const l = $('sharePeakLater'); if (l) l.onclick = () => { peak.hidden = true; };
  if (window.legionTrack) try { legionTrack('share_peak_shown', { key, major }); } catch(e){}
  try { showTarotMoneyPipe(host); } catch (e) {}
}

/** 3H money-pipe · 엔터 트랙 (투자 아님) */
function showTarotMoneyPipe(host){
  let el = $('moneyPipe');
  if (!el){
    el = document.createElement('div');
    el.id = 'moneyPipe';
    el.style.cssText = 'margin:12px 0;padding:12px;border:1px solid #c5a46e55;border-radius:12px;background:#16121c;text-align:center;font-size:13px';
    (host || document.body).appendChild(el);
  }
  el.innerHTML = '<div style="color:#e0b552;font-weight:700;margin-bottom:6px">💎 리딩 더 깊게</div>'
    + '<p style="opacity:.8;font-size:12px;margin:0 0 8px">엔터테인먼트 · 운명 확정 아님 · 18+ 권장</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">'
    + '<a class="btn-primary" style="display:inline-block;padding:8px 12px;border-radius:10px;text-decoration:none;color:inherit;border:1px solid #c5a46e55" href="mailto:hoyashi95@gmail.com?subject=%5B%ED%83%80%EB%A1%9C%5D%20%ED%9B%84%EC%9B%90">☕ 후원 문의</a>'
    + '<button type="button" class="btn-quiet" onclick="shareReading && shareReading()">📤 공유</button>'
    + '<a class="btn-quiet" style="display:inline-block;padding:8px 12px;border-radius:10px;text-decoration:none;color:#e0b552;border:1px solid #c5a46e55" href="https://hosuman08-netizen.github.io/saju-miniapp/?utm_source=tarot&utm_medium=duo&ref=tarot_pipe">🔮 사주와 교차 읽기</a>'
    + '</div>';
  try { if (window.legionTrack) legionTrack('money_pipe_shown', { app: 'tarot', duo: 'saju' }); } catch(e){}
}
// 하위 호환 — 예전 버튼이 부르던 이름
function drawTarot(n){ drawReading(n === 3 ? 'ppf' : n === 10 ? 'celtic' : n === 1 ? 'one' : n); }

// 사주 연동은 '함께 읽기' 보조선일 뿐, 결과를 바꾸지 않는다는 걸 명시한다.
function sajuLineHTML(spread){
  const on = $('sajuLink') && $('sajuLink').checked;
  if (!on) return '';
  const rec = readJSON(CODEX_KEY, [])[0];
  const score = rec && rec.score ? rec.score : null;
  const els = {};
  spread.forEach(c => { if (c.el) els[c.el] = (els[c.el]||0)+1; });
  const top = Object.keys(els).sort((a,b)=>els[b]-els[a])[0];
  const elKo = top ? TarotCore.ELEMENTS[top].ko : null;
  return `<div class="saju-line"><b>사주와 겹쳐 읽기</b> — `
    + (elKo ? `이번 스프레드는 <b>${esc(elKo)}</b> 기운이 가장 두껍습니다. ` : '')
    + (score ? `저장된 사주 기록(${esc(score)})과 함께 놓고 보세요. ` : '사주 앱의 기록이 아직 없어요. ')
    + `타로의 원소(불·물·공기·흙)와 사주의 오행을 나란히 두면 같은 질문을 두 각도로 볼 수 있습니다. `
    + `<small>보조선일 뿐 카드 결과를 바꾸지 않습니다.</small></div>`;
}

// ── 오늘의 카드 ─────────────────────────────────────────────────────────────
// 같은 날에는 같은 카드가 나온다(시드 고정). 계속 다시 뽑아 원하는 답이 나올
// 때까지 돌리는 걸 막는 정통 관행이기도 하다.
function renderDaily(){
  const host = $('dailyCard');
  if (!host || !window.TarotCore) return;
  const rnd = TarotCore.seededRandom(todayKey() + ':' + userSalt());
  const p = prefs();
  const [c] = TarotCore.drawSpread('one', { reversals:p.reversals, reversalRate:p.reversalRate, rnd });
  const G = window.TarotGlyphs;
  host.innerHTML =
    `<div class="daily-art">${G ? G.glyphFor(c) : ''}</div>
     <div class="daily-body">
       <div class="daily-name">${esc(c.ko)} <span class="daily-en">${esc(c.name)}</span></div>
       <span class="pill ${c.reversed ? 'pill-rev' : 'pill-up'}">${esc(TarotCore.directionLabel(c))}</span>
       <p class="daily-mean">${esc(c.gist)}</p>
       <p class="daily-advice">${esc(c.advice)}</p>
     </div>`;
  if (c.reversed) host.classList.add('is-rev'); else host.classList.remove('is-rev');
  host.dataset.card = c.id;
}

// ── 연속 기록 ───────────────────────────────────────────────────────────────
// 끊겼다고 압박하지 않는다. 1일 미스는 주 1회 보호막(Duolingo freeze)으로 살린다.
function dayOffsetKey(n){
  const d = new Date(); d.setDate(d.getDate()+n);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function applyTarotStreakShield(s){
  if (!s || !s.last) return { s: s || { last:null, count:0, best:0 }, froze:false };
  const t = todayKey();
  if (s.last === t || s.last === dayOffsetKey(-1)) return { s, froze:false };
  const missedOne = s.last === dayOffsetKey(-2);
  const shieldReady = !s.shieldLast || ((new Date(t) - new Date(s.shieldLast)) / 86400000) >= 7;
  if (missedOne && shieldReady && (s.count||0) >= 3){
    s.shieldLast = t;
    s.last = dayOffsetKey(-1);
    try {
      const tip = document.createElement('div');
      tip.textContent = '🛡️ 연속 보호막 · ' + s.count + '일 유지';
      tip.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#16121c;color:#e0b552;padding:10px 16px;border-radius:12px;z-index:9999;font-size:13px;border:1px solid #c5a46e55';
      document.body.appendChild(tip);
      setTimeout(() => tip.remove(), 3000);
    } catch(e){}
    if (window.legionTrack) try { legionTrack('streak_freeze', { count:s.count }); } catch(e){}
    return { s, froze:true };
  }
  return { s, froze:false };
}
function bumpStreak(){
  let s = readJSON(STREAK_KEY, { last:null, count:0, best:0 });
  const t = todayKey();
  if (s.last === t) return;
  const bridged = applyTarotStreakShield(s);
  s = bridged.s;
  const yk = dayOffsetKey(-1);
  s.count = (s.last === yk) ? (s.count||0)+1 : 1;
  s.best = Math.max(s.best||0, s.count);
  s.last = t;
  writeJSON(STREAK_KEY, s);
  renderStreak();
  if (window.legionTrack) try { legionTrack('streak', { count:s.count, best:s.best, froze:!!bridged.froze }); } catch(e){}
}
function midnightLeftLabel(){
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const rem = Math.max(0, Math.floor((end - now) / 60000));
  const hh = Math.floor(rem / 60), mm = rem % 60;
  return (hh ? hh + '시간 ' : '') + mm + '분';
}
function renderStreak(){
  const el = $('streak'); if (!el) return;
  const s = readJSON(STREAK_KEY, { last:null, count:0, best:0 });
  const all = readJSON(READINGS_KEY, []);
  const clock = midnightLeftLabel();
  if (!all.length){
    el.textContent = '아직 기록이 없어요 — 첫 카드를 뽑아보세요 · 오늘 창 ' + clock;
    return;
  }
  // 5H: 7d velocity (draw count this week) for return loop
  let weekN = 0;
  try {
    const cut = Date.now() - 7 * 86400000;
    weekN = all.filter(function (r) {
      const t = r && r.ts ? Date.parse(r.ts) : 0;
      return t >= cut;
    }).length;
  } catch (e) { weekN = 0; }
  const shieldReady = !s.shieldLast || ((new Date(todayKey()) - new Date(s.shieldLast)) / 86400000) >= 7;
  let p10 = '';
  try {
    if (window.p10Bal) p10 = ' · 💳' + p10Bal();
    // daily free p10 once
    var fk = 'tarot_p10_free_' + todayKey();
    if (!localStorage.getItem(fk) && window.p10Grant) {
      /* grant deferred to chip click — just surface balance */
    }
  } catch (e) {}
  const weekGoal = 7;
  const weekBar = weekN >= weekGoal ? '✓' : (weekN + '/' + weekGoal);
  el.innerHTML = `${s.count || 0}일 연속 · 지금까지 ${all.length}번의 리딩`
    + (weekN ? ` · 7일 ${weekN}회 (${weekBar})` : '')
    + (s.best > (s.count||0) ? ` · 최장 ${s.best}일` : '')
    + ((s.count||0) >= 3 && shieldReady ? ' · 🛡️보호 1회' : '')
    + p10
    + ` · 일일카드 리셋 ${clock}`
    + ' <button type="button" id="p10FreeBtn" class="btn-quiet" style="margin-left:6px;padding:2px 8px;font-size:11px">일일 가상+5</button>';
  const pb = $('p10FreeBtn');
  if (pb) pb.onclick = function () {
    try {
      var fk2 = 'tarot_p10_free_' + todayKey();
      if (localStorage.getItem(fk2)) { pb.textContent = '오늘 받음'; return; }
      if (window.p10Grant) p10Grant(5);
      localStorage.setItem(fk2, '1');
      pb.textContent = '✓ +5';
      if (window.legionTrack) legionTrack('p10_daily_free', { n: 5 });
      renderStreak();
    } catch (e) {}
  };
}

// ── 리딩 기록 ───────────────────────────────────────────────────────────────
function saveReading(spread, key, narrative){
  const all = readJSON(READINGS_KEY, []);
  all.unshift({
    id: 'r' + Date.now(),
    ts: new Date().toISOString(),
    spreadKey: key,
    spreadName: (TarotCore.SPREADS[key] || {}).name || '',
    focus: lastFocus,
    question: lastQuestion,
    narrative,
    note: '', mood: 0, tags: [],
    cards: spread.map(c => ({
      id:c.id, ko:c.ko, name:c.name, suit:c.suit, el:c.el,
      reversed:c.reversed, revMode:c.revMode, position:c.position, theme:c.theme
    }))
  });
  writeJSON(READINGS_KEY, all.slice(0, MAX_READINGS));

  // 다른 앱과 공유하는 기존 기록 키도 계속 채워 호환을 유지한다
  const codex = readJSON(CODEX_KEY, []);
  const summary = spread.map(c => c.ko + (c.reversed ? '(역)' : '')).join('·');
  codex.unshift({
    ts:new Date().toISOString(), type:'tarot',
    text:(summary + ' — ' + narrative).slice(0, 108),
    score: spreadScore(spread), relicLv:1, power:spreadScore(spread), multi:1
  });
  writeJSON(CODEX_KEY, codex.slice(0, 18));
}

// 정방향 비율에서 나오는 표시용 지수(엔터테인먼트). 코드와 화면 표기가 일치한다.
function spreadScore(spread){
  const up = spread.filter(c => !c.reversed).length;
  return Math.round(45 + (up / spread.length) * 45);
}

function exportReadingsJSON(){
  try {
    const all = readJSON(READINGS_KEY, []);
    const payload = { app: 'tarot-oracle', exportedAt: new Date().toISOString(), readings: all.slice(0, 100) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tarot-readings-' + todayKey() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    if (window.legionTrack) legionTrack('export', { n: all.length });
  } catch (e) {}
}
function weekMoodAvg(all){
  try {
    const cut = Date.now() - 7 * 86400000;
    const moods = (all || []).filter(function (r) {
      const t = r && r.ts ? Date.parse(r.ts) : 0;
      return t >= cut && r.mood > 0;
    }).map(function (r) { return r.mood; });
    if (!moods.length) return 0;
    return Math.round((moods.reduce(function (a, b) { return a + b; }, 0) / moods.length) * 10) / 10;
  } catch (e) { return 0; }
}
function renderHistory(){
  const el = $('historyList'); if (!el) return;
  const all = readJSON(READINGS_KEY, []);
  if (!all.length){ el.innerHTML = '<p class="empty">아직 기록이 없어요. 카드를 뽑으면 여기에 쌓입니다.</p>'; return; }
  const mAvg = weekMoodAvg(all);
  el.innerHTML =
    `<div class="row" style="margin-bottom:10px;gap:8px;flex-wrap:wrap;align-items:center">
      <button type="button" class="btn-quiet" id="exportReadings">⬇ 기록 백업</button>
      ${mAvg ? `<span class="hint">7일 기분 평균 ${mAvg}/5</span>` : ''}
    </div>` +
    all.slice(0, 20).map(r => {
    const names = r.cards.map(c => esc(c.ko) + (c.reversed ? '<i>역</i>' : '')).join(' · ');
    const mood = r.mood ? `<span class="mood-dot" title="그때의 느낌 ${r.mood}/5">${'●'.repeat(r.mood)}${'○'.repeat(5-r.mood)}</span>` : '';
    return `<article class="hist" data-id="${esc(r.id)}">
      <header><b>${esc(r.spreadName)}</b><time>${esc(r.ts.slice(0,10))}</time></header>
      ${r.question ? `<p class="hist-q">“${esc(r.question)}”</p>` : ''}
      <p class="hist-cards">${names}</p>
      ${r.note ? `<p class="hist-note">${esc(r.note)}</p>` : ''}
      ${mood}
    </article>`;
  }).join('');
  const xb = $('exportReadings');
  if (xb) xb.onclick = exportReadingsJSON;
}

// ── 거울 — 쌓인 기록을 되돌려준다 ───────────────────────────────────────────
function renderMirror(){
  const el = $('mirror'); if (!el || !window.TarotCore) return;
  const all = readJSON(READINGS_KEY, []);
  const m = TarotCore.reflect(all);
  if (!m || m.total < 3){
    el.innerHTML = `<p class="empty">리딩이 세 번 이상 쌓이면, 자주 나온 카드와 수트 편중을 여기서 되돌려드려요. (지금 ${all.length}번)</p>`;
    return;
  }
  const bars = m.top.map(t =>
    `<li><span class="bar" style="--w:${Math.round(t.n / m.top[0].n * 100)}%"></span><b>${esc(t.ko)}</b><em>${t.n}회</em></li>`
  ).join('');
  el.innerHTML =
    `<div class="mirror-stats">
       <div><b>${m.total}</b><span>뽑은 카드</span></div>
       <div><b>${m.revPct}%</b><span>역방향</span></div>
       <div><b>${esc(m.topSuitKo)}</b><span>최다 수트</span></div>
       <div><b>${esc(m.topElKo)}</b><span>주된 원소</span></div>
     </div>
     <h3 class="block-label">자주 나온 카드</h3>
     <ul class="mirror-top">${bars}</ul>
     <ul class="mirror-notes">${m.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
}

// ── 저널 — 짧게. 첫 주에 5분 넘게 걸리면 습관이 붙지 않는다 ─────────────────
function resetJournalForm(){
  const n = $('journalNote'); if (n) n.value = '';
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('on'));
  const tagHost = $('journalTags');
  if (tagHost && lastSpread){
    const tags = [];
    lastSpread.forEach(c => String(c.theme).split('·').forEach(t => { t = t.trim(); if (t && tags.indexOf(t) < 0) tags.push(t); }));
    tagHost.innerHTML = tags.slice(0, 10).map(t =>
      `<button type="button" class="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
  }
  const s = $('journalSaved'); if (s) s.textContent = '';
}
function saveJournal(){
  const all = readJSON(READINGS_KEY, []);
  if (!all.length) return;
  all[0].note = ($('journalNote') && $('journalNote').value || '').trim().slice(0, 500);
  const moodOn = document.querySelector('.mood-btn.on');
  all[0].mood = moodOn ? parseInt(moodOn.dataset.mood, 10) : 0;
  all[0].tags = Array.from(document.querySelectorAll('#journalTags .tag.on')).map(b => b.dataset.tag);
  writeJSON(READINGS_KEY, all);
  const s = $('journalSaved'); if (s) s.textContent = '기록에 저장했어요.';
  renderHistory();
}

// ── 카드 상세 (탭하면 열리는 층) ────────────────────────────────────────────
function openCardDetail(idx){
  if (!lastSpread || !lastSpread[idx]) return;
  const c = lastSpread[idx];
  const G = window.TarotGlyphs;
  const rows = TarotCore.cardDetail(c, lastFocus)
    .map(r => `<div class="det-row"><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`).join('');
  $('sheetBody').innerHTML =
    `<div class="det-head${c.reversed ? ' is-rev' : ''}">
       <div class="det-art">${G ? G.glyphFor(c) : ''}</div>
       <div>
         <h2>${esc(c.ko)}</h2>
         <p class="det-en">${esc(c.name)}</p>
         <span class="pill ${c.noOrientation ? 'pill-cross' : (c.reversed ? 'pill-rev' : 'pill-up')}">${esc(TarotCore.directionLabel(c))}</span>
       </div>
     </div>
     <p class="det-read">${esc(TarotCore.interpretCard(c, lastFocus))}</p>
     <dl class="det-rows">${rows}</dl>`;
  const sheet = $('sheet');
  sheet.hidden = false;
  requestAnimationFrame(()=> sheet.classList.add('open'));
  $('sheetClose').focus();
}
function closeSheet(){
  const sheet = $('sheet');
  sheet.classList.remove('open');
  setTimeout(()=>{ sheet.hidden = true; }, 200);
}

// ── 도감 — '점 보는 도구'가 아니라 '배우는 앱'이 되게 하는 층 ───────────────
function renderLibrary(filter){
  const el = $('libraryGrid'); if (!el || !window.TarotCore) return;
  const G = window.TarotGlyphs;
  const list = TarotCore.DECK.filter(c => !filter || filter === 'all' || c.suit === filter);
  el.innerHTML = list.map(c =>
    `<button type="button" class="lib-card" data-id="${esc(c.id)}">
       <span class="lib-rank">${G ? G.rankMark(c) : ''}</span>
       <span class="lib-art">${G ? G.glyphFor(c) : ''}</span>
       <span class="lib-ko">${esc(c.ko)}</span>
     </button>`).join('');
  $('libraryCount').textContent = `${list.length}장`;
}
function openLibraryCard(id){
  const card = TarotCore.DECK.filter(c => c.id === id)[0];
  if (!card) return;
  const G = window.TarotGlyphs;
  const suit = TarotCore.SUITS[card.suit];
  const rows = [];
  if (card.suit === 'major'){
    const j = TarotCore.FOOLS_JOURNEY[card.num === 0 ? 0 : card.sep];
    rows.push(['여정에서의 자리', card.num === 0 ? j.desc : `${j.title} · ${j.sub} — ${j.desc}`]);
  } else {
    rows.push(['수트', `${suit.ko} · ${TarotCore.ELEMENTS[suit.el].ko} — ${suit.theme}`]);
    if (card.numArc)   rows.push(['숫자의 결', card.numArc]);
    if (card.courtArc) rows.push(['코트의 결', card.courtArc]);
  }
  if (card.astro) rows.push(['대응', card.astro]);
  rows.push(['정방향', `${card.up.gist} — ${card.up.theme}`]);
  rows.push(['정방향 조언', card.up.advice]);
  rows.push(['역방향', `${card.rev.gist} — ${card.rev.theme}`]);
  rows.push(['역방향 조언', card.rev.advice]);
  rows.push(['사랑·관계', `정 ${card.up.love} / 역 ${card.rev.love}`]);
  rows.push(['일·재물', `정 ${card.up.work} / 역 ${card.rev.work}`]);

  $('sheetBody').innerHTML =
    `<div class="det-head">
       <div class="det-art">${G ? G.glyphFor(card) : ''}</div>
       <div><h2>${esc(card.ko)}</h2><p class="det-en">${esc(card.name)}</p></div>
     </div>
     <dl class="det-rows">${rows.map(r => `<div class="det-row"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>`;
  const sheet = $('sheet');
  sheet.hidden = false;
  requestAnimationFrame(()=> sheet.classList.add('open'));
}

// ── 배경 아우라 캔버스 ──────────────────────────────────────────────────────
// 스프레드의 원소 구성을 부드러운 층으로 그린다. 순수 검정을 피해 인쇄물 같은 결을 준다.
function drawAura(spread){
  const cv = $('aura'); if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 320, h = 92;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#0b0908'; ctx.fillRect(0,0,w,h);
  const HUE = { fire:14, water:205, air:48, earth:112 };
  for (let g = 3; g >= 0; g--){
    spread.forEach((c,i) => {
      const hue = HUE[c.el] != null ? HUE[c.el] : 42;
      const x = w * ((i + 0.5) / spread.length);
      const y = h * 0.5 + Math.sin(i * 1.6) * (5 + g);
      const r = 10 + g * 5;
      const grd = ctx.createRadialGradient(x, y, 1, x, y, r);
      grd.addColorStop(0, `hsla(${hue},46%,66%,${c.reversed ? 0.10 : 0.16})`);
      grd.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    });
  }
  // 미세한 그레인 — 그라디언트 밴딩을 없애고 질감을 준다
  const img = ctx.getImageData(0,0,cv.width,cv.height), d = img.data;
  for (let i = 0; i < d.length; i += 4){
    const n = (Math.random() - 0.5) * 12;
    d[i] += n; d[i+1] += n; d[i+2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

const TAROT_SHARE_BASE = 'https://hosuman08-netizen.github.io/tarot-oracle/';
function tarotKId() {
  try {
    var id = localStorage.getItem('tarot_k_id');
    if (!id) { id = 't' + Math.random().toString(36).slice(2, 8); localStorage.setItem('tarot_k_id', id); }
    return id;
  } catch (e) { return 'share'; }
}
function getTarotShareUrl() {
  return TAROT_SHARE_BASE + '?utm_source=share&utm_medium=app&ref=' + encodeURIComponent(tarotKId());
}
function captureTarotKRef() {
  try {
    var q = new URLSearchParams(location.search || '');
    var ref = q.get('ref');
    if (!ref || ref === 'share') return;
    if (ref === tarotKId()) return;
    if (!localStorage.getItem('tarot_k_from')) {
      localStorage.setItem('tarot_k_from', ref);
      var n = (parseInt(localStorage.getItem('tarot_k_inbound') || '0', 10) || 0) + 1;
      localStorage.setItem('tarot_k_inbound', String(n));
      if (window.legionTrack) try { legionTrack('k_link', { from: ref }); } catch (e) {}
    }
  } catch (e) {}
}

// ── 공유 ────────────────────────────────────────────────────────────────────
function shareText(){
  if (!lastSpread || !lastSpread.length) return '오늘의 타로 리딩을 뽑아봤어요.';
  const key = lastSpread[0];
  const names = lastSpread.map(c => c.ko).join(' · ');
  const spec = TarotCore.SPREADS[lastSpreadKey] || {};
  return `${spec.name || '타로 리딩'} — ${names}\n`
    + `${key.ko} ${TarotCore.directionLabel(key)}: ${TarotCore.focusMeaning(key, lastFocus)}\n\n`
    + `무료 타로 리딩 → ${getTarotShareUrl()}`;
}

// 공유 이미지 — 카드가 실제로 보이는 한 장. 외부 요청 없이 캔버스로 굽는다.
function loadImg(src){
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}
async function renderShareImage(){
  const W = 1080;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  cv.width = W; cv.height = 100;

  const show = lastSpread.slice(0, 5);
  const cw = Math.min(190, (W - 160) / show.length - 18), ch = cw * 1.62;
  const top = 230;

  // 1차 패스 — 해설을 미리 줄바꿈해서 필요한 높이를 구한다.
  // (짧은 리딩인데 아래가 텅 비는 걸 막으려면 캔버스를 내용에 맞춰야 한다)
  ctx.font = '25px system-ui, -apple-system, sans-serif';
  const maxW = W - 200;
  const bodyLines = [];
  let ln = '';
  for (const wd of String(lastNarrative).replace(/【[^】]*】/g, '').split(' ')){
    const test = ln ? ln + ' ' + wd : wd;
    if (ctx.measureText(test).width > maxW){
      bodyLines.push(ln); ln = wd;
      if (bodyLines.length >= 12){ ln = ln + ' …'; break; }
    } else ln = test;
  }
  if (ln) bodyLines.push(ln);

  const bodyTop = top + ch + 90;
  const H = Math.max(1080, Math.round(bodyTop + bodyLines.length * 40 + 150));
  cv.height = H;

  ctx.fillStyle = '#0b0908'; ctx.fillRect(0,0,W,H);
  // 부드러운 금빛 후광
  const g = ctx.createRadialGradient(W/2, H*0.34, 40, W/2, H*0.34, W*0.72);
  g.addColorStop(0, 'rgba(197,164,110,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  ctx.strokeStyle = 'rgba(197,164,110,0.34)'; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W-80, H-80);

  const spec = TarotCore.SPREADS[lastSpreadKey] || {};
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c5a46e';
  ctx.font = '600 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(spec.name || '타로 리딩', W/2, 118);
  if (lastQuestion){
    ctx.fillStyle = '#9a8c72';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText('“' + lastQuestion.slice(0, 30) + '”', W/2, 160);
  }

  // 카드 — 최대 5장까지 나란히
  const gap = 18, totalW = show.length * cw + (show.length - 1) * gap;
  let x = (W - totalW) / 2;

  for (const c of show){
    ctx.save();
    ctx.strokeStyle = c.reversed ? 'rgba(190,120,100,0.6)' : 'rgba(197,164,110,0.6)';
    ctx.fillStyle = '#12100d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, top, cw, ch, 12); else ctx.rect(x, top, cw, ch);
    ctx.fill(); ctx.stroke();
    try {
      const im = await loadImg(window.TarotGlyphs.glyphDataUri(c, c.reversed ? '#d99f8c' : '#c5a46e'));
      const gs = cw * 0.52;
      ctx.save();
      ctx.translate(x + cw/2, top + ch*0.42);
      if (c.reversed) ctx.rotate(Math.PI);
      ctx.drawImage(im, -gs/2, -gs/2, gs, gs);
      ctx.restore();
    } catch(e){ /* 글리프를 못 그려도 카드는 나온다 */ }
    ctx.fillStyle = c.reversed ? '#e0b0a0' : '#e8d9b8';
    ctx.font = '600 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(c.ko, x + cw/2, top + ch*0.76);
    ctx.fillStyle = '#8b7a5c';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText(c.reversed ? '역방향' : (c.noOrientation ? '가로' : '정방향'), x + cw/2, top + ch*0.86);
    ctx.restore();
    x += cw + gap;
  }

  // 해설 — 1차 패스에서 잡아둔 줄을 그대로 그린다
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d8cdb6';
  ctx.font = '25px system-ui, -apple-system, sans-serif';
  bodyLines.forEach((l, i) => ctx.fillText(l, 100, bodyTop + i * 40));

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a6a4e';
  ctx.font = '19px system-ui, -apple-system, sans-serif';
  ctx.fillText('라이더-웨이트-스미스 기준 · 엔터테인먼트용 리딩', W/2, H - 92);
  ctx.fillStyle = '#c5a46e';
  ctx.font = '600 21px system-ui, -apple-system, sans-serif';
  ctx.fillText('타로 리딩', W/2, H - 56);

  return new Promise(res => cv.toBlob(res, 'image/png'));
}

async function shareReading(){
  if (!lastSpread){ toast('먼저 카드를 뽑아주세요.'); return; }
  if (window.legionTrack) legionTrack('share');
  crossSync();
  const text = shareText();
  try {
    const blob = await renderShareImage();
    if (blob){
      const file = new File([blob], 'tarot-reading.png', { type:'image/png' });
      if (navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], text });
        return;
      }
      // 이미지 공유가 안 되는 환경 → 이미지를 내려받게 하고 문구는 복사
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'tarot-reading.png'; a.click();
      setTimeout(()=> URL.revokeObjectURL(url), 4000);
      copyText(text, '이미지를 저장하고 문구를 복사했어요.');
      return;
    }
  } catch(e){ /* 아래 텍스트 공유로 내려간다 */ }
  if (navigator.share){ navigator.share({ title:'오늘의 타로 리딩', text }).catch(()=>{}); return; }
  copyText(text, '공유 문구를 복사했어요.');
}
function shareToX(){
  if (!lastSpread){ toast('먼저 카드를 뽑아주세요.'); return; }
  if (window.legionTrack) legionTrack('share');
  crossSync();
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
}
function copyText(text, msg){
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=> toast(msg)).catch(()=> prompt('아래 문구를 복사하세요:', text));
  } else prompt('아래 문구를 복사하세요:', text);
}

// ── 음성 ────────────────────────────────────────────────────────────────────
function speakReading(){
  if (!lastSpread){ toast('먼저 카드를 뽑아주세요.'); return; }
  if (!('speechSynthesis' in window)){ toast('이 브라우저에서는 음성 읽기를 지원하지 않아요.'); return; }
  if (speechSynthesis.speaking){ speechSynthesis.cancel(); return; }
  const u = new SpeechSynthesisUtterance(String(lastNarrative).replace(/【|】/g, ' '));
  u.lang = 'ko-KR'; u.rate = 0.96;
  speechSynthesis.speak(u);
}

// ── 토스트 ──────────────────────────────────────────────────────────────────
function toast(msg){
  let t = $('toast');
  if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.classList.remove('show'), 2400);
}

// 다른 미니앱과 공유하는 로컬 값 갱신 (되돌림 가능·이 기기 안에서만)
function crossSync(){
  try {
    const r = readJSON(CODEX_KEY, [])[0];
    if (!r) return;
    localStorage.setItem('p21_fate_to_p9',  JSON.stringify({ score:r.score||60, ts:Date.now() }));
    localStorage.setItem('p21_fate_to_p11', JSON.stringify({ relicPower:r.power, aura:'tarot', ts:Date.now() }));
  } catch(e){}
}

// ── 초기화 ──────────────────────────────────────────────────────────────────
function init(){
  captureTarotKRef();
  const p = prefs();
  const rev = $('revToggle');
  if (rev){
    rev.checked = p.reversals;
    rev.addEventListener('change', () => { setPref('reversals', rev.checked); renderDaily(); });
  }

  document.querySelectorAll('[data-spread]').forEach(btn =>
    btn.addEventListener('click', () => drawReading(btn.dataset.spread)));

  const cardsHost = $('cards');
  if (cardsHost){
    cardsHost.addEventListener('click', e => {
      const el = e.target.closest('.tcard'); if (el) openCardDetail(parseInt(el.dataset.idx, 10));
    });
    cardsHost.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target.closest('.tcard');
      if (el){ e.preventDefault(); openCardDetail(parseInt(el.dataset.idx, 10)); }
    });
  }
  const interp = $('interp');
  if (interp) interp.addEventListener('click', e => {
    const li = e.target.closest('li[data-idx]'); if (li) openCardDetail(parseInt(li.dataset.idx, 10));
  });

  const sheet = $('sheet');
  if (sheet){
    $('sheetClose').addEventListener('click', closeSheet);
    sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  }

  const tagHost = $('journalTags');
  if (tagHost) tagHost.addEventListener('click', e => {
    const b = e.target.closest('.tag'); if (b) b.classList.toggle('on');
  });
  document.querySelectorAll('.mood-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  }));
  const js = $('journalSave'); if (js) js.addEventListener('click', saveJournal);

  const sb = $('shareBtn');   if (sb) sb.addEventListener('click', shareReading);
  const xb = $('shareXBtn');  if (xb) xb.addEventListener('click', shareToX);
  const vb = $('speakBtn');   if (vb) vb.addEventListener('click', speakReading);

  const libFilter = $('libFilter');
  if (libFilter) libFilter.addEventListener('click', e => {
    const b = e.target.closest('button[data-suit]'); if (!b) return;
    libFilter.querySelectorAll('button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    renderLibrary(b.dataset.suit);
  });
  const grid = $('libraryGrid');
  if (grid) grid.addEventListener('click', e => {
    const b = e.target.closest('.lib-card'); if (b) openLibraryCard(b.dataset.id);
  });

  const school = $('schoolNote');
  if (school && window.TarotCore){
    const s = TarotCore.SCHOOL;
    school.textContent = `${s.deck} 기준 · ${s.numbering} · 코트 ${s.court} · 켈틱 크로스 ${s.celtic}`;
  }

  renderDaily();
  renderStreak();
  setInterval(function () { try { renderStreak(); } catch (e) {} }, 60000);
  renderMirror();
  renderHistory();
  renderLibrary('all');

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// 하위 호환용 전역
window.drawTarot = drawTarot;
window.drawReading = drawReading;
window.shareTarotResult = shareReading;
window.shareTarotToX = shareToX;
window.voiceTarot = speakReading;
window.showCodex = renderHistory;
window.__renderShareImage = renderShareImage; // 검증 하니스에서 공유 이미지 생성을 직접 호출

// 3H Co-Star tarot daily focus
(function dailyFocusTarot(){
  try {
    var k = 'tarot_daily_focus_' + new Date().toISOString().slice(0,10);
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, '1');
    setTimeout(function(){
      if (typeof toast === 'function') toast('☀️ 오늘 카드 한 장 — 30초');
      if (window.legionTrack) legionTrack('daily_focus', {});
    }, 800);
  } catch(e) {}
})();
