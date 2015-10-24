
exports = module.exports = function(app) {

    app.get('/api/dictionary', require('./dictionary').getWordDesc);

};