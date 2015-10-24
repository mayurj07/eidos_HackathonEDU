
exports = module.exports = function(app) {

    app.get('/api/dictionary', require('./dictionary').getWordDesc);
    app.get('/api/dictionary/cards', require('./dictionary').getAllCards);

};