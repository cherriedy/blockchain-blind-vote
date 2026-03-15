FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Default command: compile contracts
CMD ["npx", "hardhat", "compile"]

