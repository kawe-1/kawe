FROM node:20-alpine AS builder
WORKDIR /app

# Copy project manifest and config first to leverage Docker cache
COPY package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY brand.js landing.css ./
COPY src ./src

RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=4173

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
