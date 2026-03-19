// vite.config.ts
import { defineConfig } from "file:///E:/work/apple/game/Bunker/node_modules/vite/dist/node/index.js";
import react from "file:///E:/work/apple/game/Bunker/node_modules/@vitejs/plugin-react/dist/index.js";
var spaFallbackHandler = (req, _res, next) => {
  if (req.url?.startsWith("/api") || req.url?.startsWith("/socket.io")) return next();
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const path = req.url?.split("?")[0] ?? "";
  if (path === "" || path === "/") return next();
  if (/\.[a-zA-Z0-9]+$/.test(path)) return next();
  if (path.startsWith("/@") || path.startsWith("/node_modules/")) return next();
  req.url = "/index.html";
  next();
};
function spaFallback() {
  return {
    name: "spa-fallback",
    configureServer(server) {
      server.middlewares.use(spaFallbackHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(spaFallbackHandler);
    }
  };
}
var vite_config_default = defineConfig({
  appType: "spa",
  plugins: [react(), spaFallback()],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true
      }
    }
  },
  preview: {
    port: 3e3
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFx3b3JrXFxcXGFwcGxlXFxcXGdhbWVcXFxcQnVua2VyXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFx3b3JrXFxcXGFwcGxlXFxcXGdhbWVcXFxcQnVua2VyXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi93b3JrL2FwcGxlL2dhbWUvQnVua2VyL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLyoqIFNQQSBmYWxsYmFjazogc2VydmUgaW5kZXguaHRtbCBmb3IgL3BsYXksIC9hZG1pbiwgZXRjLiBzbyBkaXJlY3QgbGlua3MgYW5kIHJlZnJlc2ggd29yayAoZGV2ICsgcHJldmlldykuICovXG5jb25zdCBzcGFGYWxsYmFja0hhbmRsZXIgPSAocmVxOiB7IHVybD86IHN0cmluZzsgbWV0aG9kPzogc3RyaW5nIH0sIF9yZXM6IHVua25vd24sIG5leHQ6ICgpID0+IHZvaWQpID0+IHtcbiAgaWYgKHJlcS51cmw/LnN0YXJ0c1dpdGgoJy9hcGknKSB8fCByZXEudXJsPy5zdGFydHNXaXRoKCcvc29ja2V0LmlvJykpIHJldHVybiBuZXh0KClcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdHRVQnICYmIHJlcS5tZXRob2QgIT09ICdIRUFEJykgcmV0dXJuIG5leHQoKVxuICBjb25zdCBwYXRoID0gcmVxLnVybD8uc3BsaXQoJz8nKVswXSA/PyAnJ1xuICBpZiAocGF0aCA9PT0gJycgfHwgcGF0aCA9PT0gJy8nKSByZXR1cm4gbmV4dCgpXG4gIGlmICgvXFwuW2EtekEtWjAtOV0rJC8udGVzdChwYXRoKSkgcmV0dXJuIG5leHQoKVxuICAvLyBEb24ndCByZXdyaXRlIFZpdGUgaW50ZXJuYWwgcGF0aHMgKEhNUiBjbGllbnQsIHJlYWN0LXJlZnJlc2gsIGV0Yy4pIG9yIHRoZXkgNDA0XG4gIGlmIChwYXRoLnN0YXJ0c1dpdGgoJy9AJykgfHwgcGF0aC5zdGFydHNXaXRoKCcvbm9kZV9tb2R1bGVzLycpKSByZXR1cm4gbmV4dCgpXG4gIHJlcS51cmwgPSAnL2luZGV4Lmh0bWwnXG4gIG5leHQoKVxufVxuXG5mdW5jdGlvbiBzcGFGYWxsYmFjaygpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc3BhLWZhbGxiYWNrJyxcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiB7IG1pZGRsZXdhcmVzOiB7IHVzZTogKGZuOiAocmVxOiB1bmtub3duLCByZXM6IHVua25vd24sIG5leHQ6ICgpID0+IHZvaWQpID0+IHZvaWQpID0+IHZvaWQgfSB9KSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKHNwYUZhbGxiYWNrSGFuZGxlciBhcyAocmVxOiB1bmtub3duLCByZXM6IHVua25vd24sIG5leHQ6ICgpID0+IHZvaWQpID0+IHZvaWQpXG4gICAgfSxcbiAgICBjb25maWd1cmVQcmV2aWV3U2VydmVyKHNlcnZlcjogeyBtaWRkbGV3YXJlczogeyB1c2U6IChmbjogKHJlcTogdW5rbm93biwgcmVzOiB1bmtub3duLCBuZXh0OiAoKSA9PiB2b2lkKSA9PiB2b2lkKSA9PiB2b2lkIH0gfSkge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShzcGFGYWxsYmFja0hhbmRsZXIgYXMgKHJlcTogdW5rbm93biwgcmVzOiB1bmtub3duLCBuZXh0OiAoKSA9PiB2b2lkKSA9PiB2b2lkKVxuICAgIH0sXG4gIH1cbn1cblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGFwcFR5cGU6ICdzcGEnLFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgc3BhRmFsbGJhY2soKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgICAgJy9zb2NrZXQuaW8nOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogMzAwMCxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9TLFNBQVMsb0JBQW9CO0FBQ2pVLE9BQU8sV0FBVztBQUdsQixJQUFNLHFCQUFxQixDQUFDLEtBQXdDLE1BQWUsU0FBcUI7QUFDdEcsTUFBSSxJQUFJLEtBQUssV0FBVyxNQUFNLEtBQUssSUFBSSxLQUFLLFdBQVcsWUFBWSxFQUFHLFFBQU8sS0FBSztBQUNsRixNQUFJLElBQUksV0FBVyxTQUFTLElBQUksV0FBVyxPQUFRLFFBQU8sS0FBSztBQUMvRCxRQUFNLE9BQU8sSUFBSSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSztBQUN2QyxNQUFJLFNBQVMsTUFBTSxTQUFTLElBQUssUUFBTyxLQUFLO0FBQzdDLE1BQUksa0JBQWtCLEtBQUssSUFBSSxFQUFHLFFBQU8sS0FBSztBQUU5QyxNQUFJLEtBQUssV0FBVyxJQUFJLEtBQUssS0FBSyxXQUFXLGdCQUFnQixFQUFHLFFBQU8sS0FBSztBQUM1RSxNQUFJLE1BQU07QUFDVixPQUFLO0FBQ1A7QUFFQSxTQUFTLGNBQWM7QUFDckIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLFFBQXdHO0FBQ3RILGFBQU8sWUFBWSxJQUFJLGtCQUE0RTtBQUFBLElBQ3JHO0FBQUEsSUFDQSx1QkFBdUIsUUFBd0c7QUFDN0gsYUFBTyxZQUFZLElBQUksa0JBQTRFO0FBQUEsSUFDckc7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsRUFDVCxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
