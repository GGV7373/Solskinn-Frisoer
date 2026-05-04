const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const auth    = require('../middleware/adminAuth');

router.get('/',              (req, res) => res.redirect('/admin/dashboard'));
router.get('/login',         ctrl.getLogin);
router.post('/login',        ctrl.postLogin);
router.get('/logout',        ctrl.logout);

router.get('/dashboard',     auth, ctrl.getDashboard);
router.get('/bestillinger',  auth, ctrl.getBestillinger);
router.post('/bestillinger/:id/avlys', auth, ctrl.cancelBooking);
router.get('/arbeidsplan',   auth, ctrl.getArbeidsplan);
router.post('/arbeidsplan/:workerId', auth, ctrl.postArbeidsplan);

module.exports = router;
