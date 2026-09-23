/* CHaNZe AÇAÍ — オープニング映像（story/ 構成案）
   開幕：黒い器の縁が描かれ、紫が満ち、トッピングが落ちる。器の丸がそのまま広がって映像が開く。
   映像：写真を「器の丸」で切り替え、ゆっくり寄りながら想いの一行を重ねる。
   本物の動画ができたら FILM.video に URL を入れるだけで差し替わる。 */
var FILM = {
  video: "",        // 横長の動画（mp4・音なし推奨）。入れると写真の切り替えの代わりに流れる
  videoMobile: "",  // スマホ用の縦動画（なければ video を使う）
  shotMs: 5600      // 1カットの長さ（ミリ秒）
};

(function () {
  "use strict";
  var root = document.querySelector("[data-film]");
  if (!root) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 700px)").matches;
  var shots = [].slice.call(root.querySelectorAll(".shot"));
  var caps = [].slice.call(root.querySelectorAll(".cap"));
  var bar = root.querySelector(".film-bar");
  var ctl = root.querySelector(".film-ctl");
  var n = shots.length;
  var cur = -1, z = 1, playing = !reduce, onScreen = true, timer = null, capTimer = null;
  var ready = false; // 開幕が終わるまでは文字と進行を動かさない
  var vsrc = (mobile && FILM.videoMobile) ? FILM.videoMobile : FILM.video;

  root.style.setProperty("--shot", FILM.shotMs + "ms");

  /* 画像はスマホ用を優先。1カット目だけ先に読み、残りは出番の直前に読む */
  shots.forEach(function (s, i) {
    var img = s.querySelector("img");
    var src = (mobile && img.getAttribute("data-m")) || img.getAttribute("data-src");
    if (i === 0) img.src = src; else img.setAttribute("data-load", src);
  });
  function load(i) {
    var img = shots[i].querySelector("img");
    var src = img.getAttribute("data-load");
    if (src) { img.src = src; img.removeAttribute("data-load"); }
  }

  /* 本物の動画があれば、写真の切り替えの代わりに流す */
  if (vsrc) {
    var v = document.createElement("video");
    v.className = "film-video";
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
    v.preload = "metadata";
    v.poster = shots[0].querySelector("img").src;
    v.src = vsrc;
    root.querySelector(".film-stage").appendChild(v);
    root.classList.add("has-video");
  }
  function playVideo(on) {
    var vid = root.querySelector("video");
    if (!vid) return;
    if (on) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    else vid.pause();
  }

  /* 進行バー（カットの数だけ）。押すとそのカットへ */
  var segs = shots.map(function (_, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "seg";
    b.setAttribute("aria-label", (i + 1) + "枚目を表示");
    b.innerHTML = "<span></span>";
    b.addEventListener("click", function () { show(i); });
    bar.insertBefore(b, ctl);
    return b;
  });

  function paintBar() {
    segs.forEach(function (b, i) {
      b.classList.remove("is-now");
      b.classList.toggle("is-past", i < cur || (i === cur && !playing));
      b.setAttribute("aria-current", i === cur ? "true" : "false");
    });
    if (playing && segs[cur]) { void segs[cur].offsetWidth; segs[cur].classList.add("is-now"); }
  }

  function caption(i) {
    caps.forEach(function (c, k) {
      c.classList.toggle("is-in", k === i);
      c.setAttribute("aria-hidden", k === i ? "false" : "true");
    });
  }

  function stopTimers() { clearTimeout(timer); clearTimeout(capTimer); }

  function schedule() {
    stopTimers();
    if (!ready || !playing || !onScreen || document.hidden) return;
    capTimer = setTimeout(function () { var c = caps[cur]; if (c) c.classList.remove("is-in"); }, FILM.shotMs - 750);
    timer = setTimeout(function () { show(cur + 1); }, FILM.shotMs);
  }

  function resume() {
    if (!ready || !playing || !onScreen || document.hidden) { stopTimers(); return; }
    caption(cur); paintBar(); schedule();
  }

  /* i 番目のカットへ。silent のときは文字と進行を動かさない（開幕の裏で準備する用） */
  function show(i, silent) {
    i = (i + n) % n;
    if (i === cur && !silent) { resume(); return; }
    load(i); load((i + 1) % n);
    if (!vsrc) {
      var s = shots[i], prev = cur >= 0 ? shots[cur] : null;
      s.classList.remove("is-show", "is-kb", "no-tr");
      s.style.zIndex = ++z;
      void s.offsetWidth;
      if (reduce || !prev) s.classList.add("no-tr");
      s.classList.add("is-show");
      if (!reduce) requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add("is-kb"); }); });
      if (prev && prev !== s) {
        setTimeout(function () {
          if (shots[cur] !== prev) prev.classList.remove("is-show", "is-kb", "no-tr");
        }, reduce ? 0 : 1300);
      }
    }
    cur = i;
    if (silent) return;
    caption(i);
    paintBar();
    schedule();
  }

  function setPlaying(p) {
    playing = p;
    root.classList.toggle("is-paused", !p);
    ctl.setAttribute("aria-pressed", p ? "false" : "true");
    ctl.setAttribute("aria-label", p ? "映像を一時停止" : "映像を再生");
    playVideo(p && onScreen);
    if (p) caption(cur);
    paintBar();
    schedule();
  }
  ctl.addEventListener("click", function () { setPlaying(!playing); });

  /* 画面の外にある間とタブが裏にある間は止める */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[0].isIntersecting;
      playVideo(playing && onScreen);
      resume();
    }, { threshold: 0.15 }).observe(root);
  }
  document.addEventListener("visibilitychange", function () {
    playVideo(playing && onScreen && !document.hidden);
    resume();
  });

  /* 開幕：一杯が盛られて、器の中から映像が開く（1回の訪問で1度だけ） */
  function opening(done) {
    var ov = document.querySelector(".film-open");
    var seen = false;
    try { seen = sessionStorage.getItem("chanze-film-opened") === "1"; } catch (e) {}
    if (!ov || reduce || seen || location.hash || window.scrollY > 40) {
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      done();
      return;
    }
    try { sessionStorage.setItem("chanze-film-opened", "1"); } catch (e) {}
    ov.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add("run"); }); });
    setTimeout(function () {
      var box = ov.querySelector(".open-bowl").getBoundingClientRect();
      var r0 = box.width * 0.31;                                   // 器の中の紫の半径
      var r1 = Math.sqrt(innerWidth * innerWidth + innerHeight * innerHeight) / 2 + 60;
      var t0 = null, D = 820;
      ov.classList.add("out");
      done();
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / D);
        var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        ov.style.setProperty("--hole", (r0 + (r1 - r0) * e).toFixed(1) + "px");
        if (k < 1) requestAnimationFrame(step);
        else if (ov.parentNode) ov.parentNode.removeChild(ov);
      }
      requestAnimationFrame(step);
    }, 2050);
  }

  /* 1カット目を裏で用意してから開幕 */
  show(0, true);
  if (reduce) setPlaying(false);
  opening(function () {
    ready = true;
    playVideo(playing);
    caption(0); paintBar(); schedule();
  });
})();
