// Reusable loading indicator.
// Props: message (text below the spinner), fullPage (centres it on the whole screen).

function Loader({ message = "Loading...", fullPage = false }) {
  const wrapperClass = fullPage
    ? "flex min-h-screen flex-col items-center justify-center gap-3"
    : "flex flex-col items-center justify-center gap-3 py-10";

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brass/30 border-t-gold" />
      <p className="text-sm text-taupe">{message}</p>
    </div>
  );
}

export default Loader;