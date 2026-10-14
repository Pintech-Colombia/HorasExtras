import * as React from 'react';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const readSaved = () => {
  try {
    return localStorage.getItem('theme_mode') === 'dark';
  } catch {
    return false;
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = React.useState(readSaved);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    } catch {
      // almacenamiento bloqueado: el tema solo dura la sesión
    }
  }, [isDark]);

  const value = React.useMemo(() => ({ isDark, toggleTheme: () => setIsDark((v) => !v) }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
