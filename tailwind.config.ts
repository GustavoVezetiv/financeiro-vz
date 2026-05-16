import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#121417",
          800: "#252932",
          600: "#515866",
        },
        mint: {
          600: "#0f9f7a",
          500: "#18b98f",
          100: "#dff8ef",
        },
        amberRisk: {
          500: "#c98408",
          100: "#fff3d6",
        },
        danger: {
          600: "#c24131",
          100: "#ffe2dd",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(18, 20, 23, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

