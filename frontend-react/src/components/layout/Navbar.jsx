import Button from "../common/Button";

// Top bar shown on every dashboard page.
// Props:
//   user: a User model object (provides name, getInitials(), getRoleLabel()).
//   onLogout: function called when the Logout button is pressed.
//   onMenuToggle: function that opens or closes the sidebar on small screens.

function Navbar({ user = null, onLogout, onMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brass/50 bg-cocoa px-4 py-3 shadow-brass md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="rounded-md p-1 text-cream transition hover:text-gold-light md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient font-display text-lg font-bold text-cocoa">
            L
          </span>
          <span className="font-display text-xl font-semibold text-cream">
            Smart <span className="text-gold">LMS</span>
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-cream">{user.name}</p>
            <p className="text-xs text-gold-light">{user.getRoleLabel()}</p>
          </div>

          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold bg-mocha text-sm font-semibold text-cream"
            aria-hidden="true"
          >
            {user.getInitials()}
          </span>

          <Button variant="gold" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}

export default Navbar;