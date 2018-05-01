var secrets = require('./secrets.js')
var validateEmail = require('../js/helpers/validate-email')
var LocalStrategy = require('passport-local').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

var User = require('../models/user')

module.exports = passport => {
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user)
    })
  })

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  (req, email, password, done) => {
    process.nextTick(function () {
      User.findOne({ 'local.email': email }, function (err, user) {
        if (err) return done(err)
        if (!validateEmail(email)) return done(null, false, req.flash('signupMessage', 'Syötit virheellisen sähköpostiosoitteen.'))
        if (user) return done(null, false, req.flash('signupMessage', 'Tämä sähköpostiosoite on jo käytössä.'))
        else {
          var newUser = new User()

          newUser.local.name = req.body.name
          newUser.local.email = email
          newUser.local.password = newUser.generateHash(password)

          newUser.save(err => {
            if (err) throw err

            return done(null, newUser)
          })
        }
      })
    })
  }))

  passport.use('local-login', new LocalStrategy({
    passwordField: 'password',
    usernameField: 'email',
    passReqToCallback: true
  }, (req, email, password, done) => {
    User.findOne({ 'local.email': email }, (err, user) => {
      if (err) { return done(err) }
      if (!user) { return done(null, false, req.flash('loginMessage', 'Käyttäjää ei löytynyt.')) }
      if (!user.validPassword(password)) { return done(null, false, req.flash('loginMessage', 'Väärä salasana.')) }

      return done(null, user)
    })
  }))

  passport.use(new GoogleStrategy({
    clientID: secrets.GOOGLE_CLIENT_ID,
    clientSecret: secrets.GOOGLE_CLIENT_SECRET,
    callbackURL: secrets.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  }, (req, accessToken, refreshToken, profile, done) => {
    User.findOne({
      'local.email': profile.emails[0].value
    }, (err, user) => {
      if (err) { return done(err) }
      if (!user) { return done(null, false, req.flash('loginMessage', 'Käyttäjää ei löytynyt.')) }

      return done(null, user)
    })
  }))
}
