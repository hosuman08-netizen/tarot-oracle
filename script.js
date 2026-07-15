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

function drawTarot(n) {
  const useBoost = document.getElementById('p20boost') && document.getElementById('p20boost').checked;
  const spread = [];
  LilithTarot.update();
  const saju = parseInt((JSON.parse(localStorage.getItem('fateCodex')||'[]')[0]||{score:60}).score||60);
  for(let i=0;i<n;i++){
    let c = fullDeck[Math.floor(Math.random()*fullDeck.length)];
    if (Math.random() > 0.67) c = c + ' (거의 Major)';
    if(useBoost && Math.random()>0.48) c += ` (사주${saju%5+1} boost)`;
    spread.push(c);
  }
  const interp = getInterp(spread, useBoost, saju);
  const posLabels = n===3 ? ['과거','현재','미래'] : n===5 ? ['상황','도전','뿌리','흐름','결과'] : ['오늘'];
  document.getElementById('cards').innerHTML = spread.map((c,i)=>{
    const pos = posLabels[i] ? `<span class="card-pos">${posLabels[i]}</span>` : '';
    return `<div class="card">${pos}<span class="card-name">${c}</span><span class="card-mean">${cardMeaning(c)}</span></div>`;
  }).join('');
  const resoTxt = interp.near ? '공명이 가까스로 스쳤다 — 다시 뽑으면 닿을지도.'
    : interp.pity ? '흐름이 다시 너에게 기운다.'
    : '카드의 결이 조용히 정렬됐다.';
  document.getElementById('interp').innerHTML = interp.text + `<div style="font-size:0.68rem;opacity:.55;margin-top:6px;font-style:italic">${resoTxt}</div>`;
  document.getElementById('spread').style.display='block';
  drawTarotCanvas(spread, interp.score);
  recordToCodex('tarot', interp.text, interp.score + (useBoost?12:0), {multi:interp.multi, near:interp.near});
  mutateSharedFateTarot(interp.score);
  if (Math.random() > 0.82) birthTarotSpore();
}

function getInterp(cards, boosted, sajuBoost=0) {
  const base = cards.join(' · ') + (boosted ? ' — 사주와 공명' : '');
  const raw = 42 + Math.floor(Math.random()*38) + Math.floor(sajuBoost/14);
  let score = LilithTarot.varDraw(raw);
  score = LilithTarot.nearMiss(score);
  const isLow = score < 61;
  if (isLow) tarotPity++;
  localStorage.setItem('tarotPity', tarotPity);
  score = LilithTarot.pityBoost(score);
  const multi = 0.82 + LilithTarot.resonance * 0.5 + (Math.random()>0.82?0.35:0);
  const final = Math.max(28, Math.min(99, Math.floor(score * multi)));
  const near = (final % 5 === 0) || Math.random()>0.63;
  const pity = tarotPity >= 2;
  return { text: base + `<br>해석 지수: ${final}`, score: final, multi, near, pity };
}

function voiceTarot() {
  const t = document.getElementById('interp').textContent || '타로 먼저 뽑으세요';
  const u = new SpeechSynthesisUtterance('p6: ' + t);
  u.lang='ko-KR'; speechSynthesis.speak(u);
  const r = LilithTarot.resonance || 0.5;
  if (r > 0.5) document.getElementById('interp').innerHTML += `<br><small>p6 surprise x${(r*1.8).toFixed(1)}</small>`;
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
  const golden = 0.618;
  // Sfumato tarot spread (soft layered positions)
  for (let g=0; g<4; g++) {
    ctx.strokeStyle = `hsla(42,55%,74%,${0.22 - g*0.04})`;
    ctx.lineWidth = 1.6 - g*0.2; ctx.shadowBlur = 5 + g*1.5;
    const spreadW = w * (0.72 + g*0.04);
    cards.forEach((_,i) => {
      const x = w*0.5 + (i - (cards.length-1)/2) * (spreadW / (cards.length+0.6));
      const y = h*0.5 + Math.sin(i*1.7)* (9 + g);
      ctx.beginPath(); ctx.arc(x, y, 13 + g*1.2, 0, Math.PI*2); ctx.stroke();
      // small golden inner
      if (g===0) { ctx.lineWidth=0.7; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.stroke(); ctx.lineWidth=1.6; }
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