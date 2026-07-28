import "dotenv/config";
import express from "express";
import pool from "./db.js";
import axios from "axios";
import { setDefaultResultOrder } from "node:dns";
import https from "node:https";

setDefaultResultOrder("ipv4first");

// TMDB connection resets intermittently with Node's default keep-alive behavior on this setup.
// Disabling keep-alive resolves it.
const agent = new https.Agent({ keepAlive: false });

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views");

async function fetchTMDB(url, params, retries = 3) {
  try {
    const response = await axios.get(url, {
      params,
      httpsAgent: agent,
      timeout: 8000,
    });
    return response.data;
  } catch (err) {
    if (retries > 0 && err.code === "ECONNRESET") {
      console.log(
        `TMDB request failed (ECONNRESET), retrying... (${retries} left)`,
      );
      return fetchTMDB(url, params, retries - 1);
    }
    console.error("TMDB request failed permanently:", err.message);
    throw err;
  }
}

// ---------- PAGE ROUTES ----------

app.get("/", async (req, res) => {
  const { sort } = req.query;
  let orderBy = "created_at DESC";
  if (sort === "rating") orderBy = "your_rating DESC";
  if (sort === "title") orderBy = "title ASC";
  if (sort === "date") orderBy = "date_watched DESC";

  try {
    const result = await pool.query(`SELECT * FROM movies ORDER BY ${orderBy}`);
    res.render("index", { movies: result.rows, currentSort: sort });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load movies");
  }
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.get("/movies/:id/view", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Movie not found");
    }
    res.render("movie", { movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load movie");
  }
});

// ---------- JSON API ROUTES ----------

app.get("/movies", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM movies ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

app.get("/movies/search", async (req, res) => {
  const { query } = req.query;
  try {
    const data = await fetchTMDB("https://api.themoviedb.org/3/search/movie", {
      query,
      api_key: process.env.TMDB_API_KEY,
    });
    res.json(data.results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search TMDB" });
  }
});

app.get("/movies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to find movie" });
  }
});

app.post("/movies", async (req, res) => {
  const { tmdb_id, your_rating, your_notes, date_watched } = req.body;
  try {
    const movie = await fetchTMDB(
      `https://api.themoviedb.org/3/movie/${tmdb_id}`,
      { api_key: process.env.TMDB_API_KEY },
    );

    const result = await pool.query(
      `INSERT INTO movies (tmdb_id, title, poster_path, overview, release_date, your_rating, your_notes, date_watched)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        movie.id,
        movie.title,
        movie.poster_path,
        movie.overview,
        movie.release_date,
        your_rating,
        your_notes,
        date_watched,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save movie" });
  }
});

app.put("/movies/:id", async (req, res) => {
  const { id } = req.params;
  const { your_rating, your_notes, date_watched } = req.body;
  try {
    const result = await pool.query(
      `UPDATE movies
       SET your_rating = $1, your_notes = $2, date_watched = $3
       WHERE id = $4
       RETURNING *`,
      [your_rating, your_notes, date_watched, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update movie" });
  }
});

app.delete("/movies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM movies WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json({ message: "Movie deleted", movie: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// ---------- 404 FALLBACK ----------

app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
