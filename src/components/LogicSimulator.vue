<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { BMPLogicSimulator } from '@/bmplogic'

const props = withDefaults(
  defineProps<{
    src: string
    scale?: number
  }>(),
  {
    scale: 1,
  },
)

// refs to elements
const canvas = ref({} as HTMLCanvasElement)

// settings
const baseImage = ref<HTMLImageElement>()

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
  if (!simulator) return
  // find actual pixel in canvas
  const rect = canvas.value.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / props.scale)
  const y = Math.floor((event.clientY - rect.top) / props.scale)
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
  const img = new Image()
  img.src = props.src
  img.onload = () => {
    baseImage.value = img
  }
})

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
  canvas.value.style.width = `${img.width * props.scale}px`
  canvas.value.style.height = `${img.height * props.scale}px`
}

// watchers

watch(baseImage, initCanvas)
watch(() => props.scale, scaleCanvas, { deep: true })
</script>

<template>
  <div>
    <div>
      <button class="button" @click="startTimer" v-if="!timerId">Start</button>
      <button class="button" @click="stopTimer" v-else>Pause</button>
    </div>
    <div>
      <canvas
        ref="canvas"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.button {
  margin: 4px;
}
</style>
