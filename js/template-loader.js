// // js/template-loader.js
// document.addEventListener('DOMContentLoaded', async function() {
//     // Load templates
//     const headerTemplate = await fetchTemplate('templates/header.html');
//     const navbarTemplate = await fetchTemplate('templates/navbar.html');
//     const footerTemplate = await fetchTemplate('templates/footer.html');
    
//     // Get current page
//     const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
//     // Insert header (replace title)
//     let pageTitle = 'Home';
//     if (currentPage === 'about.html') pageTitle = 'About Us';
//     if (currentPage === 'contact.html') pageTitle = 'Contact Us';
//     if (currentPage === 'cake.html') pageTitle = 'Cake Details';
    
//     const header = headerTemplate.replace('TITLE_PLACEHOLDER', pageTitle);
//     document.body.insertAdjacentHTML('afterbegin', header);
    
//     // Insert navbar (set active class)
//     let navbar = navbarTemplate;
//     navbar = navbar.replace('NAV_HOME_ACTIVE', currentPage === 'index.html' ? 'active' : '');
//     navbar = navbar.replace('NAV_ABOUT_ACTIVE', currentPage === 'about.html' ? 'active' : '');
//     navbar = navbar.replace('NAV_CONTACT_ACTIVE', currentPage === 'contact.html' ? 'active' : '');
    
//     document.body.insertAdjacentHTML('afterbegin', navbar);
    
//     // Insert footer
//     document.body.insertAdjacentHTML('beforeend', footerTemplate);
// });

async function fetchTemplate(url) {
    const response = await fetch(url);
    return await response.text();
}

// js/template-loader.js
async function loadTemplates(callback) {
    // Load templates
    const headerTemplate = await fetchTemplate('templates/header.html');
    const navbarTemplate = await fetchTemplate('templates/navbar.html');
    const footerTemplate = await fetchTemplate('templates/footer.html');
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Insert header (replace title)
    let pageTitle = 'Home';
    if (currentPage === 'about.html') pageTitle = 'About Us';
    if (currentPage === 'contact.html') pageTitle = 'Contact Us';
    if (currentPage === 'cake.html') pageTitle = 'Cake Details';
    
    const header = headerTemplate.replace('TITLE_PLACEHOLDER', pageTitle);
    document.body.insertAdjacentHTML('afterbegin', header);
    
    // Insert navbar (set active class)
    let navbar = navbarTemplate;
    navbar = navbar.replace('NAV_HOME_ACTIVE', currentPage === 'index.html' ? 'active' : '');
    navbar = navbar.replace('NAV_ABOUT_ACTIVE', currentPage === 'about.html' ? 'active' : '');
    navbar = navbar.replace('NAV_CONTACT_ACTIVE', currentPage === 'contact.html' ? 'active' : '');
    
    document.body.insertAdjacentHTML('afterbegin', navbar);
    
    // Insert footer
    document.body.insertAdjacentHTML('beforeend', footerTemplate);
    
    // Call the callback function when templates are loaded
    if (callback) callback();
}

async function fetchTemplate(url) {
    const response = await fetch(url);
    return await response.text();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadTemplates(() => {
        // This will run after templates are loaded
        console.log('Templates loaded, initializing app...');
        // If there's an init function defined, call it
        if (typeof initApp === 'function') {
            initApp();
        }
    });
});
