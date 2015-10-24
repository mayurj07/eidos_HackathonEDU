    var mongoose = require('mongoose');
    var User = require('../schema/UserSchema');
    var jwt = require('jsonwebtoken');
    var express = require('express');
    var app = express.Router();
    var config = require('../config.json');
    var NodeRSA = require('node-rsa');
    var secretKey = 'PARCSecretKey';
    var keyRSA = new NodeRSA(config.rsa_private_key);


    //middlware to use for all requests  // route middleware to verify a token
    app.use(function (req, res, next) {
            // check header or url parameters or post parameters for token
            var token = req.body.token || req.query.token || req.headers['x-access-token'];
            //decrypt the token using RSA key
            var decrypted = keyRSA.decrypt(token, 'utf8');
            // decode token
            if (decrypted) {
                // verifies secret and checks exp
                jwt.verify(decrypted, secretKey, function (err, decoded) {
                    if (err) {
                        return res.json({success: false, message: 'Failed to authenticate token.'});
                    } else {
                        // if everything is good, save to request for use in other routes
                        req.decoded = decoded;
                        next(); // make sure we go to the next routes and don't stop here
                    }
                });
            } else {
                // if there is no token
                // return an HTTP response of 403 (access forbidden) and an error message
                return res.status(403).send({
                    success: false,
                    message: 'No token provided. Please Authenticate at \'/authenticate\' with username & password'
                });
            }
    });

    // other api routes. the authenticated routes
    app.get('/', function (req, res) {
        res.json({message: "Welcome to Eidos API"});
    });

    module.exports = app;



