class NotificationManager {
  constructor() {
    this.notifications = []
    this.container = null
    this.init()
  }

  init() {
    // Create notification container
    this.container = document.createElement("div")
    this.container.id = "notification-container"
    this.container.className = "notification-container"
    document.body.appendChild(this.container)

    // Add styles
    this.addStyles()
  }

  addStyles() {
    const style = document.createElement("style")
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .notification {
        background: var(--card);
        color: var(--card-foreground);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 300ms ease-out;
        position: relative;
        overflow: hidden;
      }

      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification.success {
        border-left: 4px solid var(--chart-5);
      }

      .notification.warning {
        border-left: 4px solid var(--secondary);
      }

      .notification.error {
        border-left: 4px solid var(--destructive);
      }

      .notification.info {
        border-left: 4px solid var(--primary);
      }

      .notification-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notification-content {
        flex: 1;
      }

      .notification-title {
        font-weight: 600;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .notification-message {
        font-size: 13px;
        color: var(--muted-foreground);
        line-height: 1.4;
      }

      .notification-close {
        background: none;
        border: none;
        color: var(--muted-foreground);
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 200ms ease;
      }

      .notification-close:hover {
        background: var(--muted);
        color: var(--foreground);
      }

      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: var(--primary);
        transition: width linear;
      }

      @media (max-width: 640px) {
        .notification-container {
          left: 20px;
          right: 20px;
          max-width: none;
        }
      }
    `
    document.head.appendChild(style)
  }

  show(options) {
    const { type = "info", title, message, duration = 5000, persistent = false, actions = [] } = options

    const notification = this.createNotification({
      type,
      title,
      message,
      persistent,
      actions,
    })

    this.container.appendChild(notification)
    this.notifications.push(notification)

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add("show")
    })

    // Auto-remove if not persistent
    if (!persistent && duration > 0) {
      const progressBar = notification.querySelector(".notification-progress")
      if (progressBar) {
        progressBar.style.width = "0%"
        progressBar.style.transitionDuration = `${duration}ms`
      }

      setTimeout(() => {
        this.remove(notification)
      }, duration)
    }

    return notification
  }

  createNotification({ type, title, message, persistent, actions }) {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`

    const icons = {
      success: "✓",
      warning: "⚠",
      error: "✕",
      info: "ℹ",
    }

    notification.innerHTML = `
      <div class="notification-icon">${icons[type] || icons.info}</div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ""}
        <div class="notification-message">${message}</div>
        ${
          actions.length > 0
            ? `<div class="notification-actions">
            ${actions
              .map(
                (action) => `<button class="notification-action" data-action="${action.id}">${action.label}</button>`,
              )
              .join("")}
          </div>`
            : ""
        }
      </div>
      ${!persistent ? `<button class="notification-close" aria-label="Close notification">×</button>` : ""}
      ${!persistent ? '<div class="notification-progress"></div>' : ""}
    `

    // Add event listeners
    const closeBtn = notification.querySelector(".notification-close")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.remove(notification))
    }

    // Handle action buttons
    actions.forEach((action) => {
      const btn = notification.querySelector(`[data-action="${action.id}"]`)
      if (btn) {
        btn.addEventListener("click", () => {
          action.handler()
          if (action.closeOnClick !== false) {
            this.remove(notification)
          }
        })
      }
    })

    return notification
  }

  remove(notification) {
    notification.classList.remove("show")
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.notifications = this.notifications.filter((n) => n !== notification)
    }, 300)
  }

  clear() {
    this.notifications.forEach((notification) => this.remove(notification))
  }

  // Convenience methods
  success(title, message, options = {}) {
    return this.show({ type: "success", title, message, ...options })
  }

  warning(title, message, options = {}) {
    return this.show({ type: "warning", title, message, ...options })
  }

  error(title, message, options = {}) {
    return this.show({ type: "error", title, message, ...options })
  }

  info(title, message, options = {}) {
    return this.show({ type: "info", title, message, ...options })
  }
}

// Global instance
window.notificationManager = new NotificationManager()
