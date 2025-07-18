import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UnifiedEmotionEntry from './components/UnifiedEmotionEntry';
import History from './components/History';
import PlanForm from './pages/PlanForm';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      {/* ✅ Navigation Bar */}
      <nav className="bg-green-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
        {/* Left: Logo + Title */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-start">
            <img src="/mho-logo.png" alt="MHO Logo" className="h-8 w-auto mb-1" />
            <span className="text-lg font-bold tracking-tight leading-tight">Mishby Health OS</span>
          </div>
        </div>

        {/* Right: Navigation Links */}
        <div className="flex space-x-5 text-sm md:text-base font-medium">
          <Link to="/" className="hover:text-[#e3dcc7] transition">About</Link>
          <Link to="/reflect" className="hover:text-[#e3dcc7] transition">Features</Link>
          <Link to="/history" className="hover:text-[#e3dcc7] transition">Library</Link>
          <Link to="/plan" className="hover:text-[#e3dcc7] transition">Health Form</Link>
        </div>
      </nav>

      {/* ✅ Routing to Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reflect" element={<UnifiedEmotionEntry />} />
        <Route path="/history" element={<History />} />
        <Route path="/plan" element={<PlanForm />} />
      </Routes>
    </Router>
  );
}

export default App;
