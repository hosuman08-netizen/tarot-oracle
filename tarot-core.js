// p21 Tarot CORE — 정통 라이더-웨이트-스미스(RWS, 1909) 기준 리딩 엔진
// ─────────────────────────────────────────────────────────────────────────────
// 유파 선언 (SCHOOL): 타로에는 정통끼리 충돌하는 지점이 많아, 어느 체계를 따르는지
// 명시하지 않으면 해석이 통째로 어긋난다. 이 엔진은 다음을 기준으로 고정한다.
//   · 덱/번호   : RWS 1909 — Strength=VIII, Justice=XI (마르세유의 반대)
//   · 코트 원소 : RWS — King=불, Queen=물, Knight=공기, Page=흙
//                 (Golden Dawn Book T의 Knight=불 / Prince=공기 체계가 아님)
//   · 메이저 대응: Golden Dawn 정통 — Fool=Aleph(공기), Hanged Man=Mem(물),
//                 Judgement=Shin(불). 현대 변형(Fool=천왕성 등)을 쓰지 않는다.
//   · 핍 36장   : Golden Dawn 데칸 대응 (2~10 × 4수트)
//   · 켈틱 크로스: Waite, Pictorial Key to the Tarot (1910) 10포지션 원문 기준
//   · 역방향    : Mary K. Greer, The Complete Book of Tarot Reversals의 다층 독법
// 엔터테인먼트 목적의 픽션 리딩이며 실제 예언이 아니다.
// ─────────────────────────────────────────────────────────────────────────────
(function(global){
'use strict';

const SCHOOL = {
  deck: 'Rider-Waite-Smith (1909)',
  numbering: 'RWS — Strength VIII / Justice XI',
  court: 'RWS — King 불 · Queen 물 · Knight 공기 · Page 흙',
  majorAstro: 'Golden Dawn 정통 (3모문자 포함)',
  pipAstro: 'Golden Dawn 36 데칸',
  celtic: 'Waite, Pictorial Key to the Tarot (1910)',
  reversals: 'Greer 다층 독법'
};

// ── 원소 · 수트 ──────────────────────────────────────────────────────────────
const ELEMENTS = {
  fire:  { ko:'불', glyph:'△', hue:14  },
  water: { ko:'물', glyph:'▽', hue:205 },
  air:   { ko:'공기', glyph:'△̶', hue:48 },
  earth: { ko:'흙', glyph:'▽̶', hue:120 }
};

const SUITS = {
  major: { ko:'메이저 아르카나', el:null,    theme:'운명의 큰 흐름·삶의 원형', glyph:'✦' },
  W: { ko:'완드', en:'Wands',      el:'fire',  theme:'열정·의지·창조·추진',   glyph:'🜂', mark:'/' },
  C: { ko:'컵',   en:'Cups',       el:'water', theme:'감정·관계·내면',        glyph:'🜄', mark:'∪' },
  S: { ko:'소드', en:'Swords',     el:'air',   theme:'사고·진실·갈등·소통',   glyph:'🜁', mark:'†' },
  P: { ko:'펜타클', en:'Pentacles', el:'earth', theme:'물질·돈·직업·신체',     glyph:'🜃', mark:'☉' }
};

// 숫자 축은 수트를 가로질러 일관된다 (5는 모든 수트에서 저점)
const NUMBERS = {
  1:{ ko:'에이스', arc:'씨앗 — 순수한 잠재와 시작' },
  2:{ ko:'2',  arc:'이원 — 균형과 마주봄' },
  3:{ ko:'3',  arc:'성장 — 첫 결실' },
  4:{ ko:'4',  arc:'안정 — 굳어짐과 정체' },
  5:{ ko:'5',  arc:'상실 — 갈등과 저점' },
  6:{ ko:'6',  arc:'회복 — 조화의 되찾음' },
  7:{ ko:'7',  arc:'시험 — 환상과 인내' },
  8:{ ko:'8',  arc:'이동 — 숙련과 전개' },
  9:{ ko:'9',  arc:'거의 — 완성 직전의 고독' },
  10:{ ko:'10', arc:'완결 — 매듭과 그 무게' }
};

const COURT = {
  Pa:{ ko:'페이지', en:'Page',   el:'earth', arc:'배우는 자 — 소식과 첫 접촉' },
  Kn:{ ko:'나이트', en:'Knight', el:'air',   arc:'움직이는 자 — 돌진과 추구' },
  Qn:{ ko:'퀸',     en:'Queen',  el:'water', arc:'품는 자 — 성숙한 내면의 힘' },
  Ki:{ ko:'킹',     en:'King',   el:'fire',  arc:'다스리는 자 — 완성된 권위' }
};

// ── 메이저 아르카나 22장 ─────────────────────────────────────────────────────
// fav: 켈틱 크로스 2번(교차 카드)의 조력/방해 판정에 쓰이는 카드 자체의 길흉.
//      Waite 원문은 2번의 우호성을 '카드의 성질(favourable card)'로 판정한다.
//      +1 우호 / 0 중립 / -1 도전적.
// sep: 바보의 여정 셉테너리 — 1(1~7 외적 성취) 2(8~14 내적 성숙) 3(15~21 초월)
function M(num, name, ko, astro, fav, sep, up, rev){
  return { id:'M'+num, suit:'major', num, name, ko, astro, fav, sep,
    up:{gist:up[0], theme:up[1], advice:up[2], love:up[3], work:up[4]},
    rev:{gist:rev[0], theme:rev[1], advice:rev[2], love:rev[3], work:rev[4]} };
}

const MAJORS = [
M(0,'The Fool','광대','Aleph — 공기',1,1,
  ['새로운 시작과 순수한 도약','모험·자유·믿음','두려움보다 호기심을 택하라','거리낌 없는 새 감정','위험을 감수한 새 시도'],
  ['무모함과 준비 없는 뛰어듦','경솔·회피·정체','뛰기 전에 한 번 멈춰 살펴라','확신 없는 회피','계획 부족의 대가']),
M(1,'The Magician','마법사','수성',1,1,
  ['의지가 현실로 실현되는 힘','창조·집중·자원','가진 것을 하나로 모아 실행하라','주도적으로 다가감','능력을 온전히 발휘할 때'],
  ['재능의 낭비 혹은 기만','조작·산만·미실현','속임수와 자기기만을 경계하라','진심 아닌 술수','흩어진 에너지']),
M(2,'The High Priestess','여사제','달',0,1,
  ['직관과 아직 드러나지 않은 진실','내면·비밀·잠재','논리보다 내면의 목소리를 들어라','말없이 흐르는 깊은 끌림','드러나지 않은 정보가 열쇠'],
  ['직관을 무시한 혼란','단절·은폐·소음','외부 소음을 끄고 침묵으로 돌아가라','오해와 숨김','비밀이 발목을 잡음']),
M(3,'The Empress','여황제','금성',1,1,
  ['풍요와 돌봄이 무르익는 시기','창조·양육·풍성','자신과 관계를 넉넉히 돌보라','따뜻하고 무르익는 사랑','결실이 자라나는 국면'],
  ['과보호 혹은 메마른 창조력','의존·정체·소진','자신을 먼저 채워라','질식할 듯한 집착','영감이 마른 시기']),
M(4,'The Emperor','황제','양자리',1,1,
  ['질서와 주도권을 세우는 힘','구조·권위·안정','경계를 세우고 책임을 지어라','안정적이고 든든한 관계','리더십으로 판을 정리'],
  ['경직된 통제 혹은 무질서','독선·완고·무력','통제를 놓고 유연해져라','지배하려는 태도','경직된 구조의 한계']),
M(5,'The Hierophant','교황','황소자리',0,1,
  ['전통과 배움이 길을 열어줌','가르침·소속·규범','검증된 길과 스승에게 배워라','약속과 헌신의 관계','체계와 멘토가 힘'],
  ['관습에서 벗어나려는 충동','이단·자유·의문','낡은 규칙을 스스로 재정의하라','틀을 벗어난 관계','기존 방식에 대한 반항']),
M(6,'The Lovers','연인','쌍둥이자리',1,1,
  ['마음이 하나로 이어지는 선택','결합·가치·조화','가치가 맞는 쪽을 진심으로 택하라','깊은 연결과 결합','가치관이 맞는 협력'],
  ['어긋남과 흔들리는 선택','불화·유혹·회피','진짜 원하는 것을 다시 물어라','엇갈림과 불신','가치 충돌']),
M(7,'The Chariot','전차','게자리',1,1,
  ['의지로 밀어붙여 얻는 승리','추진·통제·성취','방향을 정하고 흔들림 없이 나아가라','적극적으로 쟁취','강한 추진력의 성공'],
  ['방향 잃은 폭주 혹은 정체','산만·무력·좌절','고삐를 다시 쥐고 방향부터 정하라','엇나가는 추진','통제 잃은 프로젝트']),
M(8,'Strength','힘','사자자리',1,2,
  ['부드러움으로 다스리는 진짜 용기','인내·자제·내면의 힘','힘이 아닌 인내로 다스려라','따뜻한 인내의 관계','침착함이 이긴다'],
  ['흔들리는 자신감과 조급함','불안·의심·폭발','자신을 몰아세우지 말고 다독여라','불안한 감정 기복','자신감 부족']),
M(9,'The Hermit','은둔자','처녀자리',0,2,
  ['홀로 걷는 성찰이 빛을 밝힘','내성·탐구·고독','잠시 물러나 스스로에게 물어라','거리를 둔 성숙','깊이 파고드는 몰입'],
  ['고립 혹은 회피의 그늘','단절·외로움·도피','고립과 성찰을 구분하라','지나친 거리 두기','혼자 끌어안은 문제']),
M(10,'Wheel of Fortune','운명의 수레바퀴','목성',1,2,
  ['흐름이 바뀌는 결정적 전환점','변화·순환·운','바뀌는 흐름을 붙잡아라','운명적 전환','기회의 물결이 온다'],
  ['불운의 반복 혹은 저항','정체·악순환·통제불능','통제할 수 없는 것을 놓아라','반복되는 패턴','흐름을 거스르는 시기']),
M(11,'Justice','정의','천칭자리',0,2,
  ['인과와 균형이 바로 서는 순간','공정·진실·결정','정직하게 판단하고 책임을 받아들여라','공평한 관계','정당한 결과·계약'],
  ['불공정과 회피된 책임','편향·불균형·부정','자신의 몫을 회피하지 마라','불공평한 저울','미뤄진 정산']),
M(12,'The Hanged Man','매달린 사람','Mem — 물',0,2,
  ['멈춤 속에서 얻는 새로운 시선','전환·희생·관점','저항을 멈추고 다르게 바라보라','기다림 속 깨달음','관점 전환이 필요'],
  ['헛된 정체와 미련','지연·집착·무의미','놓지 못한 것을 결단하라','매달린 미련','소득 없는 지연']),
M(13,'Death','죽음','전갈자리',-1,2,
  ['끝이 있어야 시작되는 재생','종결·변형·해방','끝난 것을 붙잡지 말고 보내라','관계의 근본적 변화','한 장을 닫고 다음으로'],
  ['변화에 대한 저항과 지체','정체·두려움·미련','두려워 말고 변화를 허락하라','끝내지 못한 관계','멈춘 전환']),
M(14,'Temperance','절제','사수자리',1,2,
  ['조화와 절제로 빚는 균형','조율·인내·통합','극단을 섞어 중용을 찾아라','서로 맞춰가는 조화','차분한 조율의 성과'],
  ['불균형과 과잉','과도·조급·부조화','넘치는 것을 덜어내라','균형 잃은 관계','무리한 속도']),
M(15,'The Devil','악마','염소자리',-1,3,
  ['집착과 유혹이 옭아매는 사슬','속박·욕망·그림자','스스로 채운 사슬을 직시하라','중독적 끌림','물질에 매인 상태'],
  ['사슬을 끊고 벗어나는 각성','해방·직면·회복','의존에서 벗어날 결단의 때','벗어나는 관계','악습에서의 탈출']),
M(16,'The Tower','탑','화성',-1,3,
  ['급작스런 붕괴 뒤의 해방','격변·각성·붕괴','무너지는 것은 무너지게 두라','충격적 전환','기존 구조의 붕괴'],
  ['미뤄진 붕괴 혹은 내적 균열','불안·유예·두려움','피할 수 없는 변화를 마주하라','곪아가는 균열','터지기 직전의 긴장']),
M(17,'The Star','별','물병자리',1,3,
  ['상처 뒤에 찾아오는 희망과 치유','희망·회복·영감','믿음을 잃지 말고 자신을 치유하라','맑아지는 관계','영감이 되살아남'],
  ['희망의 흐려짐과 자기의심','낙담·단절·회의','작은 빛부터 다시 신뢰하라','식어가는 기대','동기 상실']),
M(18,'The Moon','달','물고기자리',-1,3,
  ['불안과 환영 속 감춰진 진실','무의식·불안·직관','두려움과 실재를 구분하라','오해와 불안','불확실한 안개'],
  ['안개가 걷히며 드러나는 진실','해소·명료·직면','드러나는 진실을 받아들여라','오해가 풀림','혼란의 정리']),
M(19,'The Sun','태양','태양',1,3,
  ['활력과 성취가 환히 빛나는 때','기쁨·성공·명료','밝은 에너지를 마음껏 누려라','따뜻하고 밝은 사랑','뚜렷한 성공'],
  ['흐려진 기쁨 혹은 지연된 성공','과장·지연·불안','작은 빛에서 다시 시작하라','흐려진 온기','미뤄진 결실']),
M(20,'Judgement','심판','Shin — 불',1,3,
  ['각성과 부름에 응답하는 순간','각성·평가·소명','과거를 정산하고 새 부름에 답하라','관계의 재평가','결정적 결단의 때'],
  ['자기비판과 회피된 부름','미련·후회·주저','자책을 멈추고 스스로 용서하라','미련에 매인 상태','놓친 부름']),
M(21,'The World','세계','토성',1,3,
  ['완성과 통합, 한 여정의 마무리','완결·성취·통합','이룬 것을 인정하고 다음 원을 열어라','온전한 결실','프로젝트의 완성'],
  ['미완의 마무리와 남은 과제','미완·지연·아쉬움','마지막 매듭을 마저 지어라','덜 여문 결실','마감 직전의 정체'])
];

// ── 마이너 아르카나 56장 ─────────────────────────────────────────────────────
// 핍 40장: up/rev = [gist, theme, advice, love, work]
function P(suit, rank, astro, fav, up, rev){
  const s = SUITS[suit], n = NUMBERS[rank];
  const en = (rank===1?'Ace':String(rank)) + ' of ' + s.en;
  const ko = s.ko + ' ' + (rank===1 ? '에이스' : rank);
  return { id:suit+rank, suit, rank, num:rank, name:en, ko, astro, fav,
    el:s.el, numArc:n.arc,
    up:{gist:up[0], theme:up[1], advice:up[2], love:up[3], work:up[4]},
    rev:{gist:rev[0], theme:rev[1], advice:rev[2], love:rev[3], work:rev[4]} };
}
// 코트 16장
function K(suit, rankKey, astro, fav, up, rev){
  const s = SUITS[suit], c = COURT[rankKey];
  return { id:suit+rankKey, suit, court:rankKey, name:c.en+' of '+s.en, ko:s.ko+' '+c.ko,
    astro, fav, el:s.el, courtEl:c.el, courtArc:c.arc,
    up:{gist:up[0], theme:up[1], advice:up[2], love:up[3], work:up[4]},
    rev:{gist:rev[0], theme:rev[1], advice:rev[2], love:rev[3], work:rev[4]} };
}

const WANDS = [
P('W',1,'불의 원소 전체',1,
  ['새 열정이 손에 쥐어지는 불씨','발화·영감·기회','떠오른 충동을 오늘 안에 한 번 써보라','설레는 시작의 감정','착수할 만한 새 제안'],
  ['불붙지 못한 채 미뤄진 의욕','지연·망설임·소진','불씨가 꺼지기 전에 아주 작게 시작하라','미지근하게 식은 관심','출발이 자꾸 밀리는 일']),
P('W',2,'화성 / 양자리',1,
  ['손에 지도를 들고 먼 곳을 내다봄','계획·전망·결단','작아도 좋으니 방향부터 못 박아라','다음 단계를 함께 그리는 사이','확장을 설계하는 시기'],
  ['머뭇거림에 좁아진 시야','주저·불안·계획 부재','완벽한 지도를 기다리지 말고 한 칸만 정하라','진전 없이 맴도는 관계','결정 못 한 확장']),
P('W',3,'태양 / 양자리',1,
  ['배를 띄우고 결과를 기다리는 확장','전진·시야·협력','이미 보낸 것을 조급히 되부르지 마라','넓어지는 관계의 시야','성과가 돌아오기 시작'],
  ['지연되는 회신과 좁은 시야','정체·조바심·오판','기다림도 과정임을 인정하라','답이 늦는 관계','늦춰지는 결과']),
P('W',4,'금성 / 양자리',1,
  ['터전이 서고 함께 축하하는 시간','안정·축하·소속','이룬 것을 잠시 누리고 축하하라','안정된 관계의 기쁨','한 매듭을 짓고 쉬어감'],
  ['자리 잡지 못한 불안한 기반','미정착·미뤄진 축하·긴장','기반부터 다지고 나서 다음을 벌여라','정착하지 못한 사이','축하를 미룬 성과']),
P('W',5,'토성 / 사자자리',-1,
  ['서로 부딪히는 소란한 경쟁','경쟁·마찰·혼선','싸움을 피하지 말되 목적을 잃지 마라','기 싸움과 잦은 다툼','치열한 경쟁 국면'],
  ['갈등을 덮어둔 채 쌓이는 앙금','회피·내부마찰·긴장','덮은 갈등을 꺼내 정리하라','말하지 않은 불만','내부에서 곪는 마찰']),
P('W',6,'목성 / 사자자리',1,
  ['인정받으며 돌아오는 승리','성취·인정·자신감','받은 인정을 함께한 이들과 나눠라','자랑스러운 관계','공개적으로 인정받는 성과'],
  ['인정받지 못하거나 자만에 빠짐','실망·오만·지연','결과보다 과정을 스스로 인정하라','알아주지 않는 서운함','평가가 밀리는 성과']),
P('W',7,'화성 / 사자자리',0,
  ['높은 자리에서 자기 것을 지켜냄','방어·신념·버팀','물러설 선과 지킬 선을 구분하라','관계를 지키려는 애씀','자리를 지켜내는 싸움'],
  ['압도당해 손을 놓아버림','소진·포기·수세','혼자 다 막지 말고 도움을 청하라','지쳐 물러서는 마음','버티기 어려운 압박']),
P('W',8,'수성 / 사수자리',1,
  ['화살처럼 빠르게 전개되는 소식','속도·전개·소식','흐름이 빠를 때 망설이지 마라','급진전하는 감정','빠르게 진행되는 일'],
  ['흩어지고 지연되는 흐름','지연·산만·혼선','속도를 늦추고 우선순위를 하나만 남겨라','엇갈리는 연락','밀리고 흩어지는 일정']),
P('W',9,'달 / 사수자리',0,
  ['상처를 안고도 끝까지 버티는 힘','인내·경계·회복력','거의 다 왔다 — 한 번만 더 버텨라','조심스러워진 마음','마지막 고비의 버팀'],
  ['지나친 경계로 소진된 상태','번아웃·불신·방어','경계를 조금 풀고 회복을 먼저 하라','상처로 닫은 마음','쉬어야 할 만큼의 피로']),
P('W',10,'토성 / 사수자리',-1,
  ['혼자 짊어진 과중한 짐','부담·책임·과로','다 지고 가지 말고 나눠 들어라','혼자 감당하는 관계','감당 못 할 업무량'],
  ['짐을 내려놓거나 무너져 내림','해방·포기·정리','내려놓을 것을 오늘 하나 정하라','책임을 내려놓는 관계','일을 덜어내는 전환']),
K('W','Pa','불 속의 흙',1,
  ['호기심으로 불붙은 첫 걸음','탐험·소식·열의','서툴러도 좋으니 지금 손대라','풋풋한 설렘','새 분야의 배움과 소식'],
  ['방향 없이 들뜬 산만함','변덕·미숙·지연','흥미를 하나로 좁혀라','금세 식는 관심','시작만 반복하는 일']),
K('W','Kn','불 속의 공기',0,
  ['거침없이 달려드는 모험','돌진·열정·행동','기세가 붙었을 때 밀어붙여라','뜨겁게 다가오는 상대','과감한 실행의 국면'],
  ['앞뒤 없는 성급함','무모·충동·중단','속도보다 방향을 먼저 확인하라','불안정한 열기','급하게 벌였다 멈춘 일']),
K('W','Qn','불 속의 물',1,
  ['따뜻하고 당당한 카리스마','자신감·매력·주도','자기 색을 숨기지 말고 드러내라','당당하고 따뜻한 애정','사람을 끌어당기는 리더십'],
  ['질투와 자기중심으로 기움','불안·경쟁심·소진','비교를 멈추고 자기 자리를 보라','비교에서 오는 서운함','인정 욕구에 지친 상태']),
K('W','Ki','불 속의 불',1,
  ['비전을 제시하고 이끄는 힘','리더십·비전·결단','큰 그림을 말로 꺼내 공유하라','든든하게 이끄는 관계','판을 끌고 가는 결정권'],
  ['독선과 조급한 지배','오만·강압·성급','명령 대신 이유를 설명하라','일방적인 관계','밀어붙이다 어긋난 판단'])
];

const CUPS = [
P('C',1,'물의 원소 전체',1,
  ['감정이 새로 솟는 맑은 샘','사랑·수용·시작','마음이 열릴 때 솔직히 말하라','새로 시작되는 감정','마음이 가는 일의 시작'],
  ['닫히거나 새어버린 마음','억제·공허·거절','느끼는 것을 억누르지 마라','표현하지 못한 감정','열정이 실리지 않는 일']),
P('C',2,'금성 / 게자리',1,
  ['두 마음이 마주 보며 맺는 결합','상호성·연결·약속','먼저 한 걸음 다가가 손을 내밀라','서로를 향한 진심','신뢰로 맺는 파트너십'],
  ['균형이 무너진 한쪽만의 마음','불균형·오해·거리','주고받는 저울을 다시 맞춰라','짝사랑 혹은 엇갈림','한쪽만 애쓰는 협력']),
P('C',3,'수성 / 게자리',1,
  ['함께 잔을 드는 나눔의 기쁨','우정·축하·공동체','혼자 두지 말고 사람들 속으로 가라','축복받는 관계','팀과 나누는 성과'],
  ['과잉이거나 소원해진 무리','과음·뒷말·거리감','겉도는 자리라면 조용히 물러나라','셋이 되어 복잡해진 사이','흐트러진 팀 분위기']),
P('C',4,'달 / 게자리',-1,
  ['권태 속에 놓쳐버리는 제안','무기력·불만·외면','내밀어진 잔을 한 번은 쳐다보라','시들해진 감정','눈앞의 기회에 시큰둥'],
  ['다시 눈을 뜨고 받아들임','각성·수용·회복','지루함을 뚫고 새 자극을 받아들여라','다시 살아나는 관심','놓칠 뻔한 기회를 잡음']),
P('C',5,'화성 / 전갈자리',-1,
  ['쏟아진 잔만 바라보는 상실','슬픔·후회·애도','슬퍼하되 남은 잔도 세어보라','이별의 아픔','잃은 것에 머문 상태'],
  ['고개를 돌려 남은 것을 봄','회복·용서·전환','뒤에 남은 두 잔을 이제 집어라','상처의 아묾','다시 세우는 시도']),
P('C',6,'태양 / 전갈자리',1,
  ['순수했던 시절의 따뜻한 그리움','추억·순수·재회','오래된 인연에게 먼저 연락하라','옛 인연의 다시 만남','익숙한 곳에서의 기회'],
  ['과거에 발이 묶인 상태','집착·퇴행·미련','추억을 존중하되 오늘로 돌아오라','지난 사람을 놓지 못함','옛 방식에 갇힌 일']),
P('C',7,'금성 / 전갈자리',-1,
  ['환상으로 가득한 일곱 개의 선택','상상·유혹·혼란','꿈과 실현 가능한 것을 갈라 적어라','환상에 기댄 감정','고르지 못한 여러 갈래'],
  ['안개가 걷히고 하나가 정해짐','명료·결정·현실감','고른 하나에 자원을 몰아라','현실을 본 관계','확정되는 방향']),
P('C',8,'토성 / 물고기자리',0,
  ['채워진 잔을 두고 떠나는 발길','이탈·탐구·결단','충분하지 않다면 떠나도 된다','정리하고 떠나는 마음','더 깊은 것을 찾아 이직·전환'],
  ['떠나지 못한 채 머무름','미련·정체·번민','머물 이유를 못 대면 그건 미련이다','끝내지 못한 관계','떠날 결심만 반복']),
P('C',9,'목성 / 물고기자리',1,
  ['원하던 것이 채워진 만족','성취·풍족·자족','바란 것이 왔음을 인정하고 누려라','충만한 애정','바라던 결과의 도착'],
  ['채워도 채워지지 않는 허기','과욕·공허·자만','무엇이 진짜 부족한지 다시 물어라','충족되지 않는 마음','성과 뒤의 공허']),
P('C',10,'화성 / 물고기자리',1,
  ['함께여서 완성된 정서적 결실','화목·완성·소속','가까운 사람에게 고마움을 말하라','오래갈 안정된 사랑','사람으로 완성된 성취'],
  ['겉만 화목한 균열','불화·연출·소외','보여주는 화목을 걷어내고 대화하라','속으로 갈라진 관계','겉돌기 시작한 팀']),
K('C','Pa','물 속의 흙',1,
  ['마음이 먼저 열리는 순한 첫 감정','감수성·소식·상상','떠오른 마음을 작게라도 전하라','풋풋한 고백의 기운','감성이 열쇠가 되는 일'],
  ['다루지 못한 감정의 과잉','미숙·과민·회피','감정과 사실을 나눠 적어보라','기복이 큰 마음','감정에 휘둘린 판단']),
K('C','Kn','물 속의 공기',1,
  ['낭만을 들고 다가오는 제안','구애·이상·초대','건네진 마음을 성의 있게 대하라','로맨틱한 접근','매력적인 제안이 옴'],
  ['현실 없는 약속과 변덕','허언·기만·실망','말이 아니라 행동을 확인하라','지키지 않는 약속','실현되지 않는 제안']),
K('C','Qn','물 속의 물',1,
  ['깊이 헤아리는 공감의 힘','공감·직관·돌봄','상대의 말 밑에 있는 감정을 들어라','깊이 이해받는 사랑','사람을 살피는 리더십'],
  ['감정에 잠겨 경계를 잃음','과몰입·의존·소진','남을 돌보기 전에 자신을 채워라','감정에 휩쓸린 관계','타인의 감정에 지침']),
K('C','Ki','물 속의 불',1,
  ['감정을 다스릴 줄 아는 성숙','평정·포용·조율','흔들려도 평정을 먼저 잡아라','너그럽고 안정된 사랑','갈등을 가라앉히는 조정자'],
  ['억눌리거나 조종하는 감정','억압·조종·변덕','참는 것과 다스리는 것을 구분하라','속을 알 수 없는 상대','감정으로 흔드는 관계'])
];

const SWORDS = [
P('S',1,'공기의 원소 전체',1,
  ['안개를 가르는 진실의 칼날','명료·돌파·진실','핵심을 한 문장으로 잘라 말하라','솔직함이 여는 관계','명쾌한 판단이 통하는 때'],
  ['날이 잘못 쓰인 혼란','혼선·독설·오판','말하기 전에 한 박자 멈춰라','상처가 되는 말','논리가 어긋난 결정']),
P('S',2,'달 / 천칭자리',0,
  ['눈을 가린 채 미뤄둔 결정','유예·교착·균형','정보를 더 모으되 기한은 정하라','결정을 미룬 관계','보류된 선택'],
  ['가리개가 풀리고 마주하는 선택','직면·결단·해소','더는 미룰 수 없다 — 골라라','마주하게 된 진실','미뤘던 결정을 내림']),
P('S',3,'토성 / 천칭자리',-1,
  ['정면으로 관통당한 마음의 상처','아픔·배신·진실','아픔을 축소하지 말고 인정하라','상처를 남긴 이별','아프지만 필요한 사실'],
  ['서서히 아무는 상처','회복·용서·정리','회복에 필요한 시간을 자신에게 줘라','아물어가는 마음','정리되어 가는 갈등']),
P('S',4,'목성 / 천칭자리',1,
  ['칼을 내려놓고 취하는 회복의 휴식','휴식·회복·정지','아무것도 하지 않는 시간을 확보하라','잠시 거리를 두는 쉼','재정비를 위한 멈춤'],
  ['쉬지 못한 채 이어진 소진','번아웃·불면·재개','더 미루면 몸이 먼저 멈춘다','지친 채 이어가는 관계','회복 없이 재가동']),
P('S',5,'금성 / 물병자리',-1,
  ['이겨도 남는 것이 없는 싸움','승패·자존심·대가','이기는 것과 옳은 것을 구분하라','이겨서 잃는 관계','대가가 큰 승리'],
  ['화해 혹은 더 깊어진 앙금','후회·화해·앙금','먼저 사과할 수 있는지 물어보라','풀거나 끊거나','정리되지 않은 감정']),
P('S',6,'수성 / 물병자리',1,
  ['어려움을 뒤로하고 건너가는 이행','이행·회복·이동','완전히 낫지 않아도 떠나도 된다','조용히 나아지는 관계','더 나은 환경으로의 이동'],
  ['떠나지 못하고 발이 묶임','정체·지연·미련','발목을 잡는 것이 무엇인지 적어라','제자리인 관계','미뤄지는 전환']),
P('S',7,'달 / 물병자리',-1,
  ['드러내지 않고 움직이는 전략','전략·은밀·기지','정당한 방법인지 스스로 검토하라','숨기는 것이 있는 사이','조용히 준비하는 계획'],
  ['들통나거나 스스로 털어놓음','발각·자백·정리','늦기 전에 먼저 말하라','드러나는 비밀','감춘 것이 밝혀짐']),
P('S',8,'목성 / 쌍둥이자리',-1,
  ['스스로 묶었지만 실은 풀리는 속박','제약·무력감·착각','묶은 것이 정말 밖에 있는지 확인하라','갇힌 듯한 관계','옴짝달싹 못 하는 상황'],
  ['매듭이 풀리고 걸어 나옴','해방·자각·회복','한 발만 내디디면 끈은 풀린다','벗어나는 마음','제약이 걷히는 국면']),
P('S',9,'화성 / 쌍둥이자리',-1,
  ['한밤중에 커지는 불안','불안·자책·불면','머릿속 재앙을 종이에 적어 크기를 재라','혼자 키운 걱정','최악을 상정한 압박'],
  ['불안의 실체가 드러남','직면·완화·회복','두려움을 말로 꺼내면 작아진다','오해가 풀리는 마음','걱정보다 작았던 문제']),
P('S',10,'태양 / 쌍둥이자리',-1,
  ['더 내려갈 곳 없는 확실한 끝','종결·바닥·해방','끝났음을 인정하는 것이 시작이다','완전히 끝난 관계','명확히 종료된 국면'],
  ['바닥을 딛고 시작되는 회복','회복·재기·전환','최악은 지났다 — 천천히 일어나라','서서히 낫는 마음','재기의 첫 걸음']),
K('S','Pa','공기 속의 흙',0,
  ['호기심으로 살피고 캐묻는 눈','관찰·학습·경계','묻는 것을 부끄러워하지 마라','알아가려는 관심','정보 수집이 유리한 때'],
  ['성급한 판단과 뒷말','험담·오해·산만','확인 안 된 말을 옮기지 마라','넘겨짚는 오해','근거 없는 소문']),
K('S','Kn','공기 속의 공기',0,
  ['논리를 앞세워 돌진하는 기세','추진·논쟁·속도','빠르되 목적지를 놓치지 마라','직설적으로 다가옴','속도전으로 밀어붙임'],
  ['방향 잃은 공격성','충돌·독선·소진','이기려는 마음부터 내려놓아라','상처 주는 말싸움','무리한 강행']),
K('S','Qn','공기 속의 물',1,
  ['경험으로 벼려진 명석한 통찰','통찰·독립·정직','감정을 빼고 사실만 정리해보라','솔직하고 대등한 관계','핵심을 짚는 판단력'],
  ['날이 선 냉혹함','냉소·단절·상처','정확한 말이 늘 옳은 말은 아니다','차갑게 식은 태도','비판만 남은 분위기']),
K('S','Ki','공기 속의 불',1,
  ['원칙으로 판단하는 공정한 권위','판단·원칙·지성','감정이 아니라 기준으로 결정하라','명확한 선이 있는 관계','규칙이 바로 서는 국면'],
  ['권위를 앞세운 강압','독단·경직·남용','원칙과 고집을 구분하라','통제하려는 태도','융통성 없는 판단'])
];

const PENTACLES = [
P('P',1,'흙의 원소 전체',1,
  ['손에 쥐어진 현실적 씨앗','기회·자원·착수','들어온 기회를 숫자로 검토하라','현실로 내려온 관계','수익·자리로 이어질 시작'],
  ['놓치거나 미룬 기회','지연·손실·불안','작더라도 지금 잡을 수 있는 것을 잡아라','현실 앞에 미뤄진 마음','타이밍을 놓친 제안']),
P('P',2,'목성 / 염소자리',0,
  ['두 개를 능숙히 굴리는 균형','유연·조율·저글링','우선순위를 두 개까지만 남겨라','일과 관계의 저울','병행이 가능한 국면'],
  ['감당 못 할 만큼 늘어난 짐','과부하·혼선·불균형','하나를 내려놓아야 나머지가 산다','시간을 못 내는 사이','일정이 무너진 상태']),
P('P',3,'화성 / 염소자리',1,
  ['각자의 기술이 맞물린 협업','협업·숙련·인정','혼자 하지 말고 잘하는 사람을 넣어라','함께 무언가를 만드는 사이','실력을 인정받는 자리'],
  ['손발이 맞지 않는 작업','불협·미숙·지연','역할과 기준을 다시 명시하라','합이 어긋난 관계','품질이 흔들리는 일']),
P('P',4,'태양 / 염소자리',0,
  ['움켜쥐어 지켜낸 안정','보존·안전·통제','지키는 것과 막는 것을 구분하라','조심스럽게 지키는 관계','현금과 자리를 보전'],
  ['놓아주거나 새어 나감','집착·낭비·해방','쥔 손을 펴야 새것이 들어온다','통제를 놓는 관계','지출이 늘거나 여유가 생김']),
P('P',5,'수성 / 황소자리',-1,
  ['추위 속에 밖으로 밀려난 결핍','곤궁·소외·불안','불빛은 바로 옆에 있다 — 도움을 청하라','외로움이 커진 시기','자금·건강의 압박'],
  ['안으로 들어와 회복함','회복·지원·전환','도움을 받는 것은 지는 것이 아니다','다시 이어지는 관계','상황이 풀리기 시작']),
P('P',6,'달 / 황소자리',1,
  ['저울을 들고 주고받는 관대함','나눔·균형·지원','받을 때는 감사히, 줄 때는 조건 없이','서로 채워주는 사이','후원·지원이 들어옴'],
  ['불균형해진 시혜와 부채','불평등·조건·의존','대가 없는 도움인지 확인하라','기울어진 관계','갚아야 할 부담']),
P('P',7,'토성 / 황소자리',0,
  ['자란 것을 멈춰 서서 점검함','인내·평가·기다림','수확 전에 무엇을 남길지 정하라','천천히 익어가는 관계','중간 점검이 필요한 시점'],
  ['조급한 수확과 회의감','조바심·낭비·회의','아직 익지 않았다 — 조금 더 두어라','성급한 결론','성과가 안 보여 흔들림']),
P('P',8,'태양 / 처녀자리',1,
  ['같은 것을 반복해 갈아내는 숙련','연마·집중·성실','오늘 한 번 더 반복하는 것이 실력이다','꾸준함으로 쌓는 신뢰','기술이 붙는 시기'],
  ['의미를 잃은 반복','매너리즘·태만·정체','왜 하는지를 다시 적어보라','습관이 된 무심함','성장 없는 반복']),
P('P',9,'금성 / 처녀자리',1,
  ['스스로 일군 여유와 자립','자족·품위·독립','혼자서도 충분한 자신을 인정하라','기대지 않아도 좋은 관계','자립한 성과의 시기'],
  ['겉치레이거나 흔들리는 자립','허영·의존·불안','보여주기 위한 지출을 줄여라','과시로 채우는 마음','실속 없는 성과']),
P('P',10,'수성 / 처녀자리',1,
  ['대를 잇는 안정과 유산','기반·가족·장기','길게 갈 구조를 지금 만들어라','가족으로 이어지는 관계','장기적 안정의 확보'],
  ['흔들리는 기반과 분쟁','불안정·분쟁·단절','장기 계획의 전제부터 다시 점검하라','가족 문제의 마찰','기반이 흔들리는 상황']),
K('P','Pa','흙 속의 흙',1,
  ['배우려는 태도로 여는 첫 발','학습·성실·기회','작아도 오늘부터 실제로 시작하라','천천히 다가가는 마음','새로 배우는 분야'],
  ['미루기만 하는 실행','지연·산만·미숙','계획을 줄이고 착수를 앞당겨라','진도가 안 나가는 사이','시작만 하고 멈춘 일']),
K('P','Kn','흙 속의 공기',1,
  ['느리지만 끝까지 가는 성실','우직·꾸준·신뢰','지루해도 같은 속도를 지켜라','믿을 수 있는 상대','착실히 굴러가는 일'],
  ['지루함에 멈춰 선 정체','정체·나태·권태','작은 변화를 넣어 흐름을 되살려라','변화 없는 관계','진척 없는 업무']),
K('P','Qn','흙 속의 물',1,
  ['현실을 살뜰히 돌보는 힘','돌봄·실용·안정','마음보다 실제로 필요한 것을 챙겨라','살뜰히 챙기는 사랑','살림을 잘 굴리는 관리'],
  ['자기 돌봄이 빠진 헌신','소진·불안·과부담','남을 챙기느라 자신을 빠뜨리지 마라','희생만 남은 관계','과로로 무너지는 관리']),
K('P','Ki','흙 속의 불',1,
  ['이룬 것 위에 선 든든한 안정','성취·풍요·신뢰','쌓은 것을 지키는 구조를 만들어라','안정을 주는 든든한 사람','자산과 자리의 확립'],
  ['물질에 매인 완고함','집착·경직·탐욕','숫자 밖의 가치를 다시 세어라','조건으로 재는 관계','이익만 남은 판단'])
];

const DECK = MAJORS.concat(WANDS, CUPS, SWORDS, PENTACLES); // 78장

// 카드의 원소 — 메이저는 점성 대응에서, 마이너는 수트에서
function cardElement(c){
  if (c.suit !== 'major') return SUITS[c.suit].el;
  const a = c.astro || '';
  if (/양자리|사자자리|사수자리|화성|태양|Shin/.test(a)) return 'fire';
  if (/게자리|전갈자리|물고기자리|달/.test(a)) return 'water';
  if (/쌍둥이자리|천칭자리|물병자리|수성|목성|Aleph/.test(a)) return 'air';
  if (/황소자리|처녀자리|염소자리|금성|토성|Mem/.test(a)) return 'earth';
  return null;
}

// ── 역방향 다층 독법 (Greer) ────────────────────────────────────────────────
// '역방향 = 나쁨' 한 층만 노출하지 않는다. 카드의 성질에 따라 적용 가능한
// 층이 다르므로, 도전적 카드의 역방향은 완화·해소 쪽이, 우호적 카드의
// 역방향은 지연·내면화 쪽이 후보가 된다.
const REVERSAL_MODES = {
  block:    { ko:'막힘',     frame:'{m} — 다만 지금은 그 힘이 막혀 겉으로 나오지 못한다' },
  delay:    { ko:'지연',     frame:'{m} — 흐름은 맞지만 때가 늦춰지고 있다' },
  inward:   { ko:'내면화',   frame:'{m} — 밖이 아니라 안에서, 남몰래 일어나는 층이다' },
  excess:   { ko:'과잉',     frame:'{m} — 모자란 게 아니라 지나쳐서 문제가 된다' },
  resist:   { ko:'저항',     frame:'{m} — 알면서도 몸이 따라주지 않는 저항이 있다' },
  release:  { ko:'해소',     frame:'{m} — 조여 있던 것이 풀려나가는 국면이다' },
  breakthru:{ ko:'전환',     frame:'{m} — 방향이 뒤집히며 돌파구가 열린다' },
  rectify:  { ko:'정화',     frame:'{m} — 아팠던 자리가 오히려 약이 되는 층이다' },
  redo:     { ko:'재검토',   frame:'{m} — 다시 보고, 다시 하고, 되무를 시점이다' }
};
const REV_POOL_FAV   = ['block','delay','inward','excess','resist','redo'];   // 우호 카드가 뒤집혔을 때
const REV_POOL_HARSH = ['release','breakthru','rectify','redo','inward','delay']; // 도전 카드가 뒤집혔을 때
const REV_POOL_NEUT  = ['inward','delay','redo','block','breakthru'];

function pickReversalMode(card, rnd){
  const pool = card.fav > 0 ? REV_POOL_FAV : (card.fav < 0 ? REV_POOL_HARSH : REV_POOL_NEUT);
  return pool[Math.floor(rnd() * pool.length)];
}

// ── 원소 상성 (Elemental Dignities, Book T) ─────────────────────────────────
// 같은 원소 = 크게 강화 / 불↔물, 공기↔흙 = 상극 / 나머지 = 우호
const OPPOSED = { fire:'water', water:'fire', air:'earth', earth:'air' };
function dignity(a, b){
  if (!a || !b) return { key:'none', ko:'—', weight:0 };
  if (a === b) return { key:'same', ko:'같은 원소 — 크게 강해짐', weight:2 };
  if (OPPOSED[a] === b) return { key:'opposed', ko:'상극 — 서로 힘을 깎음', weight:-2 };
  return { key:'friendly', ko:'우호 — 서로를 돕는 결', weight:1 };
}
// 3장 트라이어드: 가운데 카드가 양옆에 의해 조정된다
function triadDignity(left, mid, right){
  const m = cardElement(mid);
  const d1 = dignity(cardElement(left), m), d2 = dignity(m, cardElement(right));
  const w = d1.weight + d2.weight;
  const verdict = w >= 3 ? '강하게 실현된다' : w >= 1 ? '무난히 흐른다'
                : w === 0 ? '조건이 붙는다' : w >= -2 ? '힘이 눌린다' : '크게 약해진다';
  return { left:d1, right:d2, weight:w, verdict };
}

// ── 스프레드 정의 ────────────────────────────────────────────────────────────
// frame: 포지션이 카드 의미를 '겨누는 방향'. 라벨 붙이기가 아니라 실제 문장 변형.
//        같은 The Tower도 '현재 장애' 자리와 '최종 결과' 자리에서 다르게 읽힌다.
const SPREADS = {
  one: { key:'one', n:1, name:'오늘의 카드', desc:'하루를 여는 한 장',
    positions:[ {label:'오늘', role:'지금 너에게 필요한 결', frame:'오늘 하루를 관통하는 결은 {m}.'} ] },

  ppf: { key:'ppf', n:3, name:'과거 · 현재 · 미래', desc:'시간의 흐름으로 읽기',
    positions:[
      {label:'과거', role:'지금에 이르게 한 뿌리', frame:'여기까지 오게 만든 뿌리에는 {m:subject} 있다.'},
      {label:'현재', role:'네가 서 있는 지금의 결', frame:'지금 너를 둘러싼 판은 {m}.'},
      {label:'미래', role:'이 흐름이 향하는 곳',   frame:'이대로 가면 닿는 곳은 {m}.'} ] },

  sao: { key:'sao', n:3, name:'상황 · 행동 · 결과', desc:'무엇을 할지 정할 때',
    positions:[
      {label:'상황', role:'지금 놓인 판',       frame:'네가 마주한 판은 {m}.'},
      {label:'행동', role:'취할 수 있는 행동',   frame:'여기서 취할 행동은 {m}의 방식이다.'},
      {label:'결과', role:'그 행동이 부를 결과', frame:'그렇게 움직였을 때 오는 것은 {m}.'} ] },

  mbs: { key:'mbs', n:3, name:'마음 · 몸 · 정신', desc:'나를 세 층으로 살피기',
    positions:[
      {label:'마음', role:'감정의 층',   frame:'감정의 층에서는 {m}.'},
      {label:'몸',   role:'현실·신체의 층', frame:'현실과 몸의 층에서는 {m}.'},
      {label:'정신', role:'생각·방향의 층', frame:'생각과 방향의 층에서는 {m}.'} ] },

  scs: { key:'scs', n:3, name:'멈출 것 · 이어갈 것 · 시작할 것', desc:'정리가 필요할 때',
    positions:[
      {label:'멈출 것',   role:'덜어내야 할 것', frame:'이제 놓아야 할 것은 {m}의 자리다.'},
      {label:'이어갈 것', role:'지켜야 할 것',   frame:'계속 지켜야 할 것은 {m}.'},
      {label:'시작할 것', role:'새로 열 것',     frame:'새로 열어야 할 것은 {m}.'} ] },

  cross5: { key:'cross5', n:5, name:'다섯 장 십자', desc:'한 사안을 입체로 보기',
    positions:[
      {label:'현재',     role:'사안의 핵심',       frame:'이 일의 한가운데에는 {m:subject} 있다.'},
      {label:'과제',     role:'가로놓인 장애',     frame:'가로놓인 과제는 {m}.'},
      {label:'뿌리',     role:'바탕에 깔린 원인',  frame:'바탕에 깔린 원인은 {m}.'},
      {label:'다가올 것', role:'곧 작동할 영향',   frame:'곧 작동할 영향은 {m}.'},
      {label:'조언',     role:'취할 태도',         frame:'여기서 권해지는 태도는 {m}의 결이다.'} ] },

  rel7: { key:'rel7', n:7, name:'관계 스프레드', desc:'두 사람 사이를 대칭으로',
    positions:[
      {label:'나',       role:'이 관계 속 나의 상태',   frame:'이 관계에서 너는 {m}의 자리에 있다.'},
      {label:'상대',     role:'상대의 상태',           frame:'상대 쪽에서는 {m}.'},
      {label:'우리 사이', role:'둘 사이의 현재 에너지',  frame:'둘 사이에 흐르는 것은 {m}.'},
      {label:'내 바람',   role:'내가 진짜 원하는 것',    frame:'네가 진짜 바라는 것은 {m}.'},
      {label:'상대의 바람', role:'상대가 원하는 것',     frame:'상대가 바라는 것은 {m}.'},
      {label:'과제',     role:'이 관계가 마주할 배움',  frame:'이 관계가 넘어야 할 과제는 {m}.'},
      {label:'방향',     role:'현재 역학이 향하는 곳',  frame:'지금 역학이 향하는 곳은 {m}.'} ] },

  yesno: { key:'yesno', n:3, name:'예 / 아니오', desc:'방향을 가늠하는 세 장',
    positions:[
      {label:'첫 번째', role:'무게추 1', frame:'{m}'},
      {label:'두 번째', role:'무게추 2', frame:'{m}'},
      {label:'세 번째', role:'무게추 3', frame:'{m}'} ] },

  // Waite, Pictorial Key to the Tarot (1910) 원문 10포지션
  celtic: { key:'celtic', n:10, name:'켈틱 크로스', desc:'가장 깊이 보는 열 장',
    positions:[
      {label:'현재 상황',   role:'This covers him — 전반의 분위기', frame:'지금 이 일을 덮고 있는 공기는 {m}.'},
      {label:'교차하는 힘', role:'This crosses him — 장애의 성질',  frame:'가로질러 놓인 힘은 {m}.'},
      {label:'목표 / 이상', role:'This crowns him — 아직 이루지 않은 최선', frame:'네가 바라는 최선은 {m}.'},
      {label:'토대 / 뿌리', role:'This is beneath him — 이미 겪어 네 것이 된 과거', frame:'이미 네 것이 된 바탕은 {m}.'},
      {label:'지나가는 것', role:'This is behind him — 막 지나가는 영향', frame:'막 지나가고 있는 것은 {m}.'},
      {label:'다가오는 것', role:'This is before him — 가까운 미래에 작동할 영향', frame:'곧 작동할 영향은 {m}.'},
      {label:'자신',       role:'Himself — 질문자의 태도',       frame:'이 일 속에서 너의 태도는 {m}.'},
      {label:'환경',       role:'His house — 주변과 타인',       frame:'주변 환경이 만드는 것은 {m}.'},
      {label:'희망과 두려움', role:'Hopes and fears',            frame:'네가 바라면서 동시에 두려워하는 것은 {m}.'},
      {label:'최종 결과',   role:'What will come — 다른 카드들이 빚은 결말', frame:'이 모든 것이 맺는 매듭은 {m}.'} ] }
};
// 장수로도 접근 가능 (하위 호환)
SPREADS[1] = SPREADS.one; SPREADS[3] = SPREADS.ppf; SPREADS[5] = SPREADS.cross5;
SPREADS[7] = SPREADS.rel7; SPREADS[10] = SPREADS.celtic;

// ── 셔플 / 드로우 ────────────────────────────────────────────────────────────
function shuffle(arr, rnd){
  const r = rnd || Math.random;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 시드 난수 — '오늘의 카드'처럼 같은 날 같은 결과가 나와야 하는 경우에 사용
function seededRandom(seed){
  let s = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  return function(){
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// opts: { reversals:true|false, reversalRate:0.3, rnd, question }
function drawSpread(key, opts){
  opts = opts || {};
  const rnd = opts.rnd || Math.random;
  const useRev = opts.reversals !== false;
  const rate = typeof opts.reversalRate === 'number' ? opts.reversalRate : 0.30;
  const spec = SPREADS[key] || SPREADS.one;
  const positions = spec.positions;
  const picked = shuffle(DECK, rnd).slice(0, positions.length);

  return picked.map((card, i) => {
    const pos = positions[i];
    // 켈틱 크로스 2번(교차 카드)은 1번 위에 가로로 놓이므로 정/역이 성립하지 않는다 (Waite)
    const noOrientation = (spec.key === 'celtic' && i === 1);
    const reversed = !noOrientation && useRev && rnd() < rate;
    const face = reversed ? card.rev : card.up;
    const revMode = reversed ? pickReversalMode(card, rnd) : null;
    return {
      id: card.id, name: card.name, ko: card.ko,
      suit: card.suit, num: card.num, court: card.court,
      astro: card.astro, fav: card.fav, sep: card.sep,
      el: cardElement(card),
      numArc: card.numArc, courtArc: card.courtArc,
      reversed, noOrientation, revMode,
      gist: face.gist, theme: face.theme, advice: face.advice,
      love: face.love, work: face.work,
      position: pos.label, role: pos.role, frame: pos.frame,
      posIndex: i
    };
  });
}

// ── 한국어 조사 처리 ─────────────────────────────────────────────────────────
// 카드 이름은 '펜타클 7'처럼 숫자로 끝나기도 하므로, 한글 종성뿐 아니라
// 숫자의 한국어 발음 받침까지 따져야 "7가"(X) → "7이"(O)가 된다.
// 1 일(ㄹ) 2 이(-) 3 삼(ㅁ) 4 사(-) 5 오(-) 6 육(ㄱ) 7 칠(ㄹ) 8 팔(ㄹ) 9 구(-) 10 십(ㅂ) 0 영(ㅇ)
const DIGIT_JONG = { 0:'ㅇ', 1:'ㄹ', 2:'', 3:'ㅁ', 4:'', 5:'', 6:'ㄱ', 7:'ㄹ', 8:'ㄹ', 9:'', 10:'ㅂ' };

// 단어 끝의 받침 정보 { batchim:있는지, rieul:ㄹ받침인지 }
function endJong(word){
  if (!word) return { batchim:false, rieul:false };
  const s = String(word).trim();
  const numMatch = s.match(/(\d+)$/);
  if (numMatch){
    const n = parseInt(numMatch[1], 10);
    // 10 이하는 그대로, 그 위는 끝자리로 판정 (11 십일 → ㄹ)
    const j = DIGIT_JONG[n] !== undefined ? DIGIT_JONG[n] : DIGIT_JONG[n % 10];
    return { batchim: j !== '', rieul: j === 'ㄹ' };
  }
  const last = s.charCodeAt(s.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return { batchim:false, rieul:false };
  const jong = (last - 0xAC00) % 28;
  return { batchim: jong !== 0, rieul: jong === 8 };
}
function hasBatchim(word){ return endJong(word).batchim; }
function subjectJosa(word){ return hasBatchim(word) ? '이' : '가'; }
function objectJosa(word){ return hasBatchim(word) ? '을' : '를'; }
function topicJosa(word){ return hasBatchim(word) ? '은' : '는'; }
function euro(word){
  const e = endJong(word);
  return (!e.batchim || e.rieul) ? '로' : '으로'; // ㄹ받침은 '로'
}
// 문장 끝 단어에 조사를 붙인다 — 서사 조립용
function withJosa(word, kind){
  if (kind === 'subject') return word + subjectJosa(word);
  if (kind === 'object')  return word + objectJosa(word);
  if (kind === 'topic')   return word + topicJosa(word);
  if (kind === 'euro')    return word + euro(word);
  return word;
}

// ── 초점(생활 영역)별 타깃 해석 ──────────────────────────────────────────────
// 같은 카드도 '연애로 물었을 때'와 '이직으로 물었을 때' 겨누는 곳이 다르다.
const HEALTH_BY_ELEMENT = {
  fire:  '활력과 체력의 문제 — 무리한 소모와 회복의 균형',
  water: '감정과 수면·정서 건강 — 마음이 몸으로 나타나는 층',
  air:   '생각과 신경·호흡 — 과부하된 머리와 긴장',
  earth: '몸과 생활 습관 — 먹고 자고 움직이는 실제 리듬'
};
function focusMeaning(c, focus){
  if (focus === 'love' && c.love) return c.love;
  if (focus === 'work' && c.work) return c.work;
  if (focus === 'health') {
    const base = HEALTH_BY_ELEMENT[c.el] || '몸과 마음의 균형';
    return `${base}에서 ${c.gist}`;
  }
  return c.gist;
}
const FOCUS_LABEL = { general:'전체 흐름', love:'사랑·관계', work:'일·재물', health:'몸과 마음' };
const FOCUS_LEAD  = { love:'사랑의 결로 보면 ', work:'일·재물의 결로 보면 ', health:'몸과 마음의 결로 보면 ' };

// ── 카드 해석 ────────────────────────────────────────────────────────────────
// 3단 렌즈: ① 카드 자체 의미 → ② 포지션이 그 의미를 겨누는 방향 → ③ 스프레드 전체
// 프레임 안의 {m}은 카드 의미로 치환된다. {m:subject}/{m:euro}처럼 조사 종류를
// 지정하면 치환된 실제 문구의 받침을 따져 조사를 붙인다 ("…7이" / "…절제로").
function applyFrame(c, meaning){
  if (!c.frame) return meaning;
  const m = meaning.replace(/\.$/, '');
  return c.frame.replace(/\{m(?::(\w+))?\}/g, (_, kind) => kind ? withJosa(m, kind) : m);
}
function directionLabel(c){
  if (c.noOrientation) return '가로놓임';
  if (!c.reversed) return '정방향';
  const mode = REVERSAL_MODES[c.revMode];
  return mode ? `역방향 · ${mode.ko}` : '역방향';
}
function interpretCard(c, focus){
  let mean = focusMeaning(c, focus);
  if (c.reversed && c.revMode && REVERSAL_MODES[c.revMode]) {
    mean = REVERSAL_MODES[c.revMode].frame.replace('{m}', mean.replace(/\.$/, ''));
  }
  return `${applyFrame(c, mean)} ${c.advice}.`;
}
// 카드 상세 (탭했을 때 펼치는 층)
function cardDetail(c, focus){
  const suit = SUITS[c.suit];
  const lines = [];
  lines.push({ k:'키워드', v:c.theme });
  if (c.suit === 'major') {
    const sepName = { 1:'첫 번째 셉테너리 (1~7) — 외적 성취', 2:'두 번째 셉테너리 (8~14) — 내적 성숙', 3:'세 번째 셉테너리 (15~21) — 초월' };
    lines.push({ k:'여정에서의 자리', v:(c.num===0 ? '여정의 출발 — 아직 번호 밖에 선 자' : sepName[c.sep]) });
  } else {
    lines.push({ k:'수트', v:`${suit.ko} · ${ELEMENTS[suit.el].ko} — ${suit.theme}` });
    if (c.numArc)   lines.push({ k:'숫자의 결', v:c.numArc });
    if (c.courtArc) lines.push({ k:'코트의 결', v:c.courtArc });
  }
  if (c.astro) lines.push({ k:'대응', v:c.astro });
  lines.push({ k:'포지션', v:`${c.position} — ${c.role}` });
  lines.push({ k:'방향', v: c.noOrientation
    ? '가로로 놓여 정/역을 따지지 않는다 (Waite 원문)'
    : (c.reversed ? `역방향 · ${REVERSAL_MODES[c.revMode] ? REVERSAL_MODES[c.revMode].ko : ''}` : '정방향') });
  lines.push({ k:'사랑·관계', v:c.love });
  lines.push({ k:'일·재물',   v:c.work });
  lines.push({ k:'몸과 마음', v:HEALTH_BY_ELEMENT[c.el] || '몸과 마음의 균형' });
  lines.push({ k:'조언', v:c.advice });
  return lines;
}

// ── 예/아니오 판정 ───────────────────────────────────────────────────────────
// 정통 방식 중 (3) 다수결 + (2) 카드 성질 보정을 함께 쓴다.
// 확정된 미래가 아니라 '현재 에너지의 방향'이라는 프레이밍을 반드시 함께 낸다.
function yesNoVerdict(spread){
  let score = 0;
  spread.forEach(c => {
    score += c.reversed ? -1 : 1;      // 방향
    score += (c.fav || 0) * 0.6;        // 카드 자체의 길흉
    if (c.suit === 'W' || c.suit === 'C') score += 0.3;  // 원소법 경향
    if (c.suit === 'S' || c.suit === 'P') score -= 0.3;
  });
  const label = score >= 2.4 ? '예 — 흐름이 분명히 그쪽입니다'
              : score >= 0.8 ? '예에 가깝습니다 — 다만 조건이 붙습니다'
              : score > -0.8 ? '지금은 반반입니다 — 결정할 재료가 아직 모자랍니다'
              : score > -2.4 ? '아니오에 가깝습니다 — 지금 방식으로는 어렵습니다'
              : '아니오 — 흐름이 반대로 서 있습니다';
  return { score:Math.round(score*10)/10, label,
    caveat:'이것은 확정된 미래가 아니라 지금 에너지가 향한 방향입니다. 조건이 바뀌면 답도 바뀝니다.' };
}

// ── 종합 서사 ────────────────────────────────────────────────────────────────
function M_(c, focus){ return focusMeaning(c, focus).replace(/\.$/, ''); }
function dirShort(c){ return c.noOrientation ? '가로' : (c.reversed ? '역' : '정'); }

function synthesize(spread, focus, spreadKey){
  const lead = FOCUS_LEAD[focus] || '';
  const key = spreadKey || (spread.length === 10 ? 'celtic' : spread.length === 7 ? 'rel7'
             : spread.length === 5 ? 'cross5' : spread.length === 3 ? 'ppf' : 'one');

  if (key === 'one' || spread.length === 1){
    const c = spread[0];
    return `${lead}오늘의 결은 ${c.ko}(${dirShort(c)}). ${M_(c, focus)}. 한 걸음을 정한다면 — ${c.advice}.`;
  }

  if (key === 'yesno'){
    const v = yesNoVerdict(spread);
    const names = spread.map(c=>`${c.ko}(${dirShort(c)})`).join(' · ');
    return `${lead}${names} — ${v.label}. ${v.caveat}`;
  }

  if (key === 'rel7'){
    const [me, you, between, myWant, yourWant, task, dir] = spread;
    const t = triadDignity(me, between, you);
    return `${lead}너는 ${M_(me, focus)}의 자리에 있고, 상대는 ${M_(you, focus)}. `
      + `둘 사이에 흐르는 것은 ${between.ko}${subjectJosa(between.ko)} 말하는 ${M_(between, focus)}이며, `
      + `원소로 보면 ${t.verdict}. `
      + `네가 바라는 것은 ${M_(myWant, focus)}, 상대가 바라는 것은 ${M_(yourWant, focus)} — `
      + (myWant.el === yourWant.el ? '둘의 바람이 같은 결을 향한다. ' : '둘의 바람이 서로 다른 곳을 본다. ')
      + `이 관계가 넘어야 할 과제는 ${task.ko}${subjectJosa(task.ko)} 가리키는 ${M_(task, focus)}. `
      + `지금 역학은 ${withJosa(M_(dir, focus),'euro')} 향한다 — 확정이 아니라 현재의 기울기다. `
      + `조언: ${task.advice}.`;
  }

  if (key === 'cross5'){
    const [now, task, root, soon, adv] = spread;
    const t = triadDignity(root, now, soon);
    return `${lead}한가운데에는 ${now.ko}(${dirShort(now)}) — ${M_(now, focus)}. `
      + `이를 ${task.ko}${subjectJosa(task.ko)} 가로막고, 바탕에는 ${withJosa(M_(root, focus),'subject')} 깔려 있다. `
      + `앞뒤 카드와의 원소 관계로 보면 이 중심은 ${t.verdict}. `
      + `곧 작동할 것은 ${M_(soon, focus)}. `
      + `권해지는 태도는 ${adv.ko}의 결 — ${adv.advice}.`;
  }

  if (key === 'celtic' || spread.length === 10){
    const [cover, cross, crown, base, past, future, self, house, hopes, outcome] = spread;
    // Waite: 2번의 우호성은 '카드 자체의 성질'로 판정한다. 정/역이 아니다.
    const crossVerb = cross.fav > 0 ? '함께 흐르는 힘'
                    : cross.fav < 0 ? '만만치 않게 가로막는 힘'
                    : '조건을 거는 힘';
    const crossNote = cross.fav > 0
      ? '반대 세력이 심각하지 않다는 신호다'
      : cross.fav < 0 ? '이 저항은 가볍게 볼 것이 아니다' : '어느 쪽으로도 갈 수 있다';

    // 정통 독법의 핵심 대비 3종
    const alignEl = dignity(cardElement(crown), cardElement(outcome));
    const goalMatch = alignEl.key === 'same' ? '네가 바라는 것과 결말이 같은 결로 서 있다 — 원하는 방향으로 매듭지어질 구조다'
      : alignEl.key === 'opposed' ? '네가 바라는 것과 결말이 서로 어긋나 있다 — 지금 방식으로는 원하는 대로 맺히지 않는다'
      : '바라는 것과 결말이 완전히 같지는 않지만 등지고 있지도 않다 — 조건을 맞추면 닿는다';

    const cw = dignity(cardElement(crown), cardElement(base));
    const mindMatch = cw.key === 'opposed'
      ? '의식으로 원하는 것과 바탕에 깔린 것이 충돌한다 — 스스로 발을 거는 구조다'
      : cw.key === 'same' ? '의식과 무의식이 같은 곳을 본다 — 흔들림이 적다'
      : '의식과 바탕이 대체로 협조한다';

    const sh = dignity(cardElement(self), cardElement(house));
    const envMatch = sh.key === 'opposed'
      ? '너의 태도와 주변 환경이 서로 어긋난다 — 힘이 밖으로 새는 지점이다'
      : sh.key === 'same' ? '너의 태도와 환경이 같은 방향이라 추진이 붙는다'
      : '너와 환경 사이에 큰 마찰은 없다';

    const hopeGap = dignity(cardElement(hopes), cardElement(outcome)).key === 'opposed'
      ? '희망·두려움과 결말이 어긋나니, 지금 걱정하는 그 일은 아닐 가능성이 크다'
      : '희망·두려움이 결말과 같은 방향을 비춘다';

    return `${lead}【덮고 있는 것】 ${cover.ko}(${dirShort(cover)}) — ${M_(cover, focus)}. `
      + `【교차】 ${cross.ko}${subjectJosa(cross.ko)} ${crossVerb}으로 놓였다: ${crossNote}. `
      + `【목표】 ${withJosa(M_(crown, focus),'subject')} 아직 이루지 않은 최선으로 걸려 있고, `
      + `【토대】 이미 겪어 네 것이 된 ${withJosa(M_(base, focus),'subject')} 아래를 받친다. ${mindMatch}. `
      + `【지나가는 것】 ${withJosa(M_(past, focus),'subject')} 물러나고, 【다가오는 것】 ${withJosa(M_(future, focus),'subject')} 곧 작동한다. `
      + `【자신】 이 일 속의 너는 ${M_(self, focus)}, 【환경】 주변은 ${M_(house, focus)} — ${envMatch}. `
      + `【희망과 두려움】 ${M_(hopes, focus)} — ${hopeGap}. `
      + `【결말】 ${outcome.ko}(${dirShort(outcome)}) — ${M_(outcome, focus)}. ${goalMatch}. `
      + `마지막 조언: ${outcome.advice}.`;
  }

  // 3장 계열 (ppf / sao / mbs / scs)
  if (spread.length === 3){
    const [a, b, c] = spread;
    const t = triadDignity(a, b, c);
    if (key === 'ppf'){
      return `${lead}과거의 ${a.ko}${subjectJosa(a.ko)} 남긴 ${a.theme}에서 출발해, 지금 ${withJosa(b.ko,'euro')} ${M_(b, focus)}. `
        + `세 장의 원소 관계로 보면 지금의 중심은 ${t.verdict}. `
        + `이 흐름은 ${c.ko}(${dirShort(c)}) 쪽으로 향한다 — ${M_(c, focus)}. `
        + `핵심 조언: ${b.advice}, 그리고 ${c.advice}.`;
    }
    if (key === 'sao'){
      return `${lead}지금 놓인 판은 ${M_(a, focus)}. 여기서 취할 행동은 ${b.ko}의 방식 — ${M_(b, focus)}. `
        + `그렇게 움직이면 ${withJosa(M_(c, focus),'euro')} 이어진다. 원소로 보면 이 행동은 ${t.verdict}. 조언: ${b.advice}.`;
    }
    if (key === 'mbs'){
      return `${lead}마음은 ${M_(a, focus)}, 몸과 현실은 ${M_(b, focus)}, 생각과 방향은 ${M_(c, focus)}. `
        + `세 층이 ${t.weight >= 1 ? '서로 돕고 있다' : t.weight <= -1 ? '서로 어긋나 힘이 샌다' : '아직 정렬되지 않았다'}. 조언: ${b.advice}.`;
    }
    if (key === 'scs'){
      return `${lead}이제 놓아야 할 것은 ${M_(a, focus)}의 자리. 계속 지킬 것은 ${M_(b, focus)}. `
        + `새로 열 것은 ${M_(c, focus)}. 원소로 보면 이 정리는 ${t.verdict}. 조언: ${c.advice}.`;
    }
  }

  return spread.map(c => interpretCard(c, focus)).join(' ');
}

// ── 바보의 여정 (Eden Gray) — 메이저 22장의 서사 골격 ────────────────────────
const FOOLS_JOURNEY = {
  0: { title:'출발', desc:'아직 번호를 받지 않은 자. 여정 전체를 걷는 주인공이다.' },
  1: { title:'첫 번째 셉테너리 (1~7)', sub:'신 — 외적 성취',
       desc:'세상에 나가 힘을 배우고 자리를 세우는 구간. 시동 카드는 마법사.' },
  2: { title:'두 번째 셉테너리 (8~14)', sub:'인간 — 내적 성숙',
       desc:'밖에서 얻은 것을 안으로 돌려 다스리는 구간. 시동 카드는 힘.' },
  3: { title:'세 번째 셉테너리 (15~21)', sub:'자연 — 초월',
       desc:'자기 사슬을 부수고 더 큰 질서로 나아가는 구간. 시동 카드는 악마.' }
};

// ── 리딩 기록 반사 (Mirror) — 저장된 리딩을 집계해 돌려준다 ──────────────────
// 반복 출현 카드 / 수트 편중 / 역방향 비율 / 원소 분포
function reflect(readings){
  const cards = [], suits = {}, els = {};
  let total = 0, rev = 0, majors = 0;
  (readings || []).forEach(r => {
    (r.cards || []).forEach(c => {
      total++; if (c.reversed) rev++;
      if (c.suit === 'major') majors++;
      cards.push(c.ko);
      const sk = c.suit === 'major' ? 'major' : c.suit;
      suits[sk] = (suits[sk] || 0) + 1;
      if (c.el) els[c.el] = (els[c.el] || 0) + 1;
    });
  });
  if (!total) return null;
  const freq = {};
  cards.forEach(n => freq[n] = (freq[n] || 0) + 1);
  const top = Object.keys(freq).map(k => ({ ko:k, n:freq[k] }))
    .sort((a,b) => b.n - a.n || a.ko.localeCompare(b.ko)).slice(0, 5);
  const topSuit = Object.keys(suits).sort((a,b) => suits[b] - suits[a])[0];
  const topEl   = Object.keys(els).sort((a,b) => els[b] - els[a])[0];
  const revPct = Math.round(rev / total * 100);
  const majPct = Math.round(majors / total * 100);

  const notes = [];
  if (top[0] && top[0].n >= 2) notes.push(`${top[0].ko}${subjectJosa(top[0].ko)} ${top[0].n}번 반복해서 나왔어요. 같은 주제가 계속 두드리고 있다는 뜻으로 읽힙니다.`);
  if (topSuit && topSuit !== 'major') notes.push(`${SUITS[topSuit].ko}(${ELEMENTS[SUITS[topSuit].el].ko})가 가장 자주 나왔어요 — 요즘 ${SUITS[topSuit].theme} 쪽에 무게가 실려 있습니다.`);
  if (majPct >= 45) notes.push(`메이저 아르카나 비중이 ${majPct}%로 높아요. 사소한 일보다 큰 국면을 묻고 있는 시기입니다.`);
  if (revPct >= 45) notes.push(`역방향 비율이 ${revPct}%예요. 밖으로 나오지 못하고 안에서 도는 일이 많다는 신호로 읽힙니다.`);
  else if (revPct <= 12) notes.push(`역방향이 ${revPct}%로 적어요. 흐름이 비교적 바깥으로 잘 나오고 있습니다.`);

  return { total, revPct, majPct, top, topSuit, topEl,
    topSuitKo: topSuit === 'major' ? '메이저 아르카나' : (topSuit ? SUITS[topSuit].ko : '—'),
    topElKo: topEl ? ELEMENTS[topEl].ko : '—', notes };
}

const TarotCore = {
  SCHOOL, DECK, MAJORS, SPREADS, SUITS, ELEMENTS, NUMBERS, COURT,
  REVERSAL_MODES, FOOLS_JOURNEY, FOCUS_LABEL,
  shuffle, seededRandom, drawSpread, cardElement, dignity, triadDignity,
  interpretCard, cardDetail, synthesize, focusMeaning, yesNoVerdict,
  directionLabel, reflect, subjectJosa, objectJosa, topicJosa, euro, withJosa
};
if (typeof module !== 'undefined' && module.exports) module.exports = TarotCore;
global.TarotCore = TarotCore;
})(typeof window !== 'undefined' ? window : globalThis);
