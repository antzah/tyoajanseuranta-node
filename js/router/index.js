import Vue from 'vue'
import Router from 'vue-router'
import Kalenteri from '../components/Kalenteri.vue'
import Raportit from '../components/Raportit.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: '/sovellus/',
  routes: [
    {
      path: '/',
      name: 'Kalenteri',
      component: Kalenteri
    },
    {
      path: '/raportit',
      name: 'Raportit',
      component: Raportit
    }
  ]
})
