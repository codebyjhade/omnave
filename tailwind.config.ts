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
          canvas: "#0A0A0A",            // Premium neutral dark canvas
          surface: "#111111",           // Neutral dark bento cards
          surfaceSecondary: "#111111",  // Neutral dark bento cards
          surfaceHighlight: "#111111",  // Neutral dark bento cards
          border: "rgba(255, 255, 255, 0.06)",
          primary: "#7F22FE",           // Reserved strictly for primary accent actions
          primaryHover: "#6D1CD6",
          success: "#34D399",
          streak: "#F97316",
        }
      },
      boxShadow: {
        'elevation': '0 8px 40px rgba(0,0,0,0.35)',
        'premium-glass': '0 8px 40px rgba(0,0,0,0.35)',
        'premium-inner': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        'bento': '24px',
      }
    },
  },
  plugins: [],
};
export default config;
