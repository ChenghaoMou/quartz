/**
 * Sidenotes Runtime Script
 *
 * Handles sidenote positioning and interactivity:
 * - Prevents sidenote overlap on wide screens by adjusting margins
 * - Highlights corresponding sidenote when clicking a reference
 * - Adds keyboard accessibility for toggle labels
 */

document.addEventListener("nav", () => {
  function positionSidenotes() {
    if (window.innerWidth < 1100) return

    const sidenotes = document.querySelectorAll(".sidenote, .marginnote") as NodeListOf<HTMLElement>
    if (sidenotes.length === 0) return

    sidenotes.forEach((sidenote) => {
      sidenote.style.marginTop = ""
    })

    let lastBottom = 0

    sidenotes.forEach((sidenote) => {
      const rect = sidenote.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const absoluteTop = rect.top + scrollTop

      if (absoluteTop < lastBottom) {
        const pushDown = lastBottom - absoluteTop + 16
        sidenote.style.marginTop = `${pushDown}px`
        lastBottom = absoluteTop + pushDown + rect.height
      } else {
        lastBottom = absoluteTop + rect.height
      }
    })
  }

  setTimeout(positionSidenotes, 100)

  let resizeTimeout: ReturnType<typeof setTimeout>
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth >= 1100) {
        positionSidenotes()
      } else {
        const sidenotes = document.querySelectorAll(
          ".sidenote, .marginnote",
        ) as NodeListOf<HTMLElement>
        sidenotes.forEach((sidenote) => {
          sidenote.style.marginTop = ""
        })
      }
    }, 100)
  })

  function highlightSidenote(sidenote: HTMLElement) {
    document.querySelectorAll(".sidenote-active").forEach((el) => {
      el.classList.remove("sidenote-active")
    })

    sidenote.classList.add("sidenote-active")

    if (window.innerWidth >= 1100) {
      sidenote.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }

    setTimeout(() => {
      sidenote.classList.remove("sidenote-active")
    }, 2000)
  }

  const toggles = document.querySelectorAll(
    "label.margin-toggle, label.sidenote-number, label.sidenote-highlight",
  ) as NodeListOf<HTMLLabelElement>
  toggles.forEach((toggle) => {
    toggle.setAttribute("tabindex", "0")
    toggle.setAttribute("role", "button")

    const inputId = toggle.getAttribute("for")
    if (inputId) {
      const checkbox = document.getElementById(inputId) as HTMLInputElement | null
      if (checkbox) {
        const sidenote = checkbox.nextElementSibling as HTMLElement | null

        toggle.setAttribute("aria-expanded", checkbox.checked ? "true" : "false")

        toggle.addEventListener("click", () => {
          if (
            sidenote &&
            (sidenote.classList.contains("sidenote") || sidenote.classList.contains("marginnote"))
          ) {
            highlightSidenote(sidenote)
          }
        })

        toggle.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            checkbox.checked = !checkbox.checked
            toggle.setAttribute("aria-expanded", checkbox.checked ? "true" : "false")

            if (
              sidenote &&
              (sidenote.classList.contains("sidenote") || sidenote.classList.contains("marginnote"))
            ) {
              highlightSidenote(sidenote)
            }
          }
        })

        checkbox.addEventListener("change", () => {
          toggle.setAttribute("aria-expanded", checkbox.checked ? "true" : "false")
        })
      }
    }
  })
})
