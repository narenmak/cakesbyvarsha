// Main JavaScript for the homepage
document.addEventListener('DOMContentLoaded', () => {
    loadCakes();
});


// js/app.js
function initApp() {
    console.log('App initialized with API_URL:', API_URL);
    loadCakes();
}

async function loadCakes() {
    try {
        const response = await fetch(`${API_URL}/cakes`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const cakes = await response.json();
        
        const cakesContainer = document.getElementById('cakes-container');
        if (!cakesContainer) return;
        
        cakesContainer.innerHTML = '';
        
        if (cakes.length === 0) {
            cakesContainer.innerHTML = '<p class="text-center">No cakes available at the moment.</p>';
            return;
        }
        
        cakes.forEach(cake => {
            // Fix image URL path
            const imageUrl = cake.image_url 
                ? (cake.image_url.startsWith('http') ? cake.image_url : API_URL + cake.image_url)
                : 'images/placeholder.jpg';
            
            const cakeCard = document.createElement('div');
            cakeCard.className = 'col-md-4 mb-4';
            cakeCard.innerHTML = `
                <div class="card h-100">
                    <img src="${imageUrl}" class="card-img-top" alt="${cake.name}">
                    <div class="card-body">
                        <h5 class="card-title">${cake.name}</h5>
                        <p class="card-text">${cake.description ? cake.description.substring(0, 100) + (cake.description.length > 100 ? '...' : '') : ''}</p>
                        <p class="price">Starting from ₹${getMinPrice(cake.prices)}</p>
                        <a href="cake.html?id=${cake.id}" class="btn btn-primary">View Details</a>
                    </div>
                </div>
            `;
            cakesContainer.appendChild(cakeCard);
        });
    } catch (error) {
        console.error('Error loading cakes:', error);
        const cakesContainer = document.getElementById('cakes-container');
        if (cakesContainer) {
            cakesContainer.innerHTML = '<p class="text-center text-danger">Failed to load cakes. Please try again later.</p>';
        }
    }
}

function getMinPrice(prices) {
    if (!prices) return 0;
    const priceValues = Object.values(prices).filter(price => !isNaN(price) && price > 0);
    return priceValues.length > 0 ? Math.min(...priceValues) : 0;
}


// async function loadCakes() {
//     try {
//         const cakesContainer = document.getElementById('cakes-container');
//         if (!cakesContainer) return;
        
//         // Show loading state
//         cakesContainer.innerHTML = `
//             <div class="text-center w-100">
//                 <div class="spinner-border text-primary" role="status">
//                     <span class="visually-hidden">Loading...</span>
//                 </div>
//             </div>
//         `;
        
//         const response = await fetch(`${API_URL}/cakes`);
        
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
        
//         const cakes = await response.json();
        
//         cakesContainer.innerHTML = '';
        
//         if (cakes.length === 0) {
//             cakesContainer.innerHTML = '<p class="text-center">No cakes available at the moment.</p>';
//             return;
//         }
        
//         cakes.forEach(cake => {
//             // Find the minimum price from the prices object

//             let minPrice = 0;
//             if (cake.prices) {
//                 const prices = Object.values(cake.prices).filter(price => !isNaN(price) && price > 0);
//                 minPrice = prices.length > 0 ? Math.min(...prices) : 0;
//             }
            
//             const imageUrl = cake.image_url ? (cake.image_url.startsWith('http') ? cake.image_url : API_URL + cake.image_url) : '../images/placeholder.jpg';
            
//             const cakeCard = document.createElement('div');
//             cakeCard.className = 'col-md-4 mb-4';
//             cakeCard.innerHTML = `
//             <div class="card h-100">
//                 <img src="${imageUrl}" class="card-img-top" alt="${cake.name}">
//                 <!-- rest of the card -->
//             </div>
//             `;
//             cakesContainer.appendChild(cakeCard);
//         });
//     } catch (error) {
//         console.error('Error loading cakes:', error);
//         document.getElementById('cakes-container').innerHTML = 
//             '<p class="text-center text-danger">Failed to load cakes. Please try again later.</p>';
//     }
// }

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