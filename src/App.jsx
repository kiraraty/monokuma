import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Pets from './pages/Pets';
// import Battle from './pages/Battle';
// import Marketplace from './pages/Marketplace';
// import Leaderboard from './pages/Leaderboard';
import { Web3Provider } from './contexts/Web3Context';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App min-h-screen">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pets" element={<Pets />} />
              {/* <Route path="/battle" element={<Battle />} /> */}
              {/* <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/leaderboard" element={<Leaderboard />} /> */}
            </Routes>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App; 