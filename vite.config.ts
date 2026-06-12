import path from "path"
import { execSync } from "child_process"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Capture the current commit (short hash + committer date) at build time so the
// running app can show exactly which build it is. Falls back gracefully if git
// is unavailable (e.g. a source tarball build).
function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// CI (the Docker build) has no .git in context — it's dockerignored — so the
// workflow passes COMMIT_HASH/COMMIT_DATE as build args. Prefer those; fall
// back to reading git directly for local builds.
const commitHash = process.env.COMMIT_HASH || git('rev-parse --short HEAD')
const commitDate = process.env.COMMIT_DATE || git('log -1 --format=%cI') // ISO 8601 with offset

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_DATE__: JSON.stringify(commitDate),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
