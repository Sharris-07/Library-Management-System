import libraryImage from "../../assets/LIBRARY.jpeg";

// Full page frame for the Login and Register pages.
// The library photo fills the screen, a cocoa layer makes it translucent,
// and the children (the form card) are centred on top.

function AuthBackground({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryImage})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-cocoa/60" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient font-display text-2xl font-bold text-cocoa shadow-brass">
            L
          </span>
          <span className="font-display text-3xl font-semibold text-cream">
            Smart <span className="text-gold">LMS</span>
          </span>
        </div>

        {children}

        <p className="mt-6 text-sm text-gold-light">Library Management System</p>
      </div>
    </div>
  );
}

export default AuthBackground;