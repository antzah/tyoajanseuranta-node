import "./bootstrap";

/**
 * Vue, Vue Components and Vue plugins
 */
import Vue from "vue";
import Tooltip from 'vue-directive-tooltip';
import App from "./App.vue";
import router from "./router";

Vue.use(Tooltip, {
    delay: 0,
    placement: 'bottom',
    class: 'tas-tooltip'
});

/**
 * Other tools and plugins
 */
window.moment = require("moment");
moment.locale("fi");

window.swal = require("sweetalert2");

if (document.querySelector("#app")) {
    new Vue({
        el: '#app',
        router,
        template: '<App/>',
        components: { App }
    })
}