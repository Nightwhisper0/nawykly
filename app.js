/* ============================================================
   Nawykly — prototyp przypominania o nawykach (Vue 3, global build)
   ============================================================ */

const { createApp } = Vue;

const STORAGE_KEY = 'nawykly.habits.v2';
const NOTIFICATIONS_KEY = 'nawykly.notifications.v1';
const USER_KEY = 'nawykly.user.v1';
const FRIENDS_KEY = 'nawykly.friends.v1';
const PALETTE_VERSION_KEY = 'nawykly.palette.v2';

/* Ciepła paleta bez zieleni: terakota, glina, umber, piasek, krem, taupe i czerń. */
const COLORS = ['#AD5228', '#7A4A2E', '#C97A4A', '#D8C7A5', '#E7DEC2', '#B9A78F', '#6B625A', '#211D17'];

/* Jednorazowa migracja domyślnych nawyków z poprzedniego, zielonego zestawu. */
const HABIT_PALETTE_BY_NAME = {
  'poranna medytacja': '#AD5228',
  'szklanka wody po przebudzeniu': '#D8C7A5',
  'czytanie przez 30 minut': '#211D17',
  'trening': '#7A4A2E',
  'angielski': '#E7DEC2',
  'wieczorny spacer': '#C97A4A',
};

const LEGACY_HABIT_COLORS = {
  '#0A2BD6': '#AD5228',
  '#F04A12': '#C97A4A',
  '#B8E52C': '#D8C7A5',
  '#A7B5A3': '#B9A78F',
  '#C9BCF5': '#E7DEC2',
  '#101010': '#211D17',
  '#6E6E68': '#6B625A',
  '#F7F6F0': '#E7DEC2',
  '#608775': '#D8C7A5',
  '#8A836B': '#7A4A2E',
  '#C9D1C2': '#E7DEC2',
  '#4F5D4E': '#6B625A',
  '#B5FF81': '#D8C7A5',
  '#5F9C31': '#7A4A2E',
  '#7FAF5A': '#B9A78F',
};

function colorForHabitName(name) {
  const source = String(name || 'nawyk');
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

function isGreenishColor(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value || '').trim());
  if (!match) return false;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.1) return false;

  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;

  return hue >= 60 && hue <= 175;
}

/* Czas trwania pojedynczej cząstki konfetti; steruje też czasem życia warstwy. */
const CONFETTI_DURATION_MS = 4000;

/* Kontekst audio tworzymy po pierwszej interakcji użytkownika (polityka autoplay przeglądarek). */
let audioCtx = null;
let audioUnlockHandler = null;

/* Kolejność dni w interfejsie: poniedziałek → niedziela (indeksy JS: 0 = niedziela) */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

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
    { name: 'Poranna medytacja', color: '#AD5228', reminderTime: '07:00', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 12 },
    { name: 'Szklanka wody po przebudzeniu', color: '#D8C7A5', reminderTime: '07:15', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 8 },
    { name: 'Czytanie przez 30 minut', color: '#211D17', reminderTime: '21:00', days: [0, 1, 2, 3, 4, 5, 6], seedStreak: 5 },
    { name: 'Trening', color: '#7A4A2E', reminderTime: '18:00', days: [1, 3, 5], seedStreak: 4 },
    { name: 'Angielski', color: '#E7DEC2', reminderTime: '20:00', days: [1, 2, 3, 4, 5], seedStreak: 6 },
    { name: 'Wieczorny spacer', color: '#C97A4A', reminderTime: '19:30', days: [0, 2, 4, 6], seedStreak: 3 },
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
        { id: 'today', label: 'Dzisiaj', num: '01' },
        { id: 'habits', label: 'Nawyki', num: '02' },
        { id: 'progress', label: 'Postępy', num: '03' },
        { id: 'friends', label: 'Znajomi', num: '04' },
      ],
      now: new Date(),
      habits: loadHabits(),
      friends: loadFriends(),
      user: loadUser(),
      notificationsEnabled: loadNotificationPreference(),
      notificationsSupported: 'Notification' in window,
      showModal: false,
      showAuthModal: false,
      authMode: 'login',
      authForm: emptyAuthForm(),
      authError: '',
      editingId: null,
      deleteArmed: null,
      toasts: [],
      reminded: {},
      confettiPieces: [],
      confettiTimer: null,
      form: emptyForm(),
      formError: '',
      newFriendName: '',
      newFriendHandle: '',
      friendNotice: '',
      challengeNotice: '',
      DAY_ORDER,
      DAY_SHORT,
      colors: COLORS,
      reminderTimer: null,
      clockTimer: null,
    };
  },

  computed: {
    greeting() {
      const h = this.now.getHours();
      if (h >= 5 && h < 17) return 'Dzień dobry';
      if (h >= 17 && h < 22) return 'Dobry wieczór';
      return 'Dobrej nocy';
    },

    shortDate() {
      return this.now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    todayKey() {
      return dateKey(this.now);
    },

    todayHabits() {
      const today = this.now.getDay();
      return this.habits.filter((h) => !h.archived && h.days.includes(today));
    },

    completedTodayCount() {
      return this.todayHabits.filter((h) => h.completions[this.todayKey]).length;
    },

    todayProgress() {
      const n = this.todayHabits.length;
      return n === 0 ? 0 : Math.round((this.completedTodayCount / n) * 100);
    },

    isTodayComplete() {
      return this.todayHabits.length > 0 && this.completedTodayCount === this.todayHabits.length;
    },

    displayName() {
      return this.user && this.user.name ? this.user.name : 'Ty';
    },

    userInitials() {
      if (!this.user || !this.user.name) return '';
      return this.user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    },

    myWeeklyProgress() {
      const d = new Date(this.now);
      let scheduled = 0;
      let done = 0;
      for (let i = 0; i < 7; i++) {
        const key = dateKey(d);
        this.habits.forEach((h) => {
          if (!h.archived && h.days.includes(d.getDay())) {
            scheduled++;
            if (h.completions[key]) done++;
          }
        });
        d.setDate(d.getDate() - 1);
      }
      return scheduled ? Math.round((done / scheduled) * 100) : 0;
    },

    friendBoard() {
      const rows = this.friends.map((friend) => ({ ...friend, isMe: false }));
      rows.push({
        id: 'me',
        name: this.displayName,
        handle: this.user && this.user.email ? `@${this.user.email.split('@')[0]}` : '@ty',
        color: '#AD5228',
        weeklyProgress: this.myWeeklyProgress,
        streak: this.bestStreak,
        trend: 0,
        challenged: false,
        isMe: true,
      });
      return rows
        .sort((a, b) => b.weeklyProgress - a.weeklyProgress || b.streak - a.streak)
        .map((row, index) => ({ ...row, rank: index + 1 }));
    },

    myRank() {
      const row = this.friendBoard.find((friend) => friend.isMe);
      return row ? row.rank : 0;
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
      const d = new Date(this.now);
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
      const d = new Date(this.now);
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
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
        } catch (e) {
          /* Zapisywanie może być zablokowane — aplikacja działa dalej w pamięci. */
        }
      },
    },
    friends: {
      deep: true,
      handler(val) {
        try {
          localStorage.setItem(FRIENDS_KEY, JSON.stringify(val));
        } catch (e) {
          /* jak wyżej */
        }
      },
    },
    isTodayComplete(value, previous) {
      if (value && !previous) this.launchConfetti();
    },
  },

  mounted() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'history') this.currentView = 'progress';
    else if (['today', 'habits', 'progress', 'friends'].includes(view)) this.currentView = view;
    if (params.get('modal') === '1') this.openNewHabit();
    if (params.get('auth') === '1') this.openAuth();

    this.setupAudioUnlock();
    this.checkReminders();
    this.reminderTimer = setInterval(this.checkReminders, 20000);
    this.clockTimer = setInterval(() => { this.now = new Date(); }, 30000);
  },

  beforeUnmount() {
    clearInterval(this.reminderTimer);
    clearInterval(this.clockTimer);
    clearTimeout(this.confettiTimer);
    if (audioUnlockHandler) {
      window.removeEventListener('pointerdown', audioUnlockHandler);
      window.removeEventListener('keydown', audioUnlockHandler);
      audioUnlockHandler = null;
    }
  },

  methods: {
    /* ---------- nawyki: CRUD ---------- */

    openNewHabit() {
      this.editingId = null;
      this.form = emptyForm();
      this.formError = '';
      this.showModal = true;
    },

    openEdit(habit) {
      this.editingId = habit.id;
      this.form = {
        name: habit.name,
        color: habit.color,
        reminderTime: habit.reminderTime || '',
        days: [...habit.days],
      };
      this.formError = '';
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingId = null;
      this.formError = '';
    },

    toggleDay(d) {
      const i = this.form.days.indexOf(d);
      if (i >= 0) this.form.days.splice(i, 1);
      else this.form.days.push(d);
    },

    saveHabit() {
      const name = this.form.name.trim();
      if (!name) {
        this.formError = 'Wpisz nazwę nawyku — coś, co chcesz robić regularnie.';
        return;
      }
      this.formError = '';

      let days = [...this.form.days];
      if (!days.length) days = [0, 1, 2, 3, 4, 5, 6];

      const payload = {
        name,
        color: this.form.color || '#AD5228',
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

    /* ---------- konto ---------- */

    openAuth() {
      this.authMode = 'login';
      this.authError = '';
      this.authForm = emptyAuthForm();
      if (this.user) {
        this.authForm.name = this.user.name || '';
        this.authForm.email = this.user.email || '';
      }
      this.showAuthModal = true;
    },

    closeAuth() {
      this.showAuthModal = false;
      this.authError = '';
      this.authForm = emptyAuthForm();
    },

    login() {
      const name = this.authForm.name.trim();
      const email = this.authForm.email.trim();
      const password = this.authForm.password;

      if (!name) {
        this.authError = 'Powiedz nam, jak mamy się do Ciebie zwracać.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.authError = 'Sprawdź adres e-mail — wygląda na niepełny.';
        return;
      }
      if (password.length < 4) {
        this.authError = 'Hasło musi mieć co najmniej 4 znaki.';
        return;
      }

      this.user = { name, email, provider: 'local' };
      persistUser(this.user);
      this.showAuthModal = false;
      this.authError = '';
      this.authForm = emptyAuthForm();
      this.friendNotice = `Cześć, ${name}. Twój krąg jest gotowy.`;
    },

    logout() {
      this.user = null;
      clearPersistedUser();
      this.showAuthModal = false;
      this.friendNotice = 'Wylogowano. Twoje nawyki zostały na tym urządzeniu.';
    },

    /* ---------- znajomi ---------- */

    addFriend() {
      const name = this.newFriendName.trim();
      if (!name) {
        this.friendNotice = 'Wpisz imię lub pseudonim osoby, którą chcesz dodać.';
        return;
      }

      const rawHandle = this.newFriendHandle.trim();
      const handle = rawHandle
        ? (rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`)
        : `@${name.toLowerCase().replace(/\s+/g, '')}`;

      if (this.friends.some((friend) => friend.handle.toLowerCase() === handle.toLowerCase())) {
        this.friendNotice = 'Ta osoba jest już w Twoim kręgu.';
        return;
      }

      this.friends.push({
        id: uid(),
        name,
        handle,
        color: COLORS[this.friends.length % COLORS.length],
        weeklyProgress: 0,
        streak: 0,
        trend: 0,
        challenged: false,
      });
      this.newFriendName = '';
      this.newFriendHandle = '';
      this.friendNotice = `${name} jest w Twoim kręgu. Gdy zaczniecie, zobaczycie swoje postępy.`;
    },

    challengeFriend(friend) {
      const target = this.friends.find((item) => item.id === friend.id);
      if (target) target.challenged = true;
      this.challengeNotice = `Wyzwanie gotowe. ${friend.name} jest w grze — teraz Twój krok.`;
    },

    /* ---------- drobne pomocnicze ---------- */

    initialOf(name) {
      const clean = String(name || '').trim();
      return clean ? clean.charAt(0).toUpperCase() : '·';
    },

    friendInitials(name) {
      const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return '?';
      return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
    },

    textOn(color) {
      const hex = String(color || '').replace('#', '');
      if (hex.length !== 6) return '#211D17';
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.62 ? '#211D17' : '#F8F2E5';
    },

    streakLabel(days) {
      return days === 1 ? '1 dzień' : `${days} dni`;
    },

    timesLabel(count) {
      return count === 1 ? '1 raz' : `${count} razy`;
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

    /* ---------- celebracja ukończenia dnia ---------- */

    launchConfetti() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const colors = COLORS;
      const count = window.innerWidth < 640 ? 200 : 300;
      const pieces = Array.from({ length: count }, (_, index) => {
        const width = 5 + Math.random() * 6;
        const height = 7 + Math.random() * 8;
        return {
          id: `${Date.now()}-${index}`,
          style: {
            '--x': `${(Math.random() * 100).toFixed(2)}%`,
            '--y': `${(Math.random() * 94).toFixed(2)}%`,
            '--w': `${width.toFixed(1)}px`,
            '--h': `${height.toFixed(1)}px`,
            '--c': colors[Math.floor(Math.random() * colors.length)],
            '--r': Math.random() > 0.5 ? '50%' : '2px',
            '--dur': `${CONFETTI_DURATION_MS / 1000}s`,
            '--delay': `${(Math.random() * 0.2).toFixed(2)}s`,
            '--drift': `${Math.round(-30 + Math.random() * 60)}px`,
            '--fall': `${Math.round(30 + Math.random() * 80)}px`,
            '--spin': `${Math.round(-120 + Math.random() * 240)}deg`,
            '--rot': `${Math.round(Math.random() * 360)}deg`,
          },
        };
      });

      this.confettiPieces = pieces;
      clearTimeout(this.confettiTimer);
      this.confettiTimer = setTimeout(() => {
        this.confettiPieces = [];
        this.confettiTimer = null;
      }, CONFETTI_DURATION_MS + 400);
    },

    /* ---------- statystyki ---------- */

    streakOf(habit) {
      let streak = 0;
      const d = new Date(this.now);
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
      const count = d.count;
      const last = count % 10;
      const lastTwo = count % 100;
      if (count === 1) return `${d.label} — 1 nawyk`;
      if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
        return `${d.label} — ${count} nawyki`;
      }
      return `${d.label} — ${count} nawyków`;
    },

    barHeight(w) {
      return w.count ? `${Math.max(8, w.pct)}%` : '4%';
    },

    /* ---------- przypomnienia ---------- */

    checkReminders() {
      const now = new Date();
      if (dateKey(now) !== this.todayKey) this.now = now;

      const k = dateKey(now);
      const dow = now.getDay();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      this.habits.forEach((h) => {
        if (!h.reminderTime || h.archived) return;
        if (!h.days.includes(dow)) return;
        if (h.completions[k]) return;

        const [hours, minutes] = h.reminderTime.split(':').map(Number);
        const due = hours * 60 + minutes;
        if (!Number.isFinite(due) || nowMinutes < due || nowMinutes - due > 2) return;

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

      // Powiadomienie systemowe jest kanałem głównym; toast pozostaje fallbackiem w aplikacji.
      if (this.notificationsEnabled) {
        this.playReminderSound();
        this.showSystemNotification(habit);
      }
    },

    showSystemNotification(habit) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return false;
      try {
        const notification = new Notification(
          'Czas na mały krok',
          {
            body: habit.name,
            tag: `nawykly-${habit.id}-${dateKey(new Date())}`,
            requireInteraction: true,
            silent: false,
          }
        );
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        return true;
      } catch (e) {
        return false;
      }
    },

    /* ---------- dźwięk przypomnienia (Web Audio, bez plików) ---------- */

    getAudioContext() {
      if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
        return audioCtx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
        return audioCtx;
      } catch (e) {
        return null;
      }
    },

    setupAudioUnlock() {
      if (audioUnlockHandler) return;
      audioUnlockHandler = () => {
        this.getAudioContext();
        window.removeEventListener('pointerdown', audioUnlockHandler);
        window.removeEventListener('keydown', audioUnlockHandler);
        audioUnlockHandler = null;
      };
      window.addEventListener('pointerdown', audioUnlockHandler);
      window.addEventListener('keydown', audioUnlockHandler);
    },

    playReminderSound() {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const play = () => {
        const start = ctx.currentTime + 0.03;
        [659.25, 880, 1174.66].forEach((freq, index) => {
          const at = start + index * 0.17;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, at);
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(at);
          osc.stop(at + 0.6);
        });
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(() => { });
      } else {
        play();
      }
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },

    toggleNotifications() {
      if (!('Notification' in window)) {
        alert('Twoja przeglądarka nie obsługuje powiadomień systemowych. Przypomnienia w aplikacji nadal będą działać.');
        return;
      }
      if (this.notificationsEnabled) {
        this.notificationsEnabled = false;
        saveNotificationPreference(false);
        return;
      }

      const enable = () => {
        this.notificationsEnabled = true;
        saveNotificationPreference(true);
        this.getAudioContext(); // odblokowanie audio w geście użytkownika
        this.playReminderSound();
      };

      if (Notification.permission === 'granted') {
        enable();
        return;
      }
      if (Notification.permission === 'denied') {
        alert('Powiadomienia są zablokowane w ustawieniach przeglądarki. Odblokuj je dla tej strony, jeśli chcesz dostawać przypomnienia.');
        return;
      }
      Notification.requestPermission()
        .then((perm) => {
          if (perm === 'granted') {
            enable();
          } else {
            alert('Nie udzielono zgody na powiadomienia. Możesz ją zmienić w ustawieniach przeglądarki.');
          }
        })
        .catch(() => {
          alert('Nie udało się poprosić o zgodę. Spróbuj ponownie za chwilę.');
        });
    },
  },
}).mount('#app');

/* ---------- pomocnicze funkcje (poza instancją Vue) ---------- */

function emptyForm() {
  return {
    name: '',
    color: '#AD5228',
    reminderTime: '',
    days: [0, 1, 2, 3, 4, 5, 6],
  };
}

function emptyAuthForm() {
  return {
    name: '',
    email: '',
    password: '',
  };
}

function normalizeHabit(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name.trim()) {
    return null;
  }

  const validDays = Array.isArray(raw.days)
    ? raw.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  const days = validDays.length ? [...new Set(validDays)] : [0, 1, 2, 3, 4, 5, 6];

  const completions = {};
  if (raw.completions && typeof raw.completions === 'object' && !Array.isArray(raw.completions)) {
    Object.keys(raw.completions).forEach((key) => {
      if (raw.completions[key]) completions[key] = true;
    });
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    name: raw.name.trim(),
    color: typeof raw.color === 'string' ? raw.color : '#AD5228',
    reminderTime: typeof raw.reminderTime === 'string' ? raw.reminderTime : null,
    days,
    completions,
    archived: !!raw.archived,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

function migrateHabitPalette(habits) {
  try {
    if (localStorage.getItem(PALETTE_VERSION_KEY) === '2') return habits;
  } catch (e) {
    return habits;
  }

  habits.forEach((habit) => {
    const nameKey = String(habit.name || '').trim().toLowerCase();
    const colorKey = String(habit.color || '').toUpperCase();
    if (Object.prototype.hasOwnProperty.call(HABIT_PALETTE_BY_NAME, nameKey)) {
      habit.color = HABIT_PALETTE_BY_NAME[nameKey];
    } else if (LEGACY_HABIT_COLORS[colorKey]) {
      habit.color = LEGACY_HABIT_COLORS[colorKey];
    } else if (isGreenishColor(habit.color)) {
      habit.color = colorForHabitName(habit.name || habit.id);
    }
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    localStorage.setItem(PALETTE_VERSION_KEY, '2');
  } catch (e) {
    /* Jeśli storage jest zablokowany, zostawiamy nawyki w nowej palecie bez zapisu wersji. */
  }

  return habits;
}

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return migrateHabitPalette(seedHabits());

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return migrateHabitPalette(seedHabits());

    const valid = parsed.map(normalizeHabit).filter(Boolean);
    if (parsed.length > 0 && valid.length === 0) return migrateHabitPalette(seedHabits());
    return migrateHabitPalette(valid);
  } catch (e) {
    return migrateHabitPalette(seedHabits());
  }
}

function seedFriends() {
  return [
    { id: 'f1', name: 'Marta', handle: '@marta', color: '#AD5228', weeklyProgress: 86, streak: 14, trend: 4, challenged: false },
    { id: 'f2', name: 'Kuba', handle: '@kuba', color: '#D8C7A5', weeklyProgress: 78, streak: 9, trend: 2, challenged: false },
    { id: 'f3', name: 'Ola', handle: '@ola', color: '#7A4A2E', weeklyProgress: 71, streak: 7, trend: -1, challenged: false },
    { id: 'f4', name: 'Tomek', handle: '@tomek', color: '#C97A4A', weeklyProgress: 64, streak: 5, trend: 3, challenged: false },
    { id: 'f5', name: 'Nina', handle: '@nina', color: '#B9A78F', weeklyProgress: 58, streak: 4, trend: 1, challenged: false },
  ];
}

function normalizeFriend(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name.trim()) {
    return null;
  }
  const progress = Number(raw.weeklyProgress);
  const streak = Number(raw.streak);
  const rawColor = typeof raw.color === 'string' ? raw.color : '#AD5228';
  const mappedColor = LEGACY_HABIT_COLORS[rawColor.toUpperCase()];
  const color = mappedColor || (isGreenishColor(rawColor) ? colorForHabitName(raw.name) : rawColor);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    name: raw.name.trim(),
    handle: typeof raw.handle === 'string' && raw.handle.trim() ? raw.handle.trim() : '@znajomy',
    color,
    weeklyProgress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0,
    streak: Number.isFinite(streak) ? Math.max(0, Math.round(streak)) : 0,
    trend: Number.isFinite(Number(raw.trend)) ? Math.round(Number(raw.trend)) : 0,
    challenged: !!raw.challenged,
  };
}

function loadFriends() {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (raw === null) return seedFriends();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return seedFriends();

    const valid = parsed.map(normalizeFriend).filter(Boolean);
    if (parsed.length > 0 && valid.length === 0) return seedFriends();
    return valid;
  } catch (e) {
    return seedFriends();
  }
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.name !== 'string' || !parsed.name.trim() || typeof parsed.email !== 'string') {
      return null;
    }
    return {
      name: parsed.name.trim(),
      email: parsed.email,
      provider: typeof parsed.provider === 'string' ? parsed.provider : 'local',
    };
  } catch (e) {
    return null;
  }
}

function persistUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    /* konto zostaje w pamięci sesji */
  }
}

function clearPersistedUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    /* nic się nie dzieje */
  }
}

function loadNotificationPreference() {
  try {
    return (
      localStorage.getItem(NOTIFICATIONS_KEY) === '1' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  } catch (e) {
    return false;
  }
}

function saveNotificationPreference(enabled) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, enabled ? '1' : '0');
  } catch (e) {
    /* localStorage może być niedostępny */
  }
}
