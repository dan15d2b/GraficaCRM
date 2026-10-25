-- Define a senha do admin para "admin@admin.com"
-- Execute: docker exec supabase_db_deskcomm-crm psql -U postgres -d postgres -f scripts/set-admin-password.sql
UPDATE auth.users
SET encrypted_password = '$2b$10$17Wi9VTp7ZLvrZnw9c0DGuU1frpqzNQBLreN.o69ZQMJwkNTjiN56'
WHERE email = 'admin@admin.com';
