# Contributing to Ghostline

## How it works

- A RichText format (`ghostline/motion`) wraps the selected text in a `span` with `data-ghostline-*` attributes. The saved content has no other markup.
- On the frontend, a script adds the cursor and the decoration. The script uses the Web Animations API. It does not use an animation library.
- The script loads only on pages that use a motion. Click, Type, Circle, Box, and Replace have separate scripts.
- With "reduce motion" on, or without JavaScript, the text shows its final state.

## Rules

- Animate only `transform`, `opacity`, `clip-path`, and SVG `stroke-dashoffset`. Do not animate layout properties.
- Keep the real text in the DOM. Give decoration `aria-hidden="true"`.
- Do not save `style` attributes or decoration markup in the post content.
- Use the `ghostline` prefix for PHP, CSS, data attributes, and the text domain.
- Keep the main view script under 5 KB gzipped (`npm run size`).

## Setup

You need Node 24 (or 22.22+), PHP 8.1+, and Composer.

```sh
npm install
composer install
npm run build
npm run playground   # local WordPress site at http://127.0.0.1:9400
```

## Tests

```sh
npm test            # Jest and PHPUnit
npm run test:e2e    # Playwright (starts its own Playground site)
npm run lint        # ESLint, Stylelint, PHPCS, PHPStan
npm run size        # script size budget
```

Test on WordPress 6.5:

```sh
GHOSTLINE_WP=6.5 GHOSTLINE_BLOCK_THEME=twentytwentyfour npm run test:e2e
```

## Release

```sh
npm run plugin-zip  # makes ghostline.zip
```

Run Plugin Check on the zip before you release.

## WordPress.org assets

The files in `.wordpress-org/` go to the `assets/` folder of the plugin SVN repository. They are not part of the plugin zip.

```sh
npm run brand       # banner and icon (PNG and icon.svg)
```

The screenshots come from `tests/e2e/tools/wporg-assets.spec.js`. The usage is in the file header.

## README GIFs

The GIFs in `.github/readme/` come from `tests/e2e/tools/readme-gifs.spec.js`. The usage is in the file header.
