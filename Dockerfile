# Local development container for the EDMECA Academy stack.
# Targets:
#   dev       — Vite dev server with HMR (source bind-mounted by docker-compose)
#   functions — Netlify functions dev server (/api/contact, /api/chat)
#   preview   — production build served via `vite preview` (built at container start
#               so VITE_* env vars from docker-compose are picked up)

# Overridable for environments that mirror or pre-bake the Node base image
ARG BASE_IMAGE=node:20.19-bookworm-slim

FROM ${BASE_IMAGE} AS deps
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
# --ignore-scripts: skips Playwright's browser download and the Supabase CLI
# binary fetch — neither runs inside these containers (native binaries for
# esbuild/rollup/tailwind arrive via optional dependencies, not scripts).
RUN npm ci --no-audit --no-fund --ignore-scripts

FROM deps AS dev
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM deps AS functions
RUN npm install -g --no-audit --no-fund netlify-cli@27
EXPOSE 9999
CMD ["netlify", "functions:serve", "--port", "9999"]

FROM deps AS preview
COPY . .
EXPOSE 4173
CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 4173 --strictPort"]
