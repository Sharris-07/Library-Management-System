// Reusable status label. Each status maps to a fixed colour style.
// Full class names are written out so that Tailwind can detect them.

const STATUS_CLASSES = {
  available: "badge-available",
  borrowed: "badge-borrowed",
  overdue: "badge-overdue",
  returned: "badge bg-taupe/20 text-cocoa",
  reserved: "badge bg-caramel/30 text-cocoa",
  pending: "badge bg-caramel/30 text-cocoa",
  ready: "badge bg-green-100 text-green-800",
  paid: "badge bg-green-100 text-green-800",
  unpaid: "badge bg-red-100 text-red-800",
  active: "badge bg-green-100 text-green-800",
  inactive: "badge bg-taupe/20 text-taupe",
  lost: "badge bg-red-100 text-red-800",
  archived: "badge bg-taupe/20 text-taupe",
  default: "badge bg-brass/20 text-brass-dark",
};

// Converts a status value such as "in_progress" into "In progress".
const toLabel = (value) => {
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function Badge({ status = "default", children, className = "" }) {
  const key = String(status).toLowerCase();
  const styleClass = STATUS_CLASSES[key] ?? STATUS_CLASSES.default;

  return (
    <span className={`${styleClass} ${className}`}>
      {children ?? toLabel(status)}
    </span>
  );
}

export default Badge;