import assert from "node:assert/strict";
import test from "node:test";
import { ApiException } from "@kubernetes/client-node";
import {
    formatAdmissionWebhookMessage,
    formatK8sApiError,
    formatVolcanoQueueConstraint,
    parseK8sStatusBody,
} from "./k8s-errors";

test("parseK8sStatusBody parses JSON string and object bodies", () => {
    assert.deepEqual(parseK8sStatusBody({ message: "test", code: 400 }), {
        message: "test",
        code: 400,
    });

    const parsedJson = parseK8sStatusBody(
        JSON.stringify({ message: "queue invalid", reason: "Invalid" })
    );
    assert.equal(parsedJson?.message, "queue invalid");
    assert.equal(parsedJson?.reason, "Invalid");
});

test("parseK8sStatusBody wraps plain-text error bodies into message object", () => {
    const rawWebhook =
        'admission webhook "validatequeue.volcano.sh" denied the request: deserved[cpu]=10 must be <= capability[cpu]=5';
    const parsed = parseK8sStatusBody(rawWebhook);
    assert.equal(parsed?.message, rawWebhook);
});

test("parseK8sStatusBody returns null for nullish or empty bodies", () => {
    assert.equal(parseK8sStatusBody(null), null);
    assert.equal(parseK8sStatusBody(undefined), null);
    assert.equal(parseK8sStatusBody("   "), null);
});

test("formatVolcanoQueueConstraint formats queue constraint messages", () => {
    const lteMsg = formatVolcanoQueueConstraint(
        "deserved[cpu]=10 must be <= capability[cpu]=5"
    );
    assert.equal(
        lteMsg,
        "Deserved cpu (10) must be less than or equal to capability cpu (5). Increase capability or lower deserved."
    );

    const gteMsg = formatVolcanoQueueConstraint(
        "deserved[memory]=500Mi must be >= guarantee[memory]=1Gi"
    );
    assert.equal(
        gteMsg,
        "Deserved memory must be greater than or equal to guarantee memory (1Gi)."
    );
});

test("formatAdmissionWebhookMessage extracts clean message from webhook rejection", () => {
    const rawWebhook =
        'admission webhook "validatequeue.volcano.sh" denied the request: deserved[cpu]=2000m must be <= capability[cpu]=1000m';
    assert.equal(
        formatAdmissionWebhookMessage(rawWebhook),
        "Deserved cpu (2000m) must be less than or equal to capability cpu (1000m). Increase capability or lower deserved."
    );

    const genericWebhook =
        'admission webhook "validatejob.volcano.sh" denied the request: minAvailable cannot exceed replicas';
    assert.equal(
        formatAdmissionWebhookMessage(genericWebhook),
        "minAvailable cannot exceed replicas"
    );
});

test("formatK8sApiError formats ApiException with plain-text admission webhook error", () => {
    const rawWebhook =
        'admission webhook "validatequeue.volcano.sh" denied the request: deserved[cpu]=10 must be <= capability[cpu]=5';
    const err = new ApiException(400, "Bad Request", rawWebhook, {});
    const formatted = formatK8sApiError(err);
    assert.equal(
        formatted,
        "Deserved cpu (10) must be less than or equal to capability cpu (5). Increase capability or lower deserved."
    );
});

test("formatK8sApiError formats 409 conflict and 404 not found cleanly", () => {
    const conflictErr = new ApiException(
        409,
        "Conflict",
        JSON.stringify({
            reason: "AlreadyExists",
            details: { name: "prod-queue", kind: "Queue" },
        }),
        {}
    );
    assert.equal(
        formatK8sApiError(conflictErr),
        'A queue named "prod-queue" already exists. Choose a different name or delete the existing one.'
    );

    const notFoundErr = new ApiException(
        404,
        "Not Found",
        JSON.stringify({
            details: { name: "my-job", kind: "Job" },
        }),
        {}
    );
    assert.equal(formatK8sApiError(notFoundErr), 'job "my-job" was not found.');
});

test("formatK8sApiError handles 401, 403, 500, 503 and generic errors cleanly without raw HTTP dumps", () => {
    const authErr = new ApiException(401, "Unauthorized", undefined, {});
    assert.equal(
        formatK8sApiError(authErr),
        "Unauthorized: Authentication failed with the Kubernetes cluster."
    );

    const forbiddenErr = new ApiException(403, "Forbidden", undefined, {});
    assert.equal(
        formatK8sApiError(forbiddenErr),
        "Forbidden: Insufficient permissions to perform this Kubernetes action."
    );

    const serverErr = new ApiException(500, "Internal Server Error", undefined, {});
    assert.equal(
        formatK8sApiError(serverErr),
        "Kubernetes API server encountered an internal server error."
    );

    const unavailableErr = new ApiException(503, "Service Unavailable", undefined, {});
    assert.equal(
        formatK8sApiError(unavailableErr),
        "Kubernetes API service is temporarily unavailable."
    );

    const genericErr = new Error("Connection timed out");
    assert.equal(formatK8sApiError(genericErr), "Connection timed out");

    assert.equal(formatK8sApiError("unknown"), "An unexpected error occurred");
});
