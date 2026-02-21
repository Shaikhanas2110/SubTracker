# SubTracker - Subscription Management System
(https://via.placeholder.com/200x80/3b82f6/ffffff?text=SubTracker)

## 📋 Overview

SubTracker is a comprehensive subscription management system designed to help users track, manage, and optimize their recurring payments. Built with modern web technologies, it provides an intuitive dashboard for monitoring active subscriptions, upcoming payments, and account settings.

### 🎯 Key Features

- **Dashboard Overview**: Real-time statistics and quick access to all features
- **Subscription Management**: Add, edit, and cancel subscriptions
- **Payment Tracking**: Calendar and list views for upcoming payments
- **Smart Notifications**: Email and in-app reminders for due payments
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Data Export**: CSV export functionality for payment history
- **Settings Management**: Customizable preferences and account settings

## 🚀 Live Demo

- **Homepage**: [index.html](./index.html)
- **Dashboard**: [dashboard.html](./dashboard.html)
- **Authentication**: [auth.html](./auth.html)
- **Upcoming Payments**: [upcoming-payments.html](./upcoming-payments.html)
- **Settings**: [settings.html](./settings.html)

### Demo Credentials
- **Email**: demo@subtracker.com
- **Password**: demo123

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality and API integration
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography

### Backend Integration Ready
- **MongoDB**: Database schema and connection setup
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **RESTful APIs**: Structured API endpoints

### Design System
- **Responsive Design**: Mobile-first approach
- **CSS Custom Properties**: Consistent theming
- **Component-based Architecture**: Reusable UI components
- **Accessibility**: WCAG 2.1 compliant

## 📁 Project Structure

\`\`\`
subtracker/
├── index.html                 # Landing page
├── dashboard.html             # Main dashboard
├── auth.html                  # Login/Registration
├── upcoming-payments.html     # Payment calendar & list
├── settings.html              # User settings & preferences
├── styles.css                 # Dashboard styles
├── auth.css                   # Authentication styles
├── upcoming-payments.css      # Payment page styles
├── settings.css               # Settings page styles
├── home.css                   # Landing page styles
├── script.js                  # Dashboard functionality
├── auth.js                    # Authentication logic
├── upcoming-payments.js       # Payment management
├── settings-mobile.js         # Mobile settings interactions
├── upcoming-payments-mobile.js # Mobile payment interactions
├── home.js                    # Landing page interactions
├── scripts/
│   └── mongodb-setup.js       # Database initialization
├── api/
│   └── payments.js            # API endpoints
└── README.md                  # Project documentation
\`\`\`

## 🔧 Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (v14 or higher) - for backend integration
- MongoDB (v4.4 or higher) - for data persistence

### Quick Start (Frontend Only)

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/subtracker.git
   cd subtracker
   \`\`\`

2. **Open in browser**
   \`\`\`bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx serve .
   
   # Or simply open index.html in your browser
   \`\`\`

3. **Access the application**
   - Open `http://localhost:8000` in your browser
   - Or directly open `index.html` file

### Full Setup (With Backend)

1. **Install dependencies**
   \`\`\`bash
   npm install express mongodb cors dotenv
   \`\`\`

2. **Set up MongoDB**
   \`\`\`bash
   # Start MongoDB service
   mongod
   
   # Run database setup script
   node scripts/mongodb-setup.js
   \`\`\`

3. **Configure environment variables**
   \`\`\`bash
   # Create .env file
   echo "MONGODB_URI=mongodb://localhost:27017/subtracker" > .env
   echo "PORT=5000" >> .env
   \`\`\`

4. **Start the server**
   \`\`\`bash
   node server.js
   \`\`\`

## 📱 Screenshots

### 🏠 Landing Page
![Landing Page](https://via.placeholder.com/800x500/f8fafc/1e293b?text=SubTracker+Landing+Page)
*Clean, modern landing page with feature highlights and call-to-action*

### 📊 Dashboard
![Dashboard](https://via.placeholder.com/800x500/3b82f6/ffffff?text=Dashboard+Overview)
*Comprehensive dashboard with statistics, quick actions, and subscription overview*

### 🔐 Authentication
![Authentication](https://via.placeholder.com/800x500/8b5cf6/ffffff?text=Login+%26+Registration)
*Secure authentication system with form validation and demo account*

### 📅 Upcoming Payments
![Upcoming Payments](https://via.placeholder.com/800x500/10b981/ffffff?text=Payment+Calendar)
*Calendar and list views for tracking upcoming subscription payments*

### ⚙️ Settings
![Settings](https://via.placeholder.com/800x500/f59e0b/ffffff?text=User+Settings)
*Comprehensive settings panel for account management and preferences*

### 📱 Mobile Responsive
![Mobile View](https://via.placeholder.com/400x700/6366f1/ffffff?text=Mobile+Responsive)
*Fully responsive design optimized for mobile devices*

## 🎨 Design Features

### Color Palette
- **Primary Blue**: `#3b82f6` - Main brand color
- **Primary Purple**: `#8b5cf6` - Secondary accent
- **Success Green**: `#10b981` - Success states
- **Warning Orange**: `#f59e0b` - Alerts and warnings
- **Text Dark**: `#1e293b` - Primary text
- **Text Light**: `#64748b` - Secondary text

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Responsive scaling**: Fluid typography system

### Components
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Multiple variants with loading states
- **Forms**: Comprehensive validation and feedback
- **Modals**: Accessible overlay dialogs
- **Navigation**: Responsive with mobile hamburger menu

## 🔧 API Endpoints

### Authentication
\`\`\`javascript
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/logout
\`\`\`

### Subscriptions
\`\`\`javascript
GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/:id
DELETE /api/subscriptions/:id
\`\`\`

### Payments
\`\`\`javascript
GET  /api/payments/upcoming
POST /api/payments/:id/mark-paid
GET  /api/payments/export
\`\`\`

### User Settings
\`\`\`javascript
GET  /api/user/profile
PUT  /api/user/profile
PUT  /api/user/preferences
\`\`\`

## 📊 Database Schema

### Users Collection
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  preferences: {
    currency: String,
    notifications: Boolean,
    theme: String
  },
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### Subscriptions Collection
\`\`\`javascript
{
  _id: ObjectId,
  userId: ObjectId,
  serviceName: String,
  amount: Number,
  currency: String,
  billingCycle: String,
  nextPaymentDate: Date,
  category: String,
  status: String,
  color: String,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Stateless authentication tokens
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API endpoint protection
- **XSS Prevention**: Content Security Policy headers

## 📱 Mobile Features

- **Responsive Navigation**: Hamburger menu with slide-out drawer
- **Touch Interactions**: Optimized for touch devices
- **Swipe Gestures**: Calendar navigation and list interactions
- **Haptic Feedback**: Native device feedback integration
- **Offline Support**: Service worker for basic offline functionality

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Dashboard data loading and display
- [ ] Subscription CRUD operations
- [ ] Payment calendar functionality
- [ ] Settings form validation
- [ ] Mobile responsive behavior
- [ ] Cross-browser compatibility

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

### Static Hosting (Netlify/Vercel)
\`\`\`bash
# Build command (if using build tools)
npm run build

# Deploy directory
./
\`\`\`

### Server Deployment (Heroku/DigitalOcean)
\`\`\`bash
# Procfile
web: node server.js

# Environment variables
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow semantic HTML structure
- Use CSS custom properties for theming
- Implement responsive design patterns
- Add proper ARIA labels for accessibility
- Write clean, documented JavaScript
- Test across multiple browsers and devices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** - Icon library
- **Google Fonts** - Typography (Inter font family)
- **Unsplash** - Placeholder images
- **MongoDB** - Database technology
- **Vercel** - Deployment platform inspiration

## 📞 Support

For support, email support@subtracker.com or create an issue in the GitHub repository.

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Complete dashboard implementation
- ✅ User authentication system
- ✅ Subscription management
- ✅ Payment tracking and calendar
- ✅ Responsive mobile design
- ✅ Settings and preferences
- ✅ Data export functionality

### Planned Features (v1.1.0)
- 🔄 Real-time notifications
- 🔄 Advanced analytics dashboard
- 🔄 Subscription recommendations
- 🔄 Multi-currency support
- 🔄 Dark mode theme
- 🔄 API integrations with popular services

---

**Built with ❤️ by the SubTracker Team**

*Last updated: December 2024*
#   S u b T r a c k e r  
 #   S u b s c r i p t i o n T r a c k e r  
 