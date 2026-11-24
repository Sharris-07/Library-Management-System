import { useId } from "react";

// Reusable text field with a label, helper text, and error message.
// Works for text, email, password, number, and date types.

function Input({
  label,
  error = "",
  helperText = "",
  required = false,
  className = "",
  ...rest
}) {
  const id = useId();

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-cocoa">
          {label}
          {required && <span className="ml-1 text-red-700">*</span>}
        </label>
      )}

      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        className={`input-field ${error ? "!border-red-600 !ring-red-200" : ""}`}
        {...rest}
      />

      {error ? (
        <p className="mt-1 text-xs text-red-700">{error}</p>
      ) : (
        helperText && <p className="mt-1 text-xs text-taupe">{helperText}</p>
      )}
    </div>
  );
}

export default Input;