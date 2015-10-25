    // External includes
    var env = process.argv[2],
        config = require('./config'),
        express = require('express'),
        mongoose = require('mongoose'),
        cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        passport = require('passport'),
        session = require('express-session'),
        mongoStore = require('connect-mongo')(session),
        http = require('http'),
        path = require('path'),
        logger = require('morgan'),
        methodOverride = require('method-override'),
        cluster = require('cluster');

    // Instantiate app
    var app = express();

    // General app config stuff
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.disable('x-powered-by');
    app.set('client-url', 'http://'+env);

    // Password encryption
    app.set('crypto-key', config.cryptoKey);

    // Setup mongoose
    app.set('mongodb_uri', 'mongodb://localhost/vocabclub');
    app.db = mongoose.connect(app.get('mongodb_uri'));

    app.set('port', process.env.PORT || 3500);

    // Middlewares
    app.use(logger('dev')); // log all requests to the console
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true})); // use body parser so we can grab information from POST requests
    app.use(cookieParser());
    app.use(methodOverride());

    // session secret
    // refer: https://github.com/expressjs/session#options
    app.use(session({
        secret: config.sessionSecret,
        resave: true,  //Forces the session to be saved back to the session store, even if the session was never modified during the request
        saveUninitialized: false,  //Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified
        store: new mongoStore({url: app.get('mongodb_uri')})
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // Internal includes
    var schemas     = require('./schema/index')(app, mongoose),
        middlewares = require('./middleware/index')(app),
        routes      = require('./routes/Controller')(app),
        strategies  = require('./passport/index')(app, passport);

    // Start it all up
    if (cluster.isMaster) {
        for (var i = 0; i < 4; i++) {
            cluster.fork();
        }

        cluster.on("exit", function(worker, code, signal) {
            cluster.fork();
        });
    } else {
        http.createServer(app).listen(app.get('port'), function () {
            console.log('Express server listening on port ' + app.get('port'));
        });
    }

    exports = module.exports = app;

