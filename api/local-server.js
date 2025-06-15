// Local development server for Cakes by Varsha
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
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

// Database connection
let db;

async function initializeDatabase() {
  // Create database directory if it doesn't exist
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Open database connection
  db = await open({
    filename: path.join(dbDir, 'cakesbyvarsha.db'),
    driver: sqlite3.Database
  });

  // Check if tables exist
  const tablesExist = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cakes'");
  
  if (!tablesExist) {
    console.log("Creating database tables...");
    // Create tables if they don't exist
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }
  }

  // Create default admin user if it doesn't exist
  const adminUser = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  if (!adminUser) {
    // Use password from .env file
    const adminPassword = process.env.ADMIN_PASSWORD || 'default_password_please_change';
    await db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      'admin',
      adminPassword
    );
    console.log('Created default admin user with password from .env file');
  }

  console.log('Database initialized');
}

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER || 'cakesbyvarsha.noreply@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your_app_password_here'
  }
});

// API Routes

// Get all cakes
app.get('/api/cakes', async (req, res) => {
  try {
    const cakes = await db.all(`
      SELECT c.id, c.name, c.description, c.sizes, c.flavors, c.prices, c.created_at,
             ci.image_path as image_url
      FROM cakes c
      LEFT JOIN cake_images ci ON c.id = ci.cake_id AND ci.is_primary = 1
      ORDER BY c.id DESC
    `);

    // Parse JSON fields
    const parsedCakes = cakes.map(cake => ({
      ...cake,
      sizes: JSON.parse(cake.sizes || '[]'),
      flavors: JSON.parse(cake.flavors || '[]'),
      prices: JSON.parse(cake.prices || '{}'),
      price: JSON.parse(cake.prices || '{}')['6 inches'] || 0 // For compatibility
    }));

    res.json(parsedCakes);
  } catch (error) {
    console.error('Error getting cakes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific cake
app.get('/api/cakes/:id', async (req, res) => {
  try {
    const cake = await db.get(`
      SELECT c.id, c.name, c.description, c.sizes, c.flavors, c.prices, c.created_at
      FROM cakes c
      WHERE c.id = ?
    `, req.params.id);

    if (!cake) {
      return res.status(404).json({ error: 'Cake not found' });
    }

    // Get cake images
    const images = await db.all(`
      SELECT id, image_path, is_primary
      FROM cake_images
      WHERE cake_id = ?
      ORDER BY is_primary DESC, id ASC
    `, req.params.id);

    // Parse JSON fields
    const cakeData = {
      ...cake,
      sizes: JSON.parse(cake.sizes || '[]'),
      flavors: JSON.parse(cake.flavors || '[]'),
      prices: JSON.parse(cake.prices || '{}'),
      images: images
    };

    res.json(cakeData);
  } catch (error) {
    console.error('Error getting cake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit an enquiry
app.post('/api/enquiry', async (req, res) => {
  try {
    const { cake_id, cake_name, name, email, phone, date_needed, occasion, size, flavor, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert enquiry
    await db.run(`
      INSERT INTO enquiries (cake_id, cake_name, customer_name, email, phone, date_needed, 
                            occasion, size, flavor, special_considerations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cake_id || null,
      cake_name || null,
      name,
      email,
      phone || null,
      date_needed || null,
      occasion || null,
      size || null,
      flavor || null,
      message
    ]);

    // Send email notification
    try {
      await sendEmailNotification(req.body);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Continue with the response even if email fails
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    // Get user from database
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // In a real app, you would verify the password hash here
    // For simplicity, we're just checking if it matches
    if (password && user.password_hash.includes(password)) {
      // Generate a simple token (in production, use proper JWT)
      const token = 'admin-' + Date.now();

      res.json({
        success: true,
        token: token
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all enquiries (admin only)
app.get('/api/admin/enquiries', async (req, res) => {
  try {
    // In production, verify admin token here

    const enquiries = await db.all('SELECT * FROM enquiries ORDER BY submitted_at DESC');
    res.json(enquiries);
  } catch (error) {
    console.error('Error getting enquiries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new cake (admin only)
app.post('/api/admin/cakes', upload.array('images', 4), async (req, res) => {
  try {
    console.log('Add cake request received:');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);
    
    // In production, verify admin token here
    const { name, description, size_6, size_8, size_10, flavors } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse flavors
    const flavorsList = flavors.split(',').map(f => f.trim()).filter(f => f);

    // Create prices object
    const prices = {
      '6 inches': parseInt(size_6) || 0,
      '8 inches': parseInt(size_8) || 0,
      '10 inches': parseInt(size_10) || 0
    };

    // Insert cake
    const result = await db.run(`
      INSERT INTO cakes (name, description, sizes, flavors, prices)
      VALUES (?, ?, ?, ?, ?)
    `, [
      name,
      description,
      JSON.stringify(['6 inches', '8 inches', '10 inches']),
      JSON.stringify(flavorsList),
      JSON.stringify(prices)
    ]);

    const cakeId = result.lastID;
    console.log('Cake inserted with ID:', cakeId);

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imagePath = `/api/images/${path.basename(file.path)}`;
        console.log('Saving image:', imagePath);

        // Save image reference in database
        await db.run(`
          INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
          VALUES (?, ?, ?, ?)
        `, [
          cakeId,
          file.originalname,
          imagePath,
          i === 0 ? 1 : 0 // First image is primary
        ]);
      }
    }

    res.json({
      success: true,
      id: cakeId
    });
  } catch (error) {
    console.error('Error adding cake:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Update an existing cake (admin only)
app.put('/api/admin/cakes/:id', upload.array('images', 4), async (req, res) => {
  try {
    console.log(`Update cake request received for ID: ${req.params.id}`);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 0);
    
    // In production, verify admin token here
    const { id } = req.params;
    const { name, description, size_6, size_8, size_10, flavors } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse flavors
    const flavorsList = flavors.split(',').map(f => f.trim()).filter(f => f);

    // Create prices object
    const prices = {
      '6 inches': parseInt(size_6) || 0,
      '8 inches': parseInt(size_8) || 0,
      '10 inches': parseInt(size_10) || 0
    };

    // Update cake
    await db.run(`
      UPDATE cakes 
      SET name = ?, description = ?, flavors = ?, prices = ?
      WHERE id = ?
    `, [
      name,
      description,
      JSON.stringify(flavorsList),
      JSON.stringify(prices),
      id
    ]);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imagePath = `/api/images/${path.basename(file.path)}`;

        // Save image reference in database
        await db.run(`
          INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
          VALUES (?, ?, ?, ?)
        `, [
          id,
          file.originalname,
          imagePath,
          0 // New images are not primary by default
        ]);
      }
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error updating cake:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Delete a cake (admin only)
app.delete('/api/admin/cakes/:id', async (req, res) => {
  try {
    console.log(`Delete cake request received for ID: ${req.params.id}`);
    
    // In production, verify admin token here
    const { id } = req.params;

    // Get image paths to delete files
    const images = await db.all('SELECT image_path FROM cake_images WHERE cake_id = ?', id);

    // Delete associated images first
    await db.run('DELETE FROM cake_images WHERE cake_id = ?', id);

    // Delete the cake
    await db.run('DELETE FROM cakes WHERE id = ?', id);

    // Delete image files
    for (const image of images) {
      const imagePath = image.image_path;
      if (imagePath && imagePath.startsWith('/api/images/')) {
        const filename = imagePath.replace('/api/images/', '');
        const filePath = path.join(__dirname, 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting cake:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve images
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Helper function to send email notification
async function sendEmailNotification(data) {
  const emailRecipient = process.env.EMAIL_RECIPIENT || 'narenmak7@gmail.com';
  const emailSender = process.env.EMAIL_SENDER || 'cakesbyvarsha.noreply@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Skip sending email if password is not provided
  if (!emailPassword) {
    console.log('Email password not provided, skipping email notification');
    return;
  }

  const emailContent = `
    <h2>New Cake Enquiry</h2>
    <p><strong>Customer:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
    ${data.cake_name ? `<p><strong>Cake:</strong> ${data.cake_name}</p>` : ''}
    ${data.date_needed ? `<p><strong>Date Needed:</strong> ${data.date_needed}</p>` : ''}
    ${data.occasion ? `<p><strong>Occasion:</strong> ${data.occasion}</p>` : ''}
    ${data.size ? `<p><strong>Size:</strong> ${data.size}</p>` : ''}
    ${data.flavor ? `<p><strong>Flavor:</strong> ${data.flavor}</p>` : ''}
    <p><strong>Message:</strong> ${data.message}</p>
  `;

  const mailOptions = {
    from: emailSender,
    to: emailRecipient,
    subject: 'New Cake Enquiry from Website',
    html: emailContent
  };

  await emailTransporter.sendMail(mailOptions);
  console.log('Email notification sent');
}

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(port, () => {
    console.log(`Local server running at http://localhost:${port}`);
    console.log(`API available at http://localhost:${port}/api`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});