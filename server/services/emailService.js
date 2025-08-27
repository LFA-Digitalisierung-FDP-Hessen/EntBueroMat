const { query } = require('../database/db');

/**
 * Assigns an issue to the appropriate FDP division based on issue type and location
 * @param {string} issueType - Type of issue (communal, state, federal)
 * @param {string} location - Location where the issue occurred
 * @returns {Object|null} - FDP division object or null if none found
 */
async function assignFDPDivision(issueType, location) {
    try {
        // Query database for matching FDP division
        const divisionQuery = `
            SELECT id, name, email, contact_person, phone
            FROM fdp_divisions 
            WHERE type = $1 
            AND (
                $2 = ANY(location_keywords) 
                OR LOWER($2) LIKE ANY(SELECT '%' || LOWER(keyword) || '%' FROM unnest(location_keywords) AS keyword)
            )
            ORDER BY 
                CASE WHEN $2 = ANY(location_keywords) THEN 1 ELSE 2 END,
                id
            LIMIT 1
        `;

        const result = await query(divisionQuery, [issueType, location?.toLowerCase() || '']);
        
        if (result.rows.length > 0) {
            console.log(`Assigned issue to FDP division: ${result.rows[0].name}`);
            return result.rows[0];
        }

        // Fallback: Try to find a general division for the issue type
        const fallbackQuery = `
            SELECT id, name, email, contact_person, phone
            FROM fdp_divisions 
            WHERE type = $1
            ORDER BY id
            LIMIT 1
        `;

        const fallbackResult = await query(fallbackQuery, [issueType]);
        
        if (fallbackResult.rows.length > 0) {
            console.log(`Assigned issue to fallback FDP division: ${fallbackResult.rows[0].name}`);
            return fallbackResult.rows[0];
        }

        console.log('No FDP division found for assignment');
        return null;

    } catch (error) {
        console.error('Error assigning FDP division:', error);
        return null;
    }
}

/**
 * Notifies an FDP division about a new issue via email
 * @param {string} email - Email address of the FDP division
 * @param {Object} issueData - Issue data object
 * @returns {boolean} - Success status
 */
async function notifyFDPDivision(email, issueData) {
    try {
        // For now, just log the notification
        // In production, this would send an actual email
        console.log('=== FDP DIVISION NOTIFICATION ===');
        console.log(`To: ${email}`);
        console.log(`Subject: Neue Bürgermeldung: ${issueData.title}`);
        console.log(`Issue ID: ${issueData.id}`);
        console.log(`Category: ${issueData.category}`);
        console.log(`Location: ${issueData.location}`);
        console.log(`Description: ${issueData.description.substring(0, 100)}...`);
        console.log(`Update Token: ${issueData.secureUpdateToken}`);
        console.log('================================');

        // Log notification to database
        await logEmailNotification(issueData.id, email, 'new_issue', 
            `Neue Bürgermeldung: ${issueData.title}`, 
            `Eine neue Meldung wurde eingereicht: ${issueData.description}`, 
            true
        );

        return true;
    } catch (error) {
        console.error('Error notifying FDP division:', error);
        
        // Log failed notification
        await logEmailNotification(issueData.id, email, 'new_issue', 
            `Neue Bürgermeldung: ${issueData.title}`, 
            `Error: ${error.message}`, 
            false, 
            error.message
        );
        
        return false;
    }
}

/**
 * Logs email notifications to the database
 * @param {number} issueId - Issue ID
 * @param {string} email - Recipient email
 * @param {string} type - Notification type
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {boolean} success - Whether the email was sent successfully
 * @param {string} errorMessage - Error message if failed
 */
async function logEmailNotification(issueId, email, type, subject, body, success, errorMessage = null) {
    try {
        const logQuery = `
            INSERT INTO email_notifications 
            (issue_id, recipient_email, notification_type, email_subject, email_body, success, error_message)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await query(logQuery, [issueId, email, type, subject, body, success, errorMessage]);
    } catch (error) {
        console.error('Error logging email notification:', error);
    }
}

/**
 * Sends weekly summary emails to FDP divisions
 * This function can be called by the email scheduler
 */
async function sendWeeklySummary() {
    try {
        console.log('Sending weekly summary emails...');
        
        // Get all FDP divisions
        const divisionsQuery = 'SELECT * FROM fdp_divisions ORDER BY name';
        const divisions = await query(divisionsQuery);
        
        // Get summary data for the past week
        const summaryQuery = `
            SELECT 
                COUNT(*) as new_issues,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_issues,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_issues
            FROM issues 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND approved_at IS NOT NULL
        `;
        
        const summary = await query(summaryQuery);
        const stats = summary.rows[0];
        
        // Send summary to each division
        for (const division of divisions.rows) {
            console.log(`=== WEEKLY SUMMARY FOR ${division.name} ===`);
            console.log(`To: ${division.email}`);
            console.log(`New Issues: ${stats.new_issues}`);
            console.log(`Resolved: ${stats.resolved_issues}`);
            console.log(`In Progress: ${stats.in_progress_issues}`);
            console.log('=========================================');
            
            // Log the summary email
            await logEmailNotification(null, division.email, 'weekly_summary',
                'Wöchentliche Zusammenfassung - EntBüroMat',
                `Neue Meldungen: ${stats.new_issues}, Gelöst: ${stats.resolved_issues}, In Bearbeitung: ${stats.in_progress_issues}`,
                true
            );
        }
        
        return true;
    } catch (error) {
        console.error('Error sending weekly summary:', error);
        return false;
    }
}

module.exports = {
    assignFDPDivision,
    notifyFDPDivision,
    sendWeeklySummary,
    logEmailNotification
}; 