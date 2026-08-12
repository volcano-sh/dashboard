import ActivityHistory from "@/components/(dashboard)/activity/activity-history";

export const metadata = {
  title: "Activity History",
};

export default function ActivityPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Activity History</h1>
      <ActivityHistory />
    </main>
  );
}
