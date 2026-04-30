module.exports = function guard(requiredStep) {
  return (req, res, next) => {
    const b = req.session.booking;
    if (!b || b.step < requiredStep) {
      return res.redirect('/booking/step1');
    }
    next();
  };
};
