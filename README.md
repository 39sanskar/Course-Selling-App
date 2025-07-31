# Course-Selling-App 

## API Endpoints & Usage Logic.

# How to Use the API
- Here is a breakdown of the core API  endpoints and the logic behind them.

- Note: All protected routes require a JSON Web Token (JWT) to be sent in the request header:
- Authorization: Bearer <your_jwt_token>

# 1. Creating a Course (Admin Only)

- Endpoint: POST /api/admin/courses
- Authorization: Admin role required.
- Request Body: A JSON object   containing the course data

- Example of the course
```json
{
  "title": "React for Beginners",
  "description": "A complete guide to mastering React from scratch.",
  "price": 49.99,
  "imageLink": "https://example.com/image.jpg",
  "published": true
}

```

# Logic:
- The server verifies the user is an admin via the JWT.
- It validates the incoming data (e.g., ensures title and price are present).
- A new course document is created in the database.
- The server responds with the newly created course object and a 201 Created status.

# 2. Getting Courses (Public & Admin)

- Endpoint (For Users): GET /api/users/courses
- Authorization: Publicly accessible.
- Logic:
- This endpoint fetches all courses where the published flag is set to true.
- It returns an array of course objects, allowing potential customers to browse the catalog.
- Endpoint (For Admins): GET /api/admin/courses
- Authorization: Admin role required.
- Logic:
- This endpoint fetches all courses, regardless of their published status.
- This allows admins to see both published and draft courses on their dashboard.

# 3. Purchasing a Course (User Logic)
- This is the core logic for user enrollment.

- Endpoint: POST /api/users/courses/:courseId
- Authorization: User role required.
- Request Body: None. The courseId is passed as a URL parameter.

# 4. Viewing Purchased Courses (User Only)
- Once a user has purchased courses, they need a way to view them.

- Endpoint: GET /api/users/purchasedCourses
- Authorization: User role required.