import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TermsPage from './pages/TermsPage';
import CameraPage from './pages/CameraPage';
import TryOnPage from './pages/TryOnPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/tryon" element={<TryOnPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
