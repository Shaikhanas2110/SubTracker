import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';  // Assuming you have this

const router = express.Router();

// Update profile
router.put('/settings/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update reminder preference
router.put('/settings/reminders', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.remindersEnabled = req.body.remindersEnabled;
    await user.save();
    res.json({ message: `Reminders ${user.remindersEnabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout (token-based example — handled client-side by deleting token)
// Optionally, you can blacklist tokens or clear server sessions depending on auth type

export default router;
