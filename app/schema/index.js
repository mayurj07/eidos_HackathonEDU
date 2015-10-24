exports = module.exports = function(app, mongoose) {
	require('./UserSchema')(app, mongoose);
    require('./CardSchema')(app, mongoose);
};
