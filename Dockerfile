# Use a modern Node.js image
FROM node:20-slim

# Install build tools for native modules (sodium, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (triggers native module compilation on Linux)
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port (Render uses 10000 by default, our app uses 4000)
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
