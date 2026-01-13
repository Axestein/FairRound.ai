<p align="center">
  <img src="https://github.com/user-attachments/assets/10433062-f517-49f5-b126-f5758f089086" alt="FairRound.ai Logo" width="120" />
</p>

<h1 align="center">FairRound.ai</h1>

<p align="center">
  <strong>AI Interview Monitor</strong>
</p>

<div align="center">

![Demo](https://img.shields.io/badge/Demo-Live-green)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18.2+-61DAFB)

**Detect AI-assisted cheating during online interviews in real-time**

[Live Dashboard](#live-demo) • [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) 

<img width="707" height="513" alt="Lean Canvas (Copy) (1)" src="https://github.com/user-attachments/assets/8e575c89-1341-4327-b64c-dceabea128d1" />

</div>

## Overview

FairRound.ai is a comprehensive solution that monitors and detects AI-assisted behavior during online technical interviews. It helps maintain interview integrity by identifying suspicious patterns like excessive tab switching, copy-paste behavior, and other AI tool usage signals.

## Live Demo

| Component | Live URL | Status |
|-----------|----------|--------|
| **Dashboard** | [https://ai-interview-monitor-dashboard.vercel.app](https://ai-interview-monitor-dashboard.vercel.app) | 🟢 Live |
| **Backend API** | [https://ai-interview-monitor-backend.onrender.com](https://ai-interview-monitor-backend.onrender.com) | 🟢 Live |
| **Debug Dashboard** | [https://ai-interview-monitor-backend.onrender.com/debug](https://ai-interview-monitor-backend.onrender.com/debug) | 🟢 Live |
| **Health Check** | [https://ai-interview-monitor-backend.onrender.com/health](https://ai-interview-monitor-backend.onrender.com/health) | 🟢 Live |

## Features

### **Real-time Monitoring**
- **Tab Switch Detection**: Tracks excessive tab/window switching
- **Copy-Paste Detection**: Identifies copy-paste behavior patterns
- **Typing Pattern Analysis**: Detects unnatural typing speeds
- **Focus Detection**: Monitors window focus loss

### **Risk Scoring**
- **Multi-factor Risk Analysis**: Combines behavioral signals
- **Real-time Scoring**: Updates risk scores every 5 seconds
- **Three-tier Risk Levels**: Low (0-40%), Medium (40-70%), High (70-100%)
- **Visual Risk Indicators**: Color-coded risk visualization

### **User Interface**
- **Chrome Extension**: Lightweight browser extension for monitoring
- **Dashboard**: Real-time analytics dashboard
- **Debug Interface**: Detailed event logs and system monitoring
- **Responsive Design**: Works on all screen sizes

### **Technical Features**
- **RESTful API**: FastAPI backend with SQLite database
- **Real-time Updates**: WebSocket-based live data streaming
- **Cross-origin Support**: Full CORS configuration
- **Persistent Storage**: Local storage for offline capability
- **Free Deployment**: 100% free hosting (Render + Vercel)

## Architecture
<img width="707" height="513" alt="archdiag" src="https://github.com/user-attachments/assets/d5e145c0-3adc-4e45-bdb1-dcdb2c20f337" />

### **System Components**

1. **Chrome Extension** (`/extension/`)
   - Monitors browser behavior
   - Detects tab switches, copy-paste, typing patterns
   - Sends events to backend
   - Stores data locally when offline

2. **Backend API** (`/backend/`)
   - FastAPI Python server
   - SQLite database for event storage
   - Real-time risk calculation
   - RESTful API endpoints

3. **Dashboard** (`/frontend/`)
   - React.js web application
   - Real-time charts and graphs
   - Live risk score updates
   - Event visualization

## Project Screenshots
### Row 1
| Backend logs from /debug (local) |  Realtime updation of Events (deployed) |
|--------|--------|
| <img src="https://github.com/user-attachments/assets/d7e47aa9-b98b-4eec-82ee-15a5993d1b7a" width="100%"> | <img src="https://github.com/user-attachments/assets/83c0be4c-620c-42f4-99fc-47bbccccaa27" width="100%"> |

### Row 2
| Risk Summary | Frontend Dashboard |
|--------|--------|
| <img src="https://github.com/user-attachments/assets/4ae2ca48-c399-4fc2-8368-23ed47852359" width="100%"> | <img src="https://github.com/user-attachments/assets/10e9c6c4-e550-48ed-9b87-0aa0ecd866be" width="100%"> |

### Row 3
| Terminal Logs(indicating api is healthy) | Realtime Use in competitions or interviews |
|--------|--------|
| <img src="https://github.com/user-attachments/assets/c190ff89-a470-4f28-999c-dbb4ccc73056" width="100%"> | <img src="https://github.com/user-attachments/assets/e9e2f738-69fa-4827-8d7a-a60c598a7645" width="100%"> |

## Quick Start

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- Google Chrome browser
- Git

### **Option 1: Use Live Deployment (Recommended)**
1. **Load the Chrome Extension:**
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked" and select the `/extension` folder

2. **Access Dashboard:**
   - Open [https://ai-interview-monitor-dashboard.vercel.app](https://ai-interview-monitor-dashboard.vercel.app)
   - Start monitoring interviews!

### **Option 2: Local Development**

#### **Backend Setup**
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-interview-monitor.git
cd ai-interview-monitor/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
python app.py
# Backend runs on http://localhost:8000
```

#### **Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Run frontend
npm start
# Frontend runs on http://localhost:3000
```

#### **Extension Setup**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `/extension` folder

## Project Structure

```
ai-interview-monitor/
├── extension/                    # Chrome Extension
│   ├── manifest.json            # Extension configuration
│   ├── background.js            # Background service worker
│   ├── content.js              # Content script for page monitoring
│   ├── popup.html              # Extension popup UI
│   └── popup.js                # Popup functionality
├── backend/                     # FastAPI Backend
│   ├── app.py                  # Main API server
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile               # Deployment configuration
│   └── interview_data.db      # SQLite database (auto-created)
├── frontend/                   # React Dashboard
│   ├── public/
│   ├── src/
│   │   ├── App.js             # Main dashboard component
│   │   ├── App.css            # Dashboard styles
│   │   └── index.js           # React entry point
│   ├── package.json           # Node.js dependencies
│   └── vercel.json            # Vercel deployment config
├── render.yaml                 # Render deployment configuration
└── README.md                   # This file
```

## API Reference

### **Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | API information |
| `GET`  | `/health` | Health check |
| `POST` | `/api/events` | Submit monitoring events |
| `GET`  | `/api/risk-summary` | Get current risk summary |
| `GET`  | `/api/events` | Get all recorded events |
| `GET`  | `/api/clear` | Clear all events |
| `GET`  | `/debug` | Debug dashboard |

### **Example Event Submission**
```json
POST /api/events
{
  "type": "TAB_SWITCH",
  "timestamp": 1640995200000,
  "data": {
    "count": 5,
    "tabId": 123456,
    "risk": 0.4
  }
}
```

### **Risk Calculation**
- **Tab Switch**: +30% risk per switch (capped at 40%)
- **Paste Event**: +50% risk per paste (capped at 60%)
- **Window Blur**: +20% risk per blur event
- **Keystroke**: +10% risk for unnatural patterns

## Usage Guide

### **For Interviewers**
1. **Start Monitoring**: Click the extension icon and ensure it shows "Monitoring Active"
2. **Share Instructions**: Ask candidate to enable screen sharing
3. **Monitor Dashboard**: Open dashboard to view real-time risk scores
4. **Review Events**: Check detailed event logs in debug dashboard

### **For Candidates**
1. **Consent**: Accept monitoring when prompted
2. **Normal Behavior**: Interview as you normally would
3. **Avoid Suspicious Activity**: Minimize tab switching and copy-paste
4. **Focus**: Keep interview window in focus

### **Risk Interpretation**
| Risk Level | Score | Interpretation | Action |
|------------|-------|----------------|--------|
| **🟢 Low** | 0-40% | Normal behavior | No action needed |
| **🟡 Medium** | 40-70% | Suspicious patterns | Monitor closely |
| **🔴 High** | 70-100% | Likely AI-assisted | Investigate further |

## Deployment

### **Backend (Render.com)**
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy backend"
git push origin main

# 2. Deploy to Render (auto-deploys from GitHub)
# Or use render.yaml for configuration
```

### **Frontend (Vercel)**
```bash
cd frontend
vercel --prod
```

### **Environment Variables**
- **Backend**: `PORT` (auto-set by Render)
- **Frontend**: `REACT_APP_API_URL` (your backend URL)

## Event Detection Details

### **Detected Behaviors**
1. **Tab Switching**: Switching between browser tabs
2. **Copy-Paste**: Using Ctrl+C/Ctrl+V or right-click copy/paste
3. **Window Focus**: Losing focus from interview window
4. **Typing Patterns**: Unnatural typing speed consistency
5. **Mouse Behavior**: Suspicious mouse movements

### **Detection Methods**
- **Browser APIs**: Chrome extension APIs for tab/focus monitoring
- **DOM Events**: Paste and key event listeners
- **Timing Analysis**: Response time and pattern analysis
- **Behavioral Patterns**: Machine learning-based anomaly detection

## Troubleshooting

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Extension shows "NaN" | Check backend connection with "Test Backend" button |
| Events not recording | Ensure extension is enabled and monitoring is active |
| Dashboard not updating | Check if backend is running (may sleep on free tier) |
| CORS errors | Backend CORS middleware should allow all origins |
| Database errors | Ensure SQLite file has write permissions |

### **Debug Commands**
```javascript
// In Chrome extension Service Worker console
chrome.runtime.sendMessage({type: 'GET_STATUS'}).then(console.log)

// Test backend connection
fetch('https://ai-interview-monitor-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```

## Performance Metrics

- **Response Time**: < 100ms for API calls
- **Memory Usage**: < 50MB for extension
- **Database Size**: Auto-cleans old events
- **Uptime**: 99.9% (with free tier limitations)

## Privacy & Ethics

### **Data Collection**
- Only collects behavioral metadata (no content)
- No personal information stored
- No keystroke logging
- No screen recording

### **Consent Model**
- Explicit consent required before monitoring
- Clear notification of monitoring status
- Option to pause/resume monitoring
- Data deletion on request

### **Compliance**
- GDPR compliant data practices
- Local storage for sensitive data
- Encrypted communication
- Regular data purging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **FastAPI** for the excellent Python web framework
- **React** for the frontend library
- **Render & Vercel** for free hosting
- **Chrome Extensions API** for browser monitoring capabilities
- **All contributors** who helped improve this project


## Disclaimer

This tool is designed to **assist** in maintaining interview integrity, not to make definitive decisions about candidate honesty. Always use human judgment in conjunction with automated tools.

---

<div align="center">

**Built with ❤️ for fair technical interviews**

[Star ⭐ this repo](https://github.com/Axestein/ai-interview-monitor) if you found it helpful!

</div>
