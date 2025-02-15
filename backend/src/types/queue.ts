export default interface IQueue {
    apiVersion?: string
    kind?: string
    metadata?: {
        name: string
        [k: string]: unknown
    }
    spec?: {
        affinity?: {
            nodeGroupAffinity?: {
                preferredDuringSchedulingIgnoredDuringExecution?: string[]
                requiredDuringSchedulingIgnoredDuringExecution?: string[]
                [k: string]: unknown
            }
            nodeGroupAntiAffinity?: {
                preferredDuringSchedulingIgnoredDuringExecution?: string[]
                requiredDuringSchedulingIgnoredDuringExecution?: string[]
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        capability?: {
            [k: string]: number | string
        }
        deserved?: {
            [k: string]: number | string
        }
        extendClusters?: {
            capacity?: {
                [k: string]: number | string
            }
            name?: string
            weight?: number
            [k: string]: unknown
        }[]
        guarantee?: {
            resource?: {
                [k: string]: number | string
            }
            [k: string]: unknown
        }
        parent?: string
        priority?: number
        reclaimable?: boolean
        type?: string
        weight?: number
        [k: string]: unknown
    }
    status?: {
        allocated: {
            [k: string]: number | string
        }
        completed?: number
        inqueue?: number
        pending?: number
        reservation?: {
            nodes?: string[]
            resource?: {
                [k: string]: number | string
            }
            [k: string]: unknown
        }
        running?: number
        state?: string
        unknown?: number
        [k: string]: unknown
    }
    [k: string]: unknown
}
