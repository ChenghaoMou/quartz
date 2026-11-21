// Quartz's community plugins (tag and folder pages, note meta, recent notes)
// format dates with toLocaleDateString(locale, { month: "short", ... }). For
// en-GB, current ICU data abbreviates September as "Sept", and no English
// day-month-year locale gives "Sep". The site writes "Sep" everywhere, as the
// home feed does, so short month names are normalised here for the build.
// Importing the personal-site components installs this once.

const PATCHED = Symbol.for("personal-site.short-september")

type Patched = typeof Date.prototype.toLocaleDateString & { [PATCHED]?: true }

const original = Date.prototype.toLocaleDateString as Patched

if (!original[PATCHED]) {
  const toLocaleDateString: Patched = function (
    this: Date,
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    const text = original.call(this, locales, options)
    return options?.month === "short" ? text.replace(/\bSept\b/, "Sep") : text
  }
  toLocaleDateString[PATCHED] = true
  Date.prototype.toLocaleDateString = toLocaleDateString
}
