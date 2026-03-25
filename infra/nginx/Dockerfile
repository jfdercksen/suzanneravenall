FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# SSL certs and certbot webroot are mounted at runtime — not baked in
# Certbot webroot dir created at startup
RUN mkdir -p /var/www/certbot

EXPOSE 80 443
