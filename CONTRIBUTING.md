# Contributing Guidelines

_Pull requests, bug reports, and all other forms of contribution are welcomed and highly encouraged!_

There are various ways in which you can contribute to this project such as `updating docs`, `reporting bugs`, `writing patches`, `fixing typos`.

When making any critical change to this repository, please first discuss the change you wish to make via issue, email, or any other method with the [owners](https://github.com/volcano-sh/dashboard/blob/main/OWNERS) of this repository before making a change.

🚀 For dashboard setup, see the [Getting Started](./README.md#getting-started) section in README.

### Prerequisites

Please follow the [guide](https://github.com/volcano-sh/volcano#quick-start-guide) to install volcano first.

### Install volcano dashboard

Login one node of your kubernetes cluster and execute the following command to install volcano dashboard.

```bash
kubectl create ns volcano-system

kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

Then use the following command to map the traffic to node.

```bash
kubectl port-forward svc/volcano-dashboard 8080:80 -n volcano-system --address 0.0.0.0
```

Access the dashboard by navigate to `http://$YOUR_NODE_IP:8080` in your browser.

If running locally navigate to `http://localhost:8080`

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

### Inside kubernetes cluster

You can build the volcano dashboard images locally. Please use the following command to build docker images of volcano dashboard.

Build images.

```bash
// build frontend image.
docker build -t frontend:dev . -f deployment/build/frontend/Dockerfile
// build backend image.
docker build -t backend:dev . -f deployment/build/backend/Dockerfile
```

After that you can replace the images in `volcano-dashboard.yaml` to verify the result.

```bash
kubectl apply -f deployment/volcano-dashboard.yaml
```

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
