import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import pool from "./db.js";
import axios from "axios";
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function fetchTMDB(url, params, retries = 3) {
  try {
    const response = await axios.get(url, { params, timeout: 8000 });
    return response.data;
  } catch (err) {
    if (retries > 0 && err.code === "ECONNRESET") {
      console.log(`TMDB request failed, retrying... (${retries} left)`);
      return fetchTMDB(url, params, retries - 1);
    }
    throw err;
  }
}

app.get("/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT title FROM movies");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
});

app.get("/movies/search", async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          query,
          api_key: process.env.TMDB_API_KEY,
        },
      },
    );
    res.json(response.data.results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search TMDB" });
  }
});

app.post("/movies", async (req, res) => {
  const { tmdb_id, your_rating, your_notes, date_watched } = req.body;
  try {
    const movie = await fetchTMDB(
      `https://api.themoviedb.org/3/movie/${tmdb_id}`,
      {
        api_key: process.env.TMDB_API_KEY,
      },
    );

    const result = await pool.query(
      "INSERT INTO movies(tmdb_id, title, poster_path, overview, release_date, your_rating, your_notes, date_watched) values ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
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
    console.log(err);
    res.status(500).json({ error: "Failed to save movie" });
  }
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
