import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { ROUTES } from "../../utils/constants";
import AuthBackground from "../../components/layout/AuthBackground";

// TEMPORARY: replace this function with a call to the registration service
// once the backend is confirmed. It should throw an error when registration fails.
const registerUser = async () => true;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function Register() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  // A user who is already logged in has no need for this page.
  if (isAuthenticated) {
    return <Navigate to={user.getHomeRoute()} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const validate = () => {
    const found = {};

    if (!form.name.trim()) {
      found.name = "Full name is required.";
    }

    if (!form.email.trim()) {
      found.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(form.email)) {
      found.email = "Enter a valid email address.";
    }

    if (!form.password) {
      found.password = "Password is required.";
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!form.confirmPassword) {
      found.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      found.confirmPassword = "The passwords do not match.";
    }

    return found;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setRegistered(true);
    } catch {
      setServerError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <AuthBackground>
      <div className="w-full rounded-2xl border border-brass/60 bg-cream/90 p-8 shadow-brass backdrop-blur-md">
        {registered ? (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-800">
              &#10003;
            </span>
            <h2 className="text-3xl font-semibold">Account created</h2>
            <p className="mb-6 mt-2 text-sm text-taupe">
              Your registration was successful. Please log in to continue.
            </p>
            <Button
              variant="gold"
              size="lg"
              fullWidth
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Go to login
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-semibold">Create an account</h2>
            <p className="mb-6 mt-1 text-sm text-taupe">
              Register as a student or library member.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Full name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                autoComplete="name"
                required
              />

              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="name@college.edu"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Create a password"
                helperText={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                placeholder="Enter the password again"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                autoComplete="new-password"
                required
              />

              {serverError && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                fullWidth
                loading={submitting}
              >
                Register
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-taupe">
              Already have an account?{" "}
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-brass-dark hover:text-cocoa"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthBackground>
  );
}

export default Register;