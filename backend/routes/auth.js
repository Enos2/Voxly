import express from "express";

const router = express.Router();

// Dummy user data for testing
let users = [];

// REGISTER route
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = { id: users.length + 1, username, email, password };
  users.push(newUser);

  res.status(201).json({ message: "User registered successfully", user: newUser });
});

// LOGIN route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({ message: "Login successful", user });
});

// TEST route
router.get("/test", (req, res) => {
  res.send("Auth route working!");
});

export default router;
