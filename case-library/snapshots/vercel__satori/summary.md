# vercel/satori Snapshot

Route: image-report
Source: https://github.com/vercel/satori
License status: permissive

## Design Value
Reference JSX/HTML-to-SVG static rendering patterns for report cards, OG images, and long-image components.

## Style
programmatic static image rendering, precise layout, font-aware SVG output

## Applies To
- image report
- research card
- social card
- static long-image layout

## Disabled When
- complex browser CSS required
- interactive dashboard
- generated visual contains evidence text

## Call Hint
Use this snapshot as a lightweight design reference for report-card-image. Read snapshot.json first, then file-index.json only if paths are needed. Do not treat it as factual evidence or copy source/assets without license review.

## README Summary
Satori : Enlightened library to convert HTML and CSS to SVG. Note To use Satori in your project to generate PNG images like Open Graph images and social cards, check out our https://vercel.com/blog/introducing vercel og image generation fast dynamic social card images and https://vercel.com/docs/concepts/functions/edge functions/og image generation To use it in Next.js, take a look at the https://vercel.com/templates/next.js/og image generation Overview Satori supports the JSX syntax, which makes it very straightforward to use. Here’s an overview of the basic usage: Satori will render the element into a 600×400 SVG, and return the SVG string: Under the hood, it handles layout calculation, font, typography and more, to generate a SVG that matches the exact same HTML and CSS in a browser. Documentation JSX Satori only accepts JSX elements that are pure and stateless. You can use a subset of HTML elements (see section below), or custom React components, but React APIs such as useState , useEffect , dangerouslySetInnerHTML are not supported. Experimental: builtin JSX support Satori has an experimental JSX runtime that you can use without having to install React. You can enable it on a...