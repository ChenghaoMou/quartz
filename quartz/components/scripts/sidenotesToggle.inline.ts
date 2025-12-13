document.addEventListener("nav", () => {
  const toggleButton = document.getElementById("sidenotes-toggle")
  if (!toggleButton) return

  // Check if there are any sidenotes on the page
  const sidenotes = document.querySelectorAll(".sidenote")
  
  // Only show the toggle if there are sidenotes
  if (sidenotes.length > 0) {
    toggleButton.style.display = "block"
  } else {
    toggleButton.style.display = "none"
    return
  }

  // Check if sidenotes are currently hidden (from localStorage)
  const sidenotesHidden = localStorage.getItem("sidenotes-hidden") === "true"
  
  // Apply initial state
  if (sidenotesHidden) {
    document.body.classList.add("sidenotes-hidden")
  }

  toggleButton.addEventListener("click", () => {
    const isHidden = document.body.classList.contains("sidenotes-hidden")
    
    if (isHidden) {
      // Show sidenotes
      document.body.classList.remove("sidenotes-hidden")
      localStorage.setItem("sidenotes-hidden", "false")
    } else {
      // Hide sidenotes
      document.body.classList.add("sidenotes-hidden")
      localStorage.setItem("sidenotes-hidden", "true")
    }
  })
})