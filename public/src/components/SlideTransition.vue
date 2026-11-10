<template>
  <Transition :css="false" @enter="enter" @leave="leave">
    <slot />
  </Transition>
</template>

<script setup>
const props = defineProps({ duration: { type: Number, default: 250 } })

function frames(el) {
  const style = getComputedStyle(el)
  return [
    { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 },
    { height: `${el.offsetHeight}px`, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom, opacity: 1 },
  ]
}

function slide(el, done, keyframes) {
  el.style.overflow = 'hidden'
  el.animate(keyframes, { duration: props.duration, easing: 'ease-out' }).onfinish = () => {
    el.style.overflow = ''
    done()
  }
}

const enter = (el, done) => slide(el, done, frames(el))
const leave = (el, done) => slide(el, done, frames(el).reverse())
</script>
