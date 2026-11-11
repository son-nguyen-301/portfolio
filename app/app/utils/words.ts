// Split text into its words, for the `keep-word` class (assets/css/base.css):
// each word is its own box, so a line breaks only at a space, never after a
// hyphen ("e-" / "commerce"). A word wider than its whole box still wraps.
export function words(text: string): string[] {
  return text.split(' ').filter(Boolean)
}
