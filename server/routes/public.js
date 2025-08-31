const express = require('express');
const { query } = require('../database/db');

const router = express.Router();

// GET /api/public/stats - Get public statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            // Total approved issues
            query('SELECT COUNT(*) as total FROM issues WHERE approved_at IS NOT NULL'),
            // Resolved issues
            query('SELECT COUNT(*) as resolved FROM issues WHERE status = \'resolved\' AND approved_at IS NOT NULL'),
            // Total votes
            query('SELECT COUNT(*) as total_votes FROM votes v JOIN issues i ON v.issue_id = i.id WHERE i.approved_at IS NOT NULL'),
            // Issues by category (approved only)
            query(`
                SELECT category, COUNT(*) as count 
                FROM issues 
                WHERE approved_at IS NOT NULL 
                GROUP BY category 
                ORDER BY count DESC
                LIMIT 10
            `),
            // Recent resolved issues
            query(`
                SELECT COUNT(*) as recent_resolved 
                FROM issues 
                WHERE status = 'resolved' 
                AND approved_at IS NOT NULL 
                AND resolved_at >= CURRENT_DATE - INTERVAL '30 days'
            `)
        ]);

        res.json({
            totalIssues: parseInt(stats[0].rows[0].total),
            resolvedIssues: parseInt(stats[1].rows[0].resolved),
            totalVotes: parseInt(stats[2].rows[0].total_votes),
            recentlyResolved: parseInt(stats[4].rows[0].recent_resolved),
            topCategories: stats[3].rows,
            successRate: stats[0].rows[0].total > 0 
                ? Math.round((stats[1].rows[0].resolved / stats[0].rows[0].total) * 100) 
                : 0
        });
    } catch (error) {
        console.error('Error getting public stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// GET /api/public/top-issues - Get top voted issues
router.get('/top-issues', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Create user identifier for vote status
        const crypto = require('crypto');
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        const userIdentifier = crypto.createHash('sha256').update(ip + userAgent).digest('hex');
        
        const topIssuesQuery = `
            SELECT 
                i.id,
                i.title,
                i.description,
                i.category,
                i.location,
                i.status,
                i.created_at,
                i.resolved_at,
                COUNT(v.id) as vote_count,
                CASE WHEN uv.id IS NOT NULL THEN true ELSE false END as has_voted
            FROM issues i
            LEFT JOIN votes v ON i.id = v.issue_id
            LEFT JOIN votes uv ON i.id = uv.issue_id AND uv.user_identifier = $2
            WHERE i.approved_at IS NOT NULL
            GROUP BY i.id, uv.id
            ORDER BY COUNT(v.id) DESC, i.created_at DESC
            LIMIT $1
        `;

        const result = await query(topIssuesQuery, [limit, userIdentifier]);
        
        // Truncate description for preview
        const issues = result.rows.map(issue => ({
            ...issue,
            description: issue.description.length > 200 
                ? issue.description.substring(0, 200) + '...' 
                : issue.description,
            vote_count: parseInt(issue.vote_count)
        }));

        res.json({ issues });
    } catch (error) {
        console.error('Error getting top issues:', error);
        res.status(500).json({ error: 'Failed to get top issues' });
    }
});

// GET /api/public/recent-resolved - Get recently resolved issues
router.get('/recent-resolved', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const resolvedIssuesQuery = `
            SELECT 
                i.id,
                i.title,
                i.description,
                i.category,
                i.location,
                i.resolved_at,
                COUNT(v.id) as vote_count
            FROM issues i
            LEFT JOIN votes v ON i.id = v.issue_id
            WHERE i.status = 'resolved' 
            AND i.approved_at IS NOT NULL
            AND i.resolved_at IS NOT NULL
            GROUP BY i.id
            ORDER BY i.resolved_at DESC
            LIMIT $1
        `;

        const result = await query(resolvedIssuesQuery, [limit]);
        
        // Truncate description for preview
        const issues = result.rows.map(issue => ({
            ...issue,
            description: issue.description.length > 150 
                ? issue.description.substring(0, 150) + '...' 
                : issue.description,
            vote_count: parseInt(issue.vote_count)
        }));

        res.json({ issues });
    } catch (error) {
        console.error('Error getting recent resolved issues:', error);
        res.status(500).json({ error: 'Failed to get resolved issues' });
    }
});

// GET /api/public/categories - Get available categories
router.get('/categories', async (req, res) => {
    try {
        const categories = [
            { value: 'general', label: 'Allgemein', labelEn: 'General' },
            { value: 'construction', label: 'Bauwesen', labelEn: 'Construction' },
            { value: 'healthcare', label: 'Gesundheitswesen', labelEn: 'Healthcare' },
            { value: 'municipal', label: 'Gemeindevorgang', labelEn: 'Municipal' },
            { value: 'taxation', label: 'Steuerwesen', labelEn: 'Taxation' },
            { value: 'education', label: 'Bildung', labelEn: 'Education' },
            { value: 'environment', label: 'Umwelt', labelEn: 'Environment' },
            { value: 'transport', label: 'Verkehr', labelEn: 'Transport' },
            { value: 'business', label: 'Wirtschaft', labelEn: 'Business' },
            { value: 'other', label: 'Sonstiges', labelEn: 'Other' }
        ];

        res.json({ categories });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// GET /api/public/issue-types - Get available issue types
router.get('/issue-types', async (req, res) => {
    try {
        const issueTypes = [
            { value: 'communal', label: 'Kommunal', labelEn: 'Communal' },
            { value: 'state', label: 'Landesebene', labelEn: 'State Level' },
            { value: 'federal', label: 'Bundesebene', labelEn: 'Federal Level' }
        ];

        res.json({ issueTypes });
    } catch (error) {
        console.error('Error getting issue types:', error);
        res.status(500).json({ error: 'Failed to get issue types' });
    }
});

module.exports = router; 