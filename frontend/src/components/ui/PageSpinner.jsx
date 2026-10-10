export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--color-paper)">
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-(--color-line) border-t-(--color-accent)"
        aria-label="Loading"
      />
    </div>
  );
}
