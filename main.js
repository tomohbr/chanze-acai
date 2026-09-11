/* CHaNZe AÇAÍ — main.js
   ここだけ差し替えれば本番になる設定 */
var CONFIG = {
  STORE_URL: "",                                   // STORES 注文サイトのURL（審査通過後に入れる）
  LINE_URL:  "https://line.me/R/ti/p/@625xyfcl",   // LINE公式 友だち追加
  MAP_URL:   "",                                   // Googleマップの店舗URL
  IG_URL:    "",                                   // Instagram
  LAW_URL:   "",                                   // 特定商取引法に基づく表記（STORESのページでも可）
  HOURS:     { open: "10:30", close: "20:00", closed: [0], prep: 25 }  // 受付時間・定休日(0=日)・調理時間(分)
};

(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 出現：箱が開く / 行が上がる / 8pxフェード ---- */
  var targets = document.querySelectorAll("[data-open],[data-lines],[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
    // 初期表示（ヒーロー）は即時
    requestAnimationFrame(function () {
      document.querySelectorAll(".hero [data-open],.hero [data-lines],.hero [data-reveal]").forEach(function (el, i) {
        setTimeout(function () { el.classList.add("is-in"); }, 80 + i * 60);
      });
    });
  }

  /* ---- 控えめなパララックス（枠内で写真だけ動く） ---- */
  var px = Array.prototype.slice.call(document.querySelectorAll("[data-parallax] img"));
  if (!reduce && px.length) {
    var ticking = false;
    function move() {
      var vh = window.innerHeight;
      px.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        img.style.transform = "translateY(" + (-8 + p * -6) + "%)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(move); ticking = true; } }, { passive: true });
    move();
  }

  /* ---- 固定CTA：ヒーローの注文ボタンが見えなくなったら出す ---- */
  var sticky = document.getElementById("sticky");
  var flt = document.getElementById("float");
  var heroCta = document.querySelector(".hero .cta-row");
  if (heroCta && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var on = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      if (sticky) sticky.classList.toggle("is-on", on);
      if (flt) flt.classList.toggle("is-on", on);
    }, { threshold: 0 }).observe(heroCta);
  }

  /* ---- 受付状況（今注文できるか） ---- */
  (function () {
    var h = CONFIG.HOURS; if (!h) return;
    var now = new Date();
    function mins(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
    var cur = now.getHours() * 60 + now.getMinutes();
    var last = mins(h.close) - (h.prep || 0);
    var closedToday = (h.closed || []).indexOf(now.getDay()) >= 0;
    var open = !closedToday && cur >= mins(h.open) && cur <= last;
    var text, off = !open;
    if (open) text = "受付中 — 本日 " + h.open + " 〜 " + h.close;
    else if (closedToday) text = "本日定休日 — 明日以降の受け取りで注文できます";
    else if (cur < mins(h.open)) text = "本日 " + h.open + " から受付";
    else text = "本日の受付は終了 — 明日以降の受け取りで注文できます";
    var short = open ? "受付中 " + h.open + "–" + h.close
      : closedToday ? "本日定休日・翌日以降の受取OK"
      : cur < mins(h.open) ? h.open + " から受付" : "本日終了・翌日以降の受取OK";
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.textContent = el.getAttribute("data-status") === "short" ? short : text;
      el.classList.toggle("off", off);
    });
  })();

  /* ---- メニューカードはどこを押しても注文へ ---- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) return;
      var a = card.querySelector("[data-store-url]"); if (a) a.click();
    });
  });

  /* ---- リンク先の差し込み / 未設定なら案内 ---- */
  var toast = document.createElement("div");
  toast.className = "toast"; toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var tt = null;
  function say(msg) {
    toast.textContent = msg; toast.classList.add("is-on");
    if (tt) clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove("is-on"); }, 2400);
  }
  function wire(selector, url, msg) {
    document.querySelectorAll(selector).forEach(function (a) {
      if (url) { a.setAttribute("href", url); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); return; }
      a.addEventListener("click", function (ev) {
        // #order への内部リンクはそのまま通す
        if (a.getAttribute("href") === "#order") return;
        ev.preventDefault(); say(msg);
      });
    });
  }
  wire("[data-store-url]", CONFIG.STORE_URL, "注文サイトは準備中です。オープンにあわせて公開します。");
  wire("[data-map]", CONFIG.MAP_URL, "地図は店舗情報の確定後に表示します。");
  wire("[data-ig]", CONFIG.IG_URL, "Instagramは準備中です。");
  wire("[data-law]", CONFIG.LAW_URL, "準備中です。");
  // ヘッダー・ヒーローの「注文する」は STORE_URL があれば直行、なければ #order へ
  if (CONFIG.STORE_URL) {
    document.querySelectorAll("[data-order]").forEach(function (a) {
      a.setAttribute("href", CONFIG.STORE_URL); a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
    });
  }
})();
