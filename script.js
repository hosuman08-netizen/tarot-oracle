// p21 Tarot + p20 cross + p6 + Codex
// LILITH PSYCH FULL-CHEAT: variable ratio draws, near-miss card reveals, surprise multipliers, pity for bad spreads, endowment on personal Codex + cross p20
const TAROT = ["The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant","The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man","Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World"];
const fullDeck = TAROT;
// Major Arcana 정방향 키워드 (엔터테인먼트용) — 카드에 실제 의미 부여
const TAROT_MEANING = {
  "The Fool":"새 시작·모험","The Magician":"의지·실현","The High Priestess":"직관·비밀",
  "The Empress":"풍요·돌봄","The Emperor":"질서·주도","The Hierophant":"전통·배움",
  "The Lovers":"선택·관계","The Chariot":"추진·승리","Strength":"용기·인내",
  "The Hermit":"성찰·고독","Wheel of Fortune":"전환점·운","Justice":"균형·인과",
  "The Hanged Man":"멈춤·전환의 시선","Death":"끝과 재생","Temperance":"조화·절제",
  "The Devil":"집착·유혹","The Tower":"급변·해방","The Star":"희망·치유",
  "The Moon":"불안·환영","The Sun":"활력·성취","Judgement":"각성·부름","The World":"완성·통합"
};
function cardMeaning(raw){ const base=raw.replace(/\s*\(.*/,'').trim(); return TAROT_MEANING[base]||'미지의 결'; }
const CODEX_KEY = 'fateCodex';
let tarotPity = parseInt(localStorage.getItem('tarotPity')||'0');
let tarotLuck = parseFloat(localStorage.getItem('tarotLuck')||'1.0');

const LilithTarot = {
  resonance: 0.48,
  update() { this.resonance = 0.32 + Math.random()*0.61; return this.resonance; },
  varDraw(base) {
    // variable ratio centered near 1.0 so scores keep a real spread (not always maxed)
    const v = 0.72 + Math.random()*0.58;
    return Math.floor(base * v * (0.82 + this.resonance*0.3) * tarotLuck);
  },
  nearMiss(score) {
    if (Math.random() > 0.59) return Math.min(97, score + (Math.random()>0.5 ? 7 : -2));
    return score;
  },
  pityBoost(s) { if (tarotPity>=2) { tarotPity=0; localStorage.setItem('tarotPity','0'); return Math.min(98, s+15); } return s; }
};

function updateFomo() {
  const el=document.getElementById('fomo');
  const k = new Date().toDateString();
  if(localStorage.getItem('tarotFomo')!==k){ localStorage.setItem('tarotFomo',k); tarotPity=0; localStorage.setItem('tarotPity','0'); }
  el.textContent = `오늘 드로우 가능 • luck ${(tarotLuck*100|0)}%`;
}

// 실제 타로 코어(tarot-core.js)로 드로우 — 중복없는 셔플 + 정/역방향 + 포지션 해석
let lastSpread = null;
function drawTarot(n) {
  if (!window.TarotCore) { alert('타로 엔진 로딩 중입니다. 잠시 후 다시.'); return; }
  const useBoost = document.getElementById('p20boost') && document.getElementById('p20boost').checked;
  LilithTarot.update();
  const saju = parseInt((JSON.parse(localStorage.getItem('fateCodex')||'[]')[0]||{score:60}).score||60);

  // 진짜 셔플 드로우: 카드 중복 없음, 각 카드 정/역방향, 포지션별 역할 부여
  const spread = TarotCore.drawSpread(n);
  lastSpread = spread;

  // 카드 렌더 — 방향(정/역)과 포지션 역할을 실제로 표시
  document.getElementById('cards').innerHTML = spread.map((c)=>{
    const dirBadge = c.reversed
      ? '<span class="card-rev" title="역방향">⟲ 역방향</span>'
      : '<span class="card-up" title="정방향">정방향</span>';
    const boostTag = (useBoost && c.name) ? `<span class="card-boost" title="사주 연동">사주 공명</span>` : '';
    return `<div class="card${c.reversed?' is-reversed':''}">`
      + `<span class="card-pos">${c.position}</span>`
      + `<span class="card-name">${c.ko} · ${c.name}</span>`
      + `<span class="card-dir">${dirBadge}${boostTag}</span>`
      + `<span class="card-mean">${c.gist}</span>`
      + `</div>`;
  }).join('');

  // 실제 종합 해석 서사 (카드×포지션×방향을 엮음)
  const narrative = TarotCore.synthesize(spread);
  // 개별 카드 조언 목록
  const perCard = spread.map(c => `<li><b>${c.position}</b> — ${TarotCore.interpretCard(c).replace(/^[^—]+— /,'')}</li>`).join('');
  const boostLine = useBoost
    ? `<div style="font-size:0.68rem;color:#a8c;margin-top:4px">p20 사주(${saju}) 연동: 각 카드의 조언을 오늘의 사주 흐름과 겹쳐 읽어보라.</div>` : '';

  document.getElementById('interp').innerHTML =
      `<div class="reading-narrative">${narrative}</div>`
    + `<ul class="reading-list">${perCard}</ul>`
    + boostLine;

  document.getElementById('spread').style.display='block';
  drawTarotCanvas(spread, spreadScore(spread));

  // Codex 기록엔 실제 리딩 요약 저장
  const summary = spread.map(c=>`${c.ko}${c.reversed?'(역)':''}`).join('·');
  recordToCodex('tarot', summary + ' — ' + narrative, spreadScore(spread), {reversed: spread.filter(c=>c.reversed).length});
  mutateSharedFateTarot(spreadScore(spread));
  if (Math.random() > 0.82) birthTarotSpore();
}

// 리딩의 '결' 지수 — 정방향/역방향 구성에서 파생(엔터테인먼트용, 코드=표시 일치)
function spreadScore(spread){
  const up = spread.filter(c=>!c.reversed).length;
  const ratio = up / spread.length;               // 정방향 비율
  return Math.round(45 + ratio * 45 + LilithTarot.resonance * 8); // 45~98 범위
}

function voiceTarot() {
  if (!lastSpread) { alert('타로 먼저 뽑으세요.'); return; }
  // 실제 리딩 서사를 음성으로 — 카드/포지션/방향을 또박또박
  const parts = lastSpread.map(c => `${c.position}, ${c.ko} ${c.reversed?'역방향':'정방향'}. ${c.gist}.`);
  const text = window.TarotCore ? TarotCore.synthesize(lastSpread) : parts.join(' ');
  const u = new SpeechSynthesisUtterance(text);
  u.lang='ko-KR'; u.rate=0.96; speechSynthesis.speak(u);
}

function unlockTarotPremium() {
  if (!confirm('p10 Credits 사용 — FICTIONAL ONLY. NO REAL VALUE. Proceed?')) return;
  const extra = 'PREMIUM: p20+p21 듀오 종합 운명 리포트 생성. Codex 자동 강화.';
  document.getElementById('interp').innerHTML += '<br><b>'+extra+'</b> <span style="color:#a8c">Limited Banner FOMO active.</span>';
  recordToCodex('tarot-premium', extra, 92);
  triggerTarotBanner();
}

function recordToCodex(type, text, score, extra={}) {
  let codex=JSON.parse(localStorage.getItem(CODEX_KEY)||'[]');
  const relic = { ts:new Date().toISOString(), type, text:text.slice(0,108), score:Math.min(99,score||60), relicLv: (extra.near?2:1), power: Math.floor((score||60)*(0.7+LilithTarot.resonance*0.4)), multi:extra.multi||1 };
  codex.unshift(relic);
  localStorage.setItem(CODEX_KEY, JSON.stringify(codex.slice(0,18)));
  showCodex();
}

function showCodex() {
  const el = document.getElementById('codexList');
  const data = JSON.parse(localStorage.getItem(CODEX_KEY)||'[]');
  if (!data.length) { el.innerHTML = '기록 없음. Re-observe Codex로 birth.'; return; }
  el.innerHTML = data.map((d,i)=>`<div class="card relic" data-idx="${i}">${d.ts.slice(5,10)} [${d.type}] ${d.text} <small>Lv${d.relicLv||1} p${d.power||d.score} x${(d.multi||1).toFixed(1)} — Click Re-observe → Birth</small></div>`).join('');
  el.onclick = (e) => {
    const el2 = e.target.closest('.relic'); if (!el2) return;
    reObserveCodexTarot(parseInt(el2.dataset.idx||'0'));
  };
}

// Re-observe Codex mutates UI (births) — p21 tarot spreads evolve
function reObserveCodexTarot(idx) {
  let data = JSON.parse(localStorage.getItem(CODEX_KEY)||'[]'); if (!data[idx]) return;
  const r = data[idx]; r.power = Math.min(99,(r.power||r.score||58)+5); r.relicLv=(r.relicLv||1)+1; data[idx]=r;
  localStorage.setItem(CODEX_KEY, JSON.stringify(data));
  const c = document.getElementById('tarot-canvas');
  if (c) {
    const ctx = c.getContext('2d');
    ctx.strokeStyle='hsla(42,62%,81%,0.3)'; ctx.lineWidth=2.3;
    ctx.beginPath(); ctx.arc(c.width*0.5, c.height*0.5, 38, 0, Math.PI*2); ctx.stroke();
  }
  // feed lung + birth
  try { const lung=JSON.parse(localStorage.getItem('p6_lungFragment')||'{}'); lung.breath=(lung.breath||0.4)+0.09; localStorage.setItem('p6_lungFragment',JSON.stringify(lung));
    if (window.p6LungSurpriseEye && c) window.p6LungSurpriseEye(c.getContext('2d'),c.width,c.height*0.5,lung,0.42,{wound:0.5},0.2);
  }catch(e){}
  const b=document.createElement('div'); b.className='card'; b.style.cssText='font-size:0.76rem;margin-top:4px;border-color:#c5a46e';
  b.textContent=`✧ Birth: ${r.type} re-observed (sfumato spread mutates)`; document.getElementById('codex').appendChild(b);
  showCodex();
}

function triggerTarotBanner() {
  // FOMO limited for p21
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:#221a35;color:#c9a;padding:3px 10px;border:1px solid #a38cd1;font-size:0.7rem';
  b.textContent = '🌕 LIMITED ARCANA WINDOW — FOMO 1 draw boost • fictional';
  document.body.appendChild(b);
  setTimeout(()=>b.remove(), 38000);
}

window.onload = () => {
  updateFomo();
  showCodex();
  addCrossNavP21();
  startTarotFomoTimer();
  const f = document.querySelector('footer');
  if (f) f.innerHTML = '<small>픽션 AI 리딩 · 엔터테인먼트 전용 · 실제 운명/조언 아님 · 18+ · 되돌림 가능</small>';
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  if (window.getP6LungSurprise) console.log('[p21] p6 lung + canvas ready');
};

// helpers injected
function drawTarotCanvas(cards, score) {
  const c = document.getElementById('tarot-canvas'); if (!c) return;
  const ctx = c.getContext('2d'); const w = c.width, h = c.height;
  ctx.fillStyle = '#0a0806'; ctx.fillRect(0,0,w,h);
  // Sfumato tarot spread (soft layered positions) — cards may be objects {reversed}
  for (let g=0; g<4; g++) {
    ctx.lineWidth = 1.6 - g*0.2; ctx.shadowBlur = 5 + g*1.5;
    const spreadW = w * (0.72 + g*0.04);
    cards.forEach((cd,i) => {
      const reversed = cd && cd.reversed;
      // 역방향 카드는 붉은 기운, 정방향은 금빛 — 실제 방향을 시각화
      ctx.strokeStyle = reversed
        ? `hsla(8,52%,62%,${0.24 - g*0.04})`
        : `hsla(42,55%,74%,${0.22 - g*0.04})`;
      const x = w*0.5 + (i - (cards.length-1)/2) * (spreadW / (cards.length+0.6));
      const y = h*0.5 + Math.sin(i*1.7)* (9 + g);
      ctx.beginPath(); ctx.arc(x, y, 12 + g*1.1, 0, Math.PI*2); ctx.stroke();
      // 역방향 표식: 아래로 향한 짧은 획
      if (g===0 && reversed) { ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(x,y-5); ctx.lineTo(x,y+7); ctx.stroke(); ctx.lineWidth=1.6; }
      else if (g===0) { ctx.lineWidth=0.7; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.stroke(); ctx.lineWidth=1.6; }
    });
  }
  ctx.shadowBlur=0;
  // p6 lung eye on tarot spread (real integration)
  const lung = JSON.parse(localStorage.getItem('p6_lungFragment')||'{}');
  if (window.p6LungSurpriseEye) window.p6LungSurpriseEye(ctx, w, h*0.5, lung, 0.5, {wound:0.4+(score||0)*0.002}, 0.28);
  ctx.fillStyle='#8b6f47'; ctx.font='9px system-ui'; ctx.fillText('Tarot Spread', 22, h-8);
}
function mutateSharedFateTarot(v){ let p=JSON.parse(localStorage.getItem('fateCodex')||'[]'); if(p[0]){p[0].score=Math.min(99,(p[0].score||60)+Math.floor(v*0.03)); localStorage.setItem('fateCodex',JSON.stringify(p));} }
function birthTarotSpore(){ let a=JSON.parse(localStorage.getItem('legion_birth_artifacts')||'[]'); a.unshift({id:'ts'+Date.now(),from:'p21',power:5+Math.random()*12|0}); localStorage.setItem('legion_birth_artifacts',JSON.stringify(a.slice(0,9))); }
function addCrossNavP21(){ const n=document.createElement('div'); n.innerHTML='<button onclick="window.open(\'../p20-saju-miniapp/index.html\',\'_blank\')">p20 Saju</button> <button onclick="window.open(\'../p17-coin-wallet-app/index.html\',\'_blank\')">p17</button>'; document.body.appendChild(n); }
function startTarotFomoTimer(){ setInterval(()=>{const e=document.getElementById('fomo'); if(e) e.textContent = e.textContent.includes('가능') ? '드로우 가능 (FOMO)' : e.textContent;}, 40000); }

// === NIOBE VIRAL UPGRADE: p21 "Fate Share" (symmetric to p20) ===
// Codex relic export + surprise story share. Cross p9/p11. K + retention. Fictional shield.
function fateShare(fromCodex=false) {
  const CODEX_KEY = 'fateCodex';
  let codex = JSON.parse(localStorage.getItem(CODEX_KEY) || '[]');
  if (!codex.length) { alert('타로 드로우 먼저.'); return; }
  const relic = fromCodex ? codex[0] : codex[0];
  const story = `🌌 MY Fate Relic (p21 Tarot) — ${relic.text}\nLv${relic.relicLv||1} p${relic.power||relic.score} x${(relic.multi||1).toFixed(1)}\np20+p21 Destiny Duo • p6 Lung\n\n운명의 Codex. 공유해 네 이야기를 더하라.\nFICTIONAL ONLY • 18+ • Prominent disclosure • NO real advice • Reversible.\n\n#DestinyDuo p20+p21\n👉 ${location.href}`;
  navigator.clipboard.writeText(story).then(() => {
    const bonus = 7 + Math.floor((relic.power||60)/11);
    let bal = parseFloat(localStorage.getItem('p10_balance')||'1284') + bonus; localStorage.setItem('p10_balance', bal.toFixed(2));
    try {
      localStorage.setItem('p21_fate_to_p9', JSON.stringify({score:relic.score||60, ts:Date.now()}));
      localStorage.setItem('p21_fate_to_p11', JSON.stringify({relicPower:relic.power, aura:'tarot', ts:Date.now()}));
    } catch(e){}
    alert(`✅ Fate Share copied. +${bonus} bonus. p9 live + p11 seeded.\nFictional. Prominent disclosure.`);
  }).catch(()=>prompt('Copy:', story));
}