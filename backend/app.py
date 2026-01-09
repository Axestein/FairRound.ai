from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json
import sqlite3
import time
from typing import Dict, Optional
import uvicorn

app = FastAPI(title="AI Interview Monitor API", version="1.0")

# CORS middleware - VERY IMPORTANT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Database setup
conn = sqlite3.connect('interview_data.db', check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT DEFAULT 'default'
)
''')
conn.commit()

class EventData(BaseModel):
    type: str
    timestamp: Optional[int] = None
    data: Dict = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Interview Monitor API is running",
        "version": "1.0",
        "endpoints": {
            "root": "/",
            "submit_event": "POST /api/events",
            "get_risk_summary": "GET /api/risk-summary",
            "get_all_events": "GET /api/events",
            "clear_events": "GET /api/clear",
            "debug": "GET /debug"
        }
    }

@app.post("/api/events")
async def receive_event(event: EventData):
    """Receive events from Chrome extension"""
    try:
        # Use current timestamp if not provided
        timestamp = event.timestamp or int(time.time() * 1000)
        event_time = datetime.fromtimestamp(timestamp / 1000)
        
        # Insert event into database
        cursor.execute(
            "INSERT INTO events (event_type, data, timestamp, session_id) VALUES (?, ?, ?, ?)",
            (event.type, json.dumps(event.data), event_time, "session_1")
        )
        conn.commit()
        
        # Calculate risk score
        risk_score = calculate_simple_risk(event.type)
        
        # Log for debugging
        print(f"[EVENT] {event.type} received - Risk: {risk_score}")
        
        return {
            "status": "success",
            "message": "Event recorded",
            "risk_score": risk_score,
            "event_id": cursor.lastrowid,
            "timestamp": event_time.isoformat()
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
        "TAB_SWITCHED": 0.4,  # Alternative name
        "COPY_PASTE": 0.7,    # Alternative name
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
            "TAB_SWITCHED": 0.4,
            "COPY_PASTE": 0.7
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
            "last_updated": datetime.now().isoformat()
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
                "session": row[4]
            })
        
        return {
            "events": events,
            "count": len(events),
            "total_in_db": get_total_event_count()
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
        cursor.execute("DELETE FROM events")
        conn.commit()
        return {
            "status": "success",
            "message": f"All events cleared. Total cleared: {cursor.rowcount}",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear events: {str(e)}")

@app.get("/debug")
async def debug_page():
    """Debug page to see events in real-time"""
    cursor.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 20")
    events = cursor.fetchall()
    
    # Count events by type
    cursor.execute("SELECT event_type, COUNT(*) FROM events GROUP BY event_type")
    counts = cursor.fetchall()
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Debug - Interview Monitor</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
                margin: 0;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #333; 
                margin-top: 0;
                border-bottom: 2px solid #007bff;
                padding-bottom: 10px;
            }
            h2 { color: #555; }
            table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 20px 0;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left; 
            }
            th { 
                background-color: #007bff; 
                color: white;
                position: sticky;
                top: 0;
            }
            tr:nth-child(even) { background-color: #f9f9f9; }
            tr:hover { background-color: #f1f1f1; }
            .event-TAB_SWITCH { background-color: #fff3cd !important; }
            .event-PASTE_EVENT { background-color: #d4edda !important; }
            .event-KEYSTROKE { background-color: #d1ecf1 !important; }
            .event-WINDOW_BLUR { background-color: #f8d7da !important; }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }
            .stat-value {
                font-size: 32px;
                font-weight: bold;
                color: #007bff;
            }
            .stat-label {
                font-size: 14px;
                color: #6c757d;
                margin-top: 5px;
            }
            .button {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
                text-decoration: none;
                display: inline-block;
            }
            .button:hover {
                background: #218838;
            }
            .button-danger {
                background: #dc3545;
            }
            .button-danger:hover {
                background: #c82333;
            }
            .button-test {
                background: #17a2b8;
            }
            .button-test:hover {
                background: #138496;
            }
            .controls {
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .last-updated {
                color: #6c757d;
                font-size: 14px;
                margin-top: 20px;
                text-align: center;
            }
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
            }
            .status-active {
                background: #28a745;
            }
            .status-inactive {
                background: #dc3545;
            }
            .api-status {
                background: #e9ecef;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Interview Monitor - Debug Dashboard</h1>
            
            <div class="api-status">
                <span class="status-indicator status-active"></span>
                <strong>API Status:</strong> Running on http://localhost:8000
                <br>
                <strong>Last Refresh:</strong> <span id="lastRefresh">Just now</span>
            </div>
            
            <div class="controls">
                <button class="button" onclick="location.reload()">🔄 Refresh Data</button>
                <button class="button button-test" onclick="testConnection()">🛜 Test Connection</button>
                <button class="button button-test" onclick="sendTestEvent()">🧪 Send Test Event</button>
                <button class="button button-danger" onclick="clearEvents()">🗑️ Clear All Events</button>
                <a href="http://localhost:3000" target="_blank" class="button button-test">📈 Open Frontend Dashboard</a>
            </div>
            
            <div class="stats-grid">
    """
    
    # Add stats cards
    total_events = get_total_event_count()
    cursor.execute("SELECT COUNT(*) FROM events WHERE event_type = 'TAB_SWITCH'")
    tab_switches = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM events WHERE event_type = 'PASTE_EVENT'")
    paste_events = cursor.fetchone()[0]
    
    html += f"""
                <div class="stat-card">
                    <div class="stat-value">{total_events}</div>
                    <div class="stat-label">Total Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{tab_switches}</div>
                    <div class="stat-label">Tab Switches</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{paste_events}</div>
                    <div class="stat-label">Paste Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{len(events)}</div>
                    <div class="stat-label">Recent Events</div>
                </div>
            </div>
            
            <h2>Event Distribution</h2>
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
    
    html += """
            </table>
            
            <h2>Recent Events (Last 20)</h2>
            <table id="eventsTable">
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Data</th>
                    <th>Timestamp</th>
                    <th>Session</th>
                </tr>
    """
    
    for event in events:
        event_id = event[0]
        event_type = event[1]
        event_data = event[2]
        event_time = event[3]
        session_id = event[4]
        
        # Format data for display
        try:
            data_obj = json.loads(event_data) if event_data else {}
            formatted_data = json.dumps(data_obj, indent=2)
        except:
            formatted_data = str(event_data)
        
        html += f"""
                <tr class="event-{event_type}">
                    <td>{event_id}</td>
                    <td><strong>{event_type}</strong></td>
                    <td><pre style="margin:0;font-size:12px;">{formatted_data}</pre></td>
                    <td>{event_time}</td>
                    <td>{session_id}</td>
                </tr>
        """
    
    html += """
            </table>
            
            <div class="last-updated">
                Last updated: <span id="currentTime">""" + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</span>
                | Auto-refresh every 10 seconds
            </div>
        </div>
        
        <script>
            // Auto-refresh every 10 seconds
            setTimeout(() => location.reload(), 10000);
            
            // Update current time
            function updateTime() {
                const now = new Date();
                document.getElementById('currentTime').textContent = 
                    now.toISOString().replace('T', ' ').substring(0, 19);
            }
            setInterval(updateTime, 1000);
            
            // Test connection
            async function testConnection() {
                try {
                    const response = await fetch('/');
                    const data = await response.json();
                    alert(`✅ Connection Successful!\n\nMessage: ${data.message}\nVersion: ${data.version}`);
                } catch (error) {
                    alert(`❌ Connection Failed!\n\nError: ${error.message}`);
                }
            }
            
            // Send test event
            async function sendTestEvent() {
                try {
                    const testEvent = {
                        type: "TEST_EVENT",
                        timestamp: Date.now(),
                        data: { test: true, source: "debug_page" }
                    };
                    
                    const response = await fetch('/api/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(testEvent)
                    });
                    
                    const data = await response.json();
                    alert(`✅ Test Event Sent!\n\nStatus: ${data.status}\nRisk Score: ${data.risk_score}`);
                    location.reload();
                } catch (error) {
                    alert(`❌ Failed to send test event!\n\nError: ${error.message}`);
                }
            }
            
            // Clear events
            async function clearEvents() {
                if (confirm('Are you sure you want to clear ALL events?')) {
                    try {
                        const response = await fetch('/api/clear');
                        const data = await response.json();
                        alert(`✅ Events Cleared!\n\n${data.message}`);
                        location.reload();
                    } catch (error) {
                        alert(`❌ Failed to clear events!\n\nError: ${error.message}`);
                    }
                }
            }
            
            // Update last refresh time
            document.getElementById('lastRefresh').textContent = new Date().toLocaleTimeString();
            
            console.log('Debug dashboard loaded');
        </script>
    </body>
    </html>
    """
    
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

if __name__ == "__main__":
    print("=" * 60)
    print("AI Interview Monitor Backend")
    print("=" * 60)
    print(f"Starting server on http://localhost:8000")
    print(f"Press CTRL+C to stop")
    print(f"\nAvailable endpoints:")
    print(f"  • http://localhost:8000/              - API root")
    print(f"  • http://localhost:8000/api/events    - Submit events (POST)")
    print(f"  • http://localhost:8000/api/risk-summary - Get risk data")
    print(f"  • http://localhost:8000/debug         - Debug dashboard")
    print("=" * 60)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )