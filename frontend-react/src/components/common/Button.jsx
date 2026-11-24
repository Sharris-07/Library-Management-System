// Reusable button used across every page.
// Variants: primary, secondary, gold, danger.

const VARIANT_CLASSES = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  gold: "btn-gold",
  danger: "btn bg-red-700 text-white hover:bg-red-800",
};

const SIZE_CLASSES = {
  sm: "!px-3 !py-1.5 !text-xs",
  md: "",
  lg: "!px-6 !py-3 !text-base",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  ...rest
}) {
  const classes = [
    VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] ?? "",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Button;