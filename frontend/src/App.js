import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './App.css';

function App() {
  const [riskData, setRiskData] = useState([]);
  const [events, setEvents] = useState([]);
  const [overallRisk, setOverallRisk] = useState(0);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchRiskData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/risk-summary');
      setOverallRisk(response.data.overall_risk);
      
      // Convert event counts to chart data
      const chartData = Object.entries(response.data.event_counts).map(([name, value]) => ({
        name,
        value
      }));
      setEvents(chartData);
      
      // Add to timeline
      setRiskData(prev => [...prev.slice(-9), {
        time: new Date().toLocaleTimeString(),
        risk: response.data.overall_risk
      }]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>FairRound.ai - Interview Monitor Dashboard</h1>
      </header>
      
      <div className="dashboard">
        <div className="risk-card">
          <h2>Overall Risk Score</h2>
          <div className="risk-circle" style={{
            background: `conic-gradient(#ff4444 ${overallRisk * 100}%, #eee ${overallRisk * 100}% 100%)`
          }}>
            <span>{(overallRisk * 100).toFixed(1)}%</span>
          </div>
          <p className="risk-level">
            {overallRisk > 0.7 ? '🔴 HIGH RISK' : 
             overallRisk > 0.4 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK'}
          </p>
        </div>
        
        <div className="chart-container">
          <h3>Risk Trend</h3>
          <LineChart width={400} height={200} data={riskData}>
            <Line type="monotone" dataKey="risk" stroke="#ff4444" strokeWidth={2} />
          </LineChart>
        </div>
        
        <div className="chart-container">
          <h3>Event Distribution</h3>
          <PieChart width={300} height={200}>
            <Pie
              data={events}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {events.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </div>
        
        <div className="events-list">
          <h3>Recent Events</h3>
          <ul>
            {events.slice(0, 5).map((event, index) => (
              <li key={index}>
                <span className="event-type">{event.name}</span>
                <span className="event-count">{event.value} occurrences</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;