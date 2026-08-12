import AuditManagement from '@/components/(dashboard)/audit/audit-management'

export const metadata = {
  title: 'Activity Audit',
}

export default function AuditPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Activity Audit</h1>
      <AuditManagement />
    </main>
  )
}
