/* EasyLoc Sud — expérience : loader, scroll fluide (Lenis), entrée dans le portail, tunnel 3D, bento, comparateur */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsapOK = !!(window.gsap && window.ScrollTrigger) && !reduced;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let lenis = null;

  if (!gsapOK) root.classList.add("no-intro");
  else if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; scrollTo(0, 0); }

  const scrollToEl = (t) => {
    if (t.id === "top") { lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); return; }
    if (lenis) lenis.scrollTo(t, { offset: -70, duration: 1.5 });
    else t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };

  /* ---------- header, progression, menu ---------- */
  const header = $("#header"), progress = $("#progress"), burger = $("#burger"), nav = $("#nav");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 30);
    if (!nav.classList.contains("open")) {
      if (y > 500 && y > lastY + 4) header.classList.add("hide");
      else if (y < lastY - 4 || y <= 500) header.classList.remove("hide");
    }
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (open) header.classList.remove("hide");
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$("a[href^='#']").forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    setMenu(false);
    scrollToEl(t);
  }));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- tilt 3D du portail ---------- */
  const portalWrap = $("#portal");
  if (portalWrap && fine && !reduced) {
    const t = $(".portal", portalWrap);
    portalWrap.addEventListener("pointermove", (ev) => {
      const r = portalWrap.getBoundingClientRect();
      t.style.setProperty("--ry", `${((ev.clientX - r.left) / r.width - 0.5) * 16}deg`);
      t.style.setProperty("--rx", `${-((ev.clientY - r.top) / r.height - 0.5) * 16}deg`);
    });
    portalWrap.addEventListener("pointerleave", () => { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
  }

  /* ---------- spotlight qui suit la souris ---------- */
  $$(".tile, .car, .step").forEach((el) => {
    el.classList.add("spot");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- curseur + boutons magnétiques ---------- */
  if (fine && !reduced) {
    const c = $("#cursor");
    root.classList.add("has-cursor");
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => { x += (tx - x) * 0.25; y += (ty - y) * 0.25; c.style.transform = `translate3d(${x}px,${y}px,0)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener("pointerover", (e) => c.classList.toggle("hot", !!e.target.closest("a, button, summary, .cmp, label, select")));
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - (r.left + r.width / 2)) * 0.22}px ${(e.clientY - (r.top + r.height / 2)) * 0.3}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });
  }

  /* ---------- flotte : filtres, galerie, réservation ---------- */
  const cars = $$(".car");
  const tabs = $$(".tab");
  const applyFilter = (f) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.filter === f)));
    cars.forEach((c) => {
      const show = f === "all" || c.dataset.cat === f;
      c.hidden = !show;
      if (show) c.classList.add("in");
    });
    if (gsapOK) ScrollTrigger.refresh();
  };
  tabs.forEach((t) => t.addEventListener("click", () => applyFilter(t.dataset.filter)));
  $$("a[data-filter]").forEach((d) => d.addEventListener("click", () => applyFilter(d.dataset.filter)));

  cars.forEach((car) => {
    const main = $(".shot > img", car);
    $$(".thumbs button", car).forEach((b) => b.addEventListener("click", () => {
      $$(".thumbs button", car).forEach((x) => x.removeAttribute("aria-current"));
      b.setAttribute("aria-current", "true");
      main.style.opacity = 0;
      setTimeout(() => { main.src = $("img", b).src; main.style.opacity = 1; }, 160);
    }));
    $(".ask", car).addEventListener("click", () => {
      $("#service").value = { voiture: "Location de voiture", utilitaire: "Location d'utilitaire", moto: "Location de deux-roues" }[car.dataset.cat];
      $("#form textarea").value = `Bonjour, je suis intéressé(e) par : ${car.dataset.name}.`;
      scrollToEl($("#contact"));
      setTimeout(() => $("#form input[name=nom]").focus({ preventScroll: true }), 900);
    });
  });
  $$("[data-service]").forEach((a) => a.addEventListener("click", () => { $("#service").value = a.dataset.service; }));

  /* ---------- formulaire -> mailto ---------- */
  const form = $("#form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const nom = (d.nom || "").trim(), tel = (d.tel || "").trim();
    if (!nom || !tel) {
      $("#form-note").textContent = "Merci d'indiquer ton nom et ton téléphone.";
      (nom ? form.tel : form.nom).focus();
      return;
    }
    const lines = [
      `Nom : ${nom}`, `Téléphone : ${tel}`, `Besoin : ${d.service}`,
      d.du ? `Du : ${d.du}` : "", d.au ? `Au : ${d.au}` : "", "", d.msg || "",
    ].filter((l, i, a) => l || (a[i - 1] && i !== a.length - 1));
    const subject = encodeURIComponent(`Demande — ${d.service}`);
    location.href = `mailto:easylocsud13@gmail.com?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
    $("#form-note").textContent = "Ton application mail s'ouvre. Tu peux aussi nous appeler au 07 69 55 02 36.";
  });

  /* ---------- comparateur avant / après ---------- */
  const cmp = $("#cmp");
  let cmpDemo = null;
  if (cmp) {
    const rng = $(".cmp-range", cmp);
    rng.addEventListener("input", () => cmp.style.setProperty("--pos", `${rng.value}%`));
    rng.addEventListener("pointerdown", () => cmpDemo && cmpDemo.kill());
  }

  /* ---------- HERO : route dorée en perspective ---------- */
  const cv = $("#warp");
  if (cv) {
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, mx = 0.5, run = true;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (t) => {
      const wide = W > 980;
      const hor = H * 0.64;
      const vx = W * (wide ? 0.66 : 0.5) + (mx - 0.5) * W * 0.05;
      ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(vx, hor, 0, vx, hor, Math.max(W, H) * 0.55);
      glow.addColorStop(0, "rgba(242,203,74,.32)");
      glow.addColorStop(0.35, "rgba(203,158,2,.13)");
      glow.addColorStop(1, "rgba(203,158,2,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      const N = 14;
      for (let i = -N; i <= N; i++) {
        const a = 0.42 - Math.abs(i) / (N * 1.5);
        ctx.strokeStyle = `rgba(203,158,2,${Math.max(a, 0.05)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(vx + i * 3, hor); ctx.lineTo(vx + i * W * 0.12, H); ctx.stroke();
      }
      const speed = reduced ? 0 : t / 3400;
      for (let j = 0; j < 12; j++) {
        const k = ((j / 12) + speed) % 1;
        const y = hor + (H - hor) * Math.pow(k, 2.3);
        ctx.strokeStyle = `rgba(203,158,2,${0.05 + k * 0.4})`;
        ctx.lineWidth = 0.6 + k * 1.2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let j = 0; j < 12; j++) {
        const k = ((j / 12) + speed) % 1, k2 = Math.min(k + 0.035, 1);
        const y1 = hor + (H - hor) * Math.pow(k, 2.3), y2 = hor + (H - hor) * Math.pow(k2, 2.3);
        const w1 = 0.5 + k * 8, w2 = 0.5 + k2 * 8;
        ctx.fillStyle = `rgba(242,203,74,${0.15 + k * 0.8})`;
        ctx.beginPath(); ctx.moveTo(vx - w1, y1); ctx.lineTo(vx + w1, y1); ctx.lineTo(vx + w2, y2); ctx.lineTo(vx - w2, y2); ctx.fill();
      }
      const hl = ctx.createLinearGradient(0, 0, W, 0);
      hl.addColorStop(0, "rgba(203,158,2,0)"); hl.addColorStop(0.5, "rgba(242,203,74,.85)"); hl.addColorStop(1, "rgba(203,158,2,0)");
      ctx.fillStyle = hl; ctx.fillRect(0, hor - 1, W, 1.5);
    };
    const loop = (t) => { if (run) draw(t); requestAnimationFrame(loop); };
    size(); draw(0);
    addEventListener("resize", () => { size(); draw(performance.now()); });
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; }, { passive: true });
    new IntersectionObserver(([e]) => { run = e.isIntersecting; }).observe(cv);
    if (!reduced) requestAnimationFrame(loop);
  }

  if (!gsapOK) { $("#loader")?.remove(); return; }

  /* =====================================================================
     Enhancements GSAP / ScrollTrigger / Lenis
     ===================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* scroll fluide */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    window.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* titres découpés mot à mot */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const i = document.createElement("span"); i.className = "wi"; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.classList.add("split-ready");
    const words = $$(".wi", el);
    gsap.set(words, { yPercent: 112 });
    return words;
  };
  const heroH1 = $("#hero h1");
  const heroWords = splitWords(heroH1);
  $$(".sec-title").forEach((el) => {
    const words = splitWords(el);
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.06 }) });
  });

  /* compteurs */
  const countUp = () => $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = "0";
    gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  /* intro du hero */
  const intro = () => {
    const t = gsap.timeline();
    t.to(heroWords, { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.08 }, 0)
     .fromTo(".hero-copy .kicker, .hero-copy .lead, .hero-copy .cta, .hero-copy .hero-meta", { opacity: 0, y: 34 },
       { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, clearProps: "transform" }, 0.15)
     .fromTo(".portal .view", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(72% at 50% 50%)", duration: 1.6, ease: "power3.out", clearProps: "clipPath" }, 0.1)
     .from(".portal .ring", { opacity: 0, duration: 1.2, stagger: 0.2 }, 0.2)
     .from(".portal .chip", { opacity: 0, duration: 0.9, stagger: 0.2 }, 0.9)
     .add(countUp, 0.5);
    return t;
  };

  /* loader */
  const loader = $("#loader");
  let seen = false;
  try { seen = !!sessionStorage.getItem("els-seen"); } catch (e) { /* stockage indisponible */ }
  const finishLoader = () => { loader.remove(); lenis && lenis.start(); try { sessionStorage.setItem("els-seen", "1"); } catch (e) { /* noop */ } };
  if (seen) {
    finishLoader();
    intro();
  } else {
    lenis && lenis.stop();
    const ring = $("circle", loader), lc = $("#lc"), st = { v: 0 };
    gsap.timeline()
      .to(st, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { lc.textContent = Math.round(st.v); ring.style.strokeDashoffset = 1 - st.v / 100; } })
      .to(".loader-logo", { scale: 1.08, duration: 0.5, ease: "power2.out" }, "-=0.35")
      .to(".loader-inner, .loader-count", { opacity: 0, duration: 0.35 }, "+=0.1")
      .to(loader, { yPercent: -100, duration: 1, ease: "power4.inOut" })
      .add(intro, "-=0.55")
      .add(finishLoader, "-=0.05");
  }

  /* hero : on entre dans le portail au scroll */
  const portal = $("#portal");
  const heroTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: "#hero", start: "top top", end: "+=120%", pin: ".hero-pin", scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true },
  });
  heroTl
    .to(".hero-copy", { opacity: 0, y: -80, duration: 0.4, ease: "power1.in" }, 0)
    .to(".portal .chip, .scroll-hint", { opacity: 0, duration: 0.25 }, 0)
    .to("#warp", { opacity: 0.2, duration: 0.5 }, 0)
    .to(portal, {
      scale: () => Math.hypot(innerWidth, innerHeight) / (portal.offsetWidth - 68) * 1.08,
      x: () => innerWidth / 2 - (portal.offsetLeft + portal.offsetWidth / 2),
      y: () => innerHeight / 2 - (portal.offsetTop + portal.offsetHeight / 2),
      duration: 1, ease: "power2.in",
    }, 0)
    .to(".portal-fade", { opacity: 1, duration: 0.3 }, 0.7);

  /* marquee sensible à la vitesse de scroll */
  const track = $(".marquee .track");
  if (track) {
    track.style.animation = "none";
    let mxp = 0;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      const period = track.children[5].offsetLeft;
      mxp -= 0.8 + Math.abs(v) * 0.35;
      if (mxp <= -period) mxp += period;
      track.style.transform = `translate3d(${mxp}px,0,0)`;
    });
  }

  /* tunnel 3D : on traverse les catégories */
  const tunnel = $("#dimensions"), stage = $(".tunnel-stage", tunnel), world = $("#world"), tidx = $("#tidx");
  const layers = $$(".layer", world);
  const N = layers.length, D = 1700;
  tunnel.classList.add("on");
  const items = [];
  layers.forEach((el, i) => items.push({ el, z: -i * D, x: 0, y: 0, max: 1, layer: true }));
  [-0.5 * D, -1.5 * D].forEach((z) => {
    const el = document.createElement("div"); el.className = "ring3d"; world.appendChild(el);
    items.push({ el, z, x: 0, y: 0, max: 0.8 });
  });
  const srcs = $$(".car .shot > img").map((i) => i.currentSrc || i.src);
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };
  const tiles = srcs.map((src, i) => {
    const el = document.createElement("div"); el.className = "tile3d";
    const im = document.createElement("img"); im.src = src; im.alt = ""; im.loading = "lazy"; el.appendChild(im);
    world.appendChild(el);
    const it = { el, z: -(250 + i * (((N - 1) * D + 300) / srcs.length)), x: 0, y: 0, max: 0.9, i };
    items.push(it);
    return it;
  });
  const place = () => {
    tiles.forEach((it) => {
      const side = it.i % 2 ? 1 : -1;
      it.x = side * innerWidth * (0.40 + rnd(it.i) * 0.14);
      it.y = (rnd(it.i + 50) - 0.5) * innerHeight * 0.8;
    });
    items.forEach((it) => { it.el.style.transform = `translate3d(calc(-50% + ${it.x}px), calc(-50% + ${it.y}px), ${it.z}px)`; });
  };
  place();
  const smooth = (t) => t * t * (3 - 2 * t);
  const render = (p) => {
    const t = p * (N - 1);
    const s = Math.min(Math.floor(t), N - 2);
    const w = D * (s + smooth(clamp((t - s - 0.2) / 0.6)));
    world.style.transform = `translate3d(0,0,${w}px)`;
    items.forEach((it) => {
      const zr = it.z + w;
      const o = clamp((zr + 3200) / 1900) * (zr < 0 ? 1 : clamp(1 - zr / 520)) * it.max;
      it.el.style.opacity = o.toFixed(3);
      it.el.style.visibility = o < 0.01 ? "hidden" : "visible";
      if (it.layer) it.el.style.pointerEvents = Math.abs(zr) < 260 ? "auto" : "none";
    });
    tidx.textContent = "0" + (Math.round(w / D) + 1);
  };
  ScrollTrigger.create({
    trigger: tunnel, start: "top top", end: () => "+=" + Math.round(innerHeight * 3.4),
    pin: stage, scrub: true, invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => { place(); render(self.progress); },
  });
  render(0);

  /* comparateur : petite démo au premier passage */
  if (cmp) {
    const rng = $(".cmp-range", cmp);
    const set = (o) => () => { cmp.style.setProperty("--pos", `${o.v}%`); rng.value = o.v; };
    ScrollTrigger.create({ trigger: cmp, start: "top 70%", once: true, onEnter: () => {
      const o = { v: 50 };
      cmpDemo = gsap.timeline()
        .to(o, { v: 16, duration: 0.9, ease: "power2.inOut", onUpdate: set(o) })
        .to(o, { v: 84, duration: 1.3, ease: "power2.inOut", onUpdate: set(o) })
        .to(o, { v: 50, duration: 0.8, ease: "power2.inOut", onUpdate: set(o) });
    } });
  }

  /* mot géant du footer */
  const big = $(".big-word");
  if (big) gsap.fromTo(big, { yPercent: 25, opacity: 0.3 }, { yPercent: 0, opacity: 1, ease: "none",
    scrollTrigger: { trigger: "footer", start: "top bottom", end: "top 40%", scrub: true } });

  /* recalcul quand tout est chargé */
  addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
