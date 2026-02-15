// Quick seed - Run this to create initial roles
// Usage: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Define Role schema inline (avoid import issues)
    const roleSchema = new mongoose.Schema({
      role_name: { type: String, required: true, unique: true },
      created_at: { type: Date, default: Date.now }
    });
    
    const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

    // Check existing roles
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log('\n✓ Roles already exist:');
      existingRoles.forEach(role => {
        console.log(`  - ${role.role_name}: ${role._id}`);
      });
      await mongoose.connection.close();
      return;
    }

    // Create roles
    console.log('\nCreating default roles...');
    const roles = await Role.insertMany([
      { role_name: 'student' },
      { role_name: 'warden' },
      { role_name: 'admin' }
    ]);

    console.log('\n✅ Roles created successfully!\n');
    console.log('📋 Copy these Role IDs:\n');
    roles.forEach(role => {
      console.log(`   ${role.role_name.toUpperCase()}: ${role._id}`);
    });
    console.log('\n💡 Use the STUDENT role ID in your frontend registration page\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
