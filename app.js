const express = require("express");
const app = express();

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("server running at http://localhost:6000");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMovieResponseIntoObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
app.get("/movies/", async (request, response) => {
  try {
    const getMoviesQuery = `SELECT * from movie ORDER BY movie_id;`;
    const allMovies = await db.all(getMoviesQuery);
    console.log(allMovies);
    response.send(
      allMovies.map((eachMovie) => convertMovieResponseIntoObject(eachMovie))
    );
  } catch (e) {
    console.log(`error is ${e.message}`);
  }
});

app.post("/movies/", async (request, response) => {
  try {
    const movieDetails = request.body;
    const { directorId, movieName, leadActor } = movieDetails;
    const createMovieQuery = `INSERT INTO movie(director_id,movie_name,lead_actor)
    VALUES
    (
       ' ${directorId}',
        '${movieName}',
        '${leadActor}'
    )`;
    const createMovie = await db.run(createMovieQuery);
    response.send("Movie Successfully Added");
  } catch (error) {
    console.log(`DB error:${error.message}`);
  }
});

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`;
    const movieArray = await db.get(getMovieQuery);
    console.log(movieId);
    response.send(convertDbObjectToResponseObject(movieArray));
  } catch (e) {
    console.log(`error is :${e.message}`);
  }
});

app.put("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const movieDetails = request.body;
    const { directorId, movieName, leadActor } = movieDetails;

    const updateQuery = `UPDATE movie 
    SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}';`;

    await db.run(updateQuery);
    response.send("Movie Details Updated");
  } catch (error) {
    console.log(`DB error: ${error.message}`);
  }
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `DELETE FROM movie WHERE movie_id = ${movieId};`;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

const convertDirectorResponseIntoObject = (directorDetails) => {
  return {
    directorId: directorDetails.director_id,
    directorName: directorDetails.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `SELECT * from director ORDER BY director_id;`;
  const allDirectors = await db.all(getDirectorQuery);
  response.send(
    allDirectors.map((eachDirector) =>
      convertDirectorResponseIntoObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  try {
    const { directorId } = request.params;
    const getDirectorMoviesQuery = `
    SELECT
    movie_name As movieName
    FROM
    movie NATURAL JOIN director
    WHERE
    director_id = ${directorId};`;
    const moviesArray = await db.all(getDirectorMoviesQuery);
    response.send(moviesArray);
  } catch (error) {
    console.log(`eerr : ${error.message}`);
  }
});

module.exports = app;
