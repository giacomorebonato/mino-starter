FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
RUN bun build frontend/index.html --outdir dist --production
RUN bun run scripts/prod-css.ts

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend ./backend
COPY --from=build /app/shared ./shared
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/tsconfig.json ./tsconfig.json
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/prod.db
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run backend/server.ts"]
