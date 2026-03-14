FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/
COPY LICENSE README.md ./

ENTRYPOINT ["node", "dist/index.js"]
