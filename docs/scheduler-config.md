# Scheduler Configuration

The **Scheduler** page (`/scheduler`) lets you view and edit the Volcano scheduler policy stored in the `volcano-scheduler-configmap` ConfigMap — without using `kubectl`.

## What you can configure

- **Action pipeline** — drag to reorder the scheduling actions executed each cycle (`enqueue`, `allocate`, `backfill`, etc.)
- **Plugin tiers** — add/remove tiers and plugins; toggle per-plugin `enable*` flags
- **Plugin arguments** — edit typed fields for common plugins (e.g. `binpack.weight`, `predicate.GPUSharingEnable`)
- **Action configurations** — optional per-action argument blocks
- **YAML diff preview** — see changes before saving

## Requirements

- Volcano installed with `volcano-scheduler-configmap` in `volcano-system`
- Dashboard RBAC must allow ConfigMap `get`, `update`, and `patch` on `volcano-scheduler-configmap` (included in `deployment/volcano-dashboard.yaml`)

After upgrading the dashboard manifest, re-apply RBAC if you deployed before this feature:

```bash
kubectl apply -f deployment/volcano-dashboard.yaml
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE` | `volcano-system` | Namespace of the scheduler ConfigMap |
| `VOLCANO_SCHEDULER_CONFIGMAP_NAME` | `volcano-scheduler-configmap` | ConfigMap name |
| `VOLCANO_SCHEDULER_CONFIG_KEY` | `volcano-scheduler.conf` | Data key containing scheduler YAML |

## Save behavior

1. The UI validates action and plugin names against Volcano’s registered set.
2. On **Save**, the dashboard patches only the `volcano-scheduler.conf` key via strategic merge.
3. The Volcano scheduler watches the mounted config file and **hot-reloads** policy without restarting the pod.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 403 Forbidden on load/save | Re-apply `deployment/volcano-dashboard.yaml` for ConfigMap RBAC |
| ConfigMap was modified by another user | Click **Refresh**, then re-apply your edits |
| Unknown action errors on save | Use only action names registered in your Volcano version |
| Unknown plugin warnings | Custom plugins are allowed; confirm the name is intentional |

## Local development

Port-forward the dashboard and ensure your kubeconfig can read/patch the scheduler ConfigMap:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80
```

If the scheduler ConfigMap is in a different namespace, set `VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE`.
