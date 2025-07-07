import Vue from 'vue'
import App from './App.vue'
import { mockDesignSystem } from './mock-design-system'

// Initialize mock design system components
mockDesignSystem()

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
