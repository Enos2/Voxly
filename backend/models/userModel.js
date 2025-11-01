import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    role: {
      type: String,
      enum: ["listener", "artist", "admin"], // ✅ "artist" replaces "creator"
      default: "listener",
    },
    status: {
      type: String,
      enum: ["active", "deactivated", "suspended", "banned"],
      default: "active",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 💰 Creator / Artist stats
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalHoursStreamed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ──────────────────────────────────────────────
 🔐 Hash password before saving
────────────────────────────────────────────── */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ──────────────────────────────────────────────
 🔑 Compare password during login
────────────────────────────────────────────── */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* ──────────────────────────────────────────────
 🧹 Clean JSON output (hide password, __v)
────────────────────────────────────────────── */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

/* ──────────────────────────────────────────────
 🧠 Auto-convert legacy "creator" → "artist"
────────────────────────────────────────────── */
userSchema.pre("save", function (next) {
  if (this.role === "creator") this.role = "artist";
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
