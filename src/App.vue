<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { BMPLogicSimulator } from './bmplogic'

// refs to elements
const fileInput = ref({} as HTMLInputElement)
const canvas = ref({} as HTMLCanvasElement)

// settings
const scale = ref(5)
const baseImage = ref<HTMLImageElement>()

// LOGIC!
let simulator: BMPLogicSimulator | undefined = undefined
let timerId: number | null = null
let mousePosition: [number, number] | null = null

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

function startTimer() {
  if (!simulator) return
  if (timerId) return
  timerId = setInterval(() => {
    simulator?.onTick()
  }, 1000 / 60)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function onMouseDown(event: MouseEvent) {
  event.preventDefault()
  if (!simulator) return
  // find actual pixel in canvas
  const rect = canvas.value.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / scale.value)
  const y = Math.floor((event.clientY - rect.top) / scale.value)
  if (event.button === 0) {
    mousePosition = [x, y]
    simulator.hold(x, y)
  }
  if (event.button === 2) {
    simulator.toggleHold(x, y)
  }
}

function onMouseUp(event: MouseEvent) {
  event.preventDefault()
  if (!simulator) return
  if (event.button === 0 && mousePosition) {
    const [x, y] = mousePosition
    mousePosition = null
    simulator.unhold(x, y)
  }
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

  scaleCanvas()

  simulator = new BMPLogicSimulator(img, canvas.value)
}

function scaleCanvas() {
  const img = baseImage.value
  if (!img) return
  canvas.value.style.width = `${img.width * scale.value}px`
  canvas.value.style.height = `${img.height * scale.value}px`
}

// watchers

watch(baseImage, initCanvas)
watch(scale, scaleCanvas)
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
    <input type="file" accept="image/*" @input="onFileSelected" ref="fileInput" />
  </div>
  <div>
    <input type="range" min="0.1" max="10" step="0.1" v-model="scale" />
    <span>{{ scale }}</span>
  </div>
  <div>
    <button @click="startTimer">Start</button>
    <button @click="stopTimer">Stop</button>
  </div>
  <div>
    <canvas
      ref="canvas"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @contextmenu.prevent
    ></canvas>
  </div>
</template>

<style scoped></style>
