# AI Evolution Tracker - Deployment Guide

This document provides instructions for deploying and running the AI Evolution Tracker application.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Local Development

1. Clone the repository or navigate to the project directory:
   ```
   cd /home/ubuntu/ai_evolution_tracker/ai_evolution_viz
   ```

2. Install dependencies:
   ```
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Building for Production

1. Build the application:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

## Deployment Options

### Option 1: Static Export

For static hosting platforms (Netlify, Vercel, GitHub Pages, etc.):

1. Build the static export:
   ```
   npm run build
   npm run export
   ```

2. The static files will be in the `out` directory, which can be deployed to any static hosting service.

### Option 2: Cloudflare Workers

The application is configured to work with Cloudflare Workers:

1. Install Wrangler CLI if not already installed:
   ```
   npm install -g wrangler
   ```

2. Deploy to Cloudflare:
   ```
   wrangler deploy
   ```

## Daily Update Mechanism

The application includes a daily update mechanism that automatically checks for new AI model information. This is implemented through:

1. An API route at `/api/update` that fetches the latest AI model information
2. A scheduler component that triggers updates every 24 hours or manually

To customize the update sources, modify the `fetchLatestAIModelInfo` function in `/src/app/api/update/route.ts`.

## Customization

### Adding New AI Models

To add new AI models to the dataset:

1. Edit the `/expanded_data.json` file in the project root
2. Follow the existing schema structure for companies, categories, models, and model versions
3. Restart the application or trigger an update through the UI

### Modifying the Visualization

The visualization components are located in:
- `/src/components/AIEvolutionVisualizer.tsx` - Main visualization component
- `/src/components/UpdateScheduler.tsx` - Update scheduler component

Styling can be customized in `/src/app/globals.css`.

## Features

The AI Evolution Tracker includes:

- Interactive timeline visualization of AI model evolution
- Network graph showing relationships between models, companies, and categories
- Filtering by company, category, date range, and search term
- Animation showing the evolution of AI models over time
- Detailed information about models, companies, and categories
- Daily update mechanism to keep the data current
- Responsive design for various screen sizes

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify that the data file paths are correct
3. Ensure all dependencies are installed with `--legacy-peer-deps` flag
4. Clear browser cache if visualization doesn't update after data changes

For more assistance, please refer to the documentation for the libraries used:
- Next.js: https://nextjs.org/docs
- vis-timeline: https://visjs.github.io/vis-timeline/docs/timeline/
- react-force-graph: https://github.com/vasturiano/react-force-graph
