/* ============================================================
   NESTORA — Application Logic
   Vanilla JS, modular functions. No build step required.
   ============================================================ */
(function(){
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isTouch) document.body.classList.add("touch");

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined"){
    gsap.registerPlugin(ScrollTrigger);
  }

  const fmtINR = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  /* ============================================================
     STATE
     ============================================================ */
  const State = {
    saved: JSON.parse(localStorage.getItem("nestora_saved") || "[]"),
    compare: JSON.parse(localStorage.getItem("nestora_compare") || "[]"),
    filters: { location: "", type: "", listing: "", beds: "", baths: "", minPrice: "", maxPrice: "", minArea: "", tags: [] },
    sort: "featured",
    listingTab: "buy",
    galleryIndex: 0,
    currentDetailId: null,
  };

  function persist(){
    localStorage.setItem("nestora_saved", JSON.stringify(State.saved));
    localStorage.setItem("nestora_compare", JSON.stringify(State.compare));
  }

  /* ============================================================
     TOASTS
     ============================================================ */
  function toast(msg){
    const stack = $("#toast-stack");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg><span>${msg}</span>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 450);
    }, 3200);
  }

  /* ============================================================
     LOADER
     ============================================================ */
  function runLoader(){
    const loader = $("#loader");
    const bar = $("#loaderBarFill");
    const mark = $(".loader-mark");
    const tag = $(".loader-tag");
    if (prefersReducedMotion){
      loader.classList.add("hide");
      return;
    }
    requestAnimationFrame(() => {
      mark.style.transition = "opacity .6s ease, transform .6s ease";
      mark.style.opacity = 1; mark.style.transform = "translateY(0)";
      setTimeout(() => { tag.style.transition = "opacity .6s ease"; tag.style.opacity = 1; }, 220);
      bar.style.transition = "width 1s cubic-bezier(.6,0,.2,1)";
      setTimeout(() => { bar.style.width = "100%"; }, 260);
    });
    setTimeout(() => {
      loader.classList.add("hide");
      document.body.style.overflow = "";
      playHeroIntro();
    }, 1500);
  }

  function playHeroIntro(){
    if (prefersReducedMotion){
      $$("#hero .line span, .hero-eyebrow span").forEach(s => s.style.transform = "translateY(0)");
      $("#heroSub").style.opacity = 1; $("#heroSub").style.transform = "translateY(0)";
      $("#heroCtas").style.opacity = 1; $("#heroCtas").style.transform = "translateY(0)";
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(".hero-eyebrow span", { y: 0, duration: .8 })
      .to("#hero h1 .line span", { y: 0, duration: 1, stagger: .09 }, "-=.5")
      .to("#heroSub", { opacity: 1, y: 0, duration: .8 }, "-=.5")
      .to("#heroCtas", { opacity: 1, y: 0, duration: .8 }, "-=.6");
  }

  /* ============================================================
     CUSTOM CURSOR
     ============================================================ */
  function initCursor(){
    if (isTouch) return;
    const dot = $("#cursorDot"), ring = $("#cursorRing"), label = $("#cursorLabel");
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });
    function loop(){
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    }
    loop();

    const LABELS = { discover: "DISCOVER", view: "VIEW", explore: "EXPLORE" };
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t){
        ring.classList.add("grow");
        label.textContent = LABELS[t.dataset.cursor] || "VIEW";
      }
      const card = e.target.closest(".property-card, .journal-card, .agent-card");
      if (card && !t){
        ring.classList.add("grow");
        label.textContent = card.classList.contains("journal-card") ? "EXPLORE" : "VIEW";
      }
      const img = e.target.closest(".gallery-main, .pc-media, .dev-media");
      if (img){
        ring.classList.add("grow");
        label.textContent = "EXPLORE";
      }
    });
    document.addEventListener("mouseout", (e) => {
      const stillOn = e.relatedTarget && e.relatedTarget.closest && (
        e.relatedTarget.closest("[data-cursor]") ||
        e.relatedTarget.closest(".property-card, .journal-card, .agent-card, .gallery-main, .pc-media, .dev-media")
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
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
    });
  }

  /* ============================================================
     NAVBAR + MOBILE MENU + SMOOTH SCROLL
     ============================================================ */
  function initNav(){
    const navbar = $("#navbar");
    const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const hamburger = $("#hamburgerBtn");
    const menu = $("#mobileMenu");
    hamburger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      hamburger.classList.toggle("open", open);
      hamburger.setAttribute("aria-expanded", open);
      document.body.classList.toggle("modal-lock", open);
    });
    $$(".mobile-menu a, .mobile-menu button").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open"); hamburger.classList.remove("open");
      document.body.classList.remove("modal-lock");
    }));

    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = $(id);
        if (target){
          e.preventDefault();
          smoothScrollTo(target);
        }
      });
    });
    $$("[data-scroll-to]").forEach(el => {
      el.addEventListener("click", () => {
        const target = $(el.dataset.scrollTo);
        if (target) smoothScrollTo(target);
      });
    });

    $$("[data-nav-buy]").forEach(el => el.addEventListener("click", () => setTimeout(() => { $("#fListing").value = "buy"; applyFilters(); }, 350)));
    $$("[data-nav-rent]").forEach(el => el.addEventListener("click", () => setTimeout(() => { $("#fListing").value = "rent"; applyFilters(); }, 350)));
  }

  let lenis;
  function initSmoothScroll(){
    if (prefersReducedMotion || typeof Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== "undefined"){
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  function smoothScrollTo(target){
    if (lenis){ lenis.scrollTo(target, { offset: -70 }); }
    else { target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" }); }
  }

  /* ============================================================
     SCROLL REVEALS (GSAP ScrollTrigger)
     ============================================================ */
  function initReveals(container){
    const els = $$(".reveal", container || document);
    if (typeof gsap === "undefined" || prefersReducedMotion){
      els.forEach(el => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    els.forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
  }

  function revealPropertyCards(container){
    const cards = $$(".property-card", container);
    if (typeof gsap === "undefined" || prefersReducedMotion){
      cards.forEach(c => { c.style.opacity = 1; c.style.transform = "none"; });
      return;
    }
    gsap.to(cards, {
      opacity: 1, y: 0, duration: .7, stagger: .07, ease: "power3.out",
      scrollTrigger: { trigger: container, start: "top 85%", once: true }
    });
  }

  /* ============================================================
     PROPERTY CARD TEMPLATE
     ============================================================ */
  function iconBed(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18"/><path d="M5 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"/></svg>`; }
  function iconBath(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M7 12V6a2 2 0 0 1 3-1.7"/><line x1="4" y1="19" x2="4" y2="21"/><line x1="20" y1="19" x2="20" y2="21"/></svg>`; }
  function iconArea(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16"/><path d="M4 9h4M4 15h4M20 9h-4M20 15h-4"/></svg>`; }
  function iconHeart(){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6l-3-3c-1.6-1.6-4.2-1.6-5.8 0-1.6 1.6-1.6 4.2 0 5.8L12 19l8.8-8.6c1.6-1.6 1.6-4.2 0-5.8z"/></svg>`; }

  function propertyCardHTML(p){
    const isSaved = State.saved.includes(p.id);
    const isCompared = State.compare.includes(p.id);
    return `
    <article class="property-card reveal" data-id="${p.id}">
      <div class="pc-media" data-open-detail="${p.id}" data-cursor="view">
        <img src="${p.images[0]}" alt="Exterior view of ${p.name} in ${p.location}" loading="lazy" width="600" height="465">
        <span class="pc-tag">${p.listingType === "rent" ? "For Rent" : p.type}</span>
        <button class="pc-fav ${isSaved ? "active" : ""}" data-fav="${p.id}" aria-label="${isSaved ? "Remove from saved" : "Save property"}" aria-pressed="${isSaved}">${iconHeart()}</button>
        <label class="pc-compare ${isCompared ? "active" : ""}">
          <input type="checkbox" data-compare="${p.id}" ${isCompared ? "checked" : ""}/> Compare
        </label>
      </div>
      <div class="pc-body">
        <div class="pc-price">${p.priceLabel}</div>
        <div class="pc-name">${p.name}</div>
        <div class="pc-loc">${p.location}</div>
        <div class="pc-meta">
          <span>${iconBed()} ${p.beds} Bed</span>
          <span>${iconBath()} ${p.baths} Bath</span>
          <span>${iconArea()} ${p.sqft.toLocaleString("en-IN")} Sq Ft</span>
        </div>
        <div class="pc-view" data-open-detail="${p.id}" data-cursor="view">
          <span>View Property</span><span class="arrow">→</span>
        </div>
      </div>
    </article>`;
  }

  function bindCardEvents(container){
    $$("[data-open-detail]", container).forEach(el => {
      el.addEventListener("click", () => openDetail(el.dataset.openDetail));
    });
    $$("[data-fav]", container).forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSaved(el.dataset.fav, el);
      });
    });
    $$("[data-compare]", container).forEach(el => {
      el.addEventListener("click", (e) => e.stopPropagation());
      el.addEventListener("change", (e) => {
        toggleCompare(el.dataset.compare, el.checked);
      });
    });
  }

  function toggleSaved(id, btnEl){
    const idx = State.saved.indexOf(id);
    const nowSaved = idx === -1;
    if (nowSaved) State.saved.push(id); else State.saved.splice(idx, 1);
    persist();
    updateSavedUI();
    toast(nowSaved ? "Saved to your shortlist" : "Removed from saved");
    $$(`[data-fav="${id}"]`).forEach(b => {
      b.classList.toggle("active", nowSaved);
      b.setAttribute("aria-pressed", nowSaved);
      b.classList.add("pop");
      setTimeout(() => b.classList.remove("pop"), 350);
    });
  }

  function updateSavedUI(){
    $("#savedCount").textContent = State.saved.length;
    $("#savedCountMobile").textContent = State.saved.length;
  }

  function toggleCompare(id, checked){
    const idx = State.compare.indexOf(id);
    if (checked && idx === -1){
      if (State.compare.length >= 3){
        toast("You can compare up to 3 properties");
        $$(`[data-compare="${id}"]`).forEach(cb => cb.checked = false);
        return;
      }
      State.compare.push(id);
    } else if (!checked && idx !== -1){
      State.compare.splice(idx, 1);
    }
    persist();
    $$(`[data-compare="${id}"]`).forEach(cb => cb.checked = State.compare.includes(id));
    $$(`.property-card[data-id="${id}"] .pc-compare`).forEach(el => el.classList.toggle("active", State.compare.includes(id)));
    renderCompareTray();
    renderComparisonTable();
  }

  function renderCompareTray(){
    const tray = $("#compareTray");
    const chips = $("#compareChips");
    if (State.compare.length === 0){ tray.classList.remove("open"); return; }
    tray.classList.add("open");
    chips.innerHTML = State.compare.map(id => {
      const p = NESTORA_PROPERTIES.find(x => x.id === id);
      if (!p) return "";
      return `<span class="compare-chip">${p.name}<button data-remove-compare="${id}" aria-label="Remove ${p.name} from compare">×</button></span>`;
    }).join("");
    $$("[data-remove-compare]", chips).forEach(btn => {
      btn.addEventListener("click", () => toggleCompare(btn.dataset.removeCompare, false));
    });
    $("#compareHint").textContent = State.compare.length >= 3 ? "Maximum reached" : `${3 - State.compare.length} more can be added`;
  }

  /* ============================================================
     FEATURED + DISCOVER GRIDS / FILTER LOGIC
     ============================================================ */
  function renderFeatured(){
    const grid = $("#featuredGrid");
    const featured = NESTORA_PROPERTIES.filter(p => p.featured);
    grid.innerHTML = featured.map(propertyCardHTML).join("");
    bindCardEvents(grid);
    revealPropertyCards(grid);
  }

  function getFilteredSorted(){
    let list = NESTORA_PROPERTIES.slice();
    const f = State.filters;
    if (f.location) list = list.filter(p => p.location === f.location);
    if (f.type) list = list.filter(p => p.type === f.type);
    if (f.listing) list = list.filter(p => p.listingType === f.listing);
    if (f.beds) list = list.filter(p => p.beds >= Number(f.beds));
    if (f.baths) list = list.filter(p => p.baths >= Number(f.baths));
    if (f.minPrice) list = list.filter(p => p.price >= Number(f.minPrice));
    if (f.maxPrice) list = list.filter(p => p.price <= Number(f.maxPrice));
    if (f.minArea) list = list.filter(p => p.sqft >= Number(f.minArea));
    if (f.tags.length){
      list = list.filter(p => f.tags.every(tag => {
        if (tag === "furnished") return p.furnished !== "Unfurnished";
        return p.tags.includes(tag);
      }));
    }
    switch (State.sort){
      case "price-asc": list.sort((a,b) => a.price - b.price); break;
      case "price-desc": list.sort((a,b) => b.price - a.price); break;
      case "newest": list.sort((a,b) => b.yearBuilt - a.yearBuilt); break;
      default: list.sort((a,b) => (b.featured?1:0) - (a.featured?1:0));
    }
    return list;
  }

  function renderDiscover(){
    const grid = $("#discoverGrid");
    const list = getFilteredSorted();
    $("#resultsCount").textContent = list.length;
    $("#noResults").classList.toggle("hidden", list.length > 0);
    grid.innerHTML = list.map(propertyCardHTML).join("");
    bindCardEvents(grid);
    revealPropertyCards(grid);
  }

  function applyFilters(){
    State.filters.location = $("#fLocation").value;
    State.filters.type = $("#fType").value;
    State.filters.listing = $("#fListing").value;
    State.filters.minPrice = $("#fMinPrice").value;
    State.filters.maxPrice = $("#fMaxPrice").value;
    State.filters.minArea = $("#fMinArea").value;
    renderDiscover();
  }

  function resetFilters(){
    State.filters = { location: "", type: "", listing: "", beds: "", baths: "", minPrice: "", maxPrice: "", minArea: "", tags: [] };
    $("#fLocation").value = ""; $("#fType").value = ""; $("#fListing").value = "";
    $("#fMinPrice").value = ""; $("#fMaxPrice").value = ""; $("#fMinArea").value = "";
    $$("#fBeds .chip").forEach(c => c.classList.toggle("active", c.dataset.val === ""));
    $$("#fBaths .chip").forEach(c => c.classList.toggle("active", c.dataset.val === ""));
    $$("#fAmenities .chip").forEach(c => c.classList.remove("active"));
    renderDiscover();
  }

  function initDiscover(){
    renderDiscover();
    $("#filterToggleBtn").addEventListener("click", () => {
      const panel = $("#filtersPanel");
      const open = panel.classList.toggle("open");
      $("#filterToggleBtn").setAttribute("aria-expanded", open);
    });
    $("#applyFiltersBtn").addEventListener("click", applyFilters);
    $("#resetFiltersBtn").addEventListener("click", resetFilters);
    $("#sortSelect").addEventListener("change", (e) => { State.sort = e.target.value; renderDiscover(); });

    $$("#fBeds .chip").forEach(c => c.addEventListener("click", () => {
      $$("#fBeds .chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      State.filters.beds = c.dataset.val;
      renderDiscover();
    }));
    $$("#fBaths .chip").forEach(c => c.addEventListener("click", () => {
      $$("#fBaths .chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      State.filters.baths = c.dataset.val;
      renderDiscover();
    }));
    $$("#fAmenities .chip").forEach(c => c.addEventListener("click", () => {
      c.classList.toggle("active");
      const tag = c.dataset.tag;
      const idx = State.filters.tags.indexOf(tag);
      if (c.classList.contains("active") && idx === -1) State.filters.tags.push(tag);
      if (!c.classList.contains("active") && idx !== -1) State.filters.tags.splice(idx, 1);
      renderDiscover();
    }));
  }

  /* ============================================================
     HERO SEARCH
     ============================================================ */
  function initHeroSearch(){
    $$(".search-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".search-tabs button").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
        btn.classList.add("active"); btn.setAttribute("aria-selected","true");
        State.listingTab = btn.dataset.listing;
      });
    });
    $("#heroSearchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const loc = $("#sLocation").value, type = $("#sType").value, priceRange = $("#sPrice").value, beds = $("#sBeds").value;
      resetFilters();
      $("#fLocation").value = loc; State.filters.location = loc;
      $("#fType").value = type; State.filters.type = type;
      if (State.listingTab === "rent"){ $("#fListing").value = "rent"; State.filters.listing = "rent"; }
      else if (State.listingTab === "buy"){ $("#fListing").value = "buy"; State.filters.listing = "buy"; }
      if (priceRange){
        const [min,max] = priceRange.split("-");
        $("#fMinPrice").value = min; $("#fMaxPrice").value = max;
        State.filters.minPrice = min; State.filters.maxPrice = max;
      }
      if (beds){
        State.filters.beds = beds;
        $$("#fBeds .chip").forEach(c => c.classList.toggle("active", c.dataset.val === beds));
      }
      renderDiscover();
      smoothScrollTo($("#discover"));
      toast(`Showing homes ${loc ? "in " + loc : "across all locations"}`);
    });
  }

  /* ============================================================
     HERO PARALLAX
     ============================================================ */
  function initHeroParallax(){
    if (prefersReducedMotion) return;
    const img = $("#heroMedia img");
    if (typeof gsap === "undefined"){
      window.addEventListener("scroll", () => {
        const y = Math.min(window.scrollY, 700);
        img.style.transform = `translateY(${y * 0.18}px) scale(1.08)`;
      }, { passive: true });
      return;
    }
    gsap.to(img, {
      yPercent: 14, ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  /* ============================================================
     PROPERTY DETAIL OVERLAY
     ============================================================ */
  function iconAmenity(name){
    const map = {
      "Private Pool": `<circle cx="12" cy="12" r="9"/><path d="M4 12c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 3-1.5"/>`,
      "Garden": `<path d="M12 22c4-2 6-6 6-10a6 6 0 0 0-12 0c0 4 2 8 6 10z"/><path d="M12 12V4"/>`,
      "Smart Home": `<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M9 20v-5h6v5"/><path d="M2 10 12 3l10 7"/>`,
      "Modular Kitchen": `<path d="M4 4h16v16H4z"/><path d="M4 12h16"/><circle cx="8" cy="8" r="1.4"/><circle cx="12" cy="8" r="1.4"/>`,
      "Covered Parking": `<rect x="3" y="9" width="18" height="10" rx="1"/><path d="M3 9l3-5h12l3 5"/><circle cx="7.5" cy="15.5" r="1.3"/><circle cx="16.5" cy="15.5" r="1.3"/>`,
      "Security": `<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/>`,
      "Terrace": `<path d="M3 21h18"/><path d="M5 21V10l7-6 7 6v11"/><path d="M9 21v-6h6v6"/>`,
      "Home Office": `<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M8 21h8"/><path d="M12 17v4"/>`,
      "Gym": `<path d="M6 7v10M18 7v10"/><path d="M2 10v4M22 10v4"/><path d="M6 12h12"/>`,
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${map[name] || map["Smart Home"]}</svg>`;
  }

  function openDetail(id){
    const p = NESTORA_PROPERTIES.find(x => x.id === id);
    if (!p) return;
    State.currentDetailId = id;
    State.galleryIndex = 0;
    const agent = NESTORA_AGENTS.find(a => a.id === p.agentId);
    const floorTabs = Object.keys(p.floorPlans);

    $("#detailContent").innerHTML = `
      <div class="detail-hero">
        <img id="detailHeroImg" src="${p.images[0]}" alt="Primary exterior photograph of ${p.name}">
        <div class="detail-hero-info">
          <div class="dh-loc">${p.location}</div>
          <h1>${p.name}</h1>
          <div class="dh-meta">${p.beds} Beds · ${p.baths} Baths · ${p.sqft.toLocaleString("en-IN")} Sq Ft</div>
          <div class="dh-price">${p.priceLabel}</div>
        </div>
      </div>
      <div class="wrap detail-actions">
        <button class="btn btn-primary magnetic" data-cursor="discover" id="detailScheduleBtn">SCHEDULE A VISIT</button>
        <button class="btn btn-outline magnetic" data-cursor="discover" id="detailContactBtn">CONTACT AGENT</button>
        <button class="btn btn-outline btn-sm" id="detailSaveBtn">${State.saved.includes(id) ? "♥ SAVED" : "♡ SAVE PROPERTY"}</button>
      </div>

      <div class="wrap detail-gallery">
        <div class="gallery-main" data-cursor="explore">
          <img id="galleryMainImg" src="${p.images[0]}" alt="${p.name} — photo 1 of ${p.images.length}">
          <button class="gallery-nav prev" id="galPrevBtn" aria-label="Previous photo">‹</button>
          <button class="gallery-nav next" id="galNextBtn" aria-label="Next photo">›</button>
          <button class="gallery-expand" id="galExpandBtn">VIEW FULLSCREEN</button>
        </div>
        <div class="gallery-thumbs" id="galleryThumbs">
          ${p.images.map((src,i) => `<img src="${src}" data-idx="${i}" class="${i===0?'active':''}" alt="${p.name} thumbnail ${i+1}">`).join("")}
        </div>
      </div>

      <div class="wrap detail-body">
        <div class="detail-main">
          <span class="eyebrow">PROPERTY OVERVIEW</span>
          <h2>${p.headline}</h2>
          <p class="lede">${p.description}</p>

          <div class="fact-grid">
            <div class="fact"><div class="f-label">PROPERTY TYPE</div><div class="f-val">${p.type}</div></div>
            <div class="fact"><div class="f-label">YEAR BUILT</div><div class="f-val">${p.yearBuilt}</div></div>
            <div class="fact"><div class="f-label">AREA</div><div class="f-val">${p.sqft.toLocaleString("en-IN")} Sq Ft</div></div>
            <div class="fact"><div class="f-label">PARKING</div><div class="f-val">${p.parking} Cars</div></div>
            <div class="fact"><div class="f-label">FLOORS</div><div class="f-val">${p.floors}</div></div>
            <div class="fact"><div class="f-label">STATUS</div><div class="f-val">${p.status}</div></div>
          </div>

          <span class="eyebrow" style="display:block;margin-top:50px;">AMENITIES</span>
          <h3 style="margin-bottom:0;">What comes with the home</h3>
          <div class="amenity-grid">
            ${p.amenities.map(a => `<div class="amenity">${iconAmenity(a)}<span>${a}</span></div>`).join("")}
          </div>

          <span class="eyebrow" style="display:block;margin-top:50px;">FLOOR PLAN</span>
          <h3 style="margin-bottom:0;">Room by room</h3>
          <div class="floorplan-tabs" id="floorplanTabs">
            ${floorTabs.map((t,i) => `<button class="${i===0?'active':''}" data-floor="${t}">${t.toUpperCase()}</button>`).join("")}
          </div>
          <div class="floorplan-view">
            <img id="floorplanImg" src="${p.floorPlans[floorTabs[0]]}" alt="${floorTabs[0]} architectural floor plan of ${p.name}">
          </div>
        </div>

        <aside class="detail-side">
          <div class="side-card">
            <h3>Your advisor</h3>
            <div class="agent-mini">
              <img src="${agent.portrait}" alt="Portrait of ${agent.name}">
              <div>
                <div class="am-name">${agent.name}</div>
                <div class="am-role">${agent.specialty}</div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" style="width:100%;margin-top:18px;" id="sideAgentBtn">VIEW PROFILE</button>
          </div>
          <div class="side-card">
            <h3>Location</h3>
            <div class="map-block">
              <div class="neighborhood-map" style="position:absolute;inset:0;border:none;border-radius:0;" id="detailMiniMap"></div>
            </div>
            <div class="map-stat-list">
              <div class="map-stat"><span>City centre</span><b>${p.walkscore.city} min</b></div>
              <div class="map-stat"><span>Nearest school</span><b>${p.walkscore.school} min</b></div>
              <div class="map-stat"><span>Airport</span><b>${p.walkscore.airport} min</b></div>
            </div>
          </div>
        </aside>
      </div>
      <div style="height:60px"></div>
    `;

    bindDetailEvents(p);
    renderMiniMap($("#detailMiniMap"));
    const overlay = $("#detailOverlay");
    overlay.classList.add("open");
    document.body.classList.add("modal-lock");
    overlay.scrollTop = 0;
    initMagnetic();
  }

  function bindDetailEvents(p){
    $("#galPrevBtn").addEventListener("click", () => stepGallery(p, -1));
    $("#galNextBtn").addEventListener("click", () => stepGallery(p, 1));
    $("#galExpandBtn").addEventListener("click", () => openFullscreenGallery(p));
    const galMain = $("#galleryMainImg").parentElement;
    galMain.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      if (isTouch) return; // avoid opening fullscreen on a swipe-tap
      openFullscreenGallery(p);
    });
    bindSwipe(galMain, () => stepGallery(p, 1), () => stepGallery(p, -1));
    $$("#galleryThumbs img").forEach(img => img.addEventListener("click", () => {
      State.galleryIndex = Number(img.dataset.idx);
      updateGallery(p);
    }));
    $$("#floorplanTabs button").forEach(btn => btn.addEventListener("click", () => {
      $$("#floorplanTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const img = $("#floorplanImg");
      img.style.opacity = 0;
      setTimeout(() => { img.src = p.floorPlans[btn.dataset.floor]; img.style.opacity = 1; }, 180);
    }));
    $("#detailSaveBtn").addEventListener("click", (e) => {
      toggleSaved(p.id);
      e.target.textContent = State.saved.includes(p.id) ? "♥ SAVED" : "♡ SAVE PROPERTY";
    });
    $("#detailScheduleBtn").addEventListener("click", () => openScheduleModal(p.id));
    $("#detailContactBtn").addEventListener("click", () => openAgentModal(p.agentId));
    $("#sideAgentBtn").addEventListener("click", () => openAgentModal(p.agentId));
  }

  function bindSwipe(el, onLeft, onRight){
    let startX = 0, startY = 0, tracking = false;
    el.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; tracking = true;
    }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4){
        if (dx < 0) onLeft(); else onRight();
      }
    }, { passive: true });
  }

  function stepGallery(p, dir){
    State.galleryIndex = (State.galleryIndex + dir + p.images.length) % p.images.length;
    updateGallery(p);
  }
  function updateGallery(p){
    const img = $("#galleryMainImg");
    img.style.opacity = 0;
    setTimeout(() => {
      img.src = p.images[State.galleryIndex];
      img.alt = `${p.name} — photo ${State.galleryIndex + 1} of ${p.images.length}`;
      img.style.opacity = 1;
    }, 180);
    $$("#galleryThumbs img").forEach((t,i) => t.classList.toggle("active", i === State.galleryIndex));
  }

  function closeDetail(){
    $("#detailOverlay").classList.remove("open");
    document.body.classList.remove("modal-lock");
  }
  $("#detailCloseBtn").addEventListener("click", closeDetail);

  /* ---------- Fullscreen gallery ---------- */
  function openFullscreenGallery(p){
    const fg = $("#fullscreenGallery");
    fg.classList.add("open");
    updateFullscreen(p);
    fg._prop = p;
  }
  function updateFullscreen(p){
    $("#fsImage").src = p.images[State.galleryIndex];
    $("#fsImage").alt = `${p.name} full view, photo ${State.galleryIndex+1} of ${p.images.length}`;
    $("#fsCount").textContent = `${State.galleryIndex + 1} / ${p.images.length}`;
  }
  $("#fsCloseBtn").addEventListener("click", () => $("#fullscreenGallery").classList.remove("open"));
  $("#fsPrevBtn").addEventListener("click", () => {
    const p = $("#fullscreenGallery")._prop; if (!p) return;
    stepGallery(p, -1); updateFullscreen(p);
  });
  $("#fsNextBtn").addEventListener("click", () => {
    const p = $("#fullscreenGallery")._prop; if (!p) return;
    stepGallery(p, 1); updateFullscreen(p);
  });
  bindSwipe($("#fullscreenGallery"), () => $("#fsNextBtn").click(), () => $("#fsPrevBtn").click());
  document.addEventListener("keydown", (e) => {
    const fg = $("#fullscreenGallery");
    if (fg.classList.contains("open")){
      if (e.key === "Escape") fg.classList.remove("open");
      if (e.key === "ArrowLeft") $("#fsPrevBtn").click();
      if (e.key === "ArrowRight") $("#fsNextBtn").click();
    } else if ($("#detailOverlay").classList.contains("open") && e.key === "Escape"){
      closeDetail();
    }
  });

  /* ============================================================
     NEIGHBOURHOOD MAP (stylised)
     ============================================================ */
  const MAP_PINS = [
    { type: "home", x: 50, y: 52, label: "The Oak Residence" },
    { type: "school", x: 30, y: 30, label: "Amber International School — 8 min" },
    { type: "school", x: 68, y: 25, label: "Riverdale Academy — 14 min" },
    { type: "hospital", x: 74, y: 60, label: "Sanjeevani Hospital — 11 min" },
    { type: "poi", x: 22, y: 66, label: "Amber Fort Market — 6 min" },
    { type: "poi", x: 60, y: 78, label: "Jaipur City Centre — 12 min" },
    { type: "poi", x: 85, y: 40, label: "Cafe Rasoi — 4 min" },
    { type: "poi", x: 38, y: 80, label: "Sawai Mansingh Stadium — 9 min" },
  ];
  function pinMarkup(){
    return MAP_PINS.map(pin => `
      <div class="map-pin ${pin.type === 'poi' ? '' : pin.type}" style="left:${pin.x}%; top:${pin.y}%;">
        <div class="pin-dot" style="${pin.type==='poi' ? 'background:var(--charcoal);width:10px;height:10px;' : ''}"></div>
        <span class="pin-tooltip">${pin.label}</span>
      </div>`).join("");
  }
  function renderNeighborhoodMap(){
    $("#neighborhoodMap").innerHTML = `
      <div class="map-road" style="left:0;right:0;top:48%;height:3px;transform:rotate(-2deg);"></div>
      <div class="map-road" style="left:44%;top:0;bottom:0;width:3px;transform:rotate(6deg);"></div>
      ${pinMarkup()}
    `;
  }
  function renderMiniMap(el){
    if (!el) return;
    el.innerHTML = `
      <div class="map-road" style="left:0;right:0;top:50%;height:2px;"></div>
      <div class="map-road" style="left:50%;top:0;bottom:0;width:2px;"></div>
      <div class="map-pin home" style="left:50%;top:50%;"><div class="pin-dot"></div></div>
      <div class="map-pin school" style="left:30%;top:28%;"><div class="pin-dot"></div><span class="pin-tooltip">School — 8 min</span></div>
      <div class="map-pin hospital" style="left:72%;top:62%;"><div class="pin-dot"></div><span class="pin-tooltip">Hospital — 11 min</span></div>
    `;
  }

  /* ============================================================
     STEP INSIDE — stylised interactive "3D" composition (SVG)
     ============================================================ */
  const HOTSPOTS = [
    { x: 30, y: 62, title: "Living Room", body: "Double-height glazing opens the living pavilion fully onto the garden terrace." },
    { x: 66, y: 40, title: "Master Suite", body: "A private balcony and dressing room sit above the study, facing east." },
    { x: 20, y: 40, title: "Kitchen", body: "Honed stone counters and a butler's pantry built for entertaining." },
    { x: 78, y: 70, title: "Terrace", body: "1,400 sq ft of covered terrace wraps the rear of the residence." },
  ];
  function houseSVG(){
    return `
    <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stylised architectural illustration of a modern villa">
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2b2a26"/><stop offset="1" stop-color="#201e1b"/>
        </linearGradient>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F6F3EC"/><stop offset="1" stop-color="#DAD3C4"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="600" height="380" fill="url(#skyG)"/>
      <ellipse cx="300" cy="330" rx="260" ry="26" fill="#141310" opacity=".5"/>
      <!-- base -->
      <rect x="120" y="200" width="360" height="120" fill="url(#wallG)"/>
      <rect x="120" y="200" width="360" height="10" fill="#A87B42" opacity=".8"/>
      <!-- roof slab -->
      <rect x="90" y="170" width="420" height="20" fill="#3a372f"/>
      <!-- second volume -->
      <rect x="330" y="90" width="150" height="110" fill="#EFEADF"/>
      <rect x="330" y="90" width="150" height="8" fill="#A87B42" opacity=".8"/>
      <rect x="300" y="70" width="210" height="14" fill="#2c2a25"/>
      <!-- windows -->
      <g fill="#4B5240" opacity=".85">
        <rect x="150" y="230" width="70" height="60"/>
        <rect x="240" y="230" width="70" height="60"/>
        <rect x="355" y="120" width="50" height="45"/>
        <rect x="420" y="120" width="45" height="45"/>
      </g>
      <g stroke="#f6f3ec22" stroke-width="1.5">
        <line x1="185" y1="230" x2="185" y2="290"/><line x1="150" y1="260" x2="220" y2="260"/>
        <line x1="275" y1="230" x2="275" y2="290"/><line x1="240" y1="260" x2="310" y2="260"/>
      </g>
      <!-- terrace slab -->
      <rect x="60" y="318" width="480" height="10" fill="#4B5240" opacity=".7"/>
      <!-- steps -->
      <rect x="270" y="320" width="60" height="8" fill="#EFEADF" opacity=".5"/>
      <rect x="280" y="328" width="40" height="8" fill="#EFEADF" opacity=".35"/>
      <!-- tree -->
      <circle cx="70" cy="250" r="34" fill="#4B5240" opacity=".55"/>
      <rect x="65" y="270" width="10" height="50" fill="#3a372f" opacity=".7"/>
      <circle cx="545" cy="260" r="26" fill="#4B5240" opacity=".45"/>
      <rect x="540" y="278" width="8" height="42" fill="#3a372f" opacity=".6"/>
    </svg>`;
  }
  function initStepInside(){
    const wrap = $("#house3dWrap");
    const inner = $("#house3d");
    inner.innerHTML = houseSVG() + HOTSPOTS.map((h,i) => `
      <div class="hotspot" style="left:${h.x}%;top:${h.y}%;" data-hotspot="${i}" tabindex="0" role="button" aria-label="${h.title}"></div>
    `).join("") + HOTSPOTS.map((h,i) => `
      <div class="hotspot-panel" id="hpPanel${i}" style="left:${Math.min(h.x+6,70)}%; top:${Math.max(h.y-18,4)}%;">
        <h4>${h.title}</h4><p>${h.body}</p>
      </div>
    `).join("");

    $$("[data-hotspot]", inner).forEach(hs => {
      const idx = hs.dataset.hotspot;
      const openPanel = () => {
        $$(".hotspot-panel", inner).forEach(p => p.classList.remove("show"));
        $$(".hotspot", inner).forEach(h => h.classList.remove("active"));
        $(`#hpPanel${idx}`).classList.add("show");
        hs.classList.add("active");
      };
      hs.addEventListener("click", (e) => { e.stopPropagation(); openPanel(); });
      hs.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openPanel(); }});
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#house3dWrap")){
        $$(".hotspot-panel").forEach(p => p.classList.remove("show"));
        $$(".hotspot").forEach(h => h.classList.remove("active"));
      }
    });

    if (isTouch || prefersReducedMotion) return;
    let dragging = false, startX = 0, startY = 0, rotY = 0, rotX = 0;
    wrap.addEventListener("mousedown", (e) => { dragging = true; startX = e.clientX; startY = e.clientY; });
    window.addEventListener("mouseup", () => dragging = false);
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      rotY = Math.max(-18, Math.min(18, dx * 0.06));
      rotX = Math.max(-10, Math.min(10, -dy * 0.06));
      inner.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    });
    wrap.addEventListener("mouseleave", () => { dragging = false; });
    // subtle idle float via scroll
    if (typeof gsap !== "undefined"){
      gsap.fromTo(inner, { y: 18 }, {
        y: -6, ease: "none",
        scrollTrigger: { trigger: "#step-inside", start: "top bottom", end: "bottom top", scrub: 1 }
      });
    }
  }

  /* ============================================================
     DEVELOPMENTS
     ============================================================ */
  function renderDevelopments(){
    $("#devGrid").innerHTML = NESTORA_DEVELOPMENTS.map(d => `
      <div class="dev-card reveal">
        <div class="dev-media"><img src="${d.image}" alt="${d.name} development in ${d.location}" loading="lazy"></div>
        <div class="dev-body">
          <div class="dev-loc">${d.location.toUpperCase()}</div>
          <h3>${d.name}</h3>
          <p>${d.description}</p>
          <div class="dev-facts">
            <div><span>STARTING FROM</span><b>${d.startingPrice}</b></div>
            <div><span>COMPLETION</span><b>${d.completion}</b></div>
            <div><span>UNITS</span><b>${d.units}</b></div>
          </div>
          <button class="btn btn-outline btn-sm" style="width:100%;margin-top:20px;" data-open-schedule>REGISTER INTEREST</button>
        </div>
      </div>
    `).join("");
    initReveals($("#devGrid"));
  }

  /* ============================================================
     AGENTS
     ============================================================ */
  function renderAgents(){
    $("#agentGrid").innerHTML = NESTORA_AGENTS.map(a => `
      <div class="agent-card reveal" data-agent-open="${a.id}">
        <div class="agent-media"><img src="${a.portrait}" alt="Portrait of ${a.name}, ${a.specialty}" loading="lazy"></div>
        <div class="agent-body">
          <h3>${a.name}</h3>
          <div class="ag-role">${a.specialty}</div>
          <div class="agent-stats">
            <div><b>${a.years}</b>Years exp.</div>
            <div><b>${a.sold}</b>Properties sold</div>
          </div>
        </div>
      </div>
    `).join("");
    $$("[data-agent-open]", $("#agentGrid")).forEach(el => el.addEventListener("click", () => openAgentModal(el.dataset.agentOpen)));
    initReveals($("#agentGrid"));
  }

  function openAgentModal(id){
    const a = NESTORA_AGENTS.find(x => x.id === id);
    if (!a) return;
    const listings = NESTORA_PROPERTIES.filter(p => p.agentId === id);
    $("#agentModalContent").innerHTML = `
      <div class="agent-modal-head">
        <img src="${a.portrait}" alt="Portrait of ${a.name}">
        <div>
          <h2>${a.name}</h2>
          <div class="am-role">${a.specialty}</div>
          <p style="font-size:13.5px;color:var(--charcoal-soft);">${a.bio}</p>
          <div class="am-stats-row">
            <div><b>${a.years}</b><span>Years experience</span></div>
            <div><b>${a.sold}</b><span>Properties sold</span></div>
            <div><b>${listings.length}</b><span>Current listings</span></div>
          </div>
        </div>
      </div>
      <div class="agent-modal-body">
        <span class="eyebrow">AREAS SERVED</span>
        <div class="tag-row">${a.areas.map(x => `<span class="tag-pill">${x}</span>`).join("")}</div>
        <span class="eyebrow">SPECIALTIES</span>
        <div class="tag-row">${a.specialties.map(x => `<span class="tag-pill">${x}</span>`).join("")}</div>
        ${listings.length ? `
          <span class="eyebrow">CURRENT LISTINGS</span>
          <div class="grid-properties" style="grid-template-columns:repeat(2,1fr);gap:16px;margin-top:14px;" id="agentListingsGrid"></div>
        ` : ""}
        <button class="btn btn-primary" style="width:100%;margin-top:26px;" id="contactAdvisorBtn">CONTACT ADVISOR</button>
      </div>
    `;
    if (listings.length){
      const g = $("#agentListingsGrid");
      g.innerHTML = listings.map(propertyCardHTML).join("");
      bindCardEvents(g);
      $$(".property-card", g).forEach(c => { c.style.opacity = 1; c.style.transform = "none"; });
    }
    $("#contactAdvisorBtn").addEventListener("click", () => {
      closeAgentModal();
      openScheduleModal(null, a.name);
    });
    $("#agentModalOverlay").classList.add("open");
    document.body.classList.add("modal-lock");
  }
  function closeAgentModal(){
    $("#agentModalOverlay").classList.remove("open");
    if (!$("#detailOverlay").classList.contains("open") && !$("#scheduleModalOverlay").classList.contains("open")){
      document.body.classList.remove("modal-lock");
    }
  }
  $$("[data-close-agent-modal]").forEach(b => b.addEventListener("click", closeAgentModal));
  $("#agentModalOverlay").addEventListener("click", (e) => { if (e.target.id === "agentModalOverlay") closeAgentModal(); });

  /* ============================================================
     SCHEDULE VISIT MODAL + FORM
     ============================================================ */
  function populatePropertySelect(){
    const sel = $("#visProperty");
    sel.innerHTML = `<option value="">General enquiry</option>` + NESTORA_PROPERTIES.map(p => `<option value="${p.id}">${p.name} — ${p.location}</option>`).join("");
  }
  function openScheduleModal(propertyId, advisorName){
    $("#scheduleForm").classList.remove("hidden");
    $("#scheduleSuccess").classList.remove("show");
    $("#scheduleForm").reset();
    $$(".form-field", $("#scheduleForm")).forEach(f => f.classList.remove("invalid"));
    $$(".field-error", $("#scheduleForm")).forEach(f => f.textContent = "");
    if (propertyId) $("#visProperty").value = propertyId;
    $("#scheduleSub").textContent = advisorName
      ? `Your request will go to ${advisorName}. We'll confirm a time shortly.`
      : "Tell us a little about you and we'll confirm a time.";
    const dateInput = $("#visDate");
    const min = new Date(); min.setDate(min.getDate() + 1);
    dateInput.min = min.toISOString().split("T")[0];
    $("#scheduleModalOverlay").classList.add("open");
    document.body.classList.add("modal-lock");
  }
  function closeScheduleModal(){
    $("#scheduleModalOverlay").classList.remove("open");
    if (!$("#detailOverlay").classList.contains("open") && !$("#agentModalOverlay").classList.contains("open")){
      document.body.classList.remove("modal-lock");
    }
  }
  $$("[data-open-schedule]").forEach(b => b.addEventListener("click", () => openScheduleModal(null)));
  $$("[data-close-schedule-modal]").forEach(b => b.addEventListener("click", closeScheduleModal));
  $("#scheduleModalOverlay").addEventListener("click", (e) => { if (e.target.id === "scheduleModalOverlay") closeScheduleModal(); });
  $("#scheduleDoneBtn").addEventListener("click", closeScheduleModal);

  function validateField(id, condition, message){
    const field = $(`#${id}`).closest(".form-field");
    const err = $(".field-error", field);
    if (!condition){ field.classList.add("invalid"); err.textContent = message; return false; }
    field.classList.remove("invalid"); err.textContent = "";
    return true;
  }
  function initScheduleForm(){
    populatePropertySelect();
    $("#scheduleForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#visName").value.trim();
      const email = $("#visEmail").value.trim();
      const phone = $("#visPhone").value.trim();
      const date = $("#visDate").value;
      let valid = true;
      valid = validateField("visName", name.length >= 2, "Please enter your full name.") && valid;
      valid = validateField("visEmail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address.") && valid;
      valid = validateField("visPhone", /^[0-9+\-\s]{7,15}$/.test(phone), "Enter a valid phone number.") && valid;
      valid = validateField("visDate", !!date, "Choose a preferred date.") && valid;
      if (!valid) return;
      $("#scheduleForm").classList.add("hidden");
      const success = $("#scheduleSuccess");
      success.classList.add("show");
      toast("Visit request sent");
    });
  }

  /* ============================================================
     MORTGAGE CALCULATOR
     ============================================================ */
  function initCalculator(){
    const price = $("#cPrice"), down = $("#cDown"), tenure = $("#cTenure"), rate = $("#cRate");
    function calc(){
      const P = Number(price.value);
      const downPct = Number(down.value);
      const downAmt = P * downPct / 100;
      const loan = P - downAmt;
      const years = Number(tenure.value);
      const r = Number(rate.value) / 100 / 12;
      const n = years * 12;
      const emi = r === 0 ? loan / n : (loan * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      const total = emi * n;
      const interest = total - loan;

      $("#cPriceVal").textContent = fmtINR(P);
      $("#cDownVal").textContent = `${fmtINR(downAmt)} (${downPct}%)`;
      $("#cTenureVal").textContent = `${years} years`;
      $("#cRateVal").textContent = `${Number(rate.value).toFixed(1)}%`;

      $("#crEmi").textContent = fmtINR(emi) + " / mo";
      $("#crLoan").textContent = fmtINR(loan);
      $("#crInterest").textContent = fmtINR(interest);
      $("#crTotal").textContent = fmtINR(total);
    }
    [price, down, tenure, rate].forEach(el => el.addEventListener("input", calc));
    calc();
  }

  /* ============================================================
     COMPARISON TABLE
     ============================================================ */
  function renderComparisonTable(){
    const wrap = $("#compareTableWrap");
    const empty = $("#compareEmpty");
    const items = State.compare.map(id => NESTORA_PROPERTIES.find(p => p.id === id)).filter(Boolean);
    if (items.length === 0){
      wrap.classList.add("hidden"); empty.classList.remove("hidden");
      return;
    }
    wrap.classList.remove("hidden"); empty.classList.add("hidden");
    const rows = [
      ["PRICE", p => p.priceLabel],
      ["LOCATION", p => p.location],
      ["TYPE", p => p.type],
      ["BEDROOMS", p => p.beds],
      ["BATHROOMS", p => p.baths],
      ["AREA", p => p.sqft.toLocaleString("en-IN") + " sq ft"],
      ["YEAR BUILT", p => p.yearBuilt],
      ["PARKING", p => p.parking + " cars"],
      ["AMENITIES", p => p.amenities.slice(0,4).join(", ") + (p.amenities.length > 4 ? "…" : "")],
    ];
    let html = `<thead><tr><th>Property</th>${items.map(p => `<th>${p.name}</th>`).join("")}</tr></thead><tbody>`;
    rows.forEach(([label, fn]) => {
      html += `<tr><td class="ct-label">${label}</td>${items.map(p => `<td>${fn(p)}</td>`).join("")}</tr>`;
    });
    html += "</tbody>";
    $("#compareTable").innerHTML = html;
  }

  /* ============================================================
     TESTIMONIALS CAROUSEL
     ============================================================ */
  let testiIdx = 0, testiTimer;
  function renderTestimonials(){
    const track = $("#testiTrack");
    const dots = $("#testiDots");
    track.innerHTML = NESTORA_TESTIMONIALS.map((t,i) => `
      <div class="testi-slide ${i===0?'active':''}" data-i="${i}">
        <blockquote>"${t.quote}"</blockquote>
        <div class="testi-name">${t.name}</div>
        <div class="testi-meta">${t.location} · Purchased ${t.property}</div>
      </div>
    `).join("");
    dots.innerHTML = NESTORA_TESTIMONIALS.map((_,i) => `<button data-dot="${i}" class="${i===0?'active':''}" aria-label="Show testimonial ${i+1}"></button>`).join("");
    $$("[data-dot]", dots).forEach(b => b.addEventListener("click", () => showTesti(Number(b.dataset.dot))));
    startTestiAuto();
  }
  function showTesti(i){
    testiIdx = i;
    $$(".testi-slide").forEach((s,idx) => s.classList.toggle("active", idx === i));
    $$("[data-dot]").forEach((d,idx) => d.classList.toggle("active", idx === i));
  }
  function startTestiAuto(){
    if (prefersReducedMotion) return;
    clearInterval(testiTimer);
    testiTimer = setInterval(() => showTesti((testiIdx + 1) % NESTORA_TESTIMONIALS.length), 5500);
  }

  /* ============================================================
     JOURNAL
     ============================================================ */
  function renderJournal(){
    $("#journalGrid").innerHTML = NESTORA_ARTICLES.map(a => `
      <article class="journal-card reveal">
        <div class="journal-media"><img src="${a.image}" alt="Editorial photo accompanying ${a.title}" loading="lazy"></div>
        <div class="journal-cat">${a.category.toUpperCase()}</div>
        <h3>${a.title}</h3>
        <p>${a.excerpt}</p>
        <div class="journal-foot"><span>${a.date}</span><span>·</span><span>${a.readTime}</span></div>
      </article>
    `).join("");
    initReveals($("#journalGrid"));
  }

  /* ============================================================
     SAVED VIEW
     ============================================================ */
  function renderSavedView(){
    const grid = $("#savedGrid");
    const empty = $("#savedEmpty");
    const items = State.saved.map(id => NESTORA_PROPERTIES.find(p => p.id === id)).filter(Boolean);
    if (items.length === 0){
      grid.innerHTML = ""; empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
      grid.innerHTML = items.map(propertyCardHTML).join("");
      bindCardEvents(grid);
      $$(".property-card", grid).forEach(c => { c.style.opacity = 1; c.style.transform = "none"; });
    }
  }
  function initSavedNav(){
    function showSaved(){
      renderSavedView();
      $("#saved-view").classList.remove("hidden");
      smoothScrollTo($("#saved-view"));
    }
    $("#navSavedBtn").addEventListener("click", showSaved);
    $("#mmSavedBtn").addEventListener("click", () => setTimeout(showSaved, 400));
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init(){
    document.body.style.overflow = "hidden";
    runLoader();
    initCursor();
    initMagnetic();
    initNav();
    initSmoothScroll();
    initHeroSearch();
    initHeroParallax();

    renderFeatured();
    initDiscover();
    renderNeighborhoodMap();
    initStepInside();
    renderDevelopments();
    renderAgents();
    initCalculator();
    renderComparisonTable();
    renderTestimonials();
    renderJournal();
    initSavedNav();
    initScheduleForm();

    updateSavedUI();
    renderCompareTray();
    initReveals(document);

    if (typeof ScrollTrigger !== "undefined"){
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
