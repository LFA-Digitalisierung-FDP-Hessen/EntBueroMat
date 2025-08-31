const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const crypto = require('crypto');

const { query } = require('../database/db');
const { assignFDPDivision, notifyFDPDivision } = require('../services/emailService');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        try {
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

// Validation schemas
const issueSchema = Joi.object({
    title: Joi.string().min(10).max(255).required(),
    description: Joi.string().min(20).max(5000).required(),
    category: Joi.string().valid(
        'general', 'construction', 'healthcare', 'municipal', 'taxation', 
        'education', 'environment', 'transport', 'business', 'other'
    ).required(),
    location: Joi.string().max(255).optional(),
    issue_type: Joi.string().valid('communal', 'state', 'federal').required(),
    is_anonymous: Joi.boolean().default(false),
    submitter_name: Joi.string().max(255).when('is_anonymous', { is: false, then: Joi.required() }),
    submitter_email: Joi.string().email().max(255).when('is_anonymous', { is: false, then: Joi.required() }),
    submitter_contact: Joi.string().max(255).optional()
});

// Create user identifier for anonymous voting
function createUserIdentifier(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
}

// GET /api/issues - Get all approved issues with pagination and filtering
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            status,
            sort = 'created_at',
            order = 'DESC',
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = 'WHERE approved_at IS NOT NULL';
        const queryParams = [];
        let paramCount = 0;

        // Add filters
        if (category) {
            whereClause += ` AND category = $${++paramCount}`;
            queryParams.push(category);
        }

        if (status) {
            whereClause += ` AND status = $${++paramCount}`;
            queryParams.push(status);
        }

        if (search) {
            whereClause += ` AND (title ILIKE $${++paramCount} OR description ILIKE $${++paramCount})`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Validate sort and order
        const allowedSorts = ['created_at', 'updated_at', 'vote_count', 'title'];
        const allowedOrders = ['ASC', 'DESC'];
        const finalSort = allowedSorts.includes(sort) ? sort : 'created_at';
        const finalOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        // Create user identifier for vote status
        const userIdentifier = createUserIdentifier(req);

        const issuesQuery = `
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
                COUNT(v.id) as vote_count,
                CASE WHEN i.attachment_path IS NOT NULL THEN true ELSE false END as has_attachment,
                CASE WHEN uv.id IS NOT NULL THEN true ELSE false END as has_voted
            FROM issues i
            LEFT JOIN votes v ON i.id = v.issue_id
            LEFT JOIN votes uv ON i.id = uv.issue_id AND uv.user_identifier = $${++paramCount}
            ${whereClause}
            GROUP BY i.id, uv.id
            ORDER BY ${finalSort === 'vote_count' ? 'COUNT(v.id)' : 'i.' + finalSort} ${finalOrder}
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;

        queryParams.push(userIdentifier, limit, offset);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM issues i
            ${whereClause}
        `;

        const [issuesResult, countResult] = await Promise.all([
            query(issuesQuery, queryParams),
            query(countQuery, queryParams.slice(0, -3)) // Remove userIdentifier, limit, and offset for count
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            issues: issuesResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ error: 'Failed to fetch issues' });
    }
});

// GET /api/issues/:id - Get specific issue with details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userIdentifier = createUserIdentifier(req);

        const issueQuery = `
            SELECT 
                i.*,
                COUNT(DISTINCT v.id) as vote_count,
                CASE WHEN MAX(CASE WHEN uv.user_identifier = $2 THEN 1 ELSE 0 END) = 1 THEN true ELSE false END as has_voted
            FROM issues i
            LEFT JOIN votes v ON i.id = v.issue_id
            LEFT JOIN votes uv ON i.id = uv.issue_id
            WHERE i.id = $1 AND i.approved_at IS NOT NULL
            GROUP BY i.id
        `;

        const updatesQuery = `
            SELECT id, update_text, updated_by, updater_name, created_at
            FROM issue_updates
            WHERE issue_id = $1 AND is_public = true
            ORDER BY created_at ASC
        `;

        const [issueResult, updatesResult] = await Promise.all([
            query(issueQuery, [id, userIdentifier]),
            query(updatesQuery, [id])
        ]);

        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const issue = issueResult.rows[0];
        const updates = updatesResult.rows;

        res.json({ issue, updates });
    } catch (error) {
        console.error('Error fetching issue:', error);
        res.status(500).json({ error: 'Failed to fetch issue' });
    }
});

// POST /api/issues - Submit new issue
router.post('/', upload.single('attachment'), async (req, res) => {
    try {
        // Validate input
        const { error, value } = issueSchema.validate(req.body);
        if (error) {
            // Clean up uploaded file if validation fails
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.details.map(d => d.message)
            });
        }

        const {
            title,
            description,
            category,
            location,
            issue_type,
            is_anonymous,
            submitter_name,
            submitter_email,
            submitter_contact
        } = value;

        // Generate secure update token
        const secureUpdateToken = uuidv4();

        // Insert issue into database
        const insertQuery = `
            INSERT INTO issues (
                title, description, category, location, issue_type, 
                is_anonymous, submitter_name, submitter_email, submitter_contact,
                secure_update_token, attachment_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, created_at
        `;

        const values = [
            title,
            description,
            category,
            location,
            issue_type,
            is_anonymous,
            is_anonymous ? null : submitter_name,
            is_anonymous ? null : submitter_email,
            submitter_contact,
            secureUpdateToken,
            req.file ? req.file.filename : null
        ];

        const result = await query(insertQuery, values);
        const issueId = result.rows[0].id;

        // Assign to FDP division and send notification
        try {
            const division = await assignFDPDivision(issue_type, location);
            if (division) {
                await notifyFDPDivision(division.email, {
                    id: issueId,
                    title,
                    description,
                    category,
                    location,
                    secureUpdateToken
                });
            }
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            message: 'Issue submitted successfully',
            issueId,
            status: 'pending_approval'
        });

    } catch (error) {
        // Clean up uploaded file if there's an error
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        
        console.error('Error submitting issue:', error);
        res.status(500).json({ error: 'Failed to submit issue' });
    }
});

// GET /api/issues/admin/pending - Get pending issues for admin approval
router.get('/admin/pending', authenticateAdmin, async (req, res) => {
    try {
        const pendingQuery = `
            SELECT 
                id, title, description, category, location, issue_type,
                is_anonymous, submitter_name, submitter_email, created_at,
                attachment_path
            FROM issues
            WHERE approved_at IS NULL
            ORDER BY created_at ASC
        `;

        const result = await query(pendingQuery);
        res.json({ issues: result.rows });
    } catch (error) {
        console.error('Error fetching pending issues:', error);
        res.status(500).json({ error: 'Failed to fetch pending issues' });
    }
});

// POST /api/issues/admin/:id/approve - Approve an issue
router.post('/admin/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const approveQuery = `
            UPDATE issues 
            SET approved_at = CURRENT_TIMESTAMP, admin_notes = $2
            WHERE id = $1 AND approved_at IS NULL
            RETURNING id, title
        `;

        const result = await query(approveQuery, [id, notes]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found or already approved' });
        }

        res.json({ message: 'Issue approved successfully' });
    } catch (error) {
        console.error('Error approving issue:', error);
        res.status(500).json({ error: 'Failed to approve issue' });
    }
});

// DELETE /api/issues/admin/:id/reject - Reject an issue
router.delete('/admin/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get issue details first to clean up file
        const issueQuery = `SELECT attachment_path FROM issues WHERE id = $1`;
        const issueResult = await query(issueQuery, [id]);

        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const attachmentPath = issueResult.rows[0].attachment_path;

        // Mark the issue as rejected
        const rejectQuery = `UPDATE issues SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP WHERE id = $1`;
        await query(rejectQuery, [id]);

        // Clean up attachment file if exists
        if (attachmentPath) {
            const filePath = path.join(__dirname, '../uploads', attachmentPath);
            await fs.unlink(filePath).catch(() => {}); // Ignore errors
        }

        res.json({ message: 'Issue rejected and marked as rejected' });
    } catch (error) {
        console.error('Error rejecting issue:', error);
        res.status(500).json({ error: 'Failed to reject issue' });
    }
});

module.exports = router; 