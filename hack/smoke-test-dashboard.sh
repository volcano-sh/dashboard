#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:?BASE_URL must be set (e.g. http://127.0.0.1:18080)}"

trpc_get() {
    local procedure="$1"
    local input_json="${2:-}"
    local url="${BASE_URL}/api/trpc/${procedure}"
    if [[ -n "${input_json}" ]]; then
        local encoded
        encoded="$(python3 -c 'import json,sys,urllib.parse; print(urllib.parse.quote(json.dumps({"json": json.loads(sys.argv[1])})))' "${input_json}")"
        url="${url}?input=${encoded}"
    fi
    curl -sf "${url}"
}

echo "Checking dashboardRouter.getSummary..."
summary_response="$(trpc_get "dashboardRouter.getSummary")"
if ! echo "${summary_response}" | grep -q '"totalJobs"'; then
    echo "dashboardRouter.getSummary did not return expected payload" >&2
    echo "${summary_response}" >&2
    exit 1
fi

echo "Checking queueRouter.getQueues..."
queues_response="$(trpc_get "queueRouter.getQueues" '{"page":1,"pageSize":10}')"
if ! echo "${queues_response}" | grep -q 'demo-'; then
    echo "queueRouter.getQueues did not return demo queues" >&2
    echo "${queues_response}" >&2
    exit 1
fi

echo "API smoke checks passed."
