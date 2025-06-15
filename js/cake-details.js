// JavaScript for the cake details page
document.addEventListener('DOMContentLoaded', () => {
    // Get cake ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const cakeId = urlParams.get('id');
    
    if (!cakeId) {
        showAlert('Cake not found', 'danger');
        return;
    }
    
    loadCakeDetails(cakeId);
});

async function loadCakeDetails(cakeId) {
    try {
        const cakeDetailsContainer = document.getElementById('cake-details');
        const enquiryFormContainer = document.getElementById('enquiry-form-container');
        
        if (!cakeDetailsContainer) return;
        
        // Show loading state
        cakeDetailsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/cakes/${cakeId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                cakeDetailsContainer.innerHTML = '<div class="alert alert-danger">Cake not found</div>';
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return;
        }
        
        const cake = await response.json();
        
        // Update page title
        document.title = `${cake.name} - Cakes by Varsha`;
        
        // Create cake details HTML
        let imagesHtml = '';
        if (cake.images && cake.images.length > 0) {
            const mainImage = cake.images[0];
            
            imagesHtml = `
                <div class="cake-image-gallery">
                    <img src="${API_URL}${mainImage.image_path}" id="main-cake-image" class="cake-main-image" alt="${cake.name}">
                    <div class="cake-thumbnails">
            `;
            
            cake.images.forEach((image, index) => {
                imagesHtml += `
                    <img src="${API_URL}${image.image_path}" 
                         class="cake-thumbnail ${index === 0 ? 'active' : ''}" 
                         alt="${cake.name}" 
                         onclick="changeMainImage('${API_URL}${image.image_path}', this)">
                `;
            });
            
            imagesHtml += `
                    </div>
                </div>
            `;
        } else {
            imagesHtml = `
                <div class="cake-image-gallery">
                    <img src="${API_URL}/api/images/placeholder.jpg" class="cake-main-image" alt="${cake.name}">
                </div>
            `;
        }
        
        // Create prices HTML
        let pricesHtml = '<ul class="cake-price-list">';
        if (cake.prices && Object.keys(cake.prices).length > 0) {
            Object.entries(cake.prices).forEach(([size, price]) => {
                pricesHtml += `<li>${size}: ₹${price}</li>`;
            });
        } else {
            pricesHtml += '<li>Price on request</li>';
        }
        pricesHtml += '</ul>';
        
        // Create flavors HTML
        let flavorsHtml = '';
        if (cake.flavors && cake.flavors.length > 0) {
            cake.flavors.forEach(flavor => {
                flavorsHtml += `<span class="cake-flavors">${flavor}</span>`;
            });
        }
        
        cakeDetailsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    ${imagesHtml}
                </div>
                <div class="col-md-6">
                    <div class="cake-details-info">
                        <h1>${cake.name}</h1>
                        <p>${cake.description}</p>
                        
                        <h3>Prices</h3>
                        ${pricesHtml}
                        
                        <h3>Available Flavors</h3>
                        <div class="mb-4">
                            ${flavorsHtml || '<p>No flavors specified</p>'}
                        </div>
                        
                        <button id="request-quote-btn" class="btn btn-primary">Request a Quote</button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup enquiry form
        if (enquiryFormContainer) {
            // Set cake ID and name in hidden fields
            document.getElementById('cake_id').value = cake.id;
            document.getElementById('cake_name').value = cake.name;
            
            // Populate size dropdown
            const sizeSelect = document.getElementById('size');
            if (sizeSelect && cake.prices) {
                Object.keys(cake.prices).forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = size;
                    sizeSelect.appendChild(option);
                });
            }
            
            // Populate flavor dropdown
            const flavorSelect = document.getElementById('flavor');
            if (flavorSelect && cake.flavors) {
                cake.flavors.forEach(flavor => {
                    const option = document.createElement('option');
                    option.value = flavor;
                    option.textContent = flavor;
                    flavorSelect.appendChild(option);
                });
            }
            
            // Show enquiry form when button is clicked
            document.getElementById('request-quote-btn').addEventListener('click', () => {
                enquiryFormContainer.classList.remove('d-none');
                enquiryFormContainer.scrollIntoView({ behavior: 'smooth' });
            });
            
            // Setup form submission
            document.getElementById('enquiry-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Form validation
                const form = e.target;
                if (!form.checkValidity()) {
                    e.stopPropagation();
                    form.classList.add('was-validated');
                    return;
                }
                
                // Collect form data
                const formData = new FormData(form);
                const enquiryData = {
                    cake_id: formData.get('cake_id'),
                    cake_name: formData.get('cake_name'),
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    date_needed: formData.get('date_needed'),
                    occasion: formData.get('occasion'),
                    size: formData.get('size'),
                    flavor: formData.get('flavor'),
                    message: formData.get('message')
                };
                
                try {
                    const response = await fetch(`${API_URL}/enquiry`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(enquiryData)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showAlert('Your enquiry has been submitted successfully! We will contact you soon.', 'success');
                        form.reset();
                        form.classList.remove('was-validated');
                        enquiryFormContainer.classList.add('d-none');
                    } else {
                        showAlert(`Error: ${result.error || 'Failed to submit enquiry'}`, 'danger');
                    }
                } catch (error) {
                    console.error('Error submitting enquiry:', error);
                    showAlert('Failed to submit enquiry. Please try again later.', 'danger');
                }
            });
        }
    } catch (error) {
        console.error('Error loading cake details:', error);
        document.getElementById('cake-details').innerHTML = 
            '<div class="alert alert-danger">Failed to load cake details. Please try again later.</div>';
    }
}

// Function to change the main image when a thumbnail is clicked
function changeMainImage(imageSrc, thumbnail) {
    document.getElementById('main-cake-image').src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.cake-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

// Function to show alerts
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