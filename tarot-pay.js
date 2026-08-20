/* p21 타로 — 정식 리딩 결제 (Telegram Stars, SKU: tarot = 250⭐). 무료 폴백 없음. */
(function (root) {
  "use strict";
  var PAY_BACKEND = "https://saju-pay.hoyashi95.workers.dev";
  var BOT_USERNAME = "CheonGi_bot";
  var SKU = "tarot";
  var FALLBACK_STARS = 250;
  var PENDING_KEY = "tarot_pay_pending";
  var pricing = null;
  var pendingCredits = 0;
  var pendingSpread = "celtic";
  var PAID = { celtic: 1, rel7: 1, cross5: 1 };

  function track(type, extra) {
    try { if (root.legionTrack) root.legionTrack(type, extra || {}); } catch (e) {}
  }
  function toast(msg) {
    try { alert(msg); } catch (e) {}
  }
  function webApp() {
    try { if (root.Telegram && root.Telegram.WebApp) return root.Telegram.WebApp; } catch (e) {}
    return null;
  }
  function initData() {
    var w = webApp();
    try { return (w && w.initData) ? w.initData : ""; } catch (e) { return ""; }
  }
  function contentReady() {
    return !!(root.TarotPremium && typeof root.TarotPremium.render === "function");
  }
  function mode() {
    if (!PAY_BACKEND) return "not-configured";
    if (!contentReady()) return "not-configured";
    var w = webApp();
    if (!w || typeof w.openInvoice !== "function") return "outside-telegram";
    if (!initData()) return "outside-telegram";
    return "ready";
  }
  function stars() { return (pricing && pricing.stars) || FALLBACK_STARS; }
  function loadPricing() {
    if (!PAY_BACKEND) return Promise.resolve(null);
    return fetch(PAY_BACKEND + "/pricing?item=" + encodeURIComponent(SKU) + "&lang=ko")
      .then(function (r) { return r.json(); })
      .then(function (d) { pricing = d; return d; })
      .catch(function () { return null; });
  }
  function deliver(entitlement) {
    try {
      root.TarotPremium.render(pendingSpread, entitlement);
      localStorage.removeItem(PENDING_KEY);
      track("premium_unlock", { sku: SKU, paid: 1, spread: pendingSpread });
      render();
      return true;
    } catch (e) {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ orderId: entitlement.orderId, ts: Date.now(), err: "render" }));
      toast("리딩을 여는 중 오류. 열람권은 서버에 남아 있습니다.");
      return false;
    }
  }
  function consume() {
    if (mode() !== "ready") { toast("텔레그램에서 열어야 결제가 됩니다."); return Promise.resolve(false); }
    return fetch(PAY_BACKEND + "/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: initData(), sku: SKU }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && d.orderId) return deliver(d);
        if (d && d.reason === "no-credit") { toast("보유한 열람권이 없습니다."); return false; }
        throw new Error((d && d.error) || "consume failed");
      })
      .catch(function () {
        toast("열람권 확인 실패. 결제분은 서버에 남아 있으니 다시 시도해 주세요.");
        render();
        return false;
      });
  }
  function checkout() {
    if (mode() !== "ready") { explain(mode()); return; }
    track("checkout_open", { sku: SKU, stars: stars() });
    var w = webApp();
    fetch(PAY_BACKEND + "/invoice?item=" + encodeURIComponent(SKU) + "&lang=ko&initData=" + encodeURIComponent(initData()))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.link) throw new Error((d && d.error) || "no link");
        w.openInvoice(d.link, function (status) {
          if (status === "paid") {
            track("invoice_paid", { sku: SKU });
            setTimeout(function () { consume(); }, 1200);
          } else if (status === "failed") toast("결제가 실패했습니다.");
        });
      })
      .catch(function () { toast("결제창을 열지 못했습니다."); });
  }
  function explain(m) {
    if (m === "outside-telegram") {
      toast("정식 타로 결제는 텔레그램 앱 안에서만 가능합니다.");
    } else toast("정식 리딩은 곧 열립니다.");
  }
  function recover() {
    if (mode() !== "ready") return;
    fetch(PAY_BACKEND + "/entitlement?item=" + encodeURIComponent(SKU) + "&initData=" + encodeURIComponent(initData()))
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.credits > 0) { pendingCredits = d.credits; render(); } })
      .catch(function () {});
  }
  function render() {
    var el = document.getElementById("tarotPayBox");
    if (!el) return;
    var price = stars();
    var head = '<div style="color:#e0b552;font-weight:800;font-size:14px;margin-bottom:4px">정식 타로 리딩</div>' +
      '<p style="font-size:12px;line-height:1.65;opacity:.85;margin:0 0 10px">켈틱 크로스 · 관계 7장 · 다섯 장 십자. 1회 열람권. <b>확률 가챠 아님.</b></p>';
    if (pendingCredits > 0) {
      el.innerHTML = head + '<button type="button" class="btn-primary" id="tarotPayOpen">보유 열람권 ' + pendingCredits + "개 · 지금 열기</button>";
      el.querySelector("#tarotPayOpen").onclick = function () { pendingCredits = 0; consume(); };
      return;
    }
    var m = mode();
    if (m === "ready") {
      el.innerHTML = head + '<button type="button" class="btn-primary" id="tarotPayBuy">⭐ ' + price + " — 정식 리딩 열기</button>" +
        '<p style="font-size:11px;opacity:.6;margin:8px 0 0">텔레그램 Stars · 열람 전 환불 가능 · 엔터테인먼트</p>';
      el.querySelector("#tarotPayBuy").onclick = checkout;
      return;
    }
    var note = (m === "not-configured") ? "정식 리딩은 준비 중입니다." : "텔레그램 앱 안에서만 결제됩니다.";
    var link = (m === "outside-telegram" && BOT_USERNAME)
      ? '<a href="https://t.me/' + BOT_USERNAME + '?startapp=tarot" style="display:block;margin-top:8px;color:#e0b552;font-size:12px">텔레그램에서 열기 →</a>'
      : "";
    el.innerHTML = head + '<button type="button" class="btn-quiet" disabled>⭐ ' + price + " — " + note + "</button>" + link;
  }
  function requestPaidSpread(key) {
    pendingSpread = key || "celtic";
    var box = document.getElementById("tarotPayBox");
    if (box) { box.hidden = false; try { box.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} }
    render();
    if (pendingCredits > 0 && mode() === "ready") consume();
    else if (mode() === "ready") checkout();
    else explain(mode());
  }
  function isPaidSpread(key) { return !!PAID[key]; }

  root.TarotPremium = {
    render: function (key, entitlement) {
      var k = key || pendingSpread || "celtic";
      root.__tarotPaidUnlock = true;
      if (typeof root.drawReading === "function") root.drawReading(k);
      root.__tarotPaidUnlock = false;
      var interp = document.getElementById("interp");
      if (interp) {
        var note = document.createElement("p");
        note.style.cssText = "margin-top:12px;font-size:12px;opacity:.8;border-top:1px solid #c5a46e44;padding-top:10px";
        note.textContent = "정식 리딩 · 열람권 " + ((entitlement && entitlement.orderId) || "") + " · 엔터테인먼트 · 예언 아님";
        interp.appendChild(note);
      }
    },
  };
  root.TarotPay = {
    mount: render,
    requestPaidSpread: requestPaidSpread,
    isPaidSpread: isPaidSpread,
    checkout: checkout,
    mode: mode,
  };
  if (document.readyState !== "loading") { recover(); render(); }
  else document.addEventListener("DOMContentLoaded", function () { recover(); render(); });
})(typeof window !== "undefined" ? window : globalThis);
