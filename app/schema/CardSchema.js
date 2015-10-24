/**
 * Created by mjain on 10/24/15.
 */

var mongoose = require('mongoose');

CardSchema = new mongoose.Schema({
        keyword         : {type: String},
        description     : {type: String},
        image           : {type: String},
        source_url      : {type: String},
        color           : {type: String},
        created_at      : {type: Date, default: Date.now}
});


exports = module.exports = mongoose.model('Card', CardSchema);
