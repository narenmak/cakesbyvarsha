// JavaScript for the contact page
document.addEventListener('DOMContentLoaded', () => {
    setupContactForm();
});

function setupContactForm() {
   // js/contact.js
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Form validation
        if (!contactForm.checkValidity()) {
            e.stopPropagation();
            contactForm.classList.add('was-validated');
            return;
        }
        
        // Get form data
        const formData = new FormData(contactForm);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            message: formData.get('message')
        };
        
        // Show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Sending...
        `;
        
        try {
            // First save to database via API
            const response = await fetch(`${API_URL}/enquiry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to send message');
            }
            
            // Show success message
            const formAlert = document.getElementById('form-alert');
            if (formAlert) {
                formAlert.classList.remove('d-none', 'alert-danger');
                formAlert.classList.add('alert-success');
                formAlert.innerHTML = 'Your message has been sent successfully! We will get back to you soon.';
            }
            
            // Reset form
            contactForm.reset();
            contactForm.classList.remove('was-validated');
        } catch (error) {
            console.error('Error sending contact form:', error);
            
            // Show error message
            const formAlert = document.getElementById('form-alert');
            if (formAlert) {
                formAlert.classList.remove('d-none', 'alert-success');
                formAlert.classList.add('alert-danger');
                formAlert.innerHTML = 'Failed to send message. Please try again later or contact us directly.';
            }
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});

}