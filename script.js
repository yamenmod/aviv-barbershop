const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const languageMenu = document.querySelector('.language-menu');
const languageTrigger = document.querySelector('.language-trigger');
const languageOptions = document.querySelector('.language-options');
const languages = { he: { file: 'he', flag: '🇮🇱' }, en: { file: 'en', flag: '🇬🇧' }, ru: { file: 'ru', flag: '🇷🇺' } };
let activeLocale;
let priceConfig;

menuToggle?.addEventListener('click', () => {
  mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', mainNav.classList.contains('open'));
});
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => mainNav.classList.remove('open')));

Object.entries(languages).forEach(([code, language]) => {
  const option = document.createElement('button');
  option.type = 'button';
  option.role = 'menuitem';
  option.dataset.locale = code;
  option.innerHTML = `<span>${language.flag}</span> ${code === 'he' ? 'עברית' : code === 'en' ? 'English' : 'Русский'}`;
  option.addEventListener('click', () => setLocale(code));
  languageOptions.appendChild(option);
});
languageTrigger?.addEventListener('click', () => {
  const open = languageMenu.classList.toggle('open');
  languageTrigger.setAttribute('aria-expanded', open);
});

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function getValue(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

function renderPrices() {
  ['men', 'women'].forEach((category) => {
    const list = document.querySelector(`[data-price-list="${category}"]`);
    list.innerHTML = priceConfig[category].map((item) => `<div class="price-row"><span>${getValue(activeLocale, `prices.${item.key}`)}</span><strong>${item.price}</strong></div>`).join('');
  });
}

const hoursSchedule = [
  { key: 'sun', day: 0, open: '08:30', close: '19:00' },
  { key: 'mon', day: 1, closed: true },
  { key: 'tue', day: 2, open: '08:30', close: '19:00' },
  { key: 'wed', day: 3, open: '08:30', close: '16:00' },
  { key: 'thu', day: 4, open: '08:30', close: '19:00' },
  { key: 'fri', day: 5, open: '08:00', close: '15:30' },
  { key: 'sat', day: 6, closed: true }
];

function renderHours() {
  const list = document.querySelector('[data-hours-list]');
  const status = document.querySelector('[data-hours-status]');
  if (!list || !activeLocale) return;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((part) => part.type === 'weekday').value);
  const currentMinutes = Number(parts.find((part) => part.type === 'hour').value) * 60 + Number(parts.find((part) => part.type === 'minute').value);
  const current = hoursSchedule.find((item) => item.day === weekday);
  const isOpen = current && !current.closed && currentMinutes >= toMinutes(current.open) && currentMinutes < toMinutes(current.close);
  status.textContent = isOpen ? activeLocale.hours.statusOpen : activeLocale.hours.statusClosed;
  status.parentElement.classList.toggle('is-closed', !isOpen);
  list.innerHTML = hoursSchedule.map((item) => `<div class="hours-row${item.day === weekday ? ' is-today' : ''}"><span>${activeLocale.hours.days[item.key]}</span><strong>${item.closed ? '—' : `${item.open}–${item.close}`}</strong></div>`).join('');
}

function toMinutes(value) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function setLocale(code) {
  const locale = window.localeCache[code];
  if (!locale) return;
  activeLocale = locale;
  document.documentElement.lang = code;
  document.documentElement.dir = locale.dir;
  document.body.classList.toggle('is-ltr', locale.dir === 'ltr');
  const pageTitles = { he: 'מספרת אביב | סטודיו לשיער בחיפה', en: 'Aviv Barbershop | Hair Studio in Haifa', ru: 'Aviv Barbershop | Студия волос в Хайфе' };
  const pageDescriptions = { he: 'מספרת אביב — סטודיו פרימיום לשיער ולטיפוח בחיפה. התקשרו לקביעת תור: 04-810-7534.', en: 'Aviv Barbershop — a premium hair studio in Haifa. Call to book: +972 4-810-7534.', ru: 'Aviv Barbershop — премиальная студия волос в Хайфе. Позвоните для записи: +972 4-810-7534.' };
  document.title = pageTitles[code];
  document.querySelector('meta[name="description"]').setAttribute('content', pageDescriptions[code]);
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = getValue(locale, element.dataset.i18n);
    if (value) element.innerHTML = element.classList.contains('button') ? `${value} <span>↗</span>` : value;
  });
  document.querySelector('.language-flag').textContent = languages[code].flag;
  document.querySelector('.language-name').textContent = locale.name;
  languageMenu.classList.remove('open');
  languageTrigger.setAttribute('aria-expanded', 'false');
  renderPrices();
  renderHours();
}

window.localeCache = {};
Promise.all(Object.entries(languages).map(async ([code, language]) => {
  window.localeCache[code] = await loadJson(`locales/${language.file}.json`);
})).then(async () => {
  priceConfig = await loadJson('config/prices.json');
  localStorage.removeItem('aviv-locale');
  setLocale('he');
}).catch((error) => console.error('Localization failed to load.', error));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('.price-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.price-tab').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.price-list').forEach((list) => list.classList.remove('active'));
  tab.classList.add('active');
  document.querySelector(`[data-price-list="${tab.dataset.priceTab}"]`).classList.add('active');
}));

if (!reducedMotion && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 1.1 } })
    .to('.hero-media', { scale: 1.18, xPercent: -3, yPercent: -2, ease: 'none', duration: 1 }, 0)
    .to('.hero-content h1, .hero-content .hero-subtitle', { opacity: 0, y: -24, ease: 'power2.inOut', duration: .28 }, .3)
    .to('.scroll-cue', { opacity: 0, duration: .18 }, .3);
}
window.addEventListener('load', () => window.ScrollTrigger?.refresh());
setInterval(renderHours, 60000);
