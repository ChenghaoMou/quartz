/**
 * Sidenotes Toggle Script
 *
 * Controls the global sidenotes visibility toggle button.
 * Persists the hidden/visible state to localStorage.
 */

document.addEventListener("nav", () => {
  const toggleButton = document.getElementById("sidenotes-toggle")
  if (!toggleButton) return

  const sidenotes = document.querySelectorAll(".sidenote, .marginnote")

  if (sidenotes.length > 0) {
    toggleButton.style.display = "block"
  } else {
    toggleButton.style.display = "none"
    return
  }

  const sidenotesHidden = localStorage.getItem("sidenotes-hidden") === "true"

  if (sidenotesHidden) {
    document.body.classList.add("sidenotes-hidden")
  }

  toggleButton.addEventListener("click", () => {
    const isHidden = document.body.classList.contains("sidenotes-hidden")

    if (isHidden) {
      document.body.classList.remove("sidenotes-hidden")
      localStorage.setItem("sidenotes-hidden", "false")
    } else {
      document.body.classList.add("sidenotes-hidden")
      localStorage.setItem("sidenotes-hidden", "true")
    }
  })
})
