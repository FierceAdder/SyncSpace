# SyncSpace

> Share. Discover. Collaborate.

SyncSpace is a full-stack collaborative resource-sharing platform. Create groups, invite members via 6-character join codes, and curate links, videos, and files — all with real-time chat, rich link previews, and a polished dark/light UI.

---

## ✨ Features

- **Groups** — Create groups, share a join code, manage members. Group owners can regenerate codes and remove members.
- **Resource Sharing** — Share links, videos, and files. The backend automatically fetches Open Graph metadata (title, description, thumbnail) for link previews.
- **Real-time Chat** — Per-resource comment threads with live typing indicators powered by Socket.io.
- **Live Search** — Instant resource search across all your groups (`⌘K` to focus).
- **Bookmarks & Voting** — Save resources for later; upvote/downvote content.
- **Profile** — View your contributed resources and joined groups.
- **Feedback** — In-app feedback modal backed by a dedicated API route.
- **Dark / Light Mode** — First-class theming with a curated HSL color palette.
- **Persistent Sidebar** — Collapsible and resizable sidebar with state saved across reloads via `localStorage`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, React Router v7, Lucide React |
| **Styling** | Vanilla CSS with CSS custom properties (no Tailwind) |
| **Real-time** | Socket.io (client + server) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose |
| **Auth** | JWT + bcryptjs |
| **File Storage** | AWS S3 + presigned URLs |
| **Link Previews** | open-graph-scraper |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- AWS S3 bucket (for file uploads)

### 1. Clone & Install

```bash
git clone https://github.com/FierceAdder/SyncSpace.git
cd SyncSpace

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/SyncSpace
JWT_SECRET=your_super_secret_jwt_key

AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
```

### 3. Run the Development Servers

You need two terminals running simultaneously:

**Terminal 1 — Backend API** (runs on `http://localhost:3000`):
```bash
node server.js
```

**Terminal 2 — Frontend** (runs on `http://localhost:5173`):
```bash
cd client
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 🏗️ Project Structure

```
SyncSpace/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── api/             # Centralized API client (api.js)
│       ├── components/      # Shared UI components (Sidebar, Header, Modal, etc.)
│       ├── context/         # React context providers (Auth, Theme, Toast)
│       ├── hooks/           # Custom hooks (useSocket)
│       ├── pages/           # Page-level views
│       │   ├── Landing      # Public landing page
│       │   ├── Auth         # Login & register
│       │   ├── Dashboard    # User home
│       │   ├── GroupView    # Group detail, resources, chat
│       │   ├── Bookmarks    # Saved resources
│       │   ├── Search       # Global resource search
│       │   └── Profile      # User profile
│       └── utils/           # Helper functions
├── middleware/              # Express middleware (JWT auth guard)
├── models/                  # Mongoose schemas (User, Group, Resources, etc.)
├── routes/                  # Express route handlers
│   ├── userRoutes.js        # Auth & profile
│   ├── groupRoutes.js       # Group CRUD & members
│   ├── resourceRoutes.js    # Resource CRUD, S3 uploads, OG scraping
│   ├── commentRoutes.js     # Resource comments
│   └── feedbackRoutes.js    # In-app feedback
├── utils/                   # Backend utilities (S3 helpers)
├── server.js                # Express + Socket.io entry point
├── package.json
└── .env                     # Environment variables (not committed)
```

---

## ☁️ Deployment (Render + MongoDB Atlas)

### 1. Set up MongoDB Atlas
Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), allow access from `0.0.0.0/0`, and copy the connection string.

### 2. Deploy on Render
1. Push this repo to GitHub.
2. Create a new **Web Service** on [render.com](https://render.com) pointing to your repo.
3. Configure:

| Setting | Value |
|---|---|
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

4. Add these **Environment Variables** in the Render dashboard:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | A strong random string |
| `AWS_REGION` | Your S3 region |
| `AWS_ACCESS_KEY_ID` | Your AWS key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret |
| `AWS_S3_BUCKET` | Your bucket name |
| `CORS_ORIGINS` | `https://your-app.onrender.com` |

The build step compiles the React app into `client/dist/`. Express then serves both the API and the static frontend from the same process.

---

## 🔒 Security

- All API routes (except `/user/login`, `/user/register`, `/stats`) are protected by a JWT `auth` middleware.
- Group-destructive actions (delete, kick member, regenerate join code) require verified group ownership.
- S3 file access uses short-lived presigned URLs — no public bucket exposure.
- Passwords are hashed with bcryptjs before storage.

---

*Built with ❤️ for modern collaboration.*
