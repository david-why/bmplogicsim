<script setup lang="ts">
import { ref, watch } from 'vue'
import LogicSimulator from './components/LogicSimulator.vue'

// refs to elements
const fileInput = ref({} as HTMLInputElement)

// settings
const src = ref<string>()

/**
 * When a file is selected, put it in the simulator at the bottom.
 */
function onFileSelected() {
  const file = fileInput.value.files?.[0]
  if (!file) return
  src.value = URL.createObjectURL(file)
}

watch(src, (value, oldValue) => {
  if (oldValue) {
    URL.revokeObjectURL(oldValue)
  }
})
</script>

<template>
  <h1>Bitmap Logic Simulator</h1>
  <p>
    Originally created by
    <a href="https://realhet.wordpress.com/2015/09/02/bitmap-logic-simulator/">realhet</a>
    · Website &amp; most demos created by
    <a href="https://github.com/david-why/bmplogicsim">david-why</a>
  </p>
  <p><em>This website may not function properly on mobile devices.</em></p>

  <h2>Overview</h2>
  <p>
    Bitmap Logic Simulator is a method of software simulation of logic circuits. It uses a bitmap
    image (hence its name) to represent the logic gates in the circuit.
  </p>
  <p>There are three types of elements in an image for Bitmap Logic Simulator.</p>
  <ul>
    <li>
      <strong>Wires</strong>: Basic building block of all circuits. Represented by a series of
      bright (e.g., white) pixels.
    </li>
    <li>
      <strong>NOT gates</strong>: Inverts the input to the output. Represented by a single dark
      (e.g., black) pixel, surrounded by a bright pixel on the four cardinal directions and two
      adjacent diagonals. The input is the side with three adjacent bright pixels.
    </li>
    <li>
      <strong>Intersections</strong>: Crosses two lines. Represented by a dark pixel at the
      intersection of two bright wires.
    </li>
  </ul>
  <p>To interact with the demo below, press "Start", then use:</p>
  <ul>
    <li>Primary mouse button (usually left) to temporarily toggle on a wire.</li>
    <li>Secondary mouse button (usually right) to toggle on a wire until you press it again.</li>
  </ul>
  <LogicSimulator src="demo_elements.png" :defaultScale="4"></LogicSimulator>

  <p>From these elements, you can create anything!</p>
  <ul>
    <li><strong>OR gate</strong>: Just connect two wires. Simple as that.</li>
    <li>
      <strong>AND gate</strong>: You can use
      <a href="https://en.wikipedia.org/wiki/De_Morgan%27s_laws">De Morgan's Laws</a> to turn an AND
      gate into three NOT gates and an OR gate.
    </li>
    <li><strong>XOR gate</strong>: Implemented with ANDs, NOTs, and an OR.</li>
  </ul>
  <LogicSimulator src="demo_gates.png" :defaultScale="3"></LogicSimulator>

  <h2>More Complex Circuits</h2>
  <p>
    With all the logic gates in our arsenal, we can now implement some more powerful and complicated
    circuits! In fact, any logic circuit can now be implemented, because we have all the necessary
    logic gates.
  </p>
  <p>
    Let's start with a 1-bit half adder! It's made with an XOR gate and an AND gate (left), and it
    just add two bits (IN1 and IN2) together.
  </p>
  <p>
    To make this a full adder (one that can take a carry bit as input), we need to... well, add
    another half adder after it (right)! This one can add three bits (IN1, IN2, and C) together.
  </p>
  <p>
    <em>
      Tip: If you forgot, you can use the secondary (right) mouse button to keep a wire on until you
      click on it again!
    </em>
  </p>
  <LogicSimulator src="demo_adder.png" :defaultScale="4"></LogicSimulator>

  <p>
    Hey, if we can make a 1-bit adder, we can certainly make an 8-bit adder! Let's do that right
    now. It's actually really easy, just duplicate the 1-bit full adder seven more times, and
    connect the carry bits from the last bit to the next.
  </p>
  <p>
    <em>
      If you want to see a cool animation, try toggling on all bits in one input (e.g., IN2), and
      then pressing C! The carry will ripple through the entire adder.
    </em>
  </p>
  <LogicSimulator src="demo_adder2.png" :defaultScale="3"></LogicSimulator>

  <p>
    Who says computers can only use binary? We'll make our simulator display a decimal number! Check
    out the following circuit, which uses a decoder-like structure to display a number from 0 to 9.
    Click on one of the numbers in the "INPUT" section to try it out!
    <em>(Did you know that any relatively bright color can be used as wires?)</em>
  </p>
  <LogicSimulator src="demo_digit.png" :defaultScale="3"></LogicSimulator>

  <h2>A Cool Demo</h2>

  <p>
    It is also possible to create a functioning computer with these circuit elements, with an
    extremely simple instruction set. Here is one such computer, feel free to play around with it
    and even make a program or two!
  </p>
  <p>
    <em>
      Disclaimer: This computer is not created by me. The author's information is shown in the
      image. I just wanted to show you that it is possible to create a computer with this simple
      simulator!
    </em>
  </p>
  <p>To use the computer:</p>
  <ol>
    <li>Start the simulation.</li>
    <li>
      Click and hold the big red "RESET" button near the bottom for a couple of seconds, then the
      small orange "CLR" button at the bottom right for a couple of seconds.
    </li>
    <li>Make sure that nothing is flashing on the screen. Otherwise, repeat the previous step.</li>
    <li>
      To edit the memory and add a program:
      <ol type="i">
        <li>Right-click the orange "EN" button to enable editing.</li>
        <li>Use the "ADDR" and "DATA" inputs to select a memory cell and the data to write.</li>
        <li>Click the big orange "SET" button for a short while to write the memory.</li>
        <li>
          You should see the memory located center-right change to bright green to indicate the data
          in the cell.
        </li>
        <li>
          Finally, after you finish editing the memory, click on "EN" again to disable editing.
        </li>
      </ol>
    </li>
    <li>
      After you program the computer, click on the big green "RUN" button to start running your
      program!
    </li>
    <li>
      Whatever number your program stores in memory 31 (0b11111) will be displayed on the
      eight-segment display to the right of the computer.
    </li>
  </ol>
  <p>If you'd like an example program, try this:</p>
  <pre>
ADDR   DATA       'Assembly'
00000: 01111111   STA 31
00001: 00100001   ADI 1
00010: 11000000   JNC 0</pre
  >
  <p>After you RUN it, check the display on the right hand side!</p>
  <LogicSimulator src="demo_computer.png" :defaultScale="1"></LogicSimulator>

  <h2>Your Turn</h2>
  <p>
    After seeing so many circuits, it's your turn to try and create a circuit! Using your favorite
    image editor (I like the <a href="https://www.gimp.org/">GNU Image Manipulation Program</a>),
    create an image with the elements described above (wires, NOT gates, and intersections). Then,
    upload it here and see it in action!
  </p>

  <div>
    <input type="file" accept="image/*" @input="onFileSelected" ref="fileInput" />
  </div>

  <LogicSimulator :src="src" :defaultScale="2" v-if="src" :key="src"></LogicSimulator>

  <h2>In the future...</h2>
  <p>
    There are still many things to improve with this project! Here are some ideas that I have in
    mind for the future:
  </p>
  <ul>
    <li>Editing images directly on the website</li>
    <li>Easy embedding into other websites</li>
    <li>Cooler demos</li>
    <li>Self-executing demos (automated setup and running)</li>
    <li>Touchscreen support</li>
    <li>... and many more!</li>
  </ul>
  <p>
    After the Hackathon ends, I might add these features to the website for completeness. Until
    then, stay tuned!
  </p>
</template>

<style scoped></style>
