import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { ROLES, ROUTES } from "../../utils/constants";
import AuthBackground from "../../components/layout/AuthBackground";

// TEMPORARY: replace this function with a call to the authentication service
// once the backend is confirmed. It must return { user, token }.
const authenticate = async ({ email, role }) => {
  const name = email.split("@")[0];
  return {
    user: {
      id: 1,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role,
    },
    token: null,
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: ROLES.STUDENT,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.email.trim()) {
      found.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(form.email)) {
      found.email = "Enter a valid email address.";
    }
    if (!form.password) {
      found.password = "Password is required.";
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
      const result = await authenticate(form);
      const loggedInUser = login(result.user, result.token);
      const destination =
        location.state?.from?.pathname ?? loggedInUser.getHomeRoute();
      navigate(destination, { replace: true });
    } catch {
      setServerError("Login failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <AuthBackground>
      <div className="w-full rounded-2xl border border-brass/60 bg-cream/90 p-8 shadow-brass backdrop-blur-md">
        <h2 className="text-3xl font-semibold">Welcome back</h2>
        <p className="mb-6 mt-1 text-sm text-taupe">
          Log in to continue to your library account.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
          />

          {/* TEMPORARY: remove this selector when the backend supplies the role. */}
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-cocoa"
            >
              Sign in as (temporary preview option)
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value={ROLES.STUDENT}>Student</option>
              <option value={ROLES.LIBRARIAN}>Librarian</option>
              <option value={ROLES.ADMIN}>Administrator</option>
            </select>
          </div>

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
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-taupe">
          New to the library?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-brass-dark hover:text-cocoa"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthBackground>
  );
}

export default Login;