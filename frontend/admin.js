const API_URL = '/admin';
let feedbackData = [];
let airChart = null;
let washroomChart = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const feedbackTableBody = document.querySelector('#feedbackTable tbody');

// Check Auth on Load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('admin_token', data.access_token);
            showDashboard();
        } else {
            loginError.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Server error';
        loginError.classList.remove('hidden');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('admin_token');
    showLogin();
});

// View Switching
function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    fetchReports();
}

// Fetch Data
async function fetchReports() {
    const token = localStorage.getItem('admin_token');
    try {
        const response = await fetch(`${API_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            feedbackData = await response.json();
            console.log('Reports fetched:', feedbackData.length);

            try {
                renderStats();
            } catch (e) { console.error('Error rendering stats:', e); }

            try {
                renderCharts();
            } catch (e) { console.error('Error rendering charts:', e); }

            // Initialize filters
            console.log('Initializing filters to 30days');
            try {
                setQuickDate('30days');
                const btn30 = document.querySelector('.quick-date-btn[data-range="30days"]');
                if (btn30) {
                    document.querySelectorAll('.quick-date-btn').forEach(b => b.classList.remove('active'));
                    btn30.classList.add('active');
                }
            } catch (e) {
                console.error('Error initializing filters:', e);
                // Fallback: render table anyway
                renderTable();
            }
        } else if (response.status === 401) {
            logoutBtn.click(); // Token expired
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
    }
}

// Render Stats
function renderStats() {
    const total = feedbackData.length;
    const resolved = feedbackData.filter(f => f.status === 'resolved').length;
    const pending = total - resolved;

    // Assuming these IDs exist in the new HTML, if not, we might need to update HTML or ignore
    // The new HTML removed the stats cards at the top, so we might skip this or check if elements exist
    // The new design doesn't seem to have the top stats cards anymore based on the HTML provided in Step 521.
    // However, let's keep it safe.
    if (document.getElementById('totalCount')) document.getElementById('totalCount').textContent = total;
    if (document.getElementById('resolvedCount')) document.getElementById('resolvedCount').textContent = resolved;
    if (document.getElementById('pendingCount')) document.getElementById('pendingCount').textContent = pending;
}

// Render Charts
function renderCharts() {
    const airRatings = [0, 0, 0, 0]; // 0 index unused, 1-3 used
    const washroomRatings = [0, 0, 0, 0];

    feedbackData.forEach(f => {
        if (f.rating_air >= 1 && f.rating_air <= 3) airRatings[f.rating_air]++;
        if (f.rating_washroom >= 1 && f.rating_washroom <= 3) washroomRatings[f.rating_washroom]++;
    });

    const ctxAir = document.getElementById('airRatingChart').getContext('2d');
    const ctxWash = document.getElementById('washroomRatingChart').getContext('2d');

    if (airChart) airChart.destroy();
    if (washroomChart) washroomChart.destroy();

    airChart = new Chart(ctxAir, chartConfig('Air Facility', airRatings, '#3b82f6'));
    washroomChart = new Chart(ctxWash, chartConfig('Washroom', washroomRatings, '#10b981'));
}

// Filter State
let filters = {
    dateStart: '',
    dateEnd: '',
    status: 'all',
    method: 'all',
    search: ''
};

// Event Listeners for Filters
document.getElementById('filterDateStart').addEventListener('change', (e) => {
    filters.dateStart = e.target.value;
    updateActiveFilters();
    renderTable();
});
document.getElementById('filterDateEnd').addEventListener('change', (e) => {
    filters.dateEnd = e.target.value;
    updateActiveFilters();
    renderTable();
});
document.getElementById('filterStatus').addEventListener('change', (e) => {
    filters.status = e.target.value;
    updateActiveFilters();
    renderTable();
});
document.getElementById('filterMethod').addEventListener('change', (e) => {
    filters.method = e.target.value;
    updateActiveFilters();
    renderTable();
});
document.getElementById('filterSearch').addEventListener('input', (e) => {
    filters.search = e.target.value.toLowerCase();
    toggleClearSearch(e.target.value);
    renderTable();
});
document.getElementById('clearSearchBtn').addEventListener('click', () => {
    filters.search = '';
    document.getElementById('filterSearch').value = '';
    toggleClearSearch('');
    renderTable();
});
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);

// Quick Date Buttons
document.querySelectorAll('.quick-date-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.quick-date-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        setQuickDate(e.target.dataset.range);
    });
});

function toggleClearSearch(value) {
    const btn = document.getElementById('clearSearchBtn');
    if (value) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

function setQuickDate(range) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
        // start and end are today
    } else if (range === '7days') {
        start.setDate(today.getDate() - 7);
    } else if (range === '30days') {
        start.setDate(today.getDate() - 30);
    } else if (range === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (range === 'custom') {
        return; // Do nothing, let user pick
    }

    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    filters.dateStart = formatDate(start);
    filters.dateEnd = formatDate(end);

    document.getElementById('filterDateStart').value = filters.dateStart;
    document.getElementById('filterDateEnd').value = filters.dateEnd;

    updateActiveFilters();
    renderTable();
}

function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    const clearBtn = document.getElementById('clearFiltersBtn');
    container.innerHTML = '';

    let hasFilters = false;

    // Helper to add chip
    const addChip = (label, type) => {
        hasFilters = true;
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `${label} <i class="fas fa-times" onclick="removeFilter('${type}')"></i>`;
        container.appendChild(chip);
    };

    if (filters.status !== 'all') addChip(`Status: ${filters.status}`, 'status');
    if (filters.method !== 'all') addChip(`Method: ${filters.method}`, 'method');
    // Date chips could be added here too if desired, but quick dates handle it visually

    if (hasFilters) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
}

// Global function for onclick in HTML
window.removeFilter = function (type) {
    if (type === 'status') {
        filters.status = 'all';
        document.getElementById('filterStatus').value = 'all';
    } else if (type === 'method') {
        filters.method = 'all';
        document.getElementById('filterMethod').value = 'all';
    }
    updateActiveFilters();
    renderTable();
};

function clearAllFilters() {
    filters.status = 'all';
    filters.method = 'all';
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterMethod').value = 'all';

    // Reset to 30 Days
    setQuickDate('30days');
    document.querySelectorAll('.quick-date-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.quick-date-btn[data-range="30days"]').classList.add('active');
}

// Render Table
function renderTable() {
    feedbackTableBody.innerHTML = '';

    const filteredData = feedbackData.filter(f => {
        // Date Filter
        // Parse created_at as UTC then convert to local YYYY-MM-DD
        const getLocalDateStr = (dateStr) => {
            // Append Z if missing to ensure it's treated as UTC
            const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (filters.dateStart) {
            const fDate = getLocalDateStr(f.created_at);
            console.log(`Checking Date: Record=${fDate} (${f.created_at}), Start=${filters.dateStart}`);
            if (fDate < filters.dateStart) return false;
        }
        if (filters.dateEnd) {
            const fDate = getLocalDateStr(f.created_at);
            console.log(`Checking Date: Record=${fDate} (${f.created_at}), End=${filters.dateEnd}`);
            if (fDate > filters.dateEnd) return false;
        }

        // Status Filter
        if (filters.status !== 'all' && f.status !== filters.status) return false;

        // Method Filter
        if (filters.method !== 'all' && f.feedback_method !== filters.method) return false;

        // Search Filter (RO or Phone)
        if (filters.search) {
            const ro = (f.ro_number || '').toLowerCase();
            const phone = f.phone.toLowerCase();
            const dateStr = new Date(f.created_at).toLocaleDateString().toLowerCase();
            if (!ro.includes(filters.search) && !phone.includes(filters.search) && !dateStr.includes(filters.search)) return false;
        }

        return true;
    });

    // Update Count
    document.getElementById('resultsCount').textContent = `Showing ${filteredData.length} of ${feedbackData.length} results`;
    document.getElementById('exportBtn').innerHTML = `<i class="fas fa-file-csv"></i> Export CSV (${filteredData.length})`;

    filteredData.forEach(f => {
        const row = document.createElement('tr');
        const date = new Date(f.created_at + 'Z').toLocaleString();
        const statusClass = f.status === 'resolved' ? 'status-resolved' : 'status-pending';

        // Button Logic
        const isResolved = f.status === 'resolved';
        const btnClass = isResolved ? 'btn-success' : 'btn-edit';
        const btnIcon = isResolved ? 'fa-check' : 'fa-pen';
        const btnTitle = isResolved ? 'Resolved' : 'Mark as Resolved';

        row.innerHTML = `
            <td>${date}</td>
            <td>${f.ro_number || '-'}</td>
            <td>${f.feedback_method || '-'}</td>
            <td>${f.phone}</td>
            <td>${getEmoji(f.rating_air)}</td>
            <td>${getEmoji(f.rating_washroom)}</td>
            <td><span class="status-badge ${statusClass}">${f.status}</span></td>
            <td>
                <button class="action-btn btn-view" onclick="viewDetails(${f.id})" title="View Details"><i class="fas fa-eye"></i></button>
                <button class="action-btn ${btnClass}" onclick="toggleStatus(${f.id}, '${f.status}')" title="${btnTitle}"><i class="fas ${btnIcon}"></i></button>
            </td>
        `;
        feedbackTableBody.appendChild(row);
    });
}

// Export to CSV
function exportToCSV() {
    // Re-apply filters to get current view data
    const dataToExport = feedbackData.filter(f => {
        // Date Filter
        const getLocalDateStr = (dateStr) => {
            const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (filters.dateStart) {
            const fDate = getLocalDateStr(f.created_at);
            if (fDate < filters.dateStart) return false;
        }
        if (filters.dateEnd) {
            const fDate = getLocalDateStr(f.created_at);
            if (fDate > filters.dateEnd) return false;
        }
        if (filters.status !== 'all' && f.status !== filters.status) return false;
        if (filters.method !== 'all' && f.feedback_method !== filters.method) return false;
        if (filters.search) {
            const ro = (f.ro_number || '').toLowerCase();
            const phone = f.phone.toLowerCase();
            const dateStr = new Date(f.created_at).toLocaleDateString().toLowerCase();
            if (!ro.includes(filters.search) && !phone.includes(filters.search) && !dateStr.includes(filters.search)) return false;
        }
        return true;
    });

    if (dataToExport.length === 0) {
        alert("No data to export");
        return;
    }

    const headers = ['Date', 'RO Number', 'Method', 'Phone', 'Air Rating', 'Washroom Rating', 'Status', 'Comment'];
    const csvRows = [headers.join(',')];

    dataToExport.forEach(f => {
        const row = [
            `"${new Date(f.created_at + 'Z').toLocaleString()}"`,
            `"${f.ro_number || ''}"`,
            `"${f.feedback_method || ''}"`,
            `"${f.phone}"`,
            f.rating_air || '',
            f.rating_washroom || '',
            f.status,
            `"${(f.comment || '').replace(/"/g, '""')}"` // Escape quotes
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'feedback_report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function getEmoji(rating) {
    if (rating === 1) return '😢';
    if (rating === 2) return '😐';
    if (rating === 3) return '😊';
    return '-';
}

// Chart Config
function chartConfig(label, data, color) {
    return {
        type: 'bar',
        data: {
            labels: ['Sad 😢', 'Neutral 😐', 'Happy 😊'],
            datasets: [{
                label: label,
                data: [data[1] || 0, data[2] || 0, data[3] || 0],
                backgroundColor: color,
                borderRadius: 6,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    };
}

// Toggle Status (Not directly used in UI but good to have)
window.toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    const token = localStorage.getItem('admin_token');

    try {
        const response = await fetch(`${API_URL}/feedback/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            fetchReports(); // Refresh data
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
};

// View Details Modal
const modal = document.getElementById('detailModal');
const closeModal = document.querySelector('.close-modal');

closeModal.onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); };

window.viewDetails = (id) => {
    const f = feedbackData.find(item => item.id === id);
    if (!f) return;

    document.getElementById('modalPhone').textContent = f.phone;
    document.getElementById('modalDate').textContent = new Date(f.created_at + 'Z').toLocaleString();

    // Add Session ID display if not exists, or just append to body
    const modalBody = document.querySelector('.modal-body');
    let sessionP = document.getElementById('modalSession');
    if (!sessionP) {
        sessionP = document.createElement('p');
        sessionP.id = 'modalSession';
        sessionP.innerHTML = '<strong>Session ID:</strong> <span id="modalSessionVal"></span>';
        modalBody.insertBefore(sessionP, document.getElementById('modalComment').parentNode);
    }
    document.getElementById('modalSessionVal').textContent = f.session_id || '-';
    document.getElementById('modalComment').textContent = f.comment || 'No comment';
    document.getElementById('modalTestimonial').textContent = f.is_testimonial ? 'Yes' : 'No';

    // Clear previous images
    document.querySelector('.modal-images').innerHTML = '';

    addImage(f.photo_air, 'air', 'Air Facility Photo');
    addImage(f.photo_washroom, 'washroom', 'Washroom Photo');
    addImage(f.photo_receipt, 'receipt', 'Receipt Photo');

    modal.classList.remove('hidden');
};

function addImage(imageData, type, label) {
    if (!imageData) return;

    const container = document.querySelector('.modal-images');
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-item';

    const title = document.createElement('h4');
    title.textContent = label;

    const img = document.createElement('img');
    img.src = `data:image/jpeg;base64,${imageData}`;

    imgContainer.appendChild(title);
    imgContainer.appendChild(img);
    container.appendChild(imgContainer);
}
