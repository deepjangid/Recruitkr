import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const getPackageChunkName = (id: string) => {
  const [, packagePath = "vendor"] = id.split("node_modules/");
  const [scopeOrName, maybeName] = packagePath.split(/[\\/]/);
  const packageName = scopeOrName.startsWith("@") ? `${scopeOrName}-${maybeName}` : scopeOrName;

  return `pkg-${packageName.replace(/@/g, "").replace(/[\\/]/g, "-")}`;
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-quill")) return "editor";
          if (
            id.includes("react-router") ||
            id.includes("\\react\\") ||
            id.includes("\\react-dom\\")
          ) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui")) return "radix";

          return getPackageChunkName(id);
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
