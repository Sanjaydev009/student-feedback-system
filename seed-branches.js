// This script seeds some sample branch data by updating existing users
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './backend/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/feedback-system')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple User model based on your existing schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  branch: String,
  department: String
});

const User = mongoose.model('User', UserSchema);

// Sample branch data
const branches = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Information Technology',
  'MCA Regular',
  'MCA DS',
  'MBA Finance',
  'MBA Marketing'
];

// Function to assign branches to existing users
async function seedBranches() {
  try {
    // Get all users
    const users = await User.find();
    
    if (users.length === 0) {
      console.log('No users found to update with branch data');
      return;
    }
    
    console.log(`Found ${users.length} users to potentially update with branch data`);
    
    let updatedCount = 0;
    
    // Assign random branches to users without a branch
    for (const user of users) {
      if (!user.branch) {
        const randomBranch = branches[Math.floor(Math.random() * branches.length)];
        user.branch = randomBranch;
        await user.save();
        updatedCount++;
        console.log(`Updated user ${user.name} (${user.email}) with branch: ${randomBranch}`);
      }
    }
    
    console.log(`Updated ${updatedCount} users with branch data`);
    
    // Create a HOD for each branch if not exists
    for (const branch of branches) {
      const hodExists = await User.findOne({ role: 'hod', branch });
      
      if (!hodExists) {
        const branchCode = branch.split(' ').map(word => word[0]).join('').toUpperCase();
        const newHod = new User({
          name: `${branch} HOD`,
          email: `hod.${branchCode.toLowerCase()}@example.com`,
          password: '$2b$10$3lRFN1NP2qXhRrWqtvsMUOhZvCVw2WNSO/Zi7A84ioEVeJjJD.LKe', // hashed 'password123'
          role: 'hod',
          branch: branch
        });
        
        await newHod.save();
        console.log(`Created new HOD for ${branch}: ${newHod.email}`);
      }
    }
    
    console.log('Branch data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding branch data:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

seedBranches();
