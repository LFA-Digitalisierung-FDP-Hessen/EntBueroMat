const express = require('express');
const Joi = require('joi');
const { query } = require('../database/db');

const router = express.Router();

// Validation schema for status updates
const statusUpdateSchema = Joi.object({
    status: Joi.string().valid('submitted', 'in_progress', 'resolved', 'rejected').required(),
    update_text: Joi.string().min(10).max(1000).required(),
    updater_name: Joi.string().max(255).optional()
});

// GET /api/status/:token - Get issue details by secure token
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const issueQuery = `
            SELECT 
                i.id,
                i.title,
                i.description,
                i.category,
                i.location,
                i.issue_type,
                i.status,
                i.created_at,
                i.updated_at,
                i.resolved_at,
                COUNT(v.id) as vote_count
            FROM issues i
            LEFT JOIN votes v ON i.id = v.issue_id
            WHERE i.secure_update_token = $1 
            AND i.approved_at IS NOT NULL
            GROUP BY i.id
        `;

        const updatesQuery = `
            SELECT 
                id, 
                update_text, 
                updated_by, 
                updater_name, 
                created_at,
                is_public
            FROM issue_updates
            WHERE issue_id = (
                SELECT id FROM issues WHERE secure_update_token = $1
            )
            ORDER BY created_at ASC
        `;

        const [issueResult, updatesResult] = await Promise.all([
            query(issueQuery, [token]),
            query(updatesQuery, [token])
        ]);

        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or invalid token' });
        }

        const issue = issueResult.rows[0];
        const updates = updatesResult.rows;

        res.json({ 
            issue: {
                ...issue,
                vote_count: parseInt(issue.vote_count)
            }, 
            updates 
        });
    } catch (error) {
        console.error('Error fetching issue by token:', error);
        res.status(500).json({ error: 'Failed to fetch issue' });
    }
});

// POST /api/status/:token/update - Update issue status using secure token
router.post('/:token/update', async (req, res) => {
    try {
        const { token } = req.params;
        
        // Validate input
        const { error, value } = statusUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.details.map(d => d.message)
            });
        }

        const { status, update_text, updater_name } = value;

        // Check if issue exists and get its ID
        const issueQuery = `
            SELECT id, title, status as current_status 
            FROM issues 
            WHERE secure_update_token = $1 
            AND approved_at IS NOT NULL
        `;
        
        const issueResult = await query(issueQuery, [token]);
        
        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or invalid token' });
        }

        const issue = issueResult.rows[0];
        const issueId = issue.id;

        // Update issue status
        const updateQuery = `
            UPDATE issues 
            SET status = $1, 
                resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
            WHERE id = $2
            RETURNING id, title, status, updated_at
        `;

        const updateResult = await query(updateQuery, [status, issueId]);

        // Add status update record
        const insertUpdateQuery = `
            INSERT INTO issue_updates (issue_id, update_text, updated_by, updater_name, is_public)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;

        await query(insertUpdateQuery, [
            issueId, 
            update_text, 
            'fdp_division', 
            updater_name || 'FDP Vertreter',
            true
        ]);

        // Log the status update email notification
        await query(
            `INSERT INTO email_notifications (issue_id, recipient_email, notification_type, email_subject, success) 
             VALUES ($1, $2, $3, $4, $5)`,
            [issueId, 'system@entbueromat.de', 'status_update', `Status Update: ${issue.title}`, true]
        );

        res.json({
            message: 'Status updated successfully',
            issue: updateResult.rows[0],
            statusChanged: issue.current_status !== status
        });

    } catch (error) {
        console.error('Error updating issue status:', error);
        res.status(500).json({ error: 'Failed to update issue status' });
    }
});

// GET /api/status/:token/history - Get full update history for an issue
router.get('/:token/history', async (req, res) => {
    try {
        const { token } = req.params;

        // First verify the token is valid
        const tokenQuery = `SELECT id FROM issues WHERE secure_update_token = $1 AND approved_at IS NOT NULL`;
        const tokenResult = await query(tokenQuery, [token]);

        if (tokenResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or invalid token' });
        }

        const issueId = tokenResult.rows[0].id;

        // Get full history including admin updates
        const historyQuery = `
            SELECT 
                id,
                update_text,
                updated_by,
                updater_name,
                created_at,
                is_public
            FROM issue_updates
            WHERE issue_id = $1
            ORDER BY created_at ASC
        `;

        const historyResult = await query(historyQuery, [issueId]);

        res.json({ 
            updates: historyResult.rows 
        });

    } catch (error) {
        console.error('Error fetching issue history:', error);
        res.status(500).json({ error: 'Failed to fetch issue history' });
    }
});

module.exports = router; 