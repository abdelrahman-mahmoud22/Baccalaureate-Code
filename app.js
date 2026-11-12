/* بكالوريا كود - منطق الموقع (من غير أي سيرفر) */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- البيانات ---------- */
  const GRADES = {
    first: { label: "الصف الأول الثانوي", slug: "first-secondary" },
    second: { label: "الصف الثاني الثانوي", slug: "second-secondary" }
  };

  const TYPES = {
    questionBank: { label: "بنك الأسئلة", slug: "question-bank", icon: "bi-question-circle" },
    exam: { label: "امتحانات", slug: "exams", icon: "bi-clipboard2-check" },
    recitation: { label: "تسميعات", slug: "recitations", icon: "bi-mic" },
    quizzes: { label: "حل الكويزات", slug: "quizzes", icon: "bi-patch-check" },
    assessments: { label: "حل التقييمات", slug: "assessments", icon: "bi-clipboard-check" },
    answers: { label: "إجابات", slug: "answers", icon: "bi-check2-circle" },
    revision: { label: "مراجعات", slug: "revision", icon: "bi-journal-bookmark" },
    other: { label: "ملفات أخرى", slug: "other", icon: "bi-file-earmark-text" }
  };

  const rawFiles = Array.isArray(window.BACCALAUREATE_FILES) ? window.BACCALAUREATE_FILES : [];

  const files = rawFiles
    .filter(f => f && GRADES[f.grade])
    .map(f => ({ ...f, type: TYPES[f.type] ? f.type : "other", url: safeURL(f.url) }));

  // تنبيهات للمطوّر في الـ Console لو في خطأ في data.js
  (function checkData() {
    const seenIds = new Set();
    const seenUrls = new Map();
    rawFiles.forEach(f => {
      if (seenIds.has(f.id)) console.warn(`[data.js] الرقم id=${f.id} مكرر. لازم كل ملف يكون له id مختلف.`);
      seenIds.add(f.id);
      if (!safeURL(f.url)) console.warn(`[data.js] الملف id=${f.id} رابطه ناقص أو غلط.`);
      else if (seenUrls.has(f.url)) console.warn(`[data.js] الملفين id=${seenUrls.get(f.url)} و id=${f.id} ليهم نفس الرابط.`);
      else seenUrls.set(f.url, f.id);
    });
  })();

  /* ---------- المفضلة (على نفس الجهاز) ---------- */
  const FAV_KEY = "bacc-favorites";
  const favs = loadFavs();

  function loadFavs() {
    try {
      const v = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return new Set(Array.isArray(v) ? v : []);
    } catch {
      return new Set();
    }
  }
  function saveFavs() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch { /* التخزين غير متاح */ }
  }

  /* ---------- الحالة ---------- */
  const state = { grade: "first", type: "all", query: "" };

  const el = {
    list: $("#fileList"),
    chips: $("#chips"),
    empty: $("#emptyState"),
    path: $("#pathLine"),
    search: $("#searchInput"),
    treeItems: $$(".tree-item")
  };

  /* ---------- أدوات ---------- */
  function safeURL(value) {
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  }

  // توحيد الحروف العربية عشان البحث يلاقي "تانيه" و"ثانية" و"اسئله" و"الأسئلة"
  function norm(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ث/g, "ت")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .trim();
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function scopeFiles() {
    return state.grade === "fav"
      ? files.filter(f => favs.has(f.id))
      : files.filter(f => f.grade === state.grade);
  }

  /* ---------- الرسم ---------- */
  function render(animate = false) {
    el.list.classList.toggle("animate", animate);
    const scoped = scopeFiles();

    // أنواع الملفات الموجودة فعلًا في الصف الحالي
    const typeCounts = {};
    scoped.forEach(f => { typeCounts[f.type] = (typeCounts[f.type] || 0) + 1; });
    if (state.type !== "all" && !typeCounts[state.type]) state.type = "all";

    renderTree();
    renderChips(scoped.length, typeCounts);

    const q = norm(state.query);
    const visible = scoped.filter(f => {
      if (state.type !== "all" && f.type !== state.type) return false;
      if (!q) return true;
      const hay = norm(`${f.title} ${f.unit} ${TYPES[f.type].label} ${GRADES[f.grade].label}`);
      return hay.includes(q);
    });

    renderPath();
    renderRows(visible);
  }

  function renderTree() {
    const counts = {
      first: files.filter(f => f.grade === "first").length,
      second: files.filter(f => f.grade === "second").length,
      fav: files.filter(f => favs.has(f.id)).length
    };
    Object.keys(counts).forEach(key => {
      const badge = $(`[data-count="${key}"]`);
      if (badge) badge.textContent = counts[key];
    });
    el.treeItems.forEach(btn => {
      const active = btn.dataset.grade === state.grade;
      btn.setAttribute("aria-selected", String(active));
      if (btn.dataset.grade !== "fav") {
        const icon = $("i", btn);
        icon.className = `bi ${active ? "bi-folder2-open" : "bi-folder2"}`;
      } else {
        $("i", btn).className = `bi ${active ? "bi-star-fill" : "bi-star"}`;
      }
    });
  }

  function renderChips(total, typeCounts) {
    el.chips.textContent = "";
    const entries = [["all", "الكل", total], ...Object.keys(typeCounts).map(t => [t, TYPES[t].label, typeCounts[t]])];
    if (entries.length <= 2) return; // نوع واحد بس، مفيش لازمة للفلتر
    entries.forEach(([key, label, count]) => {
      const chip = make("button", "chip");
      chip.type = "button";
      chip.dataset.type = key;
      chip.setAttribute("aria-pressed", String(state.type === key));
      chip.append(label + " ", make("small", "", count));
      el.chips.appendChild(chip);
    });
  }

  function renderPath() {
    let path = "~/bacc-code/";
    path += state.grade === "fav" ? "favorites" : GRADES[state.grade].slug;
    if (state.type !== "all") path += "/" + TYPES[state.type].slug;
    if (state.query.trim()) path += `  ?q="${state.query.trim()}"`;
    el.path.textContent = path;
  }

  function renderRows(visible) {
    el.list.textContent = "";
    el.empty.hidden = visible.length > 0;

    if (!visible.length) {
      el.empty.textContent = "";
      const icon = make("i", state.grade === "fav" ? "bi bi-star" : "bi bi-folder2-open");
      let title, hint;
      if (state.grade === "fav" && !favs.size) {
        title = "المفضلة فاضية";
        hint = "اضغط على النجمة جنب أي مجلد وهيظهر هنا.";
      } else {
        title = "مفيش نتايج مطابقة";
        hint = "جرّب كلمة تانية، أو اختار نوع الملف \"الكل\".";
      }
      el.empty.append(icon, make("strong", "", title), make("span", "", hint));
      return;
    }

    visible.forEach((f, i) => {
      const row = buildRow(f);
      row.style.setProperty("--i", i);
      el.list.appendChild(row);
    });
  }

  function buildRow(f) {
    const type = TYPES[f.type];
    const row = make("li", "file-row");

    const icon = make("div", "file-icon");
    icon.appendChild(make("i", `bi ${type.icon}`));

    const info = make("div", "file-info");
    let titleNode;
    if (f.url) {
      titleNode = make("a", "", f.title || "ملف تعليمي");
      titleNode.href = f.url;
      titleNode.target = "_blank";
      titleNode.rel = "noopener noreferrer";
    } else {
      titleNode = make("span", "", f.title || "ملف تعليمي");
    }
    info.appendChild(titleNode);

    // نتجنب تكرار "حل الكويزات • حل الكويزات"
    const nu = norm(f.unit), nl = norm(type.label);
    const showUnit = f.unit && nu !== nl && !nu.includes(nl) && !nl.includes(nu);
    const meta = state.grade === "fav" ? `${GRADES[f.grade].label} • ` : "";
    info.appendChild(make("div", "file-meta", meta + (showUnit ? `${f.unit} • ${type.label}` : type.label)));

    const actions = make("div", "file-actions");
    const star = make("button", "icon-btn");
    star.type = "button";
    star.dataset.fav = f.id;
    const isFav = favs.has(f.id);
    star.setAttribute("aria-pressed", String(isFav));
    star.setAttribute("aria-label", isFav ? "إزالة من المفضلة" : "إضافة للمفضلة");
    star.title = isFav ? "إزالة من المفضلة" : "إضافة للمفضلة";
    star.appendChild(make("i", `bi ${isFav ? "bi-star-fill" : "bi-star"}`));
    actions.appendChild(star);

    if (f.url) {
      const open = make("a", "open-btn");
      open.href = f.url;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.setAttribute("aria-label", `فتح ${f.title}`);
      open.append("افتح ", make("i", "bi bi-box-arrow-up-left"));
      actions.appendChild(open);
    }

    row.append(icon, info, actions);
    return row;
  }

  /* ---------- الأحداث ---------- */
  function setGrade(grade) {
    state.grade = grade;
    state.type = "all";
    state.query = "";
    el.search.value = "";
    render(true);
  }

  el.treeItems.forEach(btn => btn.addEventListener("click", () => setGrade(btn.dataset.grade)));

  el.chips.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.type = chip.dataset.type;
    render(true);
  });

  el.search.addEventListener("input", () => {
    state.query = el.search.value;
    render();
  });

  el.list.addEventListener("click", e => {
    const star = e.target.closest("[data-fav]");
    if (!star) return;
    const id = isNaN(Number(star.dataset.fav)) ? star.dataset.fav : Number(star.dataset.fav);
    favs.has(id) ? favs.delete(id) : favs.add(id);
    saveFavs();
    render();
    const fresh = $(`[data-fav="${id}"]`, el.list);
    if (fresh) fresh.classList.add("pop");
  });

  // أزرار الصفوف في الصفحة الرئيسية
  $$("[data-open-grade]").forEach(btn => {
    btn.addEventListener("click", () => {
      setGrade(btn.dataset.openGrade);
      $("#library").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- القائمة على الموبايل ---------- */
  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");
  function setMenu(open) {
    mainNav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    $("i", menuToggle).className = open ? "bi bi-x-lg" : "bi bi-list";
  }
  menuToggle.addEventListener("click", () => setMenu(!mainNav.classList.contains("open")));
  $$("a", mainNav).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  $("#year").textContent = new Date().getFullYear();

  /* ---------- شاشة التيرمنال في الهيرو (حركة واحدة عند فتح الصفحة) ---------- */
  function buildTermScript() {
    return Object.keys(GRADES).map(g => {
      const list = files.filter(f => f.grade === g);
      const kinds = [...new Set(list.map(f => TYPES[f.type].slug))];
      return { cmd: `bacc open ${GRADES[g].slug}`, count: list.length, kinds: kinds.join(", ") };
    });
  }

  function termLine(parts) {
    const line = make("div", "t-line");
    parts.forEach(([cls, txt]) => line.appendChild(make("span", cls, txt)));
    return line;
  }

  async function playTerminal() {
    const body = $("#termBody");
    if (!body) return;
    const script = buildTermScript();
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    body.textContent = "";
    if (!reduceMotion) await sleep(1100);

    const cursor = make("span", "t-cursor");

    for (const step of script) {
      const cmd = make("span", "t-cmd");
      const line = termLine([["t-prompt", "$ "]]);
      line.appendChild(cmd);
      body.appendChild(line);

      if (reduceMotion) {
        cmd.textContent = step.cmd;
      } else {
        line.appendChild(cursor);
        for (const ch of step.cmd) { cmd.textContent += ch; await sleep(34); }
        await sleep(280);
      }

      body.appendChild(termLine([["t-ok", "✔ "], ["t-num", String(step.count)], ["t-out", step.count === 1 ? " folder" : " folders"]]));
      body.appendChild(termLine([["t-out", "  " + (step.kinds || "-")]]));
      if (!reduceMotion) await sleep(380);
    }

    const last = termLine([["t-prompt", "$ "]]);
    last.appendChild(cursor);
    body.appendChild(last);
  }

  /* ---------- الوضع الفاتح / الداكن ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const metaTheme = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    themeBtn.setAttribute("aria-pressed", String(t === "dark"));
    themeBtn.setAttribute("aria-label", t === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن");
    if (metaTheme) metaTheme.setAttribute("content", t === "dark" ? "#050b1c" : "#ffffff");
  }
  applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

  // لو الطالب ما اختارش وضع بنفسه، الموقع بيتبع إعدادات تليفونه (فاتح/داكن)
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = e => {
    let saved = null;
    try { saved = localStorage.getItem("bacc-theme"); } catch { /* التخزين غير متاح */ }
    if (saved !== "dark" && saved !== "light") applyTheme(e.matches ? "dark" : "light");
  };
  if (systemDark.addEventListener) systemDark.addEventListener("change", onSystemChange);

  themeBtn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    applyTheme(next);
    try { localStorage.setItem("bacc-theme", next); } catch { /* التخزين غير متاح */ }
    setTimeout(() => root.classList.remove("theme-anim"), 450);
  });

  /* ---------- تأثيرات الحركة ---------- */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const header = $(".site-header");
  const progress = $("#progress");

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ظهور الأقسام تدريجيًا
  const revealGroups = [".section-head", ".about-grid > *", ".explorer", ".feature-grid li", ".contact-main", ".link-list li"];
  const revealEls = [];
  revealGroups.forEach(sel => {
    $$(sel).forEach((node, i) => {
      node.dataset.reveal = "";
      node.style.setProperty("--d", `${Math.min(i, 5) * 0.08}s`);
      revealEls.push(node);
    });
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(n => io.observe(n));
  } else {
    revealEls.forEach(n => n.classList.add("is-in"));
  }

  // تمييز الرابط الحالي في القائمة
  if ("IntersectionObserver" in window) {
    const links = new Map($$("a", mainNav).map(a => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove("active"));
        const a = links.get(en.target.id);
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(s => spy.observe(s));
  }

  // شبكة بتنوّر مع الماوس + ميل خفيف للصورة (للكمبيوتر بس)
  const hero = $(".hero");
  const visual = $(".hero-visual");
  if (finePointer && !reduceMotion && hero && visual) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--my", `${e.clientY - r.top}px`);
      const v = visual.getBoundingClientRect();
      const dx = (e.clientX - (v.left + v.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (v.top + v.height / 2)) / (window.innerHeight / 2);
      visual.style.transform = `perspective(1100px) rotateY(${(-dx * 6).toFixed(2)}deg) rotateX(${(dy * 4).toFixed(2)}deg)`;
    });
    hero.addEventListener("pointerleave", () => {
      visual.style.transform = "";
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    });
  }

  /* ---------- تشغيل ---------- */
  render();
  playTerminal();
})();
