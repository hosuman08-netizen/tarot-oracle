// p21 Tarot — 카드 글리프 세트
// 78장 전부에 개별 일러스트를 두는 대신, 메이저 22 + 수트 4 = 26개의 기하 라인아트로
// 덱 전체를 하나의 시각 언어로 통일한다(골든 스레드 방식). 이미지 자산 0, OS별로
// 다르게 그려지는 이모지 0. 전부 stroke=currentColor라 카드 상태에 따라 색이 따라온다.
(function(global){
'use strict';

const V = 'viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';

// ── 메이저 아르카나 22 ───────────────────────────────────────────────────────
const MAJOR = {
  0:  '<circle cx="50" cy="62" r="19"/><path d="M50 43V16"/><path d="M39 27l11-11 11 11"/><circle cx="50" cy="62" r="5"/>',      // 광대 — 벼랑 위 도약
  1:  '<path d="M50 20v60"/><path d="M28 44c0-7 6-11 11-7s11 12 22 12 11-9 0-12-17 5-22 12-11 4-11-5z"/>',                        // 마법사 — 무한대와 지팡이
  2:  '<path d="M32 22v56M68 22v56"/><path d="M58 50a14 14 0 1 1-13-14 11 11 0 0 0 13 14z"/>',                                    // 여사제 — 두 기둥과 초승달
  3:  '<circle cx="50" cy="40" r="17"/><path d="M50 57v25M39 70h22"/><path d="M36 26l6 8M64 26l-6 8"/>',                          // 여황제 — 금성
  4:  '<rect x="30" y="42" width="40" height="38"/><path d="M34 34c-6-10 4-16 8-8M66 34c6-10-4-16-8-8"/><path d="M50 42V26"/>',   // 황제 — 왕좌와 양의 뿔
  5:  '<path d="M50 18v64"/><path d="M34 34h32M38 50h24M42 66h16"/>',                                                             // 교황 — 삼중 십자
  6:  '<circle cx="38" cy="52" r="19"/><circle cx="62" cy="52" r="19"/><path d="M50 22v10"/>',                                    // 연인 — 맞물린 두 원
  7:  '<rect x="30" y="36" width="40" height="30"/><circle cx="36" cy="74" r="7"/><circle cx="64" cy="74" r="7"/><path d="M62 26a14 14 0 0 1-24 0"/>', // 전차
  8:  '<path d="M28 30c0-7 6-11 11-7s11 12 22 12 11-9 0-12-17 5-22 12-11 4-11-5z"/><circle cx="50" cy="64" r="15"/><path d="M50 45v-4M34 53l-3-3M66 53l3-3M34 75l-3 3M66 75l3 3M50 83v4"/>', // 힘 — 사자 위의 무한대
  9:  '<path d="M62 20L34 80"/><path d="M63 46a12 12 0 1 1-24 0 12 12 0 0 1 24 0z"/><path d="M51 34v-6"/>',                        // 은둔자 — 등불과 지팡이
  10: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="9"/><path d="M50 22v10M50 68v10M22 50h10M68 50h10M30 30l7 7M70 30l-7 7M30 70l7-7M70 70l-7-7"/>', // 수레바퀴
  11: '<path d="M50 18v64M28 78h44"/><path d="M26 36h48"/><path d="M26 36l-8 16h16zM74 36l8 16H66z"/>',                            // 정의 — 저울
  12: '<path d="M26 22h48"/><path d="M50 22v22"/><path d="M50 44l-16 34h32z"/>',                                                   // 매달린 사람 — 역삼각
  13: '<path d="M34 80c0-34 14-52 32-58"/><path d="M66 22c-12 10-16 22-6 26s16-8 6-26z"/>',                                        // 죽음 — 낫
  14: '<path d="M50 18l26 45H24z"/><path d="M50 82L24 37h52z"/>',                                                                   // 절제 — 물과 불의 결합
  15: '<circle cx="50" cy="50" r="32"/><path d="M50 82L68.8 24.1L19.6 59.9H80.4L31.2 24.1z"/>',                                                          // 악마 — 역펜타그램
  16: '<path d="M32 82V42l18-20 18 20v40z"/><path d="M56 34l-12 20h12l-12 18"/>',                                                  // 탑 — 번개
  17: '<path d="M50 14l7 22 22 7-22 7-7 22-7-22-22-7 22-7z"/><path d="M50 78v8M34 70l-4 6M66 70l4 6"/>',                          // 별
  18: '<path d="M66 50a20 20 0 1 1-18-20 16 16 0 0 0 18 20z"/><path d="M36 74l-3 8M50 78l-3 8M64 74l-3 8"/>',                     // 달
  19: '<circle cx="50" cy="50" r="17"/><path d="M50 20V10M50 90V80M20 50H10M90 50H80M29 29l-7-7M71 29l7-7M29 71l-7 7M71 71l7 7"/>', // 태양
  20: '<path d="M28 74h44"/><path d="M50 74V38"/><path d="M32 38h36L50 12z"/>',                                                     // 심판 — 부름
  21: '<ellipse cx="50" cy="50" rx="24" ry="34"/><path d="M50 30v40M34 50h32"/>'                                                    // 세계 — 완성의 화관
};

// ── 수트 4 ──────────────────────────────────────────────────────────────────
const SUIT = {
  W: '<path d="M50 84V34"/><path d="M50 34c-10-6-12-16-6-22 2 8 8 8 6 0 8 6 10 16 0 22z"/><path d="M40 52l10-6 10 6"/>', // 완드 — 불이 붙은 지팡이
  C: '<path d="M30 26h40l-4 20a16 16 0 0 1-32 0z"/><path d="M50 66v14M36 80h28"/>',                                        // 컵 — 성배
  S: '<path d="M50 82V22"/><path d="M50 22l-8 12h16z"/><path d="M32 60h36"/>',                                             // 소드 — 칼
  P: '<circle cx="50" cy="50" r="28"/><path d="M50 26l17 12-6.5 20h-21L33 38z"/><path d="M33 38h34M36.5 58L50 26l13.5 32M33 38l27.5 20M67 38L39.5 58"/>' // 펜타클 — 오망성
};

// 카드 뒷면 — 앱의 시그니처 심볼(별과 궤도). 셔플/미공개 카드에 쓴다.
const BACK = '<circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="20"/>'
           + '<path d="M50 24l4.5 14 14 4.5-14 4.5L50 61l-4.5-14-14-4.5 14-4.5z"/>'
           + '<path d="M50 14v6M50 80v6M14 50h6M80 50h6"/>';

// 로마 숫자 — 메이저 카드의 번호 표기(RWS 관례)
const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X',
               'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

// 카드 한 장의 글리프 마크업을 돌려준다
function glyphFor(card){
  if (!card) return svg(BACK);
  if (card.suit === 'major') return svg(MAJOR[card.num] || BACK);
  return svg(SUIT[card.suit] || BACK);
}
function svg(inner, extraClass){
  return `<svg class="glyph${extraClass ? ' ' + extraClass : ''}" ${V} aria-hidden="true">${inner}</svg>`;
}
function backGlyph(){ return svg(BACK, 'glyph-back'); }

// 카드 우상단 계급 표기: 메이저=로마숫자, 핍=아라비아, 코트=약자
function rankMark(card){
  if (!card) return '';
  if (card.suit === 'major') return ROMAN[card.num] !== undefined ? ROMAN[card.num] : '';
  if (card.court) return { Pa:'P', Kn:'N', Qn:'Q', Ki:'K' }[card.court] || '';
  return card.num === 1 ? 'A' : String(card.num);
}

// 캔버스(공유 이미지)용 — SVG를 data URI 이미지로. 외부 요청 없음.
function glyphDataUri(card, color){
  const inner = !card ? BACK
    : (card.suit === 'major' ? (MAJOR[card.num] || BACK) : (SUIT[card.suit] || BACK));
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" `
    + `fill="none" stroke="${color || '#c5a46e'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

global.TarotGlyphs = { MAJOR, SUIT, BACK, ROMAN, glyphFor, backGlyph, rankMark, glyphDataUri, svg };
if (typeof module !== 'undefined' && module.exports) module.exports = global.TarotGlyphs;
})(typeof window !== 'undefined' ? window : globalThis);
