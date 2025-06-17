// Admin dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded in admin.js');
  
  // Check if logged in
  const token = localStorage.getItem('adminToken');
  if (!token) {
    console.log('No admin token found, redirecting to login');
    window.location.href = 'index.html';
    return;
  }
  
  console.log('Admin token found, loading dashboard');

   // Setup logout - Add null check
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('adminToken');
      window.location.href = 'index.html';
    });
  } else {
    console.error('Logout link not found');
  }

  // Load cakes and enquiries
  loadCakes();
  loadEnquiries();
  

   const addCakeBtn = document.getElementById('add-cake-btn');
  if (addCakeBtn) {
    addCakeBtn.addEventListener('click', () => {
      resetCakeForm();
      document.getElementById('cakeModalTitle').textContent = 'Add New Cake';
      const cakeModal = new bootstrap.Modal(document.getElementById('cakeModal'));
      cakeModal.show();
    });
  } else {
    console.error('Add cake button not found');
  }
  
// Setup save cake button - Add null check
  const saveCakeBtn = document.getElementById('save-cake-btn');
  if (saveCakeBtn) {
    saveCakeBtn.addEventListener('click', saveCake);
  } else {
    console.error('Save cake button not found');
  }
  
  // Setup image preview - Add null check
  const cakeImages = document.getElementById('cake-images');
  if (cakeImages) {
    cakeImages.addEventListener('change', previewImages);
  } else {
    console.error('Cake images input not found');
  }
});
  

// Load cakes for the admin table
async function loadCakes() {
  try {
    console.log('Loading cakes from:', `${API_URL}/cakes`);
    const response = await fetch(`${API_URL}/cakes`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const cakes = await response.json();
    console.log('Cakes loaded:', cakes);
    
    const tableBody = document.getElementById('cakes-table-body');
    
    tableBody.innerHTML = '';
    
    if (cakes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No cakes found</td></tr>';
      return;
    }
    
    cakes.forEach(cake => {
      // Find the minimum price
      let minPrice = 0;
      if (cake.prices) {
        const prices = Object.values(cake.prices).filter(price => !isNaN(price) && price > 0);
        minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      }
      
      const row = document.createElement('tr');

      const imageUrl = cake.image_url
      ? (cake.image_url.startsWith('http')
        ? cake.image_url
        : API_URL.substring(0, API_URL.lastIndexOf('/api')) + cake.image_url)
      : '../images/placeholder.jpg';

      row.innerHTML = `
        <td>${cake.id}</td>
        <td>
            <img src="${imageUrl}" 
                alt="${cake.name}" 
                style="width: 50px; height: 50px; object-fit: cover;">
        </td>
        <td>${cake.name}</td>
        <td>${cake.description ? cake.description.substring(0, 50) + '...' : ''}</td>
        <td>GBP ${minPrice}</td>
        <td>
            <button class="btn btn-sm btn-primary edit-cake-btn" data-id="${cake.id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-cake-btn" data-id="${cake.id}">Delete</button>
        </td>
    `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-cake-btn').forEach(button => {
      button.addEventListener('click', () => editCake(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-cake-btn').forEach(button => {
      button.addEventListener('click', () => deleteCake(button.dataset.id));
    });
    
  } catch (error) {
    console.error('Error loading cakes:', error);
    document.getElementById('cakes-table-body').innerHTML = 
      '<tr><td colspan="6" class="text-center text-danger">Failed to load cakes</td></tr>';
  }
}

// Load enquiries for the admin table
async function loadEnquiries() {
  try {
    console.log('Loading enquiries from:', `${API_URL}/admin/enquiries`);
    const response = await fetch(`${API_URL}/admin/enquiries`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const enquiries = await response.json();
    console.log('Enquiries loaded:', enquiries);
    
    const tableBody = document.getElementById('enquiries-table-body');
    
    tableBody.innerHTML = '';
    
    if (enquiries.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No enquiries found</td></tr>';
      return;
    }
    
    enquiries.forEach(enquiry => {
      const submittedDate = new Date(enquiry.submitted_at).toLocaleDateString();
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${enquiry.id}</td>
        <td>${submittedDate}</td>
        <td>${enquiry.customer_name}</td>
        <td>${enquiry.cake_name || 'N/A'}</td>
        <td>${enquiry.email}</td>
        <td>${enquiry.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-info view-enquiry-btn" data-id="${enquiry.id}">View</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-enquiry-btn').forEach(button => {
      button.addEventListener('click', () => viewEnquiry(button.dataset.id, enquiries));
    });
    
  } catch (error) {
    console.error('Error loading enquiries:', error);
    document.getElementById('enquiries-table-body').innerHTML = 
      '<tr><td colspan="7" class="text-center text-danger">Failed to load enquiries</td></tr>';
  }
}

// View enquiry details
function viewEnquiry(id, enquiries) {
  const enquiry = enquiries.find(e => e.id == id);
  if (!enquiry) return;
  
  const submittedDate = new Date(enquiry.submitted_at).toLocaleDateString();
  const neededDate = enquiry.date_needed ? new Date(enquiry.date_needed).toLocaleDateString() : 'Not specified';
  
  const detailsContainer = document.getElementById('enquiry-details');
  detailsContainer.innerHTML = `
    <div class="mb-3">
      <strong>Submitted:</strong> ${submittedDate}
    </div>
    <div class="mb-3">
      <strong>Customer:</strong> ${enquiry.customer_name}
    </div>
    <div class="mb-3">
      <strong>Email:</strong> ${enquiry.email}
    </div>
    <div class="mb-3">
      <strong>Phone:</strong> ${enquiry.phone || 'Not provided'}
    </div>
    <div class="mb-3">
      <strong>Cake:</strong> ${enquiry.cake_name || 'Not specified'}
    </div>
    <div class="mb-3">
      <strong>Date Needed:</strong> ${neededDate}
    </div>
    <div class="mb-3">
      <strong>Occasion:</strong> ${enquiry.occasion || 'Not specified'}
    </div>
    <div class="mb-3">
      <strong>Size:</strong> ${enquiry.size || 'Not specified'}
    </div>
    <div class="mb-3">
      <strong>Flavor:</strong> ${enquiry.flavor || 'Not specified'}
    </div>
    <div class="mb-3">
      <strong>Special Considerations:</strong>
      <p>${enquiry.special_considerations || 'None'}</p>
    </div>
  `;
  
  const enquiryModal = new bootstrap.Modal(document.getElementById('enquiryModal'));
  enquiryModal.show();
}

// Edit cake
// In admin.js - Update the editCake function
async function editCake(id) {
  try {
    const response = await fetch(`${API_URL}/cakes/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const cake = await response.json();
    
    // Reset form
    resetCakeForm();
    
    // Set form title
    document.getElementById('cakeModalTitle').textContent = 'Edit Cake';
    
    // Fill form with cake data
    document.getElementById('cake-id').value = cake.id;
    document.getElementById('cake-name').value = cake.name;
    document.getElementById('cake-description').value = cake.description;
    document.getElementById('cake-price-6').value = cake.prices['6 inches'] || '';
    document.getElementById('cake-price-8').value = cake.prices['8 inches'] || '';
    document.getElementById('cake-price-10').value = cake.prices['10 inches'] || '';
    document.getElementById('cake-flavors').value = cake.flavors.join(', ');
    
    // Show existing images
    const existingImagesContainer = document.getElementById('existing-images-container');
    existingImagesContainer.innerHTML = '';
    
    if (cake.images && cake.images.length > 0) {
      cake.images.forEach((image, index) => {
        // Fix image URL path
        let imageUrl = 'images/placeholder.jpg';
        if (image.image_path) {
          if (image.image_path.startsWith('http')) {
            imageUrl = image.image_path;
          } else {
            const baseUrl = API_URL.replace(/\/api$/, '');
            imageUrl = baseUrl + image.image_path;
          }
        }
        
        const imageDiv = document.createElement('div');
        imageDiv.className = 'position-relative image-item';
        imageDiv.dataset.imageId = image.id;
        imageDiv.innerHTML = `
          <img src="${imageUrl}" 
               alt="Cake image ${index + 1}" 
               class="img-thumbnail" 
               style="width: 100px; height: 100px; object-fit: cover;">
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${image.is_primary ? 'success' : 'secondary'}">
            ${image.is_primary ? 'Primary' : ''}
          </span>
          <button type="button" class="btn btn-sm btn-danger position-absolute bottom-0 end-0 delete-image-btn" 
                  data-image-id="${image.id}" data-cake-id="${cake.id}">
            <i class="fas fa-trash"></i>
          </button>
          ${!image.is_primary ? `
          <button type="button" class="btn btn-sm btn-success position-absolute bottom-0 start-0 set-primary-btn" 
                  data-image-id="${image.id}" data-cake-id="${cake.id}">
            <i class="fas fa-star"></i>
          </button>` : ''}
        `;
        existingImagesContainer.appendChild(imageDiv);
      });
      
      // Add event listeners to delete and set primary buttons
      document.querySelectorAll('.delete-image-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          deleteImage(button.dataset.imageId, button.dataset.cakeId);
        });
      });
      
      document.querySelectorAll('.set-primary-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          setPrimaryImage(button.dataset.imageId, button.dataset.cakeId);
        });
      });
    } else {
      existingImagesContainer.innerHTML = '<p>No images available</p>';
    }
    
    // Show modal
    const cakeModal = new bootstrap.Modal(document.getElementById('cakeModal'));
    cakeModal.show();
    
  } catch (error) {
    console.error('Error loading cake details:', error);
    showAlert('Failed to load cake details', 'danger');
  }
}


// Add these functions to admin.js
async function deleteImage(imageId, cakeId) {
  if (!confirm('Are you sure you want to delete this image?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/admin/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Remove the image from the UI
      document.querySelector(`.image-item[data-image-id="${imageId}"]`).remove();
      showAlert('Image deleted successfully', 'success');
    } else {
      showAlert(result.error || 'Failed to delete image', 'danger');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    showAlert('Failed to delete image', 'danger');
  }
}

async function setPrimaryImage(imageId, cakeId) {
  try {
    const response = await fetch(`${API_URL}/admin/images/${imageId}/set-primary`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Reload the cake to refresh the images
      editCake(cakeId);
      showAlert('Primary image updated successfully', 'success');
    } else {
      showAlert(result.error || 'Failed to update primary image', 'danger');
    }
  } catch (error) {
    console.error('Error setting primary image:', error);
    showAlert('Failed to update primary image', 'danger');
  }
}

// Delete cake
async function deleteCake(id) {
  if (!confirm('Are you sure you want to delete this cake?')) {
    return;
  }
  
  try {
    console.log('Deleting cake:', id);
    const response = await fetch(`${API_URL}/admin/cakes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Delete result:', result);
    
    if (result.success) {
      showAlert('Cake deleted successfully', 'success');
      loadCakes();
    } else {
      showAlert(result.error || 'Failed to delete cake', 'danger');
    }
    
  } catch (error) {
    console.error('Error deleting cake:', error);
    showAlert('Failed to delete cake', 'danger');
  }
}

    // Save cake (add or edit)
      // In admin.js - Add image compression before upload
    async function saveCake() {
      const form = document.getElementById('cake-form');
      
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      
      const cakeId = document.getElementById('cake-id').value;
      const isEdit = cakeId !== '';
      
      try {
        // Get form data
        const name = document.getElementById('cake-name').value;
        const description = document.getElementById('cake-description').value;
        const size6 = document.getElementById('cake-price-6').value;
        const size8 = document.getElementById('cake-price-8').value;
        const size10 = document.getElementById('cake-price-10').value;
        const flavors = document.getElementById('cake-flavors').value;
        const imageInput = document.getElementById('cake-images');
        
        // Create FormData object
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('size_6', size6);
        formData.append('size_8', size8);
        formData.append('size_10', size10);
        formData.append('flavors', flavors);
        
        // Add flag to replace images if new ones are provided
        if (imageInput.files && imageInput.files.length > 0) {
          formData.append('replace_images', 'true');
          
          // Add compressed images
          for (let i = 0; i < imageInput.files.length; i++) {
            const file = imageInput.files[i];
            const compressedFile = await compressImage(file);
            formData.append('images', compressedFile, file.name);
          }
        }
        
        // Check if "replace all images" is checked
        const replaceAllImages = document.getElementById('replace-all-images')?.checked || false;
  
        // Add to form data
        formData.append('replace_images', replaceAllImages ? 'true' : 'false');
        // // Compress and add images if any
        // if (imageInput.files && imageInput.files.length > 0) {
        //   for (let i = 0; i < imageInput.files.length; i++) {
        //     const file = imageInput.files[i];
            
        //     // Compress image
        //     const compressedFile = await compressImage(file);
        //     formData.append('images', compressedFile, file.name);
        //   }
        // }
        
        const url = isEdit 
          ? `${API_URL}/admin/cakes/${cakeId}` 
          : `${API_URL}/admin/cakes`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`Saving cake to ${url} with method ${method}`);
        
        const response = await fetch(url, {
          method: method,
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Hide modal
          const cakeModal = bootstrap.Modal.getInstance(document.getElementById('cakeModal'));
          cakeModal.hide();
          
          // Show success message
          showAlert(`Cake ${isEdit ? 'updated' : 'added'} successfully`, 'success');
          
          // Reload cakes
          loadCakes();
        } else {
          showAlert(result.error || `Failed to ${isEdit ? 'update' : 'add'} cake`, 'danger');
        }
        
      } catch (error) {
        console.error('Error saving cake:', error);
        showAlert(`Failed to ${isEdit ? 'update' : 'add'} cake: ${error.message}`, 'danger');
      }
    }

    // Image compression function
    async function compressImage(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
          const img = new Image();
          img.src = event.target.result;
          
          img.onload = function() {
            // Create canvas
            const canvas = document.createElement('canvas');
            
            // Calculate new dimensions (max 800x600)
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > 800) {
                height = Math.round((height * 800) / width);
                width = 800;
              }
            } else {
              if (height > 600) {
                width = Math.round((width * 600) / height);
                height = 600;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw image on canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                // Create a new file with compressed data
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                resolve(compressedFile);
              },
              'image/jpeg',
              0.7  // Quality (0.7 = 70%)
            );
          };
        };
      });
    }


// Add this to admin.js
async function fixDatabase() {
  try {
    const response = await fetch(`${API_URL}/admin/fix-database`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Fixed ${result.fixedCakes} cakes with missing images`);
      showAlert(`Database fixed: ${result.fixedCakes} cakes updated`, 'success');
    } else {
      showAlert(result.error || 'Failed to fix database', 'danger');
    }
  } catch (error) {
    console.error('Error fixing database:', error);
    showAlert('Failed to fix database', 'danger');
  }
}

// Add a button to your admin dashboard to call this function
// <button class="btn btn-warning" onclick="fixDatabase()">Fix Database</button>


// Reset cake form
function resetCakeForm() {
  const form = document.getElementById('cake-form');
  form.reset();
  form.classList.remove('was-validated');
  
  document.getElementById('cake-id').value = '';
  document.getElementById('image-preview-container').innerHTML = '';
  document.getElementById('existing-images-container').innerHTML = '';
}

// Preview images before upload
function previewImages() {
  const input = document.getElementById('cake-images');
  const previewContainer = document.getElementById('image-preview-container');
  
  previewContainer.innerHTML = '';
  
  if (input.files && input.files.length > 0) {
    // Check if too many files are selected
    if (input.files.length > 4) {
      showAlert('You can only upload up to 4 images', 'warning');
      input.value = '';
      return;
    }
    
    previewContainer.innerHTML = '<h6>New Images:</h6>';
    
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'position-relative';
        imageDiv.innerHTML = `
          <img src="${e.target.result}" 
               alt="Preview" 
               class="img-thumbnail" 
               style="width: 100px; height: 100px; object-fit: cover;">
          <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${i === 0 ? 'success' : 'secondary'}">
            ${i === 0 ? 'Primary' : ''}
          </span>
        `;
        previewContainer.appendChild(imageDiv);
      };
      
      reader.readAsDataURL(file);
    }
  }
}

// Show alert
function showAlert(message, type = 'success') {
  const alertContainer = document.getElementById('alert-container');
  if (!alertContainer) return;
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  alertContainer.appendChild(alert);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}