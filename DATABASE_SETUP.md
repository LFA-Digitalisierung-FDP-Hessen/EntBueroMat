# Database Setup Instructions

The 500 errors are caused by missing database tables. Follow these steps to fix it:

## Option 1: Quick Fix (Recommended)
Copy and paste the content of `setup-database.sql` into your PostgreSQL database:

1. Connect to the database container:
   ```bash
   docker-compose exec database psql -U entbueromat_user -d entbueromat
   ```

2. Copy the entire content of `setup-database.sql` and paste it into the psql prompt

3. Press Enter to execute

## Option 2: File-based Setup
```bash
# Copy the SQL file into the database container
docker cp setup-database.sql <container_name>:/tmp/setup.sql

# Execute it
docker-compose exec database psql -U entbueromat_user -d entbueromat -f /tmp/setup.sql
```

## Option 3: Restart with Fresh Database
```bash
# Stop containers
docker-compose down

# Remove database volume to start fresh
docker volume rm entbueromat_postgres_data

# Start containers (this will run the init.sql automatically)
docker-compose up -d
```

## Verification
After running the setup, you should see:
- ✅ Issues count: 3
- ✅ Votes count: 6  
- ✅ Divisions count: 5

The 500 errors should disappear and the website should load properly.

## Admin Login
- Username: `admin`
- Password: `admin123`
- URL: `${BASE_URL}/admin` (default is `http://localhost:3000/admin` in development) 