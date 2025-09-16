class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536,
    }

    this.currentBreakpoint = this.getCurrentBreakpoint()
    this.observers = []

    this.init()
  }

  init() {
    // Listen for resize events
    window.addEventListener(
      "resize",
      this.debounce(() => {
        const newBreakpoint = this.getCurrentBreakpoint()
        if (newBreakpoint !== this.currentBreakpoint) {
          this.currentBreakpoint = newBreakpoint
          this.notifyObservers()
        }
      }, 250),
    )

    // Initialize responsive components
    this.initResponsiveNavigation()
    this.initResponsiveTables()
    this.initResponsiveModals()
    this.initTouchOptimizations()
  }

  getCurrentBreakpoint() {
    const width = window.innerWidth

    if (width >= this.breakpoints["2xl"]) return "2xl"
    if (width >= this.breakpoints.xl) return "xl"
    if (width >= this.breakpoints.lg) return "lg"
    if (width >= this.breakpoints.md) return "md"
    if (width >= this.breakpoints.sm) return "sm"
    return "xs"
  }

  isMobile() {
    return this.currentBreakpoint === "xs" || this.currentBreakpoint === "sm"
  }

  isTablet() {
    return this.currentBreakpoint === "md"
  }

  isDesktop() {
    return this.currentBreakpoint === "lg" || this.currentBreakpoint === "xl" || this.currentBreakpoint === "2xl"
  }

  // Observer pattern for breakpoint changes
  subscribe(callback) {
    this.observers.push(callback)
  }

  unsubscribe(callback) {
    this.observers = this.observers.filter((obs) => obs !== callback)
  }

  notifyObservers() {
    this.observers.forEach((callback) => callback(this.currentBreakpoint))
  }

  // Initialize responsive navigation
  initResponsiveNavigation() {
    const navToggle = document.querySelector("[data-nav-toggle]")
    const navMenu = document.querySelector("[data-nav-menu]")

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.contains("nav-open")

        if (isOpen) {
          navMenu.classList.remove("nav-open")
          navToggle.setAttribute("aria-expanded", "false")
        } else {
          navMenu.classList.add("nav-open")
          navToggle.setAttribute("aria-expanded", "true")
        }
      })

      // Close menu on outside click
      document.addEventListener("click", (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove("nav-open")
          navToggle.setAttribute("aria-expanded", "false")
        }
      })
    }
  }

  // Initialize responsive tables
  initResponsiveTables() {
    const tables = document.querySelectorAll("table[data-responsive]")

    tables.forEach((table) => {
      if (this.isMobile()) {
        this.convertTableToCards(table)
      } else {
        this.restoreTableLayout(table)
      }
    })
  }

  convertTableToCards(table) {
    const headers = Array.from(table.querySelectorAll("th")).map((th) => th.textContent)
    const rows = Array.from(table.querySelectorAll("tbody tr"))

    const cardContainer = document.createElement("div")
    cardContainer.className = "table-cards"

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll("td"))
      const card = document.createElement("div")
      card.className = "table-card card-responsive"

      cells.forEach((cell, index) => {
        const cardItem = document.createElement("div")
        cardItem.className = "table-card-item"
        cardItem.innerHTML = `
          <span class="table-card-label">${headers[index]}:</span>
          <span class="table-card-value">${cell.innerHTML}</span>
        `
        card.appendChild(cardItem)
      })

      cardContainer.appendChild(card)
    })

    table.style.display = "none"
    table.parentNode.insertBefore(cardContainer, table.nextSibling)
  }

  restoreTableLayout(table) {
    const cardContainer = table.parentNode.querySelector(".table-cards")
    if (cardContainer) {
      cardContainer.remove()
      table.style.display = ""
    }
  }

  // Initialize responsive modals
  initResponsiveModals() {
    const modals = document.querySelectorAll("[data-modal]")

    modals.forEach((modal) => {
      if (this.isMobile()) {
        modal.classList.add("modal-fullscreen")
      } else {
        modal.classList.remove("modal-fullscreen")
      }
    })
  }

  // Touch optimizations for mobile
  initTouchOptimizations() {
    if ("ontouchstart" in window) {
      document.body.classList.add("touch-device")

      // Add touch-friendly hover states
      const interactiveElements = document.querySelectorAll('button, a, [role="button"]')

      interactiveElements.forEach((element) => {
        element.addEventListener("touchstart", () => {
          element.classList.add("touch-active")
        })

        element.addEventListener("touchend", () => {
          setTimeout(() => {
            element.classList.remove("touch-active")
          }, 150)
        })
      })
    }
  }

  // Utility: Debounce function
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Utility: Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  // Smooth scroll with offset for fixed headers
  smoothScrollTo(target, offset = 0) {
    const element = typeof target === "string" ? document.querySelector(target) : target

    if (element) {
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }
}

// Initialize responsive manager
window.responsiveManager = new ResponsiveManager()

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = ResponsiveManager
}
