# EntBüroMat

Ein Online-Mängelmelder für bürokratische Probleme - Eine Initiative der FDP Hessen.

## 📋 Projektübersicht

EntBüroMat ist eine öffentliche Plattform, auf der Bürger und Unternehmen bürokratische Hürden und Probleme melden können. Die Meldungen werden automatisch an die zuständigen FDP-Gliederungen weitergeleitet und verfolgt.

### Hauptfunktionen

- ✅ **Einfache Meldung**: Bürokratieprobleme einfach und anonym melden
- ✅ **Abstimmungssystem**: Nutzer können für ähnliche Probleme abstimmen
- ✅ **Status-Tracking**: Emoji-basierte Statusverfolgung (🔴/🟡/🟢)
- ✅ **Automatische Zuordnung**: Meldungen werden automatisch an zuständige FDP-Gliederungen weitergeleitet
- ✅ **E-Mail-Benachrichtigungen**: Sofortige Benachrichtigung bei neuen Meldungen
- ✅ **Wöchentliche Zusammenfassungen**: Automatische E-Mail-Berichte über offene Meldungen
- ✅ **Sichere Update-Links**: FDP-Gliederungen können Status ohne Anmeldung aktualisieren
- ✅ **Mehrsprachigkeit**: Deutsch und Englisch unterstützt
- ✅ **Admin-Interface**: Vollständige Verwaltung und Moderation
- ✅ **DSGVO-konform**: Sichere und datenschutzkonforme Speicherung

## Bugs und Feature-Requests
- "pending_approval" in Detail-Ansicht neu eingereichter Meldungen
- In Meldung-Detailansicht Kontrollknöpfe für Admins einbauen
- Ort-Filter funktioniert noch nicht
- Meldung-Titel in mobiler Ansicht nicht abkürzen
- Frontpage in der mobilen Ansicht korrigieren

## 🏗️ Architektur

### Backend (Node.js/Express)
- **Server**: Express.js mit TypeScript
- **Datenbank**: PostgreSQL
- **E-Mail**: Nodemailer mit SMTP
- **Authentifizierung**: JWT für Admin-Bereich
- **Validierung**: Joi für Eingabevalidierung
- **Datei-Upload**: Multer für Anhänge
- **Sicherheit**: Helmet, CORS, Rate Limiting

### Frontend (React/Next.js)
- **Framework**: Next.js mit TypeScript
- **Styling**: CSS mit Utility Classes
- **State Management**: React Query
- **Formulare**: React Hook Form
- **Internationalisierung**: next-i18next
- **Benachrichtigungen**: react-hot-toast
- **Responsive Design**: Mobile-first Ansatz

### Infrastruktur
- **Container**: Docker und Docker Compose
- **Reverse Proxy**: Nginx
- **Datenbank**: PostgreSQL 15
- **E-Mail Scheduler**: Node-cron für automatische E-Mails

## 🚀 Installation und Setup

### Voraussetzungen

- Node.js 18+ 
- PostgreSQL 15+
- Docker und Docker Compose (optional)
- SMTP-Server für E-Mail-Versendung

### 1. Repository klonen

\`\`\`bash
git clone https://github.com/fdp-hessen/entbueromat.git
cd entbueromat
\`\`\`

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie \`.env.example\` zu \`.env\` und passen Sie die Werte an:

\`\`\`bash
cp .env.example .env
\`\`\`

**Wichtige Konfigurationen:**

\`\`\`env
# Datenbank
DB_PASSWORD=ihr_sicheres_passwort

# JWT Secret (generieren Sie einen sicheren Schlüssel)
JWT_SECRET=ihr_jwt_secret_hier

# E-Mail Konfiguration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ihre-email@gmail.com
EMAIL_PASSWORD=ihr-app-passwort

# Admin E-Mail
ADMIN_EMAIL=admin@fdp-hessen.de

# Base URL
BASE_URL=https://ihre-domain.de
\`\`\`

### 3. Mit Docker (Empfohlen)

\`\`\`bash
# Alle Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Services stoppen
docker-compose down
\`\`\`

### 4. Manuelle Installation

#### Backend Setup

**Wichtig:** Für lokale Entwicklung müssen Sie die Umgebungsvariablen direkt setzen, da keine .env Datei geladen wird.

\`\`\`bash
cd server
npm install

# Umgebungsvariablen für lokale Entwicklung setzen
export PORT=3001
export NEXT_PORT=3000
export BASE_URL=http://localhost:3000
export NEXT_PUBLIC_API_URL=http://localhost:3001/api
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=entbueromat
export DB_USER=entbueromat_user
export DB_PASSWORD=ihr_passwort

npm run db:migrate  # Datenbank initialisieren
npm run dev         # Entwicklungsserver starten
\`\`\`

#### Frontend Setup

\`\`\`bash
cd client
npm install
npm run dev         # Entwicklungsserver starten
\`\`\`

#### Datenbank Setup

\`\`\`sql
-- PostgreSQL Datenbank erstellen
CREATE DATABASE entbueromat;
CREATE USER entbueromat_user WITH PASSWORD 'ihr_passwort';
GRANT ALL PRIVILEGES ON DATABASE entbueromat TO entbueromat_user;
\`\`\`

## 📁 Projektstruktur

\`\`\`
entbueromat/
├── server/                 # Backend (Node.js/Express)
│   ├── database/          # Datenbankschema und Migrationen
│   ├── routes/            # API Routen
│   ├── services/          # Business Logic und E-Mail
│   ├── middleware/        # Authentifizierung und Validierung
│   └── uploads/           # Datei-Uploads
├── client/                # Frontend (React/Next.js)
│   ├── src/
│   │   ├── components/    # React Komponenten
│   │   ├── pages/         # Next.js Seiten
│   │   ├── styles/        # CSS Styling
│   │   └── utils/         # API Client und Utilities
│   └── public/
│       └── locales/       # Übersetzungen (DE/EN)
├── nginx/                 # Reverse Proxy Konfiguration
├── docker-compose.yml     # Docker Services
└── README.md
\`\`\`

## 🔧 Konfiguration

### FDP-Gliederungen hinzufügen

Neue FDP-Gliederungen können direkt in der Datenbank hinzugefügt werden:

\`\`\`sql
INSERT INTO fdp_divisions (name, email, type, location_keywords, contact_person) VALUES
('FDP Fulda', 'fulda@fdp.de', 'communal', ARRAY['fulda'], 'FDP Fulda'),
('FDP Gießen', 'giessen@fdp.de', 'communal', ARRAY['gießen', 'giessen'], 'FDP Gießen');
\`\`\`

### E-Mail-Templates anpassen

E-Mail-Templates befinden sich in \`server/services/emailService.js\` und können dort angepasst werden.

### Kategorien erweitern

Neue Kategorien können in \`server/routes/public.js\` und den Übersetzungsdateien hinzugefügt werden.

## 👤 Admin-Zugang

### Standard Admin-Account

- **Benutzername**: \`admin\`
- **Passwort**: \`admin123!\` (⚠️ **Ändern Sie dies sofort in der Produktion!**)

### Admin-Interface Features

- Dashboard mit Statistiken
- Meldungen moderieren und freigeben
- Status von Meldungen aktualisieren
- Benutzer verwalten
- E-Mail-Benachrichtigungen überwachen

### Neuen Admin-Benutzer erstellen

\`\`\`bash
# Über die Admin-UI oder direkt in der Datenbank
# Passwort muss mit bcrypt gehashed werden
\`\`\`

### 🗄️ Datenbank-Verwaltung mit pgAdmin

Für eine einfache Verwaltung der PostgreSQL-Datenbank ist pgAdmin integriert:

**Zugang:**
- **URL**: \`http://localhost:8080\`
- **E-Mail**: \`admin@entbuero-mat.de\` (aus .env konfigurierbar)
- **Passwort**: \`pgadmin123\` (⚠️ **Ändern Sie dies in der Produktion!**)

**Automatische Konfiguration:**
pgAdmin ist bereits vorkonfiguriert und verbindet sich automatisch mit der EntBüro-Mat-Datenbank. Nach dem Login finden Sie unter "Servers" bereits die Verbindung "EntBüro-Mat Database".

**Manuelle Konfiguration (falls nötig):**
1. Rechtsklick auf "Servers" → "Register" → "Server"
2. **General Tab**: Name: \`EntBüro-Mat Database\`
3. **Connection Tab**:
   - Host: \`database\` (bei Docker) oder \`localhost\` (lokal)
   - Port: \`5432\`
   - Database: \`entbueromat\`
   - Username: \`entbueromat_user\`
   - Password: Ihr DB-Passwort aus der .env

**Admin-Passwort einfach ändern:**
1. pgAdmin öffnen → EntBüro-Mat Database → Schemas → public → Tables → admin_users
2. Rechtsklick auf \`admin_users\` → "View/Edit Data" → "All Rows"
3. Neues Passwort mit bcrypt hashen:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NeuesPasswort123!', 12));"
   ```
4. \`password_hash\` Feld in pgAdmin aktualisieren

## 📧 E-Mail-System

### Automatische Benachrichtigungen

1. **Neue Meldung**: Sofortige E-Mail an zuständige FDP-Gliederung
2. **Wöchentliche Zusammenfassung**: Jeden Montag um 9:00 Uhr
3. **Status-Updates**: Bei Änderungen durch FDP-Gliederungen

### E-Mail-Provider Setup

Für Gmail:
1. App-Passwort erstellen (nicht das normale Passwort)
2. 2FA aktivieren
3. App-spezifisches Passwort in \`EMAIL_PASSWORD\` verwenden

## 🔒 Sicherheit

### Produktions-Checkliste

- [ ] JWT Secret ändern
- [ ] Admin-Passwort ändern
- [ ] HTTPS konfigurieren
- [ ] Database Passwort ändern
- [ ] Rate Limiting überprüfen
- [ ] CORS-Einstellungen anpassen
- [ ] Backup-Strategie implementieren

### DSGVO-Compliance

- Anonyme Meldungen möglich
- Datenminimierung
- Recht auf Löschung implementiert
- Sichere Datenspeicherung
- Transparente Datenschutzerklärung erforderlich

## 📊 API-Dokumentation

### Öffentliche Endpunkte

\`\`\`
GET  /api/public/stats          # Öffentliche Statistiken
GET  /api/public/top-issues     # Beliebteste Meldungen
GET  /api/public/recent-resolved # Kürzlich gelöste Fälle
GET  /api/issues               # Alle freigegebenen Meldungen
POST /api/issues               # Neue Meldung einreichen
\`\`\`

### Admin-Endpunkte

\`\`\`
POST /api/admin/login          # Admin-Anmeldung
GET  /api/admin/stats          # Admin-Dashboard Statistiken
GET  /api/admin/issues         # Alle Meldungen (inkl. nicht freigegebene)
POST /api/admin/issues/:id/approve # Meldung freigeben
\`\`\`

### Status-Update-Endpunkte

\`\`\`
GET  /api/status/:token        # Meldung per sicherem Token abrufen
POST /api/status/:token/update # Status per sicherem Token aktualisieren
\`\`\`

## 🐳 Docker Deployment

### Produktions-Deployment

\`\`\`bash
# Production Build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# SSL-Zertifikate einrichten (Let's Encrypt)
# Backup-System konfigurieren
# Monitoring einrichten
\`\`\`

## 📈 Monitoring und Logs

### Logs anzeigen

\`\`\`bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f server

# Nur Frontend
docker-compose logs -f client
\`\`\`

### Wichtige Metriken

- Anzahl neuer Meldungen pro Tag
- Erfolgsquote (gelöste vs. eingereichte Meldungen)
- Response-Zeiten der FDP-Gliederungen
- Nutzer-Engagement (Abstimmungen, Wiederbesuche)

## 🤝 Beitragen

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (\`git checkout -b feature/neues-feature\`)
3. Änderungen committen (\`git commit -am 'Neues Feature hinzugefügt'\`)
4. Branch pushen (\`git push origin feature/neues-feature\`)
5. Pull Request erstellen

## 📝 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:

1. **Issues**: GitHub Issues für Bugs und Feature-Requests
2. **E-Mail**: \`admin@fdp-hessen.de\`
3. **Dokumentation**: Siehe \`/docs\` Ordner für detaillierte Anleitungen

## 🔄 Updates

### Version 1.0.0
- Grundfunktionalität implementiert
- E-Mail-System eingerichtet
- Admin-Interface erstellt
- Mehrsprachigkeit hinzugefügt

---

**EntBüroMat** - *Gemeinsam für weniger Bürokratie* 🚀 