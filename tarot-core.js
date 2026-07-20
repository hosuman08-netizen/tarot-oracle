// p21 Tarot CORE — real reading engine (fictional entertainment only)
// Major Arcana 22장: 정/역방향 실제 의미, 주제어, 조언. 얕은 키워드 대신 카드마다 고유한 결.
// Fisher-Yates 셔플 + 중복 없는 드로우 + 정/역방향(reversed)까지 실제 타로 규칙 반영.
(function(global){
'use strict';

// 각 카드: up=정방향, rev=역방향. gist=한 줄 결, theme=주제, advice=행동, love/work=맥락별.
const DECK = [
  { name:"The Fool", ko:"광대", up:{gist:"새로운 시작과 순수한 도약", theme:"모험·자유·믿음", advice:"두려움보다 호기심을 택하라", love:"거리낌 없는 새 감정", work:"위험을 감수한 새 시도"},
    rev:{gist:"무모함과 준비 없는 뛰어듦", theme:"경솔·회피·정체", advice:"뛰기 전에 한 번 멈춰 살펴라", love:"확신 없는 회피", work:"계획 부족의 대가"} },
  { name:"The Magician", ko:"마법사", up:{gist:"의지가 현실로 실현되는 힘", theme:"창조·집중·자원", advice:"가진 것을 하나로 모아 실행하라", love:"주도적으로 다가감", work:"능력을 온전히 발휘할 때"},
    rev:{gist:"재능의 낭비 혹은 기만", theme:"조작·산만·미실현", advice:"속임수와 자기기만을 경계하라", love:"진심 아닌 술수", work:"흩어진 에너지"} },
  { name:"The High Priestess", ko:"여사제", up:{gist:"직관과 아직 드러나지 않은 진실", theme:"내면·비밀·잠재", advice:"논리보다 내면의 목소리를 들어라", love:"말없이 흐르는 깊은 끌림", work:"드러나지 않은 정보가 열쇠"},
    rev:{gist:"직관을 무시한 혼란", theme:"단절·은폐·소음", advice:"외부 소음을 끄고 침묵으로 돌아가라", love:"오해와 숨김", work:"비밀이 발목을 잡음"} },
  { name:"The Empress", ko:"여황제", up:{gist:"풍요와 돌봄이 무르익는 시기", theme:"창조·양육·풍성", advice:"자신과 관계를 넉넉히 돌보라", love:"따뜻하고 무르익는 사랑", work:"결실이 자라나는 국면"},
    rev:{gist:"과보호 혹은 메마른 창조력", theme:"의존·정체·소진", advice:"자신을 먼저 채워라", love:"질식할 듯한 집착", work:"영감이 마른 시기"} },
  { name:"The Emperor", ko:"황제", up:{gist:"질서와 주도권을 세우는 힘", theme:"구조·권위·안정", advice:"경계를 세우고 책임을 지어라", love:"안정적이고 든든한 관계", work:"리더십으로 판을 정리"},
    rev:{gist:"경직된 통제 혹은 무질서", theme:"독선·완고·무력", advice:"통제를 놓고 유연해져라", love:"지배하려는 태도", work:"경직된 구조의 한계"} },
  { name:"The Hierophant", ko:"교황", up:{gist:"전통과 배움이 길을 열어줌", theme:"가르침·소속·규범", advice:"검증된 길과 스승에게 배워라", love:"약속과 헌신의 관계", work:"체계와 멘토가 힘"},
    rev:{gist:"관습에서 벗어나려는 충동", theme:"이단·자유·의문", advice:"낡은 규칙을 스스로 재정의하라", love:"틀을 벗어난 관계", work:"기존 방식에 대한 반항"} },
  { name:"The Lovers", ko:"연인", up:{gist:"마음이 하나로 이어지는 선택", theme:"결합·가치·조화", advice:"가치가 맞는 쪽을 진심으로 택하라", love:"깊은 연결과 결합", work:"가치관이 맞는 협력"},
    rev:{gist:"어긋남과 흔들리는 선택", theme:"불화·유혹·회피", advice:"진짜 원하는 것을 다시 물어라", love:"엇갈림과 불신", work:"가치 충돌"} },
  { name:"The Chariot", ko:"전차", up:{gist:"의지로 밀어붙여 얻는 승리", theme:"추진·통제·성취", advice:"방향을 정하고 흔들림 없이 나아가라", love:"적극적으로 쟁취", work:"강한 추진력의 성공"},
    rev:{gist:"방향 잃은 폭주 혹은 정체", theme:"산만·무력·좌절", advice:"고삐를 다시 쥐고 방향부터 정하라", love:"엇나가는 추진", work:"통제 잃은 프로젝트"} },
  { name:"Strength", ko:"힘", up:{gist:"부드러움으로 다스리는 진짜 용기", theme:"인내·자제·내면의 힘", advice:"힘이 아닌 인내로 다스려라", love:"따뜻한 인내의 관계", work:"침착함이 이긴다"},
    rev:{gist:"흔들리는 자신감과 조급함", theme:"불안·의심·폭발", advice:"자신을 몰아세우지 말고 다독여라", love:"불안한 감정 기복", work:"자신감 부족"} },
  { name:"The Hermit", ko:"은둔자", up:{gist:"홀로 걷는 성찰이 빛을 밝힘", theme:"내성·탐구·고독", advice:"잠시 물러나 스스로에게 물어라", love:"거리를 둔 성숙", work:"깊이 파고드는 몰입"},
    rev:{gist:"고립 혹은 회피의 그늘", theme:"단절·외로움·도피", advice:"고립과 성찰을 구분하라", love:"지나친 거리 두기", work:"혼자 끌어안은 문제"} },
  { name:"Wheel of Fortune", ko:"운명의 수레바퀴", up:{gist:"흐름이 바뀌는 결정적 전환점", theme:"변화·순환·운", advice:"바뀌는 흐름을 붙잡아라", love:"운명적 전환", work:"기회의 물결이 온다"},
    rev:{gist:"불운의 반복 혹은 저항", theme:"정체·악순환·통제불능", advice:"통제할 수 없는 것을 놓아라", love:"반복되는 패턴", work:"흐름을 거스르는 시기"} },
  { name:"Justice", ko:"정의", up:{gist:"인과와 균형이 바로 서는 순간", theme:"공정·진실·결정", advice:"정직하게 판단하고 책임을 받아들여라", love:"공평한 관계", work:"정당한 결과·계약"},
    rev:{gist:"불공정과 회피된 책임", theme:"편향·불균형·부정", advice:"자신의 몫을 회피하지 마라", love:"불공평한 저울", work:"미뤄진 정산"} },
  { name:"The Hanged Man", ko:"매달린 사람", up:{gist:"멈춤 속에서 얻는 새로운 시선", theme:"전환·희생·관점", advice:"저항을 멈추고 다르게 바라보라", love:"기다림 속 깨달음", work:"관점 전환이 필요"},
    rev:{gist:"헛된 정체와 미련", theme:"지연·집착·무의미", advice:"놓지 못한 것을 결단하라", love:"매달린 미련", work:"소득 없는 지연"} },
  { name:"Death", ko:"죽음", up:{gist:"끝이 있어야 시작되는 재생", theme:"종결·변형·해방", advice:"끝난 것을 붙잡지 말고 보내라", love:"관계의 근본적 변화", work:"한 장을 닫고 다음으로"},
    rev:{gist:"변화에 대한 저항과 지체", theme:"정체·두려움·미련", advice:"두려워 말고 변화를 허락하라", love:"끝내지 못한 관계", work:"멈춘 전환"} },
  { name:"Temperance", ko:"절제", up:{gist:"조화와 절제로 빚는 균형", theme:"조율·인내·통합", advice:"극단을 섞어 중용을 찾아라", love:"서로 맞춰가는 조화", work:"차분한 조율의 성과"},
    rev:{gist:"불균형과 과잉", theme:"과도·조급·부조화", advice:"넘치는 것을 덜어내라", love:"균형 잃은 관계", work:"무리한 속도"} },
  { name:"The Devil", ko:"악마", up:{gist:"집착과 유혹이 옭아매는 사슬", theme:"속박·욕망·그림자", advice:"스스로 채운 사슬을 직시하라", love:"중독적 끌림", work:"물질에 매인 상태"},
    rev:{gist:"사슬을 끊고 벗어나는 각성", theme:"해방·직면·회복", advice:"의존에서 벗어날 결단의 때", love:"벗어나는 관계", work:"악습에서의 탈출"} },
  { name:"The Tower", ko:"탑", up:{gist:"급작스런 붕괴 뒤의 해방", theme:"격변·각성·붕괴", advice:"무너지는 것은 무너지게 두라", love:"충격적 전환", work:"기존 구조의 붕괴"},
    rev:{gist:"미뤄진 붕괴 혹은 내적 균열", theme:"불안·유예·두려움", advice:"피할 수 없는 변화를 마주하라", love:"곪아가는 균열", work:"터지기 직전의 긴장"} },
  { name:"The Star", ko:"별", up:{gist:"상처 뒤에 찾아오는 희망과 치유", theme:"희망·회복·영감", advice:"믿음을 잃지 말고 자신을 치유하라", love:"맑아지는 관계", work:"영감이 되살아남"},
    rev:{gist:"희망의 흐려짐과 자기의심", theme:"낙담·단절·회의", advice:"작은 빛부터 다시 신뢰하라", love:"식어가는 기대", work:"동기 상실"} },
  { name:"The Moon", ko:"달", up:{gist:"불안과 환영 속 감춰진 진실", theme:"무의식·불안·직관", advice:"두려움과 실재를 구분하라", love:"오해와 불안", work:"불확실한 안개"},
    rev:{gist:"안개가 걷히며 드러나는 진실", theme:"해소·명료·직면", advice:"드러나는 진실을 받아들여라", love:"오해가 풀림", work:"혼란의 정리"} },
  { name:"The Sun", ko:"태양", up:{gist:"활력과 성취가 환히 빛나는 때", theme:"기쁨·성공·명료", advice:"밝은 에너지를 마음껏 누려라", love:"따뜻하고 밝은 사랑", work:"뚜렷한 성공"},
    rev:{gist:"흐려진 기쁨 혹은 지연된 성공", theme:"과장·지연·불안", advice:"작은 빛에서 다시 시작하라", love:"흐려진 온기", work:"미뤄진 결실"} },
  { name:"Judgement", ko:"심판", up:{gist:"각성과 부름에 응답하는 순간", theme:"각성·평가·소명", advice:"과거를 정산하고 새 부름에 답하라", love:"관계의 재평가", work:"결정적 결단의 때"},
    rev:{gist:"자기비판과 회피된 부름", theme:"미련·후회·주저", advice:"자책을 멈추고 스스로 용서하라", love:"미련에 매인 상태", work:"놓친 부름"} },
  { name:"The World", ko:"세계", up:{gist:"완성과 통합, 한 여정의 마무리", theme:"완결·성취·통합", advice:"이룬 것을 인정하고 다음 원을 열어라", love:"온전한 결실", work:"프로젝트의 완성"},
    rev:{gist:"미완의 마무리와 남은 과제", theme:"미완·지연·아쉬움", advice:"마지막 매듭을 마저 지어라", love:"덜 여문 결실", work:"마감 직전의 정체"} }
];

// 스프레드 정의: 각 position은 실제 타로 의미를 가짐
const SPREADS = {
  1: { name:"오늘의 카드", positions:[ {label:"오늘", role:"지금 너에게 필요한 결"} ] },
  3: { name:"과거·현재·미래", positions:[
      {label:"과거", role:"지금에 이르게 한 뿌리"},
      {label:"현재", role:"네가 서 있는 지금의 결"},
      {label:"미래", role:"이 흐름이 향하는 곳"} ] },
  // 진짜 켈틱 크로스 10장 배치
  10:{ name:"켈틱 크로스", positions:[
      {label:"현재 상황", role:"핵심 — 지금의 중심"},
      {label:"교차하는 힘", role:"돕거나 가로막는 것"},
      {label:"의식/목표", role:"바라거나 지향하는 것"},
      {label:"무의식/뿌리", role:"바탕에 깔린 근원"},
      {label:"지나간 과거", role:"막 지나가는 영향"},
      {label:"다가올 미래", role:"곧 다가올 국면"},
      {label:"자신", role:"이 일 속의 너 자신"},
      {label:"주변 환경", role:"외부·타인의 영향"},
      {label:"희망과 두려움", role:"내면의 기대와 불안"},
      {label:"최종 결과", role:"이 흐름이 맺을 매듭"} ] }
};

// Fisher-Yates 셔플 — 진짜 균등 무작위. Math.random 기반.
function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// n장 드로우 — 중복 없음 + 각 카드 정/역방향(약 30% 역방향, 실제 타로 관행 범위)
function drawSpread(n){
  const spec = SPREADS[n];
  const positions = spec ? spec.positions : Array.from({length:n}, (_,i)=>({label:`카드 ${i+1}`, role:""}));
  const idxs = shuffle(DECK.map((_,i)=>i)).slice(0, positions.length);
  return idxs.map((di, i) => {
    const card = DECK[di];
    const reversed = Math.random() < 0.30;
    const face = reversed ? card.rev : card.up;
    const pos = positions[i];
    return {
      name: card.name, ko: card.ko, reversed,
      gist: face.gist, theme: face.theme, advice: face.advice,
      love: face.love, work: face.work,
      position: pos.label, role: pos.role
    };
  });
}

// 받침 유무로 주격 조사(이/가) 결정 — 한국어 문장이 깨지지 않게 (죽음이/연인이 vs 악마가/달이)
function subjectJosa(word){
  if (!word) return '가';
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return '가'; // 한글 아니면 기본
  const hasBatchim = (last - 0xAC00) % 28 !== 0;
  return hasBatchim ? '이' : '가';
}

// 초점(focus)별로 카드가 비추는 결이 달라진다: 일반=gist, 사랑=love, 일·재물=work
// 데크가 이미 카드마다 love/work 맥락을 갖고 있으므로 실제로 다른 문장이 나온다.
function focusMeaning(c, focus){
  if (focus === 'love' && c.love) return c.love;
  if (focus === 'work' && c.work) return c.work;
  return c.gist;
}

// 카드 × 포지션 × 방향 × 초점을 엮은 실제 해석 문장 (얕은 점수 아님)
function interpretCard(c, focus){
  const dir = c.reversed ? "역방향" : "정방향";
  const mean = focusMeaning(c, focus);
  return `${c.ko}(${c.name}) ${dir} — [${c.position}] ${c.role}: ${mean}. ${c.advice}.`;
}

// 받침 유무로 '으로/로' 결정 — "힘으로"(받침O) vs "전차로"(받침X), 단 ㄹ받침은 '로'
function euro(word){
  if (!word) return '로';
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return '로';
  const jong = (last - 0xAC00) % 28;
  return (jong === 0 || jong === 8) ? '로' : '으로'; // 8 = ㄹ
}

const FOCUS_LEAD = { love:'사랑의 결로 보면 ', work:'일·재물의 결로 보면 ' };

// 스프레드 전체를 하나의 흐름으로 종합 (서사). focus에 따라 love/work 맥락으로 읽힌다.
function synthesize(spread, focus){
  const lead = FOCUS_LEAD[focus] || '';
  const M = (c) => focusMeaning(c, focus);
  if (spread.length === 1){
    const c = spread[0];
    return `${lead}오늘의 결은 ${c.ko}(${c.reversed?'역방향':'정방향'}). ${M(c)}. 한 걸음을 정한다면 — ${c.advice}.`;
  }
  if (spread.length === 3){
    const [p,now,f] = spread;
    return `${lead}과거의 ${p.ko}${subjectJosa(p.ko)} 남긴 ${p.theme}에서 출발해, 지금 ${now.ko}${euro(now.ko)} ${M(now).replace(/\.$/,'')}. `
      + `이 흐름은 ${f.ko}(${f.reversed?'역방향':'정방향'})로 향한다 — ${M(f)}. `
      + `핵심 조언: ${now.advice}, 그리고 ${f.advice}.`;
  }
  if (spread.length === 10){
    const core = spread[0], cross = spread[1], hopes = spread[8], outcome = spread[9];
    const crossVerb = cross.reversed ? "가로막는 힘" : "함께 흐르는 힘";
    return `${lead}중심에는 ${core.ko}(${core.reversed?'역':'정'}) — ${M(core)}. `
      + `이를 ${crossVerb}으로 ${cross.ko}${subjectJosa(cross.ko)} 교차한다. `
      + `내면의 ${hopes.ko}는 기대와 불안을 동시에 비추고, `
      + `이 모든 흐름은 ${outcome.ko}(${outcome.reversed?'역방향':'정방향'})로 매듭지어진다 — ${M(outcome)}. `
      + `마지막 조언: ${outcome.advice}.`;
  }
  return spread.map(c=>interpretCard(c, focus)).join(' ');
}

const TarotCore = { DECK, SPREADS, shuffle, drawSpread, interpretCard, synthesize, focusMeaning };
if (typeof module !== 'undefined' && module.exports) module.exports = TarotCore;
global.TarotCore = TarotCore;
})(typeof window !== 'undefined' ? window : globalThis);
