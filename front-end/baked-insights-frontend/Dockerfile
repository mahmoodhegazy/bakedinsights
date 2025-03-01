# Stage 1: Build the React application
FROM node:18-alpine as build

# Set working directory for build stage
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies using clean install to ensure consistent builds
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the built application using Nginx
FROM nginx:alpine

# Copy the built assets from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]