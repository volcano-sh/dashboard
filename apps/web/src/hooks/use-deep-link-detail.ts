"use client"

import { useEffect } from "react"

export function useDeepLinkDetail(openNamed: (namespace: string, name: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const params = new URLSearchParams(window.location.search)
    const name = params.get("name")
    if (!name) {
      return
    }
    const namespace = params.get("ns") || "default"
    openNamed(namespace, name)
    // Open once from the landing URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
