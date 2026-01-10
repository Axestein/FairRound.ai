from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from datetime import datetime
import json
import sqlite3
import time
import os
from typing import Dict, Optional
import uvicorn

# Initialize app
app = FastAPI(
    title="AI Interview Monitor API",
    version="1.0",
    description="Backend API for detecting AI-assisted behavior in interviews",
    docs_url="/docs" if os.environ.get("ENVIRONMENT") == "development" else None,
    redoc_url="/redoc" if os.environ.get("ENVIRONMENT") == "development" else None
)

# CORS middleware - CRITICAL for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local frontend
        "https://ai-interview-monitor-dashboard.vercel.app",  # Deployed frontend
        "chrome-extension://*",  # Chrome extension
        "*"  # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_database():
    conn = sqlite3.connect('interview_data.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT DEFAULT 'default',
        ip_address TEXT
    )
    ''')
    cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp)
    ''')
    cursor.execute('''
    CREATE INDEX IF NOT EXISTS idx_event_type ON events(event_type)
    ''')
    conn.commit()
    return conn, cursor

# Initialize database
conn, cursor = init_database()

class EventData(BaseModel):
    type: str
    timestamp: Optional[int] = None
    data: Dict = {}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    is_production = os.environ.get("RENDER") is not None
    
    return {
        "message": "AI Interview Monitor API is running",
        "version": "1.0",
        "environment": "production" if is_production else "development",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "root": "/",
            "submit_event": "POST /api/events",
            "get_risk_summary": "GET /api/risk-summary",
            "get_all_events": "GET /api/events",
            "clear_events": "GET /api/clear",
            "debug_dashboard": "GET /debug",
            "health_check": "GET /health"
        },
        "deployment": {
            "backend_url": "https://ai-interview-monitor-backend.onrender.com" if is_production else "http://localhost:8000",
            "frontend_url": "https://ai-interview-monitor-dashboard.vercel.app" if is_production else "http://localhost:3000"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        cursor.execute("SELECT 1")
        db_ok = cursor.fetchone()[0] == 1
    except:
        db_ok = False
    
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if db_ok else "disconnected",
        "version": "1.0"
    }

@app.post("/api/events")
async def receive_event(event: EventData, request: Optional[dict] = None):
    """Receive events from Chrome extension"""
    try:
        # Use current timestamp if not provided
        timestamp = event.timestamp or int(time.time() * 1000)
        event_time = datetime.fromtimestamp(timestamp / 1000)
        
        # Get IP address (if available)
        ip_address = "unknown"
        
        # Insert event into database
        cursor.execute(
            """INSERT INTO events (event_type, data, timestamp, session_id, ip_address) 
               VALUES (?, ?, ?, ?, ?)""",
            (event.type, json.dumps(event.data), event_time, "session_1", ip_address)
        )
        conn.commit()
        
        # Calculate risk score
        risk_score = calculate_simple_risk(event.type)
        
        # Log for debugging (only in development)
        if os.environ.get("ENVIRONMENT") != "production":
            print(f"[EVENT] {event.type} received - Risk: {risk_score}")
        
        return {
            "status": "success",
            "message": "Event recorded",
            "risk_score": risk_score,
            "event_id": cursor.lastrowid,
            "timestamp": event_time.isoformat(),
            "total_events": get_total_event_count()
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to process event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process event: {str(e)}")

def calculate_simple_risk(event_type: str) -> float:
    """Calculate simple risk score based on event type"""
    risk_scores = {
        "PASTE_EVENT": 0.6,
        "TAB_SWITCH": 0.4,
        "WINDOW_BLUR": 0.3,
        "KEYSTROKE": 0.1,
        "COPY_EVENT": 0.5,
        "CUT_EVENT": 0.2,
        "TEST_EVENT": 0.0
    }
    return risk_scores.get(event_type, 0.2)

@app.get("/api/risk-summary")
async def get_risk_summary():
    """Get overall risk summary"""
    try:
        # Get event counts
        cursor.execute("SELECT event_type, COUNT(*) FROM events GROUP BY event_type")
        events = cursor.fetchall()
        
        event_counts = {}
        total_risk = 0.0
        total_events = 0
        
        risk_weights = {
            "PASTE_EVENT": 0.6,
            "TAB_SWITCH": 0.4,
            "WINDOW_BLUR": 0.3,
            "KEYSTROKE": 0.1,
            "COPY_EVENT": 0.5,
            "CUT_EVENT": 0.2
        }
        
        for event_type, count in events:
            event_counts[event_type] = count
            weight = risk_weights.get(event_type, 0.2)
            total_risk += min(count * weight, 1.0)
            total_events += count
        
        # Calculate overall risk (0-1 scale)
        if total_events > 0:
            # Normalize risk: each event contributes max 0.3 to overall risk
            overall_risk = min(total_risk / (total_events * 0.5), 1.0)
        else:
            overall_risk = 0.0
        
        # Determine risk level
        if overall_risk > 0.7:
            risk_level = "HIGH"
        elif overall_risk > 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        return {
            "event_counts": event_counts,
            "total_events": total_events,
            "overall_risk": round(overall_risk, 3),
            "risk_level": risk_level,
            "last_updated": datetime.now().isoformat(),
            "server_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except Exception as e:
        print(f"[ERROR] Failed to get risk summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get risk summary: {str(e)}")

@app.get("/api/events")
async def get_all_events(limit: int = 50):
    """Get all recorded events (for debugging)"""
    try:
        cursor.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        
        events = []
        for row in rows:
            events.append({
                "id": row[0],
                "type": row[1],
                "data": json.loads(row[2]) if row[2] else {},
                "timestamp": row[3],
                "session": row[4],
                "ip": row[5]
            })
        
        return {
            "events": events,
            "count": len(events),
            "total_in_db": get_total_event_count(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")

def get_total_event_count() -> int:
    """Get total number of events in database"""
    cursor.execute("SELECT COUNT(*) FROM events")
    return cursor.fetchone()[0]

@app.get("/api/clear")
async def clear_events():
    """Clear all events (for testing)"""
    try:
        # Get count before clearing
        cursor.execute("SELECT COUNT(*) FROM events")
        count_before = cursor.fetchone()[0]
        
        # Clear events
        cursor.execute("DELETE FROM events")
        conn.commit()
        
        return {
            "status": "success",
            "message": f"All events cleared",
            "cleared_count": count_before,
            "remaining_count": 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear events: {str(e)}")

@app.get("/debug")
async def debug_page():
    """Debug page to see events in real-time"""
    is_production = os.environ.get("RENDER") is not None
    
    cursor.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 20")
    events = cursor.fetchall()
    
    # Count events by type
    cursor.execute("SELECT event_type, COUNT(*) FROM events GROUP BY event_type")
    counts = cursor.fetchall()
    
    # Get server info
    total_events = get_total_event_count()
    cursor.execute("SELECT COUNT(*) FROM events WHERE event_type = 'TAB_SWITCH'")
    tab_switches = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM events WHERE event_type = 'PASTE_EVENT'")
    paste_events = cursor.fetchone()[0]
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Debug - AI Interview Monitor</title>
        <style>
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
                margin: 0;
                max-width: 1400px;
                margin: 0 auto;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                margin-bottom: 20px;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }}
            .stat-card {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }}
            .stat-value {{
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
            }}
            .server-info {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #eee; }}
            th {{ background: #667eea; color: white; }}
            .event-TAB_SWITCH {{ background-color: #fff3cd; }}
            .event-PASTE_EVENT {{ background-color: #d4edda; }}
            .event-KEYSTROKE {{ background-color: #d1ecf1; }}
            .controls {{ margin: 20px 0; }}
            .button {{
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
                text-decoration: none;
                display: inline-block;
            }}
            .environment-badge {{
                display: inline-block;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                margin-left: 10px;
            }}
            .production {{ background: #10b981; color: white; }}
            .development {{ background: #f59e0b; color: white; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🛡️ AI Interview Monitor - Debug Dashboard</h1>
            <p>
                Status: <strong>Online</strong> 
                <span class="environment-badge {'production' if is_production else 'development'}">
                    {'PRODUCTION' if is_production else 'DEVELOPMENT'}
                </span>
            </p>
            <p>Backend URL: <strong>{'https://ai-interview-monitor-backend.onrender.com' if is_production else 'http://localhost:8000'}</strong></p>
        </div>
        
        <div class="controls">
            <button class="button" onclick="location.reload()">🔄 Refresh</button>
            <button class="button" onclick="testConnection()">🧪 Test Connection</button>
            <button class="button" onclick="sendTestEvent()">📨 Send Test Event</button>
            <button class="button" style="background: #ef4444;" onclick="clearEvents()">🗑️ Clear All Events</button>
            <a href="{'/docs' if not is_production else '#'}" class="button" {'target="_blank"' if not is_production else 'style="opacity:0.5;cursor:not-allowed;" title="Disabled in production"'}>📚 API Docs</a>
            <a href="https://ai-interview-monitor-dashboard.vercel.app" target="_blank" class="button">📊 Live Dashboard</a>
        </div>
        
        <div class="server-info">
            <h3>📊 Server Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{total_events}</div>
                    <div>Total Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{tab_switches}</div>
                    <div>Tab Switches</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{paste_events}</div>
                    <div>Paste Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{len(events)}</div>
                    <div>Recent Events</div>
                </div>
            </div>
        </div>
        
        <h3>📋 Event Distribution</h3>
        <table>
            <tr><th>Event Type</th><th>Count</th><th>Risk Weight</th></tr>
    """
    
    for event_type, count in counts:
        risk = calculate_simple_risk(event_type)
        html += f"""
            <tr>
                <td><strong>{event_type}</strong></td>
                <td>{count}</td>
                <td>{risk}</td>
            </tr>
        """
    
    html += f"""
        </table>
        
        <h3>🕒 Recent Events (Last 20)</h3>
        <table>
            <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Data</th>
                <th>Timestamp</th>
            </tr>
    """
    
    for event in events:
        event_id = event[0]
        event_type = event[1]
        event_data = event[2]
        event_time = event[3]
        
        # Format data for display
        try:
            data_obj = json.loads(event_data) if event_data else {{}}
            formatted_data = json.dumps(data_obj, indent=2)
        except:
            formatted_data = str(event_data)
        
        html += f"""
            <tr class="event-{event_type}">
                <td>{event_id}</td>
                <td><strong>{event_type}</strong></td>
                <td><pre style="margin:0;font-size:12px;max-height:100px;overflow:auto;">{formatted_data}</pre></td>
                <td>{event_time}</td>
            </tr>
        """
    
    html += """
        </table>
        
        <div style="text-align: center; color: #666; margin-top: 30px; padding: 20px;">
            <p>AI Interview Monitor v1.0 • Auto-refreshes every 10 seconds</p>
            <p id="lastRefresh">Last refresh: Loading...</p>
        </div>
        
        <script>
            // Update last refresh time
            document.getElementById('lastRefresh').textContent = 'Last refresh: ' + new Date().toLocaleTimeString();
            
            // Auto-refresh every 10 seconds
            setTimeout(() => location.reload(), 10000);
            
            // Test connection
            async function testConnection() {{
                try {{
                    const response = await fetch('/health');
                    const data = await response.json();
                    alert(`✅ Connection Healthy!\\nStatus: ${data.status}\\nDatabase: ${data.database}`);
                }} catch (error) {{
                    alert(`❌ Connection Failed!\\nError: ${error.message}`);
                }}
            }}
            
            // Send test event
            async function sendTestEvent() {{
                try {{
                    const testEvent = {{
                        type: "TEST_EVENT",
                        timestamp: Date.now(),
                        data: {{ test: true, source: "debug_dashboard" }}
                    }};
                    
                    const response = await fetch('/api/events', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify(testEvent)
                    }});
                    
                    const data = await response.json();
                    alert(`✅ Test Event Sent!\\nID: ${data.event_id}\\nRisk Score: ${data.risk_score}`);
                    location.reload();
                }} catch (error) {{
                    alert(`❌ Failed to send test event!\\nError: ${error.message}`);
                }}
            }}
            
            // Clear events
            async function clearEvents() {{
                if (confirm('Are you sure you want to clear ALL events?')) {{
                    try {{
                        const response = await fetch('/api/clear');
                        const data = await response.json();
                        alert(`✅ Events Cleared!\\nCleared: ${data.cleared_count} events`);
                        location.reload();
                    }} catch (error) {{
                        alert(`❌ Failed to clear events!\\nError: ${error.message}`);
                    }}
                }}
            }}
            
            console.log('Debug dashboard loaded successfully');
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html)

if __name__ == "__main__":
    import os
    
    # Get port from environment variable (Render provides this)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print("=" * 60)
    print("🎯 AI Interview Monitor Backend")
    print("=" * 60)
    print(f"Environment: {'PRODUCTION' if os.environ.get('RENDER') else 'DEVELOPMENT'}")
    print(f"Starting server on {host}:{port}")
    print(f"Press CTRL+C to stop")
    print("")
    
    if os.environ.get('RENDER'):
        # Production on Render
        print("🌐 Production Mode")
        print(f"🔗 Public URL: https://ai-interview-monitor-backend.onrender.com")
        print(f"📊 Debug Dashboard: https://ai-interview-monitor-backend.onrender.com/debug")
        print(f"🏥 Health Check: https://ai-interview-monitor-backend.onrender.com/health")
    else:
        # Local development
        print("💻 Development Mode")
        print(f"🔗 Local URL: http://localhost:{port}")
        print(f"📊 Debug Dashboard: http://localhost:{port}/debug")
        print(f"📚 API Docs: http://localhost:{port}/docs")
    
    print("")
    print("📡 Available Endpoints:")
    print(f"  • /                 - API root")
    print(f"  • /health           - Health check")
    print(f"  • POST /api/events  - Submit events")
    print(f"  • GET /api/risk-summary - Get risk data") 
    print(f"  • GET /debug        - Debug dashboard")
    print(f"  • GET /api/events   - Get all events")
    print(f"  • GET /api/clear    - Clear events")
    if not os.environ.get('RENDER'):
        print(f"  • /docs            - Swagger API documentation")
        print(f"  • /redoc           - ReDoc API documentation")
    print("=" * 60)
    
    # Start server
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info",
        # Production optimizations
        access_log=True,
        timeout_keep_alive=30,
        reload=not bool(os.environ.get('RENDER'))  # Auto-reload only in development
    ) 