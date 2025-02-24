<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { BMPLogicSimulator } from '@/bmplogic'

const props = withDefaults(
  defineProps<{
    src: string
    defaultScale?: number
  }>(),
  {
    defaultScale: 1,
  },
)

// refs to elements
const canvas = ref<HTMLCanvasElement>()

// settings
const uuid = ref<string>()
const baseImage = ref<HTMLImageElement>()
const scale = ref(props.defaultScale)

// LOGIC!
const timerId = ref<number | null>(null)
let simulator: BMPLogicSimulator | undefined = undefined
let mousePosition: [number, number] | null = null

// event handlers

function startTimer() {
  if (!simulator) return
  if (timerId.value) return
  timerId.value = setInterval(() => {
    simulator?.onTick()
  }, 1000 / 20)
}

function stopTimer() {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
}

function onMouseDown(event: MouseEvent) {
  event.preventDefault()
  if (!simulator || !canvas.value) return
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
  uuid.value = Math.random().toString(36).slice(2)
  const img = new Image()
  img.src = props.src
  img.onload = () => {
    baseImage.value = img
  }
})

// canvas functions

function initCanvas() {
  const img = baseImage.value
  if (!img || !canvas.value) return

  simulator = new BMPLogicSimulator(img, canvas.value)
}

// watchers

watch([baseImage, canvas], initCanvas)
</script>

<template>
  <div>
    <div style="display: flex; flex-direction: row; gap: 8px; align-items: center">
      <button class="button" @click="startTimer" v-if="!timerId">Start</button>
      <button class="button" @click="stopTimer" v-else>Pause</button>
      <label :for="uuid">
        <strong>Image Scale</strong>
      </label>
      <input :id="uuid" type="range" min="0.1" max="10" step="0.1" v-model="scale" />
      <span>{{ scale }}x</span>
    </div>
    <div v-if="baseImage">
      <canvas
        ref="canvas"
        :style="{
          width: baseImage.naturalWidth * scale + 'px',
          height: baseImage.naturalHeight * scale + 'px',
        }"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.button {
  margin: 8px 0;
}
</style>
