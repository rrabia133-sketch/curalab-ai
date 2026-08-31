/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    500: "#6366f1",
                    600: "#4f46e5",
                    700: "#4338ca",
                },
                clinical: {
                    normal: "#10b981", // Emerald Green for normal range
                    warning: "#f59e0b", // Amber for borderline
                    danger: "#ef4444",  // Crimson Red for high/low out-of-range
                }
            }
        },
    },
    plugins: [],
}