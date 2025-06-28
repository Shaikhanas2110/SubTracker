import express from "express";
import { body, param, validationResult } from "express-validator";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/subscriptions
// @desc    Get all subscriptions for user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const activeSubscriptions = user.subscriptions.filter(
      (sub) => sub.isActive
    );

    res.json({ subscriptions: activeSubscriptions });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/subscriptions
// @desc    Add new subscription
// @access  Private
router.post(
  "/",
  [
    auth,
    body("serviceName")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Service name is required and must be less than 100 characters"
      ),
    body("cost")
      .isFloat({ min: 0, max: 10000 })
      .withMessage("Cost must be a positive number less than 10,000"),
    body("billingCycle")
      .isIn(["weekly", "monthly", "quarterly", "yearly"])
      .withMessage("Invalid billing cycle"),
    body("category")
      .isIn([
        "streaming",
        "productivity",
        "design",
        "development",
        "fitness",
        "music",
        "news",
        "other",
      ])
      .withMessage("Invalid category"),
    body("nextPaymentDate").isISO8601().withMessage("Invalid date format"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      const {
        serviceName,
        cost,
        billingCycle,
        category,
        nextPaymentDate,
        description,
      } = req.body;

      // Validate next payment date is not in the past
      const paymentDate = new Date(nextPaymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (paymentDate < today) {
        return res
          .status(400)
          .json({ message: "Next payment date cannot be in the past" });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newSubscription = {
        serviceName,
        cost,
        billingCycle,
        category,
        nextPaymentDate,
        description: description || "",
      };

      user.subscriptions.push(newSubscription);
      await user.save();

      const addedSubscription =
        user.subscriptions[user.subscriptions.length - 1];

      res.status(201).json({
        message: "Subscription added successfully",
        subscription: addedSubscription,
      });
    } catch (error) {
      console.error("Add subscription error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
// @access  Private
router.put(
  "/:id",
  [
    auth,
    param("id").isMongoId().withMessage("Invalid subscription ID"),
    body("serviceName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Service name must be between 1 and 100 characters"),
    body("cost")
      .optional()
      .isFloat({ min: 0, max: 10000 })
      .withMessage("Cost must be a positive number less than 10,000"),
    body("billingCycle")
      .optional()
      .isIn(["weekly", "monthly", "quarterly", "yearly"])
      .withMessage("Invalid billing cycle"),
    body("category")
      .optional()
      .isIn([
        "streaming",
        "productivity",
        "design",
        "development",
        "fitness",
        "music",
        "news",
        "other",
      ])
      .withMessage("Invalid category"),
    body("nextPaymentDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      // Validate next payment date if provided
      if (req.body.nextPaymentDate) {
        const paymentDate = new Date(req.body.nextPaymentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (paymentDate < today) {
          return res
            .status(400)
            .json({ message: "Next payment date cannot be in the past" });
        }
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = user.subscriptions.id(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Update subscription fields
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          subscription[key] = req.body[key];
        }
      });

      await user.save();

      res.json({
        message: "Subscription updated successfully",
        subscription,
      });
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/subscriptions/:id
// @desc    Delete subscription
// @access  Private
router.delete(
  "/:id",
  [auth, param("id").isMongoId().withMessage("Invalid subscription ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = user.subscriptions.id(req.params.id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      subscription.isActive = false;
      await user.save();

      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Delete subscription error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/subscriptions/stats
// @desc    Get subscription statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const activeSubscriptions = user.subscriptions.filter(
      (sub) => sub.isActive
    );

    const stats = {
      totalSubscriptions: activeSubscriptions.length,
      monthlyCost: 0,
      yearlyCost: 0,
      nextPayment: null,
    };

    // Calculate costs and find next payment
    let nextPaymentDate = null;

    activeSubscriptions.forEach((sub) => {
      // Calculate monthly equivalent
      let monthlyEquivalent = 0;
      switch (sub.billingCycle) {
        case "weekly":
          monthlyEquivalent = sub.cost * 4.33;
          break;
        case "monthly":
          monthlyEquivalent = sub.cost;
          break;
        case "quarterly":
          monthlyEquivalent = sub.cost / 3;
          break;
        case "yearly":
          monthlyEquivalent = sub.cost / 12;
          break;
      }

      stats.monthlyCost += monthlyEquivalent;

      // Find next payment
      if (!nextPaymentDate || sub.nextPaymentDate < nextPaymentDate) {
        nextPaymentDate = sub.nextPaymentDate;
      }
    });

    stats.yearlyCost = stats.monthlyCost * 12;

    if (nextPaymentDate) {
      const today = new Date();
      const diffTime = new Date(nextPaymentDate) - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      stats.nextPayment = diffDays;
    }

    res.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
