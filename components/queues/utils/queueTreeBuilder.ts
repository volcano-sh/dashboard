/**
 * Builds a hierarchical tree structure from a flat array of queues
 * based on the spec.parent field in each queue.
 *
 * @param {Array} flatQueues - Array of queue objects with spec.parent field
 * @returns {Array} - Array of root-level queue nodes with children
 */
export function buildQueueTree(flatQueues) {
    if (!flatQueues || flatQueues.length === 0) {
        return [];
    }

    const queueMap = new Map();
    const rootChildren = [];

    // Initialize all queues with empty children array
    flatQueues.forEach((queue) => {
        queueMap.set(queue.metadata.name, { ...queue, children: [] });
    });

    // Build parent-child relationships
    flatQueues.forEach((queue) => {
        const queueNode = queueMap.get(queue.metadata.name);
        const parentName = queue.spec?.parent;

        if (!parentName) {
            // Root-level queue (no parent specified)
            rootChildren.push(queueNode);
        } else {
            const parent = queueMap.get(parentName);
            if (parent) {
                // Valid parent found, add as child
                parent.children.push(queueNode);
            } else {
                // Orphaned queue (parent doesn't exist), treat as root-level
                rootChildren.push(queueNode);
            }
        }
    });

    return rootChildren;
}

/**
 * Filters a queue tree to show only nodes that match a predicate
 * and their ancestors. This is useful for search functionality.
 *
 * @param {Array} treeNodes - Array of tree nodes
 * @param {Function} predicate - Function that returns true for matching nodes
 * @returns {Object} - { filteredTree, expandedNodes }
 */
export function filterTreeWithAncestors(treeNodes, predicate) {
    const expandedNodes = new Set();

    function filterNode(node, ancestors = []) {
        const nodeMatches = predicate(node);
        const filteredChildren = [];

        // Recursively filter children
        if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
                const result = filterNode(child, [
                    ...ancestors,
                    node.metadata.name,
                ]);
                if (result) {
                    filteredChildren.push(result);
                }
            });
        }

        // Include node if it matches or has matching descendants
        if (nodeMatches || filteredChildren.length > 0) {
            // If this node has matching descendants, expand it
            if (filteredChildren.length > 0) {
                expandedNodes.add(node.metadata.name);
                // Also expand all ancestors
                ancestors.forEach((ancestorName) => {
                    expandedNodes.add(ancestorName);
                });
            }

            return {
                ...node,
                children: filteredChildren,
            };
        }

        return null;
    }

    const filteredTree = [];
    treeNodes.forEach((node) => {
        const result = filterNode(node);
        if (result) {
            filteredTree.push(result);
        }
    });

    return { filteredTree, expandedNodes };
}

/**
 * Sorts tree nodes recursively. Sorting is applied to children
 * within each parent level, preserving the hierarchy.
 *
 * @param {Array} treeNodes - Array of tree nodes
 * @param {Function} compareFn - Comparison function for sorting
 * @returns {Array} - Sorted tree
 */
export function sortTreeNodes(treeNodes, compareFn) {
    if (!treeNodes || treeNodes.length === 0) {
        return [];
    }

    // Sort current level
    const sorted = [...treeNodes].sort(compareFn);

    // Recursively sort children
    return sorted.map((node) => ({
        ...node,
        children: node.children ? sortTreeNodes(node.children, compareFn) : [],
    }));
}

/**
 * Flattens a tree structure back into a flat array
 *
 * @param {Array} treeNodes - Array of tree nodes
 * @returns {Array} - Flat array of queues
 */
export function flattenTree(treeNodes) {
    const result = [];

    function traverse(nodes) {
        nodes.forEach((node) => {
            const { children, ...queueData } = node;
            result.push(queueData);
            if (children && children.length > 0) {
                traverse(children);
            }
        });
    }

    traverse(treeNodes);
    return result;
}
