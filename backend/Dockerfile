# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src

RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p storage_uploads data

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
