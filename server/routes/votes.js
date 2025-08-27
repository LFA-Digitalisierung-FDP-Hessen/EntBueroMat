const express = require('express');
const crypto = require('crypto');
const { query } = require('../database/db');

const router = express.Router();

// Create user identifier for anonymous voting
function createUserIdentifier(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
}

// POST /api/votes/:issueId - Vote for an issue (like)
router.post('/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const userIdentifier = createUserIdentifier(req);
        
        // Check if issue exists and is approved
        const issueQuery = 'SELECT id FROM issues WHERE id = $1 AND approved_at IS NOT NULL';
        const issueResult = await query(issueQuery, [issueId]);
        
        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        // Check if user has already voted
        const existingVoteQuery = 'SELECT id FROM votes WHERE issue_id = $1 AND user_identifier = $2';
        const existingVote = await query(existingVoteQuery, [issueId, userIdentifier]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ error: 'You have already voted for this issue' });
        }
        
        // Insert vote
        const insertVoteQuery = 'INSERT INTO votes (issue_id, user_identifier) VALUES ($1, $2) RETURNING id';
        await query(insertVoteQuery, [issueId, userIdentifier]);
        
        // Get updated vote count
        const countQuery = 'SELECT COUNT(*) as vote_count FROM votes WHERE issue_id = $1';
        const countResult = await query(countQuery, [issueId]);
        const voteCount = parseInt(countResult.rows[0].vote_count);
        
        res.status(201).json({ 
            message: 'Vote recorded successfully',
            voteCount
        });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// DELETE /api/votes/:issueId - Remove vote for an issue (unlike)
router.delete('/:issueId', async (req, res) => {
    try {
        const { issueId } = req.params;
        const userIdentifier = createUserIdentifier(req);
        
        // Check if issue exists
        const issueQuery = 'SELECT id FROM issues WHERE id = $1 AND approved_at IS NOT NULL';
        const issueResult = await query(issueQuery, [issueId]);
        
        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        // Delete vote
        const deleteVoteQuery = 'DELETE FROM votes WHERE issue_id = $1 AND user_identifier = $2 RETURNING id';
        const deleteResult = await query(deleteVoteQuery, [issueId, userIdentifier]);
        
        if (deleteResult.rows.length === 0) {
            return res.status(400).json({ error: 'No vote found to remove' });
        }
        
        // Get updated vote count
        const countQuery = 'SELECT COUNT(*) as vote_count FROM votes WHERE issue_id = $1';
        const countResult = await query(countQuery, [issueId]);
        const voteCount = parseInt(countResult.rows[0].vote_count);
        
        res.json({ 
            message: 'Vote removed successfully',
            voteCount
        });
    } catch (error) {
        console.error('Error removing vote:', error);
        res.status(500).json({ error: 'Failed to remove vote' });
    }
});

// GET /api/votes/:issueId/status - Check if user has voted and get vote count
router.get('/:issueId/status', async (req, res) => {
    try {
        const { issueId } = req.params;
        const userIdentifier = createUserIdentifier(req);
        
        // Check if issue exists
        const issueQuery = 'SELECT id FROM issues WHERE id = $1 AND approved_at IS NOT NULL';
        const issueResult = await query(issueQuery, [issueId]);
        
        if (issueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        // Check if user has voted
        const userVoteQuery = 'SELECT id FROM votes WHERE issue_id = $1 AND user_identifier = $2';
        const userVoteResult = await query(userVoteQuery, [issueId, userIdentifier]);
        const hasVoted = userVoteResult.rows.length > 0;
        
        // Get total vote count
        const countQuery = 'SELECT COUNT(*) as vote_count FROM votes WHERE issue_id = $1';
        const countResult = await query(countQuery, [issueId]);
        const voteCount = parseInt(countResult.rows[0].vote_count);
        
        res.json({
            hasVoted,
            voteCount
        });
    } catch (error) {
        console.error('Error getting vote status:', error);
        res.status(500).json({ error: 'Failed to get vote status' });
    }
});

module.exports = router; 