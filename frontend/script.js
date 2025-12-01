const form = document.getElementById('feedbackForm');
const messageDiv = document.getElementById('message');

// Emoji Rating Logic
document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parent = e.target.closest('.emoji-rating');
        const fieldName = parent.dataset.field;
        const value = e.target.dataset.value;
        const input = document.getElementById(fieldName);

        // Update hidden input
        input.value = value;

        // Visual selection
        parent.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
    });
});

// File Input Logic (Show filename)
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const wrapper = e.target.closest('.file-input-wrapper');
        const label = wrapper.querySelector('.file-btn');
        if (e.target.files.length > 0) {
            label.textContent = e.target.files[0].name;
            label.style.backgroundColor = '#e0e0e0';
        } else {
            label.textContent = 'Choose File';
            label.style.backgroundColor = '#f0f0f0';
        }
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    messageDiv.classList.add('hidden');
    messageDiv.className = 'hidden';

    // Validation: Phone Number
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^\+?[0-9]{10,15}$/; // Basic check: 10-15 digits, optional +
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        messageDiv.textContent = 'Please enter a valid phone number (10-15 digits).';
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
    }

    // Validation: Terms and Conditions
    const terms = document.getElementById('terms_accepted');
    if (!terms.checked) {
        messageDiv.textContent = 'You must accept the Terms and Conditions.';
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
    }

    // Validation: At least one rating required
    const ratingAir = document.getElementById('rating_air').value;
    const ratingWashroom = document.getElementById('rating_washroom').value;

    if (!ratingAir && !ratingWashroom) {
        messageDiv.textContent = 'Please rate at least one service (Air or Washroom).';
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
    }

    const formData = new FormData(form);

    // Handle checkboxes manually if needed (though FormData usually handles them)
    // If unchecked, they won't be in FormData, so we might need to append false if backend expects it
    if (!formData.has('is_testimonial')) formData.append('is_testimonial', 'false');
    if (!formData.has('terms_accepted')) formData.append('terms_accepted', 'false');

    // Remove empty optional fields to avoid 422 errors (Backend expects int/null, not empty string)
    const optionalFields = ['rating_air', 'rating_washroom'];
    optionalFields.forEach(field => {
        if (formData.has(field) && formData.get(field) === '') {
            formData.delete(field);
        }
    });

    // Capture ro_number from URL (supporting ro_number, ro, source_id, location - case insensitive)
    const roInput = document.getElementById('ro_number');
    if (roInput && roInput.value) {
        // Already populated (e.g. by previous logic or manual entry if we make it visible)
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        let roNumber = null;

        // Direct check first
        roNumber = urlParams.get('ro_number') || urlParams.get('ro') || urlParams.get('source_id') || urlParams.get('location');

        // Case insensitive check if not found
        if (!roNumber) {
            for (const [key, value] of urlParams.entries()) {
                const lowerKey = key.toLowerCase();
                if (['ro_number', 'ro', 'source_id', 'location', 'ronumber'].includes(lowerKey)) {
                    roNumber = value;
                    break;
                }
            }
        }

        if (roNumber) {
            console.log('Capturing RO Number:', roNumber);
            if (roInput) roInput.value = roNumber;
        }
    }

    try {
        const response = await fetch('/feedback/', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            messageDiv.textContent = 'Thank you! Your feedback has been submitted.';
            messageDiv.classList.remove('hidden');
            messageDiv.classList.add('success');
            form.reset();
            // Reset visual states
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            document.querySelectorAll('.file-btn').forEach(b => b.textContent = 'Choose File');
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Something went wrong. Please try again.';
        messageDiv.classList.remove('hidden');
        messageDiv.classList.add('error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
});
