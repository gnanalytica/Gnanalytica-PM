import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        border: {
          subtle: "var(--border-subtle)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        sidebar: "var(--bg-sidebar)",
        active: "var(--bg-active)",
        accent: {
          DEFAULT: "var(--accent-blue)",
          soft: "var(--accent-blue-soft)",
        },
      },
      backgroundColor: {
        hover: "var(--hover-bg)",
      },
      fontSize: {
        '13': ['13px', '20px'],
      },
    },
  },
  plugins: [],
};
export default config;
