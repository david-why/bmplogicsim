/**
 * Represents a point in 2D space.
 */
declare interface Point {
  x: number
  y: number
}

/**
 * Represents a single wire in the image. A wire is defined as a series of
 * continuous bright pixels, potentially separated by one or more intersections.
 */
declare interface Wire {
  id: number
  points: Point[]
}

/**
 * Represents a single NOT gate in the image. A NOT gate is a 3x3 shape,
 * consisting of four bright sides, two adjacent bright corners, and a dark
 * center. The input wire is NOT-ed to the output wire.
 */
declare interface NotGate {
  id: number
  inputWire: number
  outputWire: number
}

/**
 * Represents a NOT gate before the wires are found.
 */
declare interface TempNotGate {
  inputPixel: Point
  outputPixel: Point
}

/**
 * Tests if a pixel is bright, for the purpose of the simulator.
 * @param pixel The data of the pixel to test.
 * @returns Whether the pixel is considered "bright" or not.
 */
function isBright(pixel: Uint8ClampedArray): boolean {
  return pixel[0] > 200 || pixel[1] > 200 || pixel[2] > 200
}

/**
 * Reduce the brightness of a pixel in place.
 * @param pixel The pixel to reduce.
 * @returns The argument.
 */
function reduceBrightness(pixel: Uint8ClampedArray): Uint8ClampedArray {
  pixel[0] *= 0.5
  pixel[1] *= 0.5
  pixel[2] *= 0.5
  return pixel
}

export class BMPLogicSimulator {
  private context: CanvasRenderingContext2D

  /** The image data obtained from the baseImage. */
  private baseImageData: ImageData

  /** The edited image data that is updated every tick. */
  private dirtyImageData: ImageData

  /** The features found by `this.findFeatures()`. */
  private wires: Wire[] = []
  private notGates: NotGate[] = []

  private offWires = new Set<number>()
  private forceOnWires = new Set<number>()

  constructor(public baseImage: HTMLImageElement, public canvas: HTMLCanvasElement) {
    canvas.width = baseImage.naturalWidth
    canvas.height = baseImage.naturalHeight

    // get ImageData from baseImage
    const ctx = this.context = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(baseImage, 0, 0)
    this.baseImageData = ctx.getImageData(0, 0, baseImage.naturalWidth, baseImage.naturalHeight)

    // copy the image data for drawCanvas to use
    this.dirtyImageData = new ImageData(new Uint8ClampedArray(this.baseImageData.data), this.baseImageData.width)

    this.findFeatures()
    this.drawCanvas()
  }

  get naturalWidth(): number {
    return this.baseImage.naturalWidth
  }

  get naturalHeight(): number {
    return this.baseImage.naturalHeight
  }

  /**
   * Every tick, find NOT gates whose inputs are off, and make the corresponding
   * outputs on. Also, any forced on wires stay on.
   */
  onTick() {
    const newOnWires = new Set<number>(this.forceOnWires)
    for (const notGate of this.notGates) {
      if (this.offWires.has(notGate.inputWire)) {
        newOnWires.add(notGate.outputWire)
      }
    }
    this.offWires.clear()
    this.offWires = new Set(this.wires.map((wire) => wire.id).filter((id) => !newOnWires.has(id)))
    this.drawCanvas()
  }

  hold(x: number, y: number) {
    const id = this.findWire(x, y)?.id
    if (id) {
      this.forceOnWires.add(id)
    }
  }

  unhold(x: number, y: number) {
    const id = this.findWire(x, y)?.id
    if (id) {
      this.forceOnWires.delete(id)
    }
  }

  toggleHold(x: number, y: number) {
    const id = this.findWire(x, y)?.id
    if (id) {
      if (this.forceOnWires.has(id)) {
        this.forceOnWires.delete(id)
      } else {
        this.forceOnWires.add(id)
      }
    }
  }

  /**
   * Draws the image on the canvas, taking into account deasserted wires (reduce
   * brightness).
   */
  private drawCanvas() {
    const ctx = this.context
    // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const baseData = this.baseImageData.data
    const data = this.dirtyImageData.data
    for (const wire of this.wires) {
      const isOff = this.offWires.has(wire.id)
      for (const point of wire.points) {
        const index = (point.y * this.naturalWidth + point.x) * 4
        const pixel = baseData.slice(index, index + 4)
        data.set(isOff ? reduceBrightness(pixel) : pixel, index)
      }
    }
    ctx.putImageData(this.dirtyImageData, 0, 0)
  }

  /**
   * Retrieves the data of the pixel at (x, y), in RGBA.
   * A pixel outside the image is black (i.e., [0, 0, 0, 0]).
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns A `Uint8ClampedArray` of length 4, containing the RGBA values.
   */
  getPixel(x: number, y: number): Uint8ClampedArray {
    if (x < 0 || x >= this.naturalWidth || y < 0 || y >= this.naturalHeight) {
      // assume the borders of the image are dark
      return new Uint8ClampedArray([0, 0, 0, 0])
    }
    const index = (y * this.naturalWidth + x) * 4
    return this.baseImageData.data.slice(index, index + 4)
  }

  /**
   * Convenience function to check if a pixel is bright.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns Whether the pixel at (x, y) is bright or not.
   */
  private isPixelBright(x: number, y: number): boolean {
    return isBright(this.getPixel(x, y))
  }

  /**
   * Find the wire, if any, that contains the point.
   * @param x The X coordinate.
   * @param y The Y coordinate.
   * @returns The wire that contains the given point.
   */
  private findWire(x: number, y: number): Wire | undefined {
    return this.wires.find((wire) =>
      wire.points.some((point) => point.x === x && point.y === y)
    )
  }

  /**
   * Find all the wires, NOT gates, and intersections in the image.
   */
  private findFeatures() {
    let id = 1

    // notice how sideDirections[0] is between cornerDirections[0] and [1]
    const cornerDirections = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const
    const sideDirections = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const

    // this is temporary; when executing, the intersections don't matter
    const intersections: Point[] = []
    // because the wires don't exist yet, we store the NOT gates here for now
    const tempNotGates: TempNotGate[] = []

    // find the NOT gates and intersections first
    for (let y = 0; y < this.baseImageData.height; y++) {
      for (let x = 0; x < this.baseImageData.width; x++) {
        const pixel = this.getPixel(x, y)
        if (!isBright(pixel)) {
          // found a dark pixel, check if WASD are all bright
          if (sideDirections.every(([dx, dy]) => this.isPixelBright(x + dx, y + dy))) {
            // this might be:
            // 1. an intersection (four corners all dark)
            const isIntersection = cornerDirections.every(
              ([dx, dy]) => !this.isPixelBright(x + dx, y + dy)
            )
            if (isIntersection) {
              intersections.push({ x, y })
              continue
            }
            // 2. a NOT gate (two adjacent corners bright)
            const notGateInputSide = cornerDirections.findIndex(([dx, dy], index) => {
              const [dx2, dy2] = cornerDirections[(index + 1) % 4]
              const [dx3, dy3] = cornerDirections[(index + 2) % 4]
              const [dx4, dy4] = cornerDirections[(index + 3) % 4]
              return this.isPixelBright(x + dx, y + dy) && this.isPixelBright(x + dx2, y + dy2) && !this.isPixelBright(x + dx3, y + dy3) && !this.isPixelBright(x + dx4, y + dy4)
            })
            if (notGateInputSide >= 0) {
              const [dx, dy] = sideDirections[notGateInputSide]
              tempNotGates.push({
                inputPixel: { x: x + dx, y: y + dy },
                outputPixel: { x: x - dx, y: y - dy },
              })
              continue
            }
            // 3. nothing
            continue
          }
        }
      }
    }

    // now, BFS for all the wires
    const visited: boolean[][] = Array.from({ length: this.baseImageData.height }, () =>
      Array(this.baseImageData.width).fill(false)
    )
    for (let y = 0; y < this.baseImageData.height; y++) {
      for (let x = 0; x < this.baseImageData.width; x++) {
        if (this.isPixelBright(x, y) && !visited[y][x]) {
          // found a bright pixel, start a BFS from here
          const queue: Point[] = [{ x, y }]
          const points: Point[] = []
          while (queue.length > 0) {
            const current = queue.pop()!
            if (points.some((point) => point.x === current.x && point.y === current.y)) {
              continue
            }
            points.push(current)
            for (const [dx, dy] of sideDirections) {
              const next = { x: current.x + dx, y: current.y + dy }
              if (this.isPixelBright(next.x, next.y)) {
                queue.push(next)
              }
            }
          }
          this.wires.push({ id, points })
          points.forEach(({ x, y }) => visited[y][x] = true)
          id++
        }
      }
    }

    // connect the two sides of intersections
    for (const intersection of intersections) {
      for (const [dx, dy] of [[0, 1], [1, 0]]) {
        const wire1 = this.findWire(intersection.x + dx, intersection.y + dy)!
        const wire2 = this.findWire(intersection.x - dx, intersection.y - dy)!
        // the two wires may be the same one, we don't need to connect that...
        if (wire1.id === wire2.id) continue
        this.wires = this.wires.filter((wire) => wire !== wire1 && wire !== wire2)
        this.wires.push({ id, points: [...wire1.points, ...wire2.points] })
        id++
      }
    }

    // finally, find the two wires of the temp NOT gates and make it a real one
    for (const tempNotGate of tempNotGates) {
      const inputWire = this.findWire(tempNotGate.inputPixel.x, tempNotGate.inputPixel.y)!
      const outputWire = this.findWire(tempNotGate.outputPixel.x, tempNotGate.outputPixel.y)!
      this.notGates.push({ id, inputWire: inputWire.id, outputWire: outputWire.id })
      id++
    }

    // phew
  }
}
