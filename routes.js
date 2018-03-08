var mongoose = require('mongoose');
var moment = require('moment');
moment.locale("fi");

var Paiva = require('./models/paiva');
var User = require("./models/user");

module.exports = (app, passport) => {
    app.get('/', isLoggedIn, (req, res) => {
        res.render('index.ejs'); 
    });

    /**
     * Login, logout, signup
     */

    app.get('/login', (req, res) => {
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    app.post("/login", passport.authenticate("local-login", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: true
    }));

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
    });

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup', 
        failureFlash: true
    }));

    /**
     * App logic
     */
    app.post("/calendar", isAuthenticated, (req, res) => {
        let dayStart = moment(req.body.day).hour(0).minute(59).second(59),
            dayEnd = moment(req.body.day).hour(23).minute(59).second(59);

        Paiva.findOneAndUpdate({
            user: req.user.id,
            day: {
                $gte: dayStart,
                $lt: dayEnd
            }
        }, {
            user: req.user.id,
            day: req.body.day,
            quarters: req.body.quarters
        }, {
            upsert: true
        }, (err, day) => {
            if (err) return "Error while updating records";

            res.send("OK");
        });
    })

    /**
     * Utility to fetch the current user in Vue components
     */
    app.get('/user', isAuthenticated, function(req, res) {
        res.json(req.user)
    });
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/login');
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();

    res.send("Not allowed. Plz login.");
}