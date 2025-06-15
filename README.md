# Cakes by Varsha Website

This repository contains the code for the Cakes by Varsha website, which is deployed using GitHub Pages for the frontend and Cloudflare Workers for the backend API.

## Project Structure

- `/` - Static HTML files for GitHub Pages
- `/css` - CSS stylesheets
- `/js` - JavaScript files for frontend functionality
- `/images` - Image assets
- `/admin` - Admin interface for managing cakes and enquiries
- `/api` - Cloudflare Workers API code and local development server

## Local Development

### Frontend

The frontend is a static website that can be tested locally using any HTTP server. For example:

```bash
# Using Python's built-in HTTP server
python -m http.server

# Or using Node.js with http-server
npx http-server
```

### Backend API

The backend API can be run locally for development and testing:

1. Navigate to the API directory:
```bash
cd api
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your email credentials and other settings.

4. Install dependencies:
```bash
npm install
```

5. Start the local development server:
```bash
npm run dev
```

This will start a local server at http://localhost:3000 that mimics the Cloudflare Workers API.

## Admin Interface

The admin interface allows you to manage cakes and view enquiries:

1. Access the admin login page at `/admin/index.html`
2. Default credentials:
   - Username: admin
   - Password: default_password_please_change

You can change these credentials in the `.env` file for local development.

## Deployment

### Frontend (GitHub Pages)

1. Push your changes to the main branch of your GitHub repository.
2. GitHub Actions will automatically deploy the static files to GitHub Pages.

### Backend API (Cloudflare Workers)

1. Navigate to the API directory:
```bash
cd api
```

2. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Data Migration

To migrate data from the existing SQLite database to Cloudflare D1:

1. Make sure your Cloudflare account is set up with D1 and R2.
2. Update the `wrangler.toml` file with your D1 database ID.
3. Run the migration script:
```bash
cd api
npm run migrate
```

## Email Notifications

The application sends email notifications when users submit enquiries:

1. For local development, configure your Gmail credentials in the `.env` file.
2. For production, Cloudflare Email Workers are used to send emails.

## Configuration

- Update `js/config.js` to point to your Cloudflare Workers API endpoint.
- Update `api/wrangler.toml` with your Cloudflare D1 database ID and R2 bucket name.