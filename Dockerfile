FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
RUN npm run build

FROM node:18-alpine AS prod

WORKDIR /app

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["npm", "start"]
