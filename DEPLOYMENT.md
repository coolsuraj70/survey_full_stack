# Deployment Guide

This guide explains how to deploy the Feedback Portal to **Render.com**.

## Prerequisites
1.  **GitHub Account**: Push this code to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Database**: A PostgreSQL database (Neon.tech is recommended and already configured).

## Step 1: Push Code to GitHub
1.  Initialize git (if not already):
    ```bash
    git init
    git add .
    git commit -m "Ready for deployment"
    ```
2.  Create a new repository on GitHub.
3.  Push your code:
    ```bash
    git remote add origin <your-repo-url>
    git push -u origin main
    ```

## Step 2: Deploy on Render (Blueprint Method - Recommended)
This method uses the `render.yaml` file to automatically configure everything.

1.  Go to the [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Blueprint**.
3.  Connect your GitHub repository.
4.  Give it a name (e.g., `feedback-portal`).
5.  **Apply** the blueprint.
6.  Render will ask for environment variables. Fill them in:
    - `DATABASE_URL`: Your Neon connection string (e.g., `postgresql://user:pass@...neon.tech/neondb?sslmode=require`).
    - `ADMIN_USERNAME`: Your desired admin username.
    - `ADMIN_PASSWORD`: Your desired admin password.
    - `MAIL_USERNAME`: Your Gmail address.
    - `MAIL_PASSWORD`: Your Gmail App Password.
    - `MAIL_FROM`: Your Gmail address.
    - `MAIL_TO`: The email address to receive reports.
    - `MAIL_SERVER`: `smtp.gmail.com`
    - `MAIL_PORT`: `587`

## Step 3: Verify
1.  Once the deployment is marked **Live**, click the URL provided by Render (e.g., `https://feedback-portal.onrender.com`).
2.  **Test Feedback**: Submit a feedback form.
3.  **Test Admin**: Go to `/admin.html` (e.g., `https://feedback-portal.onrender.com/admin.html`) and login with your credentials.

## Troubleshooting
- **Build Failed**: Check the Logs. Ensure `requirements.txt` is present.
- **Application Error**: Check Logs. Often due to missing environment variables or database connection issues.
- **Database Connection**: Ensure your Neon database allows connections from anywhere (0.0.0.0/0) or is correctly configured.
