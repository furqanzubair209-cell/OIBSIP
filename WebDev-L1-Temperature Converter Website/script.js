/* ================================================================
   Thermex — Premium Temperature Converter  |  script.js
   ================================================================ */

(function () {
  "use strict";

  /* ====================================================
     Element refs
     ==================================================== */
  const form          = document.getElementById("converterForm");
  const tempInput     = document.getElementById("tempInput");
  const inputUnitBadge = document.getElementById("inputUnitBadge");
  const tempError     = document.getElementById("tempError");
  const unitSelect    = document.getElementById("unitSelect");
  const convertBtn    = document.getElementById("convertBtn");
  const resetBtn      = document.getElementById("resetBtn");
  const liveToggle    = document.getElementById("liveToggle");

  const resultsSection = document.getElementById("results");
  const resultGrid     = document.getElementById("resultGrid");
  const copyBtn        = document.getElementById("copyBtn");
  const gaugeFill      = document.getElementById("gaugeFill");
  const gaugeThumb     = document.getElementById("gaugeThumb");

  const historySection   = document.getElementById("historySection");
  const historyList      = document.getElementById("historyList");
  const clearHistoryBtn  = document.getElementById("clearHistoryBtn");

  const themeToggle  = document.getElementById("themeToggle");
  const liveClock    = document.getElementById("liveClock");
  const toastStack   = document.getElementById("toastStack");

  const selectTrigger = document.getElementById("selectTrigger");
  const selectDot     = document.getElementById("selectDot");
  const selectValue   = document.getElementById("selectValue");
  const selectList    = document.getElementById("selectList");
  const selectOptions = Array.from(selectList.querySelectorAll(".custom-select__option"));
  const swapBtn       = document.getElementById("swapBtn");
  const gaugeMin      = document.getElementById("gaugeMin");
  const gaugeMid      = document.getElementById("gaugeMid");
  const gaugeMax      = document.getElementById("gaugeMax");

  /* ====================================================
     Constants
     ==================================================== */
  const HISTORY_KEY = "thermex_history_v2";
  const THEME_KEY   = "thermex_theme_v2";
  const MAX_HISTORY = 6;

  const UNIT_LABEL  = { C: "Celsius (°C)", F: "Fahrenheit (°F)", K: "Kelvin (K)" };
  const UNIT_SUFFIX = { C: "°C", F: "°F", K: "K" };
  const UNIT_DOT_COLOR = {
    C: "var(--c-celsius)",
    F: "var(--c-fahrenheit)",
    K: "var(--c-kelvin)",
  };
  const UNIT_FULL_NAME = { C: "Celsius", F: "Fahrenheit", K: "Kelvin" };
  const ABS_ZERO = { C: -273.15, F: -459.67, K: 0 };

  let lastResult = null;
  let currentUnit = "C";

  /* ====================================================
     Particle Canvas Background
     ==================================================== */
  (function initParticles() {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W, H, particles = [];
    // Use fewer particles on low-end devices (detected via hardwareConcurrency or reduced-motion)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd = (navigator.hardwareConcurrency || 4) <= 2;
    const COUNT = prefersReduced ? 0 : lowEnd ? 22 : 55;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function randomBetween(a, b) { return a + Math.random() * (b - a); }

    const COLORS = [
      [56, 189, 248],   // sky
      [129, 140, 248],  // indigo
      [244, 114, 182],  // rose
      [45, 212, 191],   // teal
    ];

    function createParticle() {
      const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x: Math.random() * (W || 1000),
        y: Math.random() * (H || 800),
        r: randomBetween(0.5, 2.4),
        vx: randomBetween(-0.3, 0.3),
        vy: randomBetween(-0.4, -0.1),
        alpha: randomBetween(0.25, 0.85),
        color: `${r},${g},${b}`,
        life: randomBetween(0.4, 1),
        decay: randomBetween(0.0015, 0.004),
      };
    }

    function resetParticle(p) {
      const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
      p.x = Math.random() * W;
      p.y = H + 10;
      p.r = randomBetween(0.5, 2.4);
      p.vx = randomBetween(-0.3, 0.3);
      p.vy = randomBetween(-0.4, -0.1);
      p.alpha = randomBetween(0.25, 0.85);
      p.color = `${r},${g},${b}`;
      p.life = p.alpha;
      p.decay = randomBetween(0.0015, 0.004);
    }

    resize();
    for (let i = 0; i < COUNT; i++) particles.push(createParticle());
    window.addEventListener("resize", resize);

    if (COUNT === 0) return; // reduced-motion: skip canvas loop entirely

    let raf;
    let lastFrameTime = 0;
    // On low-end devices throttle to ~30fps for better performance
    const FRAME_INTERVAL = lowEnd ? 33 : 0;
    function frame(now) {
      if (FRAME_INTERVAL > 0 && now - lastFrameTime < FRAME_INTERVAL) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastFrameTime = now;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) resetParticle(p);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life)})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(frame);
    }
    frame(0);

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else frame();
    });
  })();

  /* ====================================================
     Facts ticker — duplicate for seamless loop
     ==================================================== */
  (function initTicker() {
    const inner = document.getElementById("factsTicker");
    if (!inner) return;
    const html = inner.innerHTML;
    inner.innerHTML = html + html; // duplicate
  })();

  /* ====================================================
     Conversion math
     ==================================================== */
  function fromCelsius(c)    { return { C: c, F: (c * 9) / 5 + 32, K: c + 273.15 }; }
  function fromFahrenheit(f) {
    const c = ((f - 32) * 5) / 9;
    return { C: c, F: f, K: c + 273.15 };
  }
  function fromKelvin(k) {
    const c = k - 273.15;
    return { C: c, F: (c * 9) / 5 + 32, K: k };
  }

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  function computeFor(unit, value) {
    if (unit === "C") return fromCelsius(value);
    if (unit === "F") return fromFahrenheit(value);
    return fromKelvin(value);
  }

  /* ====================================================
     Gauge — dynamic range per unit
     ==================================================== */
  const GAUGE_RANGES = {
    C: { min: -40,    mid: 37,     max: 120,   suffix: "°C" },
    F: { min: -40,    mid: 98.6,   max: 248,   suffix: "°F" },
    K: { min: 233.15, mid: 310.15, max: 393.15, suffix: "K"  },
  };

  function updateGauge(celsius, unit) {
    const range = GAUGE_RANGES[unit] || GAUGE_RANGES.C;
    // Convert celsius to the current unit value for positioning
    const unitValues = { C: celsius, F: celsius * 9/5 + 32, K: celsius + 273.15 };
    const val = unitValues[unit] !== undefined ? unitValues[unit] : celsius;
    const pct = Math.min(100, Math.max(0, ((val - range.min) / (range.max - range.min)) * 100));
    gaugeFill.style.width  = pct + "%";
    gaugeThumb.style.left  = pct + "%";
    // Update gauge labels
    gaugeMin.textContent = range.min + range.suffix;
    gaugeMid.textContent = range.mid + range.suffix;
    gaugeMax.textContent = range.max + range.suffix;
  }

  /* ====================================================
     Animated number counter
     ==================================================== */
  function animateNumber(el, targetValue, duration = 500) {
    const start = performance.now();
    const from  = parseFloat(el.dataset.current) || 0;
    const diff  = targetValue - from;
    if (Math.abs(diff) < 0.01) {
      el.textContent = targetValue.toFixed(2);
      el.dataset.current = targetValue;
      return;
    }
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;
      el.textContent = current.toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
      else {
        el.textContent = targetValue.toFixed(2);
        el.dataset.current = targetValue;
      }
    }
    requestAnimationFrame(step);
  }

  /* ====================================================
     Validation
     ==================================================== */
  const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

  function validate(rawValue, unit) {
    const trimmed = rawValue.trim();
    if (trimmed === "")          return { ok: false, message: "Please enter a numeric temperature value." };
    if (/[a-zA-Z]/.test(trimmed)) return { ok: false, message: "Letters are not allowed — enter a number." };
    if (!NUMERIC_RE.test(trimmed)) return { ok: false, message: "Enter a valid number (e.g. 100 or −17.5)." };
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return { ok: false, message: "Please enter a valid numeric temperature." };
    if (value < ABS_ZERO[unit])  return { ok: false, message: `Below absolute zero! Min is ${ABS_ZERO[unit]} ${UNIT_SUFFIX[unit]}` };
    return { ok: true, value };
  }

  function showError(msg) {
    tempError.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${msg}`;
    tempError.classList.add("is-visible");
    tempError.classList.remove("is-shaking");
    void tempError.offsetWidth;
    tempError.classList.add("is-shaking");
    tempInput.setAttribute("aria-invalid", "true");
  }

  function hideError() {
    tempError.classList.remove("is-visible", "is-shaking");
    tempInput.setAttribute("aria-invalid", "false");
  }

  /* ====================================================
     Custom Select
     ==================================================== */
  function openSelect() {
    selectList.classList.add("is-open");
    selectTrigger.setAttribute("aria-expanded", "true");
  }
  function closeSelect() {
    selectList.classList.remove("is-open");
    selectTrigger.setAttribute("aria-expanded", "false");
  }
  function toggleSelect() {
    selectList.classList.contains("is-open") ? closeSelect() : openSelect();
  }

  function chooseUnit(unit, { silent } = {}) {
    currentUnit = unit;
    unitSelect.value = unit;
    selectValue.textContent = UNIT_LABEL[unit];
    selectDot.style.background = UNIT_DOT_COLOR[unit];
    inputUnitBadge.textContent = UNIT_SUFFIX[unit];
    // badge color
    const colors = {
      C: ["rgba(56,189,248,0.12)", "rgba(56,189,248,0.22)", "var(--c-celsius)"],
      F: ["rgba(167,139,250,0.12)", "rgba(167,139,250,0.22)", "var(--c-fahrenheit)"],
      K: ["rgba(251,146,60,0.12)", "rgba(251,146,60,0.22)", "var(--c-kelvin)"],
    };
    const [bg, border, col] = colors[unit];
    inputUnitBadge.style.background    = bg;
    inputUnitBadge.style.borderColor   = border;
    inputUnitBadge.style.color         = col;

    selectOptions.forEach((opt) => {
      const sel = opt.dataset.value === unit;
      opt.classList.toggle("is-selected", sel);
      opt.setAttribute("aria-selected", String(sel));
    });
    if (!silent) revalidateLive();
  }

  selectTrigger.addEventListener("click", toggleSelect);

  selectOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
      chooseUnit(opt.dataset.value);
      closeSelect();
      selectTrigger.focus();
    });
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("customSelect").contains(e.target)) closeSelect();
  });

  selectTrigger.addEventListener("keydown", (e) => {
    if (["ArrowDown", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openSelect();
      const idx = selectOptions.findIndex((o) => o.classList.contains("is-selected"));
      (selectOptions[idx] || selectOptions[0]).focus();
    } else if (e.key === "Escape") closeSelect();
  });

  selectOptions.forEach((opt, idx) => {
    opt.setAttribute("tabindex", "-1");
    opt.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); (selectOptions[idx + 1] || selectOptions[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (selectOptions[idx - 1] || selectOptions[selectOptions.length - 1]).focus(); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chooseUnit(opt.dataset.value); closeSelect(); selectTrigger.focus(); }
      else if (e.key === "Escape") { closeSelect(); selectTrigger.focus(); }
    });
  });

  /* ====================================================
     Global keyboard shortcuts
     ==================================================== */
  document.addEventListener("keydown", (e) => {
    // Ctrl+Enter or Cmd+Enter → Convert
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runConvertWithLoading();
      return;
    }
    // Alt+U → Toggle unit select dropdown
    if (e.altKey && e.key.toLowerCase() === "u") {
      e.preventDefault();
      toggleSelect();
      if (selectList.classList.contains("is-open")) {
        const idx = selectOptions.findIndex((o) => o.classList.contains("is-selected"));
        (selectOptions[idx] || selectOptions[0]).focus();
      } else {
        selectTrigger.focus();
      }
    }
  });

  /* ====================================================
     Render results
     ==================================================== */
  const UNIT_SYMBOL = { C: "°C", F: "°F", K: "K" };

  function renderResults(result, inputUnit) {
    resultGrid.innerHTML = "";
    const order = ["C", "F", "K"];
    order.forEach((unit, i) => {
      const card = document.createElement("div");
      card.className = `result-card result-card--${unit}${unit === inputUnit ? " is-primary" : ""}`;
      card.style.animationDelay = `${i * 80}ms`;

      card.innerHTML = `
        <button class="rc-copy" data-val="${round2(result[unit]).toFixed(2)}${UNIT_SUFFIX[unit]}" title="Copy ${UNIT_FULL_NAME[unit]} value" aria-label="Copy ${UNIT_FULL_NAME[unit]} value">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.8"/></svg>
        </button>
        <div class="rc-icon">${UNIT_SYMBOL[unit]}</div>
        <div class="rc-value" data-current="0">${round2(result[unit]).toFixed(2)}</div>
        <div class="rc-unit">${UNIT_FULL_NAME[unit]}</div>
      `;

      resultGrid.appendChild(card);

      // Animate number
      const valEl = card.querySelector(".rc-value");
      valEl.textContent = "0.00";
      setTimeout(() => animateNumber(valEl, round2(result[unit]), 550), i * 80 + 50);

      // Per-card copy
      card.querySelector(".rc-copy").addEventListener("click", async (e) => {
        e.stopPropagation();
        const txt = e.currentTarget.dataset.val;
        try {
          await navigator.clipboard.writeText(txt);
          showToast(`Copied ${txt}`, "success");
        } catch {
          showToast("Copy failed", "error");
        }
      });
    });

    resultsSection.hidden = false;

    // Update gauge using current unit's value
    updateGauge(round2(result.C), inputUnit);
  }

  /* ====================================================
     History
     ==================================================== */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
  }

  function saveHistory(items) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); }
    catch { /* storage unavailable */ }
  }

  function addHistoryEntry(inputValue, inputUnit, result) {
    const items = loadHistory();
    items.unshift({
      inputValue, inputUnit,
      C: round2(result.C), F: round2(result.F), K: round2(result.K),
      time: new Date().toISOString(),
    });
    saveHistory(items.slice(0, MAX_HISTORY));
    renderHistory();
  }

  function renderHistory() {
    const items = loadHistory();
    historyList.innerHTML = "";
    if (items.length === 0) { historySection.hidden = true; return; }
    historySection.hidden = false;

    items.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = "history__item";
      li.style.animationDelay = `${i * 55}ms`;
      const t = new Date(item.time);
      const timeStr = isNaN(t) ? "" : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      li.innerHTML = `
        <span class="hist-main">${item.inputValue}${UNIT_SUFFIX[item.inputUnit]} → ${item.C}°C · ${item.F}°F · ${item.K}K</span>
        <span class="hist-right">
          <span class="hist-time">${timeStr}</span>
        </span>
      `;
      historyList.appendChild(li);
    });
  }

  clearHistoryBtn.addEventListener("click", () => {
    saveHistory([]);
    renderHistory();
    showToast("History cleared", "success");
  });

  /* ====================================================
     Toasts
     ==================================================== */
  function showToast(message, kind = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast--${kind}`;

    const iconSVG = kind === "success"
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

    toast.innerHTML = iconSVG + `<span>${message}</span>`;
    toastStack.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("is-leaving");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, 2600);
  }

  /* ====================================================
     Conversion flow
     ==================================================== */
  function performConversion({ recordHistory }) {
    const raw = tempInput.value;
    const check = validate(raw, currentUnit);
    if (!check.ok) {
      showError(check.message);
      resultsSection.hidden = true;
      lastResult = null;
      return false;
    }
    hideError();
    const result = computeFor(currentUnit, check.value);
    renderResults(result, currentUnit);
    lastResult = { ...result, inputUnit: currentUnit, inputValue: check.value };
    if (recordHistory) addHistoryEntry(check.value, currentUnit, result);
    return true;
  }

  function revalidateLive() {
    if (liveToggle.checked && tempInput.value.trim() !== "") {
      performConversion({ recordHistory: false });
    }
  }

  /* Submit */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runConvertWithLoading();
  });

  function runConvertWithLoading() {
    convertBtn.classList.add("is-loading");
    convertBtn.disabled = true;
    setTimeout(() => {
      convertBtn.classList.remove("is-loading");
      convertBtn.disabled = false;
      const ok = performConversion({ recordHistory: true });
      showToast(ok ? "Conversion complete ✓" : "Fix the highlighted field", ok ? "success" : "error");
    }, 320);
  }

  /* Ripple effect */
  convertBtn.addEventListener("click", (e) => {
    const ripple = convertBtn.querySelector(".btn__ripple");
    const rect = convertBtn.getBoundingClientRect();
    ripple.style.setProperty("--rx", `${e.clientX - rect.left}px`);
    ripple.style.setProperty("--ry", `${e.clientY - rect.top}px`);
    convertBtn.classList.remove("ripple-active");
    void convertBtn.offsetWidth;
    convertBtn.classList.add("ripple-active");
    convertBtn.addEventListener("animationend", () => convertBtn.classList.remove("ripple-active"), { once: true });
  });

  /* Live input */
  tempInput.addEventListener("input", () => {
    const raw = tempInput.value;
    if (raw.trim() === "") { hideError(); resultsSection.hidden = true; return; }
    const check = validate(raw, currentUnit);
    if (check.ok) {
      hideError();
      if (liveToggle.checked) performConversion({ recordHistory: false });
    } else {
      showError(check.message);
      resultsSection.hidden = true;
    }
  });

  tempInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runConvertWithLoading(); }
  });

  liveToggle.addEventListener("change", revalidateLive);

  /* Reset */
  resetBtn.addEventListener("click", () => {
    tempInput.value = "";
    hideError();
    resultsSection.hidden = true;
    lastResult = null;
    chooseUnit("C", { silent: true });
    tempInput.focus();
    showToast("Form reset", "success");
  });

  /* Swap units */
  swapBtn.addEventListener("click", () => {
    if (!lastResult) {
      showToast("Convert a value first, then swap!", "error");
      return;
    }
    // Find the 'other' unit to swap into:
    // cycle C→F→K→C when swapping
    const ORDER = ["C", "F", "K"];
    const nextIdx = (ORDER.indexOf(currentUnit) + 1) % ORDER.length;
    const nextUnit = ORDER[nextIdx];
    // Set the input to the converted value in the next unit
    const nextValue = round2(lastResult[nextUnit]);
    tempInput.value = nextValue;
    chooseUnit(nextUnit, { silent: true });
    // Animate swap icon
    swapBtn.classList.add("is-swapping");
    swapBtn.addEventListener("animationend", () => swapBtn.classList.remove("is-swapping"), { once: true });
    runConvertWithLoading();
    showToast(`Swapped to ${UNIT_FULL_NAME[nextUnit]}`, "success");
  });

  /* Copy all */
  copyBtn.addEventListener("click", async () => {
    if (!lastResult) return;
    const text = `${round2(lastResult.C).toFixed(2)}°C | ${round2(lastResult.F).toFixed(2)}°F | ${round2(lastResult.K).toFixed(2)} K`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("All values copied!", "success");
    } catch {
      showToast("Could not copy — try manually", "error");
    }
  });

  /* ====================================================
     Theme
     ==================================================== */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }

  function initTheme() {
    let theme = "dark";
    try { theme = localStorage.getItem(THEME_KEY) || "dark"; } catch { /* ignore */ }
    applyTheme(theme);
  }

  themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "light" ? "dark" : "light");
  });

  /* ====================================================
     Live clock
     ==================================================== */
  function tickClock() {
    const now = new Date();
    liveClock.textContent = now.toLocaleString([], {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  /* ====================================================
     Init
     ==================================================== */
  initTheme();
  chooseUnit("C", { silent: true });
  renderHistory();
  tickClock();
  setInterval(tickClock, 30000);

})();
