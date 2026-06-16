import type { Config } from "tailwindcss";

// 暗黑诗意墓园基调(PRD §8):深黑/暗蓝黑底 + 幽灵蓝/雾绿/暖白点缀
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        grave: {
          bg: "#0a0c12",
          panel: "#121622",
          border: "#222838",
          ghost: "#7fb8d6",
          moss: "#8fcab0",
          warm: "#e8e4d8",
          rebirth: "#c9a8ff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
