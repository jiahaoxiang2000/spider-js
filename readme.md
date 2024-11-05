# spider-js

use the full-stack react framework next to build a web spider.

## Next.js and TypeScript

This project uses Next.js for full-stack development and TypeScript for type safety and improved code quality.

## Setting up the development environment

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the development server

## Tailwind CSS Setup

This project uses Tailwind CSS for styling. Follow the steps below to set it up:

1. Install Tailwind CSS, PostCSS, and Autoprefixer:
   ```bash
   npm install tailwindcss postcss autoprefixer
   ```

2. Create `tailwind.config.js` and `postcss.config.js` files in the root of your project with the following content:

   `tailwind.config.js`:
   ```js
   module.exports = {
     purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
     darkMode: 'media', // or 'class'
     theme: {
       extend: {},
     },
     variants: {
       extend: {},
     },
     plugins: [],
   };
   ```

   `postcss.config.js`:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

3. Import Tailwind CSS in your `pages/_app.tsx` file:
   ```js
   import 'tailwindcss/tailwind.css';
   ```

## Dark/Light Theme Support

This project supports dark and light themes based on the system configuration. Tailwind CSS's dark mode feature is used to achieve this. The dark mode is configured in the `tailwind.config.js` file with the `darkMode: 'media'` option, which automatically applies the dark theme based on the user's system preferences.

## Setting up Prisma and SQLite

This project uses Prisma as the ORM and SQLite as the database. Follow the steps below to set it up:

1. Install Prisma and SQLite:
   ```bash
   npm install @prisma/client
   npm install prisma --save-dev
   npm install sqlite3
   ```

2. Initialize Prisma:
   ```bash
   npx prisma init
   ```

3. Configure the database connection in the `prisma/schema.prisma` file:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }

   generator client {
     provider = "prisma-client-js"
   }
   ```

4. Define your data models in the `prisma/schema.prisma` file.

5. Run the Prisma migration to create the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

6. Use Prisma Client in your Next.js API routes to interact with the database.
