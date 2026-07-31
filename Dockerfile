FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /root/.cache/lightpanda-node /root/.cache/lightpanda-node
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend ./backend
COPY --from=build /app/shared ./shared
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/prod.db
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && bun run backend/server.ts"]
