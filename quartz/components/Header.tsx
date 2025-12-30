import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  if (children.length === 0) return null

  // Split children: first element (Breadcrumbs) goes to nav-left, rest (Search, Darkmode) go to nav-right
  const leftChildren = children.slice(0, 1)
  const rightChildren = children.slice(1)

  return (
    <header>
      <div class="header-inner">
        <nav class="nav-left">{leftChildren}</nav>
        <nav class="nav-right">{rightChildren}</nav>
      </div>
    </header>
  )
}

Header.css = `
header {
  width: 100%;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

header:has(.breadcrumb-element) {
  border-bottom: 1px solid var(--lightgray);
}

header .header-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

header .nav-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

header .nav-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

header h1 {
  margin: 0;
  font-size: 1rem;
}

@media all and (max-width: 800px) {
  header {
    padding-bottom: 1rem;
  }
  
  header .nav-left {
    flex-wrap: wrap;
  }
}
`

export default (() => Header) satisfies QuartzComponentConstructor
