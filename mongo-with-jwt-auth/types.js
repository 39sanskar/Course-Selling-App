// types.js (Corrected and Enhanced)

const { z } = require("zod");

// Schema for both Admin and User authentication
const authSchema = z.object({
  username: z.string(),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const courseSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  imageLink: z.string(),
  price: z.number().positive({ message: "Price must be a positive number" }),
  published: z.boolean().optional() // Make published optional
});

module.exports = {
  authSchema,
  courseSchema
};