import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        omnave: {
          // CSS-var driven — flips automatically between dark/light themes
          canvas: "var(--omnave-canvas)",
          surface: "var(--omnave-surface)",
          surfaceSecondary: "var(--omnave-surface-secondary)",

          // Primary accent stays the same in both themes
          primary: "#6949a8",
          primaryHover: "#563b8c",

          // Semantic tokens
          border: "var(--omnave-border)",
          success: "#00d047",
          streak: "#F97316",
        }
      },
      textColor: {
        "omnave-primary-text": "var(--omnave-text-primary)",
        "omnave-secondary-text": "var(--omnave-text-secondary)",
        "omnave-muted-text": "var(--omnave-text-muted)",
      },
      boxShadow: {
        // CSS-var driven shadows — lighter in light mode
        'premium-glass': 'var(--omnave-shadow-glass)',
        'premium-inner': 'var(--omnave-shadow-inner)',
        // Legacy aliases
        'elevation': 'var(--omnave-shadow-glass)',
      },
      borderRadius: {
        'bento': '15px',
      }
    },
  },
  plugins: [],
};
export default config;
