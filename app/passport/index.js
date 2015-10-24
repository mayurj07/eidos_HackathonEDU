exports = module.exports = function(app, passport) {
	var LocalStrategy = require('passport-local').Strategy,
		FacebookStrategy = require('passport-facebook').Strategy,
		User = app.db.models.User;
	
	// Local
	passport.use(new LocalStrategy(function(username, password, done) {
		User.findOne({ username: username, verified: true }, function(err, user) {
			if (err) return done(err);
			if (!user) return done(null, false, { message: 'Unknown user' });
			
			// Validate password
			var encryptedPassword = User.encryptPassword(password);
			if (user.password != encryptedPassword) {
				return done(null, false, { message: 'Invalid password' });
			}
			
			// We're good
			return done(null, user);
		});
	}));
	
	// Facebook
	if (app.get('facebook-oauth-key')) {
		passport.use(new FacebookStrategy({
			clientID: app.get('facebook-oauth-key'),
			clientSecret: app.get('facebook-oauth-secret')
		},
		function(accessToken, refreshToken, profile, done) {
			// Hand off to caller
			done(null, false, {
				accessToken: accessToken,
				refreshToken: refreshToken,
				profile: profile
			});
		}));
	}
	
	// Serialize
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});
	
	// Deserialize
	passport.deserializeUser(function(id, done) {
		User.findOne({ _id: id }).exec(function(err, user) {
			done(err, user);
		});
	});
};