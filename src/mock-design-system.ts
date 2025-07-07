import Vue from 'vue'

export function mockDesignSystem() {
  // Mock Vue Design System components
  Vue.component('DsRow', {
    name: 'DsRow',
    template: '<div class="ds-row"><slot></slot></div>'
  })

  Vue.component('DsColumn', {
    name: 'DsColumn',
    props: {
      size: [String, Number],
      noPadding: Boolean
    },
    template: '<div class="ds-column" :class="{ \'no-padding\': noPadding }"><slot></slot></div>'
  })

  Vue.component('DsText', {
    name: 'DsText',
    props: {
      size: String,
      color: String
    },
    template: '<div class="ds-text" :class="[size ? `size-${size}` : \'\', color ? `color-${color}` : \'\']"><slot></slot></div>'
  })

  Vue.component('DsProgressCircular', {
    name: 'DsProgressCircular',
    props: {
      size: String,
      color: String
    },
    template: '<div class="ds-progress-circular" :class="[size ? `size-${size}` : \'\', color ? `color-${color}` : \'\']"></div>'
  })

  Vue.component('DsButton', {
    name: 'DsButton',
    props: {
      theme: String,
      color: String,
      iconPosition: String,
      disabled: Boolean
    },
    template: `
      <button 
        class="ds-button" 
        :class="[theme ? \`theme-\${theme}\` : '', iconPosition ? \`icon-\${iconPosition}\` : '']" 
        :style="{ backgroundColor: color }"
        :disabled="disabled"
      >
        <slot></slot>
      </button>
    `
  })

  Vue.component('DsIcon', {
    name: 'DsIcon',
    props: {
      name: String,
      size: String,
      color: String
    },
    template: '<span class="ds-icon" :class="[`icon-${name}`, size ? `size-${size}` : \'\']" :style="{ color }"></span>'
  })

  // Custom directive for tooltips
  Vue.directive('ds-tooltip', {
    bind(el, binding) {
      el.title = binding.value || ''
    }
  })

  // Add filter for empty string
  Vue.filter('emptyString', (value: any) => {
    return value || '—'
  })
}
