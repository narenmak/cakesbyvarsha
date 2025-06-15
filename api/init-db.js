// Initialize database with sample data for local development
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function initializeDatabase() {
  console.log('Initializing database with sample data...');

  // Create database directory if it doesn't exist
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Open database connection
  const db = await open({
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
  } else {
    console.log("Database tables already exist, skipping creation");
  }

  // Create admin user
  const adminUser = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
  if (!adminUser) {
    // Use password from .env file
    const adminPassword = process.env.ADMIN_PASSWORD || 'default_password_please_change';
    await db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      'admin',
      adminPassword
    );
    console.log('Created admin user with password from .env file');
  } else {
    console.log('Admin user already exists');
  }

  // Add sample cakes if none exist
  const cakeCount = await db.get('SELECT COUNT(*) as count FROM cakes');
  if (cakeCount.count === 0) {
    console.log('Adding sample cakes...');
    
    // Sample cake 1
    const cake1 = {
      name: 'Chocolate Truffle Cake',
      description: 'Rich chocolate cake with smooth truffle frosting, perfect for chocolate lovers.',
      sizes: JSON.stringify(['6 inches', '8 inches', '10 inches']),
      flavors: JSON.stringify(['Chocolate', 'Dark Chocolate', 'White Chocolate']),
      prices: JSON.stringify({
        '6 inches': 800,
        '8 inches': 1200,
        '10 inches': 1800
      })
    };
    
    const result1 = await db.run(`
      INSERT INTO cakes (name, description, sizes, flavors, prices)
      VALUES (?, ?, ?, ?, ?)
    `, [cake1.name, cake1.description, cake1.sizes, cake1.flavors, cake1.prices]);
    
    await db.run(`
      INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
      VALUES (?, ?, ?, ?)
    `, [result1.lastID, 'chocolate-cake.jpg', '/api/images/placeholder.jpg', 1]);
    
    // Sample cake 2
    const cake2 = {
      name: 'Vanilla Berry Delight',
      description: 'Light vanilla sponge cake with fresh seasonal berries and cream cheese frosting.',
      sizes: JSON.stringify(['6 inches', '8 inches', '10 inches']),
      flavors: JSON.stringify(['Vanilla', 'Strawberry', 'Blueberry']),
      prices: JSON.stringify({
        '6 inches': 700,
        '8 inches': 1100,
        '10 inches': 1600
      })
    };
    
    const result2 = await db.run(`
      INSERT INTO cakes (name, description, sizes, flavors, prices)
      VALUES (?, ?, ?, ?, ?)
    `, [cake2.name, cake2.description, cake2.sizes, cake2.flavors, cake2.prices]);
    
    await db.run(`
      INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
      VALUES (?, ?, ?, ?)
    `, [result2.lastID, 'vanilla-cake.jpg', '/api/images/placeholder.jpg', 1]);
    
    console.log('Added sample cakes');
  } else {
    console.log(`Database already has ${cakeCount.count} cakes, skipping sample data`);
  }

  await db.close();
  console.log('Database initialization complete!');
}

initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});