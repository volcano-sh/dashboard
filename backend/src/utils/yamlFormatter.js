import yaml from "js-yaml";

/**
 * Format object to YAML string
 * @param {Object} data - The object to convert to YAML
 * @returns {string} - Formatted YAML string
 */
export function formatToYaml(data) {
    return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });
}