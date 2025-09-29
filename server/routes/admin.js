const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { query } = require('../database/db');
const { authenticateAdmin, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

const createUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('admin', 'moderator').default('moderator')
});

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body); // Debug log

        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details);
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.details.map(d => d.message)
            });
        }

        const { username, password } = value;
        console.log('Searching for user:', username); // Debug log

        // Find user by username or email
        const userQuery = 'SELECT * FROM admin_users WHERE (username = $1 OR email = $1) AND is_active = true';
        const userResult = await query(userQuery, [username]);

        console.log('Users found:', userResult.rows.length); // Debug log

        if (userResult.rows.length === 0) {
            console.log('No user found with username/email:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        console.log('User found:', user.username, user.email); // Debug log

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isValidPassword); // Debug log
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', user.username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/admin/me - Get current user info
router.get('/me', authenticateAdmin, async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            // Total issues
            query('SELECT COUNT(*) as total FROM issues'),
            // Pending approval
            query('SELECT COUNT(*) as pending FROM issues WHERE status = \'pending_approval\''),
            // Approved issues
            query('SELECT COUNT(*) as approved FROM issues WHERE status != \'pending_approval\' AND status != \'rejected\''),
            // Resolved issues
            query('SELECT COUNT(*) as resolved FROM issues WHERE status = \'resolved\''),
            // Total votes
            query('SELECT COUNT(*) as total_votes FROM votes'),
            // Recent issues (last 7 days)
            query(`
                SELECT COUNT(*) as recent 
                FROM issues 
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            `),
            // Issues by category
            query(`
                SELECT category, COUNT(*) as count 
                FROM issues 
                WHERE approved_at IS NOT NULL 
                GROUP BY category 
                ORDER BY count DESC
            `),
            // Issues by status
            query(`
                SELECT status, COUNT(*) as count 
                FROM issues 
                GROUP BY status
            `)
        ]);

        res.json({
            totalIssues: parseInt(stats[0].rows[0].total),
            pendingApproval: parseInt(stats[1].rows[0].pending),
            approvedIssues: parseInt(stats[2].rows[0].approved),
            resolvedIssues: parseInt(stats[3].rows[0].resolved),
            totalVotes: parseInt(stats[4].rows[0].total_votes),
            recentIssues: parseInt(stats[5].rows[0].recent),
            issuesByCategory: stats[6].rows,
            issuesByStatus: stats[7].rows
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Admin issues are now handled by the unified /api/issues endpoint

// Rejected issues are now handled by the unified /api/issues endpoint with status=rejected filter

// GET /api/admin/export - Export issues to CSV
router.get('/export', authenticateAdmin, async (req, res) => {
    try {
        const issuesQuery = `
            SELECT 
                id, title, description, category, location, issue_type,
                is_anonymous, submitter_name, submitter_email, created_at,
                approved_at, resolved_at, rejected_at
            FROM issues
            ORDER BY created_at ASC
        `;

        const result = await query(issuesQuery);
        const issues = result.rows;

        // Convert issues to CSV format
        const csvHeaders = [
            'ID', 'Title', 'Description', 'Category', 'Location', 'Issue Type',
            'Is Anonymous', 'Submitter Name', 'Submitter Email', 'Created At',
            'Approved At', 'Resolved At', 'Rejected At'
        ];

        const csvRows = issues.map(issue => [
            issue.id,
            issue.title,
            `"${issue.description.replace(/"/g, '""')}"`, // Escape double quotes
            issue.category,
            issue.location,
            issue.issue_type,
            issue.is_anonymous,
            issue.submitter_name,
            issue.submitter_email,
            issue.created_at,
            issue.approved_at,
            issue.resolved_at,
            issue.rejected_at
        ]);

        const csvContent = [csvHeaders, ...csvRows].map(e => e.join(",")).join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="issues_export.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting issues to CSV:', error);
        res.status(500).json({ error: 'Failed to export issues to CSV' });
    }
});

// POST /api/admin/users - Create new admin user (admin only)
router.post('/users', authenticateAdmin, requireRole(['admin']), async (req, res) => {
    try {
        const { error, value } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.details.map(d => d.message)
            });
        }

        const { username, email, password, role } = value;

        // Check if username or email already exists
        const existingUserQuery = 'SELECT id FROM admin_users WHERE username = $1 OR email = $2';
        const existingUser = await query(existingUserQuery, [username, email]);
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const createUserQuery = `
            INSERT INTO admin_users (username, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, role, created_at
        `;
        
        const newUserResult = await query(createUserQuery, [username, email, passwordHash, role]);
        const newUser = newUserResult.rows[0];

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Error creating admin user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/admin/issues/:id/status - Update issue status
router.put('/issues/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, update_text } = req.body;

        if (!['pending_approval', 'submitted', 'in_progress', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Update issue status
        const updateQuery = `
            UPDATE issues 
            SET status = $1, resolved_at = CASE WHEN $2 = 'resolved' THEN CURRENT_TIMESTAMP ELSE NULL END
            WHERE id = $3 AND approved_at IS NOT NULL
            RETURNING id, title, status
        `;

        const updateResult = await query(updateQuery, [status, status, id]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or not approved' });
        }

        // Add status update comment if provided
        if (update_text) {
            await query(
                `INSERT INTO issue_updates (issue_id, update_text, updated_by, updater_name) 
                 VALUES ($1, $2, $3, $4)`,
                [id, update_text, 'admin', req.user.username]
            );
        }

        res.json({ 
            message: 'Issue status updated successfully',
            issue: updateResult.rows[0]
        });
    } catch (error) {
        console.error('Error updating issue status:', error);
        res.status(500).json({ error: 'Failed to update issue status' });
    }
});

// POST /api/admin/issues/:id/reactivate - Reactivate a rejected issue
router.post('/issues/:id/reactivate', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const reactivateQuery = `
            UPDATE issues
            SET status = 'submitted', rejected_at = NULL
            WHERE id = $1 AND status = 'rejected'
            RETURNING *
        `;

        const result = await query(reactivateQuery, [id]);
        const reactivatedIssue = result.rows[0];

        if (!reactivatedIssue) {
            return res.status(404).json({ error: 'Issue not found or not rejected' });
        }

        res.json({ message: 'Issue reactivated successfully', issue: reactivatedIssue });
    } catch (error) {
        console.error('Error reactivating issue:', error);
        res.status(500).json({ error: 'Failed to reactivate issue' });
    }
});

// POST /api/admin/issues/:id/update - Add an update to an issue (admin only)
router.post('/issues/:id/update', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { update_text, is_public = true } = req.body;

        if (!update_text || update_text.trim().length === 0) {
            return res.status(400).json({ error: 'Update text is required' });
        }

        // Check if issue exists and is approved
        const issueCheckQuery = `
            SELECT id, title FROM issues 
            WHERE id = $1 AND status != 'pending_approval'
        `;
        const issueCheck = await query(issueCheckQuery, [id]);

        if (issueCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or not approved' });
        }

        // Insert the update
        const insertUpdateQuery = `
            INSERT INTO issue_updates (issue_id, update_text, updated_by, updater_name, is_public)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, update_text, updated_by, updater_name, created_at, is_public
        `;

        const updateResult = await query(insertUpdateQuery, [
            id, 
            update_text.trim(), 
            'admin', 
            req.user.username,
            is_public
        ]);

        // Update the issue's updated_at timestamp
        await query('UPDATE issues SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        res.status(201).json({
            message: 'Update added successfully',
            update: updateResult.rows[0]
        });
    } catch (error) {
        console.error('Error adding issue update:', error);
        res.status(500).json({ error: 'Failed to add update' });
    }
});

module.exports = router;