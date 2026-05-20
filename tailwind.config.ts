import type { Config } from "tailwindcss";

/**
 * Indispensable : sans cela, `dark:` reste lié à prefers-color-scheme
 * et le mode clair ne peut pas s’imposer sur un appareil en thème sombre.
 */
const config: Config = {
  darkMode: "class",
};

export default config;
