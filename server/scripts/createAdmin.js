require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123', // Change this!
      role: 'admin'
    });

    // Create admin profile
    await Admin.create({
      user: adminUser._id,
      permissions: ['manage_users', 'manage_tutors', 'manage_sessions', 'view_reports', 'manage_verifications']
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createInitialAdmin();
