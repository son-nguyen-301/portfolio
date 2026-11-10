// Stand-ins for Nuxt parts when a component is mounted outside Nuxt.
// NuxtLink becomes a plain <a href>, which is what it renders for a route on
// the built site.
import { defineComponent, h } from 'vue'

export const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: { to: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})

export const global = { components: { NuxtLink: NuxtLinkStub } }
