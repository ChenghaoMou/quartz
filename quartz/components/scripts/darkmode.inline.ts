type ThemeMode = "light" | "dark" | "system"
type Theme = "light" | "dark"

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"

const getEffectiveTheme = (mode: ThemeMode): Theme => {
  if (mode === "system") {
    return getSystemTheme()
  }
  return mode
}

const savedMode = (localStorage.getItem("themeMode") as ThemeMode | null) ?? "system"
const effectiveTheme = getEffectiveTheme(savedMode)
document.documentElement.setAttribute("saved-theme", effectiveTheme)
document.documentElement.setAttribute("theme-mode", savedMode)

const emitThemeChangeEvent = (theme: Theme) => {
  const event: CustomEventMap["themechange"] = new CustomEvent("themechange", {
    detail: { theme },
  })
  document.dispatchEvent(event)
}

document.addEventListener("nav", () => {
  const cycleTheme = () => {
    const currentMode = document.documentElement.getAttribute("theme-mode") as ThemeMode
    const modes: ThemeMode[] = ["light", "dark", "system"]
    const currentIndex = modes.indexOf(currentMode)
    const newMode = modes[(currentIndex + 1) % modes.length]

    const newTheme = getEffectiveTheme(newMode)
    document.documentElement.setAttribute("saved-theme", newTheme)
    document.documentElement.setAttribute("theme-mode", newMode)
    localStorage.setItem("themeMode", newMode)
    emitThemeChangeEvent(newTheme)
  }

  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    const currentMode = document.documentElement.getAttribute("theme-mode") as ThemeMode
    if (currentMode === "system") {
      const newTheme = e.matches ? "dark" : "light"
      document.documentElement.setAttribute("saved-theme", newTheme)
      emitThemeChangeEvent(newTheme)
    }
  }

  for (const darkmodeButton of document.getElementsByClassName("darkmode")) {
    darkmodeButton.addEventListener("click", cycleTheme)
    window.addCleanup(() => darkmodeButton.removeEventListener("click", cycleTheme))
  }

  // Listen for changes in prefers-color-scheme (only affects system mode)
  const colorSchemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  colorSchemeMediaQuery.addEventListener("change", handleSystemThemeChange)
  window.addCleanup(() => colorSchemeMediaQuery.removeEventListener("change", handleSystemThemeChange))
})
