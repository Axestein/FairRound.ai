// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
// import './App.css';

// function App() {
//   const [riskData, setRiskData] = useState([]);
//   const [events, setEvents] = useState([]);
//   const [overallRisk, setOverallRisk] = useState(0);
  
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
//   useEffect(() => {
//     fetchRiskData();
//     const interval = setInterval(fetchRiskData, 5000);
//     return () => clearInterval(interval);
//   }, []);
  
//   const fetchRiskData = async () => {
//     try {
//       const response = await axios.get('http://localhost:8000/api/risk-summary');
//       setOverallRisk(response.data.overall_risk);
      
//       // Convert event counts to chart data
//       const chartData = Object.entries(response.data.event_counts).map(([name, value]) => ({
//         name,
//         value
//       }));
//       setEvents(chartData);
      
//       // Add to timeline
//       setRiskData(prev => [...prev.slice(-9), {
//         time: new Date().toLocaleTimeString(),
//         risk: response.data.overall_risk
//       }]);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   };
  
//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>FairRound.ai - Interview Monitor Dashboard</h1>
//       </header>
      
//       <div className="dashboard">
//         <div className="risk-card">
//           <h2>Overall Risk Score</h2>
//           <div className="risk-circle" style={{
//             background: `conic-gradient(#ff4444 ${overallRisk * 100}%, #eee ${overallRisk * 100}% 100%)`
//           }}>
//             <span>{(overallRisk * 100).toFixed(1)}%</span>
//           </div>
//           <p className="risk-level">
//             {overallRisk > 0.7 ? '🔴 HIGH RISK' : 
//              overallRisk > 0.4 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK'}
//           </p>
//         </div>
        
//         <div className="chart-container">
//           <h3>Risk Trend</h3>
//           <LineChart width={400} height={200} data={riskData}>
//             <Line type="monotone" dataKey="risk" stroke="#ff4444" strokeWidth={2} />
//           </LineChart>
//         </div>
        
//         <div className="chart-container">
//           <h3>Event Distribution</h3>
//           <PieChart width={300} height={200}>
//             <Pie
//               data={events}
//               cx="50%"
//               cy="50%"
//               labelLine={false}
//               label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//               outerRadius={80}
//               fill="#8884d8"
//               dataKey="value"
//             >
//               {events.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//           </PieChart>
//         </div>
        
//         <div className="events-list">
//           <h3>Recent Events</h3>
//           <ul>
//             {events.slice(0, 5).map((event, index) => (
//               <li key={index}>
//                 <span className="event-type">{event.name}</span>
//                 <span className="event-count">{event.value} occurrences</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { 
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//   PieChart, Pie, Cell, ResponsiveContainer,
//   BarChart, Bar
// } from 'recharts';
// import './App.css';

// // API Configuration
// const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? process.env.REACT_APP_API_URL || 'https://ai-interview-monitor-backend.onrender.com'
//   : 'http://localhost:8000';

// console.log('Environment:', process.env.NODE_ENV);
// console.log('API Base URL:', API_BASE_URL);

// function App() {
//   const [riskData, setRiskData] = useState([]);
//   const [events, setEvents] = useState([]);
//   const [overallRisk, setOverallRisk] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [lastUpdated, setLastUpdated] = useState(null);
//   const [totalEvents, setTotalEvents] = useState(0);
  
//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
//   useEffect(() => {
//     fetchRiskData();
//     const interval = setInterval(fetchRiskData, 5000); // Update every 5 seconds
//     return () => clearInterval(interval);
//   }, []);
  
//   const fetchRiskData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axios.get(`${API_BASE_URL}/api/risk-summary`);
      
//       setOverallRisk(response.data.overall_risk);
//       setTotalEvents(response.data.total_events || 0);
//       setLastUpdated(new Date().toLocaleTimeString());
      
//       // Convert event counts to chart data
//       const eventEntries = Object.entries(response.data.event_counts || {});
//       const chartData = eventEntries.map(([name, value]) => ({
//         name: name.replace('_', ' ').toUpperCase(),
//         value,
//         originalName: name
//       }));
//       setEvents(chartData);
      
//       // Add to timeline (keep last 10 entries)
//       const newRiskPoint = {
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         risk: response.data.overall_risk * 100
//       };
      
//       setRiskData(prev => {
//         const newData = [...prev, newRiskPoint];
//         return newData.slice(-10); // Keep only last 10 points
//       });
      
//     } catch (error) {
//       console.error('Error fetching data:', error);
      
//       // Show error in UI
//       setRiskData(prev => [...prev, {
//         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         risk: 0,
//         error: true
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const getRiskColor = (risk) => {
//     if (risk > 0.7) return '#ff4444';
//     if (risk > 0.4) return '#ffaa44';
//     return '#44ff44';
//   };
  
//   const getRiskLevel = (risk) => {
//     if (risk > 0.7) return '🔴 HIGH RISK';
//     if (risk > 0.4) return '🟡 MEDIUM RISK';
//     return '🟢 LOW RISK';
//   };
  
//   const handleRefresh = () => {
//     fetchRiskData();
//   };
  
//   const handleClearData = async () => {
//     if (window.confirm('Are you sure you want to clear all data?')) {
//       try {
//         await axios.get(`${API_BASE_URL}/api/clear`);
//         fetchRiskData();
//       } catch (error) {
//         console.error('Error clearing data:', error);
//         alert('Failed to clear data');
//       }
//     }
//   };
  
//   return (
//     <div className="App">
//       <header className="App-header">
//         <div className="header-content">
//           <h1>🛡️ FairRound.ai - Interview Monitor Dashboard</h1>
//           <p className="subtitle">Real-time AI-assisted behavior detection</p>
//           <div className="server-info">
//             <span className="server-status">🟢 Connected to: {API_BASE_URL}</span>
//             {lastUpdated && <span className="last-updated">Last updated: {lastUpdated}</span>}
//           </div>
//         </div>
        
//         <div className="header-controls">
//           <button onClick={handleRefresh} className="refresh-btn">
//             🔄 Refresh
//           </button>
//           <button onClick={handleClearData} className="clear-btn">
//             🗑️ Clear Data
//           </button>
//         </div>
//       </header>
      
//       <div className="dashboard">
//         {/* Risk Score Card */}
//         <div className="dashboard-card risk-card">
//           <div className="card-header">
//             <h2>Overall Risk Score</h2>
//             <span className="risk-badge">{getRiskLevel(overallRisk)}</span>
//           </div>
          
//           <div className="risk-display">
//             <div 
//               className="risk-circle" 
//               style={{
//                 background: `conic-gradient(${getRiskColor(overallRisk)} 0%, ${getRiskColor(overallRisk)} ${overallRisk * 100}%, #eee ${overallRisk * 100}% 100%)`
//               }}
//             >
//               <div className="risk-inner">
//                 <span className="risk-percent">{(overallRisk * 100).toFixed(1)}%</span>
//                 <span className="risk-label">AI Assistance Risk</span>
//               </div>
//             </div>
            
//             <div className="risk-metrics">
//               <div className="metric">
//                 <span className="metric-value">{totalEvents}</span>
//                 <span className="metric-label">Total Events</span>
//               </div>
//               <div className="metric">
//                 <span className="metric-value">{events.length}</span>
//                 <span className="metric-label">Event Types</span>
//               </div>
//             </div>
//           </div>
          
//           <div className="risk-breakdown">
//             <div className="breakdown-item">
//               <span className="breakdown-label">Tab Switches:</span>
//               <span className="breakdown-value">
//                 {events.find(e => e.originalName === 'TAB_SWITCH')?.value || 0}
//               </span>
//             </div>
//             <div className="breakdown-item">
//               <span className="breakdown-label">Paste Events:</span>
//               <span className="breakdown-value">
//                 {events.find(e => e.originalName === 'PASTE_EVENT')?.value || 0}
//               </span>
//             </div>
//           </div>
//         </div>
        
//         {/* Risk Trend Chart */}
//         <div className="dashboard-card chart-card">
//           <div className="card-header">
//             <h3>Risk Trend Over Time</h3>
//             <span className="chart-subtitle">Last 10 updates</span>
//           </div>
          
//           <ResponsiveContainer width="100%" height={250}>
//             <LineChart data={riskData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis 
//                 dataKey="time" 
//                 tick={{ fill: '#666' }}
//                 axisLine={{ stroke: '#ddd' }}
//               />
//               <YAxis 
//                 label={{ value: 'Risk %', angle: -90, position: 'insideLeft', fill: '#666' }}
//                 tick={{ fill: '#666' }}
//                 axisLine={{ stroke: '#ddd' }}
//                 domain={[0, 100]}
//               />
//               <Tooltip 
//                 formatter={(value) => [`${value}%`, 'Risk']}
//                 labelFormatter={(label) => `Time: ${label}`}
//                 contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="risk" 
//                 stroke="#ff4444" 
//                 strokeWidth={3}
//                 dot={{ r: 4, fill: '#ff4444' }}
//                 activeDot={{ r: 6, fill: '#ff4444' }}
//                 name="Risk Level"
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
        
//         {/* Event Distribution Chart */}
//         <div className="dashboard-card chart-card">
//           <div className="card-header">
//             <h3>Event Distribution</h3>
//             <span className="chart-subtitle">By event type</span>
//           </div>
          
//           {events.length > 0 ? (
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie
//                   data={events}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={true}
//                   label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                 >
//                   {events.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip 
//                   formatter={(value, name, props) => [`${value} events`, props.payload.originalName]}
//                   contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
//                 />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="no-data">
//               <div className="no-data-icon">📊</div>
//               <p>No events recorded yet</p>
//               <p>Start the interview to see data</p>
//             </div>
//           )}
//         </div>
        
//         {/* Event Counts Bar Chart */}
//         <div className="dashboard-card chart-card">
//           <div className="card-header">
//             <h3>Event Counts</h3>
//             <span className="chart-subtitle">Detailed breakdown</span>
//           </div>
          
//           {events.length > 0 ? (
//             <ResponsiveContainer width="100%" height={250}>
//               <BarChart data={events}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis 
//                   dataKey="name" 
//                   angle={-45}
//                   textAnchor="end"
//                   height={60}
//                   tick={{ fill: '#666' }}
//                 />
//                 <YAxis 
//                   tick={{ fill: '#666' }}
//                   axisLine={{ stroke: '#ddd' }}
//                 />
//                 <Tooltip 
//                   formatter={(value) => [`${value} events`, 'Count']}
//                   contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
//                 />
//                 <Bar 
//                   dataKey="value" 
//                   fill="#8884d8" 
//                   name="Event Count"
//                   radius={[4, 4, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="no-data">
//               <div className="no-data-icon">📈</div>
//               <p>Waiting for events...</p>
//             </div>
//           )}
//         </div>
        
//         {/* Recent Events List */}
//         <div className="dashboard-card events-card">
//           <div className="card-header">
//             <h3>Recent Events</h3>
//             <span className="chart-subtitle">Live monitoring</span>
//           </div>
          
//           <div className="events-list">
//             {events.length > 0 ? (
//               <table className="events-table">
//                 <thead>
//                   <tr>
//                     <th>Event Type</th>
//                     <th>Count</th>
//                     <th>Risk Weight</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {events.map((event, index) => {
//                     let eventRisk = 0;
//                     if (event.originalName === 'PASTE_EVENT') eventRisk = 0.6;
//                     else if (event.originalName === 'TAB_SWITCH') eventRisk = 0.4;
//                     else if (event.originalName === 'WINDOW_BLUR') eventRisk = 0.3;
//                     else eventRisk = 0.2;
                    
//                     return (
//                       <tr key={index}>
//                         <td>
//                           <span className={`event-type event-${event.originalName?.toLowerCase()}`}>
//                             {event.name}
//                           </span>
//                         </td>
//                         <td className="event-count">{event.value}</td>
//                         <td>
//                           <span className="risk-indicator" style={{background: getRiskColor(eventRisk)}}>
//                             {(eventRisk * 100).toFixed(0)}%
//                           </span>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             ) : (
//               <div className="no-data">
//                 <div className="no-data-icon">📋</div>
//                 <p>No events to display</p>
//                 <p>Events will appear here when detected</p>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {/* System Info */}
//         <div className="dashboard-card info-card">
//           <div className="card-header">
//             <h3>📋 System Information</h3>
//           </div>
          
//           <div className="info-content">
//             <div className="info-item">
//               <strong>Backend URL:</strong>
//               <code className="api-url">{API_BASE_URL}</code>
//             </div>
            
//             <div className="info-item">
//               <strong>Environment:</strong>
//               <span className="env-badge">
//                 {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
//               </span>
//             </div>
            
//             <div className="info-item">
//               <strong>Refresh Interval:</strong>
//               <span>5 seconds</span>
//             </div>
            
//             <div className="risk-guide">
//               <h4>Risk Level Guide:</h4>
//               <div className="guide-item low">
//                 <span className="guide-color" style={{background: '#44ff44'}}></span>
//                 <span className="guide-text">Low (0-40%): Normal behavior</span>
//               </div>
//               <div className="guide-item medium">
//                 <span className="guide-color" style={{background: '#ffaa44'}}></span>
//                 <span className="guide-text">Medium (40-70%): Suspicious patterns</span>
//               </div>
//               <div className="guide-item high">
//                 <span className="guide-color" style={{background: '#ff4444'}}></span>
//                 <span className="guide-text">High (70-100%): Likely AI-assisted</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <footer className="App-footer">
//         <p>
//           🛡️ FairRound.ai Interview Monitor v1.0 • 
//           <a href={`${API_BASE_URL}/debug`} target="_blank" rel="noopener noreferrer">
//             🔍 Debug Dashboard
//           </a> • 
//           <a href={`${API_BASE_URL}/health`} target="_blank" rel="noopener noreferrer">
//             🏥 Health Check
//           </a>
//         </p>
//         {isLoading && <div className="loading-indicator">🔄 Updating data...</div>}
//       </footer>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, RefreshCw, Trash2, AlertCircle, Shield, TrendingUp, Eye } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://ai-interview-monitor-backend.onrender.com' 
  : 'http://localhost:8000';

function App() {
  const [riskData, setRiskData] = useState([]);
  const [events, setEvents] = useState([]);
  const [overallRisk, setOverallRisk] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalEvents, setTotalEvents] = useState(0);

  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/risk-summary`);
      const data = await response.json();
      
      setOverallRisk(data.overall_risk);
      setTotalEvents(data.total_events || 0);
      setLastUpdated(new Date().toLocaleTimeString());

      const eventEntries = Object.entries(data.event_counts || {});
      const chartData = eventEntries.map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value,
        originalName: name
      }));
      setEvents(chartData);

      const newRiskPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        risk: data.overall_risk * 100
      };
      setRiskData(prev => [...prev, newRiskPoint].slice(-10));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk > 0.7) return 'high';
    if (risk > 0.4) return 'medium';
    return 'low';
  };

  const getRiskLevel = (risk) => {
    if (risk > 0.7) return 'HIGH RISK';
    if (risk > 0.4) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  const handleRefresh = () => {
    fetchRiskData();
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      try {
        await fetch(`${API_BASE_URL}/api/clear`);
        fetchRiskData();
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <img
  src="./icon1.png"
  alt="FairRound.ai Logo"
  style={{ width: "40px", height: "40px" }}
/>
              <div className="header-title">
                <h1>FairRound.ai</h1>
                <p>Interview Monitor Dashboard</p>
              </div>
            </div>
            
            <div className="header-right">
              <div className="status-badge">
                <div className="status-dot"></div>
                <span className="status-text">Live</span>
              </div>
              {lastUpdated && (
                <span className="last-updated">Updated {lastUpdated}</span>
              )}
              <button
                onClick={handleRefresh}
                className="btn-icon"
                disabled={isLoading}
              >
                <RefreshCw className={`text-slate ${isLoading ? 'spin' : ''}`} size={16} />
              </button>
              <button
                onClick={handleClearData}
                className="btn-icon btn-danger"
              >
                <Trash2 className="text-red" size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className={`stat-card risk-card risk-${getRiskColor(overallRisk)}`}>
            <div className="stat-header">
              <div className="stat-icon">
                <AlertCircle size={20} className={getRiskColor(overallRisk)} />
              </div>
              <span className={`stat-badge ${getRiskColor(overallRisk)}`}>
                {getRiskLevel(overallRisk)}
              </span>
            </div>
            <div className={`stat-value ${getRiskColor(overallRisk)}`}>
              {(overallRisk * 100).toFixed(1)}%
            </div>
            <div className="stat-label">Risk Score</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={20} />
            </div>
            <div className="stat-value default">{totalEvents}</div>
            <div className="stat-label">Total Events</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
            <div className="stat-value default">
              {events.find(e => e.originalName === 'TAB_SWITCH')?.value || 0}
            </div>
            <div className="stat-label">Tab Switches</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Eye size={20} />
            </div>
            <div className="stat-value default">
              {events.find(e => e.originalName === 'PASTE_EVENT')?.value || 0}
            </div>
            <div className="stat-label">Paste Events</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Risk Trend */}
          <div className="chart-card">
            <h3 className="chart-title">Risk Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Risk']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Event Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">Event Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              {events.length > 0 ? (
                <PieChart>
                  <Pie
                    data={events}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {events.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} events`]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </PieChart>
              ) : (
                <div className="chart-empty">
                  <Activity size={48} />
                  <p>No events recorded yet</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Counts Bar Chart */}
        <div className="chart-full">
          <h3 className="chart-title">Event Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            {events.length > 0 ? (
              <BarChart data={events}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) => [`${value} events`, 'Count']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <div className="chart-empty">
                <TrendingUp size={48} />
                <p>Waiting for events...</p>
              </div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Recent Events Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>Recent Events</h3>
          </div>
          <div className="table-container">
            {events.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>Count</th>
                    <th>Risk Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => {
                    let eventRisk = 0;
                    if (event.originalName === 'PASTE_EVENT') eventRisk = 0.6;
                    else if (event.originalName === 'TAB_SWITCH') eventRisk = 0.4;
                    else if (event.originalName === 'WINDOW_BLUR') eventRisk = 0.3;
                    else eventRisk = 0.2;

                    const riskLevel = eventRisk > 0.5 ? 'high' : eventRisk > 0.3 ? 'medium' : 'low';

                    return (
                      <tr key={index}>
                        <td className="font-medium">{event.name}</td>
                        <td className="text-slate">{event.value}</td>
                        <td>
                          <span className={`risk-badge ${riskLevel}`}>
                            {(eventRisk * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="table-empty">
                <Eye size={48} />
                <p>No events to display</p>
                <p className="secondary">Events will appear here when detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="footer-info">
          <div className="footer-grid">
            <div>
              <span>Backend:</span> {API_BASE_URL}
            </div>
            <div>
              <span>Refresh:</span> Every 5 seconds
            </div>
            <div>
              <span>Version:</span> 1.0.0
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;