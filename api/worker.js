// Cloudflare Worker API for CakesByVarsha
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    
    // Handle OPTIONS request (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }
    
    // API routes
    if (path.startsWith('/api/')) {
      // Add CORS headers to all responses
      const responseInit = {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      };
      
      try {
        // Get all cakes
        if (path === '/api/cakes' && request.method === 'GET') {
          const { results } = await env.DB.prepare(
            `SELECT c.id, c.name, c.description, c.sizes, c.flavors, c.prices, c.created_at,
             ci.image_path as image_url
             FROM cakes c
             LEFT JOIN cake_images ci ON c.id = ci.cake_id AND ci.is_primary = 1
             ORDER BY c.id DESC`
          ).all();
          
          // Parse JSON fields
          const cakes = results.map(cake => ({
            ...cake,
            sizes: JSON.parse(cake.sizes || '[]'),
            flavors: JSON.parse(cake.flavors || '[]'),
            prices: JSON.parse(cake.prices || '{}'),
            price: JSON.parse(cake.prices || '{}')['6 inches'] || 0, // For compatibility
          }));
          
          return new Response(JSON.stringify(cakes), responseInit);
        }
        
        // Get a specific cake
        if (path.match(/^\/api\/cakes\/\d+$/) && request.method === 'GET') {
          const id = path.split('/').pop();
          
          // Get cake details
          const cake = await env.DB.prepare(
            `SELECT c.id, c.name, c.description, c.sizes, c.flavors, c.prices, c.created_at
             FROM cakes c
             WHERE c.id = ?`
          ).bind(id).first();
          
          if (!cake) {
            return new Response(JSON.stringify({ error: 'Cake not found' }), {
              ...responseInit,
              status: 404,
            });
          }
          
          // Get cake images
          const { results: images } = await env.DB.prepare(
            `SELECT id, image_path, is_primary
             FROM cake_images
             WHERE cake_id = ?
             ORDER BY is_primary DESC, id ASC`
          ).bind(id).all();
          
          // Parse JSON fields
          const cakeData = {
            ...cake,
            sizes: JSON.parse(cake.sizes || '[]'),
            flavors: JSON.parse(cake.flavors || '[]'),
            prices: JSON.parse(cake.prices || '{}'),
            images: images,
          };
          
          return new Response(JSON.stringify(cakeData), responseInit);
        }
        
        // Submit an enquiry
        if (path === '/api/enquiry' && request.method === 'POST') {
          const data = await request.json();
          
          // Validate required fields
          if (!data.name || !data.email || !data.message) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
              ...responseInit,
              status: 400,
            });
          }
          
          // Insert enquiry
          await env.DB.prepare(
            `INSERT INTO enquiries (cake_id, cake_name, customer_name, email, phone, date_needed, 
             occasion, size, flavor, special_considerations)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.cake_id || null,
            data.cake_name || null,
            data.name,
            data.email,
            data.phone || null,
            data.date_needed || null,
            data.occasion || null,
            data.size || null,
            data.flavor || null,
            data.message
          ).run();
          
          // Send email notification
          try {
            await sendEmailNotification(env, data);
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue with the response even if email fails
          }
          
          return new Response(JSON.stringify({ success: true }), responseInit);
        }
        
        // Admin login
        if (path === '/api/admin/login' && request.method === 'POST') {
          const data = await request.json();
          
          // Get user from database
          const user = await env.DB.prepare(
            `SELECT id, username, password_hash
             FROM users
             WHERE username = ?`
          ).bind(data.username).first();
          
          if (!user) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
              ...responseInit,
              status: 401,
            });
          }
          
          // In a real app, you would verify the password hash here
          // For simplicity, we're just checking if it matches
          if (data.password && data.password === user.password_hash) {
            // Generate a simple token (in production, use proper JWT)
            const token = crypto.randomUUID();
            
            return new Response(JSON.stringify({ 
              success: true, 
              token: token 
            }), responseInit);
          }
          
          return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
            ...responseInit,
            status: 401,
          });
        }
        
        // Get all enquiries (admin only)
        if (path === '/api/admin/enquiries' && request.method === 'GET') {
          // In production, verify admin token here
          
          const { results } = await env.DB.prepare(
            `SELECT * FROM enquiries ORDER BY submitted_at DESC`
          ).all();
          
          return new Response(JSON.stringify(results), responseInit);
        }
        
        // Add a new cake (admin only)
        // Try a more flexible path matching
       // In worker.js - Update the admin/cakes endpoint
        if (path === '/api/admin/cakes' && request.method === 'POST') {
          console.log('Processing cake creation request');
          
          try {
            // Parse form data
            const formData = await request.formData();
            console.log('Form data received:', Object.fromEntries(formData.entries()));
            
            const name = formData.get('name');
            const description = formData.get('description');
            const size_6 = formData.get('size_6');
            const size_8 = formData.get('size_8');
            const size_10 = formData.get('size_10');
            const flavors = formData.get('flavors');
            
            // Insert cake data
            const result = await env.DB.prepare(
              `INSERT INTO cakes (name, description, sizes, flavors, prices)
              VALUES (?, ?, ?, ?, ?)`
            ).bind(
              name,
              description,
              JSON.stringify(['6 inches', '8 inches', '10 inches']),
              JSON.stringify(flavors.split(',').map(f => f.trim()).filter(f => f)),
              JSON.stringify({
                '6 inches': parseInt(size_6) || 0,
                '8 inches': parseInt(size_8) || 0,
                '10 inches': parseInt(size_10) || 0
              })
            ).run();
            
            const cakeId = result.meta.last_row_id;
            console.log('Cake created with ID:', cakeId);
            
            // Handle image uploads
            const images = formData.getAll('images');
            console.log('Images received:', images.length);
            
            if (images && images.length > 0) {
              for (let i = 0; i < images.length; i++) {
                const image = images[i];
                if (!image || !image.name) continue;
                
                console.log('Processing image:', image.name, 'size:', image.size);
                
                // Generate unique filename
                const filename = `${Date.now()}-${i}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                
                // Upload to R2
                await env.IMAGES.put(filename, image);
                console.log('Image uploaded to R2:', filename);
                
                // Save image reference in database
                const imagePath = `/api/images/${filename}`;
                await env.DB.prepare(
                  `INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
                  VALUES (?, ?, ?, ?)`
                ).bind(
                  cakeId,
                  image.name,
                  imagePath,
                  i === 0 ? 1 : 0
                ).run();
                
                console.log('Image reference saved in DB:', imagePath);
              }
            }
            
            return new Response(JSON.stringify({ 
              success: true,
              id: cakeId
            }), responseInit);
          } catch (error) {
            console.error('Error creating cake:', error);
            return new Response(JSON.stringify({ 
              error: 'Error creating cake: ' + error.message
            }), {
              ...responseInit,
              status: 500,
            });
          }
        }
        
        // Update an existing cake (admin only)
      // Update the edit cake endpoint in worker.js

        // In worker.js - Update the edit cake endpoint
if (path.match(/^\/api\/admin\/cakes\/\d+$/) && request.method === 'PUT') {
  try {
    const id = path.split('/').pop();
    console.log(`Processing cake update for ID: ${id}`);
    
    const formData = await request.formData();
    const replaceImages = formData.get('replace_images') === 'true';
    
    // Update cake data
    await env.DB.prepare(`
      UPDATE cakes 
      SET name = ?, description = ?, flavors = ?, prices = ?
      WHERE id = ?
    `).bind(
      formData.get('name'),
      formData.get('description'),
      JSON.stringify(formData.get('flavors').split(',').map(f => f.trim()).filter(f => f)),
      JSON.stringify({
        '6 inches': parseInt(formData.get('size_6')) || 0,
        '8 inches': parseInt(formData.get('size_8')) || 0,
        '10 inches': parseInt(formData.get('size_10')) || 0
      }),
      id
    ).run();
    
    // Handle new image uploads
    const images = formData.getAll('images');
    if (images && images.length > 0 && images[0].size > 0) {
      // If replacing images, delete old ones first
      if (replaceImages) {
        await env.DB.prepare('DELETE FROM cake_images WHERE cake_id = ?').bind(id).run();
      }
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image || !image.name) continue;
        
        // Generate unique filename
        const filename = `${Date.now()}-${i}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Upload to R2
        await env.IMAGES.put(filename, image);
        
        // Save image reference in database
        await env.DB.prepare(`
          INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
          VALUES (?, ?, ?, ?)
        `).bind(
          id,
          image.name,
          `/api/images/${filename}`,
          replaceImages && i === 0 ? 1 : 0 // First image is primary if replacing
        ).run();
      }
    }
    
    return new Response(JSON.stringify({ success: true }), responseInit);
  } catch (error) {
    console.error('Error updating cake:', error);
    return new Response(JSON.stringify({ error: 'Error updating cake: ' + error.message }), {
      ...responseInit,
      status: 500,
    });
  }
}
        // Add this endpoint to worker.js to fix the database
          if (path === '/api/admin/fix-database' && request.method === 'POST') {
            try {
              // Find cakes with no images
              const { results: cakesWithNoImages } = await env.DB.prepare(`
                SELECT c.id FROM cakes c
                LEFT JOIN cake_images ci ON c.id = ci.cake_id
                WHERE ci.id IS NULL
              `).all();
              
              console.log(`Found ${cakesWithNoImages.length} cakes with no images`);
              
              // Add placeholder image for each cake with no images
              for (const cake of cakesWithNoImages) {
                await env.DB.prepare(`
                  INSERT INTO cake_images (cake_id, image_name, image_path, is_primary)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  cake.id,
                  'placeholder.jpg',
                  '/api/images/placeholder.jpg',
                  1
                ).run();
                
                console.log(`Added placeholder image for cake ID: ${cake.id}`);
              }
              
              return new Response(JSON.stringify({ 
                success: true, 
                fixedCakes: cakesWithNoImages.length 
              }), responseInit);
            } catch (error) {
              console.error('Error fixing database:', error);
              return new Response(JSON.stringify({ error: 'Error fixing database: ' + error.message }), {
                ...responseInit,
                status: 500,
              });
            }
          }

        // Delete a cake (admin only)
        if (path.match(/^\/api\/admin\/cakes\/\d+$/) && request.method === 'DELETE') {
          // In production, verify admin token here
          
          const id = path.split('/').pop();
          
          // Delete associated images first
          await env.DB.prepare(
            `DELETE FROM cake_images WHERE cake_id = ?`
          ).bind(id).run();
          
          // Delete the cake
          await env.DB.prepare(
            `DELETE FROM cakes WHERE id = ?`
          ).bind(id).run();
          
          return new Response(JSON.stringify({ 
            success: true
          }), responseInit);
        }
        
        // Add this to your worker.js
if (path.match(/^\/api\/admin\/force-delete-cake\/\d+$/) && request.method === 'DELETE') {
  try {
    const id = path.split('/').pop();
    console.log(`Force deleting cake ID: ${id}`);
    
    // Delete in a transaction
    await env.DB.prepare('BEGIN TRANSACTION').run();
    await env.DB.prepare('DELETE FROM cake_images WHERE cake_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM cakes WHERE id = ?').bind(id).run();
    await env.DB.prepare('COMMIT').run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Cake ID ${id} and all associated images deleted` 
    }), responseInit);
  } catch (error) {
    // Rollback on error
    await env.DB.prepare('ROLLBACK').run();
    console.error('Error force deleting cake:', error);
    return new Response(JSON.stringify({ error: 'Error deleting cake: ' + error.message }), {
      ...responseInit,
      status: 500,
    });
  }
}

        // Serve images from R2
        // In worker.js - Verify the image serving endpoint
        if (path.startsWith('/api/images/')) {
          try {
            const filename = path.replace('/api/images/', '');
            console.log('Serving image:', filename);
            
            // Get image from R2
            const image = await env.IMAGES.get(filename);
            
            if (!image) {
              console.log('Image not found:', filename);
              return new Response('Image not found', { status: 404 });
            }
            
            // Determine content type
            let contentType = 'image/jpeg';
            if (filename.endsWith('.png')) contentType = 'image/png';
            if (filename.endsWith('.gif')) contentType = 'image/gif';
            if (filename.endsWith('.webp')) contentType = 'image/webp';
            
            return new Response(image.body, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
                ...corsHeaders
              }
            });
          } catch (error) {
            console.error('Error serving image:', error);
            return new Response('Error serving image', { status: 500 });
          }
        }
        
        // Route not found
        return new Response(JSON.stringify({ error: 'Not found' }), {
          ...responseInit,
          status: 404,
        });
        
      } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          ...responseInit,
          status: 500,
        });
      }
    }
    
    // Not an API route
    return new Response('Not found', { status: 404 });
  }
};

// Helper function to send email notification
async function sendEmailNotification(env, data) {
  // Use Cloudflare Email Workers if available
  if (env.EMAIL) {
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
    
    await env.EMAIL.send({
      to: 'narenmak7@gmail.com',
      from: 'enquiries@cakesbyvarsha.com',
      subject: 'New Cake Enquiry from Website',
      html: emailContent
    });
  }
}