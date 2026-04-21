import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This maps the "@" symbol to your "src" folder during the build
      "@": path.resolve(__dirname, "./src"),
    },
  },
})