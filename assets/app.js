/* EasyLoc Sud — comportement : hero perspective (canvas), portail 3D, filtres flotte, reveal, dimensions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* header + progress */
  const header = $("#header"), progress = $("#progress");
  const onScroll = () => {
    header.classList.toggle("scrolled", scrollY > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  const burger = $("#burger"), nav = $("#nav");
  const setMenu = (open) => {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* reveal */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* tilt 3D */
  const tilt = (el, max, target) => {
    if (!fine || reduced) return;
    const t = target || el;
    el.addEventListener("pointermove", (ev) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      t.style.setProperty("--ry", `${x * max}deg`);
      t.style.setProperty("--rx", `${-y * max}deg`);
    });
    el.addEventListener("pointerleave", () => { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
  };
  $$(".tilt").forEach((el) => tilt(el, 9));
  const portalWrap = $("#portal");
  if (portalWrap) tilt(portalWrap, 16, $(".portal", portalWrap));

  /* fleet : filtres */
  const cars = $$(".car");
  const tabs = $$(".tab");
  const applyFilter = (f) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.filter === f)));
    cars.forEach((c) => {
      const show = f === "all" || c.dataset.cat === f;
      c.hidden = !show;
      if (show) c.classList.add("in");
    });
  };
  tabs.forEach((t) => t.addEventListener("click", () => applyFilter(t.dataset.filter)));
  $$(".dim[data-filter]").forEach((d) => d.addEventListener("click", () => applyFilter(d.dataset.filter)));

  /* fleet : galerie miniatures */
  $$(".car").forEach((car) => {
    const main = $(".shot > img", car);
    $$(".thumbs button", car).forEach((b) => b.addEventListener("click", () => {
      $$(".thumbs button", car).forEach((x) => x.removeAttribute("aria-current"));
      b.setAttribute("aria-current", "true");
      main.style.opacity = 0;
      setTimeout(() => { main.src = $("img", b).src; main.style.opacity = 1; }, 160);
    }));
    /* bouton réserver : pré-remplit le formulaire */
    $(".ask", car).addEventListener("click", () => {
      const cat = car.dataset.cat;
      $("#service").value = { voiture: "Location de voiture", utilitaire: "Location d'utilitaire", moto: "Location de deux-roues" }[cat];
      const msg = $("#form textarea");
      msg.value = `Bonjour, je suis intéressé(e) par : ${car.dataset.name}.`;
      $("#contact").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      setTimeout(() => $("#form input[name=nom]").focus({ preventScroll: true }), 700);
    });
  });
  $$("[data-service]").forEach((a) => a.addEventListener("click", () => { $("#service").value = a.dataset.service; }));

  /* formulaire -> mailto */
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

  /* ------------ HERO : route dorée en perspective, sobre ------------ */
  const cv = $("#warp");
  if (!cv) return;
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

    /* lueur dorée à l'horizon */
    const glow = ctx.createRadialGradient(vx, hor, 0, vx, hor, Math.max(W, H) * 0.55);
    glow.addColorStop(0, "rgba(242,203,74,.32)");
    glow.addColorStop(0.35, "rgba(203,158,2,.13)");
    glow.addColorStop(1, "rgba(203,158,2,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    /* lignes de fuite */
    const N = 14;
    for (let i = -N; i <= N; i++) {
      const a = 0.42 - Math.abs(i) / (N * 1.5);
      ctx.strokeStyle = `rgba(203,158,2,${Math.max(a, 0.05)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(vx + i * 3, hor); ctx.lineTo(vx + i * W * 0.12, H); ctx.stroke();
    }
    /* lignes horizontales qui défilent vers nous */
    const speed = reduced ? 0 : t / 3400;
    for (let j = 0; j < 12; j++) {
      const k = ((j / 12) + speed) % 1;
      const y = hor + (H - hor) * Math.pow(k, 2.3);
      ctx.strokeStyle = `rgba(203,158,2,${0.05 + k * 0.4})`;
      ctx.lineWidth = 0.6 + k * 1.2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    /* tirets centraux : la route */
    for (let j = 0; j < 12; j++) {
      const k = ((j / 12) + speed) % 1, k2 = Math.min(k + 0.035, 1);
      const y1 = hor + (H - hor) * Math.pow(k, 2.3), y2 = hor + (H - hor) * Math.pow(k2, 2.3);
      const w1 = 0.5 + k * 8, w2 = 0.5 + k2 * 8;
      ctx.fillStyle = `rgba(242,203,74,${0.15 + k * 0.8})`;
      ctx.beginPath(); ctx.moveTo(vx - w1, y1); ctx.lineTo(vx + w1, y1); ctx.lineTo(vx + w2, y2); ctx.lineTo(vx - w2, y2); ctx.fill();
    }
    /* filet d'horizon */
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
})();
