import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import { createPinia } from 'pinia'
// @ts-ignore
import { PiniaVuePlugin } from 'pinia'
import App from './App.vue'
import { mockDesignSystem } from './mock-design-system'

// Install Vue Composition API for Vue 2
Vue.use(VueCompositionAPI)

// Install Pinia plugin for Vue 2
Vue.use(PiniaVuePlugin)

// Initialize mock design system components
mockDesignSystem()

Vue.config.productionTip = false

const pinia = createPinia()

new Vue({
  render: h => h(App),
  pinia,
}).$mount('#app')
