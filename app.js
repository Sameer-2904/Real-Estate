/* ============================================================
   NESTORA — Immersive Experience — Application Logic
   ============================================================ */
(function(){
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen = window.innerWidth < 880;
  if (isTouch) document.body.classList.add("touch");

  // iOS/Android address-bar-safe viewport height unit, used by the mobile CSS above
  function setVH(){ document.documentElement.style.setProperty("--vh", (window.innerHeight * 0.01) + "px"); }
  setVH();
  window.addEventListener("resize", setVH);
  window.addEventListener("orientationchange", setVH);

  // trims Unsplash payload on small screens; a no-op on desktop
  function optImg(url, mobileWidth){
    if (!isSmallScreen || !url) return url;
    return url.replace(/([?&]w=)\d+/, "$1" + (mobileWidth || 900));
  }

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined"){
    gsap.registerPlugin(ScrollTrigger);
  }

  // The cinematic backdrop is a cross-fading photographic sequence on every
  // device — desktop and mobile now share the exact same experience. (An
  // earlier version swapped in a live WebGL 3D scene on desktop; it behaved
  // inconsistently across different GPUs/drivers, so it's been removed in
  // favour of the reliable version everyone already saw on mobile.)

  /* ============================================================
     TOAST
     ============================================================ */
  function toast(msg){
    const stack = $("#toast-stack");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 3000);
  }

  /* ============================================================
     PRELOADER
     ============================================================ */
  function runPreloader(done){
    const countEl = $("#plCount");
    const mark = $(".pl-mark");
    const tag = $(".pl-tag");
    document.body.style.overflow = "hidden";

    if (prefersReducedMotion){
      finishPreloader(done);
      return;
    }

    const state = { n: 0 };
    gsap.timeline()
      .to(mark, { opacity: 1, y: 0, duration: .6, ease: "power2.out" })
      .to(tag, { opacity: 1, duration: .6, ease: "power2.out" }, "-=.3")
      .to(countEl, { opacity: 1, duration: .4 }, "-=.3")
      .to(state, {
        n: 100, duration: 1.1, ease: "power1.inOut",
        onUpdate: () => { countEl.textContent = String(Math.floor(state.n)).padStart(3, "0") + " — 100"; }
      }, "-=.1")
      .call(() => finishPreloader(done));
  }

  function finishPreloader(done){
    const pre = $("#preloader");
    const mark = $(".pl-mark"), tag = $(".pl-tag"), count = $("#plCount");
    const leftPanel = $(".pl-panel.left"), rightPanel = $(".pl-panel.right");
    if (typeof gsap === "undefined" || prefersReducedMotion){
      pre.style.display = "none";
      document.body.style.overflow = "";
      done();
      return;
    }
    gsap.timeline()
      .to([mark, tag, count], { opacity: 0, y: -10, duration: .4, ease: "power2.in" })
      .to(leftPanel, { xPercent: -100, duration: .8, ease: "power4.inOut" }, "+=.05")
      .to(rightPanel, { xPercent: 100, duration: .8, ease: "power4.inOut" }, "<")
      .call(() => {
        pre.style.display = "none";
        document.body.style.overflow = "";
        done();
      });
  }

  /* ============================================================
     CURSOR
     ============================================================ */
  function initCursor(){
    if (isTouch) return;
    const dot = $("#cursorDot"), ring = $("#cursorRing"), label = $("#cursorLabel");
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });
    (function loop(){
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    const LABELS = { view: "VIEW", explore: "EXPLORE", enter: "ENTER" };
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t){ ring.classList.add("grow"); label.textContent = LABELS[t.dataset.cursor] || "VIEW"; return; }
      if (e.target.closest(".collection-card, .material-cell, .life-cell")){ ring.classList.add("grow"); label.textContent = "EXPLORE"; return; }
      if (e.target.closest("img")){ ring.classList.add("grow"); label.textContent = "VIEW"; return; }
    });
    document.addEventListener("mouseout", (e) => {
      const stillOn = e.relatedTarget && e.relatedTarget.closest && (
        e.relatedTarget.closest("[data-cursor], .collection-card, .material-cell, .life-cell, img")
      );
      if (!stillOn){ ring.classList.remove("grow"); label.textContent = ""; }
    });
  }

  /* ============================================================
     MAGNETIC BUTTONS
     ============================================================ */
  function initMagnetic(){
    if (isTouch || prefersReducedMotion) return;
    $$(".magnetic").forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.16}px, ${y * 0.32}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
    });
  }

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  let lenis;
  function initSmoothScroll(){
    if (prefersReducedMotion || typeof Lenis === "undefined" || isTouch) return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (typeof ScrollTrigger !== "undefined"){
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
  }
  function smoothScrollTo(target){
    if (lenis) lenis.scrollTo(target, { offset: -10 });
    else target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  /* ============================================================
     TOPBAR / JUMP MENU / PROGRESS DOTS
     ============================================================ */
  const SECTIONS = ["hero","journey","interlude","specifications","materials","gallery-pin","floorplan","location","neighborhood-pin","lifestyle","collection","inquiry"];
  function initTopbar(){
    const dotsWrap = $("#tbProgress");
    dotsWrap.innerHTML = SECTIONS.map(id => `<span data-dot-for="${id}"></span>`).join("");
    $$("[data-scroll-to]").forEach(el => el.addEventListener("click", () => {
      const t = $(el.dataset.scrollTo);
      if (t) smoothScrollTo(t);
    }));

    const menu = $("#jumpMenu"), menuBtn = $("#jumpMenuBtn");
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      document.body.classList.toggle("modal-lock", open);
    });
    $("#jumpCloseBtn").addEventListener("click", () => { menu.classList.remove("open"); document.body.classList.remove("modal-lock"); });
    $$(".jump-menu a").forEach(a => a.addEventListener("click", (e) => {
      e.preventDefault();
      menu.classList.remove("open"); document.body.classList.remove("modal-lock");
      const t = $(a.getAttribute("href"));
      if (t) setTimeout(() => smoothScrollTo(t), 250);
    }));

    if (typeof ScrollTrigger === "undefined") return;
    SECTIONS.forEach(id => {
      const el = $("#" + id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: "top 55%", end: "bottom 45%",
        onToggle: (self) => {
          $$(`[data-dot-for="${id}"]`).forEach(d => d.classList.toggle("active", self.isActive));
        }
      });
    });
  }

  /* ============================================================
     3D STAGE INIT + FALLBACK
     ============================================================ */
  function initStage(){
    $("#fbImg0").src = optImg(JOURNEY_SCENES[0].fallbackImage, 1100);
    $("#fbImg0").alt = JOURNEY_SCENES[0].label;
    $("#fbImg1").src = optImg(JOURNEY_SCENES[1] ? JOURNEY_SCENES[1].fallbackImage : JOURNEY_SCENES[0].fallbackImage, 1100);
  }

  function updateFallbackImage(rawProgress){
    const effective = Math.min(rawProgress / 0.82, 1);
    const idx = Math.min(JOURNEY_SCENES.length - 1, Math.round(effective * (JOURNEY_SCENES.length - 1)));
    const img0 = $("#fbImg0"), img1 = $("#fbImg1");
    if (img0.dataset.idx == idx) return;
    const showOnZero = img0.classList.contains("active");
    const target = showOnZero ? img1 : img0;
    const outgoing = showOnZero ? img0 : img1;
    target.src = optImg(JOURNEY_SCENES[idx].fallbackImage, 1100);
    target.alt = JOURNEY_SCENES[idx].label;
    target.dataset.idx = idx;
    target.classList.add("active");
    outgoing.classList.remove("active");
  }

  /* ============================================================
     HERO INTRO
     ============================================================ */
  function playHeroIntro(){
    if (typeof gsap === "undefined" || prefersReducedMotion){
      $$("#hero h1 .line span, .hero-eyebrow span").forEach(s => s.style.transform = "translateY(0)");
      $("#heroCtas").style.opacity = 1; $("#heroCtas").style.transform = "translateY(0)";
      $("#heroScrollHint").style.opacity = 1;
      return;
    }
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .to(".hero-eyebrow span", { y: 0, duration: .8 })
      .to("#hero h1 .line span", { y: 0, duration: 1.05, stagger: .1 }, "-=.5")
      .to("#heroCtas", { opacity: 1, y: 0, duration: .8 }, "-=.5")
      .to("#heroScrollHint", { opacity: 1, duration: .8 }, "-=.5");
  }

  /* ============================================================
     JOURNEY: build DOM, drive the photographic backdrop + text
     via scroll progress. Identical on every device.
     ============================================================ */
  function buildJourney(){
    const journey = $("#journey");
    const sticky = document.createElement("div");
    sticky.className = "journey-sticky";
    sticky.id = "journeySticky";
    sticky.innerHTML = JOURNEY_SCENES.map((s, i) => `
      <div class="journey-scene ${i % 2 === 1 ? "align-right" : ""}" data-scene="${i}">
        <div class="wrap"><div class="js-inner">
          <span class="js-index">${s.index} — ${JOURNEY_SCENES.length.toString().padStart(2,"0")}</span>
          <h3>${s.label}</h3>
          <p>${s.quote}</p>
        </div></div>
      </div>
    `).join("");
    journey.appendChild(sticky);
  }

  function updateJourneyText(rawProgress){
    const effective = Math.min(rawProgress / 0.82, 1);
    const segPos = effective * (JOURNEY_SCENES.length - 1);
    JOURNEY_SCENES.forEach((s, i) => {
      const dist = Math.abs(segPos - i);
      const win = 0.55;
      const o = Math.max(0, 1 - dist / win);
      const el = $(`.journey-scene[data-scene="${i}"]`);
      if (el){
        el.style.opacity = o;
        el.style.transform = `translateY(${(1-o) * 18}px)`;
      }
    });
  }

  function initJourneyScroll(){
    buildJourney();
    if (typeof ScrollTrigger === "undefined") return;

    ScrollTrigger.create({
      trigger: "#journey", start: "top top", end: "bottom bottom", scrub: 0.4,
      onUpdate: (self) => {
        updateFallbackImage(self.progress);
        updateJourneyText(self.progress);
      },
      onLeave: () => { $("#stage-fallback").style.opacity = 0; },
      onEnterBack: () => { $("#stage-fallback").style.opacity = 1; },
    });
  }

  /* ============================================================
     TYPOGRAPHY INTERLUDE
     ============================================================ */
  function initInterlude(){
    if (typeof ScrollTrigger === "undefined"){
      $$(".il-word").forEach(w => w.classList.add("on"));
      return;
    }
    $$(".il-word").forEach((w, i) => {
      ScrollTrigger.create({
        trigger: "#interlude", start: `top+=${i * 20}% center`, end: `top+=${(i+1) * 20}% center`,
        onToggle: (self) => w.classList.toggle("on", self.isActive),
      });
    });
    ScrollTrigger.create({
      trigger: "#interlude", start: "bottom bottom", once: true,
      onEnter: () => $$(".il-word").forEach(w => w.classList.add("on")),
    });
  }

  /* ============================================================
     REVEALS
     ============================================================ */
  function initReveals(container){
    const els = $$(".reveal", container || document);
    if (typeof gsap === "undefined" || prefersReducedMotion){
      els.forEach(el => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    els.forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
  }

  /* ============================================================
     SPECIFICATIONS
     ============================================================ */
  function renderSpecifications(){
    $("#specGrid").innerHTML = SPECIFICATIONS.map(s => `
      <div class="spec-cell">
        <div class="spec-num" data-count="${s.value}">0${s.suffix}</div>
        <div class="spec-label">${s.label}</div>
      </div>
    `).join("");
    $("#specBadges").innerHTML = SPEC_BADGES.map(b => `<span class="spec-badge">${b}</span>`).join("");
    if (typeof ScrollTrigger === "undefined"){
      $$("[data-count]").forEach(el => el.textContent = el.dataset.count);
      return;
    }
    $$("[data-count]").forEach(el => {
      const target = Number(el.dataset.count);
      const obj = { n: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: () => gsap.to(obj, { n: target, duration: 1.6, ease: "power2.out", onUpdate: () => el.textContent = Math.floor(obj.n).toLocaleString("en-IN") }),
      });
    });
  }

  /* ============================================================
     MATERIALS
     ============================================================ */
  function renderMaterials(){
    $("#materialGrid").innerHTML = MATERIALS.map(m => `
      <div class="material-cell" data-cursor="view">
        <img src="${optImg(m.image, 700)}" alt="Close-up texture of ${m.name.toLowerCase()} used in The Glass House" loading="lazy">
        <div class="mc-note"><span>${m.note}</span></div>
        <div class="mc-name">${m.name}</div>
      </div>
    `).join("");
  }

  /* ============================================================
     INTERIOR GALLERY (pinned horizontal)
     ============================================================ */
  function initGallery(){
    const track = $("#galleryTrack");
    track.innerHTML = GALLERY_IMAGES.map((g, i) => `
      <div class="gallery-slide" data-cursor="view">
        <img src="${optImg(g.image, 1100)}" alt="${g.label}, interior photograph of The Glass House" loading="lazy">
        <div class="gs-meta"><div class="gs-count">${String(i+1).padStart(2,"0")} / ${String(GALLERY_IMAGES.length).padStart(2,"0")}</div><div class="gs-label">${g.label}</div></div>
      </div>
    `).join("");
    if (typeof ScrollTrigger === "undefined") return;
    const progressEl = $("#galleryProgress");
    ScrollTrigger.create({
      trigger: "#gallery-pin", start: "top top", end: "bottom bottom", scrub: 0.5,
      onUpdate: (self) => {
        const maxScroll = track.scrollWidth - window.innerWidth + 80;
        gsap.set(track, { x: -self.progress * maxScroll });
        const idx = Math.min(GALLERY_IMAGES.length - 1, Math.round(self.progress * (GALLERY_IMAGES.length - 1)));
        progressEl.innerHTML = `${String(idx+1).padStart(2,"0")} / ${String(GALLERY_IMAGES.length).padStart(2,"0")}`;
      },
    });
  }

  /* ============================================================
     FLOOR PLAN
     ============================================================ */
  function initFloorPlan(){
    const tabs = $("#fpTabs");
    const floors = Object.keys(FLOOR_PLANS);
    tabs.innerHTML = floors.map((f,i) => `<button class="${i===0?"active":""}" data-floor="${f}">${f}</button>`).join("");
    function renderFloor(name){
      const floor = FLOOR_PLANS[name];
      $("#fpCanvas").innerHTML = floor.rooms.map(r => `
        <div class="fp-room" data-room="${r.id}" style="left:${r.x}%; top:${r.y}%; width:${r.w}%; height:${r.h}%; transform:translate(-50%,-50%);">
          <span>${r.name}</span>
        </div>
      `).join("");
      $("#fpInfo").innerHTML = `<p class="fp-empty">Select a room to see its details.</p>`;
      $$("[data-room]", $("#fpCanvas")).forEach(el => {
        el.addEventListener("click", () => {
          $$("[data-room]").forEach(x => x.classList.remove("active"));
          el.classList.add("active");
          const r = floor.rooms.find(x => x.id === el.dataset.room);
          $("#fpInfo").innerHTML = `
            <div class="fi-name">${r.name}</div>
            <div class="fi-purpose">${r.purpose}</div>
            <div class="fi-area">${r.area}</div>
            <div class="fi-features">${r.features.map(f => `<span>${f}</span>`).join("")}</div>
          `;
        });
      });
    }
    renderFloor(floors[0]);
    $$("[data-floor]", tabs).forEach(btn => btn.addEventListener("click", () => {
      $$("[data-floor]", tabs).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $("#fpCanvas").style.opacity = 0;
      setTimeout(() => { renderFloor(btn.dataset.floor); $("#fpCanvas").style.opacity = 1; }, 200);
    }));
  }

  /* ============================================================
     LOCATION
     ============================================================ */
  function initLocation(){
    const pins = [
      { type: "home", x: 50, y: 50, label: RESIDENCE.title },
      { type: "poi", x: 26, y: 28, label: "International School — 8 min" },
      { type: "poi", x: 70, y: 24, label: "City Centre — 12 min" },
      { type: "poi", x: 78, y: 62, label: "Hospital — 11 min" },
      { type: "poi", x: 24, y: 70, label: "Restaurants — 5 min" },
      { type: "poi", x: 60, y: 80, label: "Shopping — 9 min" },
      { type: "poi", x: 86, y: 40, label: "Airport — 18 min" },
    ];
    $("#locMap").innerHTML = pins.map(p => `
      <div class="loc-pin ${p.type}" style="left:${p.x}%; top:${p.y}%;">
        <div class="lp-dot"></div><span class="lp-tip">${p.label}</span>
      </div>
    `).join("");
    $("#locStats").innerHTML = LOCATION_STATS.map(s => `<div class="loc-stat"><span>${s.label}</span><b>${s.time}</b></div>`).join("");
  }

  /* ============================================================
     NEIGHBORHOOD STORY (pinned horizontal)
     ============================================================ */
  function initNeighborhood(){
    const track = $("#nbTrack");
    track.innerHTML = NEIGHBORHOOD_STORY.map(n => `
      <div class="nb-panel">
        <div class="nb-text"><div class="nb-word">${n.word}</div><p>${n.text}</p></div>
        <div class="nb-media"><img src="${optImg(n.image, 1100)}" alt="A scene representing ${n.word.replace('.', '')} in the Amber Hills neighbourhood" loading="lazy"></div>
      </div>
    `).join("");
    if (typeof ScrollTrigger === "undefined") return;
    ScrollTrigger.create({
      trigger: "#neighborhood-pin", start: "top top", end: "bottom bottom", scrub: 0.5,
      onUpdate: (self) => {
        const maxScroll = track.scrollWidth - window.innerWidth;
        gsap.set(track, { x: -self.progress * maxScroll });
      },
    });
  }

  /* ============================================================
     LIFESTYLE
     ============================================================ */
  function renderLifestyle(){
    $("#lifestyleGrid").innerHTML = LIFESTYLE_IMAGES.map(l => `
      <div class="life-cell reveal" data-cursor="view">
        <img src="${optImg(l.image, 700)}" alt="${l.caption}" loading="lazy">
        <div class="lc-cap">${l.caption}</div>
      </div>
    `).join("");
    initReveals($("#lifestyleGrid"));
  }

  /* ============================================================
     PROPERTY COLLECTION + FULLSCREEN EXPERIENCE
     ============================================================ */
  function renderCollection(){
    $("#collectionGrid").innerHTML = COLLECTION.map(c => `
      <article class="collection-card reveal" data-open-experience="${c.id}" data-cursor="explore">
        <div class="cc-media"><img src="${optImg(c.image, 900)}" alt="Exterior photograph of ${c.name} in ${c.location}" loading="lazy"></div>
        <div class="cc-index">${c.index}</div>
        <div class="cc-name">${c.name}</div>
        <div class="cc-loc">${c.location} · ${c.area} · ${c.bedrooms} BEDROOMS</div>
        <div class="cc-meta"><span class="cc-price">${c.price}</span><span class="cc-explore">EXPLORE →</span></div>
      </article>
    `).join("");
    $$("[data-open-experience]").forEach(el => el.addEventListener("click", () => openExperience(el.dataset.openExperience)));
    initReveals($("#collectionGrid"));
  }

  const EXP_TABS = ["GALLERY", "SPECIFICATIONS", "AMENITIES", "LOCATION"];
  function openExperience(id){
    const c = COLLECTION.find(x => x.id === id);
    if (!c) return;
    $("#experienceContent").innerHTML = `
      <div class="exp-hero">
        <img src="${optImg(c.image, 1100)}" alt="Exterior photograph of ${c.name}">
        <div class="exp-hero-info">
          <span class="kicker">${c.location.toUpperCase()}</span>
          <h1>${c.name}</h1>
          <div class="exp-price">${c.price}</div>
        </div>
      </div>
      <div class="exp-tabs" id="expTabs">
        ${EXP_TABS.map((t,i) => `<button class="${i===0?"active":""}" data-tab="${t}">${t}</button>`).join("")}
      </div>
      <div class="exp-panels">
        <div class="exp-panel active" data-panel="GALLERY">
          <div class="exp-gallery-grid">${c.gallery.map(g => `<img src="${optImg(g, 700)}" alt="Interior or exterior view of ${c.name}" loading="lazy">`).join("")}</div>
        </div>
        <div class="exp-panel" data-panel="SPECIFICATIONS">
          <div class="exp-specs-grid">
            <div class="fact"><div class="f-label">AREA</div><div class="f-val">${c.area}</div></div>
            <div class="fact"><div class="f-label">BEDROOMS</div><div class="f-val">${c.bedrooms}</div></div>
            <div class="fact"><div class="f-label">BATHROOMS</div><div class="f-val">${c.bathrooms}</div></div>
            <div class="fact"><div class="f-label">PARKING</div><div class="f-val">${c.parking} Cars</div></div>
            <div class="fact"><div class="f-label">YEAR BUILT</div><div class="f-val">${c.year}</div></div>
            <div class="fact"><div class="f-label">PRICE</div><div class="f-val">${c.price}</div></div>
          </div>
        </div>
        <div class="exp-panel" data-panel="AMENITIES">
          <div class="exp-amenity-row">${c.amenities.map(a => `<span>${a}</span>`).join("")}</div>
        </div>
        <div class="exp-panel" data-panel="LOCATION">
          <div class="loc-map" style="max-width:600px;aspect-ratio:4/2.6;" id="expMiniMap"></div>
          <p style="color:var(--stone);font-size:13px;margin-top:16px;">${c.name} is located in ${c.location}. Full neighbourhood details are shared during a private viewing.</p>
        </div>
      </div>
      <div class="wrap" style="padding-bottom:60px;">
        <button class="btn btn-gold magnetic" data-cursor="enter" id="expRequestBtn">REQUEST PRIVATE VIEWING</button>
      </div>
    `;
    $$("[data-tab]", $("#expTabs")).forEach(btn => btn.addEventListener("click", () => {
      $$("[data-tab]", $("#expTabs")).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".exp-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === btn.dataset.tab));
    }));
    const miniMap = $("#expMiniMap");
    if (miniMap){
      miniMap.innerHTML = `<div class="loc-pin home" style="left:50%;top:50%;"><div class="lp-dot"></div></div>`;
    }
    $("#expRequestBtn").addEventListener("click", () => {
      closeExperience();
      setTimeout(() => {
        smoothScrollTo($("#inquiry"));
        const sel = $("#iProperty");
        if (sel) sel.value = c.id;
      }, 500);
    });
    $("#experienceOverlay").classList.add("open");
    document.body.classList.add("modal-lock");
    initMagnetic();
  }
  function closeExperience(){
    $("#experienceOverlay").classList.remove("open");
    document.body.classList.remove("modal-lock");
  }
  $("#expExitBtn").addEventListener("click", closeExperience);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#experienceOverlay").classList.contains("open")) closeExperience();
  });

  /* ============================================================
     INQUIRY FORM
     ============================================================ */
  function populatePropertySelect(){
    const sel = $("#iProperty");
    sel.innerHTML = `<option value="${RESIDENCE.title}">${RESIDENCE.title} — ${RESIDENCE.location}</option>` +
      COLLECTION.filter(c => c.name !== RESIDENCE.title).map(c => `<option value="${c.id}">${c.name} — ${c.location}</option>`).join("");
  }
  function validateField(id, condition, message){
    const field = $(`#${id}`).closest(".i-field");
    const err = $(".i-error", field);
    if (!condition){ field.classList.add("invalid"); err.textContent = message; return false; }
    field.classList.remove("invalid"); err.textContent = "";
    return true;
  }
  function initInquiryForm(){
    populatePropertySelect();
    const min = new Date(); min.setDate(min.getDate() + 1);
    $("#iDate").min = min.toISOString().split("T")[0];

    $("#advisorName").textContent = ADVISOR.name;
    $("#advisorRole").textContent = ADVISOR.role;
    $("#advisorYears").textContent = `${ADVISOR.years} YEARS EXPERIENCE`;
    $("#advisorImg").src = ADVISOR.portrait;
    $("#advisorImg").alt = `Portrait of ${ADVISOR.name}, ${ADVISOR.role}`;

    $("#inquiryForm").addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      valid = validateField("iName", $("#iName").value.trim().length >= 2, "Please enter your full name.") && valid;
      valid = validateField("iEmail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#iEmail").value.trim()), "Enter a valid email address.") && valid;
      valid = validateField("iPhone", /^[0-9+\-\s]{7,15}$/.test($("#iPhone").value.trim()), "Enter a valid phone number.") && valid;
      valid = validateField("iDate", !!$("#iDate").value, "Choose a preferred date.") && valid;
      if (!valid) return;
      $("#inquiryForm").classList.add("hidden");
      $("#inquirySuccess").classList.add("show");
      toast("Private viewing requested");
    });
    $("#inquiryResetBtn").addEventListener("click", () => {
      $("#inquiryForm").reset();
      $("#inquiryForm").classList.remove("hidden");
      $("#inquirySuccess").classList.remove("show");
      $$(".i-field", $("#inquiryForm")).forEach(f => f.classList.remove("invalid"));
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    initCursor();
    initMagnetic();
    initSmoothScroll();
    initTopbar();
    initStage();
    initJourneyScroll();
    initInterlude();
    renderSpecifications();
    renderMaterials();
    initGallery();
    initFloorPlan();
    initLocation();
    initNeighborhood();
    renderLifestyle();
    renderCollection();
    initInquiryForm();
    initReveals(document);

    if (typeof ScrollTrigger !== "undefined") setTimeout(() => ScrollTrigger.refresh(), 300);
  }

  runPreloader(() => {
    init();
    playHeroIntro();
  });

})();
