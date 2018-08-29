import './bootstrap'

/**
 * Vue, Vue Components and Vue plugins
 */
import Vue from 'vue'
import VuejsDialog from 'vuejs-dialog'
import Tooltip from 'vue-directive-tooltip'
import App from './App.vue'
import router from './router'

Vue.use(Tooltip, {
  delay: 0,
  placement: 'bottom',
  class: 'tas-tooltip'
})

Vue.use(VuejsDialog)

/**
 * Other tools and plugins
 */
window.moment = require('moment')
window.moment.locale('fi')
window.AOS = require('aos')
window.AOS.init()

window.swal = require('sweetalert2')

if (document.querySelector('#app')) {
  new Vue({ // eslint-disable-line no-new
    el: '#app',
    router,
    template: '<App/>',
    components: { App }
  })
}

/**
 * Hide the home landing page spinner when stuff has been loaded
 */
if (document.querySelector('.home-loader')) document.querySelector('.home-loader').style.display = 'none'
