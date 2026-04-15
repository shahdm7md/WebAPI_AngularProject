/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "primary":                   "#030813",
        "on-primary":                "#ffffff",
        "primary-container":         "#1a202c",
        "secondary":                 "#006a68",
        "on-secondary":              "#ffffff",
        "secondary-container":       "#91f0ed",
        "on-secondary-container":    "#006e6d",
        "surface":                   "#f9f9ff",
        "on-surface":                "#161c27",
        "on-surface-variant":        "#45474c",
        "surface-container-lowest":  "#ffffff",
        "surface-container-low":     "#f1f3ff",
        "surface-container":         "#e8eeff",
        "surface-container-high":    "#e3e8f9",
        "surface-container-highest": "#dde2f3",
        "outline-variant":           "#c6c6cc",
        "outline":                   "#76777c",
        "error":                     "#ba1a1a",
        "on-error":                  "#ffffff",
      }
    }
  },
  plugins: []
}