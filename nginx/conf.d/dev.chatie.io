server {
  listen 80;
  server_name dev.chatie.io;

  location / {
    proxy_pass http://dev.chatie.io:81;
  }
}
