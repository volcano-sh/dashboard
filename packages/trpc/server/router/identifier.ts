import { z } from "zod";

/** Required Kubernetes resource name or namespace: rejects empty and whitespace-only values. */
export const k8sIdentifierSchema = z.string().trim().min(1);
