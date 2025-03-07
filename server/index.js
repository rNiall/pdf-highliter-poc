// server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5002;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for uploaded PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// API to upload a PDF
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
  
  const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ 
    success: true, 
    filename: req.file.filename,
    url: fileUrl 
  });
});

// API to get list of uploaded PDFs
app.get('/api/pdfs', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve files' });
    }
    
    const pdfs = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => ({
        filename: file,
        url: `http://localhost:${port}/uploads/${file}`
      }));
    
    res.json(pdfs);
  });
});

// API to save highlights
app.post('/api/highlights/:pdfId', (req, res) => {
  const pdfId = req.params.pdfId;
  const highlights = req.body;
  
  const highlightsDir = path.join(__dirname, 'highlights');
  if (!fs.existsSync(highlightsDir)) {
    fs.mkdirSync(highlightsDir, { recursive: true });
  }
  
  fs.writeFile(
    path.join(highlightsDir, `${pdfId}.json`),
    JSON.stringify(highlights, null, 2),
    err => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save highlights' });
      }
      res.json({ success: true });
    }
  );
});

// API to get highlights for a PDF
app.get('/api/highlights/:pdfId', (req, res) => {
  const pdfId = req.params.pdfId;
  const highlightPath = path.join(__dirname, 'highlights', `${pdfId}.json`);
  
  if (!fs.existsSync(highlightPath)) {
    return res.json([]);
  }
  
  fs.readFile(highlightPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read highlights' });
    }
    
    try {
      const highlights = JSON.parse(data);
      res.json(highlights);
    } catch (e) {
      res.status(500).json({ error: 'Invalid highlights data' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});