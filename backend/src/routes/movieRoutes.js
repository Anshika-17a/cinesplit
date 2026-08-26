const express = require('express');
const { getMovies, getMovieShows, recommendMovies } = require('../controllers/movieController');
const router = express.Router();

router.get('/', getMovies);
router.get('/recommend', recommendMovies);
router.get('/:id/shows', getMovieShows);

module.exports = router;
