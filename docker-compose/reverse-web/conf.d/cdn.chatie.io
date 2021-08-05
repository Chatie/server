server {
  listen 80;
  server_name cdn.chatie.io;

  # rewrite_log on;

  #
  # https://cdn.chatie.io/mirrors/github.com/frida/frida/releases/download/15.0.13/frida-v15.0.13-node-v83-linux-arm64.tar.gz
  #   -> https://github.com/frida/frida/releases/download/15.0.13/frida-v15.0.13-node-v83-linux-arm64.tar.gz
  #
  location /mirrors/github.com/ {
    rewrite ^/mirrors/github\.com/(.*) /$1 break;

    proxy_pass https://github.com;
    proxy_set_header Host github.com;

    proxy_intercept_errors on;
    error_page 301 302 307 = @handle_redirect;
  }

  #
  # https://serverfault.com/a/792035/276381
  #
  location @handle_redirect {
    #
    # https://stackoverflow.com/a/17805818/1123955
    #
    resolver 8.8.8.8;

    set $saved_redirect_location '$upstream_http_location';

    if ($saved_redirect_location ~ ^https?://([^/]+)/) {
      set $saved_redirect_host '$1';
    }
    proxy_set_header Host $saved_redirect_host;

    proxy_pass $saved_redirect_location;
  }
}
