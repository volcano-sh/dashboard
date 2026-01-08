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
- Recommended IDE: [`Visual Studio Code`](https://code.visualstudio.com/download)

## Your First Contribution

We are always in need of help, be it fixing documentation, reporting bugs, or writing code. Look at places where you feel best coding practices aren't followed, code refactoring is needed, or tests are missing.

### Find Something to Work On

Check out the [issues](https://github.com/volcano-sh/dashboard/issues) in this repository. Issues labeled [good first issue](https://github.com/volcano-sh/dashboard/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) are great starting points for new contributors.

### Work on an Issue

When you are willing to take on an issue, you can assign it to yourself. Just reply with `/assign` or `/assign @yourself` on an issue, and the robot will assign the issue to you.

## Contributor Workflow

### Setting Up Development Environment

1. Fork this repository

2. Clone your forked repository:

```bash
git clone https://github.com/<your-user-name>/dashboard.git
```

**Note:** Replace `<your-user-name>` with your GitHub username.

3. Navigate to the cloned directory and create a new branch:

```bash
cd dashboard/
git checkout -b <your-branch-name>
```

4. Install [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) (Node Version Manager)

5. Use the project's Node.js version:

```bash
nvm use
```

6. Install dependencies:

```bash
npm ci
```

7. Start the development server:

```bash
npm run dev
```

### Building Docker Images for Testing

If you need to test your changes inside a Kubernetes cluster, you can build Docker images locally:

1. Build the frontend image:

```bash
docker build -t frontend:dev . -f deployment/build/frontend/Dockerfile
```

2. Build the backend image:

```bash
docker build -t backend:dev . -f deployment/build/backend/Dockerfile
```

3. Update the image references in `deployment/volcano-dashboard.yaml` (replace the official images with `frontend:dev` and `backend:dev`) and deploy:

```bash
kubectl apply -f deployment/volcano-dashboard.yaml
```

## Code Standards

### Code Style and Formatting

Run Prettier to format the code before committing changes:

```bash
npm run format
```

## Submitting Pull Requests

### Creating Pull Requests

When contributing changes, follow these steps:

1. **Ensure your commits are properly signed off**

All commits must include a sign-off to maintain accountability and ensure compliance with contribution policies.

Commit your changes with sign-off:

```bash
git commit -s -m "Your commit message here"
```

2. **Verify your commit includes the sign-off**

Check that your commit includes a sign-off line:

```bash
git log -1
```

You should see a line like:

```
Signed-off-by: Your Name <your.email@example.com>
```

If you forgot to sign off, amend the commit:

```bash
git commit --amend -s
```

3. **Push your changes**

```bash
git push origin <your-branch>
```

4. **Create a pull request**

Submit a pull request to the [volcano-sh/dashboard](https://github.com/volcano-sh/dashboard) repository. The PR should:
- Have a clear and descriptive title
- Include a detailed description of the changes
- Reference any related issues

### Code Review

To make it easier for your PR to receive reviews:
- Follow good coding practices and conventions
- Write clear commit messages
- Break large changes into smaller, logical commits
- Respond to review feedback promptly

Thank you for contributing to the Volcano Dashboard project!
