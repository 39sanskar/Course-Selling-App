// db/index.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- 1. Database Connection Function ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

// --- 2. Schema Definitions ---

/**
 * Admin Schema
 * For users who can create and manage courses.
 */
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, { timestamps: true });

// Pre-save hook to automatically hash admin passwords before saving.
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * User Schema
 * For regular users who can browse and purchase courses.
 * NOTE: The 'purchasedCourses' array has been removed from this schema.
 * The relationship is now managed by the dedicated 'PurchasedCourses' model,
 * which is a more scalable and flexible approach.
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Pre-save hook to automatically hash user passwords before saving.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Course Schema
 * Represents a course that can be sold on the platform.
 */
const CourseSchema = new mongoose.Schema({
  title: { 
    type: String,
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    required: true,
    trim: true
  },
  imageLink: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^https?:\/\/[^\s]+$/.test(v),
      message: props => `${props.value} is not a valid URL!`
    }
  },  
  price: { 
    type: Number,
    required: true,
    min: 0 },
  published: { 
    type: Boolean, 
    default: true 
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

/**
 * PurchasedCourses Schema (The "Join" or "Linking" Model)
 * This model creates a new document for every single purchase,
 * linking a User to a Course. This is how you track who bought what.
 */
const PurchasedCoursesSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true 
  },
  purchasedAt: { 
    type: Date,
    default: Date.now 
  },
  // It's good practice to store the price at the time of purchase
  priceAtPurchase: { 
    type: Number, 
    required: true 
  },
  transactionId: { 
    type: String,
    unique: true, 
    sparse: true 
  } // Optional, for payment gateway tracking
}, { 
  timestamps: true,
  // Add a compound unique index to prevent a user from buying the same course more than once.
  indexes: [
    { unique: true, fields: ['user', 'course'] }
  ]
});


// --- 3. Model Creation ---
// Mongoose creates collections with plural, lowercase names by default from these models.
// e.g., 'admins', 'users', 'courses', 'purchasedcourses'
const Admin = mongoose.model('Admin', AdminSchema);
const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);
const PurchasedCourses = mongoose.model('PurchasedCourses', PurchasedCoursesSchema);


// --- 4. Exports ---
// Export the connection function and all models for use throughout the application.
module.exports = {
  connectDB,
  Admin,
  User,
  Course,
  PurchasedCourses
};