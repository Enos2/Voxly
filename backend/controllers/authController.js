import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ✅ Register User (Debug Mode)
export const register = async (req, res) => {
  try {
    console.log("📩 Registration request received:", req.body);

    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      console.log("⚠️ Missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    console.log("👤 Existing user:", existingUser);
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed successfully");

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    console.log("✅ User saved successfully:", newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ✅ Login User (Debug Mode)
export const login = async (req, res) => {
  try {
    console.log("📩 Login request received:", req.body);

    const { email, password } = req.body;
    if (!email || !password) {
      console.log("⚠️ Missing login fields");
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    console.log("🔎 User found:", user);
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match:", isMatch);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("🎟️ Token generated successfully");

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};
