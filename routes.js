const validateEmail = require('./js/helpers/validate-email')
const crypto = require('crypto')
const async = require('async')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const moment = require('moment')
moment.locale('fi')

const Paiva = require('./models/paiva')
const User = require('./models/user')

module.exports = (app, passport) => {
  /**
   * Static 'public' pages
   */
  app.get('/', (req, res) => {
    res.render('home.ejs', { message: req.flash('signupMessage') })
  })

  app.get('/ehdot-ja-saannot', (req, res) => {
    res.render('ehdot-ja-saannot.ejs')
  })

  /**
   * Routes used by Vue Router
   */
  app.get('/sovellus/', isLoggedIn, (req, res) => {
    res.render('index.ejs')
  })

  app.get('/sovellus/raportit', isLoggedIn, (req, res) => {
    res.render('index.ejs')
  })

  /**
   * Login, logout, signup, asetukset
   */
  app.get('/sovellus/kirjaudu/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.email']
  }))

  app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/sovellus/kirjaudu'
  }), (req, res) => {
    res.redirect('/sovellus/')
  })

  app.get('/sovellus/kirjaudu', (req, res) => {
    res.render('login.ejs', { message: req.flash('loginMessage') })
  })

  app.post('/sovellus/login', passport.authenticate('local-login', {
    successRedirect: '/sovellus/',
    failureRedirect: '/sovellus/kirjaudu',
    failureFlash: true
  }))

  app.get('/sovellus/logout', function (req, res) {
    req.logout()
    res.redirect('/sovellus/kirjaudu')
  })

  app.get('/sovellus/rekisteroidy', (req, res) => {
    res.render('signup.ejs', { message: req.flash('signupMessage') })
  })

  app.get('/sovellus/palauta-salasana', (req, res) => {
    res.render('forgot-password.ejs', {
      forgotPasswordError: req.flash('forgotPasswordError'),
      forgotPasswordSuccess: req.flash('forgotPasswordSuccess')
    })
  })

  app.post('/sovellus/forgot', (req, res, next) => {
    async.waterfall([done => {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex')
        done(err, token)
      })
    }, (token, done) => {
      User.findOne({
        'local.email': req.body.email
      }, (err, user) => {
        if (err) console.log(err)

        if (!user) {
          req.flash('forgotPasswordError', `Käyttäjää sähköpostiosoitteella ${req.body.email} ei löytynyt.`)
          return res.redirect('/sovellus/palauta-salasana')
        }

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + (3600000 * 24) // 24 hours

        user.save(function (err) {
          done(err, token, user)
        })
      })
    }, (token, user, done) => {
      let msg = {
        to: user.local.email,
        from: 'noreply@em3625.tuntikirjanpito.fi',
        subject: 'Salasanan nollauslinkki',
        text: `Voit nollata salasanasi osoitteessa http://${req.headers.host}/sovellus/reset/${token}`,
        html: `<p>Voit nollata salasanasi <a href="http://${req.headers.host}/sovellus/reset/${token}">täällä</a></p>`
      }
      sgMail.send(msg).then(() => {
        req.flash('forgotPasswordSuccess', `Palautuslinkki lähetetty osoitteeseen ${user.local.email}!`)
        done(null, 'done')
      }).catch(err => {
        req.flash('forgotPasswordError', 'Hups! Jokin meni pieleen. Yritä uudelleen.')
        console.log(err)
        done(err, 'done')
      })
    }], err => {
      console.log(err)
      res.redirect('/sovellus/palauta-salasana')
    })
  })

  app.get('/sovellus/reset/:token', (req, res) => {
    User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }, (err, user) => {
      if (err) console.log(err)
      if (!user) {
        req.flash('forgotPasswordError', 'Palautuslinkki on vanhentunut. Yritä uudestaan.')
        return res.redirect('/sovellus/palauta-salasana')
      }
      res.render('reset-password.ejs', {
        user: req.user,
        resetPasswordSuccess: req.flash('resetPasswordSuccess'),
        resetPasswordError: req.flash('resetPasswordError')
      })
    })
  })

  app.post('/sovellus/reset/:token', (req, res) => {
    async.waterfall([
      done => {
        User.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() }
        }, (err, user) => {
          if (err) console.log(err)
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.')
            return res.redirect('back')
          }

          user.local.password = user.generateHash(req.body.password)
          user.resetPasswordToken = undefined
          user.resetPasswordExpires = undefined

          user.save(err => {
            if (err) {
              console.log(err)
            }
            done(err, user)
          })
        })
      }, (user, done) => {
        let msg = {
          to: user.local.email,
          from: 'noreply@em3625.tuntikirjanpito.fi',
          subject: 'Salasana vaihdettu',
          text: 'Salasanasi on vaihdettu onnistuneesti.',
          html: '<p>Salasanasi on vaihdettu onnistuneesti.</p>'
        }
        sgMail.send(msg).then(() => {
          req.login(user, err => {
            if (err) console.log(err)
            done(err)
          })
          done(null, 'done')
        }).catch(err => {
          console.log(err)
          done(err, 'done')
        })
      }
    ], err => {
      if (err) console.log(err)
      res.redirect('/sovellus/')
    })
  })

  app.post('/sovellus/signup', passport.authenticate('local-signup', {
    successRedirect: '/sovellus/',
    failureRedirect: '/sovellus/rekisteroidy',
    failureFlash: true
  }))

  app.get('/sovellus/asetukset', isLoggedIn, (req, res) => {
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

      res.render('asetukset.ejs', {
        passwordChangeSuccess: req.flash('passwordChangeSuccess'),
        passwordChangeError: req.flash('passwordChangeError'),
        userAuthorizationSuccess: req.flash('userAuthorizationSuccess'),
        userAuthorizationError: req.flash('userAuthorizationError'),
        userAuthorizationInfo: req.flash('userAuthorizationInfo'),
        usersThatHaveAccess
      })
    })
  })

  app.post('/sovellus/asetukset/authorize-user', isAuthenticated, (req, res) => {
    let _id = req.user.id
    let emailThatGetsAccess = req.body.authorizedUser
    let adminUserId

    User.findOne({
      'local.email': emailThatGetsAccess
    }, (err, user) => {
      if (!validateEmail(emailThatGetsAccess)) {
        req.flash('userAuthorizationError', 'Syötit virheellisen sähköpostiosoitteen.')
        res.redirect('/sovellus/asetukset')
      } else if (err || user == null) {
        req.flash('userAuthorizationError', 'Jokin meni pieleen! Syötitkö oikean sähköpostiosoitteen?')
        res.redirect('/sovellus/asetukset')
      } else if (user.local.email === req.user.local.email) {
        req.flash('userAuthorizationInfo', 'Koitit lisätä käyttöoikeuden omaan kalenteriisi – tämä ei ole tarpeellista.')
        res.redirect('/sovellus/asetukset')
      } else if (user.hasAccessTo.indexOf(_id) !== -1) {
        req.flash('userAuthorizationInfo', 'Tällä käyttäjällä on jo oikeudet tarkastella kalenteriasi.')
        res.redirect('/sovellus/asetukset')
      } else {
        user.hasAccessTo.push(_id)
        adminUserId = user._id

        user.save((err) => {
          if (err) {
            req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
            res.redirect('/sovellus/asetukset')
          } else {
            User.findOne({
              _id
            }, (err, user) => {
              if (err || user == null) {
                req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
                res.redirect('/sovellus/asetukset')
              } else if (user.hasAccessTo.indexOf(_id) !== -1) {
                req.flash('userAuthorizationInfo', 'Tällä käyttäjällä on jo oikeudet tarkastella kalenteriasi.')
                res.redirect('/sovellus/asetukset')
              } else {
                user.accessibleBy.push(adminUserId)

                user.save((err) => {
                  console.log(err)
                  if (err) {
                    req.flash('userAuthorizationError', 'Jokin meni pieleen! Yritä uudelleen.')
                    res.redirect('/sovellus/asetukset')
                  } else {
                    req.flash('userAuthorizationSuccess', 'Käyttöoikeudet lisätty!')
                    res.redirect('/sovellus/asetukset')
                  }
                })
              }
            })
          }
        })
      }
    })
  })

  app.get('/sovellus/asetukset/remove-authorization/:id', isAuthenticated, (req, res) => {
    User.findById(req.user.id, (err, user) => {
      if (err) console.log(err)
      let index = user.accessibleBy.indexOf(req.params.id)
      user.accessibleBy.splice(index, 1)
      user.save((err) => {
        if (err) {
          req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
          res.redirect('/sovellus/asetukset')
        } else {
          User.findOne({
            _id: req.params.id
          }, (err, user) => {
            if (err) {
              req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
              res.redirect('/sovellus/asetukset')
            } else {
              let index = user.hasAccessTo.indexOf(req.user.id)
              user.hasAccessTo.splice(index, 1)
              user.save((err) => {
                if (err) {
                  req.flash('userAuthorizationError', 'Jokin meni pieleen oikeuksia poistaessa! Yritä uudelleen.')
                  res.redirect('/sovellus/asetukset')
                } else {
                  req.flash('userAuthorizationSuccess', 'Käyttöoikeudet poistettu!')
                  res.redirect('/sovellus/asetukset')
                }
              })
            }
          })
        }
      })
    })
  })

  app.post('/sovellus/asetukset/change-password', isAuthenticated, (req, res) => {
    if (
      !('oldPassword' in req.body) ||
      !('newPassword' in req.body) ||
      !('newPasswordValidate' in req.body) ||
      (req.body.oldPassword === '') ||
      (req.body.newPassword === '') ||
      (req.body.newPasswordValidate === '')
    ) {
      req.flash('passwordChangeError', 'Joitakin tietoja puuttui. Yritä uudelleen.')
      return res.redirect('/sovellus/asetukset')
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

      res.redirect('/sovellus/asetukset')
    })
  })

  app.get('/sovellus/kayttaja-poistettu', (req, res) => {
    res.render('user-deleted.ejs')
  })

  app.get('/sovellus/delete-user', isAuthenticated, (req, res) => {
    User.deleteOne({
      _id: req.user.id
    }).exec(err => {
      if (err) {
        console.log(err)
        res.redirect('/sovellus/asetukset')
      } else {
        Paiva.deleteMany({
          user: req.user.id
        }, err => {
          if (err) {
            console.log(err)
            res.redirect('/sovellus/kayttaja-poistettu')
          } else {
            User.find({
              hasAccessTo: req.user.id
            }).exec((err, users) => {
              if (err) {
                console.log(err)
                res.redirect('/sovellus/kayttaja-poistettu')
              } else {
                users.forEach(user => {
                  let index = user.hasAccessTo.indexOf(req.user.id)
                  user.hasAccessTo.splice(index, 1)
                  user.save()
                })
                res.redirect('/sovellus/kayttaja-poistettu')
              }
            })
          }
        })
      }
    })
  })

  /**
   * Calendar logic
   */
  app.post('/sovellus/days', isAuthenticated, (req, res) => {
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

  app.post('/sovellus/dailytotal', isAuthenticated, (req, res) => {
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

  app.get('/sovellus/days', isAuthenticated, (req, res) => {
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

  app.post('/sovellus/notes', isAuthenticated, (req, res) => {
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
  app.get('/sovellus/reports', isAuthenticated, (req, res) => {
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

  app.get('/sovellus/viewable-users', isAuthenticated, (req, res) => {
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
  app.get('/sovellus/user', isAuthenticated, function (req, res) {
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

  res.redirect('/sovellus/kirjaudu')
}

function isAuthenticated (req, res, next) {
  if (req.isAuthenticated()) return next()

  res.send('<a href="/sovellus/kirjaudu">Kirjaudu sisään</a> jatkaaksesi.')
}
