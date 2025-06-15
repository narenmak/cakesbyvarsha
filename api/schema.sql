CREATE TABLE cakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sizes TEXT,
  flavors TEXT,
  prices TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cake_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cake_id INTEGER NOT NULL,
  image_name TEXT,
  image_path TEXT,
  is_primary BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cake_id) REFERENCES cakes(id)
);

CREATE TABLE enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cake_id INTEGER,
  cake_name TEXT,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  date_needed DATE,
  occasion TEXT,
  size TEXT,
  flavor TEXT,
  special_considerations TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cake_id) REFERENCES cakes(id)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);