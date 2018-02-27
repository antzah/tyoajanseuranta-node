require('./bootstrap');

window.Vue = require('vue');
window.moment = require('moment');
moment.locale("fi");


import Tooltip from 'vue-directive-tooltip';

Vue.component('kalenteri-component', require('./components/Kalenteri.vue'));
Vue.use(Tooltip, {
    delay: 0,
    placement: 'bottom',
    class: 'tas-tooltip'
});

const app = new Vue({
    el: '#app'
});