import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:5000');

function App() {
  const [currentValue, setCurrentValue] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Update chart data when history changes
  useEffect(() => {
    if (history.length > 0) {
      // History is in chronological order (oldest first, newest last)
      // Map to chart data format - oldest on left, newest on right
      const data = history.map((item, index) => ({
        index: index + 1,
        time: new Date(item.timestamp).toLocaleTimeString(),
        size: item.size,
        timeInterval: item.timeInterval
      }));
      setChartData(data);
    }
  }, [history]);

  useEffect(() => {
    // Connection event
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    // Disconnection event
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Receive initial data (last 5 values)
    socket.on('initialData', (data) => {
      console.log('Received initial data:', data);
      setCurrentValue(data.current);
      setHistory(data.history);
    });

    // Receive new value updates
    socket.on('newValue', (data) => {
      console.log('Received new value:', data);
      setCurrentValue(data.current);
      setHistory(data.history);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initialData');
      socket.off('newValue');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              React Game
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Value */}
        {currentValue && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Value</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Size</p>
                <p className="text-2xl font-bold text-blue-600">{currentValue.size}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Time Interval</p>
                <p className="text-2xl font-bold text-green-600">{currentValue.timeInterval}s</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Last updated: {new Date(currentValue.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}

        {/* Line Graph */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Size Over Time (Last 5 Values)</h2>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    label={{ value: 'Time (Oldest → Newest)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    domain={[0.6, 1.6]}
                    label={{ value: 'Size', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Size']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="linear" 
                    dataKey="size" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                    name="Size"
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Timeline moves from left (oldest) to right (newest)
            </p>
          </div>
        )}

        {/* History (Last 5 Values) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            History (Last 5 Values)
          </h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No history available yet...</p>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Size</p>
                        <p className="text-lg font-semibold text-gray-800">{item.size}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Time Interval</p>
                        <p className="text-lg font-semibold text-gray-800">{item.timeInterval}s</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

