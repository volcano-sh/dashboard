export default interface IJob {
    apiVersion?: string;
    kind?: string;
    metadata?: {
        name: string;
        [k: string]: unknown;
    };
    spec?: {
        maxRetry?: number;
        minAvailable?: number;
        minSuccess?: number;
        plugins?: {
            [k: string]: string[];
        };
        policies?: {
            action?: string;
            event?:
                | "*"
                | "PodPending"
                | "PodRunning"
                | "PodFailed"
                | "PodEvicted"
                | "Unknown"
                | "TaskCompleted"
                | "OutOfSync"
                | "CommandIssued"
                | "JobUpdated"
                | "TaskFailed";
            events?: (
                | "*"
                | "PodPending"
                | "PodRunning"
                | "PodFailed"
                | "PodEvicted"
                | "Unknown"
                | "TaskCompleted"
                | "OutOfSync"
                | "CommandIssued"
                | "JobUpdated"
                | "TaskFailed"
            )[];
            exitCode?: number;
            timeout?: string;
            [k: string]: unknown;
        }[];
        priorityClassName?: string;
        queue?: string;
        runningEstimate?: string;
        schedulerName?: string;
        tasks?: {
            dependsOn?: {
                iteration?: string;
                name?: string[];
                [k: string]: unknown;
            };
            maxRetry?: number;
            minAvailable?: number;
            name?: string;
            policies?: {
                action?: string;
                event?:
                    | "*"
                    | "PodPending"
                    | "PodRunning"
                    | "PodFailed"
                    | "PodEvicted"
                    | "Unknown"
                    | "TaskCompleted"
                    | "OutOfSync"
                    | "CommandIssued"
                    | "JobUpdated"
                    | "TaskFailed";
                events?: (
                    | "*"
                    | "PodPending"
                    | "PodRunning"
                    | "PodFailed"
                    | "PodEvicted"
                    | "Unknown"
                    | "TaskCompleted"
                    | "OutOfSync"
                    | "CommandIssued"
                    | "JobUpdated"
                    | "TaskFailed"
                )[];
                exitCode?: number;
                timeout?: string;
                [k: string]: unknown;
            }[];
            replicas?: number;
            template?: {
                metadata?: {
                    annotations?: {
                        [k: string]: string;
                    };
                    finalizers?: string[];
                    labels?: {
                        [k: string]: string;
                    };
                    name?: string;
                    namespace?: string;
                    [k: string]: unknown;
                };
                spec?: {
                    activeDeadlineSeconds?: number;
                    affinity?: {
                        nodeAffinity?: {
                            preferredDuringSchedulingIgnoredDuringExecution?: {
                                preference: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchFields?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    [k: string]: unknown;
                                };
                                weight: number;
                                [k: string]: unknown;
                            }[];
                            requiredDuringSchedulingIgnoredDuringExecution?: {
                                nodeSelectorTerms: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchFields?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    [k: string]: unknown;
                                }[];
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        podAffinity?: {
                            preferredDuringSchedulingIgnoredDuringExecution?: {
                                podAffinityTerm: {
                                    labelSelector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    matchLabelKeys?: string[];
                                    mismatchLabelKeys?: string[];
                                    namespaceSelector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    namespaces?: string[];
                                    topologyKey: string;
                                    [k: string]: unknown;
                                };
                                weight: number;
                                [k: string]: unknown;
                            }[];
                            requiredDuringSchedulingIgnoredDuringExecution?: {
                                labelSelector?: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchLabels?: {
                                        [k: string]: string;
                                    };
                                    [k: string]: unknown;
                                };
                                matchLabelKeys?: string[];
                                mismatchLabelKeys?: string[];
                                namespaceSelector?: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchLabels?: {
                                        [k: string]: string;
                                    };
                                    [k: string]: unknown;
                                };
                                namespaces?: string[];
                                topologyKey: string;
                                [k: string]: unknown;
                            }[];
                            [k: string]: unknown;
                        };
                        podAntiAffinity?: {
                            preferredDuringSchedulingIgnoredDuringExecution?: {
                                podAffinityTerm: {
                                    labelSelector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    matchLabelKeys?: string[];
                                    mismatchLabelKeys?: string[];
                                    namespaceSelector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    namespaces?: string[];
                                    topologyKey: string;
                                    [k: string]: unknown;
                                };
                                weight: number;
                                [k: string]: unknown;
                            }[];
                            requiredDuringSchedulingIgnoredDuringExecution?: {
                                labelSelector?: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchLabels?: {
                                        [k: string]: string;
                                    };
                                    [k: string]: unknown;
                                };
                                matchLabelKeys?: string[];
                                mismatchLabelKeys?: string[];
                                namespaceSelector?: {
                                    matchExpressions?: {
                                        key: string;
                                        operator: string;
                                        values?: string[];
                                        [k: string]: unknown;
                                    }[];
                                    matchLabels?: {
                                        [k: string]: string;
                                    };
                                    [k: string]: unknown;
                                };
                                namespaces?: string[];
                                topologyKey: string;
                                [k: string]: unknown;
                            }[];
                            [k: string]: unknown;
                        };
                        [k: string]: unknown;
                    };
                    automountServiceAccountToken?: boolean;
                    containers: {
                        args?: string[];
                        command?: string[];
                        env?: {
                            name: string;
                            value?: string;
                            valueFrom?: {
                                configMapKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                fieldRef?: {
                                    apiVersion?: string;
                                    fieldPath: string;
                                    [k: string]: unknown;
                                };
                                resourceFieldRef?: {
                                    containerName?: string;
                                    divisor?: number | string;
                                    resource: string;
                                    [k: string]: unknown;
                                };
                                secretKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        envFrom?: {
                            configMapRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            prefix?: string;
                            secretRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        image?: string;
                        imagePullPolicy?: string;
                        lifecycle?: {
                            postStart?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            preStop?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        livenessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        name: string;
                        ports?: {
                            containerPort: number;
                            hostIP?: string;
                            hostPort?: number;
                            name?: string;
                            protocol?: string;
                            [k: string]: unknown;
                        }[];
                        readinessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        resizePolicy?: {
                            resourceName: string;
                            restartPolicy: string;
                            [k: string]: unknown;
                        }[];
                        resources?: {
                            claims?: {
                                name: string;
                                request?: string;
                                [k: string]: unknown;
                            }[];
                            limits?: {
                                [k: string]: number | string;
                            };
                            requests?: {
                                [k: string]: number | string;
                            };
                            [k: string]: unknown;
                        };
                        restartPolicy?: string;
                        securityContext?: {
                            allowPrivilegeEscalation?: boolean;
                            appArmorProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            capabilities?: {
                                add?: string[];
                                drop?: string[];
                                [k: string]: unknown;
                            };
                            privileged?: boolean;
                            procMount?: string;
                            readOnlyRootFilesystem?: boolean;
                            runAsGroup?: number;
                            runAsNonRoot?: boolean;
                            runAsUser?: number;
                            seLinuxOptions?: {
                                level?: string;
                                role?: string;
                                type?: string;
                                user?: string;
                                [k: string]: unknown;
                            };
                            seccompProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            windowsOptions?: {
                                gmsaCredentialSpec?: string;
                                gmsaCredentialSpecName?: string;
                                hostProcess?: boolean;
                                runAsUserName?: string;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        startupProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        stdin?: boolean;
                        stdinOnce?: boolean;
                        terminationMessagePath?: string;
                        terminationMessagePolicy?: string;
                        tty?: boolean;
                        volumeDevices?: {
                            devicePath: string;
                            name: string;
                            [k: string]: unknown;
                        }[];
                        volumeMounts?: {
                            mountPath: string;
                            mountPropagation?: string;
                            name: string;
                            readOnly?: boolean;
                            recursiveReadOnly?: string;
                            subPath?: string;
                            subPathExpr?: string;
                            [k: string]: unknown;
                        }[];
                        workingDir?: string;
                        [k: string]: unknown;
                    }[];
                    dnsConfig?: {
                        nameservers?: string[];
                        options?: {
                            name?: string;
                            value?: string;
                            [k: string]: unknown;
                        }[];
                        searches?: string[];
                        [k: string]: unknown;
                    };
                    dnsPolicy?: string;
                    enableServiceLinks?: boolean;
                    ephemeralContainers?: {
                        args?: string[];
                        command?: string[];
                        env?: {
                            name: string;
                            value?: string;
                            valueFrom?: {
                                configMapKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                fieldRef?: {
                                    apiVersion?: string;
                                    fieldPath: string;
                                    [k: string]: unknown;
                                };
                                resourceFieldRef?: {
                                    containerName?: string;
                                    divisor?: number | string;
                                    resource: string;
                                    [k: string]: unknown;
                                };
                                secretKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        envFrom?: {
                            configMapRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            prefix?: string;
                            secretRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        image?: string;
                        imagePullPolicy?: string;
                        lifecycle?: {
                            postStart?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            preStop?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        livenessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        name: string;
                        ports?: {
                            containerPort: number;
                            hostIP?: string;
                            hostPort?: number;
                            name?: string;
                            protocol?: string;
                            [k: string]: unknown;
                        }[];
                        readinessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        resizePolicy?: {
                            resourceName: string;
                            restartPolicy: string;
                            [k: string]: unknown;
                        }[];
                        resources?: {
                            claims?: {
                                name: string;
                                request?: string;
                                [k: string]: unknown;
                            }[];
                            limits?: {
                                [k: string]: number | string;
                            };
                            requests?: {
                                [k: string]: number | string;
                            };
                            [k: string]: unknown;
                        };
                        restartPolicy?: string;
                        securityContext?: {
                            allowPrivilegeEscalation?: boolean;
                            appArmorProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            capabilities?: {
                                add?: string[];
                                drop?: string[];
                                [k: string]: unknown;
                            };
                            privileged?: boolean;
                            procMount?: string;
                            readOnlyRootFilesystem?: boolean;
                            runAsGroup?: number;
                            runAsNonRoot?: boolean;
                            runAsUser?: number;
                            seLinuxOptions?: {
                                level?: string;
                                role?: string;
                                type?: string;
                                user?: string;
                                [k: string]: unknown;
                            };
                            seccompProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            windowsOptions?: {
                                gmsaCredentialSpec?: string;
                                gmsaCredentialSpecName?: string;
                                hostProcess?: boolean;
                                runAsUserName?: string;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        startupProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        stdin?: boolean;
                        stdinOnce?: boolean;
                        targetContainerName?: string;
                        terminationMessagePath?: string;
                        terminationMessagePolicy?: string;
                        tty?: boolean;
                        volumeDevices?: {
                            devicePath: string;
                            name: string;
                            [k: string]: unknown;
                        }[];
                        volumeMounts?: {
                            mountPath: string;
                            mountPropagation?: string;
                            name: string;
                            readOnly?: boolean;
                            recursiveReadOnly?: string;
                            subPath?: string;
                            subPathExpr?: string;
                            [k: string]: unknown;
                        }[];
                        workingDir?: string;
                        [k: string]: unknown;
                    }[];
                    hostAliases?: {
                        hostnames?: string[];
                        ip: string;
                        [k: string]: unknown;
                    }[];
                    hostIPC?: boolean;
                    hostNetwork?: boolean;
                    hostPID?: boolean;
                    hostUsers?: boolean;
                    hostname?: string;
                    imagePullSecrets?: {
                        name?: string;
                        [k: string]: unknown;
                    }[];
                    initContainers?: {
                        args?: string[];
                        command?: string[];
                        env?: {
                            name: string;
                            value?: string;
                            valueFrom?: {
                                configMapKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                fieldRef?: {
                                    apiVersion?: string;
                                    fieldPath: string;
                                    [k: string]: unknown;
                                };
                                resourceFieldRef?: {
                                    containerName?: string;
                                    divisor?: number | string;
                                    resource: string;
                                    [k: string]: unknown;
                                };
                                secretKeyRef?: {
                                    key: string;
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        envFrom?: {
                            configMapRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            prefix?: string;
                            secretRef?: {
                                name?: string;
                                optional?: boolean;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        }[];
                        image?: string;
                        imagePullPolicy?: string;
                        lifecycle?: {
                            postStart?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            preStop?: {
                                exec?: {
                                    command?: string[];
                                    [k: string]: unknown;
                                };
                                httpGet?: {
                                    host?: string;
                                    httpHeaders?: {
                                        name: string;
                                        value: string;
                                        [k: string]: unknown;
                                    }[];
                                    path?: string;
                                    port: number | string;
                                    scheme?: string;
                                    [k: string]: unknown;
                                };
                                sleep?: {
                                    seconds: number;
                                    [k: string]: unknown;
                                };
                                tcpSocket?: {
                                    host?: string;
                                    port: number | string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        livenessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        name: string;
                        ports?: {
                            containerPort: number;
                            hostIP?: string;
                            hostPort?: number;
                            name?: string;
                            protocol?: string;
                            [k: string]: unknown;
                        }[];
                        readinessProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        resizePolicy?: {
                            resourceName: string;
                            restartPolicy: string;
                            [k: string]: unknown;
                        }[];
                        resources?: {
                            claims?: {
                                name: string;
                                request?: string;
                                [k: string]: unknown;
                            }[];
                            limits?: {
                                [k: string]: number | string;
                            };
                            requests?: {
                                [k: string]: number | string;
                            };
                            [k: string]: unknown;
                        };
                        restartPolicy?: string;
                        securityContext?: {
                            allowPrivilegeEscalation?: boolean;
                            appArmorProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            capabilities?: {
                                add?: string[];
                                drop?: string[];
                                [k: string]: unknown;
                            };
                            privileged?: boolean;
                            procMount?: string;
                            readOnlyRootFilesystem?: boolean;
                            runAsGroup?: number;
                            runAsNonRoot?: boolean;
                            runAsUser?: number;
                            seLinuxOptions?: {
                                level?: string;
                                role?: string;
                                type?: string;
                                user?: string;
                                [k: string]: unknown;
                            };
                            seccompProfile?: {
                                localhostProfile?: string;
                                type: string;
                                [k: string]: unknown;
                            };
                            windowsOptions?: {
                                gmsaCredentialSpec?: string;
                                gmsaCredentialSpecName?: string;
                                hostProcess?: boolean;
                                runAsUserName?: string;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        startupProbe?: {
                            exec?: {
                                command?: string[];
                                [k: string]: unknown;
                            };
                            failureThreshold?: number;
                            grpc?: {
                                port: number;
                                service?: string;
                                [k: string]: unknown;
                            };
                            httpGet?: {
                                host?: string;
                                httpHeaders?: {
                                    name: string;
                                    value: string;
                                    [k: string]: unknown;
                                }[];
                                path?: string;
                                port: number | string;
                                scheme?: string;
                                [k: string]: unknown;
                            };
                            initialDelaySeconds?: number;
                            periodSeconds?: number;
                            successThreshold?: number;
                            tcpSocket?: {
                                host?: string;
                                port: number | string;
                                [k: string]: unknown;
                            };
                            terminationGracePeriodSeconds?: number;
                            timeoutSeconds?: number;
                            [k: string]: unknown;
                        };
                        stdin?: boolean;
                        stdinOnce?: boolean;
                        terminationMessagePath?: string;
                        terminationMessagePolicy?: string;
                        tty?: boolean;
                        volumeDevices?: {
                            devicePath: string;
                            name: string;
                            [k: string]: unknown;
                        }[];
                        volumeMounts?: {
                            mountPath: string;
                            mountPropagation?: string;
                            name: string;
                            readOnly?: boolean;
                            recursiveReadOnly?: string;
                            subPath?: string;
                            subPathExpr?: string;
                            [k: string]: unknown;
                        }[];
                        workingDir?: string;
                        [k: string]: unknown;
                    }[];
                    nodeName?: string;
                    nodeSelector?: {
                        [k: string]: string;
                    };
                    os?: {
                        name: string;
                        [k: string]: unknown;
                    };
                    overhead?: {
                        [k: string]: number | string;
                    };
                    preemptionPolicy?: string;
                    priority?: number;
                    priorityClassName?: string;
                    readinessGates?: {
                        conditionType: string;
                        [k: string]: unknown;
                    }[];
                    resourceClaims?: {
                        name: string;
                        resourceClaimName?: string;
                        resourceClaimTemplateName?: string;
                        [k: string]: unknown;
                    }[];
                    restartPolicy?: string;
                    runtimeClassName?: string;
                    schedulerName?: string;
                    schedulingGates?: {
                        name: string;
                        [k: string]: unknown;
                    }[];
                    securityContext?: {
                        appArmorProfile?: {
                            localhostProfile?: string;
                            type: string;
                            [k: string]: unknown;
                        };
                        fsGroup?: number;
                        fsGroupChangePolicy?: string;
                        runAsGroup?: number;
                        runAsNonRoot?: boolean;
                        runAsUser?: number;
                        seLinuxOptions?: {
                            level?: string;
                            role?: string;
                            type?: string;
                            user?: string;
                            [k: string]: unknown;
                        };
                        seccompProfile?: {
                            localhostProfile?: string;
                            type: string;
                            [k: string]: unknown;
                        };
                        supplementalGroups?: number[];
                        supplementalGroupsPolicy?: string;
                        sysctls?: {
                            name: string;
                            value: string;
                            [k: string]: unknown;
                        }[];
                        windowsOptions?: {
                            gmsaCredentialSpec?: string;
                            gmsaCredentialSpecName?: string;
                            hostProcess?: boolean;
                            runAsUserName?: string;
                            [k: string]: unknown;
                        };
                        [k: string]: unknown;
                    };
                    serviceAccount?: string;
                    serviceAccountName?: string;
                    setHostnameAsFQDN?: boolean;
                    shareProcessNamespace?: boolean;
                    subdomain?: string;
                    terminationGracePeriodSeconds?: number;
                    tolerations?: {
                        effect?: string;
                        key?: string;
                        operator?: string;
                        tolerationSeconds?: number;
                        value?: string;
                        [k: string]: unknown;
                    }[];
                    topologySpreadConstraints?: {
                        labelSelector?: {
                            matchExpressions?: {
                                key: string;
                                operator: string;
                                values?: string[];
                                [k: string]: unknown;
                            }[];
                            matchLabels?: {
                                [k: string]: string;
                            };
                            [k: string]: unknown;
                        };
                        matchLabelKeys?: string[];
                        maxSkew: number;
                        minDomains?: number;
                        nodeAffinityPolicy?: string;
                        nodeTaintsPolicy?: string;
                        topologyKey: string;
                        whenUnsatisfiable: string;
                        [k: string]: unknown;
                    }[];
                    volumes?: {
                        awsElasticBlockStore?: {
                            fsType?: string;
                            partition?: number;
                            readOnly?: boolean;
                            volumeID: string;
                            [k: string]: unknown;
                        };
                        azureDisk?: {
                            cachingMode?: string;
                            diskName: string;
                            diskURI: string;
                            fsType?: string;
                            kind?: string;
                            readOnly?: boolean;
                            [k: string]: unknown;
                        };
                        azureFile?: {
                            readOnly?: boolean;
                            secretName: string;
                            shareName: string;
                            [k: string]: unknown;
                        };
                        cephfs?: {
                            monitors: string[];
                            path?: string;
                            readOnly?: boolean;
                            secretFile?: string;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            user?: string;
                            [k: string]: unknown;
                        };
                        cinder?: {
                            fsType?: string;
                            readOnly?: boolean;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            volumeID: string;
                            [k: string]: unknown;
                        };
                        configMap?: {
                            defaultMode?: number;
                            items?: {
                                key: string;
                                mode?: number;
                                path: string;
                                [k: string]: unknown;
                            }[];
                            name?: string;
                            optional?: boolean;
                            [k: string]: unknown;
                        };
                        csi?: {
                            driver: string;
                            fsType?: string;
                            nodePublishSecretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            readOnly?: boolean;
                            volumeAttributes?: {
                                [k: string]: string;
                            };
                            [k: string]: unknown;
                        };
                        downwardAPI?: {
                            defaultMode?: number;
                            items?: {
                                fieldRef?: {
                                    apiVersion?: string;
                                    fieldPath: string;
                                    [k: string]: unknown;
                                };
                                mode?: number;
                                path: string;
                                resourceFieldRef?: {
                                    containerName?: string;
                                    divisor?: number | string;
                                    resource: string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            }[];
                            [k: string]: unknown;
                        };
                        emptyDir?: {
                            medium?: string;
                            sizeLimit?: number | string;
                            [k: string]: unknown;
                        };
                        ephemeral?: {
                            volumeClaimTemplate?: {
                                metadata?: {
                                    annotations?: {
                                        [k: string]: string;
                                    };
                                    finalizers?: string[];
                                    labels?: {
                                        [k: string]: string;
                                    };
                                    name?: string;
                                    namespace?: string;
                                    [k: string]: unknown;
                                };
                                spec: {
                                    accessModes?: string[];
                                    dataSource?: {
                                        apiGroup?: string;
                                        kind: string;
                                        name: string;
                                        [k: string]: unknown;
                                    };
                                    dataSourceRef?: {
                                        apiGroup?: string;
                                        kind: string;
                                        name: string;
                                        namespace?: string;
                                        [k: string]: unknown;
                                    };
                                    resources?: {
                                        limits?: {
                                            [k: string]: number | string;
                                        };
                                        requests?: {
                                            [k: string]: number | string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    selector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    storageClassName?: string;
                                    volumeAttributesClassName?: string;
                                    volumeMode?: string;
                                    volumeName?: string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        fc?: {
                            fsType?: string;
                            lun?: number;
                            readOnly?: boolean;
                            targetWWNs?: string[];
                            wwids?: string[];
                            [k: string]: unknown;
                        };
                        flexVolume?: {
                            driver: string;
                            fsType?: string;
                            options?: {
                                [k: string]: string;
                            };
                            readOnly?: boolean;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            [k: string]: unknown;
                        };
                        flocker?: {
                            datasetName?: string;
                            datasetUUID?: string;
                            [k: string]: unknown;
                        };
                        gcePersistentDisk?: {
                            fsType?: string;
                            partition?: number;
                            pdName: string;
                            readOnly?: boolean;
                            [k: string]: unknown;
                        };
                        gitRepo?: {
                            directory?: string;
                            repository: string;
                            revision?: string;
                            [k: string]: unknown;
                        };
                        glusterfs?: {
                            endpoints: string;
                            path: string;
                            readOnly?: boolean;
                            [k: string]: unknown;
                        };
                        hostPath?: {
                            path: string;
                            type?: string;
                            [k: string]: unknown;
                        };
                        image?: {
                            pullPolicy?: string;
                            reference?: string;
                            [k: string]: unknown;
                        };
                        iscsi?: {
                            chapAuthDiscovery?: boolean;
                            chapAuthSession?: boolean;
                            fsType?: string;
                            initiatorName?: string;
                            iqn: string;
                            iscsiInterface?: string;
                            lun: number;
                            portals?: string[];
                            readOnly?: boolean;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            targetPortal: string;
                            [k: string]: unknown;
                        };
                        name: string;
                        nfs?: {
                            path: string;
                            readOnly?: boolean;
                            server: string;
                            [k: string]: unknown;
                        };
                        persistentVolumeClaim?: {
                            claimName: string;
                            readOnly?: boolean;
                            [k: string]: unknown;
                        };
                        photonPersistentDisk?: {
                            fsType?: string;
                            pdID: string;
                            [k: string]: unknown;
                        };
                        portworxVolume?: {
                            fsType?: string;
                            readOnly?: boolean;
                            volumeID: string;
                            [k: string]: unknown;
                        };
                        projected?: {
                            defaultMode?: number;
                            sources?: {
                                clusterTrustBundle?: {
                                    labelSelector?: {
                                        matchExpressions?: {
                                            key: string;
                                            operator: string;
                                            values?: string[];
                                            [k: string]: unknown;
                                        }[];
                                        matchLabels?: {
                                            [k: string]: string;
                                        };
                                        [k: string]: unknown;
                                    };
                                    name?: string;
                                    optional?: boolean;
                                    path: string;
                                    signerName?: string;
                                    [k: string]: unknown;
                                };
                                configMap?: {
                                    items?: {
                                        key: string;
                                        mode?: number;
                                        path: string;
                                        [k: string]: unknown;
                                    }[];
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                downwardAPI?: {
                                    items?: {
                                        fieldRef?: {
                                            apiVersion?: string;
                                            fieldPath: string;
                                            [k: string]: unknown;
                                        };
                                        mode?: number;
                                        path: string;
                                        resourceFieldRef?: {
                                            containerName?: string;
                                            divisor?: number | string;
                                            resource: string;
                                            [k: string]: unknown;
                                        };
                                        [k: string]: unknown;
                                    }[];
                                    [k: string]: unknown;
                                };
                                secret?: {
                                    items?: {
                                        key: string;
                                        mode?: number;
                                        path: string;
                                        [k: string]: unknown;
                                    }[];
                                    name?: string;
                                    optional?: boolean;
                                    [k: string]: unknown;
                                };
                                serviceAccountToken?: {
                                    audience?: string;
                                    expirationSeconds?: number;
                                    path: string;
                                    [k: string]: unknown;
                                };
                                [k: string]: unknown;
                            }[];
                            [k: string]: unknown;
                        };
                        quobyte?: {
                            group?: string;
                            readOnly?: boolean;
                            registry: string;
                            tenant?: string;
                            user?: string;
                            volume: string;
                            [k: string]: unknown;
                        };
                        rbd?: {
                            fsType?: string;
                            image: string;
                            keyring?: string;
                            monitors: string[];
                            pool?: string;
                            readOnly?: boolean;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            user?: string;
                            [k: string]: unknown;
                        };
                        scaleIO?: {
                            fsType?: string;
                            gateway: string;
                            protectionDomain?: string;
                            readOnly?: boolean;
                            secretRef: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            sslEnabled?: boolean;
                            storageMode?: string;
                            storagePool?: string;
                            system: string;
                            volumeName?: string;
                            [k: string]: unknown;
                        };
                        secret?: {
                            defaultMode?: number;
                            items?: {
                                key: string;
                                mode?: number;
                                path: string;
                                [k: string]: unknown;
                            }[];
                            optional?: boolean;
                            secretName?: string;
                            [k: string]: unknown;
                        };
                        storageos?: {
                            fsType?: string;
                            readOnly?: boolean;
                            secretRef?: {
                                name?: string;
                                [k: string]: unknown;
                            };
                            volumeName?: string;
                            volumeNamespace?: string;
                            [k: string]: unknown;
                        };
                        vsphereVolume?: {
                            fsType?: string;
                            storagePolicyID?: string;
                            storagePolicyName?: string;
                            volumePath: string;
                            [k: string]: unknown;
                        };
                        [k: string]: unknown;
                    }[];
                    [k: string]: unknown;
                };
                [k: string]: unknown;
            };
            topologyPolicy?:
                | "none"
                | "best-effort"
                | "restricted"
                | "single-numa-node";
            [k: string]: unknown;
        }[];
        ttlSecondsAfterFinished?: number;
        volumes?: {
            mountPath: string;
            volumeClaim?: {
                accessModes?: string[];
                dataSource?: {
                    apiGroup?: string;
                    kind: string;
                    name: string;
                    [k: string]: unknown;
                };
                dataSourceRef?: {
                    apiGroup?: string;
                    kind: string;
                    name: string;
                    namespace?: string;
                    [k: string]: unknown;
                };
                resources?: {
                    limits?: {
                        [k: string]: number | string;
                    };
                    requests?: {
                        [k: string]: number | string;
                    };
                    [k: string]: unknown;
                };
                selector?: {
                    matchExpressions?: {
                        key: string;
                        operator: string;
                        values?: string[];
                        [k: string]: unknown;
                    }[];
                    matchLabels?: {
                        [k: string]: string;
                    };
                    [k: string]: unknown;
                };
                storageClassName?: string;
                volumeAttributesClassName?: string;
                volumeMode?: string;
                volumeName?: string;
                [k: string]: unknown;
            };
            volumeClaimName?: string;
            [k: string]: unknown;
        }[];
        [k: string]: unknown;
    };
    status?: {
        conditions?: {
            lastTransitionTime?: string;
            status: string;
            [k: string]: unknown;
        }[];
        controlledResources?: {
            [k: string]: string;
        };
        failed?: number;
        minAvailable?: number;
        pending?: number;
        retryCount?: number;
        running?: number;
        runningDuration?: string;
        state?: {
            lastTransitionTime?: string;
            message?: string;
            phase?: string;
            reason?: string;
            [k: string]: unknown;
        };
        succeeded?: number;
        taskStatusCount?: {
            [k: string]: {
                phase?: {
                    [k: string]: number;
                };
                [k: string]: unknown;
            };
        };
        terminating?: number;
        unknown?: number;
        version?: number;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
