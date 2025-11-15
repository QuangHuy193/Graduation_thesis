import Skeleton from "./Skeleton";

export default function LoadingPage() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* banner hoặc header */}
      <Skeleton height="200px" />

      {/* title */}
      <Skeleton width="40%" height="28px" />

      {/* 3 dòng text */}
      <Skeleton width="90%" />
      <Skeleton width="80%" />
      <Skeleton width="70%" />

      {/* grid item */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="150px" />
        ))}
      </div>
    </div>
  );
}
