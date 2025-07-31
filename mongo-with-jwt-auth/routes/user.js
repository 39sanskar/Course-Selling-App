// routes/user.js (Corrected)

const { Router } = require("express");
const router = Router();
const userMiddleware = require("../middleware/user");
const { User, Course, PurchasedCourses } = require("../db");
const { JWT_SECRET } = require("../config");
const { authSchema } = require("../types"); 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// User Signup
router.post('/signup', async (req, res) => {
  const validationResult = authSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors });
  }

  const { username, password } = validationResult.data;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }
    
    // CHANGE: Removed manual password hashing. Let the Mongoose 'pre-save' hook handle it.
    await User.create({ username, password });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("User Signup Error:", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
});

// User Signin
router.post('/signin', async (req, res) => {
  const validationResult = authSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: "Invalid input format", errors: validationResult.error.flatten().fieldErrors });
  }

  const { username, password } = validationResult.data;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const token = jwt.sign(
      { username: user.username, type: 'user', id: user._id }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return res.status(200).json({ message: "Login successful", token });

  } catch (error) {
    console.error("User Signin Error:", error);
    res.status(500).json({ message: "Internal server error during signin" });
  }
});

// Get all available courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ published: true });
        return res.status(200).json({ courses });
    } catch (error) {
        res.status(500).json({ message: "Could not fetch courses" });
    }
});

// Purchase a course
router.post('/courses/:courseId', userMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id; // Get user ID from middleware token payload

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: "Invalid course ID format" });
  }
  
  try {
    // 1. Find the course to ensure it exists and get its price
    const course = await Course.findOne({ _id: courseId, published: true });
    if (!course) {
      return res.status(404).json({ message: "Course not found or is not available" });
    }

    // 2. Check if the user has already purchased this course
    const existingPurchase = await PurchasedCourses.findOne({ user: userId, course: courseId });
    if (existingPurchase) {
        return res.status(409).json({ message: "You have already purchased this course" });
    }

    // 3. Create a new purchase record in the `PurchasedCourses` collection
    const newPurchase = new PurchasedCourses({
        user: userId,
        course: courseId,
        priceAtPurchase: course.price
    });
    await newPurchase.save();

    return res.status(200).json({ message: "Course purchased successfully" });

  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ message: "An error occurred while purchasing the course" });
  }
});

// Get purchased courses
router.get('/purchasedCourses', userMiddleware, async (req, res) => {
  const userId = req.user.id; // Get user ID from middleware token payload

  try {
    // 1. Find all purchase records for this user in the `PurchasedCourses` collection.
    // 2. Use .populate('course') to fetch the full details of each linked course.
    const purchases = await purchasedCourses.find({ user: userId }).populate('course');
    
    // 3. Extract just the course objects from the purchase records for a clean response.
    const purchasedCourses = purchases.map(p => p.course);

    return res.status(200).json({
      purchasedCourses: purchasedCourses || []
    });
  } catch (error) {
    console.error("Fetch Purchased Courses Error:", error);
    res.status(500).json({ message: "Could not fetch purchased courses" });
  }
});

module.exports = router;