import { useEffect } from "react";

// Reusable pop up window.
// Props: isOpen, onClose, title, children, footer, size (sm, md, lg).

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function Modal({ isOpen, onClose, title, children, footer = null, size = "md" }) {
  // Close with the Escape key, and stop the page behind from scrolling.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl border border-brass/50 bg-cream shadow-soft ${
          SIZE_CLASSES[size] ?? SIZE_CLASSES.md
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="brass-header flex items-center justify-between rounded-t-xl px-5 py-3">
          <h2 className="!text-cream text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none text-cream transition hover:text-gold-light"
          >
            &times;
          </button>
        </div>

        <div className="p-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-brass/30 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;