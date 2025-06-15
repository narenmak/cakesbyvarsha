# Local Development Setup Guide

This guide provides detailed instructions for setting up and testing the Cakes by Varsha website locally.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/cakesbyvarsha.git
cd cakesbyvarsha
```

## Step 2: Set Up the Local API Server

1. Navigate to the API directory:
```bash
cd api
```

2. Create a `.env` file based on the example:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your email credentials:
```
# API Configuration
PORT=3000

# Email Configuration
EMAIL_RECIPIENT=your-email@example.com
EMAIL_SENDER=your-sender-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

> **Note:** For Gmail, you'll need to create an App Password. Go to your Google Account > Security > App Passwords.

4. Install dependencies:
```bash
npm install
```

5. Start the local API server:
```bash
npm run dev
```

The server will start at http://localhost:3000 and create a local SQLite database in the `api/db` directory.

## Step 3: Serve the Frontend Files

In a new terminal window, navigate to the project root directory and start a local web server:

### Using Python (simplest option):
```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

### Using Node.js:
```bash
# Install http-server globally if you haven't already
npm install -g http-server

# Start the server
http-server
```

The frontend will be available at http://localhost:8000 (or similar port).

## Step 4: Access the Website

1. Open your browser and navigate to http://localhost:8000
2. The website should load and connect to your local API server

## Step 5: Access the Admin Interface

1. Navigate to http://localhost:8000/admin/
2. Log in with the credentials you set in the `.env` file (default: admin/default_password_please_change)
3. You can now manage cakes and view enquiries

## Testing Email Functionality

When you submit an enquiry form, the local server will attempt to send an email using the credentials provided in your `.env` file.

If you're using Gmail:
1. Make sure you've created an App Password
2. Use that App Password in your `.env` file
3. If emails aren't sending, check the console for error messages

## Database Management

The local SQLite database is created at `api/db/cakesbyvarsha.db`. You can use tools like SQLite Browser to inspect and modify it directly if needed.

## Troubleshooting

### API Connection Issues
- Make sure both the API server and frontend server are running
- Check that `js/config.js` is correctly detecting localhost
- Look for CORS errors in the browser console

### Email Sending Issues
- Verify your email credentials in the `.env` file
- For Gmail, ensure you're using an App Password, not your regular password
- Check the server console for detailed error messages

### Image Upload Issues
- Make sure the `api/uploads` directory exists and is writable
- Check file size limits (default is 10MB per file)
- Verify that the image format is supported (JPEG, PNG, GIF, WebP)