var mongoose = require('mongoose');
var moment = require('moment');
moment.locale("fi");

var Paiva = require('./models/paiva');
var User = require("./models/user");

module.exports = (app, passport) => {
    /**
     * Routes used by Vue Router
     */
    app.get('/', isLoggedIn, (req, res) => {
        res.render('index.ejs'); 
    });

    app.get("/raportit", isLoggedIn, (req, res) => {
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
     * Calendar logic
     */
    app.post("/days", isAuthenticated, (req, res) => {
        let dayStart = moment(req.body.day).hour(0).minute(0).second(0),
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
            quarters: req.body.quarters,
            notes: req.body.notes,
            dailyTotal: req.body.dailyTotal
        }, {
            upsert: true
        }, (err, day) => {
            if (err) return "Error while updating records";

            res.send("OK");
        });
    });

    app.post("/dailytotal", isAuthenticated, (req, res) => {
        let dayStart = moment(req.body.day).hour(0).minute(0).second(0),
            dayEnd = moment(req.body.day).hour(23).minute(59).second(59);

        Paiva.findOneAndUpdate({
            user: req.user.id,
            day: {
                $gte: dayStart,
                $lt: dayEnd
            }
        }, {
            dailyTotal: req.body.dailyTotal
        }, {
            upsert: true
        }, (err, day) => {
            if (err) return "Error while updating records";

            res.send("OK");
        });
    })
    
    app.get("/days", isAuthenticated, (req, res) => {
        if (!req.query.selectedDate){
            res.status(500).send({ error: 'No day parameter provided.' });
        } else {
            let dayStart = moment(req.query.selectedDate).hour(0).minute(0).second(0),
                dayEnd = moment(req.query.selectedDate).hour(23).minute(59).second(59);
    
            Paiva.findOne({
                user: req.user.id,
                day: {
                    $gte: dayStart,
                    $lt: dayEnd
                }
            }, (err, paiva) => {
                if (err) res.status(500).send({ error: 'Something failed!' });
                if (paiva) {
                    res.json(paiva);
                } else {
                    var quarters = [];

                    for (var i = 0; i < 96; i++) {
                        quarters.push({
                            "qId": i,
                            "painted": false
                        })
                    }

                    var paiva = {
                        quarters,
                        notes: ""
                    }

                    res.json(paiva);
                }
            })
        }
    })

    app.post("/notes", isAuthenticated, (req, res) => {
        let dayStart = moment(req.body.day).hour(0).minute(0).second(0),
            dayEnd = moment(req.body.day).hour(23).minute(59).second(59);

        Paiva.findOneAndUpdate({
            user: req.user.id,
            day: {
                $gte: dayStart,
                $lt: dayEnd
            }
        }, {
            notes: req.body.notes,
            day: req.body.day,
            quarters: req.body.quarters,
            dailyTotal: req.body.dailyTotal
        }, {
            upsert: true
        }, (err, day) => {
            if (err) return "Error while updating records";

            res.send("OK");
        });
    })

    /**
     * Reports logic
     */
    app.get("/reports", isAuthenticated, (req, res) => {
        let firstDateStart = moment(req.query.firstDate).hour(0).minute(0).second(0),
            secondDateEnd = moment(req.query.secondDate).hour(23).minute(59).second(59),
            userId = req.query.userId;
        
        Paiva.find({
            user: userId,
            day: {
                $gte: firstDateStart,
                $lt: secondDateEnd
            }
        }).sort({ 
            day: 1 
        }).exec((err, paivas) => {
            if (err) res.status(500).send({ error: "Something failed when querying for the report" });
            res.json(paivas);
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