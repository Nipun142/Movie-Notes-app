import express from "express";
import pg from "pg";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

import pool from "./db.js";

app.get("/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT title FROM movies");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
  }
});

app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});
