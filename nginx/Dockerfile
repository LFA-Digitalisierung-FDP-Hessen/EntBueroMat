FROM nginx:alpine

# Install envsubst (gettext package)
RUN apk add --no-cache gettext

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create SSL directory (for future use)
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Start nginx with environment variable substitution
CMD envsubst '${PORT} ${NEXT_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;' 