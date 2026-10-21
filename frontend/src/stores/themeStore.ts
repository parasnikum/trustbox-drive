import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body?.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body?.classList.remove('dark');
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('trustbox_theme') || localStorage.getItem('cloudnest_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,
    setTheme: (newTheme: ThemeMode) => {
      localStorage.setItem('trustbox_theme', newTheme);
      applyThemeToDOM(newTheme);
      set({ theme: newTheme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const nextTheme = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('trustbox_theme', nextTheme);
      applyThemeToDOM(nextTheme);
      set({ theme: nextTheme });
    },
  };
});
