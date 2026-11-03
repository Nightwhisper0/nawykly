# Obraz produkcyjny: statyczna aplikacja serwowana przez Nginx jako non-root.
# Bazowy obraz nasłuchuje na 8080 i uruchamia procesy jako UID/GID 101 (nginx).
# Wersję przypinamy do stabilnej gałęzi 1.30; w produkcji rozważ pin po digest.
FROM nginxinc/nginx-unprivileged:1.30-alpine

LABEL org.opencontainers.image.title="Nawykly" \
      org.opencontainers.image.description="Statyczny prototyp Vue 3 — aplikacja do formowania nawyków z interaktywnym bonsai 3D" \
      org.opencontainers.image.version="1.1.0"

# Zastępujemy domyślny server block własną konfiguracją.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiujemy wyłącznie pliki wymagane w runtime.
# Reszta (folder nawyklybrand, .git, .agents, README) jest wykluczona przez .dockerignore.
COPY --chown=101:101 index.html styles.css app.js bonsai.js /usr/share/nginx/html/
COPY --chown=101:101 assets /usr/share/nginx/html/assets

# Jawnie uruchamiamy jako non-root (UID/GID 101 = nginx).
USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
