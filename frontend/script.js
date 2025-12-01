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

// Capture ro_number from URL on load
const roInput = document.getElementById('ro_number');
if (roInput) {
    const urlParams = new URLSearchParams(window.location.search);
    let roNumber = urlParams.get('ro_number') || urlParams.get('ro') || urlParams.get('source_id') || urlParams.get('location');

    if (!roNumber) {
        for (const [key, value] of urlParams.entries()) {
            if (['ro_number', 'ro', 'source_id', 'location', 'ronumber'].includes(key.toLowerCase())) {
                roNumber = value;
                break;
            }
        }
    }

    if (roNumber) {
        console.log('Capturing RO Number:', roNumber);
        roInput.value = roNumber;
    }
}

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

    // Handle checkboxes manually if needed
    if (!formData.has('is_testimonial')) formData.append('is_testimonial', 'false');
    if (!formData.has('terms_accepted')) formData.append('terms_accepted', 'false');

    // Remove empty optional fields
    const optionalFields = ['rating_air', 'rating_washroom'];
    optionalFields.forEach(field => {
        if (formData.has(field) && formData.get(field) === '') {
            formData.delete(field);
        }
    });

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
