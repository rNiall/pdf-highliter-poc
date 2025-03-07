import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PDFList = () => {
  const [pdfs, setPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pdfs');
      setPdfs(response.data);
    } catch (err) {
      setError('Failed to load PDFs. Please check if the server is running.');
      console.error(err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed!');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchPDFs();
    } catch (err) {
      setError('Failed to upload PDF. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-list-container">
      <h2>Your PDF Files</h2>
      
      <div className="upload-section">
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="pdf-upload" className="upload-button">
          {uploading ? 'Uploading...' : 'Upload New PDF'}
        </label>
        {error && <p className="error-message">{error}</p>}
      </div>
      
      <div className="pdfs-grid">
        {pdfs.length === 0 ? (
          <p>No PDFs uploaded yet. Upload one to get started!</p>
        ) : (
          pdfs.map((pdf, index) => (
            <div key={index} className="pdf-item">
              <div className="pdf-icon">PDF</div>
              <div className="pdf-details">
                <p className="pdf-name" style={{ color: 'black' }}>{pdf.filename}</p>
                <Link to={`/view/${encodeURIComponent(pdf.filename)}`} className="view-button">
                  Open & Highlight
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PDFList;