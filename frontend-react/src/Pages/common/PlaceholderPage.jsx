// Temporary page shown for screens that are not built yet.
// It is replaced by the real page as each screen is completed.

function PlaceholderPage({ title }) {
  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-taupe">
        This page is under construction and will be completed in the next steps.
      </p>
    </div>
  );
}

export default PlaceholderPage;