const bcrypt = require('bcryptjs');
const { query } = require('./database/db');

async function setupDefaultAdmin() {
    try {
        // Check if admin user already exists
        const existingAdmin = await query(
            'SELECT id FROM admin_users WHERE email = $1 OR username = $2', 
            [process.env.ADMIN_EMAIL, process.env.ADMIN_USERNAME]
        );

        if (existingAdmin.rows.length > 0) {
            console.log('✅ Default admin user already exists');
            return;
        }

        // Validate required environment variables
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_USERNAME) {
            console.error('❌ Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME');
            process.exit(1);
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);

        // Create admin user
        const createAdminQuery = `
            INSERT INTO admin_users (username, email, password_hash, role, is_active)
            VALUES ($1, $2, $3, 'admin', true)
            RETURNING id, username, email, role
        `;

        const result = await query(createAdminQuery, [
            process.env.ADMIN_USERNAME,
            process.env.ADMIN_EMAIL,
            passwordHash
        ]);

        const newAdmin = result.rows[0];
        
        console.log('✅ Default admin user created successfully:');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Username: ${newAdmin.username}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Role: ${newAdmin.role}`);
        console.log('');
        console.log('🔐 Login credentials:');
        console.log(`   Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
        console.log('');
        console.log('🚀 You can now login at: /admin/login');

    } catch (error) {
        console.error('❌ Error creating default admin user:', error);
        
        if (error.code === '23505') { // Unique constraint violation
            console.log('ℹ️  Admin user with this email or username already exists');
        } else {
            process.exit(1);
        }
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDefaultAdmin()
        .then(() => {
            console.log('✅ Admin setup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Admin setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupDefaultAdmin }; 