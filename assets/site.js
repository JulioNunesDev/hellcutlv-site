// HELLCUTLV — página de vendas. Tudo funciona sem as bibliotecas (Lenis/GSAP): elas só deixam mais suave.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------------------------------------------------------- links de compra
  const co = window.HC_CHECKOUT || {};
  $$("[data-buy]").forEach((a) => {
    const url = co[a.dataset.buy];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });

  // ---------------------------------------------------------- funções (gerado de lista.py)
  const F = window.HC_FUNCOES;
  if (F) {
    $$("[data-versao]").forEach((e) => (e.textContent = F.versao));
    $$("[data-total]").forEach((e) => (e.textContent = F.total));
    const tabs = $("#ftabs"), grid = $("#fgrid");
    const novos = F.grupos.flatMap((g) => g.itens.filter((i) => i.novo === "novo"));
    const groups = [{ nome: "🆕 Novidades da " + F.versao, itens: novos }, ...F.grupos];
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const show = (k) => {
      $$(".ftab", tabs).forEach((t, i) => t.setAttribute("aria-selected", String(i === k)));
      grid.innerHTML = groups[k].itens.map((it, i) => {
        let tag = "";
        if (it.novo === "novo") tag += '<span class="badge novo">novo</span>';
        if (it.plano) tag += '<span class="badge plano">⭐ assinatura</span>';
        let obs = "";
        if (it.novo && it.novo !== "novo") obs += `<span class="obs">🆕 ${esc(it.novo)}</span>`;
        if (it.plano) obs += `<span class="obs">⭐ ${esc(it.plano)}</span>`;
        return `<div class="fcard in" style="animation-delay:${Math.min(i, 12) * 40}ms"><span class="e">${it.e}</span><b>${esc(it.n)}${tag}</b><p>${esc(it.t)}</p>${obs}</div>`;
      }).join("");
    };
    tabs.innerHTML = groups.map((g, i) => `<button class="ftab" type="button" aria-selected="false" data-k="${i}">${esc(g.nome)}<span class="n">${g.itens.length}</span></button>`).join("");
    tabs.addEventListener("click", (e) => { const b = e.target.closest(".ftab"); if (b) show(+b.dataset.k); });
    show(0);
  }

  // ---------------------------------------------------------- demo "veja o robô cortando"
  const demo = $("#demo");
  if (demo) {
    const steps = $$(".demo-steps li", demo), scrs = $$(".scr", demo), timer = $(".win-timer i", demo), pauseBtn = $(".demo-pause", demo);
    const DUR = 3400;
    let cur = -1, t0 = 0, paused = reduce, visible = false, raf = 0, elapsed = 0;
    const go = (k) => {
      cur = (k + scrs.length) % scrs.length;
      steps.forEach((s, i) => { s.classList.toggle("on", i === cur); s.classList.toggle("done", i < cur); });
      scrs.forEach((s, i) => s.classList.toggle("on", i === cur));
      // reinicia as animações CSS da tela
      const s = scrs[cur]; s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
      const pct = $(".pct", s);
      if (pct) { const a = performance.now(); const tick = (n) => { const p = Math.min(1, (n - a) / 2400); pct.textContent = Math.round(100 * (1 - Math.pow(1 - p, 2))); if (p < 1 && cur === 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
      elapsed = 0; t0 = performance.now();
    };
    const loop = (n) => {
      raf = requestAnimationFrame(loop);
      if (paused || !visible) { t0 = n - elapsed; return; }
      elapsed = n - t0;
      timer.style.transform = `scaleX(${Math.min(1, elapsed / DUR)})`;
      if (elapsed >= DUR) go(cur + 1);
    };
    steps.forEach((s, i) => { s.tabIndex = 0; s.addEventListener("click", () => go(i)); s.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); } }); });
    const setPause = (p) => { paused = p; pauseBtn.textContent = p ? "▶" : "❚❚"; pauseBtn.setAttribute("aria-label", p ? "Continuar a demonstração" : "Pausar a demonstração"); };
    pauseBtn.addEventListener("click", () => setPause(!paused));
    setPause(paused);
    go(0);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 }).observe(demo);
    raf = requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------- mascote comentando cada seção
  const masc = $("#mascote"), balao = $("#balao"), robo = $("#roboBtn");
  let lastMsg = "", hidden = false;
  const say = (msg) => {
    if (!msg || msg === lastMsg) return;
    lastMsg = msg;
    balao.textContent = msg;
    if (hidden) return;
    balao.classList.remove("pop"); void balao.offsetWidth; balao.classList.add("pop");
    if (!reduce) { masc.classList.remove("jump"); void masc.offsetWidth; masc.classList.add("jump"); }
  };
  robo.addEventListener("click", () => {
    hidden = !hidden;
    balao.classList.toggle("hide", hidden);
    if (!hidden && !reduce) { masc.classList.remove("jump"); void masc.offsetWidth; masc.classList.add("jump"); }
  });
  const secs = $$("[data-mascote]");
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) say(e.target.dataset.mascote); });
  }, { rootMargin: "-45% 0px -45% 0px" });
  secs.forEach((s) => io.observe(s));
  // o balão some sozinho depois de um tempo para não tapar a leitura
  let hideT;
  const autoHide = () => { clearTimeout(hideT); hideT = setTimeout(() => { if (!hidden) balao.classList.add("hide"); }, innerWidth < 700 ? 6000 : 8000); };
  new MutationObserver(() => { if (!hidden) { balao.classList.remove("hide"); autoHide(); } }).observe(balao, { childList: true });
  autoHide();

  // olhos do robô seguem o mouse
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    addEventListener("pointermove", (e) => {
      const dx = (e.clientX / innerWidth - 0.5) * 36, dy = (e.clientY / innerHeight - 0.5) * 40;
      $$(".r-pupils").forEach((p) => (p.style.transform = `translate(${dx}px, ${dy}px)`));
    }, { passive: true });
  }

  // ---------------------------------------------------------- inclinação 3D (celular do hero e cartões dos planos)
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    $$("[data-tilt]").forEach((el) => {
      const base = el.classList.contains("phone3d") ? { x: 8, y: -16 } : { x: 0, y: 0 };
      const max = el.classList.contains("phone3d") ? 14 : 7;
      const host = el.classList.contains("phone3d") ? el.closest(".hero") : el;
      host.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        const lift = el.classList.contains("hot") && innerWidth >= 980 ? " translateY(-14px)" : "";
        el.style.transform = `rotateX(${base.x - py * max}deg) rotateY(${base.y + px * max}deg)${lift}`;
      });
      host.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  // ---------------------------------------------------------- aparecer ao rolar (sem GSAP também funciona)
  const rv = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("seen"); rv.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => rv.observe(el));

  // ---------------------------------------------------------- Lenis + GSAP (quando carregarem)
  if (reduce) return;
  addEventListener("load", () => {
    let lenis = null;
    if (window.Lenis) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const id = a.getAttribute("href"); if (id.length < 2) return;
        const t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -70 });
      }));
    }
    const G = window.gsap, ST = window.ScrollTrigger;
    if (!G) { if (lenis) { const r = (t) => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); } return; }
    if (ST) G.registerPlugin(ST);
    if (lenis) { if (ST) lenis.on("scroll", ST.update); G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }

    // título gigante entrando linha por linha
    G.from(".mega .ln > span", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.12 });
    G.from(".hero .eyebrow, .hero .lead, .hero .cta-row, .hero .chips", { y: 24, opacity: 0, duration: .9, ease: "power3.out", stagger: .08, delay: .35 });
    G.from(".phone3d", { y: 80, rotateY: -50, opacity: 0, duration: 1.4, ease: "expo.out", delay: .2 });
    if (!ST) return;

    // celular gira um pouco e sobe enquanto rola
    G.to(".hero-stage", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    G.to(".marquee .track", { xPercent: -8, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    // galeria: no PC rola de lado enquanto a página desce (seção presa)
    const mm = G.matchMedia();
    mm.add("(min-width: 980px)", () => {
      const sc = $("#hscroll"), tr = $(".htrack", sc);
      sc.style.overflow = "visible";
      const dist = () => Math.max(0, tr.scrollWidth - sc.clientWidth + 40);
      const tw = G.to(tr, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: "#por-dentro", start: "top top+=60", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      $$(".shot", tr).forEach((s) => G.from(s, { rotateY: -18, opacity: .4, scale: .92, ease: "none",
        scrollTrigger: { trigger: s, containerAnimation: tw, start: "left right", end: "left 60%", scrub: true } }));
      return () => { sc.style.overflow = ""; };
    });

    // planos entram em leque 3D
    G.from(".plan", { rotateX: 28, y: 60, opacity: 0, duration: 1, ease: "expo.out", stagger: .12, clearProps: "transform,opacity",
      scrollTrigger: { trigger: ".plans", start: "top 80%" } });
    G.from(".foot-big", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });
    ST.refresh();
  });
})();
