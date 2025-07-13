document.addEventListener("nav", () => {
  const sidenotes = document.querySelectorAll(".sidenote") as NodeListOf<HTMLElement>

  // Position sidenotes to avoid overlapping while keeping them near their content
  function positionSidenotes() {
    if (window.innerWidth < 1400) return

    const leftSidenotes = Array.from(document.querySelectorAll(".sidenote.sidenote-l")) as HTMLElement[]
    const rightSidenotes = Array.from(document.querySelectorAll(".sidenote.sidenote-r")) as HTMLElement[]

    // Function to position a group of sidenotes and prevent overlaps
    function positionGroup(sidenotes: HTMLElement[]) {
      let lastBottom = 0

      sidenotes.forEach((sidenote) => {
        // Get the original position of the sidenote relative to the page
        const rect = sidenote.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const originalTop = rect.top + scrollTop

        // Calculate desired position (either original position or after last sidenote)
        const desiredTop = Math.max(originalTop, lastBottom + 20)
        
        sidenote.style.top = `${desiredTop}px`
        sidenote.style.transform = 'none'

        // Update lastBottom for next sidenote
        const sidenoteHeight = sidenote.offsetHeight
        lastBottom = desiredTop + sidenoteHeight
      })
    }

    // Position left and right sidenotes independently
    positionGroup(leftSidenotes)
    positionGroup(rightSidenotes)
  }

  positionSidenotes()

  // Handle z-index management for all sidenotes
  const allSidenotes = document.querySelectorAll(".sidenote") as NodeListOf<HTMLElement>
  
  allSidenotes.forEach((sidenote) => {
    sidenote.addEventListener("click", (e) => {
      e.stopPropagation() // Prevent document click handler
      // Reset all sidenotes to default z-index and remove active class
      allSidenotes.forEach(note => {
        note.style.zIndex = "10000"
        note.classList.remove("sidenote-active")
      })
      // Bring clicked sidenote to front and mark as active
      sidenote.style.zIndex = "10001"
      sidenote.classList.add("sidenote-active")
    })
  })

  // Deactivate all sidenotes when clicking elsewhere
  document.addEventListener("click", () => {
    allSidenotes.forEach(note => {
      note.style.zIndex = "10000"
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
    if (window.innerWidth >= 1400) {
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