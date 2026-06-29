// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Pin the Nitro target to Vercel for external deploys. Inside a Lovable build
  // the preset is force-set to Cloudflare, so this override only applies when you
  // run `vite build` on Vercel — the Lovable preview/publish flow is unaffected.
  // Nitro's Vercel preset emits the Build Output API folder at `.vercel/output`,
  // which Vercel picks up automatically (no output dir setting needed).
  nitro: { preset: "vercel" },
});
