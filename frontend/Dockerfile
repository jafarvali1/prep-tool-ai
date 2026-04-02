FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json* ./

# Install packages
RUN npm install

# Copy application source
COPY . .

# Build for production
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
