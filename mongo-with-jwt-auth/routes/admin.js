// routes/admin.js (Final Corrected Version)

const { Router } = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Admin, Course } = require("../db");
const adminMiddleware = require("../middleware/admin");
const { JWT_SECRET } = require("../config");
const { authSchema, courseSchema } = require("../types");

const router = Router();

// --- Admin Signup ---
router.post('/signup', async (req, res) => {
  try {
    const validationResult = authSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: validationResult.error.flatten().fieldErrors
      });
    }

    const { username, password } = validationResult.data;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin with this email already exists' });
    }

    await Admin.create({ username, password });
    res.status(201).json({ message: 'Admin created successfully' });

  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
});

// --- Admin Signin ---
router.post('/signin', async (req, res) => {
  try {
    const validationResult = authSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid input format",
        errors: validationResult.error.flatten().fieldErrors
      });
    }

    const { username, password } = validationResult.data;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const token = jwt.sign(
      { username: admin.username, type: 'admin', id: admin._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });

  } catch (error) {
    console.error("Admin Signin Error:", error);
    res.status(500).json({ message: "An internal server error occurred" });
  }
});

// --- Create Course (Admin Only) ---
router.post('/courses', adminMiddleware, async (req, res) => {
  try {
    const validationResult = courseSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: "Invalid course data",
        errors: validationResult.error.flatten().fieldErrors
      });
    }

    const { title, description, imageLink, price, published } = validationResult.data;
    const adminId = req.user.id;

    const newCourse = await Course.create({
      title,
      description,
      imageLink,
      price,
      published: published ?? true, // fallback to true if not provided
      creator: adminId
    });

    res.status(201).json({
      message: 'Course created successfully',
      courseId: newCourse._id
    });

  } catch (error) {
    console.error("Course Creation Error:", error);
    res.status(500).json({ message: "An error occurred while creating the course" });
  }
});

// --- Get All Courses (Admin Only) ---
router.get('/courses', adminMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({}).populate('creator', 'username -_id');
    res.json({ courses });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    res.status(500).json({ message: "An error occurred while fetching courses" });
  }
});

module.exports = router;
