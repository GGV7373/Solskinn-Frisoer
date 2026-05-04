const express = require('express');
const router  = express.Router();
const home    = require('../controllers/homeController');

router.get('/', home.getHome);
router.get('/tjenester', home.getTjenester);
router.get('/aapningstider', home.getAapningstider);

module.exports = router;
