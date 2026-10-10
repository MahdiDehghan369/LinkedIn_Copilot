/**
 * @param {{ title: string, subtitle: string, children: import('react').ReactNode }} props
 */
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-(--color-ink) p-12 text-(--color-paper) lg:flex">
        <div className="font-display text-lg font-semibold tracking-tight">Copilot</div>

        <PostAnatomyDiagram />

        <p className="max-w-sm text-sm text-(--color-paper)/60">
          Copilot learns how you write, keeps track of what you've already covered, and helps you
          plan what's next — you stay in control of every post before it goes out.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="font-display text-lg font-semibold tracking-tight text-(--color-ink)">
              Copilot
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-(--color-ink)">{title}</h1>
          <p className="mt-1.5 text-sm text-(--color-ink-soft)">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * An annotated diagram of a post's anatomy (Hook / Body / CTA / Hashtags)
 * — the signature visual for the auth screens. Deliberately abstract and
 * labeled as structure, not a polished fake post, so it never reads as a
 * real AI-generated example the product hasn't actually produced yet.
 */
function PostAnatomyDiagram() {
  const rows = [
    { label: 'Hook', width: 'w-3/4' },
    { label: 'Body', width: 'w-full' },
    { label: 'Body', width: 'w-11/12' },
    { label: 'CTA', width: 'w-1/2' },
  ];

  return (
    <div className="rounded-2xl border border-(--color-paper)/15 bg-(--color-paper)/5 p-6 font-mono text-xs">
      <div className="mb-4 text-(--color-paper)/40">anatomy of a post</div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-(--color-paper)/40">{row.label}</span>
            <span className={`h-2 rounded-full bg-(--color-paper)/20 ${row.width}`} />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <span className="w-12 shrink-0 text-(--color-paper)/40">Tags</span>
          <span className="rounded-full bg-(--color-accent)/30 px-2.5 py-1 text-(--color-paper)/70">
            #redis
          </span>
          <span className="rounded-full bg-(--color-accent)/30 px-2.5 py-1 text-(--color-paper)/70">
            #backend
          </span>
        </div>
      </div>
    </div>
  );
}
