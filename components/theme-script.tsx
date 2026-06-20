"use client"
import { useServerInsertedHTML } from "next/navigation"

export function ThemeScript({ jsonLd }: { jsonLd: object }) {
  useServerInsertedHTML(() => (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  ))
  return null
}
