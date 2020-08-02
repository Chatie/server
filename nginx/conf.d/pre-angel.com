server {
  listen 80;
  server_name pre-angel.com www.pre-angel.com;

  location / {
    proxy_pass http://preangel.github.io;
  }
}
