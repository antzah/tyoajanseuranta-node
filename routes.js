module.exports = (app, passport) => {
    app.get('/', (req, res) => {
        res.render('index.ejs'); 
    });

    app.get('/login', (req, res) => {
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // app.post('/login', do all our passport stuff here);

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup', 
        failureFlash: true
    }));

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user : req.user 
        });
    });

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
