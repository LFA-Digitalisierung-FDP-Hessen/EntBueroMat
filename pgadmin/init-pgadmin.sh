#!/bin/bash

echo "🔧 Initialisiere pgAdmin-Konfiguration für EntBüro-Mat..."

# Erstelle pgpass-Datei mit Umgebungsvariablen
mkdir -p /tmp
cat > /tmp/pgpassfile << EOF
database:5432:entbueromat:entbueromat_user:${DB_PASSWORD}
database:5432:*:entbueromat_user:${DB_PASSWORD}
EOF

# Setze korrekte Berechtigungen
chmod 600 /tmp/pgpassfile

echo "✅ pgAdmin vorkonfiguriert - EntBüro-Mat Database automatisch verfügbar"

# Starte pgAdmin mit dem originalen Entrypoint
exec /entrypoint.sh
