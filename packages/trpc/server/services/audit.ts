import { v4 as uuidv4 } from "uuid";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
export type AuditResourceType = "Job" | "Queue" | "Pod" | "PodGroup";

export interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceName: string;
  namespace?: string;
  previousState?: unknown;
  newState?: unknown;
}

export interface GetAuditEventsParams {
  namespace?: string;
  resourceType?: AuditResourceType | string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class AuditService {
  private static instance: AuditService;
  private events: AuditEvent[] = [];

  private constructor() {}

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public recordEvent(
    eventData: Omit<AuditEvent, "id" | "timestamp"> & { user?: string },
  ): AuditEvent {
    const newEvent: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      user: eventData.user || "anonymous",
      action: eventData.action,
      resourceType: eventData.resourceType,
      resourceName: eventData.resourceName,
      namespace: eventData.namespace,
      previousState: eventData.previousState,
      newState: eventData.newState,
    };

    this.events.unshift(newEvent);
    return newEvent;
  }

  public getEvents(params: GetAuditEventsParams = {}) {
    const {
      namespace,
      resourceType,
      search = "",
      page = 1,
      pageSize = 10,
    } = params;

    let filtered = [...this.events];

    if (namespace) {
      filtered = filtered.filter(
        (e) => e.namespace?.toLowerCase() === namespace.toLowerCase(),
      );
    }

    if (resourceType) {
      filtered = filtered.filter(
        (e) => e.resourceType.toLowerCase() === resourceType.toLowerCase(),
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.resourceName.toLowerCase().includes(searchLower) ||
          e.user.toLowerCase().includes(searchLower) ||
          (e.namespace && e.namespace.toLowerCase().includes(searchLower)),
      );
    }

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  public clearEvents(): void {
    this.events = [];
  }
}

export const auditService = AuditService.getInstance();
