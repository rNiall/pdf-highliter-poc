import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PDFList from './components/PDFList';
import PDFViewer2 from './components/PDFViewer';
import "./App.css";
import "react-pdf-highlighter/dist/style.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <h1>PDF Highlighter Tool</h1>
        <Routes>
          <Route path="/" element={<PDFList />} />
          <Route path="/view/:filename" element={<PDFViewer2 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;