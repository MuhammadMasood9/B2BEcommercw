import { db } from './server/db.ts';
import { users } from './shared/schema.ts';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    console.log('Checking for existing admin user...');

    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      console.log('User details:', {
        id: existingAdmin[0].id,
        email: existingAdmin[0].email,
        role: existingAdmin[0].role,
        isActive: existingAdmin[0].isActive
      });
      return;
    }

    console.log('Creating admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const newAdmin = await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log('Admin user created successfully:', {
      id: newAdmin[0].id,
      email: newAdmin[0].email,
      role: newAdmin[0].role
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();