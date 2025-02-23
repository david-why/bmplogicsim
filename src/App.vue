<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// refs to elements
const fileInput = ref({} as HTMLInputElement)
const canvas = ref({} as HTMLCanvasElement)

// settings
const scale = ref(8)
const baseImage = ref<HTMLImageElement>()

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

// canvas functions
function initCanvas() {
  const img = baseImage.value
  if (!img) return

  // this must come before the getContext call, otherwise the image will be blurry
  canvas.value.width = img.naturalWidth * scale.value
  canvas.value.height = img.naturalHeight * scale.value

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, img.width * scale.value, img.height * scale.value)
}

// watchers

watch([baseImage, scale], initCanvas)
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
