---
title: "Volcano Dashboard: Scheduler Management, Observability & Log Explorer UI"
description: "Add a /scheduler section (Config, Metrics, Logs) to the Volcano Dashboard; targets the `new-ui` migration branch."
project: "Volcano (CNCF)"
subproject: "Volcano Dashboard"
tracking_issue: "https://github.com/volcano-sh/dashboard/issues/197"
target_branch: "new-ui"
applicant: "Aaryaa Newaskar"
github: "https://github.com/aryunewaskar77-art"
email: "aryu.newaskar77@gmail.com"
linkedin: "https://www.linkedin.com/in/aaryaa-newaskar712/"
weekly_hours: "20-25"
mentors:
    - "JesseStutler"
    - "de6p"
date: 2026-05-18
status: draft
---

# Volcano Dashboard: Scheduler Management, Observability & Log Explorer UI

**LFX Mentorship 2026 Term 2 — CNCF Volcano**

Add a `/scheduler` section to the Dashboard with three tabs (Config, Metrics, Logs). This proposal targets the `new-ui` branch and follows an incremental PR-first delivery plan.


## 1. Preliminary Questions
1. How did you find out about our mentorship program?
Through the LFX Mentorship portal and the Volcano community. I follow the project because batch scheduling on Kubernetes is one of the open problems in my own day-to-day work with GPU pools, and Volcano is the only mature CNCF answer to it. The /scheduler dashboard issue specifically caught my attention because the gap it describes (config in raw ConfigMaps, metrics only in external Grafana, logs only via kubectl) matches exactly what I hit when I first stood up Volcano on a test cluster.
2. Why are you interested in this program?
Two reasons. First, this work is on the operator surface; it directly affects how every Volcano user debugs scheduling decisions. That kind of project is rare; most contributions touch one feature and ship. Second, I want sustained mentorship from the Volcano maintainers on scheduler internals (actions, tiers, and plugin lifecycle), so my contributions after the mentorship extend beyond UI work.. The 12-week structure gives both sides time for that to compound.
3. What experience and knowledge/skills do you have that are applicable to this program?
Production React + TypeScript, experience with @kubernetes/client-node (CoreV1 patches and pod log streaming), and experience building typed APIs with tRPC + Zod on Next.js App Router. I also have experience working with observability systems and metric-driven workflows. The gap I need to close is deeper familiarity with Volcano scheduler internals and scheduler-specific metric structures.
4. What do you hope to get out of this mentorship experience?
A merged /scheduler section that operators actually use, a deeper map of the Volcano scheduler internals than I could build from outside the project, and a path to becoming a regular Dashboard contributor afterward. Concretely: I want to land four reviewable PRs that ship vertical slices a maintainer can review in under an hour each, not one giant PR.


2. Abstract
The Volcano scheduler has rich knobs (6 actions, 24 plugins, 25 per-plugin behavior toggles) and rich Prometheus metrics, but the Dashboard exposes none of it. Operators edit volcano-scheduler-configmap with kubectl, watch latency in a separate Grafana, and tail logs over kubectl logs. This project adds a /scheduler section to the Dashboard with three tabs (Config, Metrics, Logs) backed by new tRPC procedures that reuse the existing k8sCoreApi and k8sApi singletons in packages/trpc/server/utils/k8s.ts, plus one Server-Sent Events Route Handler at /api/scheduler/logs/stream for live tailing (tRPC has no WebSocket transport configured in this repo, so a separate SSE handler is the cleanest split). Four reviewable PRs land in weeks 2, 5, 8, and 10, each shipping a complete vertical slice. I bring React + TypeScript + @kubernetes/client-node + Prometheus parsing experience and a 2-week plan to close my one gap: reading the scheduler's Go config types thoroughly enough to ship a correct typed-argument form. The deliverable is a Dashboard that lets an operator triage a stuck job end-to-end without leaving the page.
3. Background & Why This Work Matters
Volcano is the de-facto batch scheduler on Kubernetes for AI/ML and HPC workloads, but its Dashboard (volcano-sh/dashboard) today is read-only and resource-focused; it lists Jobs, Queues, Pods, PodGroups. There is no view of the scheduler itself.
The relevant subsystem on the dashboard side is the tRPC server in packages/trpc/server/router.ts, which currently merges five routers (jobsRouter, podRouter, podgroupsRouter, queueRouter, dashboardRouter). A schedulerRouter does not exist. The nav at apps/web/constants/index.ts:11-42 has no /scheduler entry. The ClusterRole at deployment/volcano-dashboard.yaml:68-143 grants no access to configmaps and no access to pods/log.
The relevant subsystem on the scheduler side is the configuration loaded from installer/helm/chart/volcano/config/volcano-scheduler.conf into the SchedulerConfiguration struct, which controls the entire scheduling pipeline. The Prometheus metrics at pkg/scheduler/metrics/metrics.go are exposed by the scheduler binary on :8080/metrics (cmd/scheduler/app/options/options.go:41) and surfaced through the volcano-scheduler-service Kubernetes Service (installer/helm/chart/volcano/templates/scheduler.yaml:283-304).
The specific gap: an operator who wants to enable binpack plugin's binpack.cpu: 5 weight today opens a kubectl session, edits raw YAML, hopes they did not break the tier structure, applies it, and watches kubectl logs -f deployment/volcano-scheduler from a second terminal: while watching the metrics in a third browser tab pointed at Grafana. Each of those three tools is a separate context switch. Issue #197 was filed to collapse them.
Why now: the Dashboard is mid-migration to Next.js + tRPC on PR #174. The router pattern is clean and the K8s client wiring is in place. Adding /scheduler now matches the established pattern for free. Waiting six months means re-doing the work after another migration.
Downstream impact: the same plumbing (SSE log streaming + ConfigMap patch + Prometheus parsing) is reusable for every other Volcano component (controller, admission, agent) and unblocks at least three follow-up Dashboard features: live event streaming, controller config editing, and per-node agent metrics.  
4. Current Architecture Analysis
How an operator works today

Three tools, three windows, no shared context. The Dashboard (apps/web/src/components/(dashboard)/layout/sidebar.tsx) is open in a fourth tab showing resource lists but contributing nothing to the debug loop.
Code-level pain points (verified through repository inspection)
No ConfigMap router: packages/trpc/server/router.ts has no entry for ConfigMaps; the only references to k8sCoreApi in router code are listPodForAllNamespaces and readNamespacedPod (packages/trpc/server/router/pods/pods.ts). The capability is not partially present: it is fully absent.
No log streaming primitive: readNamespacedPodLog is not called anywhere on either branch. Adding it from scratch is the only option.
No metrics-parsing utility: packages/trpc/server/router/dashboard/dashboard.ts computes its own counts by listing Jobs and Pods: it never speaks to Prometheus. A Prometheus text-format parser does not exist in the repository. This will require integrating prom-client's parser or implementing a lightweight custom parser.
RBAC gap: deployment/volcano-dashboard.yaml:68-143 grants configmaps: [] (none) and pods/log: [] (none). Anything that calls patchNamespacedConfigMap or readNamespacedPodLog in production will be 403.
No SSE pattern: packages/trpc/client/index.ts wires only httpLink and httpBatchLink via splitLink. No wsLink, no subscription support. tRPC subscriptions would require adding a WebSocket adapter and reworking the client: out of scope for this project. SSE on a sibling Route Handler is simpler.
Listing's component names do not match cluster reality: The issue lists volcano-controller-manager and volcano-webhook-manager. Real Helm labels are app: volcano-controller (installer/helm/chart/volcano/templates/controllers.yaml:131) and app: volcano-admission (installer/helm/chart/volcano/templates/admission.yaml:95). volcano-agent is a DaemonSet (installer/helm/chart/volcano/templates/agent.yaml) with label name: volcano-agent (not app:), and runs one pod per node.
5. Proposed Solution
High-level approach
Add one nav entry (/scheduler), one tRPC router (schedulerRouter) with five procedures, one Route Handler for SSE log streaming, one page with three tab components, and one RBAC patch. No new top-level packages, no architectural rework, no new tRPC links. Everything is composed from primitives already in the repo.


Key design
Decision 1: new-ui branch as the build target. PR #174 is the architecture the LFX listing describes. Building on main would require throwing the work away when #174 merges. Fallback if mentor prefers main: the equivalent files are backend/src/server.js (one ~1000-line Express file), frontend/src/App.jsx (5-line route list), frontend/src/components/Layout.jsx (menuItems array). The same five backend procedures become five Express routes, the same three tab components are written as .jsx with Material-UI instead of shadcn/ui. Effort is comparable; pattern of work is unchanged.
Decision 2: SSE for log streaming, not tRPC subscriptions or polling. The tRPC client at packages/trpc/client/index.ts has no wsLink. Adding one for one feature is disproportionate. Polling re-fetches the entire log tail every interval, which gets expensive past a few hundred lines. SSE is a one-direction stream native to HTTP, supported by EventSource in every browser without polyfills, and readNamespacedPodLog from @kubernetes/client-node returns a Readable that maps cleanly onto SSE events. The Next.js App Router has first-class support for streaming Responses (Next.js streaming docs). A single Route Handler at apps/web/src/app/api/scheduler/logs/stream/route.ts keeps the implementation isolated and aligned with existing application patterns.
Decision 3: Hand-curated typed-argument schema for the top 8 plugins, generic key/value editor for the rest. The scheduler does not publish a machine-readable schema for plugin arguments. pkg/scheduler/plugins/binpack/binpack.go:100-152 shows the flat-key convention (binpack.weight, binpack.cpu, etc.) and reads each key with args.GetInt / args.GetBool / args.GetString. I will ship a curated pluginArgSchemas.ts for the 8 most-used plugins (binpack, predicates, drf, gang, proportion, capacity, nodeorder, overcommit) and fall back to a generic JSON key/value editor for the remaining 16. The curated set covers the default configuration and prioritizes plugins most commonly adjusted by operators.
Decision 4: Metrics tab returns pre-aggregated DTOs, not raw Prometheus series. Picking up @mundele2004's question in the issue thread: returning raw series leaks the metric naming and label conventions into UI code, which then breaks every time the scheduler renames a metric. The tRPC getMetrics procedure returns shaped DTOs (SchedulingLatencyDTO, PreemptionStatsDTO, etc.) sourced from the raw /metrics parse. The DTO definitions live in packages/trpc/server/router/scheduler/dto.ts.
Decision 5: Optimistic-locking save with diff confirm. patchNamespacedConfigMap does not natively detect concurrent edits. The Save flow reads the ConfigMap's resourceVersion at load time, includes it in the patch, and surfaces a 409 Conflict to the user with a diff against the latest server state. This is the same pattern Kubernetes uses internally for optimistic concurrency.
Alternatives considered and rejected
Alternative
Why rejected
 
Long-polling instead of SSE
Adds latency floor (poll interval), wastes a request per poll, harder to display "live"
tRPC subscriptions over WebSocket
Requires wsLink + a WS adapter on the Next.js server; pulls in ws package and a custom server; out of scope for one feature
Frontend-direct fetch to scheduler /metrics
Would require CORS proxy on the scheduler service and exposing the metrics service externally; breaks the deployment model
Full plugin auto-discovery from scheduler binary
Scheduler does not expose a /plugins endpoint; building one is a separate proposal upstream
Replace the whole ConfigMap on Save
Loses any non-tracked keys; merge-patch is safer
Monaco editor as the only Config UI
Defeats the purpose ("structured editing experience" per the issue); raw YAML view ships as a tab inside Config, not as a replacement

Backward compatibility
Zero schema changes. ConfigMap shape is unchanged. The tRPC appRouter is a TypeScript union; adding schedulerRouter does not affect existing routers. The deployment of YAML's existing RBAC stays; PR 1 only adds rules. Operators on older Dashboard versions see no /scheduler link and lose nothing.
Security implications
ConfigMap patch is a privileged operation. The proposal does not change who can edit (the Dashboard's ServiceAccount edits on the operator's behalf). The Dashboard has no auth layer today, so adding write capability widens the blast radius.
Log access reveals workload metadata. pods/log for the volcano-system namespace is the bounded grant. The proposed ClusterRole rule scopes log access to that namespace via a Role + RoleBinding, not a ClusterRole grant, to keep the scope minimal.
Metrics endpoint is in-cluster. No external exposure. Fetched server-side, never proxied raw to the client.
YAML diff input is user-controlled. The Save flow re-validates the parsed YAML against a Zod schema (SchedulerConfigSchema) before issuing the patch: never accepts arbitrary YAML blobs straight to the API.
Supply chain. New deps: prom-client (or hand-rolled parser). prom-client is widely used (the Node Prometheus client lib), 0 known CVEs at the time of writing. No other new deps.
Observability hooks
Signal
Where
Why
 
Config save audit
K8s Event on the ConfigMap (reason: ConfigUpdated, source: volcano-dashboard)
Lets cluster admins trace "who changed what" via standard kubectl get events
Procedure latency
tRPC onSuccess / onError hooks logging to stdout with traceId
Captures slow getMetrics calls (Prometheus parse can spike)
SSE connection lifecycle
Server logs stream_open / stream_close with pod name and duration
Detect leaked streams
Frontend errors
Existing console + React error boundary
Reuse what's there; no new system

Edge cases and failure modes
Case
## Table of Contents

- [1. Preliminary Questions](#1-preliminary-questions)
- [2. Abstract](#2-abstract)
- [3. Background & Why This Work Matters](#3-background--why-this-work-matters)
- [4. Current Architecture Analysis](#4-current-architecture-analysis)
- [5. Proposed Solution](#5-proposed-solution)
- [6. Technical Implementation Plan](#6-technical-implementation-plan)
- [7. 12‑Week Timeline](#7-12-week-timeline)
- [8. Testing & Validation Strategy](#8-testing--validation-strategy)
- [9. Documentation Plan](#9-documentation-plan)
- [10. Risk Analysis](#10-risk-analysis)
- [11. Community Collaboration Plan](#11-community-collaboration-plan)
- [12. Why I'm a Strong Candidate](#12-why-im-a-strong-candidate)
- [13. Prior Contributions to This Project](#13-prior-contributions-to-this-project)
- [14. Long-Term Vision Post-Mentorship](#14-long-term-vision-post-mentorship)
- [15. References](#15-references)

---

## 1. Preliminary Questions
    saveConfig: procedure
        .input(saveConfigSchema)
        .mutation(saveConfig),
    // ─── Observability / Metrics ─────────────────────────────
    getMetrics: procedure
        .query(getMetrics),
    // ─── Component Discovery & Logs ──────────────────────────
    listComponentPods: procedure
        .input(listComponentPodsSchema)
        .query(listComponentPods),
    getRecentLogs: procedure
        .input(getRecentLogsSchema)
        .query(getRecentLogs),
});


Files to create:
packages/trpc/server/router/scheduler/scheduler.ts: procedures
packages/trpc/server/router/scheduler/schema.ts: Zod input schemas
packages/trpc/server/router/scheduler/dto.ts: output DTOs
packages/trpc/server/router/scheduler/parseConfig.ts: YAML → structured object
packages/trpc/server/router/scheduler/parseMetrics.ts: Prometheus text → DTO
packages/trpc/server/router/scheduler/pluginArgSchemas.ts: curated arg schemas
packages/trpc/server/router/scheduler/components.ts: Volcano component label catalog

Files to modify:
packages/trpc/server/router.ts: register schedulerRouter in appRouter

Interfaces (signatures only):
// schema.ts (Zod)
export const saveConfigSchema = z.object({
    config: SchedulerConfigSchema,
    resourceVersion: z.string(),
});

export const SchedulerConfigSchema = z.object({
    actions: z.string(), // comma-separated; validated against AVAILABLE_ACTIONS
    tiers: z.array(z.object({
        plugins: z.array(PluginOptionSchema),
    })),
    configurations: z.array(ActionConfigSchema).optional(),
    metrics: z.record(z.string()).optional(),
});

export const PluginOptionSchema = z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional(),
    // Additional enabled* fields mirror PluginOption in scheduler_conf.go
});

export const listComponentPodsSchema = z.object({
    component: z.enum(["scheduler", "controller", "admission", "agent"]),
});

export const getRecentLogsSchema = z.object({
    podName: z.string(),
    tailLines: z.number().min(1).max(10000).default(500),
    container: z.string().optional(),
});

// dto.ts (output shapes)
export interface SchedulingLatencyDTO {
    e2eMs: { p50: number; p95: number; p99: number };
    perPluginMs: Array<{ plugin: string; onSession: "open" | "close"; p95: number }>;
    perActionMs: Array<{ action: string; p95: number }>;
}

export interface PreemptionStatsDTO {
    totalAttempts: number;
    currentVictims: number;
    scheduleAttempts: Array<{ result: string; count: number }>;
}
export interface UnschedulableStatsDTO {
    jobCount: number;
    perTaskCounts: Array<{ jobId: string; count: number }>;
}

Integration points:
Reuses k8sCoreApi from packages/trpc/server/utils/k8s.ts: no new client.
Pattern mirrors queueRouter.updateQueue (packages/trpc/server/router/queues/queues.ts:90-152) for the patch operation.
DTO conversion lives entirely in scheduler/parseMetrics.ts so UI components never see raw Prometheus.
6.2 Prometheus parser
Choice: use prom-client v15+'s parseTextFormat is not exported in the published API. Two options:
Option A: depend on the npm package @plumbing/parse-prometheus-text-format (well-maintained, BSD-3, ~120 LOC). Add to packages/trpc/package.json.
Option B: hand-roll the parser (~120 lines of regex + reduce). Avoids one dep; harder to maintain.
Recommendation: Option A. Will discuss with mentors in week 1; both are acceptable.
6.3 SSE log streaming Route Handler
Path: apps/web/src/app/api/scheduler/logs/stream/route.ts
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const podName = searchParams.get("pod");
    const tailLines = Number(searchParams.get("tailLines") ?? 100);
    const container = searchParams.get("container") ?? undefined;

    const stream = new ReadableStream({
        async start(controller) {
            const k8sLog = new Log(kc); // from @kubernetes/client-node
            const passThrough = new PassThrough();
            passThrough.on("data", (chunk) => {
                for (const line of chunk.toString("utf8").split("\n")) {
                    if (line) controller.enqueue(`data: ${line}\n\n`);
                }
            });
            const stop = await k8sLog.log(
                "volcano-system", podName!, container,
                passThrough, { follow: true, tailLines, pretty: false },
            );
            req.signal.addEventListener("abort", () => { stop.abort(); controller.close(); });
        },
    });
    return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
}


Note: The implementation uses the Log helper from @kubernetes/client-node for streaming. Validation is planned against a local kind cluster running Volcano.
6.4 UI components
Path: apps/web/src/app/(dashboard)/scheduler/page.tsx plus tab components.
Files to create:
apps/web/src/app/(dashboard)/scheduler/page.tsx: tab container, URL-synced active tab
apps/web/src/components/(dashboard)/scheduler/config-tab.tsx: outer Config layout
apps/web/src/components/(dashboard)/scheduler/action-pipeline.tsx: draggable action list (uses @dnd-kit/sortable)
apps/web/src/components/(dashboard)/scheduler/plugin-tier.tsx: tier card with plugin rows
apps/web/src/components/(dashboard)/scheduler/plugin-args-form.tsx: typed args form per plugin
apps/web/src/components/(dashboard)/scheduler/yaml-diff.tsx: Monaco diff editor (already in deps via @monaco-editor/react if migrated; otherwise add)
apps/web/src/components/(dashboard)/scheduler/metrics-tab.tsx
apps/web/src/components/(dashboard)/scheduler/stat-cards.tsx: reuses existing Card from shadcn/ui
apps/web/src/components/(dashboard)/scheduler/latency-line-chart.tsx: recharts (already in apps/web/package.json:31)
apps/web/src/components/(dashboard)/scheduler/action-bar-chart.tsx: recharts
apps/web/src/components/(dashboard)/scheduler/logs-tab.tsx
apps/web/src/components/(dashboard)/scheduler/log-viewer.tsx: virtualized scrollback (react-window or just CSS) with keyword highlight
Files to modify:
apps/web/constants/index.ts: append { title: "Scheduler", icon: "settings", href: "/scheduler", disable: false }
apps/web/src/components/icons.ts: add settings icon (lucide-react Settings)

6.5 RBAC patch
Path: deployment/volcano-dashboard.yaml
Add to ClusterRole rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["volcano-scheduler-configmap"]
    verbs: ["get", "patch"]


Add a namespaced Role (not a ClusterRole) for log access scoped to volcano-system:
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: volcano-dashboard-logs
  namespace: volcano-system
rules:
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]


Plus a RoleBinding in volcano-system binding the volcano-dashboard ServiceAccount to that Role.
6.6 Dependencies introduced
Package
Why
Where added
 
parse-prometheus-text-format
parse /metrics text format
packages/trpc/package.json
@dnd-kit/sortable + @dnd-kit/core
draggable action pipeline
apps/web/package.json
@monaco-editor/react
YAML diff viewer (already in main branch, may need to add on new-ui)
apps/web/package.json


No upgrades to existing deps.
7. 12-Week Timeline
Phase overview week-by-week

Week
Phase
Activities
Deliverables
1
Phase 1: Bonding
Introduce myself in Volcano Slack and issue #197; kickoff call with mentor; publish design discussion; submit Chinese translation prerequisite PR and align with i18n approach
PR0 opened, design doc draft published, kickoff notes posted
2
Phase 1: Bonding → Transition
Open PR1 with RBAC patch, navigation entry, scheduler page scaffold, placeholder tabs, scheduler router registration; validate on local Kind + Volcano cluster
PR1 opened (small, mergeable, reviewable)
3
Phase 1 → Phase 2
Address PR1 review feedback; prototype SSE Route Handler; define listComponentPodsSchema and getRecentLogsSchema; build component-label catalog
PR1 merged, SSE proof-of-concept demo
4
Phase 2: Implementation
Build Logs tab UI with selectors, filtering, virtualized scrollback; implement getRecentLogs; connect EventSource with auto-reconnect
Logs tab feature-complete locally; unit tests for selectors and tail limits
5
Phase 2: Implementation
Open PR2 with Logs tab, tRPC procedures, SSE handler, tests, and documentation
PR2 opened, documentation section completed
6
Phase 2: Implementation
Add Prometheus parser; implement parseMetrics.ts; create DTO mapping and getMetrics procedure
Metrics parser and API working; parser fixture tests complete
7
Phase 2: Implementation
Build metrics UI: stat cards, latency charts, action charts, auto-refresh controls
Metrics tab feature-complete locally
8
Phase 2: Buffer / Review
Open PR3; absorb review feedback, metric edge cases, cluster surprises, or timing slippage; optionally benchmark parser performance
PR3 opened, benchmark results posted
9
Phase 2: Implementation
Implement Config read path; build action pipeline UI; create plugin schema catalog for core plugins
Config tab read path complete; pluginArgSchemas.ts committed
10
Phase 2 → Phase 3
Build plugin forms, YAML diff viewer, saveConfig with optimistic locking; open PR4
PR4 opened
11
Phase 3: Polish
Address review feedback; finish docs; add Playwright e2e tests; draft blog post; run accessibility audit
Documentation complete; e2e tests passing; blog draft shared
12
Phase 3: Finalization
Final review and merge; submit LFX report; publish closeout links; request community feedback
PR4 merged, final report submitted, blog published


Timeline rules followed (per the CLAUDE.md proposal template)
No week has more than 2 major deliverables.
Buffer is week 8 (mid-project), not week 12.
First mergeable PR (PR1) lands in week 2.
Documentation lives in every phase: design doc in week 1, user docs incrementally in weeks 5, 7, 10, blog in week 11.
8. Testing & Validation Strategy
This codebase has vitest configured in backend/package.json (main) and Playwright in frontend/package.json. On new-ui, the test infra is being re-established. I will adopt vitest for unit + integration and Playwright for e2e to match the existing investment.
Unit tests (vitest)
Target
Fixtures
Assertions
 
parseMetrics.ts
3 captured /metrics outputs (healthy, no workload, high preemption)
Each DTO field populated, no NaN, no undefined
parseConfig.ts
5 fixture ConfigMap YAMLs (default, custom-actions, tier-swap, plugin-args-heavy, malformed)
Round-trip equality, malformed rejects with typed error
pluginArgSchemas.ts
Per-plugin valid + invalid arg objects
Validates accepts, invalid rejects with field-specific message
components.ts
Component-to-label map
Each of 4 components resolves to correct selector


Integration tests (vitest + kind)
Spin up a kind cluster with Volcano installed in CI (GitHub Actions, see .github/workflows/ci.yml on new-ui). For each tRPC procedure:
getConfig: reads the real volcano-scheduler-configmap, returns the default config.
saveConfig: patches a plugin toggle, re-reads, asserts change applied.
getMetrics: submits one Job, polls until metrics show non-zero schedule attempts.
listComponentPods: asserts 1 scheduler pod, 1 controller pod, 1+ admission pod, N agent pods (1 per node).
getRecentLogs: asserts log lines returned.
E2E tests (Playwright)
One golden-path test per tab:
Logs: select component, select pod, observe streaming lines, type a keyword, see highlight.
Metrics: assert stat cards render numbers, charts render at least one data point after 30s.
Config: toggle binpack.enableJobOrder, click Save, see success toast, reload page, assert toggle persisted.
Regression tests
Existing dashboard tabs (Dashboard, Jobs, Queues, Pods, PodGroups) still render: quick smoke Playwright pass.
Existing tRPC procedures untouched: no test changes there.
Performance benchmarks
parseMetrics against a 1MB synthetic /metrics payload: target <50ms on a single core (representative of a busy cluster).
SSE handler: measure CPU and memory while streaming 1000 lines/sec from a synthetic pod, target <5% CPU on a single core.
CI integration
Modify .github/workflows/ci.yml to add a scheduler-integration job that runs the kind-based integration tests on PRs touching packages/trpc/server/router/scheduler/** or apps/web/src/app/(dashboard)/scheduler/**.
9. Documentation Plan
Audience
Output
Where
Phase
 
Contributors
Design doc covering Sections 5 + 6 of this proposal
GitHub Discussion in volcano-sh/dashboard
Week 1
Operators
docs/scheduler.md, one section per tab, with screenshots
Repo docs/
Weeks 5, 7, 11
Operators
Inline help (tooltip on every plugin toggle linking to the relevant pkg/scheduler/plugins/... source path)
Inside the Config tab UI
Week 9
Cluster admins
RBAC migration note, "If you upgrade dashboard to vX.Y, also apply the new ClusterRole"
docs/scheduler.md and PR1 description
Week 2
All users
Blog post "Managing the Volcano scheduler from the Dashboard" with two demo workflows
volcano.sh/blog
Week 11
Future contributors
Two example YAML configs (default + heavily-customized) committed to docs/examples/scheduler-configs/
Repo
Week 10


The blog post follows the existing format of volcano.sh/blog, problem narrative, solution walkthrough, screenshots, link to merged PRs.
10. Risk Analysis
#
Risk
Category
Likelihood
Impact
Mitigation
 
R1
new-ui branch (PR #174) does not merge during the mentorship; my work has to be rebased into a moving target
Technical / upstream
Medium
High
Section 5's main-branch fallback is concrete; weekly rebase against new-ui keeps the diff small; if #174 is abandoned I can adapt PR2/3/4 to main losing ~1 week
R2
Mentor prefers a different log streaming approach (polling, tRPC subscriptions, WebSocket)
Technical
Medium
Medium
Week 1 design doc proposes SSE with alternatives; switch costs ≤2 days because the parsing/format/UI layers are transport-agnostic
R3
Volcano renames or restructures metrics between v1.x and the version I test against
Ecosystem
Low
Medium
DTOs decouple UI from raw metric names; parser tests use real captured fixtures from multiple Volcano versions; bump compatibility table in docs/scheduler.md
R4
Scope creep, operators ask for "while you're at it, add controller config editing too"
Scope
High
Medium
Section 14 makes that an explicit follow-up; in-scope == issue #197's exact deliverables; new asks land as separate issues
R5
Curated plugin schemas drift from upstream when new plugin args are added
Maintenance / technical
Medium
Low
Schemas cite source-file line numbers in comments; CI job runs a grep-based sanity check; generic fallback editor handles missing schemas without crashing
R6
No known personal scheduling conflicts at this time. Buffer weeks are included to absorb unexpected events or timeline shifts
Personal
Medium
Low
Week 8 is the dedicated buffer; if conflict is elsewhere, will pre-load PRs by one week or trade a week's hours with another
R7
Scheduling overlap with mentors may limit synchronous discussion time
Personal
Low
Low
Async-first communication with weekly written updates and a mutually agreed recurring sync time.


11. Community Collaboration Plan
Weekly written report posted as a comment on issue #197: hours spent, PRs opened/closed/reviewed, blockers, next-week plan. Visible to all maintainers and other applicants in the community.
Weekly 30-minute video sync with @JesseStutler and @de6p at a fixed time. Agenda shared 24 hours ahead; notes posted to issue #197 after.
Async chat on #volcano CNCF Slack: questions go there first, mentors reply at their convenience. I will not @-mention unless it is blocking >24 hours of work.
Mailing list: subscribe to volcano-sh dev discussions; reply to anything scheduler-related.
PR etiquette: I open PRs as draft until CI is green; each PR description includes "Before/after screenshots," "How to test locally," and "Risks." I respond to each review comment with either a code change or a written rationale. I do not push back on style nits: I take them. I do push back on architectural changes that would invalidate this proposal, politely, with reasoning.
Disagreement protocol: if I disagree with a maintainer's review, I write my position in one comment, ask "do you want to discuss this synchronously?" and follow the maintainer's call.
Knowledge transfer: every merged PR is paired with an update to docs/scheduler.md so the next contributor does not need to re-derive my decisions.
12. Why I'm a Strong Candidate
Over the past year, I have contributed across multiple CNCF and open-source ecosystems including Jaeger, Hiero, and krkn-chaos. My contributions involved reading unfamiliar codebases, understanding project architecture, participating in issue discussions, and shipping production-facing changes. Working across different projects taught me how to quickly onboard into new systems, adapt to project conventions, and collaborate effectively through iterative review cycles. This experience directly aligns with the workflow expected in the Volcano community.
Skills-to-needs mapping
Project need
My experience
Gap to close
 
TypeScript + React + Next.js App Router
Experience building TypeScript and React applications and understanding component-driven UI architecture
None
tRPC + Zod
Familiar with typed API design and schema validation patterns
None
@kubernetes/client-node, CoreV1 patches, pod log streaming
Prior experience working with Kubernetes APIs and readNamespacedPodLog workflows
Have used readNamespacedPodLog before; have not used the Log helper specifically, 1-day learning
Prometheus text-format parsing
Familiar with observability workflows and metric-driven systems
None (or 2-day learning if no prior work, see below)
YAML round-tripping with js-yaml
Experience handling structured configuration and Kubernetes manifests
None
SSE / streaming APIs in Next.js
Understanding of client-server streaming patterns and EventSource architecture
None
Volcano scheduler internals (actions, tiers, plugin lifecycle)
None, I am new to the scheduler internals
See learning plan below, 2 weeks
K8s RBAC
Experience working with Kubernetes resources and permissions concepts
None


Honest gap: Volcano scheduler internals
I have not written a Volcano plugin. The Config tab needs me to understand what each of the 25 enabled* toggles in PluginOption actually does. My plan to close this gap before week 9 (when the Config tab work starts):
Weeks 1-2 (during community bonding): read pkg/scheduler/framework/ to understand the session/plugin lifecycle. Read the Volcano scheduler design doc. Read the plugin development guide.
Week 3: trace one full scheduling cycle by reading pkg/scheduler/scheduler.go top to bottom and the binpack plugin end to end (pkg/scheduler/plugins/binpack/binpack.go).
Week 6: before starting metrics, read pkg/scheduler/metrics/metrics.go and trace where each metric is emitted from in scheduler.go (line 145 e2e, line 151 action).
Week 9: before writing pluginArgSchemas.ts, read each of the 8 curated plugins' source files. Comment each arg in the schema with the pkg/scheduler/plugins/<name>/<name>.go:LINE citation. This is verifiable work: mentors can check whether the citation matches the code.


The scheduler internals are well documented. My approach is to read the implementation carefully, validate assumptions against source code, and build understanding incrementally before implementation begins.
What I bring beyond technical skills
Prior production experience with readNamespacedPodLog streaming. I have already encountered practical issues such as closed connections, pod restarts during active streams, and container initialization delays. The SSE design proposed in Section 6.3 reflects those lessons.
Comfort with Kubernetes RBAC scoping. The proposed split between a narrow ClusterRole and namespace-scoped permissions reflects an operator-first mindset rather than broad access patterns.
Incremental PR workflow. The proposal intentionally breaks implementation into multiple independently reviewable PRs. I prefer iterative delivery and early feedback rather than large end-of-project submissions.
13. Prior Contributions to This Project
I have not opened a PR or commented on an issue in volcano-sh/dashboard or volcano-sh/volcano prior to this proposal. The closest thing is the prerequisite Chinese-translation PR#254.
What I have done that is verifiable:
12–15 hours reading the codebase, including all files cited inline in Sections 4–6 of this proposal. Every file:line reference is one I have personally opened.
Read issue #197 end-to-end, including every comment from prior applicants. The architectural decisions in Section 5 (SSE vs polling, DTOs vs raw, optimistic locking) are direct responses to the questions raised there.
Read PR #174 in full, identified the divergence from main (see Section 4 and the [Repo Analysis Report]), and chose new-ui as the build target with explicit fallback.
While I am new to the Volcano ecosystem specifically, I invested significant effort in understanding the codebase before proposing implementation details.
Proof-of-concept work completed during proposal preparation:
To move beyond repository reading and validate my understanding of the proposed architecture, I built a focused Scheduler Dashboard proof-of-concept in my Volcano Dashboard fork targeting two of the three proposed tabs:
Implemented
Config Tab
Logs Tab
Config tab exploration:
Retrieved scheduler configuration from volcano-scheduler-configmap
Parsed scheduler YAML into structured UI state
Implemented YAML ↔ UI transformation flow
Added live YAML preview generation
Explored ConfigMap update workflows through Kubernetes APIs

Logs tab exploration:
Component selection for scheduler-related services
Kubernetes pod log retrieval
tailLines support
Keyword filtering
Live updates through polling-based refresh

The purpose of this work was not to fully implement issue #197, but to validate assumptions around Dashboard architecture, Kubernetes integration patterns, and implementation complexity before proposing a phased roadmap.
POC branch: https://github.com/volcano-sh/dashboard/pull/262
14. Long-Term Vision Post-Mentorship
This project leaves a foundation that can carry several follow-up features without redesign. Concrete things I commit to post-mentorship:
First 30 days post-merge: triage operator-reported issues against the new /scheduler section as the primary respondent.
Months 1-3 post-mentorship: extend the SSE log streaming primitive to a generic /api/logs/stream?namespace=&pod= Route Handler that any Dashboard tab can consume. Open as a separate proposal once merged.
Months 1-3 post-mentorship: add controller and admission config tabs reusing the pluginArgSchemas-style approach. These components do not have plugin systems but do have flags worth surfacing.
Ongoing: maintain pluginArgSchemas.ts as upstream plugins gain or change arguments. Subscribe to commits on pkg/scheduler/plugins/ via GitHub watch.
Stretch: propose the same dashboard pattern (typed Config + Metrics + Logs) for the volcano-agent on a per-node basis: the agent already exposes its own metrics endpoint at port 3300.
I will apply for Dashboard reviewer status after 6 months of sustained contribution, following OWNERS progression.
15. References
Key repository files reviewed
Dashboard:
packages/trpc/server/router.ts (new-ui structure; see PR #174)
packages/trpc/server/utils/k8s.ts (new-ui structure; see PR #174)
packages/trpc/server/router/pods/pods.ts (new-ui structure; see PR #174)
deployment/volcano-dashboard.yaml

Volcano core:
pkg/scheduler/conf/scheduler_conf.go
pkg/scheduler/metrics/metrics.go
pkg/scheduler/scheduler.go
pkg/scheduler/plugins/binpack/binpack.go

Helm templates:
installer/helm/chart/volcano/templates/scheduler.yaml
installer/helm/chart/volcano/templates/controllers.yaml
installer/helm/chart/volcano/templates/admission.yaml
installer/helm/chart/volcano/templates/agent.yaml

Issues & PRs
volcano-sh/dashboard#197: parent LFX issue
volcano-sh/dashboard#174: new-ui migration PR
Prerequisite translation PRs referenced in #197: #209, #233, #242, #245
Design docs & RFCs
Volcano scheduler design
Volcano plugin development guide
Dashboard design doc
External references
CNCF Volcano project page
Next.js Route Handlers: Streaming
@kubernetes/client-node: Log streaming
Prometheus text format spec
Kubernetes optimistic concurrency (resourceVersion)
shadcn/ui Tabs primitive
tRPC fetch adapter
