
'use client';

import { useEffect, useState } from 'react';

import { trpc } from '@volcano/trpc/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ListPagination } from '../list-pagination';

type AuditEvent = {
  id: string;
  timestamp: string;
  resourceType: string;
  resourceName: string;
  action: string;
  user?: string;
  details?: Record<string, unknown>;
};

export default function ActivityHistory() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Keep the input value separate from the actual search query
  // so we can debounce the request.
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchText.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  const auditEventsQuery = trpc.auditRouter.getAuditEvents.useQuery(
    {
      page,
      pageSize,
      search: searchQuery,
    },
    {
      keepPreviousData: true,
    }
  );

  function sanitizeAuditItems(items: any): AuditEvent[] {
    if (!Array.isArray(items)) {
      // eslint-disable-next-line no-console
      console.error('AuditService returned malformed items, expected array:', items)
      return []
    }

    const valid = items.filter((it) => it && typeof it.id === 'string' && typeof it.timestamp === 'string')
    if (valid.length !== items.length) {
      // eslint-disable-next-line no-console
      console.warn('Some audit items were malformed and omitted from view')
    }
    return valid as AuditEvent[]
  }

  const auditEvents = sanitizeAuditItems(auditEventsQuery.data?.items ?? [])
  const totalEvents = auditEventsQuery.data?.total ?? 0;
  const totalPages = auditEventsQuery.data?.totalPages ?? 0;

  const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder="Search activity history..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <Button
          onClick={() => auditEventsQuery.refetch()}
          disabled={auditEventsQuery.isFetching}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left font-medium">Time</th>
              <th className="p-2 text-left font-medium">Resource</th>
              <th className="p-2 text-left font-medium">Name</th>
              <th className="p-2 text-left font-medium">Action</th>
              <th className="p-2 text-left font-medium">User</th>
              <th className="p-2 text-left font-medium">Details</th>
            </tr>
          </thead>

          <tbody>
            {auditEvents.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="p-2 align-top">
                  {formatTimestamp(event.timestamp)}
                </td>

                <td className="p-2 align-top">
                  {event.resourceType}
                </td>

                <td className="p-2 align-top">
                  {event.resourceName}
                </td>

                <td className="p-2 align-top">
                  {event.action}
                </td>

                <td className="p-2 align-top">
                  {event.user ?? '-'}
                </td>

                <td className="p-2 align-top">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(event.details ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}

            {auditEvents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-sm text-gray-500"
                >
                  No activity found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <ListPagination
          page={page}
          pageSize={pageSize}
          total={totalEvents}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(Number(value));
            setPage(1);
          }}
          disabled={auditEventsQuery.isFetching}
        />
      </div>
    </div>
  );
}

