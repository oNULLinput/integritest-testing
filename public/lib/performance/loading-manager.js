class LoadingManager {
  constructor() {
    this.loadingStates = new Map()
    this.loadingQueue = []
    this.globalLoadingCount = 0
  }

  // Show loading with unique identifier
  show(id, message = "Loading...", options = {}) {
    const loadingState = {
      id,
      message,
      startTime: Date.now(),
      ...options,
    }

    this.loadingStates.set(id, loadingState)
    this.globalLoadingCount++
    this.updateUI()

    // Auto-hide after timeout if specified
    if (options.timeout) {
      setTimeout(() => {
        this.hide(id)
      }, options.timeout)
    }
  }

  // Hide specific loading
  hide(id) {
    if (this.loadingStates.has(id)) {
      this.loadingStates.delete(id)
      this.globalLoadingCount = Math.max(0, this.globalLoadingCount - 1)
      this.updateUI()
    }
  }

  // Update loading UI
  updateUI() {
    const overlay = document.getElementById("loadingOverlay")
    const spinner = document.getElementById("loadingSpinner")
    const message = document.getElementById("loadingMessage")

    if (this.globalLoadingCount > 0) {
      // Show loading overlay
      if (overlay) {
        overlay.style.display = "flex"
        overlay.classList.add("fade-in")
      }

      // Update message with most recent loading state
      const latestState = Array.from(this.loadingStates.values()).pop()
      if (message && latestState) {
        message.textContent = latestState.message
      }

      // Add progress indication for long operations
      if (latestState && Date.now() - latestState.startTime > 3000) {
        if (message) {
          message.textContent += " (This may take a moment...)"
        }
      }
    } else {
      // Hide loading overlay
      if (overlay) {
        overlay.classList.remove("fade-in")
        overlay.classList.add("fade-out")
        setTimeout(() => {
          overlay.style.display = "none"
          overlay.classList.remove("fade-out")
        }, 300)
      }
    }
  }

  // Create skeleton loader
  createSkeleton(container, type = "default") {
    const skeletonHTML = {
      default: `
                <div class="skeleton-loader">
                    <div class="skeleton-line skeleton-line-title"></div>
                    <div class="skeleton-line skeleton-line-text"></div>
                    <div class="skeleton-line skeleton-line-text short"></div>
                </div>
            `,
      table: `
                <div class="skeleton-table">
                    ${Array(5)
                      .fill()
                      .map(
                        () => `
                        <div class="skeleton-row">
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                            <div class="skeleton-cell"></div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `,
      card: `
                <div class="skeleton-card">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
            `,
    }

    if (container) {
      container.innerHTML = skeletonHTML[type] || skeletonHTML.default
    }
  }

  // Lazy loading implementation
  setupLazyLoading(selector = "[data-lazy]") {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target
            const loadFunction = element.dataset.lazyLoad

            if (loadFunction && window[loadFunction]) {
              window[loadFunction](element)
              observer.unobserve(element)
            }
          }
        })
      },
      {
        rootMargin: "50px",
      },
    )

    document.querySelectorAll(selector).forEach((el) => {
      observer.observe(el)
    })
  }
}

window.loadingManager = new LoadingManager()
