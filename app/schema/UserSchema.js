var mongoose = require('mongoose');
//var app = require('../app.js');

UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    name: {type: String},
    password: {type: String},
    verified: false,
    created_at: {type: Date, default: Date.now},
    login: {type: Date, default: Date.now},
    last_login: {type: Date},
    lastLogin_clientIp: {type: String},
    clientIp: {type: String}
});

UserSchema.statics.encryptPassword = function (password) {
    return require('crypto').createHmac('sha512', 'k3yb0ardc4t').update(password).digest('hex');
};


UserSchema.statics.updateLoginTime = function (username, lastLoginTime, newIp, lastLogin_clientIp, callback) {
    this.collection.findAndModify(
        {"username": username},
        [],
        {
            $set: {
                "login": new Date(),
                "last_login": lastLoginTime,
                "clientIp": newIp,
                "lastLogin_clientIp": lastLogin_clientIp
            }
        },
        {'new': true, 'upsert': true, select: {login: 1}},
        function (err, loginTime) {
            if (err)  console.log('error updating login time.' + err);
            callback();
        });
};

exports = module.exports = mongoose.model('User', UserSchema);



