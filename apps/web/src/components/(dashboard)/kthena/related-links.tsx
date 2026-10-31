"use client"

import NextLink from "next/link"
import { useTranslations } from "next-intl"
import { RelatedLinkGroup } from "@/lib/kthena-links"

export function RelatedLinks({ groups }: { groups: RelatedLinkGroup[] }) {
  const t = useTranslations("common.related")

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t("title")}</h3>
      {groups.map((group) => (
        <div key={group.title}>
          <div className="mb-1 text-sm font-semibold text-gray-700">{group.title}</div>
          {group.items.length === 0 ? (
            <p className="text-sm text-gray-500">{t("none")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) =>
                item.href ? (
                  <NextLink
                    key={`${group.title}-${item.text}`}
                    href={item.href}
                    className="rounded-md bg-blue-50 px-2 py-1 text-sm text-blue-800 hover:bg-blue-100"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.text}
                  </NextLink>
                ) : (
                  <span
                    key={`${group.title}-${item.text}`}
                    className="rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-800"
                  >
                    {item.text}
                  </span>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
