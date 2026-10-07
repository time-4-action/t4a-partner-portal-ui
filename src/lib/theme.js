/**
 * Theme constants shared by the root layout (server) and the client theme
 * provider. Mirrors t4a-admin so both apps behave identically:
 *
 * - `localStorage["theme"]` holds "light" | "dark" | "system" (default system)
 * - the resolved theme is the `.dark` class on <html> (Tailwind `dark:` variant
 *   + the token overrides in globals.css)
 */

export const THEME_STORAGE_KEY = "theme";

/**
 * Inline before-paint script: applies the .dark class on <html> based on the
 * persisted choice, falling back to the OS preference. Must run before React
 * hydrates to prevent a flash of the wrong theme on first load.
 */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
