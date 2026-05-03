// ============================================================
// app.js — Blueprint Protocol Application Core v2
// ============================================================
// New in v2:
//   • SVG illustrations for all 8 gym exercises
//   • Editable reminder times (persisted to localStorage)
// ============================================================

(function () {
  'use strict';

  // ── DEFAULT SCHEDULE ─────────────────────────────────────
  // These are the defaults. User overrides are saved in localStorage.
  const DEFAULT_SCHEDULE = [
    { id: 'circadian', hour: 8,  minute: 0,  label: 'Circadian Anchor',     subtitle: '10 min sunlight exposure · 5 min Cat-Cow / Bird-Dog', icon: '◎' },
    { id: 'anabolic',  hour: 8,  minute: 30, label: 'Anabolic Intake',      subtitle: '800 kcal smoothie · 35g protein · 5g creatine',       icon: '▲' },
    { id: 'structural',hour: 10, minute: 30, label: 'Structural Reset',     subtitle: 'Stand up · 5 air squats · Reset posture',             icon: '⬡' },
    { id: 'spinal',    hour: 14, minute: 30, label: 'Spinal Decompression', subtitle: '90/90 stretch or dead hang · 2 minutes',              icon: '◇' },
    { id: 'forge',     hour: 17, minute: 30, label: 'The Forge',            subtitle: 'Execute gym protocol · Full session',                 icon: '⬢' },
    { id: 'lymphatic', hour: 21, minute: 30, label: 'Lymphatic Flush',      subtitle: 'Legs up the wall · Magnesium · Wind down',            icon: '○' }
  ];

  // ── SVG EXERCISE ILLUSTRATIONS ───────────────────────────
  // Minimalist anatomical stick-figure illustrations.
  // Accent green on transparent. Stroke-based style.
  const EXERCISE_SVG = {
    'Dead Hangs': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" y1="12" x2="160" y2="12" stroke="rgba(255,255,255,0.1)" stroke-width="4" stroke-linecap="round"/>
      <line x1="85" y1="12" x2="85" y2="24" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="115" y1="12" x2="115" y2="24" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <circle cx="100" cy="36" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="100" y1="46" x2="100" y2="85" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="52" x2="85" y2="24" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="52" x2="115" y2="24" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="85" x2="90" y2="115" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="85" x2="110" y2="115" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="115" x2="88" y2="125" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="110" y1="115" x2="112" y2="125" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <path d="M92 68 L100 72 L108 68" stroke="#00E5A0" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      <text x="100" y="138" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">DECOMPRESS</text>
      <line x1="75" y1="90" x2="75" y2="120" stroke="rgba(0,229,160,0.2)" stroke-width="1" stroke-dasharray="2 3"/>
      <polygon points="75,120 72,114 78,114" fill="rgba(0,229,160,0.2)"/>
    </svg>`,

    'Bulgarian Split Squats': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="140" y="75" width="35" height="18" rx="3" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
      <circle cx="90" cy="30" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="90" y1="40" x2="90" y2="75" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="55" x2="72" y2="68" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="55" x2="108" y2="68" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="75" x2="70" y2="105" stroke="#00E5A0" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="70" y1="105" x2="65" y2="128" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="65" y1="128" x2="58" y2="130" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="75" x2="120" y2="95" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="120" y1="95" x2="142" y2="80" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <circle cx="70" cy="105" r="3" stroke="rgba(0,229,160,0.3)" stroke-width="1" fill="none"/>
      <path d="M60 100 Q65 92 75 95" stroke="rgba(0,229,160,0.25)" stroke-width="1" fill="none"/>
      <text x="100" y="138" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">SPLIT STANCE</text>
    </svg>`,

    'Glute Bridges': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="118" x2="180" y2="118" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <circle cx="45" cy="80" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="55" y1="82" x2="90" y2="88" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <path d="M90 88 Q110 55 130 75" stroke="#00E5A0" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="130" y1="75" x2="140" y2="105" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="140" y1="105" x2="145" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="130" y1="75" x2="150" y2="95" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="150" y1="95" x2="155" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="88" x2="78" y2="105" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="88" x2="100" y2="100" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <path d="M105 60 L112 52 L119 60" stroke="rgba(0,229,160,0.3)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <line x1="112" y1="52" x2="112" y2="42" stroke="rgba(0,229,160,0.2)" stroke-width="1" stroke-dasharray="2 3"/>
      <ellipse cx="110" cy="72" rx="14" ry="6" stroke="rgba(0,229,160,0.15)" stroke-width="1" fill="rgba(0,229,160,0.03)"/>
      <text x="100" y="135" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">HIP DRIVE</text>
    </svg>`,

    'Bird-Dogs': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="118" x2="180" y2="118" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <circle cx="65" cy="60" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="75" y1="62" x2="130" y2="68" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="65" x2="85" y2="95" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="85" y1="95" x2="82" y2="118" stroke="#00E5A0" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <line x1="120" y1="67" x2="115" y2="95" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="115" y1="95" x2="112" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="55" y1="58" x2="28" y2="50" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="130" y1="68" x2="165" y2="55" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="165" y1="55" x2="170" y2="52" stroke="#00E5A0" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M28 42 L28 50 L36 50" stroke="rgba(0,229,160,0.3)" stroke-width="1" fill="none"/>
      <line x1="100" y1="63" x2="100" y2="50" stroke="rgba(0,229,160,0.15)" stroke-width="1" stroke-dasharray="2 3"/>
      <text x="100" y="48" text-anchor="middle" fill="rgba(0,229,160,0.2)" font-size="7" font-family="system-ui">BRACE</text>
      <text x="100" y="135" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">CONTRALATERAL</text>
    </svg>`,

    'Single-Arm DB Rows': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="68" width="50" height="6" rx="2" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
      <circle cx="95" cy="42" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="95" y1="52" x2="85" y2="85" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="85" y1="85" x2="70" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="85" y1="85" x2="105" y2="115" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="95" y1="58" x2="60" y2="70" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="95" y1="58" x2="130" y2="62" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="130" y1="62" x2="138" y2="80" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <rect x="134" y="80" width="8" height="14" rx="2" stroke="#00E5A0" stroke-width="1.5" fill="rgba(0,229,160,0.08)"/>
      <path d="M145 72 Q150 62 148 52" stroke="rgba(0,229,160,0.25)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <polygon points="148,52 152,58 145,57" fill="rgba(0,229,160,0.25)"/>
      <text x="100" y="135" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">PULL TO HIP</text>
    </svg>`,

    'Incline DB Press': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" y1="120" x2="120" y2="50" stroke="rgba(255,255,255,0.08)" stroke-width="12" stroke-linecap="round"/>
      <circle cx="105" cy="52" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="100" y1="60" x2="80" y2="100" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="80" y1="100" x2="65" y2="122" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="80" y1="100" x2="95" y2="122" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="68" x2="130" y2="58" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="130" y1="58" x2="148" y2="35" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <rect x="143" y="28" width="10" height="14" rx="2" stroke="#00E5A0" stroke-width="1.5" fill="rgba(0,229,160,0.08)"/>
      <line x1="100" y1="68" x2="120" y2="65" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="120" y1="65" x2="138" y2="42" stroke="#00E5A0" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <path d="M148 28 L152 20" stroke="rgba(0,229,160,0.25)" stroke-width="1" stroke-dasharray="2 3"/>
      <text x="155" y="18" fill="rgba(0,229,160,0.2)" font-size="7" font-family="system-ui">30°</text>
      <text x="100" y="138" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">INCLINE PRESS</text>
    </svg>`,

    'Face Pulls': `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="155" y="20" width="8" height="100" rx="3" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
      <line x1="159" y1="60" x2="130" y2="55" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <circle cx="90" cy="35" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="90" y1="45" x2="90" y2="85" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="85" x2="80" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="85" x2="100" y2="118" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="55" x2="110" y2="45" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="110" y1="45" x2="130" y2="55" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="90" y1="55" x2="108" y2="50" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="108" y1="50" x2="128" y2="58" stroke="#00E5A0" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
      <circle cx="115" cy="40" r="5" stroke="rgba(0,229,160,0.2)" stroke-width="1" fill="none"/>
      <path d="M115 35 L118 32" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <path d="M115 35 L112 32" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <text x="115" y="28" text-anchor="middle" fill="rgba(0,229,160,0.2)" font-size="6" font-family="system-ui">EXT ROT</text>
      <text x="95" y="135" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">EXTERNAL ROTATE</text>
    </svg>`,

    "Farmer's Carries": `<svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="128" x2="180" y2="128" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <circle cx="100" cy="22" r="10" stroke="#00E5A0" stroke-width="2"/>
      <line x1="100" y1="32" x2="100" y2="78" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="78" x2="88" y2="112" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="78" x2="112" y2="112" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="88" y1="112" x2="85" y2="128" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="112" y1="112" x2="115" y2="128" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="100" y1="45" x2="70" y2="50" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="70" y1="50" x2="65" y2="82" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <rect x="60" y="82" width="10" height="18" rx="2" stroke="#00E5A0" stroke-width="1.5" fill="rgba(0,229,160,0.08)"/>
      <line x1="100" y1="45" x2="130" y2="50" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <line x1="130" y1="50" x2="135" y2="82" stroke="#00E5A0" stroke-width="2" stroke-linecap="round"/>
      <rect x="130" y="82" width="10" height="18" rx="2" stroke="#00E5A0" stroke-width="1.5" fill="rgba(0,229,160,0.08)"/>
      <path d="M88 128 L82 128" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <path d="M82 128 L86 126" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <path d="M112 128 L118 128" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <path d="M118 128 L114 126" stroke="rgba(0,229,160,0.2)" stroke-width="1"/>
      <text x="100" y="138" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="8" font-family="system-ui">LOADED CARRY</text>
    </svg>`
  };

  // ── SCHEDULE (with user overrides from localStorage) ─────
  function getSchedule() {
    const overrides = JSON.parse(localStorage.getItem('bp_schedule_overrides') || '{}');
    return DEFAULT_SCHEDULE.map((item) => {
      if (overrides[item.id]) {
        return { ...item, hour: overrides[item.id].hour, minute: overrides[item.id].minute };
      }
      return { ...item };
    });
  }

  function saveTimeOverride(id, hour, minute) {
    const overrides = JSON.parse(localStorage.getItem('bp_schedule_overrides') || '{}');
    overrides[id] = { hour, minute };
    localStorage.setItem('bp_schedule_overrides', JSON.stringify(overrides));
  }

  function resetAllTimes() {
    localStorage.removeItem('bp_schedule_overrides');
  }

  // Gym protocols
  const GYM_PROTOCOLS = {
    A: {
      name: 'Lower Body & Core',
      codename: 'Foundation Protocol',
      exercises: [
        { name: 'Dead Hangs',             sets: '3 × 30s',       notes: 'Full grip, shoulders packed. Decompress the spine.', muscles: 'Grip · Lats · Spine' },
        { name: 'Bulgarian Split Squats', sets: '3 × 8 / leg',   notes: 'Rear foot elevated. Vertical torso. Control the negative.', muscles: 'Quads · Glutes · Balance' },
        { name: 'Glute Bridges',          sets: '3 × 12',        notes: 'Squeeze at top for 2s. Drive through heels.', muscles: 'Glutes · Hamstrings · Core' },
        { name: 'Bird-Dogs',             sets: '3 × 10 / side', notes: 'Slow and controlled. No rotation. Brace core.', muscles: 'Deep Core · Erectors · Shoulders' }
      ]
    },
    B: {
      name: 'Upper Body & Posture',
      codename: 'Armor Protocol',
      exercises: [
        { name: 'Single-Arm DB Rows', sets: '3 × 10 / arm', notes: 'Pull to hip. No rotation. Squeeze the lat.', muscles: 'Lats · Rhomboids · Biceps' },
        { name: 'Incline DB Press',    sets: '3 × 8–10',     notes: '30° incline. Full ROM. Control the eccentric.', muscles: 'Upper Chest · Front Delts · Triceps' },
        { name: 'Face Pulls',          sets: '3 × 15',       notes: 'External rotate at the top. Light weight, high intent.', muscles: 'Rear Delts · Rotator Cuff · Traps' },
        { name: "Farmer's Carries",    sets: '3 × 40m',      notes: 'Heavy load. Tall posture. Breathe through the brace.', muscles: 'Grip · Core · Traps · Cardio' }
      ]
    }
  };

  // Lab metrics
  const LAB_METRICS = [
    { id: 'weight', label: 'Mass',             unit: 'kg',   target: 75, min: 50,  max: 120, step: 0.1 },
    { id: 'sleep',  label: 'Sleep Depth',       unit: '%',    target: 85, min: 0,   max: 100, step: 1 },
    { id: 'eczema', label: 'Eczema Flare',      unit: '/ 10', target: 1,  min: 1,   max: 10,  step: 1 },
    { id: 'back',   label: 'Lumbar Stiffness',  unit: '/ 10', target: 1,  min: 1,   max: 10,  step: 1 }
  ];

  // ── STATE ────────────────────────────────────────────────
  let currentView = 'stack';
  let notificationTimers = [];
  let editingTimeId = null;

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
  function pad2(n) {
    return String(n).padStart(2, '0');
  }
  function getCompletionPct() {
    const checked = getChecked();
    return Math.round((checked.length / DEFAULT_SCHEDULE.length) * 100);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────
  function clearAllTimers() {
    notificationTimers.forEach((t) => clearTimeout(t));
    notificationTimers = [];
  }

  function scheduleNotifications() {
    clearAllTimers();
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const checked = getChecked();
    const schedule = getSchedule();

    schedule.forEach((item) => {
      if (checked.includes(item.id)) return;
      const target = new Date();
      target.setHours(item.hour, item.minute, 0, 0);
      let delay = target.getTime() - now.getTime();
      if (delay < 0) return;

      const timer = setTimeout(() => {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `${item.icon} ${item.label}`,
            body: item.subtitle,
            tag: item.id
          });
        } else {
          new Notification(`${item.icon} ${item.label}`, { body: item.subtitle, tag: item.id });
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
      renderStack();
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
    const schedule = getSchedule();
    const checked = getChecked();
    const pct = getCompletionPct();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const notifStatus = ('Notification' in window && Notification.permission === 'granted');

    const nextUnchecked = schedule.find(
      (s) => !checked.includes(s.id) && (s.hour * 60 + s.minute) >= currentMinutes
    );

    let html = `
      <div class="px-5 pt-2 pb-4">
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
                stroke-dasharray="${pct} ${100 - pct}" stroke-linecap="round" class="transition-all duration-700"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono">${pct}%</span>
          </div>
          <div>
            <p class="text-sm font-semibold">${pct === 100 ? 'Protocol Complete' : 'Structural Integrity'}</p>
            <p class="text-xs text-white/40">${checked.length} of ${schedule.length} directives executed</p>
          </div>
        </div>

        <!-- Notification Toggle -->
        <button onclick="app.requestNotifications()" class="w-full mb-6 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${notifStatus
          ? 'bg-white/[0.04] border border-white/[0.08] text-white/40'
          : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'}">
          <span class="text-base">${notifStatus ? '✓' : '⚡'}</span>
          ${notifStatus ? 'Reminders Active' : 'Enable Reminders'}
        </button>

        <!-- Timeline -->
        <div class="relative">
          <div class="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

          ${schedule.map((item) => {
            const done = checked.includes(item.id);
            const itemMinutes = item.hour * 60 + item.minute;
            const isPast = currentMinutes > itemMinutes && !done;
            const isActive = nextUnchecked && nextUnchecked.id === item.id;
            const isEditing = editingTimeId === item.id;

            return `
              <div class="relative w-full py-3 px-1 transition-all duration-300 ${done ? 'opacity-40' : ''}">
                <div class="flex items-start gap-4">
                  <!-- Node -->
                  <button onclick="app.toggleCheck('${item.id}')"
                    class="relative z-10 w-[18px] h-[18px] mt-1 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
                    ${done
                      ? 'bg-accent/80 shadow-[0_0_12px_rgba(0,229,160,0.3)]'
                      : isActive
                        ? 'border-2 border-accent bg-accent/10 shadow-[0_0_20px_rgba(0,229,160,0.15)]'
                        : 'border border-white/20 bg-transparent'}">
                    ${done ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                  </button>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <button onclick="app.startEditTime('${item.id}')"
                        class="text-[11px] font-mono ${isActive ? 'text-accent' : 'text-white/30'} hover:text-accent/70 transition-colors flex items-center gap-1.5 active:scale-95">
                        ${formatTime(item.hour, item.minute)}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                    <p class="text-[15px] font-semibold tracking-tight ${done ? 'line-through decoration-white/20' : ''}">${item.label}</p>
                    <p class="text-xs text-white/35 mt-0.5 leading-relaxed">${item.subtitle}</p>

                    ${isEditing ? `
                      <div class="mt-3 p-3 rounded-xl bg-white/[0.04] border border-accent/20">
                        <p class="text-[10px] text-accent/60 font-mono tracking-wider uppercase mb-2">Set reminder time</p>
                        <div class="flex items-center gap-2">
                          <select id="edit-hour" class="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-accent/40" style="-webkit-appearance:none;background-image:none;">
                            ${Array.from({ length: 24 }, (_, i) => `<option value="${i}" ${i === item.hour ? 'selected' : ''} style="background:#1a1a1a;color:#fafafa">${pad2(i)}</option>`).join('')}
                          </select>
                          <span class="text-white/30 font-mono text-lg font-bold">:</span>
                          <select id="edit-min" class="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-accent/40" style="-webkit-appearance:none;background-image:none;">
                            ${[0,5,10,15,20,25,30,35,40,45,50,55].map((m) => `<option value="${m}" ${m === item.minute ? 'selected' : ''} style="background:#1a1a1a;color:#fafafa">${pad2(m)}</option>`).join('')}
                          </select>
                          <button onclick="app.saveEditTime('${item.id}')"
                            class="ml-auto px-4 py-2.5 rounded-lg bg-accent/15 border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/25 transition-all active:scale-95">
                            Save
                          </button>
                          <button onclick="app.cancelEditTime()"
                            class="px-3 py-2.5 rounded-lg text-white/30 text-xs hover:text-white/50 transition-all">
                            ✕
                          </button>
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <div class="mt-2 flex-shrink-0">
                    ${isActive ? '<span class="block w-2 h-2 rounded-full bg-accent animate-pulse"></span>' : ''}
                    ${isPast && !done ? '<span class="text-[10px] text-red-400/60 font-mono">MISSED</span>' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-8 space-y-2">
          <button onclick="app.resetDay()" class="w-full py-2.5 text-xs text-white/20 hover:text-white/40 transition-colors tracking-widest uppercase">Reset Protocol</button>
          <button onclick="app.resetTimes()" class="w-full py-2 text-xs text-white/15 hover:text-white/30 transition-colors tracking-widest uppercase">Reset Times to Default</button>
        </div>
      </div>
    `;

    $('#main-content').innerHTML = html;
  }

  // ── RENDER: THE FORGE ────────────────────────────────────
  function renderForge() {
    const day = getGymDay();
    const protocol = GYM_PROTOCOLS[day];

    let html = `
      <div class="px-5 pt-2 pb-4">
        <div class="mb-6">
          <p class="text-xs tracking-[0.3em] uppercase text-white/30 mb-1">The Forge</p>
          <h1 class="text-2xl font-bold tracking-tight">Gym Protocol</h1>
        </div>

        <div class="flex gap-2 mb-6">
          <button onclick="app.switchGymDay('A')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${day === 'A'
              ? 'bg-accent/15 border border-accent/30 text-accent'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'}">Day A</button>
          <button onclick="app.switchGymDay('B')"
            class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${day === 'B'
              ? 'bg-accent/15 border border-accent/30 text-accent'
              : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'}">Day B</button>
        </div>

        <div class="mb-5 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <p class="text-xs text-accent/70 font-mono tracking-wider uppercase mb-1">${protocol.codename}</p>
          <p class="text-lg font-bold">${protocol.name}</p>
          <p class="text-xs text-white/30 mt-1">${protocol.exercises.length} movements · Scoliosis-safe</p>
        </div>

        <div class="space-y-3">
          ${protocol.exercises.map((ex, i) => {
            const svg = EXERCISE_SVG[ex.name] || '';
            return `
              <div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.12]">
                <div class="h-36 bg-gradient-to-br from-white/[0.01] to-transparent flex items-center justify-center border-b border-white/[0.04] px-6 py-3">
                  ${svg || '<p class="text-[10px] text-white/15 font-mono tracking-wider">ILLUSTRATION</p>'}
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
            `;
          }).join('')}
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
        <div class="mb-6">
          <p class="text-xs tracking-[0.3em] uppercase text-white/30 mb-1">The Lab</p>
          <h1 class="text-2xl font-bold tracking-tight">Data Logging</h1>
        </div>

        <div class="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-6">
          <p class="text-xs text-accent/70 font-mono tracking-wider uppercase mb-4">Log Entry · ${todayKey()}</p>
          <div class="space-y-4">
            ${LAB_METRICS.map((m) => {
              const todayEntry = data.find((d) => d.date === todayKey());
              const val = todayEntry ? todayEntry[m.id] || '' : '';
              return `
                <div>
                  <div class="flex items-baseline justify-between mb-2">
                    <label class="text-sm font-semibold">${m.label}</label>
                    <span class="text-[10px] font-mono text-white/25">Target: ${m.target}${m.unit}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <input type="number" id="input-${m.id}" value="${val}"
                      min="${m.min}" max="${m.max}" step="${m.step}" placeholder="—"
                      class="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono
                        text-white placeholder-white/20 focus:outline-none focus:border-accent/40 focus:bg-white/[0.06]
                        transition-all duration-300 appearance-none" />
                    <span class="text-xs text-white/30 font-mono w-8">${m.unit}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button onclick="app.saveLabEntry()"
            class="w-full mt-5 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent
              text-sm font-semibold hover:bg-accent/25 transition-all duration-300 active:scale-[0.98]">Save Entry</button>
        </div>

        ${last7.length > 0 ? `
          <div class="space-y-5">
            ${LAB_METRICS.map((m) => {
              const values = last7.map((d) => d[m.id]).filter((v) => v !== undefined && v !== null);
              if (values.length === 0) return '';
              const maxVal = m.max, minVal = m.min, range = maxVal - minVal;
              const latest = values[values.length - 1];
              const isInverted = m.id === 'eczema' || m.id === 'back';
              return `
                <div class="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div class="flex items-baseline justify-between mb-3">
                    <p class="text-sm font-semibold">${m.label}</p>
                    <p class="text-lg font-bold font-mono">${latest}<span class="text-xs text-white/30 ml-0.5">${m.unit}</span></p>
                  </div>
                  <div class="flex items-end gap-1 h-16 mb-1">
                    ${last7.map((d) => {
                      const v = d[m.id];
                      if (v === undefined || v === null) return '<div class="flex-1 h-full flex items-end"><div class="w-full h-1 bg-white/5 rounded-sm"></div></div>';
                      const pct = Math.max(4, ((v - minVal) / range) * 100);
                      const isGood = isInverted ? v <= m.target : v >= m.target;
                      return '<div class="flex-1 h-full flex items-end"><div class="w-full rounded-sm transition-all duration-500 ' + (isGood ? 'bg-accent/60' : 'bg-white/15') + '" style="height:' + pct + '%"></div></div>';
                    }).join('')}
                  </div>
                  <div class="flex gap-1">
                    ${last7.map((d) => '<div class="flex-1 text-center"><span class="text-[8px] font-mono text-white/15">' + d.date.slice(8) + '</span></div>').join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button onclick="app.clearLabData()" class="mt-6 w-full py-2.5 text-xs text-white/15 hover:text-white/30 transition-colors tracking-widest uppercase">Clear All Data</button>
        ` : '<div class="text-center py-12"><p class="text-white/15 text-sm">No data logged yet</p><p class="text-white/10 text-xs mt-1">Begin tracking to see your trends</p></div>'}
      </div>
    `;

    $('#main-content').innerHTML = html;
  }

  // ── VIEW ROUTER ──────────────────────────────────────────
  function switchView(view) {
    currentView = view;
    editingTimeId = null;
    $$('.nav-btn').forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('text-accent', isActive);
      btn.classList.toggle('text-white/30', !isActive);
    });
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
    if (checked.includes(id)) { checked = checked.filter((c) => c !== id); }
    else { checked.push(id); if (navigator.vibrate) navigator.vibrate(30); }
    setChecked(checked);
    renderStack();
    scheduleNotifications();
  }

  function resetDay() {
    localStorage.removeItem(`bp_checked_${todayKey()}`);
    renderStack();
    scheduleNotifications();
    showToast('Protocol reset');
  }

  function startEditTime(id) {
    editingTimeId = (editingTimeId === id) ? null : id;
    renderStack();
    setTimeout(() => {
      const el = $('#edit-hour');
      if (el) el.closest('div[class*="border-accent"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function saveEditTime(id) {
    const hourEl = $('#edit-hour');
    const minEl = $('#edit-min');
    if (!hourEl || !minEl) return;
    const hour = parseInt(hourEl.value, 10);
    const minute = parseInt(minEl.value, 10);
    saveTimeOverride(id, hour, minute);
    editingTimeId = null;
    renderStack();
    scheduleNotifications();
    showToast(`Reminder set to ${formatTime(hour, minute)}`);
  }

  function cancelEditTime() {
    editingTimeId = null;
    renderStack();
  }

  function resetTimes() {
    if (confirm('Reset all reminder times to defaults?')) {
      resetAllTimes();
      renderStack();
      scheduleNotifications();
      showToast('Times reset to default');
    }
  }

  function switchGymDay(day) { setGymDay(day); renderForge(); }

  function saveLabEntry() {
    const entry = { date: todayKey() };
    let hasData = false;
    LAB_METRICS.forEach((m) => {
      const input = $(`#input-${m.id}`);
      if (input && input.value !== '') { entry[m.id] = parseFloat(input.value); hasData = true; }
    });
    if (!hasData) { showToast('Enter at least one metric'); return; }
    let data = getLabData();
    const idx = data.findIndex((d) => d.date === todayKey());
    if (idx >= 0) { data[idx] = { ...data[idx], ...entry }; } else { data.push(entry); }
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

  // ── SERVICE WORKER ───────────────────────────────────────
  async function registerSW() {
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('sw.js'); }
      catch (err) { console.warn('SW registration failed:', err); }
    }
  }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    registerSW();
    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    switchView('stack');
    if ('Notification' in window && Notification.permission === 'granted') { scheduleNotifications(); }
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0);
    setTimeout(() => { scheduleNotifications(); renderStack(); }, midnight.getTime() - now.getTime());
  }

  // ── PUBLIC API ───────────────────────────────────────────
  window.app = {
    toggleCheck, resetDay, resetTimes, switchGymDay,
    saveLabEntry, clearLabData,
    requestNotifications: requestNotificationPermission,
    switchView, startEditTime, saveEditTime, cancelEditTime
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
