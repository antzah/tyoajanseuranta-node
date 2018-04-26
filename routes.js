var validateEmail = require('./js/helpers/validate-email')
var moment = require('moment')
moment.locale('fi')

var Paiva = require('./models/paiva')
var User = require('./models/user')

module.exports = (app, passport) => {
  /**
   * Routes used by Vue Router
   */
  app.get('/', isLoggedIn, (req, res) => {
    res.render('index.ejs')
  })

  app.get('/raportit', isLoggedIn, (req, res) => {
    res.render('index.ejs')
  })

  /**
     * Login, logout, signup, settings
     */
  app.get('/login', (req, res) => {
    res.render('login.ejs', { message: req.flash('loginMessage') })
  })

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/login')
  })

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', { message: req.flash('signupMessage') })
  })

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/settings', isLoggedIn, (req, res) => {
    User.findOne({
      _id: req.user.id
    }).populate(
      'accessibleBy'
    ).exec((err, user) => {
      if (err) console.log(err)

      let usersThatHaveAccess = []
      user.accessibleBy.map(adminUser => {
        usersThatHaveAccess.push({
          email: adminUser.local.email,
          id: adminUser.id
        })
      })

      res.render('settings.ejs', {
        passwordChangeSuccess: req.flash('passwordChangeSuccess'),
        passwordChangeError: req.flash('passwordChangeError'),
        userAuthorizationSuccess: req.flash('userAuthorizationSuccess'),
        userAuthorizationError: req.flash('userAuthorizationError'),
        userAuthorizationInfo: req.flash('userAuthorizationInfo'),
        usersThatHaveAccess
      })
    })
  })

  app.post('/settings/authorize-user', isAuthenticated, (req, res) => {
    let _id = req.user.id
    let emailThatGetsAccess = req.body.authorizedUser
    let adminUserId

    User.findOne({
      'local.email': emailThatGetsAccess
    }, (err, user) => {
      if (!validateEmail(emailThatGetsAccess)) {
        req.flash('userAuthorizationError', 'Syötit virheellisen sähköpostiosoitteen.')
        res.redirect('/settings')
      } else if (err || user == null) {
        req.flash('userAuthorizationError', 'Jokin meni pieleen! Syötitkö oikean sähköpostiosoitteen?')
        res.redirect('/settings')
      } else if (user.local.email === req.user.local.email) {
        req.flash('userAuthorizationInfo', 'Koitit lisätä käyttöoikeuden omaan kalenteriisi – tämä ei ole tarpeellista.')
        res.redirect('/settings')
      } else if (user.hasAccessTo.indexOf(_id) !== -1) {
        req.flash('userAuthorizationInfo', 'Tällä käyttäjällä on jo oikeudet tarkastella kalenteriasi.')
        res.redirect('/settings')
      } else {
        user.hasAccessTo.push(_id)
        adminUserId = user._id

        user.save((err) => {
          if (err) {
            req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
            res.redirect('/settings')
          } else {
            User.findOne({
              _id
            }, (err, user) => {
              if (err || user == null) {
                req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
                res.redirect('/settings')
              } else if (user.hasAccessTo.indexOf(_id) !== -1) {
                req.flash('userAuthorizationInfo', 'Tällä käyttäjällä on jo oikeudet tarkastella kalenteriasi.')
                res.redirect('/settings')
              } else {
                user.accessibleBy.push(adminUserId)

                user.save((err) => {
                  console.log(err)
                  if (err) {
                    req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
                    res.redirect('/settings')
                  } else {
                    req.flash('userAuthorizationSuccess', 'Käyttöoikeudet lisätty!')
                    res.redirect('/settings')
                  }
                })
              }
            })
          }
        })
      }
    })
  })

  app.get('/settings/remove-authorization/:id', isAuthenticated, (req, res) => {
    User.findById(req.user.id, (err, user) => {
      if (err) console.log(err)
      let index = user.accessibleBy.indexOf(req.params.id)
      user.accessibleBy.splice(index, 1)
      user.save((err) => {
        if (err) {
          req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
          res.redirect('/settings')
        } else {
          User.findOne({
            _id: req.params.id
          }, (err, user) => {
            if (err) {
              req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
              res.redirect('/settings')
            } else {
              let index = user.hasAccessTo.indexOf(req.user.id)
              user.hasAccessTo.splice(index, 1)
              user.save((err) => {
                if (err) {
                  req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
                  res.redirect('/settings')
                } else {
                  req.flash('userAuthorizationSuccess', 'Käyttöoikeudet poistettu!')
                  res.redirect('/settings')
                }
              })
            }
          })
        }
      })
    })
  })

  app.post('/settings/change-password', isAuthenticated, (req, res) => {
    if (
      !('oldPassword' in req.body) ||
      !('newPassword' in req.body) ||
      !('newPasswordValidate' in req.body) ||
      (req.body.oldPassword === '') ||
      (req.body.newPassword === '') ||
      (req.body.newPasswordValidate === '')
    ) {
      req.flash('passwordChangeError', 'Joitakin tietoja puuttui. Yritä uudelleen.')
      return res.redirect('/settings')
    }
    User.findById(req.user.id, (err, user) => {
      if (err) {
        req.flash('passwordChangeError', 'Jokin meni pieleen! Yritä uudelleen.')
      } else if (!user.validPassword(req.body.oldPassword)) {
        req.flash('passwordChangeError', 'Syötit väärän salasanan. Yritä uudelleen.')
      } else if (req.body.newPassword !== req.body.newPasswordValidate) {
        req.flash('passwordChangeError', 'Syötit uuden salasanan vahvistuksen väärin. Yritä uudelleen.')
      } else {
        user.local.password = user.generateHash(req.body.newPassword)
        try {
          user.save()
          req.flash('passwordChangeSuccess', 'Salasana vaihdettu!')
        } catch (e) {
          console.log(e)
          req.flash('passwordChangeError', 'Jokin meni pieleen! Yritä uudelleen.')
        }
      }

      res.redirect('/settings')
    })
  })

  /**
     * Calendar logic
     */
  app.post('/days', isAuthenticated, (req, res) => {
    let dayStart = moment(req.body.day).hour(0).minute(0).second(0)
    let dayEnd = moment(req.body.day).hour(23).minute(59).second(59)

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
      if (err) return 'Error while updating records'

      res.send('OK')
    })
  })

  app.post('/dailytotal', isAuthenticated, (req, res) => {
    let dayStart = moment(req.body.day).hour(0).minute(0).second(0)
    let dayEnd = moment(req.body.day).hour(23).minute(59).second(59)

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
      if (err) return 'Error while updating records'

      res.send('OK')
    })
  })

  app.get('/days', isAuthenticated, (req, res) => {
    if (!req.query.selectedDate) {
      res.status(500).send({ error: 'No day parameter provided.' })
    } else {
      let dayStart = moment(req.query.selectedDate).hour(0).minute(0).second(0)
      let dayEnd = moment(req.query.selectedDate).hour(23).minute(59).second(59)

      Paiva.findOne({
        user: req.user.id,
        day: {
          $gte: dayStart,
          $lt: dayEnd
        }
      }, (err, paiva) => {
        if (err) res.status(500).send({ error: 'Something failed!' })
        if (paiva) {
          res.json(paiva)
        } else {
          var quarters = []

          for (var i = 0; i < 96; i++) {
            quarters.push({
              'qId': i,
              'painted': false
            })
          }

          paiva = {
            quarters,
            notes: ''
          }

          res.json(paiva)
        }
      })
    }
  })

  app.post('/notes', isAuthenticated, (req, res) => {
    let dayStart = moment(req.body.day).hour(0).minute(0).second(0)
    let dayEnd = moment(req.body.day).hour(23).minute(59).second(59)

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
      if (err) return 'Error while updating records'

      res.send('OK')
    })
  })

  /**
     * Reports logic
     */
  app.get('/reports', isAuthenticated, (req, res) => {
    let firstDateStart = moment(req.query.firstDate).hour(0).minute(0).second(0)
    let secondDateEnd = moment(req.query.secondDate).hour(23).minute(59).second(59)
    let userId = req.query.userId

    if (
      req.user.hasAccessTo.indexOf(userId) === -1 &&
      req.user.id !== userId
    ) {
      res.status(500).send({ error: 'Not allowed' })
    } else {
      Paiva.find({
        user: userId,
        day: {
          $gte: firstDateStart,
          $lt: secondDateEnd
        }
      }).sort({
        day: 1
      }).exec((err, paivas) => {
        if (err) res.status(500).send({ error: 'Something failed when querying for the report' })
        res.json(paivas)
      })
    }
  })

  app.get('/viewable-users', isAuthenticated, (req, res) => {
    User.findOne({
      _id: req.user.id
    }).populate(
      'hasAccessTo'
    ).exec((err, user) => {
      if (err) {
        console.log(err)
        res.status(500).send({ error: 'Something failed when querying for the current user' })
      } else {
        let viewableUsers = []
        
        /**
         * Push the current user to the "viewable" array first,
         * since everybody can view their own reports
         */
        viewableUsers.push({
          email: req.user.local.email,
          id: req.user.id,
          name: req.user.local.name
        })

        user.hasAccessTo.map(viewableUser => {
          viewableUsers.push({
            email: viewableUser.local.email,
            id: viewableUser.id,
            name: viewableUser.local.name
          })
        })

        res.json(viewableUsers)
      }
    })
  })

  /**
   * Utility to fetch the current user in Vue components
   */
  app.get('/user', isAuthenticated, function (req, res) {
    res.json({
      id: req.user.id,
      accessibleBy: req.user.accessibleBy,
      hasAccessTo: req.user.hasAccessTo,
      local: {
        email: req.user.local.email,
        name: req.user.local.name
      }
    })
  })
}

function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function isAuthenticated (req, res, next) {
  if (req.isAuthenticated()) return next()

  res.send('Not allowed. Plz login.')
}
