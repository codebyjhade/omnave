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
          canvas: "#0F0C1B",       // Deep indigo background
          surface: "#1A162B",      // Muted dark violet for cards
          surfaceHighlight: "#2A244A", // For active states/AI banners
          primary: "#7F22FE",      // Vibrant purple
          primaryHover: "#8B5CF6", // Lighter purple for glows
          success: "#34D399",      // Emerald green
          streak: "#F97316",       // Momentum orange
        }
      },
      backgroundImage: {
        'progress-gradient': 'linear-gradient(to right, #7F22FE, #FCA5A5)',
        'button-gradient': 'linear-gradient(to bottom, #8B5CF6, #7F22FE)',
      },
      boxShadow: {
        'premium-glass': '0 12px 30px rgba(0,0,0,0.4)',
        'premium-inner': 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
        'primary-glow': '0 0 20px rgba(127,34,254,0.6)',
      },
      borderRadius: {
        'bento': '28px', // The specific rounded corners for our main cards
      }
    },
  },
  plugins: [],
};
export default config;
