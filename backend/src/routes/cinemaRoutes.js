const express = require('express');
const { getCinemas, getCinemaShows } = require('../controllers/cinemaController');

const router = express.Router();

router.get('/', getCinemas);
router.get('/:id/shows', getCinemaShows);

module.exports = router;
