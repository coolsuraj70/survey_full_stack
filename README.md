# 📋 Feedback Portal

A modern, full-stack feedback collection and management system designed for high-traffic environments. It allows users to submit feedback via a web interface or WhatsApp, and provides admins with a powerful dashboard for analytics and reporting.

## ✨ Features

### 🚀 User Interface
- **Responsive Design**: Works seamlessly on mobile and desktop.
- **Emoji Ratings**: Intuitive 3-point scale (Happy, Neutral, Sad) for quick feedback.
- **Photo Uploads**: Users can upload photos of facilities (Air, Washroom) and receipts.
- **Form Validation**: robust validation for phone numbers and required fields.

### 🛡️ Admin Dashboard
- **Secure Login**: JWT-based authentication.
- **Visual Analytics**: Interactive charts for rating distributions.
- **Data Filtering**: Filter by date range (Last 30 Days, Custom), status, and method.
- **Export**: Export filtered data to CSV.
- **Quick Actions**: Mark feedback as resolved/pending directly from the table.
- **Detailed View**: View full feedback details including embedded photos.

### ⚙️ Backend & Automation
- **FastAPI**: High-performance Python web framework.
- **PostgreSQL (Neon)**: Robust, serverless database storage.
- **Image Storage**: Images stored securely in the database as BLOBs.
- **Email Notifications**: 
    - **Daily Reports**: PDF summary of all feedback sent every 24 hours.
    - **Instant Alerts**: Immediate emails with embedded photos for negative feedback (1-star).
- **WhatsApp Integration** (Optional): Support for feedback collection via WhatsApp bot.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Design), JavaScript (Vanilla)
- **Backend**: Python 3.10+, FastAPI, SQLModel (SQLAlchemy)
- **Database**: PostgreSQL (Neon.tech)
- **Deployment**: Render.com (Docker/Python Environment)

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL Database (or Neon account)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Survey
    ```

2.  **Create a Virtual Environment**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configuration**
    Create a `.env` file in the root directory (use `.env.example` as a template):
    ```ini
    DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
    SECRET_KEY=your_secret_key
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=admin
    MAIL_USERNAME=your_email@gmail.com
    MAIL_PASSWORD=your_app_password
    MAIL_FROM=your_email@gmail.com
    MAIL_TO=recipient@email.com
    ```

5.  **Run Locally**
    ```bash
    uvicorn backend.main:app --reload
    ```
    - Frontend: `http://localhost:8000`
    - Admin: `http://localhost:8000/admin.html`
    - API Docs: `http://localhost:8000/docs`

## 📦 Deployment

This project is configured for easy deployment on **Render.com**.

See [DEPLOYMENT.md](DEPLOYMENT.md) for a detailed step-by-step guide.

## 📂 Project Structure

```
Survey/
├── backend/            # FastAPI application
│   ├── routers/        # API endpoints (feedback, admin, whatsapp)
│   ├── models.py       # Database models
│   ├── tasks.py        # Background tasks (Email, PDF)
│   └── main.py         # App entry point
├── frontend/           # Static assets
│   ├── index.html      # Feedback form
│   ├── admin.html      # Admin dashboard
│   ├── style.css       # Styles
│   └── script.js       # Frontend logic
├── uploads/            # Temp storage (if needed)
├── .env                # Environment variables
├── render.yaml         # Render deployment config
└── requirements.txt    # Python dependencies
```

## 📄 License

This project is licensed under the MIT License.
