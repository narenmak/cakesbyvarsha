# Troubleshooting Guide

This guide provides solutions for common issues you might encounter when setting up and running the Cakes by Varsha website.

## Admin Functionality Issues

### Admin Login Not Working

1. **Check browser console for errors**
   - Open your browser's developer tools (F12 or right-click > Inspect)
   - Look for any JavaScript errors in the console

2. **Verify API connection**
   - Make sure your local API server is running (`npm run dev` in the api directory)
   - Check that the API URL in `js/config.js` is correct
   - Try accessing `http://localhost:3000/api/cakes` directly in your browser to verify the API is responding

3. **Test with debug mode**
   - Edit `js/config.js` and set `DEBUG_MODE = true`
   - Run the debug server: `node api/debug.js`
   - This will bypass the actual API and use mock data for testing

4. **Check admin credentials**
   - Default credentials are username: `admin`, password: `default_password_please_change`
   - Or check what's set in your `.env` file

### Admin Dashboard Not Loading

1. **Verify authentication token**
   - Check if the token is stored in localStorage:
     - Open browser developer tools
     - Go to Application tab > Local Storage
     - Look for `adminToken` key
   - If missing, you need to log in again

2. **Check file paths**
   - Make sure all JavaScript files are correctly linked in HTML files
   - Verify that `admin.js` is being loaded (check network tab in developer tools)

3. **Test with debug server**
   - Run `node api/debug.js` to start the debug server
   - Set `DEBUG_MODE = true` in `js/config.js`
   - This provides mock data for testing the admin interface

## Database Issues

### "Table already exists" Error

This happens when the server tries to create tables that already exist.

1. **Solution 1: Delete the existing database**
   - Delete the file at `api/db/cakesbyvarsha.db`
   - Restart the server

2. **Solution 2: Use the fixed scripts**
   - The updated `local-server.js` and `init-db.js` check if tables exist before creating them
   - Make sure you're using the latest versions of these files

### Database in Wrong Location

If the database is created in the wrong location:

1. **Check the database path in scripts**
   - Both `local-server.js` and `init-db.js` should use `path.join(__dirname, 'db', 'cakesbyvarsha.db')`
   - This ensures the database is created in the `api/db` directory

2. **Create the directory structure manually**
   ```bash
   mkdir -p api/db
   ```

## API Connection Issues

### CORS Errors

If you see CORS errors in the console:

1. **Check CORS headers**
   - Make sure the API server is setting the correct CORS headers
   - The `local-server.js` includes `app.use(cors())` to handle this

2. **Verify API URL**
   - Make sure the API URL in `js/config.js` matches your server address
   - For local development, it should be `http://localhost:3000/api`

### API Not Responding

1. **Check if server is running**
   - Make sure you started the server with `npm run dev`
   - Check the terminal for any error messages

2. **Verify port availability**
   - The default port is 3000
   - If another application is using this port, change it in the `.env` file

## Image Upload Issues

1. **Check upload directory**
   - Make sure the `api/uploads` directory exists and is writable
   - Create it manually if needed: `mkdir -p api/uploads`

2. **Verify form enctype**
   - The form must have `enctype="multipart/form-data"` attribute

3. **Check file size limits**
   - By default, there's a 10MB limit per file
   - Adjust in `local-server.js` if needed

## Email Notification Issues

1. **Check email credentials**
   - Make sure your `.env` file has the correct email settings:
     ```
     EMAIL_RECIPIENT=your-email@example.com
     EMAIL_SENDER=your-sender-email@gmail.com
     EMAIL_PASSWORD=your-gmail-app-password
     ```

2. **For Gmail users**
   - You need to create an App Password
   - Go to your Google Account > Security > App Passwords
   - Use this password in your `.env` file

3. **Disable email for testing**
   - If you don't need email notifications during development, you can leave the EMAIL_PASSWORD blank in your `.env` file

## Using the Debug Server

For troubleshooting admin functionality specifically:

1. Start the debug server:
   ```bash
   node api/debug.js
   ```

2. Edit `js/config.js` and set `DEBUG_MODE = true`

3. Access the admin interface as normal

The debug server provides mock data for testing the admin interface without needing a working database or API.