<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { BMPLogicSimulator } from './bmplogic'

// refs to elements
const fileInput = ref({} as HTMLInputElement)
const canvas = ref({} as HTMLCanvasElement)

// settings
const scale = ref(8)
const baseImage = ref<HTMLImageElement>()

// LOGIC!
let simulator: BMPLogicSimulator | undefined = undefined

// event handlers

function onFileSelected() {
  const file = fileInput.value.files?.[0]
  if (!file) return
  const img = new Image()
  img.onload = () => {
    baseImage.value = img
  }
  img.src = URL.createObjectURL(file)
}

onMounted(() => {
  // load demo image
  const img = new Image()
  img.src = 'wires.bmp'
  img.onload = () => {
    baseImage.value = img
  }
})

onUnmounted(() => {})

// canvas functions
function initCanvas() {
  const img = baseImage.value
  if (!img) return

  simulator = new BMPLogicSimulator(img, canvas.value)
  // @ts-expect-error window has no "bmpSimulator" property, this is for debug only
  window.bmpSimulator = simulator
  console.log(simulator)
}

// watchers

watch(baseImage, initCanvas)
// TODO: change canvas style for scaling
// watch(scale, (value) => simulator && (simulator.scale = value))
</script>

<template>
  <h1>Bitmap Logic Simulator</h1>
  <p>
    Originally created by
    <a href="https://realhet.wordpress.com/2015/09/02/bitmap-logic-simulator/">realhet</a>
    · Website &amp; demos created by
    <a href="https://github.com/david-why/bmplogicsim">david-why</a>
  </p>
  <div>
    <input type="file" accept=".bmp" @input="onFileSelected" ref="fileInput" />
  </div>
  <div>
    <input type="range" min="0.1" max="10" step="0.1" v-model="scale" />
    <span>{{ scale }}</span>
  </div>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped></style>
