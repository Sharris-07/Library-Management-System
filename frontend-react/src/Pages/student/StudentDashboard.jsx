import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { ROUTES } from "../../utils/constants";

// Sample values for the visual design. They are replaced when the backend is connected.
const STATS = [
  { label: "Books Borrowed", value: "2", note: "Currently with you" },
  { label: "Due Soon", value: "1", note: "Within 5 days" },
  { label: "Overdue", value: "1", note: "Please return" },
  { label: "Unpaid Fines", value: "30.00", note: "Outstanding balance" },
];

const LOANS = [
  { id: 1, title: "Introduction to Algorithms", borrowed: "14 Nov 2026", due: "28 Nov 2026", status: "borrowed", fine: "0.00" },
  { id: 2, title: "Clean Code", borrowed: "4 Nov 2026", due: "18 Nov 2026", status: "overdue", fine: "30.00" },
];

const COLUMNS = [
  { key: "title", header: "Book Title", render: (row) => <span className="font-medium">{row.title}</span> },
  { key: "borrowed", header: "Borrowed On" },
  { key: "due", header: "Due Date" },
  { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
  { key: "fine", header: "Fine" },
];

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft md:p-8">
        <p className="text-sm font-medium text-gold-light">Welcome back</p>
        <h1 className="mt-1 !text-cream text-3xl font-semibold md:text-4xl">{user.name}</h1>
        <div className="my-4 h-1 w-16 rounded bg-gold-gradient" />
        <p className="max-w-xl text-sm text-cream/90">
          Search the catalogue, track your due dates, and keep your fines under control from one place.
        </p>
        <Link to={ROUTES.STUDENT_CATALOGUE} className="btn-gold mt-5">
          Browse the Catalogue
        </Link>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-brass/40 border-l-4 border-l-gold bg-white/70 p-5 shadow-soft">
            <p className="text-sm text-taupe">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-cocoa">{stat.value}</p>
            <p className="mt-1 text-xs text-brass-dark">{stat.note}</p>
          </div>
        ))}
      </section>

      {/* Current loans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Loans</h2>
          <Link to={ROUTES.STUDENT_HISTORY} className="text-sm font-semibold text-brass-dark hover:text-cocoa">
            View full history
          </Link>
        </div>
        <Table columns={COLUMNS} data={LOANS} />
      </section>
    </div>
  );
}

export default StudentDashboard;