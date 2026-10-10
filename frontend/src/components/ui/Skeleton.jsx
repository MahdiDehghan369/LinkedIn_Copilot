/**
 * @param {{ className?: string }} props
 */
export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-(--color-line)/60 ${className}`} aria-hidden="true" />;
}

/** A few stacked skeleton lines, for card/list bodies. */
export function SkeletonLines({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={`h-3.5 ${index === count - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
