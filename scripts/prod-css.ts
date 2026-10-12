import { $ } from 'bun'

const html = await Bun.file('dist/index.html').text()
const match = html.match(
	/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*\/([^"']+\.css)["'][^>]*>/,
)
if (!match) {
	throw new Error('No stylesheet link found in dist/index.html')
}
const cssFile = match[1]
await $`bunx --bun @tailwindcss/cli -i frontend/app.css -o dist/${cssFile}`
console.log(`compiled ${cssFile} with Tailwind + daisyUI`)
