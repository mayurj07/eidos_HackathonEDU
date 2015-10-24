exports = module.exports = function(app) {
	// Create middleware for this.
	app.use(function(req, res, next){
		res.redirect = function(url) {
			res.send(200, url);
		};
		next();
	});
}