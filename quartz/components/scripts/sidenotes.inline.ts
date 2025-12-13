document.addEventListener("nav", () => {
  const sidenotes = document.querySelectorAll(".sidenote") as NodeListOf<HTMLElement>

  // Position ALL sidenotes on the right side to avoid overlapping
  function positionSidenotes() {
    if (window.innerWidth < 1100) return

    // Get ALL sidenotes (both left and right go to the right column now)
    const allSidenotesForPositioning = Array.from(document.querySelectorAll(".sidenote")) as HTMLElement[]

    // First, reset all style.top to get natural flow positions
    allSidenotesForPositioning.forEach((sidenote) => {
      sidenote.style.top = ''
      sidenote.style.transform = ''
    })

    let lastBottom = 0

    allSidenotesForPositioning.forEach((sidenote) => {
      // Use offsetTop which is relative to the offset parent (correct coordinate system)
      const originalTop = sidenote.offsetTop

      // Calculate desired position (either original position or after last sidenote)
      // Both originalTop and lastBottom are now in the same coordinate system (relative to offset parent)
      const desiredTop = Math.max(originalTop, lastBottom + 16)
      
      sidenote.style.top = `${desiredTop}px`
      sidenote.style.transform = 'none'

      // Update lastBottom for next sidenote (relative to offset parent)
      const sidenoteHeight = sidenote.offsetHeight
      lastBottom = desiredTop + sidenoteHeight
    })
  }

  positionSidenotes()

  // Handle z-index management for all sidenotes
  const allSidenotes = document.querySelectorAll(".sidenote") as NodeListOf<HTMLElement>
  
  allSidenotes.forEach((sidenote) => {
    sidenote.addEventListener("click", (e) => {
      e.stopPropagation() // Prevent document click handler
      // Reset all sidenotes to default z-index and remove active class
      allSidenotes.forEach(note => {
        note.style.zIndex = "100"
        note.classList.remove("sidenote-active")
      })
      // Bring clicked sidenote to front and mark as active
      sidenote.style.zIndex = "101"
      sidenote.classList.add("sidenote-active")
    })
  })

  // Deactivate all sidenotes when clicking elsewhere
  document.addEventListener("click", () => {
    allSidenotes.forEach(note => {
      note.style.zIndex = "100"
      note.classList.remove("sidenote-active")
    })
  })

  // Handle collapsible sidenotes
  const collapsibleSidenotes = document.querySelectorAll(".sidenote.is-collapsible") as NodeListOf<HTMLElement>

  for (const sidenote of collapsibleSidenotes) {
    const title = sidenote.querySelector(".sidenote-title") as HTMLElement
    const content = sidenote.querySelector(".sidenote-content") as HTMLElement
    const foldIcon = sidenote.querySelector(".sidenote-fold-icon") as HTMLElement

    if (!title || !content) continue

    const handleToggle = () => {
      const isCollapsed = sidenote.classList.contains("is-collapsed")
      
      if (isCollapsed) {
        sidenote.classList.remove("is-collapsed")
      } else {
        sidenote.classList.add("is-collapsed")
      }
    }

    title.addEventListener("click", handleToggle)
    if (foldIcon) {
      foldIcon.addEventListener("click", (e) => {
        e.stopPropagation()
        handleToggle()
      })
    }

    // Keyboard accessibility
    title.setAttribute("tabindex", "0")
    title.setAttribute("role", "button")
    title.setAttribute("aria-expanded", sidenote.classList.contains("is-collapsed") ? "false" : "true")
    
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleToggle()
        title.setAttribute("aria-expanded", sidenote.classList.contains("is-collapsed") ? "false" : "true")
      }
    })
  }

  // Reposition on window resize
  function repositionSidenotes() {
    if (window.innerWidth >= 1100) {
      positionSidenotes()
    } else {
      // Reset positioning for smaller screens
      const allSidenotes = document.querySelectorAll(".sidenote") as NodeListOf<HTMLElement>
      allSidenotes.forEach(sidenote => {
        sidenote.style.top = ''
        sidenote.style.transform = ''
      })
    }
  }

  window.addEventListener('resize', repositionSidenotes)
})