# Deployment Guide for "Organizeyourlife"

To share your app with others, you need to host it on a server. The easiest way to do this for free is using **Render**.

## Prerequisites
1.  **GitHub Account**: You need to upload your code to GitHub first.
2.  **Render Account**: Create a free account at [render.com](https://render.com).

## Step 1: Upload Code to GitHub
1.  Go to [github.com](https://github.com) and create a new repository named `organize-your-life`.
2.  Open your terminal in the app folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/organize-your-life.git
    git push -u origin main
    ```

## Step 2: Deploy on Render
1.  Log in to your **Render** dashboard.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub account and select the `organize-your-life` repository.
4.  Configure the settings:
    *   **Name**: `organize-your-life`
    *   **Region**: Closest to you (e.g., US East).
    *   **Branch**: `main`
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
5.  Click **Create Web Service**.

Render will now build your app. In a few minutes, it will give you a URL (e.g., `https://organize-your-life.onrender.com`) that you can share with anyone!

## Important Note
The `complaints.json` file is stored on the server. On free hosting plans like Render, the file system is ephemeral, meaning **files created (like complaints) will disappear if the server restarts**.

To fix this for a production app, you would need a database (like PostgreSQL). But for a simple demo, this deployment method works perfectly for showing the site to others!
