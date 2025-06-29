# SubTracker Setup Guide

## 🚀 Quick Start Guide

### Option 1: View Static Files (Recommended for Demo)

1. **Download the project files**
2. **Open `index.html` in your web browser**
3. **Navigate through the application**:
   - Click "Get Started Free" or "View Demo"
   - Use demo credentials: `demo@subtracker.com` / `demo123`
   - Explore all features in demo mode

### Option 2: Local Server Setup

1. **Using Python (if installed)**:
   \`\`\`bash
   cd subtracker
   python -m http.server 8000
   # Open http://localhost:8000
   \`\`\`

2. **Using Node.js (if installed)**:
   \`\`\`bash
   cd subtracker
   npx serve .
   # Open http://localhost:5000
   \`\`\`

3. **Using PHP (if installed)**:
   \`\`\`bash
   cd subtracker
   php -S localhost:8000
   # Open http://localhost:8000
   \`\`\`

## 🔧 Full Development Setup

### Prerequisites
\`\`\`bash
# Check if you have Node.js installed
node --version

# Check if you have MongoDB installed
mongod --version
\`\`\`

### Installation Steps

1. **Clone or download the project**
2. **Install Node.js dependencies** (optional for backend):
   \`\`\`bash
   npm init -y
   npm install express mongodb cors dotenv bcryptjs jsonwebtoken
   \`\`\`

3. **Set up MongoDB** (optional for data persistence):
   \`\`\`bash
   # Start MongoDB
   mongod
   
   # In another terminal, run setup script
   node scripts/mongodb-setup.js
   \`\`\`

4. **Create environment file** (optional):
   \`\`\`bash
   # Create .env file
   MONGODB_URI=mongodb://localhost:27017/subtracker
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   \`\`\`

## 📱 Testing on Different Devices

### Desktop Testing
- Open in Chrome, Firefox, Safari, Edge
- Test responsive breakpoints by resizing window
- Verify all interactive elements work

### Mobile Testing
- Use browser developer tools device simulation
- Test on actual mobile devices if available
- Verify touch interactions and mobile navigation

## 🎯 Feature Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login with demo credentials
- [ ] Form validation works
- [ ] Password visibility toggle

### Dashboard
- [ ] Statistics display correctly
- [ ] Cards are interactive
- [ ] Navigation works
- [ ] Success message appears and disappears

### Upcoming Payments
- [ ] Payment list loads
- [ ] Calendar view works
- [ ] Filters function properly
- [ ] Modal details open correctly

### Settings
- [ ] Form fields are editable
- [ ] Toggle switches work
- [ ] Save functionality (demo mode)
- [ ] Mobile responsive layout

### Mobile Navigation
- [ ] Hamburger menu opens/closes
- [ ] All navigation links work
- [ ] User info displays in mobile menu
- [ ] Touch interactions feel responsive

## 🐛 Troubleshooting

### Common Issues

1. **Styles not loading**:
   - Ensure all CSS files are in the same directory
   - Check browser console for 404 errors
   - Verify file paths in HTML

2. **JavaScript not working**:
   - Check browser console for errors
   - Ensure all JS files are properly linked
   - Verify Font Awesome CDN is loading

3. **Mobile menu not working**:
   - Check if mobile JavaScript files are loaded
   - Verify screen size detection
   - Test touch events

4. **Database connection issues**:
   - Ensure MongoDB is running
   - Check connection string in environment variables
   - Verify database permissions

## 📊 Performance Optimization

### Loading Speed
- All CSS and JS files are optimized
- Images use appropriate formats and sizes
- CDN resources load from reliable sources

### Mobile Performance
- Touch interactions are optimized
- Animations use CSS transforms
- Minimal JavaScript execution on mobile

## 🔒 Security Notes

### Demo Mode Security
- Demo credentials are for testing only
- No real data is stored or transmitted
- All operations are simulated client-side

### Production Security
- Implement proper authentication
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting

## 📞 Getting Help

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify file structure** matches the documentation
3. **Test in different browsers** to isolate issues
4. **Check network tab** for failed resource loads

## 🎉 Success Indicators

You'll know the setup is working when:
- ✅ Landing page loads with proper styling
- ✅ Navigation between pages works smoothly
- ✅ Demo login credentials work
- ✅ Dashboard shows sample data
- ✅ Mobile navigation menu functions
- ✅ All interactive elements respond to clicks/touches

---

**Need more help?** Check the main README.md file for detailed documentation.
