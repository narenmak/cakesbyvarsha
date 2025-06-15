// Data migration script for Cakes by Varsha
// This script migrates data from SQLite to Cloudflare D1

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { execSync } = require('child_process');

// Configuration
const SOURCE_DB_PATH = '../cakesbyvarsha/cakesbyvarsha.db';
const TEMP_IMAGES_DIR = './temp-images';

async function main() {
  try {
    console.log('Starting data migration...');
    
    // Create temp directory for images
    if (!fs.existsSync(TEMP_IMAGES_DIR)) {
      fs.mkdirSync(TEMP_IMAGES_DIR, { recursive: true });
    }
    
    // Open source database
    const db = await open({
      filename: path.resolve(__dirname, SOURCE_DB_PATH),
      driver: sqlite3.Database
    });
    
    console.log('Connected to source database');
    
    // Get all cakes
    const cakes = await db.all('SELECT * FROM cake');
    console.log(`Found ${cakes.length} cakes to migrate`);
    
    // Migrate each cake
    for (const cake of cakes) {
      console.log(`Migrating cake: ${cake.name} (ID: ${cake.id})`);
      
      // Convert cake data to D1 format
      const cakeData = {
        name: cake.name,
        description: cake.description,
        sizes: JSON.stringify(['6 inches', '8 inches', '10 inches']),
        flavors: JSON.stringify(cake.flavors ? JSON.parse(cake.flavors) : []),
        prices: JSON.stringify(cake.prices ? JSON.parse(cake.prices) : {})
      };
      
      // Create wrangler command to insert cake
      const insertCakeCmd = `wrangler d1 execute cakesbyvarsha-db --command="INSERT INTO cakes (name, description, sizes, flavors, prices) VALUES ('${cakeData.name.replace(/'/g, "''")}', '${cakeData.description.replace(/'/g, "''")}', '${cakeData.sizes}', '${cakeData.flavors}', '${cakeData.prices}');"`;
      
      // Execute command
      console.log('Inserting cake into D1...');
      execSync(insertCakeCmd);
      
      // Get the inserted cake ID
      const getIdCmd = `wrangler d1 execute cakesbyvarsha-db --command="SELECT last_insert_rowid() as id;"`;
      const idResult = execSync(getIdCmd).toString();
      const newCakeId = parseInt(idResult.match(/id: (\d+)/)[1]);
      
      console.log(`Cake inserted with new ID: ${newCakeId}`);
      
      // Get cake images
      const images = await db.all('SELECT * FROM cake_image WHERE cake_id = ?', cake.id);
      console.log(`Found ${images.length} images for cake ID ${cake.id}`);
      
      // Migrate each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const isPrimary = i === 0 ? 1 : 0; // First image is primary
        
        // Save binary image to temp file
        const imageName = `cake_${newCakeId}_image_${i + 1}.jpg`;
        const imagePath = path.join(TEMP_IMAGES_DIR, imageName);
        fs.writeFileSync(imagePath, image.image);
        
        // Upload image to R2
        console.log(`Uploading image ${imageName} to R2...`);
        execSync(`wrangler r2 object put cakesbyvarsha-images/${imageName} --file=${imagePath}`);
        
        // Insert image reference in D1
        const imagePathInDb = `/api/images/${imageName}`;
        const insertImageCmd = `wrangler d1 execute cakesbyvarsha-db --command="INSERT INTO cake_images (cake_id, image_name, image_path, is_primary) VALUES (${newCakeId}, '${imageName}', '${imagePathInDb}', ${isPrimary});"`;
        
        console.log('Inserting image reference into D1...');
        execSync(insertImageCmd);
      }
      
      console.log(`Completed migration for cake: ${cake.name}`);
    }
    
    // Close database
    await db.close();
    
    // Clean up temp directory
    fs.rmSync(TEMP_IMAGES_DIR, { recursive: true, force: true });
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();