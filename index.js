var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

mongoose.Promise = global.Promise;
mongoose.connect(configDB.url, {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    useMongoClient: true
});

require('./config/passport')(passport); 

app.use(morgan('dev'));
app.use(cookieParser()); 

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs'); 

app.use(session({ 
    secret: 'jebulibebuli',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session()); 
app.use(flash()); 

app.use(express.static('public'));

function variablesHelper(req, res, next) {
    var rl = res.locals;
    
    rl.name = (req.isAuthenticated()) ? req.user.local.name : "Vieras";
    rl.isLoggedIn = req.isAuthenticated();

    next();
}

app.use(variablesHelper);

require('./routes.js')(app, passport);

app.listen(port);
console.log('The magic happens on port ' + port);