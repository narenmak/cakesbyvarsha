// Debug script to help troubleshoot admin functionality
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = 3001;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'debug-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Debug routes
app.post('/debug/admin/login', (req, res) => {
  console.log('Debug login request received:', req.body);
  res.json({
    success: true,
    token: 'debug-admin-token-123'
  });
});

app.get('/debug/cakes', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Chocolate Cake',
      description: 'Delicious chocolate cake with chocolate frosting',
      image_url: '/debug/images/cake1.jpg',
      prices: { '6 inches': 800, '8 inches': 1200, '10 inches': 1600 }
    },
    {
      id: 2,
      name: 'Vanilla Cake',
      description: 'Classic vanilla cake with buttercream frosting',
      image_url: '/debug/images/cake2.jpg',
      prices: { '6 inches': 700, '8 inches': 1100, '10 inches': 1500 }
    }
  ]);
});

app.get('/debug/cakes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (id === 1) {
    res.json({
      id: 1,
      name: 'Chocolate Cake',
      description: 'Delicious chocolate cake with chocolate frosting',
      sizes: ['6 inches', '8 inches', '10 inches'],
      flavors: ['Chocolate', 'Dark Chocolate'],
      prices: { '6 inches': 800, '8 inches': 1200, '10 inches': 1600 },
      images: [
        { id: 1, image_path: '/debug/images/cake1.jpg', is_primary: true }
      ]
    });
  } else {
    res.json({
      id: 2,
      name: 'Vanilla Cake',
      description: 'Classic vanilla cake with buttercream frosting',
      sizes: ['6 inches', '8 inches', '10 inches'],
      flavors: ['Vanilla', 'French Vanilla'],
      prices: { '6 inches': 700, '8 inches': 1100, '10 inches': 1500 },
      images: [
        { id: 2, image_path: '/debug/images/cake2.jpg', is_primary: true }
      ]
    });
  }
});

// Handle cake creation
app.post('/debug/admin/cakes', upload.array('images', 4), (req, res) => {
  console.log('Add cake request received:');
  console.log('Body:', req.body);
  console.log('Files:', req.files ? req.files.length : 0);
  
  // Return success response
  res.json({
    success: true,
    id: 3,
    message: 'Cake added successfully'
  });
});

// Handle cake update
app.put('/debug/admin/cakes/:id', upload.array('images', 4), (req, res) => {
  console.log(`Update cake request received for ID: ${req.params.id}`);
  console.log('Body:', req.body);
  console.log('Files:', req.files ? req.files.length : 0);
  
  // Return success response
  res.json({
    success: true,
    message: 'Cake updated successfully'
  });
});

// Handle cake deletion
app.delete('/debug/admin/cakes/:id', (req, res) => {
  console.log(`Delete cake request received for ID: ${req.params.id}`);
  
  // Return success response
  res.json({
    success: true,
    message: 'Cake deleted successfully'
  });
});

app.get('/debug/admin/enquiries', (req, res) => {
  res.json([
    {
      id: 1,
      cake_id: 1,
      cake_name: 'Chocolate Cake',
      customer_name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      date_needed: '2024-06-15',
      occasion: 'Birthday',
      size: '8 inches',
      flavor: 'Chocolate',
      special_considerations: 'Please write Happy Birthday on the cake',
      submitted_at: '2024-05-01T12:00:00Z'
    }
  ]);
});

// Serve debug images
app.get('/debug/images/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, '../images/placeholder.jpg'));
});

// Start server
app.listen(port, () => {
  console.log(`Debug server running at http://localhost:${port}`);
  console.log(`Use http://localhost:${port}/debug/admin/login for testing admin login`);
});