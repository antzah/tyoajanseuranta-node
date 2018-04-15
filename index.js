var express  = require('express');
var app      = express();
var fs       = require('fs');
var https    = require("https");

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var helmet       = require("helmet");

var configDB = require('./config/database.js');
var secrets = require('./config/secrets.js');

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
    name: "tasc",
    secret: secrets.secret,
    resave: true,
    saveUninitialized: false
}));

app.use(helmet());

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

var options = {
    key: fs.readFileSync('./keys/server.key'),
    cert: fs.readFileSync('./keys/server.crt'),
    requestCert: false,
    rejectUnauthorized: false
};

var server = https.createServer(options, app).listen(3000, function(){
    console.log(`server started at port 3000`);
});