/**
 * Queue is a queue of PodGroup.
 */
export interface IQueue {
    /**
     * APIVersion defines the versioned schema of this representation of an object.
     * Servers should convert recognized schemas to the latest internal value, and
     * may reject unrecognized values.
     * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources
     */
    apiVersion?: string
    /**
     * Kind is a string value representing the REST resource this object represents.
     * Servers may infer this from the endpoint the client submits requests to.
     * Cannot be updated.
     * In CamelCase.
     * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     */
    kind?: string
    metadata?: {
        name: string
        [k: string]: unknown
    }
    /**
     * Specification of the desired behavior of the queue.
     * More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#spec-and-status
     */
    spec?: {
        /**
         * If specified, the pod owned by the queue will be scheduled with constraint
         */
        affinity?: {
            /**
             * Describes nodegroup affinity scheduling rules for the queue(e.g. putting pods of the queue in the nodes of the nodegroup)
             */
            nodeGroupAffinity?: {
                preferredDuringSchedulingIgnoredDuringExecution?: string[]
                requiredDuringSchedulingIgnoredDuringExecution?: string[]
                [k: string]: unknown
            }
            /**
             * Describes nodegroup anti-affinity scheduling rules for the queue(e.g. avoid putting pods of the queue in the nodes of the nodegroup).
             */
            nodeGroupAntiAffinity?: {
                preferredDuringSchedulingIgnoredDuringExecution?: string[]
                requiredDuringSchedulingIgnoredDuringExecution?: string[]
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        /**
         * ResourceList is a set of (resource name, quantity) pairs.
         */
        capability?: {
            [k: string]: number | string
        }
        /**
         * The amount of resources configured by the user. This part of resource can be shared with other queues and reclaimed back.
         */
        deserved?: {
            [k: string]: number | string
        }
        /**
         * extendCluster indicate the jobs in this Queue will be dispatched to these clusters.
         */
        extendClusters?: {
            /**
             * ResourceList is a set of (resource name, quantity) pairs.
             */
            capacity?: {
                [k: string]: number | string
            }
            name?: string
            weight?: number
            [k: string]: unknown
        }[]
        /**
         * Guarantee indicate configuration about resource reservation
         */
        guarantee?: {
            /**
             * The amount of cluster resource reserved for queue. Just set either `percentage` or `resource`
             */
            resource?: {
                [k: string]: number | string
            }
            [k: string]: unknown
        }
        /**
         * Parent define the parent of queue
         */
        parent?: string
        /**
         * Priority define the priority of queue. Higher values are prioritized for scheduling and considered later during reclamation.
         */
        priority?: number
        /**
         * Reclaimable indicate whether the queue can be reclaimed by other queue
         */
        reclaimable?: boolean
        /**
         * Type define the type of queue
         */
        type?: string
        weight?: number
        [k: string]: unknown
    }
    /**
     * The status of queue.
     */
    status?: {
        /**
         * Allocated is allocated resources in queue
         */
        allocated: {
            [k: string]: number | string
        }
        /**
         * The number of `Completed` PodGroup in this queue.
         */
        completed?: number
        /**
         * The number of `Inqueue` PodGroup in this queue.
         */
        inqueue?: number
        /**
         * The number of 'Pending' PodGroup in this queue.
         */
        pending?: number
        /**
         * Reservation is the profile of resource reservation for queue
         */
        reservation?: {
            /**
             * Nodes are Locked nodes for queue
             */
            nodes?: string[]
            /**
             * Resource is a list of total idle resource in locked nodes.
             */
            resource?: {
                [k: string]: number | string
            }
            [k: string]: unknown
        }
        /**
         * The number of 'Running' PodGroup in this queue.
         */
        running?: number
        /**
         * State is state of queue
         */
        state?: string
        /**
         * The number of 'Unknown' PodGroup in this queue.
         */
        unknown?: number
        [k: string]: unknown
    }
    [k: string]: unknown
}
