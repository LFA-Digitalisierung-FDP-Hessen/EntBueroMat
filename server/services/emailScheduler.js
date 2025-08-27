const cron = require('node-cron');
const { sendWeeklySummaries } = require('./emailService');

// Schedule weekly summary emails every Monday at 9:00 AM
const startEmailScheduler = () => {
    console.log('Starting email scheduler...');
    
    // Every Monday at 9:00 AM (0 9 * * 1)
    cron.schedule('0 9 * * 1', async () => {
        console.log('Running weekly summary email job...');
        try {
            await sendWeeklySummaries();
        } catch (error) {
            console.error('Weekly summary email job failed:', error);
        }
    }, {
        timezone: 'Europe/Berlin'
    });
    
    // Also schedule a test email every hour in development
    if (process.env.NODE_ENV === 'development') {
        cron.schedule('0 * * * *', async () => {
            console.log('Running hourly test summary (development only)...');
            try {
                await sendWeeklySummaries();
            } catch (error) {
                console.error('Test summary email failed:', error);
            }
        });
    }
    
    console.log('Email scheduler initialized successfully');
};

// Initialize the scheduler when the module is loaded
startEmailScheduler();

module.exports = {
    startEmailScheduler
}; 