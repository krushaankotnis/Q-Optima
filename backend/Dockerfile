FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl \
  && curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /etc/ssl/certs/rds-global-bundle.pem \
  && apk del curl
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 5000
CMD ["npm", "start"]
