FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build && npm prune --omit=dev

COPY server ./server

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server/index.js"]
