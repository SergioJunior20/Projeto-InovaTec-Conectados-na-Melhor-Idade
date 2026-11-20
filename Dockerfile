FROM node:24-bookworm-slim
WORKDIR /app/Back-end
COPY Back-end/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY Back-end/*.js ./
COPY Front-end /app/Front-end
ENV HOST=0.0.0.0
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node","server.js"]
