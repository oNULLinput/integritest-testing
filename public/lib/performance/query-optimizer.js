class QueryOptimizer {
  constructor() {
    this.queryQueue = []
    this.batchTimeout = null
    this.batchDelay = 50 // 50ms batch delay
  }

  // Batch multiple queries together
  batchQuery(queries) {
    return new Promise((resolve, reject) => {
      this.queryQueue.push({ queries, resolve, reject })

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }

      this.batchTimeout = setTimeout(() => {
        this.executeBatch()
      }, this.batchDelay)
    })
  }

  async executeBatch() {
    if (this.queryQueue.length === 0) return

    const batch = [...this.queryQueue]
    this.queryQueue = []
    this.batchTimeout = null

    try {
      // Execute all queries in parallel
      const results = await Promise.all(
        batch.map(async ({ queries }) => {
          const queryResults = await Promise.all(queries)
          return queryResults
        }),
      )

      // Resolve all promises
      batch.forEach(({ resolve }, index) => {
        resolve(results[index])
      })
    } catch (error) {
      // Reject all promises
      batch.forEach(({ reject }) => {
        reject(error)
      })
    }
  }

  // Optimize SELECT queries with proper indexing hints
  optimizeSelect(table, columns = "*", conditions = {}) {
    let query = `SELECT ${columns} FROM ${table}`

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.entries(conditions)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(" AND ")
      query += ` WHERE ${whereClause}`
    }

    // Add index hints for common queries
    if (table === "exams" && conditions.exam_code) {
      query += ` /*+ INDEX(exams, idx_exam_code) */`
    }
    if (table === "instructors" && conditions.username) {
      query += ` /*+ INDEX(instructors, idx_username) */`
    }

    return query
  }

  // Debounce frequent queries
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
}

window.queryOptimizer = new QueryOptimizer()
