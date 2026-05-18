# Contributing Guidelines

_Pull requests, bug reports, and all other forms of contribution are welcomed and highly encouraged!_

There are various ways in which you can contribute to this project such as `updating docs`, `reporting bugs`, `writing patches`, `fixing typos`.

When making any critical change to this repository, please first discuss the change you wish to make via issue, email, or any other method with the [owners](https://github.com/volcano-sh/dashboard/blob/main/OWNERS) of this repository before making a change.

## Before You Get Started

### Prerequisites

To contribute to the volcano dashboard project, you need:

- [`node.js`](https://nodejs.org/en/download) installed on your system
- A running Kubernetes cluster with [Volcano](https://github.com/volcano-sh/volcano#quick-start-guide) installed
- Volcano dashboard deployed (see [Installation Guide](README.md#installation) in the main README)

## Your First Contribution

We are always in need of help, be it fixing documentation, reporting bugs, or writing code. Look at places where you feel best coding practices aren't followed, code refactoring is needed, or tests are missing.

### Find Something to Work On

Check out the [issues](https://github.com/volcano-sh/dashboard/issues) in this repository. Issues labeled [good first issue](https://github.com/volcano-sh/dashboard/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) are great starting points for new contributors.

### Work on an Issue

When you are willing to take on an issue, you can assign it to yourself. Just reply with `/assign` or `/assign @yourself` on an issue, and the robot will assign the issue to you.

### File an Issue

While we encourage everyone to contribute code, it is also appreciated when someone reports an issue.

Please follow the prompted submission guidelines while opening an issue.

## Contributor Workflow

### Development

1. First of all, `fork` this repo.
2. Next -> clone your branch.

```bash
git clone https://github.com/<your-user-name>/dashboard.git
```

`note`: replace `<your-user-name>` with your github username.

3. Move to cloned dir and if you want to make changes to our codebase then create new branch

```bash
cd dashboard/

git checkout -b <your-branch-name>
```

4. Install [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script)

5. Use similar version

```bash
nvm use
```

6. Install the dependencies

```bash
npm ci
```

7. Run the `dev` script

```bash
npm run dev
```

The dev server reads your local `~/.kube/config` automatically. No extra environment variables are needed.

### Running with Docker locally

Build the production image from the project root:

```bash
docker build -f deployment/Dockerfile -t dashboard-app .
```

Find the port your Kubernetes API server is listening on:

```bash
kubectl config view | grep server
# e.g. server: https://127.0.0.1:58960
```

Run the container, passing the port you found above and mounting your kube credentials:

```bash
docker run --rm \
  -p 8080:8080 \
  --name dashboard-app \
  -e K8S_SERVER=https://host.docker.internal:<PORT> \
  -e K8S_SKIP_TLS_VERIFY=true \
  -e KUBECONFIG=/home/nextjs/.kube/config \
  -v "$HOME/.kube:/home/nextjs/.kube:ro" \
  -v "$HOME/.minikube:/Users/$USER/.minikube:ro" \
  dashboard-app
```

Replace `<PORT>` with the port from the previous step (e.g. `58960`).

Open [http://localhost:8080](http://localhost:8080) in your browser.

#### Environment variables

| Variable | Required for Docker | Description |
|---|---|---|
| `K8S_SERVER` | Yes | Full URL of the Kubernetes API server reachable from inside the container. Use `host.docker.internal` instead of `127.0.0.1` on macOS/Windows. |
| `K8S_SKIP_TLS_VERIFY` | Recommended locally | Set to `true` to skip TLS certificate verification (useful with self-signed certs from minikube or kind). |
| `KUBECONFIG` | Yes | Path to the kubeconfig file inside the container. |

### Deploy to a local Kubernetes cluster (kind)

Use this workflow to run your locally built image instead of the default `volcanosh/volcano-dashboard:latest` from the manifest. The steps below use [kind](https://kind.sigs.k8s.io/); adjust the image-load command for your environment (e.g. `minikube image load dashboard-app:dev`).

**1. Build the dashboard image locally**

From the repository root:

```bash
docker build -f deployment/Dockerfile -t dashboard-app:dev .
```

**2. Load the image into your kind cluster**

```bash
kind load docker-image dashboard-app:dev --name kind
```

Replace `kind` with your cluster name if different (`kind get clusters`).

**3. Deploy dashboard resources**

```bash
kubectl create ns volcano-system --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f deployment/volcano-dashboard.yaml
```

**4. Point the deployment at your local image**

The manifest ships with `volcanosh/volcano-dashboard:latest`. Override it without editing YAML:

```bash
kubectl -n volcano-system set image deploy/volcano-dashboard \
  volcano-dashboard=dashboard-app:dev
kubectl -n volcano-system rollout status deploy/volcano-dashboard
```

Use any tag you built (e.g. `dashboard-app:dev`). The container name `volcano-dashboard` must match the deployment spec.

To switch back to the published image later:

```bash
kubectl -n volcano-system set image deploy/volcano-dashboard \
  volcano-dashboard=volcanosh/volcano-dashboard:latest
```

**5. Install Volcano (required for dashboard APIs)**

If Volcano is not already on the cluster:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml
```

**6. Verify Volcano APIs**

```bash
kubectl api-resources | grep -E "batch.volcano.sh|scheduling.volcano.sh"
kubectl get jobs.batch.volcano.sh -A
kubectl get queues.scheduling.volcano.sh
kubectl get podgroups.scheduling.volcano.sh -A
```

**7. Access the dashboard**

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80
```

Open [http://localhost:8080](http://localhost:8080).

When running inside a cluster the app uses the pod service account via in-cluster config — no `K8S_SERVER` or `K8S_SKIP_TLS_VERIFY` variables are needed.

#### Replacing the image on other clusters

| Environment | Load local image | Set deployment image |
|---|---|---|
| kind | `kind load docker-image dashboard-app:dev --name <cluster>` | `kubectl -n volcano-system set image deploy/volcano-dashboard volcano-dashboard=dashboard-app:dev` |
| minikube | `minikube image load dashboard-app:dev` | same `kubectl set image` as above |
| Remote / cloud | Push to a registry, then `kubectl set image ... volcano-dashboard=<registry>/dashboard-app:dev` | Ensure `imagePullPolicy` allows pulls (change in the manifest if needed) |

You can also edit `image:` in `deployment/volcano-dashboard.yaml` before `kubectl apply`, but `kubectl set image` is usually faster while iterating on a build.

## Code Style and Standards

- Run prettier to format the code before commiting changes:

```bash
npm run format
```

## Submitting Pull Requests

We are assuming that you have made the changes in the code by following above guidelines.

When contributing changes, you need to ensure that your commits are properly signed off. This helps maintain accountability and ensures compliance with contribution policies.

How to [signoff](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt--s) your commit(s)?

1. Commit Your Changes

```bash
git commit -s -m "Your commit message here"
```

2. Verify Your Commit

To check if your commit includes a sign-off, run:

```bash
git log -1
```

You should see a line like:

```bash
Signed-off-by: Your Name <your.email@example.com>
```

If you forgot to sign off, amend the commit with:

```bash
git commit --amend -s
```

3. Push Your Changes

```bash
git push origin <your-branch>
```

4. Create a pull request

Submit a pull request to the [volcano-sh/dashboard](https://github.com/volcano-sh/dashboard) repository. The PR should:
- Have a clear and descriptive title
- Include a detailed description of the changes
- Reference any related issues
