import express from 'express';
import User from '../models/User.js';  // Assuming payments are in User's subscriptions array
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/payments/upcoming
 * Query: days=N (default 30)
 * Returns: upcoming payments within N days
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Filter subscriptions
    const upcomingPayments = user.subscriptions
      .filter(sub => 
        sub.isActive &&
        new Date(sub.nextPaymentDate) >= today &&
        new Date(sub.nextPaymentDate) <= futureDate
      )
      .map(sub => ({
        _id: sub._id,
        serviceName: sub.serviceName,
        amount: sub.cost,
        currency: "USD",  // or pull from your data model if available
        nextPaymentDate: sub.nextPaymentDate,
        billingCycle: sub.billingCycle,
        category: sub.category,
        status: sub.isActive ? 'active' : 'inactive',
        color: '#0078D4'  // You could assign colors by category if needed
      }));

    res.json(upcomingPayments);
  } catch (err) {
    console.error("❌ Error fetching upcoming payments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
