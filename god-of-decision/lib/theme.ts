/**
 * Colour of the very first row of the app canvas.
 *
 * Single source of truth. Several unrelated surfaces have to land on
 * this exact value or a seam appears at the top of the screen, and
 * each one is reached by a different mechanism:
 *
 *   - `--canvas-top`, written onto <html> in app/layout.tsx, feeds
 *     `--canvas-gradient` and the app bar's backdrop
 *   - `html { background }` in app/globals.css — this, and NOT
 *     `theme-color`, is what iOS paints the status bar and Dynamic
 *     Island strip with in an installed web app. It takes the
 *     document's canvas colour, which propagates from <html>.
 *   - `viewport.themeColor` tints Safari's toolbar and Android
 *     Chrome's status bar
 *   - the manifest's `background_color` paints the native launch
 *     screen, and `theme_color` mirrors the above
 *
 * Changing the colour means changing it here, and nowhere else.
 */
export const CANVAS_TOP = "#4C1FBD";
