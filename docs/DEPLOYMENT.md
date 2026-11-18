# NIYD Hostel Management System — Production Deployment Guide

**Organization**: National Institute of Youth Development (NIYD), Bangladesh  
**Architecture**: Decoupled Monorepo (Vanilla JS Frontend + Express/Node.js REST API Backend + MongoDB Atlas)

---

## 1. Prerequisites & Services

1. **MongoDB Atlas** (Cloud Database Cluster)
2. **Render.com** (Node.js Web Service for Backend REST API)
3. **Vercel** (Global Edge CDN for Vanilla HTML5/CSS3/ES6 Frontend)
4. **Git Repository** (GitHub / GitLab)

---

## 2. Database Setup: MongoDB Atlas

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a free/shared cluster in the `ap-southeast-1` (Singapore) or `ap-south-1` (Mumbai) region for minimal latency to Bangladesh.
3. In **Database Access**:
   - Create a database user, e.g., `niyd_admin`.
   - Set a secure password.
   - Assign `readWriteAnyDatabase` or built-in role `Atlas Admin`.
4. In **Network Access**:
   - Add IP Access List entry `0.0.0.0/0` (Allow access from anywhere) so cloud hosting platforms (Render/Vercel) can connect.
5. In **Clusters > Connect**:
   - Select **Drivers** (Node.js).
   - Copy connection string:
     ```
     mongodb+srv://niyd_admin:<password>@cluster0.xxxxx.mongodb.net/niyd_hms?retryWrites=true&w=majority
     ```

---

## 3. Backend Deployment: Render.com

1. In Render Dashboard, click **New + > Web Service**.
2. Connect your Git repository.
3. Fill in configuration:
   - **Name**: `niyd-hms-api`
   - **Region**: `Singapore` (or closest available)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/api/health`
4. Add **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<Generate a random 64-character secret>`
   - `JWT_EXPIRE`: `7d`
   - `FRONTEND_URL`: `https://niyd-hostel.vercel.app,http://localhost:3000,http://localhost:5000`
5. Click **Create Web Service**.
6. Once deployed, note down your live backend URL:
   `https://niyd-hms-api.onrender.com`

### Database Seeding on Render
To seed the initial administrative accounts, buildings, rooms, and fee structures in production:
- In the Render dashboard, open the **Shell** tab of your service and run:
  ```bash
  npm run seed
  ```

---

## 4. Frontend Deployment: Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your Git repository.
3. Configure Project Settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (Root of repository)
   - The repository's included `vercel.json` will automatically route traffic to `frontend/index.html` and rewrite static subpaths.
4. Click **Deploy**.
5. Your frontend is live at e.g., `https://niyd-hostel.vercel.app`.

### Configure API Origin for Frontend
In `frontend/assets/js/config.js`, the system automatically detects if it's hosted on localhost:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://niyd-hms-api.onrender.com/api';
```
If hosting on a custom domain (e.g. `hostel.niyd.gov.bd`), update `CONFIG.API_BASE_URL` or use environment configuration.

---

## 5. Security & Verification Checklist

- [x] CORS properly configured on backend with frontend production URL.
- [x] Helmet security headers active.
- [x] Passwords securely hashed with `bcryptjs` salt rounds (10).
- [x] Bed allocation enforces single occupant per bed and validates capacity.
- [x] Students restricted strictly to their own invoices, complaints, and rooms.
- [x] Offline payments require authorized administrator approval before marking invoices paid.
- [x] Health check endpoint responding with `200 OK` at `/api/health`.
