
import fs from 'fs'
import path from 'path'

import { buildPaginatedResponse } from '../router/pagination'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'OTHER'

export type AuditEvent = {
  id: string
  resourceType: string
  resourceName: string
  action: AuditAction
  user?: string
  details?: Record<string, unknown>
  timestamp: string
}

// Use an in-memory store when SQLite is not available.
const useInMemoryStore = process.env.AUDIT_FORCE_IN_MEMORY === '1'

let BetterSqlite3: any = null

if (!useInMemoryStore) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    BetterSqlite3 = require('better-sqlite3')
  } catch {
    BetterSqlite3 = null
  }
}

// Warn when falling back to in-memory store so operators notice persistence is disabled
if (useInMemoryStore) {
  // Explicit developer override
  // eslint-disable-next-line no-console
  console.warn(
    'AUDIT_FORCE_IN_MEMORY=1 set — audit events will be stored in memory and NOT persisted to disk.'
  )
} else if (!BetterSqlite3) {
  // Native module not available
  // eslint-disable-next-line no-console
  console.warn(
    'better-sqlite3 not available — falling back to in-memory audit store. Events will not persist across restarts.'
  )
}

class AuditService {
  private events: AuditEvent[] = []

  private db: any | null = null

  private insertStatement: any | null = null

  private readonly baseQuery =
    'SELECT id, resourceType, resourceName, action, user, details, timestamp FROM audit_events'

  constructor() {
    if (!BetterSqlite3) return

    try {
      const dataDirectory = path.join(__dirname, '..', 'data')

      if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true })
      }

      const databasePath = path.join(dataDirectory, 'audit.db')

      this.db = new BetterSqlite3(databasePath)

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          resourceType TEXT,
          resourceName TEXT,
          action TEXT,
          user TEXT,
          details TEXT,
          timestamp TEXT
        )
      `)

      this.insertStatement = this.db.prepare(`
        INSERT INTO audit_events (
          id,
          resourceType,
          resourceName,
          action,
          user,
          details,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
    } catch (error) {
      console.error(
        'Failed to initialize SQLite audit database. Falling back to the in-memory store.',
        error
      )

      this.db = null
      this.insertStatement = null
    }
  }

  public async record(
    event: Omit<AuditEvent, 'id' | 'timestamp'>
  ): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    if (this.db && this.insertStatement) {
      try {
        this.insertStatement.run(
          auditEvent.id,
          auditEvent.resourceType,
          auditEvent.resourceName,
          auditEvent.action,
          auditEvent.user ?? null,
          JSON.stringify(auditEvent.details ?? {}),
          auditEvent.timestamp
        )

        return auditEvent
      } catch (error) {
        console.error(
          'Failed to write audit event to SQLite. Using the in-memory store instead.',
          error
        )
      }
    }

    // Keep recent events available even without SQLite.
    this.events.unshift(auditEvent)

    if (this.events.length > 5000) {
      this.events.length = 5000
    }

    return auditEvent
  }

  public async listRecentEvents(options: {
    page: number
    pageSize: number
    search?: string
    resourceType?: string
  }) {
    const { page, pageSize, search, resourceType } = options

    if (this.db) {
      try {
        const conditions: string[] = []
        const parameters: any[] = []

        if (resourceType) {
          conditions.push('resourceType = ?')
          parameters.push(resourceType)
        }

        if (search && search.trim().length > 0) {
          const searchValue = `%${search.toLowerCase()}%`

          conditions.push(`
            (
              LOWER(resourceName) LIKE ?
              OR LOWER(action) LIKE ?
              OR LOWER(user) LIKE ?
              OR LOWER(details) LIKE ?
            )
          `)

          parameters.push(
            searchValue,
            searchValue,
            searchValue,
            searchValue
          )
        }

        const whereClause =
          conditions.length > 0
            ? ` WHERE ${conditions.join(' AND ')}`
            : ''

        const countResult = this.db
          .prepare(
            `SELECT COUNT(1) AS count FROM audit_events ${whereClause}`
          )
          .get(...parameters)

        const total = countResult?.count ?? 0
        const offset = (page - 1) * pageSize

        const rows = this.db
          .prepare(
            `${this.baseQuery} ${whereClause}
             ORDER BY timestamp DESC
             LIMIT ? OFFSET ?`
          )
          .all(...parameters, pageSize, offset)

        const items = rows.map((row: any) => ({
          id: row.id,
          resourceType: row.resourceType,
          resourceName: row.resourceName,
          action: row.action,
          user: row.user,
          details: JSON.parse(row.details || '{}'),
          timestamp: row.timestamp,
        }))

        return buildPaginatedResponse(items, page, pageSize, total)
      } catch (error) {
        console.error(
          'Failed to read audit events from SQLite. Falling back to the in-memory store.',
          error
        )
      }
    }

    // In-memory fallback
    let filteredEvents = this.events

    if (resourceType) {
      filteredEvents = filteredEvents.filter(
        (event) => event.resourceType === resourceType
      )
    }

    if (search && search.trim().length > 0) {
      const searchValue = search.toLowerCase()

      filteredEvents = filteredEvents.filter((event) => {
        return (
          event.resourceName.toLowerCase().includes(searchValue) ||
          event.action.toLowerCase().includes(searchValue) ||
          (event.user || '').toLowerCase().includes(searchValue) ||
          JSON.stringify(event.details ?? {})
            .toLowerCase()
            .includes(searchValue)
        )
      })
    }

    const total = filteredEvents.length
    const startIndex = (page - 1) * pageSize

    const items = filteredEvents.slice(
      startIndex,
      startIndex + pageSize
    )

    return buildPaginatedResponse(items, page, pageSize, total)
  }
}

export const auditService = new AuditService()

export default AuditService;

