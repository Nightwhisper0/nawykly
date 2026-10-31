/* ============================================================
   Nawykly — prototyp przypominania o nawykach (Vue 3, global build)
   ============================================================ */

const { createApp } = Vue;

const STORAGE_KEY = 'nawykly.habits.v1';

/* Kolejność dni w interfejsie: poniedziałek → niedziela (indeksy JS: 0 = niedziela) */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const DAY_FULL = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

const EMOJIS = ['🧘', '💧', '📚', '🏋️', '🗣️', '🚶', '🥗', '😴', '✍️', '🧹', '💊', '🎸', '🌿', '☀️', '💻', '🦷', '🏃', '🎨', '🙏', '🚭'];
const COLORS = ['#8b5cf6', '#6366f1', '#38bdf8', '#10b981', '#34d399', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#14b8a6'];

/* ---------- pomocnicze ---------- */

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/* ---------- dane startowe (demo) ---------- */

function seedHabits() {
  const defs = [
    { name: 'Poranna medytacja', emoji: '🧘', color: '#8b5cf6', reminderTime: '07:00', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 12 },
    { name: 'Szklanka wody po przebudzeniu', emoji: '💧', color: '#38bdf8', reminderTime: '07:15', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 8 },
    { name: 'Czytanie 30 minut', emoji: '📚', color: '#f59e0b', reminderTime: '21:00', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 5 },
    { name: 'Trening', emoji: '🏋️', color: '#ef4444', reminderTime: '18:00', days: [1, 3, 5], seedStreak: 4 },
    { name: 'Nauka angielskiego', emoji: '🗣️', color: '#10b981', reminderTime: '20:00', days: [1, 2, 3, 4, 5], seedStreak: 6 },
    { name: 'Wieczorny spacer', emoji: '🚶', color: '#f97316', reminderTime: '19:30', days: [0, 2, 4, 6], seedStreak: 3 },
  ];

  const now = new Date();
  return defs.map((def) => {
    const completions = {};
    let filled = 0;
    const d = new Date(now);
    d.setDate(d.getDate() - 1); // zaczynamy od wczoraj — dziś zostaje do zrobienia
    let guard = 0;
    while (filled < def.seedStreak && guard < 400) {
      if (def.days.includes(d.getDay())) {
        completions[dateKey(d)] = true;
        filled++;
      }
      d.setDate(d.getDate() - 1);
      guard++;
    }
    return {
      id: uid(),
      name: def.name,
      emoji: def.emoji,
      color: def.color,
      reminderTime: def.reminderTime,
      days: [...def.days],
      completions,
      archived: false,
      createdAt: new Date().toISOString(),
    };
  });
}

/* ---------- aplikacja ---------- */

createApp({
  data() {
    return {
      currentView: 'today',
      views: [
        { id: 'today', label: 'Dzisiaj', icon: '☀️' },
        { id: 'habits', label: 'Nawyki', icon: '🎯' },
        { id: 'history', label: 'Historia', icon: '📈' },
      ],
      habits: loadHabits(),
      notificationsEnabled: false,
      showModal: false,
      editingId: null,
      deleteArmed: null,
      toasts: [],
      reminded: {},
      form: emptyForm(),
      DAY_ORDER,
      DAY_SHORT,
      emojis: EMOJIS,
      colors: COLORS,
      reminderTimer: null,
    };
  },

  computed: {
    currentViewTitle() {
      const v = this.views.find((v) => v.id === this.currentView);
      return v ? v.label : 'Nawykly';
    },

    greeting() {
      const h = new Date().getHours();
      if (h >= 5 && h < 17) return 'Dzień dobry';
      if (h >= 17 && h < 22) return 'Dobry wieczór';
      return 'Dobry wieczór';
    },

    shortDate() {
      return new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    todayLabel() {
      return new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },

    todayKey() {
      return dateKey(new Date());
    },

    todayHabits() {
      const today = new Date().getDay();
      return this.habits.filter((h) => !h.archived && h.days.includes(today));
    },

    completedTodayCount() {
      return this.todayHabits.filter((h) => h.completions[this.todayKey]).length;
    },

    todayProgress() {
      const n = this.todayHabits.length;
      return n === 0 ? 0 : Math.round((this.completedTodayCount / n) * 100);
    },

    ringStyle() {
      return {
        '--p': `${this.todayProgress * 3.6}deg`,
      };
    },

    totalCompletions() {
      return this.habits.reduce((sum, h) => sum + Object.keys(h.completions).length, 0);
    },

    bestStreak() {
      return this.habits.reduce((max, h) => Math.max(max, this.streakOf(h)), 0);
    },

    weekStats() {
      const arr = [];
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const todayK = this.todayKey;
      for (let i = 0; i < 7; i++) {
        const k = dateKey(d);
        let count = 0;
        this.habits.forEach((h) => {
          if (h.completions[k]) count++;
        });
        arr.push({
          label: DAY_SHORT[d.getDay()],
          count,
          pct: 0,
          isToday: k === todayK,
        });
        d.setDate(d.getDate() + 1);
      }
      const max = Math.max(...arr.map((a) => a.count), 1);
      arr.forEach((a) => { a.pct = Math.round((a.count / max) * 100); });
      return arr;
    },

    heatmapDays() {
      const days = [];
      const d = new Date();
      d.setDate(d.getDate() - 69);
      for (let i = 0; i < 70; i++) {
        const k = dateKey(d);
        let count = 0;
        this.habits.forEach((h) => {
          if (h.completions[k]) count++;
        });
        days.push({
          key: k,
          label: `${d.getDate()}.${d.getMonth() + 1}`,
          count,
        });
        d.setDate(d.getDate() + 1);
      }
      return days;
    },
  },

  watch: {
    habits: {
      deep: true,
      handler(val) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      },
    },
  },

  mounted() {
    this.checkReminders();
    this.reminderTimer = setInterval(this.checkReminders, 20000);
  },

  beforeUnmount() {
    clearInterval(this.reminderTimer);
  },

  methods: {
    /* ---------- nawyki: CRUD ---------- */

    openNewHabit() {
      this.editingId = null;
      this.form = emptyForm();
      this.showModal = true;
    },

    openEdit(habit) {
      this.editingId = habit.id;
      this.form = {
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        reminderTime: habit.reminderTime || '',
        days: [...habit.days],
      };
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingId = null;
    },

    toggleDay(d) {
      const i = this.form.days.indexOf(d);
      if (i >= 0) this.form.days.splice(i, 1);
      else this.form.days.push(d);
    },

    saveHabit() {
      const name = this.form.name.trim();
      if (!name) return;

      let days = [...this.form.days];
      if (!days.length) days = [0, 1, 2, 3, 4, 5, 6];

      const payload = {
        name,
        emoji: this.form.emoji || '🌱',
        color: this.form.color || '#8b5cf6',
        reminderTime: this.form.reminderTime || null,
        days,
      };

      if (this.editingId) {
        const h = this.habits.find((x) => x.id === this.editingId);
        if (h) Object.assign(h, payload);
      } else {
        this.habits.push({
          id: uid(),
          ...payload,
          completions: {},
          archived: false,
          createdAt: new Date().toISOString(),
        });
      }
      this.closeModal();
    },

    confirmDelete(id) {
      if (this.deleteArmed === id) {
        this.habits = this.habits.filter((h) => h.id !== id);
        this.deleteArmed = null;
        return;
      }
      this.deleteArmed = id;
      setTimeout(() => {
        if (this.deleteArmed === id) this.deleteArmed = null;
      }, 3000);
    },

    /* ---------- wykonanie nawyku ---------- */

    isDoneToday(habit) {
      return !!habit.completions[this.todayKey];
    },

    toggleDone(habit) {
      const k = this.todayKey;
      if (habit.completions[k]) {
        delete habit.completions[k];
      } else {
        habit.completions[k] = true;
        delete this.reminded[`${habit.id}_${k}`];
      }
    },

    completeFromToast(toast) {
      const habit = this.habits.find((h) => h.id === toast.habit.id);
      if (habit && !habit.completions[this.todayKey]) {
        habit.completions[this.todayKey] = true;
      }
      this.dismissToast(toast.id);
    },

    /* ---------- statystyki ---------- */

    streakOf(habit) {
      let streak = 0;
      const d = new Date();
      if (habit.days.includes(d.getDay()) && !habit.completions[dateKey(d)]) {
        d.setDate(d.getDate() - 1);
      }
      let guard = 0;
      while (guard < 5000) {
        if (habit.days.includes(d.getDay())) {
          if (habit.completions[dateKey(d)]) streak++;
          else break;
        }
        d.setDate(d.getDate() - 1);
        guard++;
      }
      return streak;
    },

    completionCount(habit) {
      return Object.keys(habit.completions).length;
    },

    scheduleLabel(habit) {
      if (habit.days.length === 7) return 'Codziennie';
      if (!habit.days.length) return 'Bez dni';
      return habit.days
        .slice()
        .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
        .map((d) => DAY_SHORT[d])
        .join(', ');
    },

    levelClass(count) {
      if (count >= 3) return 'lvl3';
      if (count === 2) return 'lvl2';
      if (count === 1) return 'lvl1';
      return 'lvl0';
    },

    heatTitle(d) {
      if (d.count === 1) return `${d.label} — 1 nawyk`;
      if (d.count >= 2 && d.count <= 4) return `${d.label} — ${d.count} nawyki`;
      return `${d.label} — ${d.count} nawyków`;
    },

    barHeight(w) {
      return w.count ? `${Math.max(8, w.pct)}%` : '4%';
    },

    /* ---------- przypomnienia ---------- */

    checkReminders() {
      const now = new Date();
      const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const k = this.todayKey;
      const dow = now.getDay();

      this.habits.forEach((h) => {
        if (!h.reminderTime || h.archived) return;
        if (!h.days.includes(dow)) return;
        if (h.completions[k]) return;
        if (h.reminderTime !== hm) return;

        const key = `${h.id}_${k}`;
        if (this.reminded[key]) return;
        this.reminded[key] = true;
        this.showReminder(h);
      });
    },

    showReminder(habit) {
      const toast = { id: uid(), habit };
      this.toasts.push(toast);
      setTimeout(() => this.dismissToast(toast.id), 10000);

      if (this.notificationsEnabled && 'Notification' in window) {
        try {
          new Notification('⏰ Czas na nawyk!', {
            body: `${habit.emoji} ${habit.name}`,
            tag: `nawykly-${habit.id}`,
          });
        } catch (e) {
          /* powiadomienia systemowe niedostępne */
        }
      }
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    toggleNotifications() {
      if (!('Notification' in window)) {
        alert('Twoja przeglądarka nie obsługuje powiadomień systemowych.');
        return;
      }
      if (this.notificationsEnabled) {
        this.notificationsEnabled = false;
        return;
      }
      Notification.requestPermission().then((perm) => {
        this.notificationsEnabled = perm === 'granted';
        if (perm !== 'granted') {
          alert('Nie udzielono zgody na powiadomienia. Możesz ją zmienić w ustawieniach przeglądarki.');
        }
      });
    },
  },
}).mount('#app');

/* ---------- pomocnicze funkcje (poza instancją Vue) ---------- */

function emptyForm() {
  return {
    name: '',
    emoji: '🌱',
    color: '#8b5cf6',
    reminderTime: '',
    days: [0, 1, 2, 3, 4, 5, 6],
  };
}

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {
    /* uszkodzone dane — generujemy demo */
  }
  return seedHabits();
}
