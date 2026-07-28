# 🎬 Movie Notes

A personal movie-logging app inspired by Derek Sivers' book notes site — track every movie you've watched, rate it, and keep your own notes, all in one place.

Built as a capstone project to practice full-stack CRUD development with a public API integration.

## Features

- 🔍 Search for movies via the TMDB (The Movie Database) API
- ➕ Add movies to your personal collection with your own rating, notes, and watch date
- 📋 Browse your collection in a responsive poster grid
- 🔀 Sort by most recent, rating, or title
- ✏️ Edit your rating/notes on any saved movie
- 🗑️ Delete movies from your collection
- 🎨 Clean, dark-themed UI

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (`pg`)
- **Templating:** EJS (server-rendered views)
- **External API:** [TMDB API](https://www.themoviedb.org/documentation/api) (movie search, posters, metadata)
- **HTTP client:** Axios

## Screenshots

*(Add a screenshot of your home page grid and detail page here before publishing — this is one of the most important parts of a portfolio README.)*

## Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd movie-notes-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up PostgreSQL
Create a database and table:
```sql
CREATE DATABASE movienotes;

\c movienotes

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  tmdb_id INTEGER,
  title TEXT NOT NULL,
  poster_path TEXT,
  overview TEXT,
  release_date DATE,
  your_rating INTEGER,
  your_notes TEXT,
  date_watched DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Environment variables
Create a `.env` file in the project root:
```
PGUSER=your_pg_username
PGHOST=localhost
PGDATABASE=movienotes
PGPASSWORD=your_pg_password
PGPORT=5432
TMDB_API_KEY=your_tmdb_api_key
```
Get a free TMDB API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

### 5. Run the app
```bash
node server.js
```
Visit `http://localhost:3000`.

## API Routes

| Method | Route                | Description                              |
|--------|-----------------------|-------------------------------------------|
| GET    | `/movies`             | Get all saved movies (JSON)               |
| GET    | `/movies/search`      | Search TMDB by title (JSON)               |
| GET    | `/movies/:id`         | Get one saved movie by id (JSON)          |
| POST   | `/movies`              | Save a movie (fetches details from TMDB)  |
| PUT    | `/movies/:id`         | Update your rating/notes/date watched     |
| DELETE | `/movies/:id`         | Remove a movie from your collection       |

## Page Routes

| Route                 | Description                          |
|------------------------|---------------------------------------|
| `/`                     | Home — grid of your saved movies, sortable |
| `/add`                  | Search TMDB and add a movie           |
| `/movies/:id/view`      | View, edit, or delete a saved movie   |

## Notable Implementation Details

- **Parameterized SQL queries** throughout to prevent SQL injection.
- **Retry logic with a custom HTTPS agent** for TMDB requests — TMDB's connection occasionally resets under Node's default keep-alive behavior on some setups; disabling keep-alive and adding a small retry wrapper resolved this reliably.
- **Separation of API routes and page routes** — JSON API routes (`/movies`, `/movies/search`) are called client-side via `fetch()` from the EJS pages, keeping the frontend/backend concerns cleanly separated even within a server-rendered app.

## Credits

This project uses the [TMDB API](https://www.themoviedb.org/) but is not endorsed or certified by TMDB.

Idea inspired by [Derek Sivers' book notes](https://sive.rs/book).
