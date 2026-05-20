# Volcano dashboard

## Overview

The volcano dashboard provides a dashboard that can be deployed in your
Kubernetes cluster to inspect Volcano workloads and scheduling state. It shows
Volcano Jobs, CronJobs, PodGroups, Queues, and queue-owned Pods, including queue
hierarchy, scheduler resource allocation, read-only/read-write access modes,
and local or OIDC SSO authentication. The Pods view is scoped to Volcano
queue-owned Pods and derives namespace, queue, and PodGroup filters from visible
workloads, avoiding a broad namespace list in the UI.

<img src="docs/images/demo.gif" alt="volcano dashboard" style="zoom:50%;" />

## Design

You can follow the [design doc](docs/design.md) to learn more about the design details.

## Installation

### Prerequisites

Before installing the volcano dashboard, please ensure you have:

- A running Kubernetes cluster
- `kubectl` configured to access your cluster
- Helm 3 installed locally
- Volcano installed on your cluster (follow the [Volcano Quick Start Guide](https://github.com/volcano-sh/volcano#quick-start-guide))

### Install Volcano Dashboard

1. Create the volcano-system namespace (if it doesn't exist):

```bash
kubectl create ns volcano-system
```

2. Deploy the volcano dashboard:

```bash
helm upgrade --install volcano-dashboard ./helm/volcano-dashboard \
  --namespace volcano-system \
  --create-namespace
```

By default, the dashboard runs in local authentication mode with the built-in
development account `admin` / `admin`. For production deployments, create a
single backend config Secret with scheduler and auth sections, then pass it to
the chart:

An editable example is available at
[`config/dashboard.example.yaml`](config/dashboard.example.yaml). For local
development, run:

```bash
DASHBOARD_CONFIG_FILE=config/dashboard.example.yaml npm run dev
```

```yaml
schedulerConfig:
    namespace: volcano-system
    name: volcano-scheduler-configmap
    key: ""
access:
    mode: read-write
auth:
    enabled: true
    mode: local
    jwt:
        issuer: volcano-dashboard
        secret: change-this-secret
        expiresIn: 8h
        rememberExpiresIn: 30d
    localUsers:
        - username: admin
          displayName: Administrator
          passwordHash: "$2b$12$..."
          accessMode: read-write
```

`access.mode` controls authorization and `auth.enabled` controls whether users
must log in. The dashboard supports both read-only and read-write deployments:

- `read-only`: users can inspect resources, but create, update, delete, logs
  streaming, and terminal actions are disabled in the UI and blocked by the API.
- `read-write`: authenticated users with effective read-write access can create,
  update, and delete supported Volcano resources and use Pod logs/terminal
  actions.

To expose a read-only dashboard without login, combine `access.mode: read-only`
with `auth.enabled: false`. For authenticated dashboards, local users and SSO
group mappings without an explicit access mode default to read-only. The global
`access.mode` is always the ceiling, so `access.mode: read-only` prevents every
user from writing.

```yaml
access:
    mode: read-only
auth:
    enabled: false
```

```bash
kubectl create secret generic volcano-dashboard-config \
  --namespace volcano-system \
  --from-file=dashboard.yaml=./dashboard.yaml

helm upgrade --install volcano-dashboard ./helm/volcano-dashboard \
  --namespace volcano-system \
  --set config.existingSecret=volcano-dashboard-config
```

Use `mode: local-sso` and add an `sso` block with OIDC issuer/client settings
when you want both local login and SSO. The dashboard uses OIDC discovery from
the issuer URL and redirects back to `/sso/callback`.

```yaml
schedulerConfig:
    namespace: volcano-system
    name: volcano-scheduler-configmap
    key: ""
auth:
    enabled: true
    mode: local-sso
    jwt:
        issuer: volcano-dashboard
        secret: change-this-secret
        expiresIn: 8h
        rememberExpiresIn: 30d
    localUsers:
        - username: admin
          displayName: Administrator
          passwordHash: "$2b$12$..."
          accessMode: read-write
    sso:
        providerName: Keycloak
        issuer: https://keycloak.example.com/realms/volcano
        clientId: volcano-dashboard
        clientSecret: keycloak-client-secret
        redirectUri: http://localhost:3000/sso/callback
        logoutUrl: "https://keycloak.example.com/realms/volcano/protocol/openid-connect/logout?id_token_hint={{token}}&post_logout_redirect_uri={{logoutRedirectURL}}"
        scopes:
            - openid
            - profile
            - email
            - groups
        groupMappings:
            - match: volcano-admins
              accessMode: read-write
            - match: volcano-viewers
              accessMode: read-only
```

The unified backend config is loaded from `DASHBOARD_CONFIG_FILE`. The auth
section also accepts snake_case aliases commonly used by service config files,
such as `users`, `password_hash`, `issuer_url`, `client_id`, `client_secret`,
`redirect_uri`, `logout_url`, `jwks_cache_ttl`, `access_mode`, and
`group_mappings`. Optional `logoutUrl` supports `{{token}}` / `{{idToken}}` and
`{{logoutRedirectURL}}` placeholders for OIDC provider logout; the redirect
placeholder resolves to the dashboard login page. Tenant and admin mapping
fields are not supported; use `accessMode` / `access_mode` with `read-only` or
`read-write`. The file must still be YAML or JSON; TOML is not parsed by the
dashboard today.

3. Access the dashboard by port-forwarding the service:

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

4. Open your browser and navigate to:
    - For local access: `http://localhost:8080`
    - For remote access: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your Kubernetes node's IP address)

## Optional Sample Data

If you want a quick set of demo queues, podgroups, and pods for UI validation,
you can install the sample manifests under
[`examples/cluster-samples`](examples/cluster-samples/README.md):

```bash
kubectl apply -f examples/cluster-samples/
```

To remove them:

```bash
kubectl delete -f examples/cluster-samples/
```

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
