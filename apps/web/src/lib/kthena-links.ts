export type RelatedLinkItem = {
  text: string
  href?: string
}

export type RelatedLinkGroup = {
  title: string
  items: RelatedLinkItem[]
}

export function kthenaHref(
  locale: string,
  path: string,
  ref: { name: string; namespace?: string },
) {
  const params = new URLSearchParams()
  if (ref.namespace) {
    params.set("ns", ref.namespace)
  }
  params.set("name", ref.name)
  return `/${locale}${path}?${params.toString()}`
}

export function relatedRefsToItems(
  locale: string,
  path: string,
  refs: { name: string; namespace: string }[] | undefined,
): RelatedLinkItem[] {
  return (refs ?? []).map((ref) => ({
    text: `${ref.namespace}/${ref.name}`,
    href: kthenaHref(locale, path, ref),
  }))
}
