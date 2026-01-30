# 🌱 KISAN AI - Unified Rural Intelligence Platform

## 🚀 Overview
KISAN AI is a comprehensive agricultural intelligence platform that integrates AI, weather data, and computer vision to support farmers from pre-sowing to post-harvest. The platform features 10 integrated AI modules for complete farm management.

## ✨ Features

### 🤖 AI Modules
1. **Crop Recommendation & Yield Prediction** - Suggests best crops based on soil, rainfall, and climate
2. **Plant Disease Detection** - Detects crop diseases from leaf images using Vision AI
3. **Smart Irrigation Recommendation** - Recommends when and how much to irrigate
4. **Weather Risk Alerts** - Heatwave, frost, heavy rain alerts with actionable advice
5. **Market Price Prediction** - Predicts mandi prices (7–30 days ahead)
6. **Post-Harvest Spoilage Prediction** - Predicts shelf life of harvested produce
7. **Voice-Based Farmer Assistant** - Multilingual voice assistant (Hindi, Telugu, English)
8. **Fake Seed & Fertilizer Detection** - Detects authenticity using OCR + Vision AI
9. **Soil Health Scoring & Advisory** - Generates soil health score and regeneration plan
10. **Government Scheme Recommendation** - Suggests eligible government schemes

### 👥 User Management
- **Farmers**: Full access to all AI modules
- **Admins**: User management, API key management, system settings
- **Secure Authentication**: JWT-based authentication with password hashing

### 🔧 Admin Features
- User management (create, edit, delete users)
- Groq API key management
- System settings configuration
- Activity logs monitoring
- Dashboard with system statistics

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- Node.js (for frontend development)
- Groq API key (get from https://console.groq.com)

### Backend Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd kisan-ai/backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize database
python database.py

# 5. Run the application
python run.py
```

### Frontend Setup
The frontend is served directly from the backend. No separate installation needed.

## 📁 Project Structure
```
kisan-ai/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── database.py         # Database initialization
│   ├── models.py           # SQLAlchemy models
│   ├── auth.py             # Authentication service
│   ├── ai_services.py      # Groq AI integration
│   ├── admin_utils.py      # Admin utilities
│   ├── config.py           # Configuration
│   ├── utils.py            # Utility functions
│   ├── run.py              # Application runner
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
├── frontend/
│   ├── index.html          # Main dashboard (modified)
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── admin.html          # Admin panel
│   └── assets/
│       └── style.css       # Additional styles
└── README.md
```

## 🔐 Authentication
### Default Admin Credentials
- **Username**: `admin`
- **Password**: `Admin@12345` (Change immediately!)

### User Roles
1. **Admin**: Full system access, user management, API key management
2. **Farmer**: Access to all AI modules, personal dashboard

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### AI Module Endpoints
- `POST /api/ai/crop-recommendation` - Crop recommendation
- `POST /api/ai/disease-detection` - Disease detection
- `POST /api/ai/voice-assistant` - Voice assistant
- `POST /api/ai/soil-analysis` - Soil health analysis

### Admin Endpoints (Admin role required)
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/api-keys` - API key management
- `GET/PUT /api/admin/settings` - System settings

## 🔧 Configuration

### Environment Variables (.env)
```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-super-secret-key-change

# Database
DATABASE_URL=sqlite:///kisan_ai.db

# Groq AI
GROQ_API_KEY=your-groq-api-key-here

# Admin
ADMIN_INIT_PASSWORD=Admin@12345
```

### Adding Groq API Key
1. Login as admin
2. Navigate to Admin Panel → API Keys
3. Click "Add API Key"
4. Enter your Groq API key
5. Set rate limit and activate

## 🚀 Deployment

### Production Checklist
1. Change all default passwords
2. Set proper environment variables
3. Use PostgreSQL instead of SQLite
4. Enable HTTPS
5. Set up regular backups
6. Configure logging and monitoring
7. Set up firewall rules
8. Implement rate limiting

### Deployment Options
- **Render**: One-click deployment
- **Railway**: Easy Python deployment
- **AWS Elastic Beanstalk**: Scalable deployment
- **Docker**: Containerized deployment

## 📱 Mobile Responsive
The platform is fully responsive and works on:
- Desktop computers
- Tablets
- Smartphones (Android & iOS)

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention
- CORS protection
- File upload validation
- Input sanitization
- Rate limiting ready

## 🐛 Troubleshooting

### Common Issues
1. **Database not initializing**: Check file permissions for `kisan_ai.db`
2. **API calls failing**: Verify Groq API key is added and active
3. **Authentication errors**: Clear browser cache and localStorage
4. **File upload issues**: Check `uploads` folder permissions

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- Groq for providing AI inference capabilities
- Open-Meteo for weather data
- All contributors and testers

## 📞 Support
For support, email: support@kisanai.com
Documentation: https://docs.kisanai.com
Community: https://community.kisanai.com
