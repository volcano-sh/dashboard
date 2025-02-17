import IJob from "./job";
import IQueue from "./queue";
import type { V1Pod, V1Namespace } from "@kubernetes/client-node";

interface IPod extends V1Pod {}
interface INamespace extends V1Namespace {}

export type { IJob, IQueue, IPod, INamespace };
