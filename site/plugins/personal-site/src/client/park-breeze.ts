import { stillMaskBits, stillMaskHeight, stillMaskWidth, treeLabelBits } from "../park-still-mask"

// A breeze through the Herbert Park footer picture.
//
// The footer's CSS draws the picture as a static background. When motion is
// allowed, this swaps in a canvas the same size as the picture (one canvas
// pixel per dot) and redraws it a few dozen times a second. Each dot samples the
// picture slightly off its own position, so colours drift between dots while the
// dots stay on their grid. The canopy sways, the ground stays still, and the
// pond ripples. The CSS dot mask and fade apply to the canvas as they do to
// the static picture.

const FPS = 24
const EASE_IN = 2.5 // seconds to reach full strength
const WATER = 0.87 // the pond starts this far down the picture
const SKY_ALPHA = 250 // dots below this opacity are sky
const STAR_ALPHA = 232 // reserved by the night image
const SHORE = 3 // still rows immediately above the pond
const ROOTS = 4 // rows over which canopy motion tapers toward the shore

// These profiles follow the generator’s crown IDs. The gust samples each
// crown at its center, so the rise in wind travels across the park.
const TREES = [
  { center: 29, lean: 0.85, sway: 0.85, frequency: 0.72, phase: 0.2, flutter: 0.52 },
  { center: 62, lean: 0.9, sway: 0.72, frequency: 0.94, phase: 1.7, flutter: 0.7 },
  { center: 74, lean: 1.05, sway: 1.0, frequency: 1.18, phase: 3.1, flutter: 1.12 },
  { center: 94, lean: 0.78, sway: 0.84, frequency: 0.85, phase: 4.4, flutter: 0.68 },
  { center: 108, lean: 0.9, sway: 0.77, frequency: 1.02, phase: 2.3, flutter: 0.84 },
  { center: 119, lean: 1.04, sway: 0.94, frequency: 1.12, phase: 5.1, flutter: 0.95 },
  { center: 136, lean: 1.16, sway: 1.08, frequency: 1.39, phase: 0.8, flutter: 1.22 },
  { center: 151, lean: 1.08, sway: 1.12, frequency: 1.53, phase: 3.8, flutter: 1.28 },
] as const

const GLINT_INTERVAL = 2.4 // seconds between opportunities for sunlight to catch
const SUNLIGHT = [255, 247, 222] as const

interface Reflection {
  offset: number
  x: number
  y: number
  brightness: number
}

interface Glint {
  offset: number
  peak: number
  duration: number
}

interface Picture {
  width: number
  height: number
  source: Uint8ClampedArray
  pinned: Uint8Array
  trees: Uint8Array
  canopyGusts: Float32Array
  rgba: Float32Array // premultiplied, 0..1
  weight: Float32Array // how freely each dot moves, 0..1
  gusts: Float32Array // delayed gust strength for each pond column
  night: boolean
  stars: number[]
  reflections: Reflection[]
  glintInterval: number
  glints: Glint[]
  colour: Float32Array // scratch space for sampling
}

const pictures = new Map<string, Promise<Picture | null>>()
let stopBreeze: (() => void) | undefined

function load(url: string, night: boolean): Promise<Picture | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = "async"
    image.onerror = () => resolve(null)
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image
      if (width !== stillMaskWidth || height !== stillMaskHeight) return resolve(null)
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) return resolve(null)
      context.drawImage(image, 0, 0)
      const data = context.getImageData(0, 0, width, height).data
      resolve(prepare(width, height, data, night))
    }
    image.src = url
  })
}

function prepare(width: number, height: number, data: Uint8ClampedArray, night: boolean): Picture {
  const count = width * height
  const rgba = new Float32Array(count * 4)
  const weight = new Float32Array(count)
  const pinned = decodeStillMask(width, height)
  const trees = new Uint8Array(count)
  const treeBits = atob(treeLabelBits)
  const reflections: Reflection[] = []
  const stars: number[] = []
  const ground = Math.round(height * WATER)

  for (let i = 0; i < count; i++) {
    const opacity = data[i * 4 + 3]!
    if (night && opacity === STAR_ALPHA && !pinned[i]) stars.push(i * 4)
    const alpha = opacity / 255
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = (data[i * 4 + c]! / 255) * alpha
    rgba[i * 4 + 3] = alpha

    const y = Math.floor(i / width)
    if (pinned[i] || opacity < SKY_ALPHA) {
      weight[i] = 0
    } else if (y >= ground) {
      weight[i] = -1 // water
      const brightness = (data[i * 4]! + 2 * data[i * 4 + 1]! + data[i * 4 + 2]!) / 1020
      if (!night && brightness >= 0.38) {
        reflections.push({ offset: i * 4, x: i % width, y, brightness })
      }
    } else {
      const clearance = ground - SHORE - y
      if (clearance > 0) {
        trees[i] = (treeBits.charCodeAt(i >> 1) >> ((i & 1) * 4)) & 15
        if (trees[i]) weight[i] = smoothstep(Math.min(1, clearance / ROOTS))
      }
    }
  }

  return {
    width,
    height,
    source: data,
    pinned,
    trees,
    canopyGusts: new Float32Array(TREES.length),
    rgba,
    weight,
    gusts: new Float32Array(width),
    night,
    stars,
    reflections,
    glintInterval: -1,
    glints: [],
    colour: new Float32Array(4),
  }
}

function decodeStillMask(width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height)
  const bits = atob(stillMaskBits)
  for (let i = 0; i < mask.length; i++) {
    mask[i] = (bits.charCodeAt(i >> 3) >> (i & 7)) & 1
  }
  return mask
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

// Bilinear sample of the premultiplied picture, clamped to its edges.
function sample(p: Picture, x: number, y: number, origin: number, out: Float32Array) {
  const maxX = p.width - 1
  const maxY = p.height - 1
  x = Math.min(maxX, Math.max(0, x))
  y = Math.min(maxY, Math.max(0, y))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(maxX, x0 + 1)
  const y1 = Math.min(maxY, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  const a = y0 * p.width + x0
  const b = y0 * p.width + x1
  const c = y1 * p.width + x0
  const d = y1 * p.width + x1
  const tree = p.trees[origin]!
  const aOffset = sampleOffset(p, a, origin, tree)
  const bOffset = sampleOffset(p, b, origin, tree)
  const cOffset = sampleOffset(p, c, origin, tree)
  const dOffset = sampleOffset(p, d, origin, tree)
  const v = p.rgba
  for (let k = 0; k < 4; k++) {
    const top = v[aOffset + k]! + (v[bOffset + k]! - v[aOffset + k]!) * fx
    const bottom = v[cOffset + k]! + (v[dOffset + k]! - v[cOffset + k]!) * fx
    out[k] = top + (bottom - top) * fy
  }
}

function sampleOffset(p: Picture, corner: number, origin: number, tree: number): number {
  // A crown can blend with its own foliage and the translucent sky.
  const blocked =
    p.pinned[corner] ||
    (p.night && p.source[corner * 4 + 3] === STAR_ALPHA) ||
    (tree > 0 && p.trees[corner] !== tree && p.source[corner * 4 + 3]! >= SKY_ALPHA)
  return (blocked ? origin : corner) * 4
}

// A broad gust crosses the picture at about 19 dots per second. A slower
// swell varies its strength from pass to pass.
function gust(x: number, t: number): number {
  const wave = 0.5 + 0.5 * Math.cos(t * 0.49 - x * 0.026)
  const swell = 0.72 + 0.28 * Math.cos(t * 0.19)
  return wave * wave * wave * swell
}

function noise(seed: number): number {
  const bits = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b)
  const mixed = Math.imul(bits ^ (bits >>> 16), 0x45d9f3b)
  return ((mixed ^ (mixed >>> 16)) >>> 0) / 0x100000000
}

function planGlints(p: Picture, interval: number) {
  p.glintInterval = interval
  p.glints.length = 0
  const seed = interval * 113 + 37
  const chance = noise(seed)
  if (chance < 0.24) return

  const count = chance < 0.78 ? 1 : 2
  for (let n = 0; n < count; n++) {
    const event = seed + n * 53
    const peak = interval * GLINT_INTERVAL + 0.65 + n * 0.65 + noise(event + 1) * 0.45
    let best: Reflection | undefined
    let highest = 0
    for (let j = 0; j < 24; j++) {
      const reflection = p.reflections[Math.floor(noise(event + j + 3) * p.reflections.length)]
      if (!reflection || reflection.offset === p.glints[0]?.offset) continue
      const { x, y, brightness } = reflection
      const crest = Math.sin(y * 1.2 - peak * 1.7 + x * 0.13)
      if (crest < 0.72) continue
      const score = brightness * crest * (0.55 + 0.45 * gust(x, peak - 1.2))
      if (score > highest) {
        best = reflection
        highest = score
      }
    }
    if (best) {
      p.glints.push({ offset: best.offset, peak, duration: 0.3 + 0.5 * noise(event + 28) })
    }
  }
}

function addGlints(p: Picture, out: Uint8ClampedArray, t: number, ease: number) {
  const interval = Math.floor(t / GLINT_INTERVAL)
  if (interval !== p.glintInterval) planGlints(p, interval)
  for (const { offset, peak, duration } of p.glints) {
    const distance = Math.abs(t - peak) / (duration / 2)
    if (distance >= 1) continue
    const strength = 0.9 * ease * (0.5 + 0.5 * Math.cos(Math.PI * distance))
    for (const [channel, target] of SUNLIGHT.entries()) {
      const value = out[offset + channel]!
      out[offset + channel] = value + Math.max(0, target - value) * strength
    }
  }
}

function draw(p: Picture, frame: ImageData, t: number) {
  const out = frame.data
  const { colour, gusts, canopyGusts } = p
  const ease = smoothstep(Math.min(1, t / EASE_IN))

  for (let x = 0; x < p.width; x++) gusts[x] = gust(x, t - 0.9)
  for (const [i, tree] of TREES.entries()) canopyGusts[i] = gust(tree.center, t)

  for (let y = 0; y < p.height; y++) {
    const waterPhase = y * 1.2 - t * 1.7
    for (let x = 0; x < p.width; x++) {
      const i = y * p.width + x
      const w = p.weight[i]!
      const o = i * 4
      if (w === 0) {
        for (let c = 0; c < 4; c++) out[o + c] = p.source[o + c]!
        continue
      }
      let dx = 0
      let dy = 0
      let light = 1

      if (w > 0) {
        const index = p.trees[i]! - 1
        const tree = TREES[index]!
        const g = canopyGusts[index]!
        const sway =
          tree.sway * (0.16 + 0.32 * g) * Math.sin(t * tree.frequency + tree.phase + y * 0.035)
        const turn = Math.sin(t * (1.9 + tree.flutter) + tree.phase - x * 0.52 + y * 0.68)
        const flutter = tree.flutter * turn * (0.05 + 0.27 * g)
        const mobility = w * ease
        dx = -(1.2 * tree.lean * g + sway + flutter) * mobility
        dy = (0.32 * tree.lean * g + 0.55 * flutter) * mobility
        light += (0.008 + 0.027 * g) * tree.flutter * turn * mobility
      } else if (w < 0) {
        // Long, slightly angled crests bend the existing reflections. The
        // ripple persists between gusts and the crests briefly catch light.
        const crest = Math.sin(waterPhase + x * 0.13)
        const energy = (0.38 + 0.62 * gusts[x]!) * ease
        dx = 1.25 * crest * energy
        light += 0.055 * crest * Math.abs(crest) * energy
      }

      sample(p, x + dx, y + dy, i, colour)
      const alpha = colour[3] ?? 0
      if (alpha <= 0) {
        out[o + 3] = 0
        continue
      }
      out[o] = Math.min(255, (colour[0]! / alpha) * light * 255)
      out[o + 1] = Math.min(255, (colour[1]! / alpha) * light * 255)
      out[o + 2] = Math.min(255, (colour[2]! / alpha) * light * 255)
      out[o + 3] = alpha * 255
    }
  }
  if (p.night) {
    for (const offset of p.stars) {
      const period = 15 + 14 * noise(offset)
      const phase = (t + period * noise(offset + 1)) % period
      if (phase >= 2.6) continue
      const glow = 28 * ease * Math.sin((phase / 2.6) * Math.PI) ** 2
      for (let c = 0; c < 3; c++) out[offset + c] = out[offset + c]! + glow
    }
  } else {
    addGlints(p, out, t, ease)
  }
}

function pictureUrl(footer: Element): string | null {
  const background = getComputedStyle(footer, "::after").backgroundImage
  return /url\("?([^")]+)"?\)/.exec(background)?.[1] ?? null
}

function start(elapsed = 0) {
  stopBreeze?.()
  const footer = document.querySelector("footer")
  if (!footer) return
  const motion = matchMedia("(prefers-reduced-motion: reduce)")
  if (motion.matches) return
  const night = document.documentElement.getAttribute("saved-theme") === "dark"
  const url = pictureUrl(footer)
  if (!url) return

  let cancelled = false
  let canvas: HTMLCanvasElement | undefined
  let observer: IntersectionObserver | undefined
  let request = 0

  const teardown = () => {
    cancelled = true
    cancelAnimationFrame(request)
    observer?.disconnect()
    motion.removeEventListener("change", teardown)
    document.removeEventListener("visibilitychange", resume)
    document.removeEventListener("themechange", switchTheme)
    canvas?.remove()
    footer.classList.remove("park-breeze")
    if (stopBreeze === teardown) stopBreeze = undefined
  }
  stopBreeze = teardown
  motion.addEventListener("change", teardown)

  let visible = false
  const switchTheme = () => {
    if ((document.documentElement.getAttribute("saved-theme") === "dark") !== night) {
      start(elapsed)
    }
  }
  document.addEventListener("themechange", switchTheme)
  let last = 0
  let resume = () => {}

  let picture = pictures.get(url)
  if (!picture) {
    picture = load(url, night)
    pictures.set(url, picture)
  }
  void picture.then((p) => {
    if (cancelled || !p) return
    const context = (canvas = document.createElement("canvas")).getContext("2d")
    if (!context) return
    canvas.className = "park-canvas"
    canvas.width = p.width
    canvas.height = p.height
    canvas.setAttribute("aria-hidden", "true")
    const frame = context.createImageData(p.width, p.height)

    const tick = (now: number) => {
      request = 0
      if (!visible || document.hidden) return
      const delta = last ? Math.min(0.25, (now - last) / 1000) : 0
      if (last && delta < 1 / FPS) {
        request = requestAnimationFrame(tick)
        return
      }
      last = now
      elapsed += delta
      draw(p, frame, elapsed)
      context.putImageData(frame, 0, 0)
      request = requestAnimationFrame(tick)
    }

    resume = () => {
      if (request || !visible || document.hidden) return
      last = 0
      request = requestAnimationFrame(tick)
    }

    draw(p, frame, elapsed)
    context.putImageData(frame, 0, 0)
    footer.prepend(canvas)
    footer.classList.add("park-breeze")

    observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting)
      resume()
    })
    observer.observe(footer)
    document.addEventListener("visibilitychange", resume)
  })
}

document.addEventListener("nav", () => {
  start()
  ;(window as Window & { addCleanup?: (fn: () => void) => void }).addCleanup?.(() => stopBreeze?.())
})
