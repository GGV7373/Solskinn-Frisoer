const express = require('express');
const router  = express.Router();
const booking = require('../controllers/bookingController');
const guard   = require('../middleware/bookingGuard');

router.get('/',  (req, res) => res.redirect('/booking/step1'));

router.get('/step1',  booking.getStep1);
router.post('/step1', booking.postStep1);

router.get('/step2',  guard(1), booking.getStep2);
router.post('/step2', guard(1), booking.postStep2);

router.get('/step3',       guard(2), booking.getStep3);
router.get('/step3/slots', guard(2), booking.getSlots);
router.post('/step3',      guard(2), booking.postStep3);

router.get('/step4',  guard(3), booking.getStep4);
router.post('/step4', guard(3), booking.postStep4);

router.get('/confirmation/:code', booking.getConfirmation);

module.exports = router;
