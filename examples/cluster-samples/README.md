# Cluster Sample Resources

These manifests install a small set of Volcano demo resources that the
dashboard can read from the cluster through the real Kubernetes API.

## What is included

- `00-namespaces.yaml`: demo namespaces used by the sample workloads
- `10-queues.yaml`: a hierarchical queue tree for the Queues page
- `20-podgroups.yaml`: PodGroup resources that line up with the sample pods
- `30-pods.yaml`: pods that tend to surface `Running`, `Pending`, `Failed`, and
  `Succeeded` states across the Pods page
- `40-jobs.yaml`: long-running Volcano jobs across multiple demo queues
- `50-cronjobs.yaml`: Volcano CronJobs that create scheduled Volcano jobs
  across demo queues

## Prerequisites

- A Kubernetes cluster is available
- Volcano is installed in the cluster
- The Volcano dashboard is installed and can reach the cluster API

## Install

```bash
kubectl apply -f examples/cluster-samples/
```

The manifests are numbered so `kubectl apply -f` creates namespaces first,
then queues, then podgroups, then pods.

## Remove

```bash
kubectl delete -f examples/cluster-samples/
```

## Recommended verification

- `/queues`: verify the demo queue hierarchy is visible
- `/jobs`: verify long-running jobs are listed across different queues
- `/scheduling/cronjobs`: verify Volcano CronJobs are listed across different
  queues
- `/podgroups`: verify demo PodGroups are listed
- `/pods`: verify demo pods show multiple states and namespaces

## Notes

- Queue names are prefixed with `demo-` because queues are cluster-scoped.
- The queue sample uses `guarantee.resource` because that matches the current
  Volcano `Queue` CRD schema.
- Pod and PodGroup status is controller-driven. `Running`, `Pending`,
  `Failed`, and `Succeeded` pod states should be easy to observe, while exact
  PodGroup phases can vary by cluster capacity and scheduler behavior.
- The pending sample pods use an impossible node selector on purpose so they
  stay pending for UI validation.
