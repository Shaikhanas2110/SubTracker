import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const subscriptionSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "streaming",
        "productivity",
        "design",
        "development",
        "fitness",
        "music",
        "news",
        "other",
      ],
    },
    nextPaymentDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    lastLogin: {
      type: Date,
      required: true,
    },
    subscriptions: [subscriptionSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    remindersEnabled: {
      type: Boolean,
      default: true, // ✅ New field: Email reminders enabled by default
    },
    preferences: {
      emailReminders: {
        type: Boolean,
        default: true,
      },
      reminderDays: {
        type: Number,
        default: 3,
      },
      weeklyDigest: {
        type: Boolean,
        default: false,
      },
      monthlyReport: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model("User", userSchema);
