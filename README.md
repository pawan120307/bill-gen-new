# InvoiceForge - AI-Powered Invoice Generator

🚀 **Professional invoice creation with AI-powered voice input support in English & Hindi**

## Features

### ✨ AI-Powered Features
- 🎤 **Voice Input** - Create invoices by speaking in English or Hindi
- 🤖 **Smart AI Processing** - Automatically extract service details and pricing
- 📝 **Auto-completion** - Smart suggestions based on voice input
- 🎨 **Template Suggestions** - AI recommends templates based on content
- 🌍 **Multilingual Support** - English & Hindi voice recognition

### 🔐 Authentication & User Management
- ✅ **User Registration & Login** - JWT-based authentication
- 🔒 **Secure Password Handling** - Bcrypt encryption
- 👤 **User Profiles** - Persistent user sessions
- 🎫 **Token Management** - Automatic token refresh

### 📄 Invoice Management
- 📊 **Professional Templates** - Multiple customizable templates
- 💼 **Customer Management** - Store and reuse customer information
- 🧮 **Automatic Calculations** - Tax, subtotals, and totals
- 📅 **Due Date Management** - Configurable payment terms
- 📋 **Invoice History** - Track all generated invoices

### 🎨 Modern UI/UX
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Performance** - React with optimized components
- 🎭 **Beautiful Animations** - Smooth transitions and effects
- 🎯 **Intuitive Interface** - Easy-to-use design

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT Authentication** - Secure user sessions
- **Speech Recognition** - Google Speech-to-Text
- **Pydantic** - Data validation and serialization

### Frontend
- **React 19** - Latest React with hooks
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

## Quick Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)

### Backend Setup

1. **Navigate to backend and install dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment (.env already set up):**
   ```bash
   # Update backend/.env if needed
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="invoiceforge_db"
   JWT_SECRET_KEY="your-super-secret-jwt-key"
   ```

3. **Start backend server:**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start frontend server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Usage Guide

### 🎤 Voice-Powered Invoice Creation

1. **Register/Login** → Click "Get Started"
2. **Create Invoice** → Select "Voice AI" tab
3. **Choose Language** → English or Hindi
4. **Speak Your Invoice:**
   - **English**: "Create invoice for John Doe, web design services, 500 dollars"
   - **Hindi**: "जॉन डो के लिए चालान बनाएं, वेब डिज़ाइन सेवा, पांच सौ डॉलर"
5. **Review & Edit** → AI extracts data automatically
6. **Select Template** → AI suggests based on content
7. **Create Invoice** → Professional PDF ready!

### 📁 Audio File Upload
- Record voice memo on any device
- Upload audio file (.wav, .mp3, .m4a)
- AI transcribes and processes automatically

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### AI Voice Processing
- `POST /api/ai/voice-to-invoice` - Process voice text
- `POST /api/ai/voice-file-to-text` - Process audio files
- `POST /api/ai/enhanced-voice-processing` - Advanced AI processing

### Invoice & Customer Management
- `GET/POST /api/invoices` - Manage invoices
- `GET/POST /api/customers` - Manage customers
- `GET /api/dashboard/stats` - Dashboard analytics

## AI Features Deep Dive

### Language Detection
- Auto-detects English vs Hindi
- Contextual processing for each language
- Seamless switching between languages

### Smart Information Extraction
- **Services**: Web design, consulting, development
- **Pricing**: Dollars, rupees, hourly rates
- **Customer Details**: Names, business info
- **Template Matching**: Content-based suggestions

## Project Structure

```
bill_generator-main/
├── backend/
│   ├── server.py              # FastAPI app with AI endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env                  # Environment config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Authentication
│   │   │   ├── ai/           # Voice AI components
│   │   │   ├── invoice/      # Invoice creation
│   │   │   ├── templates/    # Template selection
│   │   │   └── ui/           # Reusable components
│   │   └── App.js            # Main React app
│   ├── package.json          # Dependencies
│   └── .env                  # Frontend config
└── README.md                 # This file
```

## Troubleshooting

### Voice Recognition Issues
- Use Chrome/Edge browser (required for Speech API)
- Enable microphone permissions
- Ensure HTTPS in production

### Backend Connection
- Verify MongoDB is running
- Check port 8000 is available
- Review environment variables

### Authentication Problems
- Clear browser localStorage
- Verify JWT secret configuration
- Check user registration

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Open Pull Request

## Technologies Used

- **Backend**: FastAPI, Python, MongoDB, JWT, Speech Recognition
- **Frontend**: React 19, Tailwind CSS, Radix UI, Axios
- **AI/ML**: Google Speech-to-Text, Natural Language Processing
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT with bcrypt encryption

## License

MIT License - see LICENSE file for details.

---

**🚀 Built with AI-powered technologies for the future of invoicing!**
