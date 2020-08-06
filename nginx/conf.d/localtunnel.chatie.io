server {
  listen 80;
  server_name localtunnel.chatie.io *.localtunnel.chatie.io;

  location / {
    proxy_pass http://localtunnel.chatie.io:3000;
  }
}
