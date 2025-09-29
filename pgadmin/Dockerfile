FROM dpage/pgadmin4:latest

# Als root ausführen für Setup
USER root

# pgAdmin Konfigurationsdateien kopieren
COPY config/servers.json /pgadmin4/servers.json
COPY config/preferences.json /pgadmin4/preferences.json

# Initialisierungsskript kopieren und ausführbar machen
COPY init-pgadmin.sh /usr/local/bin/init-pgadmin.sh
RUN chmod +x /usr/local/bin/init-pgadmin.sh

# Zurück zum pgadmin user wechseln
USER pgadmin

# Custom Entrypoint verwenden
ENTRYPOINT ["/usr/local/bin/init-pgadmin.sh"]
