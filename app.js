// ============================================================
// app.js — Blueprint Protocol Application Core
// ============================================================
// Architecture: Single-page app with 3 views managed by a
// simple router. All state persisted to localStorage.
// Notifications scheduled via setTimeout with drift correction.
// ============================================================

(function () {
  'use strict';

  // ── CONFIGURATION ────────────────────────────────────────
  // Edit these times (24h format) to adjust your protocol.
  // Format: { hour, minute, label, subtitle, icon }
  const PROTOCOL_SCHEDULE = [
    {
      id: 'circadian',
      hour: 8, minute: 0,
      label: 'Circadian Anchor',
      subtitle: '10 min sunlight exposure · 5 min Cat-Cow / Bird-Dog',
      icon: '◎'
    },
    {
      id: 'anabolic',
      hour: 8, minute: 30,
      label: 'Anabolic Intake',
      subtitle: '800 kcal smoothie · 35g protein · 5g creatine',
      icon: '▲'
    },
    {
      id: 'structural',
      hour: 10, minute: 30,
      label: 'Structural Reset',
      subtitle: 'Stand up · 5 air squats · Reset posture',
      icon: '⬡'
    },
    {
      id: 'spinal',
      hour: 14, minute: 30,
      label: 'Spinal Decompression',
      subtitle: '90/90 stretch or dead hang · 2 minutes',
      icon: '◇'
    },
    {
      id: 'forge',
      hour: 17, minute: 30,
      label: 'The Forge',
      subtitle: 'Execute gym protocol · Full session',
      icon: '⬢'
    },
    {
      id: 'lymphatic',
      hour: 21, minute: 30,
      label: 'Lymphatic Flush',
      subtitle: 'Legs up the wall · Magnesium · Wind down',
      icon: '○'
    }
  ];

  // Gym protocols — two alternating days
  const GYM_PROTOCOLS = {
    A: {
      name: 'Lower Body & Core',
      codename: 'Foundation Protocol',
      exercises: [
        {
          name: 'Dead Hangs',
          sets: '3 × 30s',
          notes: 'Full grip, shoulders packed. Decompress the spine.',
          muscles: 'Grip · Lats · Spine'
        },
        {
          name: 'Bulgarian Split Squats',
          sets: '3 × 8 / leg',
          notes: 'Rear foot elevated. Vertical torso. Control the negative.',
          muscles: 'Quads · Glutes · Balance'
        },
        {
          name: 'Glute Bridges',
          sets: '3 × 12',
          notes: 'Squeeze at top for 2s. Drive through heels.',
          muscles: 'Glutes · Hamstrings · Core'
        },
        {
          name: 'Bird-Dogs',
          sets: '3 × 10 / side',
          notes: 'Slow and controlled. No rotation. Brace core.',
          muscles: 'Deep Core · Erectors · Shoulders'
        }
      ]
    },
    B: {
      name: 'Upper Body & Posture',
      codename: 'Armor Protocol',
      exercises: [
        {
          name: 'Single-Arm DB Rows',
          sets: '3 × 10 / arm',
          notes: 'Pull to hip. No rotation. Squeeze the lat.',
          muscles: 'Lats · Rhomboids · Biceps'
        },
        {
          name: 'Incline DB Press',
          sets: '3 × 8–10',
          notes: '30° incline. Full ROM. Control the eccentric.',
          muscles: 'Upper Chest · Front Delts · Triceps'
        },
        {
          name: 'Face Pulls',
          sets: '3 × 15',
          notes: 'External rotate at the top. Light weight, high intent.',
          muscles: 'Rear Delts · Rotator Cuff · Traps'
        },
        {
          name: 'Farmer\'s Carries',
          sets: '3 × 40m',
          notes: 'Heavy load. Tall posture. Breathe through the brace.',
          muscles: 'Grip · Core · Traps · Cardio'
        }
      ]
    }
  };

  // Lab metrics configuration
  const LAB_METRICS = [
    { id: 'weight', label: 'Mass', unit: 'kg', target: 75, min: 50, max: 120, step: 0.1 },
    { id: 'sleep', label: 'Sleep Depth', unit: '%', target: 85, min: 0, max: 100, step: 1 },
    { id: 'eczema', label: 'Eczema Flare', unit: '/ 10', target: 1, min: 1, max: 10, step: 1 },
    { id: 'back', label: 'Lumbar Stiffness', unit: '/ 10', target: 1, min: 1, max: 10, step: 1 }
  ];

  // ── STATE ────────────────────────────────────────────────
  let currentView = 'stack';
  let notificationTimers = [];

  // ── HELPERS ──────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function getChecked() {
    return JSON.parse(localStorage.getItem(`bp_checked_${todayKey()}`) || '[]');
  }

  function setChecked(arr) {
    localStorage.setItem(`bp_checked_${todayKey()}`, JSON.stringify(arr));
  }

  function getLabData() {
    return JSON.parse(localStorage.getItem('bp_lab_data') || '[]');
  }

  function setLabData(data) {
    localStorage.setItem('bp_lab_data', JSON.stringify(data));
  }

  function getGymDay() {
    return localStorage.getItem('bp_gym_day') || 'A';
  }

  function setGymDay(day) {
    localStorage.setItem('bp_gym_day', day);
  }

  function formatTime(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function getCompletionPct() {
    const checked = getChecked();
    return Math.round((checked.length / PROTOCOL_SCHEDULE.length) * 100);
  }

  // ── NOTIFICATION SYSTEM ──────────────────────────────────
  // Schedules local notifications using setTimeout.
  // On iOS PWA, the Notification API works in Safari 16.4+.
  // Falls back gracefully if permissions denied.

  function clearAllTimers() {
    notificationTimers.forEach((t) => clearTimeout(t));
    notificationTimers = [];
  }

  function scheduleNotifications() {
    clearAllTimers();

    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const checked = getChecked();

    PROTOCOL_SCHEDULE.forEach((item) => {
      // Don't notify for already-completed items
      if (checked.includes(item.id)) return;

      const target = new Date();
      target.setHours(item.hour, item.minute, 0, 0);

      let delay = target.getTime() - now.getTime();

      // If the time already passed today, skip (or schedule for tomorrow)
      if (delay < 0) return;

      const timer = setTimeout(() => {
        // Try SW-based notification first (works better on iOS)
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `${item.icon} ${item.label}`,
            body: item.subtitle,
            tag: item.id
          });
        } else {
          // Fallback to direct Notification API
          new Notification(`${item.icon} ${item.label}`, {
            body: item.subtitle,
            tag: item.id
          });
        }
      }, delay);

      notificationTimers.push(timer);
    });
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported on this device');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      showToast('Reminders activated');
      scheduleNotifications();
      renderStack(); // Re-render to update button state
    } else {
      showToast('Permission denied — enable in Settings');
    }
  }

  // ── TOAST ────────────────────────────────────────────────
  function showToast(msg) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
    }, 2400);
  }

  // ── RENDER: DAILY STACK ──────────────────────────────────
  function renderStack() {
    const checked = getChecked();
    const pct = getCompletionPct();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const notifStatus = ('Notification' in window && Notification.permission === 'granted');

    let html = `
      <div class="px-5 pt-2 pb-4">
        <!-- Header -->
        <div class="mb-6">
          <p class="text-xs tracking-[0.3em] uppercase text-white/30 mb-1">Protocol</p>
          <h1 class="text-2xl font-bold tracking-tight">Daily Stack</h1>
          <p class="text-xs text-white/40 mt-1 font-mono">${todayKey()}</p>
        </div>

        <!-- Progress Ring -->
        <div class="flex items-center gap-5 mb-6 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div class="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" class="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent)" stroke-width="2.5"
                stroke-dasharray="${pct} ${100 - pct}"
                stroke-linecap="round"
                class="transition-all duration-700"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono">${pct}%</span>
          </div>
          <div>
            <p class="text-sm font-semibold">${pct === 100 ? 'Protocol Complete' : 'Structural Integrity'}</p>
            <p class="text-xs text-white/40">${checked.length} of ${PROTOCOL_SCHEDULE.length} directives executed</p>
          </div>
        </div>

        <!-- Notification Toggle -->
        <button onclick="app.requestNotifications()" class="w-full mb-6 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${notifStatus
          ? 'bg-white/[0.04] border border-white/[0.08] text-white/40'
          : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'
        }">
          <span class="text-base">${notifStatus ? '✓' : '⚡'}</span>
          ${notifStatus ? 'Reminders Active' : 'Enable Reminders'}
        </button>

        <!-- Timeline -->
        <div class="relative">
          <!-- Vertical timeline line -->
          <div class="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

          ${PROTOCOL_SCHEDULE.map((item, i) => {
            const done = checked.includes(item.id);
            const itemMinutes = item.hour * 60 + item.minute;
            const isNext = !done && currentMinutes <= itemMinutes && !checked.includes(item.id);
            const isPast = currentMinutes > itemMinutes && !done;

            // Find if this is the very next unchecked item
            const nextUnchecked = PROTOCOL_SCHEDULE.find(
              (s) => !checked.includes(s.id) && (s.hour * 60 + s.minute) >= currentMinutes
            );
            const isActive = nextUnchecked && nextUnchecked.id === item.id;

            return `
              <button onclick="app.toggleCheck('${item.id}')"
                class="relative w-full flex items-start gap-4 py-3 px-1 text-left group transition-all duration-300
                  ${done ? 'opacity-40' : ''} ${isActive ? '' : ''}">

                <!-- Timeline Node -->
                <div class="relative z-10 w-[18px] h-[18px] mt-1 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
                  ${done
                    ? 'bg-accent/80 shadow-[0_0_12px_rgba(0,229,160,0.3)]'
                    : isActive
                      ? 'border-2 border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,229,160,0.15)]'
                      : 'border border-white/20 bg-transparent'
                  }">
                  ${done ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2 mb-0.5">
                    <span class="text-[11px] font-mono ${isActive ? 'text-accent' : 'text-white/30'}">${formatTime(item.hour, item.minute)}</span>
                  </div>
                  <p class="text-[15px] font-semibold tracking-tight ${done ? 'line-through decoration-white/20' : ''}">${item.label}</p>
                  <p class="text-xs text-white/35 mt-0.5 leading-relaxed">${item.subtitle}</p>
                </div>

                <!-- Status indicator -->
                <div class="mt-2 flex-shrink-0">
                  ${isActive ? '<span class="block w-2 h-2 rounded-full bg-accent animate-pulse"></span>' : ''}
                  ${isPast && !done ? '<span class="text-[10px] text-red-400/60 font-mono">MISSED</span>' : ''}
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Reset -->
        <button onclick="app.resetDay()" class="mt-8 w-full py-2.5 text-xs text-white/20 hover:text-white/40 transition-colors tracking-widest uppercase">
          Reset Protocol
        </button>
      </div>
    `;

    $('#main-content').innerHTML = html;
  }

  // ── RENDER: THE FORGE ────────────────────────────────────
  function renderForge() {
    const day = getGymDay();
    const protocol = GYM_PROTOCOLS[day];
    const otherDay = day === 'A' ? 'B' : 'A';

    let html = `
      <div class="px-5 pt-2 pb-4">
        <!-- Header -->
        <div class="mb-6">
          <p class="text-xs tracking-[0.3em] uppercase text-white/30 mb-1">The Forge</p>
          <h1 class="text-2xl font-bold tracking-tight">Gym Protocol</h1>
        </div>

        <!-- Day Switcher -->
        <div class="flex gap-2 mb-6">
          <button onclick="app.switchGymDay('A')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${day === 'A'
              ? 'bg-accent/15 border border-accent/30 text-accent'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'
            }">
            Day A
          </button>
          <button onclick="app.switchGymDay('B')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${day === 'B'
              ? 'bg-accent/15 border border-accent/30 text-accent'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'
            }">
            Day B
          </button>
        </div>

        <!-- Protocol Header -->
        <div class="mb-5 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <p class="text-xs text-accent/70 font-mono tracking-wider uppercase mb-1">${protocol.codename}</p>
          <p class="text-lg font-bold">${protocol.name}</p>
          <p class="text-xs text-white/30 mt-1">${protocol.exercises.length} movements · Scoliosis-safe</p>
        </div>

        <!-- Exercise Cards -->
        <div class="space-y-3">
          ${protocol.exercises.map((ex, i) => `
            <div class="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.12]">
              <!-- Illustration Placeholder -->
              <div class="h-28 bg-gradient-to-br from-white/[0.02] to-transparent flex items-center justify-center border-b border-white/[0.04]">
                <div class="text-center">
                  <div class="text-3xl mb-1 opacity-20">${['🦴', '🦵', '🍑', '🧠'][i] || '💪'}</div>
                  <p class="text-[10px] text-white/15 font-mono tracking-wider">ILLUSTRATION</p>
                </div>
              </div>

              <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <p class="text-xs text-white/25 font-mono mb-0.5">${String(i + 1).padStart(2, '0')}</p>
                    <h3 class="text-[15px] font-bold tracking-tight">${ex.name}</h3>
                  </div>
                  <span class="text-xs font-mono text-accent/80 bg-accent/10 px-2.5 py-1 rounded-lg">${ex.sets}</span>
                </div>
                <p class="text-xs text-white/40 leading-relaxed mb-2">${ex.notes}</p>
                <p class="text-[10px] text-white/20 font-mono tracking-wider uppercase">${ex.muscles}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    $('#main-content').innerHTML = html;
  }

  // ── RENDER: THE LAB ──────────────────────────────────────
  function renderLab() {
    const data = getLabData();
    const last7 = data.slice(-7);

    let html = `
      <div class="px-5 pt-2 pb-4">
        <!-- Header -->
        <div class="mb-6">
          <p class="text-xs tracking-[0.3em] uppercase text-white/30 mb-1">The Lab</p>
          <h1 class="text-2xl font-bold tracking-tight">Data Logging</h1>
        </div>

        <!-- Input Form -->
        <div class="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-6">
          <p class="text-xs text-accent/70 font-mono tracking-wider uppercase mb-4">Log Entry · ${todayKey()}</p>

          <div class="space-y-4">
            ${LAB_METRICS.map((m) => {
              // Get today's value if already logged
              const todayEntry = data.find((d) => d.date === todayKey());
              const val = todayEntry ? todayEntry[m.id] || '' : '';

              return `
                <div>
                  <div class="flex items-baseline justify-between mb-2">
                    <label class="text-sm font-semibold">${m.label}</label>
                    <span class="text-[10px] font-mono text-white/25">Target: ${m.target}${m.unit}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input type="number" id="input-${m.id}"
                      value="${val}"
                      min="${m.min}" max="${m.max}" step="${m.step}"
                      placeholder="—"
                      class="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono
                        text-white placeholder-white/20 focus:outline-none focus:border-accent/40 focus:bg-white/[0.06]
                        transition-all duration-300 appearance-none"
                    />
                    <span class="text-xs text-white/30 font-mono w-8">${m.unit}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <button onclick="app.saveLabEntry()"
            class="w-full mt-5 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent
              text-sm font-semibold hover:bg-accent/25 transition-all duration-300 active:scale-[0.98]">
            Save Entry
          </button>
        </div>

        <!-- Chart Area -->
        ${last7.length > 0 ? `
          <div class="space-y-5">
            ${LAB_METRICS.map((m) => {
              const values = last7.map((d) => d[m.id]).filter((v) => v !== undefined && v !== null);
              if (values.length === 0) return '';

              const maxVal = m.max;
              const minVal = m.min;
              const range = maxVal - minVal;
              const latest = values[values.length - 1];
              const targetPct = ((m.target - minVal) / range) * 100;

              // For inverted metrics (lower is better), invert the color logic
              const isInverted = m.id === 'eczema' || m.id === 'back';

              return `
                <div class="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div class="flex items-baseline justify-between mb-3">
                    <p class="text-sm font-semibold">${m.label}</p>
                    <p class="text-lg font-bold font-mono">${latest}<span class="text-xs text-white/30 ml-0.5">${m.unit}</span></p>
                  </div>

                  <!-- Mini bar chart -->
                  <div class="flex items-end gap-1 h-16 mb-1">
                    ${last7.map((d, i) => {
                      const v = d[m.id];
                      if (v === undefined || v === null) return `<div class="flex-1 h-full flex items-end"><div class="w-full h-1 bg-white/5 rounded-sm"></div></div>`;
                      const pct = Math.max(4, ((v - minVal) / range) * 100);
                      const isGood = isInverted ? v <= m.target : v >= m.target;
                      return `
                        <div class="flex-1 h-full flex items-end">
                          <div class="w-full rounded-sm transition-all duration-500 ${isGood ? 'bg-accent/60' : 'bg-white/15'}"
                            style="height: ${pct}%"></div>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Date labels -->
                  <div class="flex gap-1">
                    ${last7.map((d) => `
                      <div class="flex-1 text-center">
                        <span class="text-[8px] font-mono text-white/15">${d.date.slice(8)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <button onclick="app.clearLabData()" class="mt-6 w-full py-2.5 text-xs text-white/15 hover:text-white/30 transition-colors tracking-widest uppercase">
            Clear All Data
          </button>
        ` : `
          <div class="text-center py-12">
            <p class="text-white/15 text-sm">No data logged yet</p>
            <p class="text-white/10 text-xs mt-1">Begin tracking to see your trends</p>
          </div>
        `}
      </div>
    `;

    $('#main-content').innerHTML = html;
  }

  // ── VIEW ROUTER ──────────────────────────────────────────
  function switchView(view) {
    currentView = view;

    // Update nav buttons
    $$('.nav-btn').forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('text-accent', isActive);
      btn.classList.toggle('text-white/30', !isActive);
    });

    // Render the correct view
    const content = $('#main-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(8px)';

    setTimeout(() => {
      switch (view) {
        case 'stack': renderStack(); break;
        case 'forge': renderForge(); break;
        case 'lab':   renderLab();   break;
      }
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    }, 150);
  }

  // ── ACTIONS ──────────────────────────────────────────────
  function toggleCheck(id) {
    let checked = getChecked();
    if (checked.includes(id)) {
      checked = checked.filter((c) => c !== id);
    } else {
      checked.push(id);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }
    setChecked(checked);
    renderStack();
    scheduleNotifications(); // Reschedule (skip completed items)
  }

  function resetDay() {
    localStorage.removeItem(`bp_checked_${todayKey()}`);
    renderStack();
    scheduleNotifications();
    showToast('Protocol reset');
  }

  function switchGymDay(day) {
    setGymDay(day);
    renderForge();
  }

  function saveLabEntry() {
    const entry = { date: todayKey() };
    let hasData = false;

    LAB_METRICS.forEach((m) => {
      const input = $(`#input-${m.id}`);
      if (input && input.value !== '') {
        entry[m.id] = parseFloat(input.value);
        hasData = true;
      }
    });

    if (!hasData) {
      showToast('Enter at least one metric');
      return;
    }

    let data = getLabData();

    // Update existing entry for today or add new
    const idx = data.findIndex((d) => d.date === todayKey());
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...entry };
    } else {
      data.push(entry);
    }

    // Keep only last 90 days
    if (data.length > 90) data = data.slice(-90);

    setLabData(data);
    renderLab();
    showToast('Entry saved');
  }

  function clearLabData() {
    if (confirm('Clear all logged data? This cannot be undone.')) {
      localStorage.removeItem('bp_lab_data');
      renderLab();
      showToast('Data cleared');
    }
  }

  // ── SERVICE WORKER REGISTRATION ──────────────────────────
  async function registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (err) {
        console.warn('SW registration failed:', err);
      }
    }
  }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    registerSW();

    // Bind nav buttons
    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Initial render
    switchView('stack');

    // Schedule notifications if already permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotifications();
    }

    // Re-schedule at midnight for the next day
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0); // 5 seconds past midnight
    const msToMidnight = midnight.getTime() - now.getTime();
    setTimeout(() => {
      scheduleNotifications();
      renderStack();
    }, msToMidnight);
  }

  // ── PUBLIC API ───────────────────────────────────────────
  // Exposed to onclick handlers in the HTML
  window.app = {
    toggleCheck,
    resetDay,
    switchGymDay,
    saveLabEntry,
    clearLabData,
    requestNotifications: requestNotificationPermission,
    switchView
  };

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
