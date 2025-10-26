// Tek tema denetleyici

const storageKey = 'theme-preference';

const getColorPreference = () => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const theme = { value: getColorPreference() };

const reflectPreference = () => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.value);

  const btn = document.querySelector('#theme-toggle');
  if (btn) {
    btn.setAttribute('aria-label', theme.value);
    btn.setAttribute('aria-pressed', String(theme.value === 'dark'));
    btn.title = `Theme: ${theme.value}`;
    // Güvence
    if (!btn.type) btn.type = 'button';
  }
};

const setPreference = () => {
  try { localStorage.setItem(storageKey, theme.value); } catch {}

  // Yalnızca renk geçişlerini anında yap (buton animasyonu hariç)
  const root = document.documentElement;
  root.classList.add('no-colors-transition');
  requestAnimationFrame(() => {
    reflectPreference();
    requestAnimationFrame(() => {
      root.classList.remove('no-colors-transition');
    });
  });
};

// Sayfa yüklenirken (ilk yansıtma – animasyonları kapatma yok)
reflectPreference();

// Butonu bağla
const btn = document.querySelector('#theme-toggle');
if (btn) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    setPreference();
  });
}

// Sistem temasını takip et
try {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = ({ matches }) => {
    theme.value = matches ? 'dark' : 'light';
    setPreference();
  };
  if (mql.addEventListener) mql.addEventListener('change', onChange);
  else mql.addListener(onChange);
} catch {}