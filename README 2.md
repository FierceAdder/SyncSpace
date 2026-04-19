# SyncSpace

> Share. Discover. Learn Together.

SyncSpace is a modern, premium full-stack web application designed for seamless resource sharing within groups. Whether it's study materials, interesting articles, or project documentation, SyncSpace allows users to create groups, invite members via joining codes, and collaboratively curate links and files.

## ✨ Key Features

- **Dynamic Group Management**: Create groups, invite peers with simple 6-character join codes, and manage members. Group owners have exclusive rights to regenerate join codes or remove members.
- **Resource Sharing & Previews**: Share links, videos, and documents seamlessly. The backend automatically fetches rich Open Graph metadata (titles, descriptions, thumbnails) for links.
- **Real-time Dynamic Search**: Instantly find resources across all your groups using the live-search feature in the header menu (⌘K to focus). No more hitting enter or waiting for page reloads!
- **Apple-Inspired Animations**: Premium user experience with smooth scroll-reveal micro-animations and satisfying hover effects.
- **Dark/Light Mode**: First-class support for both light and dark themes with a dedicated toggle. The design system uses carefully crafted, high-contrast HSL color palettes for both modes.
- **Bookmarking & Voting**: Save resources for later access and upvote/downvote content curated by the group.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) via [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS with comprehensive CSS Variables for dynamic theming (No Tailwind dependency).

### Backend
- **Framework**: Node.js & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs for secure password hashing
- **Metadata extraction**: `open-graph-scraper` to generate rich previews for user-submitted URLs.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A running MongoDB instance (local or MongoDB Atlas)

### 1. Clone & Install Dependencies

Open a terminal in the root directory and install both backend and frontend dependencies:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Run the Development Servers

You will need to run both the Node backend and the Vite frontend simultaneously.

**Terminal 1 (Backend):**
```bash
# From the root directory
num run start
# or
node server.js
```
*The API will run on http://localhost:3000*

**Terminal 2 (Frontend):**
```bash
# From the root directory
cd client
npm run dev
```
*The Client will run on http://localhost:5173 (Or your configured Vite port)*

## 📂 Project Structure

```text
SyncSpace/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── api/            # Centralized API wrappers to communicate with backend
│   │   ├── components/     # Reusable UI components (Sidebar, Header, ResourceCard, etc.)
│   │   ├── context/        # React Context (Auth, Theme, Toast)
│   │   ├── pages/          # Full page views (Landing, Auth, Dashboard, GroupView, etc.)
│   │   └── utils/          # Helpers (Avatar coloring, time formatters, etc.)
│   └── index.html
├── models/                 # Mongoose Database Models
├── routes/                 # Express API Routes (Auth, Groups, Resources)
├── middleware/             # Backend Middleware (JWT Authentication protection)
├── server.js               # Entry point for the Express backend
└── .env                    # Environment variables (not tracked in git)
```

## 🔒 Security & Authorization
- **Authentication**: All sensitive API routes are shielded by a custom `auth` middleware that verifies bearer JWTs.
- **Ownership Verification**: Deleting resources or regenerating join codes requires explicit backend verification proving the requester is the original group owner or resource author.

---
*Built with ❤️ for modern collaboration.*
