// p21 Tarot — 실제 리딩은 tarot-core.js(TarotCore)가 담당. 이 파일은 UI·Codex·크로스 연동.
const CODEX_KEY = 'fateCodex';

// resonance: 캔버스/서사에 미세한 무작위 결을 주는 값(엔터테인먼트용). 매 드로우마다 갱신.
const LilithTarot = {
  resonance: 0.48,
  update() { this.resonance = 0.32 + Math.random()*0.61; return this.resonance; }
};

function updateFomo() {
  const el=document.getElementById('fomo');
  if (!el) return;
  el.textContent = '오늘 드로우 가능 · 셔플 후 카드를 뽑으세요';
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
    ? `<div style="font-size:0.68rem;color:#a8c;margin-top:4px">사주 흐름(${saju}) 함께 읽기: 각 카드의 조언을 오늘의 사주 흐름과 겹쳐 읽어보세요.</div>` : '';

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
  if (!confirm('상세 리딩을 여시겠어요? — 픽션 엔터테인먼트 전용 · 실제 가치 없음')) return;
  const extra = '상세 리딩: 사주와 타로를 함께 엮은 종합 이야기가 기록에 추가됐어요.';
  document.getElementById('interp').innerHTML += '<br><b>'+extra+'</b> <span style="color:#a8c">오늘 한정 리딩</span>';
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
  if (!data.length) { el.innerHTML = '아직 기록이 없어요. 카드를 뽑으면 여기에 쌓여요.'; return; }
  const typeLabel = { 'tarot':'타로', 'tarot-premium':'상세 리딩' };
  el.innerHTML = data.map((d,i)=>`<div class="card relic" data-idx="${i}">${d.ts.slice(5,10)} [${typeLabel[d.type]||'타로'}] ${d.text} <small>Lv${d.relicLv||1} · 기운 ${d.power||d.score} · x${(d.multi||1).toFixed(1)} — 눌러서 다시 보기</small></div>`).join('');
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
  const typeLabel = { 'tarot':'타로', 'tarot-premium':'상세 리딩' };
  b.textContent=`✧ ${typeLabel[r.type]||'타로'} 리딩을 다시 보며 기운이 깊어졌어요`; document.getElementById('codex').appendChild(b);
  showCodex();
}

function triggerTarotBanner() {
  // FOMO limited for p21
  const b = document.createElement('div');
  b.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:#221a35;color:#c9a;padding:3px 10px;border:1px solid #a38cd1;font-size:0.7rem';
  b.textContent = '🌕 오늘 한정 리딩 · 픽션 엔터테인먼트';
  document.body.appendChild(b);
  setTimeout(()=>b.remove(), 38000);
}

window.onload = () => {
  updateFomo();
  showCodex();
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
function startTarotFomoTimer(){ setInterval(()=>{const e=document.getElementById('fomo'); if(e) e.textContent = e.textContent.includes('가능') ? '오늘의 카드 드로우 가능' : e.textContent;}, 40000); }

// === 결과 공유 (유저용) ===
// 매력적인 공유 문안 자동생성 → navigator.share 우선 → 실패시 클립보드 + 토스트.
// 정직: 픽션 엔터테인먼트, 과장 없음. 내부 크로스 연동은 _tarotCrossSync가 조용히 처리.

// 방금 뽑은 스프레드(있으면)에서 대표 카드 요약 + 호기심 훅을 만든다
function buildTarotShareText() {
  let headline, hook;
  if (lastSpread && lastSpread.length) {
    const key = lastSpread[0];
    const dir = key.reversed ? '역방향' : '정방향';
    const names = lastSpread.map(c => c.ko).join('·');
    headline = `오늘 뽑은 타로는 ${key.ko}(${dir})${lastSpread.length>1?` 외 ${lastSpread.length-1}장 (${names})`:''}.`;
    hook = key.reversed
      ? '돌아보게 하는 카드가 나왔어. 너는 어떤 카드가 나올까?'
      : '흐름이 좋게 읽히는 카드. 너의 오늘 카드도 궁금하다 👀';
  } else {
    // Codex 최근 기록으로 폴백
    const codex = JSON.parse(localStorage.getItem(CODEX_KEY) || '[]');
    const r = codex[0];
    headline = r ? `오늘의 타로 리딩 — ${r.text}` : '오늘의 타로 리딩을 뽑아봤어.';
    hook = '너도 오늘 카드 한 장 뽑아봐 👀';
  }
  return `🔮 ${headline}\n${hook}\n\n무료 타로 리딩 → ${location.href}\n#타로 #오늘의타로 #타로카드`;
}

// 가벼운 토스트 (복사됨 등)
function showTarotToast(msg) {
  let t = document.getElementById('tarot-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tarot-toast';
    t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#221a35;color:#f5f1e6;padding:9px 16px;border:1px solid #a38cd1;border-radius:8px;font-size:0.82rem;z-index:9999;opacity:0;transition:opacity .18s;box-shadow:0 4px 16px rgba(0,0,0,.4)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(()=>{ t.style.opacity='1'; });
  clearTimeout(t._h);
  t._h = setTimeout(()=>{ t.style.opacity='0'; }, 2200);
}

// 결과 공유하기 — 메인 버튼
function shareTarotResult() {
  const codex = JSON.parse(localStorage.getItem(CODEX_KEY) || '[]');
  if (!lastSpread && !codex.length) { alert('타로를 먼저 뽑아주세요.'); return; }
  const text = buildTarotShareText();
  _tarotCrossSync(codex[0]); // 내부 크로스 연동 (유저 비노출)

  if (navigator.share) {
    navigator.share({ title: '오늘의 타로 리딩', text }).catch(()=>{});
    return;
  }
  // navigator.share 미지원 → 클립보드 복사 + 토스트
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(()=> showTarotToast('📋 공유 문구가 복사됐어요 · 붙여넣어 공유하세요'))
      .catch(()=> prompt('아래 문구를 복사해서 공유하세요:', text));
  } else {
    prompt('아래 문구를 복사해서 공유하세요:', text);
  }
}

// X(트위터)로 공유 — 옵션 버튼
function shareTarotToX() {
  const codex = JSON.parse(localStorage.getItem(CODEX_KEY) || '[]');
  if (!lastSpread && !codex.length) { alert('타로를 먼저 뽑아주세요.'); return; }
  _tarotCrossSync(codex[0]);
  const text = buildTarotShareText();
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

// 내부 크로스 연동 (코드네임/함수는 유저에게 노출하지 않음). 되돌림 가능·클라 로컬 전용.
function _tarotCrossSync(relic) {
  if (!relic) return;
  try {
    const bonus = 7 + Math.floor((relic.power||60)/11);
    const bal = parseFloat(localStorage.getItem('p10_balance')||'1284') + bonus;
    localStorage.setItem('p10_balance', bal.toFixed(2));
    localStorage.setItem('p21_fate_to_p9', JSON.stringify({score:relic.score||60, ts:Date.now()}));
    localStorage.setItem('p21_fate_to_p11', JSON.stringify({relicPower:relic.power, aura:'tarot', ts:Date.now()}));
  } catch(e){}
}