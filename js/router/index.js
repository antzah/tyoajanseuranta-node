import Vue from 'vue'
import Router from 'vue-router'
import Kalenteri from "../components/kalenteri"
import Raportit from "../components/raportit"

Vue.use(Router)

export default new Router({
    mode: "history",
    base: "/",
    routes: [
        {
            path: '/',
            name: 'Kalenteri',
            component: Kalenteri
        },
        {
            path: "/raportit",
            name: "Raportit",
            component: Raportit
        }
    ]
})