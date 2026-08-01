import { jsx, jsxs } from "preact/jsx-runtime"
import { formatDate, resolveRelative } from "@quartz-community/utils"

const appearanceScript = String.raw`
(() => {
  const key = "appearance"
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const modes = ["light", "system", "dark"]
  const names = { light: "Light", system: "System", dark: "Dark" }
  const stored = localStorage.getItem(key)
  const initial = modes.includes(stored) ? stored : "system"
  const apply = (mode, announce = false) => {
    const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode
    document.documentElement.dataset.appearance = mode
    document.documentElement.setAttribute("saved-theme", resolved)
    document.body?.classList.remove("theme-dark", "theme-light")
    document.body?.classList.add("theme-" + resolved)
    document.querySelectorAll("[data-appearance-pull]").forEach((button) => {
      const next = modes[(modes.indexOf(mode) + 1) % modes.length]
      button.dataset.mode = mode
      button.setAttribute("aria-label", "Colour scheme: " + names[mode] + ". Pull for " + names[next] + ".")
      button.setAttribute("title", names[mode] + " colour scheme · pull for " + names[next])
    })
    if (announce) document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: resolved } }))
  }
  apply(initial)
  let appearanceRevealAnimation = null
  let appearanceRevealRequest = 0
  let pendingAppearance = null
  const revealProperties = [
    "--theme-reveal-old",
    "--theme-reveal-new",
    "--theme-reveal-x",
    "--theme-reveal-y",
    "--theme-reveal-radius-x",
    "--theme-reveal-radius-y",
  ]
  const clearAppearanceReveal = () => {
    document.documentElement.classList.remove("is-theme-live-reveal")
    revealProperties.forEach((property) => document.documentElement.style.removeProperty(property))
  }
  const initialise = () => {
    apply(document.documentElement.dataset.appearance || initial)
    document.querySelectorAll("[data-appearance-pull]").forEach((button) => {
      if (button.dataset.ready) return
      button.dataset.ready = "true"
      const cordPaths = button.querySelectorAll("[data-pull-string]")
      const assembly = button.querySelector(".pull-assembly")
      const tag = button.querySelector(".pull-tag")
      const ambientShadow = button.querySelector(".pull-tag-shadow-ambient")
      const contactShadow = button.querySelector(".pull-tag-shadow-contact")
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
      const anchorX = Number(button.dataset.anchorX)
      const anchorY = Number(button.dataset.anchorY)
      const restY = Number(button.dataset.restY)
      const baseLength = restY - anchorY
      const maxLength = Number(button.dataset.maxLength)
      const triggerDistance = Number(button.dataset.triggerDistance)
      const keyboardDistance = Number(button.dataset.keyboardDistance)
      const shadowOffset = Number(button.dataset.shadowOffset)
      let animationFrame = 0
      let startX = null
      let startY = null
      let dragX = 0
      let dragY = 0
      let velocityX = 0
      let pointerScaleX = 1
      let pointerScaleY = 1
      let moved = false
      let pulled = false
      const quadraticLength = (startX, startY, controlX, controlY, endX, endY) => {
        let length = 0
        let previousX = startX
        let previousY = startY
        for (let step = 1; step <= 24; step++) {
          const time = step / 24
          const inverse = 1 - time
          const pointX = inverse * inverse * startX + 2 * inverse * time * controlX + time * time * endX
          const pointY = inverse * inverse * startY + 2 * inverse * time * controlY + time * time * endY
          length += Math.hypot(pointX - previousX, pointY - previousY)
          previousX = pointX
          previousY = pointY
        }
        return length
      }
      const slackControl = (endX, endY, ropeLength) => {
        const middleX = (anchorX + endX) / 2
        const middleY = (anchorY + endY) / 2
        const directLength = Math.hypot(endX - anchorX, endY - anchorY)
        if (ropeLength - directLength < 0.02) return { x: middleX, y: middleY }
        let low = 0
        let high = ropeLength
        while (quadraticLength(anchorX, anchorY, middleX, middleY + high, endX, endY) < ropeLength) high *= 2
        for (let iteration = 0; iteration < 18; iteration++) {
          const sag = (low + high) / 2
          const candidateLength = quadraticLength(anchorX, anchorY, middleX, middleY + sag, endX, endY)
          if (candidateLength < ropeLength) low = sag
          else high = sag
        }
        return { x: middleX, y: middleY + (low + high) / 2 }
      }
      const renderString = (offsetX, offsetY) => {
        let endX = anchorX + offsetX
        let endY = restY + offsetY
        let vectorX = endX - anchorX
        let vectorY = endY - anchorY
        let length = Math.hypot(vectorX, vectorY)
        const minLength = Math.min(10, baseLength * 0.25)
        if (length === 0) {
          vectorY = minLength
          length = minLength
          endY = anchorY + minLength
        }
        if (length > maxLength || length < minLength) {
          const constrainedLength = Math.max(minLength, Math.min(maxLength, length || minLength))
          const scale = constrainedLength / (length || 1)
          vectorX *= scale
          vectorY *= scale
          endX = anchorX + vectorX
          endY = anchorY + vectorY
          length = constrainedLength
        }
        const ropeLength = Math.max(baseLength, length)
        const control = slackControl(endX, endY, ropeLength)
        const controlX = control.x
        const controlY = control.y
        const path = "M " + anchorX + " " + anchorY + " Q " + controlX + " " + controlY + " " + endX + " " + endY
        cordPaths.forEach((cord) => cord.setAttribute("d", path))
        const angle = Math.max(-32, Math.min(32, Math.atan2(vectorX, Math.abs(vectorY)) * 180 / Math.PI * 0.38))
        const weightTransform = "translate(" + endX + " " + endY + ") rotate(" + angle + ")"
        tag.setAttribute("transform", weightTransform)
        ambientShadow.setAttribute("transform", weightTransform)
        contactShadow.setAttribute(
          "transform",
          "translate(" + (endX + shadowOffset) + " " + (endY + shadowOffset * 1.18) + ") rotate(" + angle + ")",
        )
        return { x: endX - anchorX, y: endY - restY }
      }
      const stopAnimation = () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
      const settle = (fromX, fromY, initialVelocityX = 0, initialVelocityY = 0) => {
        stopAnimation()
        if (reducedMotion.matches) {
          renderString(0, 0)
          return
        }
        let x = fromX
        let y = fromY
        let vx = initialVelocityX
        let vy = initialVelocityY
        const frame = () => {
          vx = (vx - x * 0.16) * 0.79
          vy = (vy - y * 0.22) * 0.72
          x += vx
          y += vy
          renderString(x, y)
          if (Math.abs(x) + Math.abs(y) + Math.abs(vx) + Math.abs(vy) < 0.08) {
            renderString(0, 0)
            animationFrame = 0
            return
          }
          animationFrame = window.requestAnimationFrame(frame)
        }
        animationFrame = window.requestAnimationFrame(frame)
      }
      const playKeyboardPull = () => {
        stopAnimation()
        if (reducedMotion.matches) {
          renderString(0, 0)
          return
        }
        const started = performance.now()
        const draw = (now) => {
          const progress = Math.min(1, (now - started) / 115)
          const eased = 1 - Math.pow(1 - progress, 2)
          renderString(Math.sin(progress * Math.PI) * keyboardDistance * 0.06, keyboardDistance * eased)
          if (progress < 1) {
            animationFrame = window.requestAnimationFrame(draw)
          } else {
            settle(keyboardDistance * 0.06, keyboardDistance, keyboardDistance * 0.08, -0.35)
          }
        }
        animationFrame = window.requestAnimationFrame(draw)
      }
      const cycleMode = () => {
        const current = pendingAppearance || document.documentElement.dataset.appearance || "system"
        const next = modes[(modes.indexOf(current) + 1) % modes.length]
        const request = ++appearanceRevealRequest
        pendingAppearance = next
        localStorage.setItem(key, next)
        if (reducedMotion.matches || typeof document.documentElement.animate !== "function") {
          pendingAppearance = null
          apply(next, true)
          return
        }

        // Browser zoom can change both the responsive layout and the CSS-pixel grid.
        // Measure on the next painted layout, then keep every value in the live
        // canvas's coordinate space so the reveal stays joined to the fixture.
        window.requestAnimationFrame(() => {
          if (request !== appearanceRevealRequest) return
          pendingAppearance = null
          const renderedCurrent = document.documentElement.dataset.appearance || "system"
          const previousAnimation = appearanceRevealAnimation
          appearanceRevealAnimation = null
          previousAnimation?.cancel()
          clearAppearanceReveal()

          const fixture = button.querySelector(".pull-fixture-grommet")
          const fixtureRect = fixture?.getBoundingClientRect()
          const originRect = fixtureRect?.width && fixtureRect.height ? fixtureRect : button.getBoundingClientRect()
          const visualViewport = window.visualViewport
          const viewportOffsetX = visualViewport?.offsetLeft || 0
          const viewportOffsetY = visualViewport?.offsetTop || 0
          const viewportWidth = Math.max(
            document.documentElement.clientWidth,
            viewportOffsetX + (visualViewport?.width || window.innerWidth),
          )
          const viewportHeight = Math.max(
            document.documentElement.clientHeight,
            viewportOffsetY + (visualViewport?.height || window.innerHeight),
          )
          const pixelRatio = window.devicePixelRatio || 1
          const snap = (value) => Math.round(value * pixelRatio) / pixelRatio
          const originX = snap(
            Math.max(0, Math.min(viewportWidth, originRect.left + viewportOffsetX + originRect.width / 2)),
          )
          const originY = snap(
            Math.max(0, Math.min(viewportHeight, originRect.top + viewportOffsetY + originRect.height / 2)),
          )
          const radius = snap(
            Math.hypot(
              Math.max(originX, viewportWidth - originX),
              Math.max(originY, viewportHeight - originY),
            ) +
              2 / pixelRatio,
          )
          const root = document.documentElement
          const oldPaper = getComputedStyle(root).getPropertyValue("--paper").trim()

          // Resolve the destination paper colour without allowing an
          // intermediate paint, then restore the current theme while the live
          // reveal layer is prepared.
          apply(next)
          const newPaper = getComputedStyle(root).getPropertyValue("--paper").trim()
          apply(renderedCurrent)

          root.style.setProperty("--theme-reveal-old", oldPaper)
          root.style.setProperty("--theme-reveal-new", newPaper)
          root.style.setProperty("--theme-reveal-x", originX + "px")
          root.style.setProperty("--theme-reveal-y", originY + "px")
          root.style.setProperty("--theme-reveal-radius-x", "1px")
          root.style.setProperty("--theme-reveal-radius-y", "1px")
          root.classList.add("is-theme-live-reveal")

          const revealFrames = [
            { "--theme-reveal-radius-x": "1px", "--theme-reveal-radius-y": "1px", offset: 0 },
            {
              "--theme-reveal-radius-x": snap(radius * 0.08) + "px",
              "--theme-reveal-radius-y": snap(radius * 0.065) + "px",
              offset: 0.12,
            },
            {
              "--theme-reveal-radius-x": snap(radius * 0.28) + "px",
              "--theme-reveal-radius-y": snap(radius * 0.24) + "px",
              offset: 0.3,
            },
            {
              "--theme-reveal-radius-x": snap(radius * 0.57) + "px",
              "--theme-reveal-radius-y": snap(radius * 0.53) + "px",
              offset: 0.52,
            },
            {
              "--theme-reveal-radius-x": snap(radius * 0.82) + "px",
              "--theme-reveal-radius-y": snap(radius * 0.8) + "px",
              offset: 0.74,
            },
            {
              "--theme-reveal-radius-x": radius + "px",
              "--theme-reveal-radius-y": radius + "px",
              offset: 1,
            },
          ]
          apply(next, true)
          const animation = root.animate(revealFrames, {
            duration: 720,
            easing: "cubic-bezier(0.22, 0.72, 0.24, 1)",
            fill: "both",
          })
          appearanceRevealAnimation = animation
          const finish = () => {
            if (appearanceRevealAnimation !== animation) return
            appearanceRevealAnimation = null
            clearAppearanceReveal()
          }
          animation.finished.then(finish, finish)
        })
      }
      const resetPointer = () => {
        startX = null
        startY = null
        dragX = 0
        dragY = 0
        velocityX = 0
        moved = false
        pulled = false
        button.classList.remove("is-dragging")
      }
      const click = () => {
        if (button.dataset.suppressClick === "true") {
          delete button.dataset.suppressClick
          return
        }
        cycleMode()
        playKeyboardPull()
      }
      const pointerDown = (event) => {
        if (event.button !== 0) return
        stopAnimation()
        const assemblyRect = assembly.getBoundingClientRect()
        const viewBox = assembly.viewBox.baseVal
        pointerScaleX = assemblyRect.width ? viewBox.width / assemblyRect.width : 1
        pointerScaleY = assemblyRect.height ? viewBox.height / assemblyRect.height : 1
        startX = event.clientX
        startY = event.clientY
        dragX = 0
        dragY = 0
        velocityX = 0
        moved = false
        pulled = false
        button.classList.add("is-dragging")
        try {
          button.setPointerCapture?.(event.pointerId)
        } catch {}
      }
      const pointerMove = (event) => {
        if (startX === null || startY === null) return
        const pointerX = event.clientX - startX
        const pointerY = event.clientY - startY
        const rendered = renderString(pointerX * pointerScaleX, pointerY * pointerScaleY)
        velocityX = rendered.x - dragX
        dragX = rendered.x
        dragY = rendered.y
        moved = Math.hypot(pointerX, pointerY) >= 3
        pulled = Math.hypot(pointerX, pointerY) >= triggerDistance
      }
      const pointerUp = () => {
        const shouldPull = pulled
        const shouldSuppressClick = moved
        const releaseX = dragX
        const releaseY = dragY
        const releaseVelocityX = velocityX
        resetPointer()
        if (shouldSuppressClick) {
          button.dataset.suppressClick = "true"
          window.setTimeout(() => delete button.dataset.suppressClick, 0)
        }
        if (shouldPull) cycleMode()
        settle(releaseX, releaseY, releaseVelocityX * 0.75, -0.2)
      }
      const pointerCancel = () => {
        const releaseX = dragX
        const releaseY = dragY
        resetPointer()
        settle(releaseX, releaseY)
      }
      button.addEventListener("click", click)
      button.addEventListener("pointerdown", pointerDown)
      button.addEventListener("pointermove", pointerMove)
      button.addEventListener("pointerup", pointerUp)
      button.addEventListener("pointercancel", pointerCancel)
      window.addCleanup?.(() => {
        stopAnimation()
        button.removeEventListener("click", click)
        button.removeEventListener("pointerdown", pointerDown)
        button.removeEventListener("pointermove", pointerMove)
        button.removeEventListener("pointerup", pointerUp)
        button.removeEventListener("pointercancel", pointerCancel)
      })
    })
  }
  media.addEventListener("change", () => {
    if ((document.documentElement.dataset.appearance || "system") === "system") apply("system", true)
  })
  document.addEventListener("nav", initialise)
  document.addEventListener("render", initialise)
  if (document.readyState !== "loading") initialise()
})()
`

const DitherSigil = () =>
  jsx("span", {
    class: "site-sigil",
    "aria-hidden": "true",
    children: Array.from({ length: 9 }, (_, index) => jsx("i", {}, index)),
  })

function PullModeSymbol({ mode, transform, moonMaskId }) {
  const children =
    mode === "light"
      ? [
          jsx("circle", { class: "pull-symbol-stroke", cx: "0", cy: "0", r: "2.6" }),
          jsx("path", {
            class: "pull-symbol-stroke",
            d: "M 0 -6 V -4.5 M 0 6 V 4.5 M -6 0 H -4.5 M 6 0 H 4.5 M -4.25 -4.25 L -3.2 -3.2 M 4.25 4.25 L 3.2 3.2 M 4.25 -4.25 L 3.2 -3.2 M -4.25 4.25 L -3.2 3.2",
          }),
        ]
      : mode === "system"
        ? [
            jsx("circle", { class: "pull-symbol-stroke", cx: "0", cy: "0", r: "5.3" }),
            jsx("path", { class: "pull-symbol-fill", d: "M 0 -5.3 A 5.3 5.3 0 0 0 0 5.3 Z" }),
          ]
        : [
            jsx("circle", {
              class: "pull-symbol-fill",
              cx: "0",
              cy: "0",
              r: "5.6",
              mask: `url(#${moonMaskId})`,
            }),
          ]

  return jsxs("g", {
    class: `pull-mode-symbol pull-mode-symbol-${mode}`,
    transform,
    children,
  })
}

function PullSwitch({ placement }) {
  const sidebar = placement === "sidebar"
  const geometry = sidebar
    ? {
        width: 120,
        height: 300,
        anchorX: 60,
        anchorY: 19,
        restY: 301.4,
        maxLength: 335.6,
        triggerDistance: 14,
        keyboardDistance: 28,
        shadowOffset: 3.6,
      }
    : {
        width: 44,
        height: 64,
        anchorX: 22,
        anchorY: 8,
        restY: 31,
        maxLength: 38,
        triggerDistance: 8,
        keyboardDistance: 12,
        shadowOffset: 1.5,
      }
  const midY = (geometry.anchorY + geometry.restY) / 2
  const restPath = `M ${geometry.anchorX} ${geometry.anchorY} Q ${geometry.anchorX} ${midY} ${geometry.anchorX} ${geometry.restY}`
  const materialId = `pull-metal-${placement}`
  const faceId = `pull-face-${placement}`
  const grainId = `pull-grain-${placement}`
  const moonMaskId = `pull-moon-mask-${placement}`
  const symbolTransform = sidebar ? "translate(0 25.2) scale(1.5)" : "translate(0 9) scale(0.75)"
  const fixture = sidebar
    ? [
        jsx("ellipse", { class: "pull-fixture-shadow", cx: "60", cy: "4", rx: "31", ry: "7" }),
        jsx("path", {
          class: "pull-fixture-body",
          fill: `url(#${materialId})`,
          filter: `url(#${grainId})`,
          d: "M 29 3 C 35 -5 85 -5 91 3 L 83 18 C 77 26 43 26 37 18 Z",
        }),
        jsx("ellipse", { class: "pull-fixture-lip", cx: "60", cy: "18", rx: "23", ry: "6" }),
        jsx("ellipse", { class: "pull-fixture-grommet", cx: "60", cy: "19", rx: "6", ry: "3" }),
      ]
    : [
        jsx("ellipse", { class: "pull-fixture-shadow", cx: "22", cy: "2.5", rx: "7.5", ry: "2.5" }),
        jsx("path", {
          class: "pull-fixture-body",
          fill: `url(#${materialId})`,
          filter: `url(#${grainId})`,
          d: "M 15 2 C 16 -1 28 -1 29 2 L 27 7 C 25 10 19 10 17 7 Z",
        }),
        jsx("ellipse", { class: "pull-fixture-lip", cx: "22", cy: "7", rx: "5", ry: "2" }),
        jsx("ellipse", { class: "pull-fixture-grommet", cx: "22", cy: "8", rx: "2", ry: "1" }),
      ]
  const tag = sidebar
    ? {
        body: "M -22.5 0 Q 0 -1.08 22.5 0 L 27.9 46.8 Q 28.35 50.4 25.2 50.4 L -25.2 50.4 Q -28.35 50.4 -27.9 46.8 Z",
        neck: { rx: "4.5", ry: "2.7" },
      }
    : {
        body: "M -8 0 Q 0 -0.4 8 0 L 10.5 16.5 Q 10.7 18 9.5 18 L -9.5 18 Q -10.7 18 -10.5 16.5 Z",
        neck: { rx: "2", ry: "1.2" },
      }

  return jsxs("button", {
    class: `appearance-pull appearance-pull-${placement}`,
    type: "button",
    "data-appearance-pull": true,
    "data-mode": "system",
    "data-anchor-x": String(geometry.anchorX),
    "data-anchor-y": String(geometry.anchorY),
    "data-rest-y": String(geometry.restY),
    "data-max-length": String(geometry.maxLength),
    "data-trigger-distance": String(geometry.triggerDistance),
    "data-keyboard-distance": String(geometry.keyboardDistance),
    "data-shadow-offset": String(geometry.shadowOffset),
    "aria-label": "Colour scheme: System. Pull for Dark.",
    title: "System colour scheme · pull for Dark",
    children: [
      jsxs("svg", {
        class: "pull-assembly",
        viewBox: `0 0 ${geometry.width} ${geometry.height}`,
        "aria-hidden": "true",
        children: [
          jsxs("defs", {
            children: [
              jsxs("linearGradient", {
                id: materialId,
                x1: "0%",
                y1: "0%",
                x2: "100%",
                y2: "0%",
                children: [
                  jsx("stop", { class: "pull-metal-highlight", offset: "0%" }),
                  jsx("stop", { class: "pull-metal-mid", offset: "18%" }),
                  jsx("stop", { class: "pull-metal-highlight", offset: "43%" }),
                  jsx("stop", { class: "pull-metal-low", offset: "67%" }),
                  jsx("stop", { class: "pull-metal-highlight", offset: "86%" }),
                  jsx("stop", { class: "pull-metal-mid", offset: "100%" }),
                ],
              }),
              jsxs("linearGradient", {
                id: faceId,
                x1: "0%",
                y1: "0%",
                x2: "100%",
                y2: "0%",
                children: [
                  jsx("stop", { class: "pull-face-highlight", offset: "0%" }),
                  jsx("stop", { class: "pull-face-mid", offset: "19%" }),
                  jsx("stop", { class: "pull-face-highlight", offset: "45%" }),
                  jsx("stop", { class: "pull-face-low", offset: "69%" }),
                  jsx("stop", { class: "pull-face-highlight", offset: "87%" }),
                  jsx("stop", { class: "pull-face-mid", offset: "100%" }),
                ],
              }),
              jsxs("filter", {
                id: grainId,
                x: "-20%",
                y: "-20%",
                width: "140%",
                height: "140%",
                children: [
                  jsx("feTurbulence", {
                    type: "fractalNoise",
                    baseFrequency: "0.018 0.78",
                    numOctaves: "2",
                    seed: sidebar ? "7" : "5",
                    result: "noise",
                  }),
                  jsx("feColorMatrix", {
                    in: "noise",
                    type: "matrix",
                    values:
                      "0.1807 0.6079 0.0614 0 0.075  0.1807 0.6079 0.0614 0 0.075  0.1807 0.6079 0.0614 0 0.075  0 0 0 0.1 0",
                    result: "grain",
                  }),
                  jsx("feComposite", {
                    in: "grain",
                    in2: "SourceAlpha",
                    operator: "in",
                    result: "clippedGrain",
                  }),
                  jsx("feBlend", { in: "SourceGraphic", in2: "clippedGrain", mode: "soft-light" }),
                ],
              }),
              jsxs("mask", {
                id: moonMaskId,
                x: "-6",
                y: "-6",
                width: "12",
                height: "12",
                maskUnits: "userSpaceOnUse",
                children: [
                  jsx("rect", { x: "-6", y: "-6", width: "12", height: "12", fill: "white" }),
                  jsx("circle", { cx: "2.4", cy: "-0.8", r: "4.7", fill: "black" }),
                ],
              }),
            ],
          }),
          jsxs("g", {
            class: "pull-fixture",
            transform: sidebar ? "translate(60 19) scale(1.5) translate(-60 -19)" : undefined,
            children: fixture,
          }),
          jsx("path", {
            class: "pull-string-shadow pull-string-shadow-ambient",
            "data-pull-string": true,
            d: restPath,
          }),
          jsx("path", {
            class: "pull-string-shadow pull-string-shadow-contact",
            "data-pull-string": true,
            d: restPath,
          }),
          jsx("path", {
            class: "pull-string-fibre",
            "data-pull-string": true,
            d: restPath,
          }),
          jsx("path", {
            class: "pull-tag-shadow pull-tag-shadow-ambient",
            d: tag.body,
            transform: `translate(${geometry.anchorX} ${geometry.restY})`,
          }),
          jsx("path", {
            class: "pull-tag-shadow pull-tag-shadow-contact",
            d: tag.body,
            transform: `translate(${geometry.anchorX + geometry.shadowOffset} ${geometry.restY + geometry.shadowOffset})`,
          }),
          jsxs("g", {
            class: "pull-tag",
            transform: `translate(${geometry.anchorX} ${geometry.restY})`,
            children: [
              jsx("ellipse", { class: "pull-tag-neck", cx: "0", cy: "0", ...tag.neck }),
              jsx("path", {
                class: "pull-tag-body",
                fill: `url(#${faceId})`,
                filter: `url(#${grainId})`,
                d: tag.body,
              }),
              jsx(PullModeSymbol, { mode: "light", transform: symbolTransform, moonMaskId }),
              jsx(PullModeSymbol, { mode: "system", transform: symbolTransform, moonMaskId }),
              jsx(PullModeSymbol, { mode: "dark", transform: symbolTransform, moonMaskId }),
            ],
          }),
        ],
      }),
    ],
  })
}

export const SiteChrome = () => {
  const Component = ({ fileData }) => {
    const slug = fileData.slug ?? "index"
    return jsxs("div", {
      class: "site-chrome",
      children: [
        jsxs("a", {
          class: "site-brand",
          href: resolveRelative(slug, "index"),
          "aria-label": "Sleepless in Debugging, home",
          "aria-current": slug === "index" ? "page" : undefined,
          children: [
            jsx(DitherSigil, {}),
            jsxs("span", {
              class: "site-name",
              children: [
                jsx("strong", { children: "Sleepless" }),
                jsx("span", { children: "in Debugging" }),
              ],
            }),
          ],
        }),
        jsx("div", {
          class: "site-switch-mount",
          children: jsx(PullSwitch, { placement: "sidebar" }),
        }),
        jsx(PullSwitch, { placement: "compact" }),
      ],
    })
  }
  Component.beforeDOMLoaded = appearanceScript
  return Component
}

export const AppearancePull = () => {
  const Component = () => jsx(PullSwitch, { placement: "sidebar" })
  Component.beforeDOMLoaded = appearanceScript
  return Component
}

export const HomeHero = () => {
  const Component = ({ fileData }) => {
    if (fileData.slug !== "index") return null
    return jsxs("section", {
      class: "home-intro",
      "aria-labelledby": "home-title",
      children: [
        jsx("h1", { id: "home-title", children: "Home" }),
        jsx("p", {
          children:
            "This is my journey in personal knowledge management—building a Zettelkasten system through lifelong reading and writing.",
        }),
        jsxs("p", {
          class: "home-signature",
          children: ["✌️", jsx("span", { children: "Chenghao" })],
        }),
        jsxs("nav", {
          class: "home-links",
          "aria-label": "Explore the site",
          children: [
            jsx("a", {
              href: resolveRelative(fileData.slug, "posts/index"),
              children: "Writing",
            }),
            jsx("a", { href: resolveRelative(fileData.slug, "tags/index"), children: "Topics" }),
            jsx("a", {
              href: resolveRelative(fileData.slug, "notes/20251221100853"),
              children: "Colophon",
            }),
            jsx("a", {
              href: resolveRelative(fileData.slug, "notes/20240218204257"),
              children: "About me",
            }),
          ],
        }),
      ],
    })
  }
  return Component
}

function pageDate(page) {
  return page.dates?.created ?? page.dates?.modified ?? page.dates?.published
}

function publicWriting(allFiles) {
  return allFiles
    .filter((page) => page.slug !== "index" && !page.slug.endsWith("/index"))
    .filter((page) => {
      const type = page.frontmatter?.type
      return ["essay", "note"].includes(type) || /^(?:posts|notes)\//.test(page.slug)
    })
    .filter((page) => page.unlisted !== true)
}

export const HomeFeed = (options = {}) => {
  const limit = options.limit ?? 24
  const Component = ({ allFiles, fileData, cfg }) => {
    if (fileData.slug !== "index") return null
    const pages = publicWriting(allFiles)
      .sort((a, b) => (pageDate(b)?.getTime?.() ?? 0) - (pageDate(a)?.getTime?.() ?? 0))
      .slice(0, limit)
    return jsxs("section", {
      class: "home-feed",
      "aria-labelledby": "recent-writing",
      children: [
        jsx("h2", { id: "recent-writing", children: "Recent writing" }),
        pages.length === 0
          ? jsx("p", { class: "empty-feed", children: "The public index is being assembled." })
          : jsx("ol", {
              class: "feed-list",
              children: pages.map((page) => {
                const fm = page.frontmatter ?? {}
                const date = pageDate(page)
                return jsxs(
                  "li",
                  {
                    class: "feed-item",
                    children: [
                      jsxs("div", {
                        class: "feed-line",
                        children: [
                          jsx("a", {
                            class: "internal",
                            href: resolveRelative(fileData.slug, page.slug),
                            children: fm.title ?? "Untitled",
                          }),
                          date
                            ? jsx("time", {
                                dateTime: date.toISOString(),
                                children: formatDate(date, cfg.locale),
                              })
                            : null,
                        ],
                      }),
                      fm.type === "note" && fm.status
                        ? jsx("span", { class: "feed-status", children: fm.status })
                        : null,
                      fm.description
                        ? jsx("p", { class: "feed-description", children: fm.description })
                        : null,
                    ],
                  },
                  page.slug,
                )
              }),
            }),
      ],
    })
  }
  return Component
}

export const NoteStatus = () => {
  const Component = ({ fileData }) => {
    const fm = fileData.frontmatter ?? {}
    if (fileData.slug === "index" || fm.type !== "note" || !fm.status) return null
    const copy = {
      draft: "An early sketch; the edges are still rough.",
      "in-progress": "A working note that may change as the idea develops.",
      evergreen: "A maintained note, revisited when the idea evolves.",
    }[fm.status]
    return jsxs("aside", {
      class: "note-status",
      children: [jsx("span", { children: fm.status }), jsx("p", { children: copy })],
    })
  }
  return Component
}
