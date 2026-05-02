{{/*
Expand the name of the chart.
*/}}
{{- define "volcano-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name using the release name.
Truncate to 63 chars because Kubernetes label values must be no longer than 63 characters.
*/}}
{{- define "volcano-dashboard.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels added to every resource (when common_labels is set).
*/}}
{{- define "volcano-dashboard.labels" -}}
{{- if .Values.custom.common_labels }}
{{- toYaml .Values.custom.common_labels }}
{{- end }}
{{- end }}
