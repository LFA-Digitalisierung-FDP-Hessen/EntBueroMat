-- EntBüroMat Database Schema

-- Issues table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('communal', 'state', 'federal')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'submitted', 'in_progress', 'resolved', 'rejected')),
    is_anonymous BOOLEAN DEFAULT false,
    submitter_name VARCHAR(255),
    submitter_email VARCHAR(255),
    submitter_contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    resolved_at TIMESTAMP,
    fdp_division_contacted BOOLEAN DEFAULT false,
    secure_update_token UUID UNIQUE,
    attachment_path VARCHAR(500),
    admin_notes TEXT
);

-- Votes table for the "like" system
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
    user_identifier VARCHAR(255) NOT NULL, -- IP hash or session ID for anonymous voting
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(issue_id, user_identifier)
);

-- FDP divisions table
CREATE TABLE fdp_divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('communal', 'state', 'federal')),
    location_keywords TEXT[], -- Array of location keywords this division handles
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issue updates/comments table
CREATE TABLE issue_updates (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    updated_by VARCHAR(100) NOT NULL CHECK (updated_by IN ('admin', 'fdp_division', 'system')),
    updater_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT true
);

-- Admin users table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'moderator' CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Email notifications log
CREATE TABLE email_notifications (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('new_issue', 'weekly_summary', 'status_update')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_subject VARCHAR(500),
    email_body TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_created_at ON issues(created_at);
CREATE INDEX idx_issues_location ON issues(location);
CREATE INDEX idx_votes_issue_id ON votes(issue_id);
CREATE INDEX idx_issue_updates_issue_id ON issue_updates(issue_id);
CREATE INDEX idx_email_notifications_issue_id ON email_notifications(issue_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default FDP divisions
INSERT INTO fdp_divisions (name, email, type, location_keywords, contact_person) VALUES
('FDP Hessen', 'hessen@fdp.de', 'state', ARRAY['hessen', 'state', 'land'], 'FDP Hessen Landesverband'),
('FDP Frankfurt', 'frankfurt@fdp.de', 'communal', ARRAY['frankfurt', 'frankfurt am main'], 'FDP Frankfurt'),
('FDP Wiesbaden', 'wiesbaden@fdp.de', 'communal', ARRAY['wiesbaden'], 'FDP Wiesbaden'),
('FDP Kassel', 'kassel@fdp.de', 'communal', ARRAY['kassel'], 'FDP Kassel'),
('FDP Darmstadt', 'darmstadt@fdp.de', 'communal', ARRAY['darmstadt'], 'FDP Darmstadt');

-- Create default admin user (password: admin123! - CHANGE IN PRODUCTION)
INSERT INTO admin_users (username, email, password_hash, role) VALUES
('admin', 'admin@fdp-hessen.de', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewKlRAx.LtjGP.cG', 'admin');

-- Insert sample issues for demonstration (auto-approved for demo)
INSERT INTO issues (title, description, category, location, issue_type, status, is_anonymous, approved_at) VALUES
('Lange Wartezeiten im Bürgeramt', 'Termine beim Bürgeramt sind erst in 6 Wochen verfügbar und dann muss man trotzdem 2 Stunden warten.', 'municipal', 'Frankfurt', 'communal', 'submitted', true, CURRENT_TIMESTAMP),
('Komplizierte Steuerformulare', 'Die neuen Steuerformulare sind unverständlich und es gibt keine verständliche Hilfe.', 'taxation', 'Wiesbaden', 'state', 'in_progress', true, CURRENT_TIMESTAMP),
('Unklare Bauvorschriften', 'Bauvorschriften sind widersprüchlich und ändern sich ständig, niemand weiß was gilt.', 'construction', 'Kassel', 'communal', 'resolved', false, CURRENT_TIMESTAMP),
('Endlose Warteschlangen bei der KFZ-Zulassung', 'Bei der KFZ-Zulassungsstelle muss man stundenlang warten, obwohl man einen Termin hat.', 'transport', 'Darmstadt', 'communal', 'in_progress', true, CURRENT_TIMESTAMP),
('Fehlende Digitalisierung in Schulverwaltung', 'Anmeldungen für Schulen sind nur auf Papier möglich, keine Online-Verfahren verfügbar.', 'education', 'Frankfurt', 'communal', 'submitted', false, CURRENT_TIMESTAMP);

-- Insert some sample votes
INSERT INTO votes (issue_id, user_identifier) VALUES
(1, 'user123'), (1, 'user456'), (1, 'user789'), (1, 'user321'), (1, 'user654'),
(2, 'user123'), (2, 'user456'), (2, 'user987'),
(3, 'user789'), (3, 'user234'),
(4, 'user111'), (4, 'user222'), (4, 'user333'), (4, 'user444'), (4, 'user555'), (4, 'user666'), (4, 'user777'),
(5, 'user888'), (5, 'user999');

-- Insert sample updates
INSERT INTO issue_updates (issue_id, update_text, updated_by, updater_name) VALUES
(2, 'Wir haben das Problem an das Finanzministerium weitergeleitet.', 'fdp_division', 'FDP Hessen'),
(3, 'Die Bauvorschriften wurden überarbeitet und sind jetzt online verfügbar.', 'fdp_division', 'FDP Kassel'),
(4, 'Wir prüfen die Situation bei der KFZ-Zulassungsstelle und werden Verbesserungen vorschlagen.', 'fdp_division', 'FDP Darmstadt');

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO entbueromat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO entbueromat_user;