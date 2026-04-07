FROM ghcr.io/puppeteer/puppeteer:latest
USER root
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
CMD ["node", "index.js"]