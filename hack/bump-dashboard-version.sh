#!/usr/bin/env bash

# Copyright 2026 The Volcano Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Bump Volcano Dashboard container image tags in static YAML (same idea as
# volcano-sh/volcano hack/bump-version.sh, scoped to dashboard manifests).
#
# Usage:
#   hack/bump-dashboard-version.sh <new-tag>
#   DRY_RUN=1 hack/bump-dashboard-version.sh <new-tag>   # print planned changes only
#
# Optional:
#   DASHBOARD_YAML_FILES="path/a.yaml path/b.yaml"  # space-separated; defaults to
#                                                    # deployment/volcano-dashboard.yaml
#
# Replaces the tag part of any image reference matching:
#   volcanosh/volcano-dashboard...:<tag>
# so names like volcanosh/volcano-dashboard-frontend:... are included.

set -o errexit
set -o nounset
set -o pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
declare -r REPO_ROOT
cd "${REPO_ROOT}"

DRY_RUN=${DRY_RUN:-}

if [[ "$#" -ne 1 ]]; then
  echo "usage: ${0} <new-tag>"
  echo ""
  echo "  Bumps volcanosh/volcano-dashboard* image tags in dashboard deployment YAML."
  echo "  Example:"
  echo "    ${0} v1.2.0"
  echo ""
  echo "  Optional: DRY_RUN=1 to show diffs without writing."
  echo "  Optional: DASHBOARD_YAML_FILES='f1.yaml f2.yaml' to override default file list."
  exit 1
fi

declare -r NEW_TAG="$1"

if [[ ! "${NEW_TAG}" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "error: tag must contain only [a-zA-Z0-9._-]"
  exit 1
fi

if [[ -n "${DASHBOARD_YAML_FILES:-}" ]]; then
  read -r -a FILES <<< "${DASHBOARD_YAML_FILES}"
else
  FILES=("deployment/volcano-dashboard.yaml")
fi

existing_files=()
for f in "${FILES[@]}"; do
  if [[ -f "${f}" ]]; then
    existing_files+=("${f}")
  fi
done

if [[ "${#existing_files[@]}" -eq 0 ]]; then
  echo "error: none of the configured YAML files exist:"
  for f in "${FILES[@]}"; do
    echo "  - ${f}"
  done
  echo ""
  echo "Add deployment/volcano-dashboard.yaml or set DASHBOARD_YAML_FILES."
  exit 1
fi

replace_tags_in_file() {
  local f="$1"
  # Match image name volcanosh/volcano-dashboard with optional suffix, then :tag
  sed -i.bak "s|\(volcanosh/volcano-dashboard[^[:space:]]*:\)[^[:space:]]*|\1${NEW_TAG}|g" "${f}"
  rm -f "${f}.bak"
}

if [[ -n "${DRY_RUN}" ]]; then
  echo "DRY_RUN: would set all volcanosh/volcano-dashboard* image tags to ${NEW_TAG} in:"
  printf '  %s\n' "${existing_files[@]}"
  for f in "${existing_files[@]}"; do
    echo ""
    echo "--- diff for ${f} ---"
    cp "${f}" "${f}.bump-tmp"
    replace_tags_in_file "${f}.bump-tmp"
    diff -u "${f}" "${f}.bump-tmp" || true
    rm -f "${f}.bump-tmp"
  done
  exit 0
fi

for f in "${existing_files[@]}"; do
  echo "+++ Bumping dashboard image tags to ${NEW_TAG} in ${f}"
  replace_tags_in_file "${f}"
done

echo "Done. Review with git diff and commit when ready."
