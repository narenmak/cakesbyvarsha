# Deployment Guide for Cakes by Varsha Website

This guide provides step-by-step instructions for deploying the Cakes by Varsha website using GitHub Pages for the frontend and Cloudflare Workers for the backend API.

## Prerequisites

- GitHub account
- Cloudflare account
- Node.js and npm installed on your local machine

## Step 1: Set Up GitHub Repository

1. Create a new GitHub repository named `cakesbyvarsha`
2. Push your local code to the repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/cakesbyvarsha.git
git push -u origin main
```

## Step 2: Configure GitHub Pages

1. Go to your GitHub repository settings
2. Scroll down to the "GitHub Pages" section
3. Select the branch to deploy (usually `main`)
4. Select the folder to deploy from (usually `/` or `/docs`)
5. Click "Save"
6. (Optional) Configure a custom domain if you have one

## Step 3: Set Up Cloudflare Workers

1. Install Wrangler CLI globally:
```bash
npm install -g wrangler
```

2. Log in to your Cloudflare account:
```bash
wrangler login
```

3. Create a D1 database:
```bash
wrangler d1 create cakesbyvarsha-db
```

4. Create an R2 bucket for images:
```bash
wrangler r2 bucket create cakesbyvarsha-images
```

5. Update the `wrangler.toml` file in the `api` directory with your D1 database ID and R2 bucket name.

## Step 4: Deploy the Database Schema

1. Navigate to the API directory:
```bash
cd api
```

2. Deploy the schema to D1:
```bash
wrangler d1 execute cakesbyvarsha-db --file=schema.sql
```

## Step 5: Migrate Data (if applicable)

If you have existing data in SQLite that you want to migrate:

1. Make sure your source database path is correctly set in `data-migration.js`
2. Run the migration script:
```bash
npm run migrate
```

## Step 6: Deploy the API

1. Navigate to the API directory:
```bash
cd api
```

2. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

3. Note the URL of your deployed Worker (e.g., `https://cakesbyvarsha-api.yourusername.workers.dev`)

## Step 7: Update API Configuration

1. Open `js/config.js` in the root directory
2. Update the `API_URL` constant with your Cloudflare Worker URL:
```javascript
const API_URL = 'https://cakesbyvarsha-api.yourusername.workers.dev/api';
```

3. Commit and push the changes:
```bash
git add js/config.js
git commit -m "Update API URL"
git push
```

## Step 8: Verify Deployment

1. Wait for GitHub Pages to build and deploy your site (check the "Actions" tab in your repository)
2. Visit your GitHub Pages URL (e.g., `https://yourusername.github.io/cakesbyvarsha`)
3. Test the functionality to ensure the frontend can communicate with the backend API

## Troubleshooting

### CORS Issues

If you encounter CORS errors, verify that your Cloudflare Worker is correctly setting CORS headers as defined in `worker.js`.

### Image Loading Issues

If images aren't loading:
1. Check that images were properly uploaded to R2
2. Verify the image paths in the database
3. Ensure the R2 bucket permissions allow public access

### Database Connection Issues

If the API can't connect to the database:
1. Verify your D1 database ID in `wrangler.toml`
2. Check that the schema was properly deployed
3. Look at the Cloudflare Workers logs for any errors

## Maintenance

### Adding New Content

To add new cakes or update existing ones, you'll need to:
1. Connect to your D1 database using Wrangler
2. Execute SQL commands to insert or update records
3. Upload images to R2 using Wrangler

Example of adding a new cake:
```bash
# Upload image to R2
wrangler r2 object put cakesbyvarsha-images/new-cake.jpg --file=path/to/image.jpg

# Insert cake into database
wrangler d1 execute cakesbyvarsha-db --command="INSERT INTO cakes (name, description, sizes, flavors, prices) VALUES ('Chocolate Cake', 'Delicious chocolate cake', '[\"6 inches\", \"8 inches\", \"10 inches\"]', '[\"Chocolate\", \"Vanilla\"]', '{\"6 inches\": 30, \"8 inches\": 45, \"10 inches\": 60}');"

# Get the inserted cake ID
wrangler d1 execute cakesbyvarsha-db --command="SELECT last_insert_rowid() as id;"

# Insert image reference
wrangler d1 execute cakesbyvarsha-db --command="INSERT INTO cake_images (cake_id, image_name, image_path, is_primary) VALUES (1, 'new-cake.jpg', '/api/images/new-cake.jpg', 1);"
```

### Updating the Website

To update the website:
1. Make changes to your local repository
2. Commit and push to GitHub
3. GitHub Pages will automatically rebuild and deploy your site