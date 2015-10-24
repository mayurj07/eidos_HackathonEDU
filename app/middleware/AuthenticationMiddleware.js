exports = module.exports = function(app) {

	app.all('/api/user*', function(req, res, next) {
		if (req.isAuthenticated()) return next();

		return res.status(401).send('Your are not authorized to access this resource.');
	});
};
