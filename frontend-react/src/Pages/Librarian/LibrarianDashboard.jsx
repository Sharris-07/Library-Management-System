import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { ROUTES } from "../../utils/constants";

// Sample values for the visual design. They are replaced when the backend is connected.
const STATS = [
  { label: "Total Books", value: "1,248", note: "In the catalogue" },
  { label: "Books Issued", value: "186", note: "Currently on loan" },
  { label: "Overdue", value: "14", note: "Need follow up" },
  { label: "Pending Reservations", value: "9", note: "Waiting in queue" },
];

const ACTIONS = [
  { label: "Issue a Book", note: "Lend a book to a member", path: ROUTES.LIBRARIAN_ISSUE_RETURN },
  { label: "Process a Return", note: "Receive a returned book", path: ROUTES.LIBRARIAN_ISSUE_RETURN },
  { label: "Add a Book", note: "Register a new title", path: ROUTES.LIBRARIAN_BOOKS },
  { label: "View Overdue", note: "Check late returns", path: ROUTES.LIBRARIAN_OVERDUE },
];

const RECENT = [
  { id: 1, member: "Aarav Sharma", book: "Introduction to Algorithms", action: "Issued", time: "Today, 10:20" },
  { id: 2, member: "Sneha Iyer", book: "Clean Code", action: "Returned", time: "Today, 09:45" },
  { id: 3, member: "Kabir Singh", book: "Computer Networks", action: "Reserved", time: "Yesterday, 16:10" },
  { id: 4, member: "Meera Joshi", book: "Python Crash Course", action: "Issued", time: "Yesterday, 14:30" },
];

const ACTION_STATUS = { Issued: "borrowed", Returned: "returned", Reserved: "reserved" };

const COLUMNS = [
  { key: "member", header: "Member", render: (row) => <span className="font-medium">{row.member}</span> },
  { key: "book", header: "Book" },
  { key: "action", header: "Action", render: (row) => <Badge status={ACTION_STATUS[row.action]}>{row.action}</Badge> },
  { key: "time", header: "Time" },
];

function LibrarianDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft md:p-8">
        <p className="text-sm font-medium text-gold-light">Librarian desk</p>
        <h1 className="mt-1 !text-cream text-3xl font-semibold md:text-4xl">Welcome, {user.name}</h1>
        <div className="my-4 h-1 w-16 rounded bg-gold-gradient" />
        <p className="max-w-xl text-sm text-cream/90">
          Manage the catalogue, issue and receive books, and keep an eye on overdue items.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-brass/40 border-l-4 border-l-gold bg-white/70 p-5 shadow-soft">
            <p className="text-sm text-taupe">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-cocoa">{stat.value}</p>
            <p className="mt-1 text-xs text-brass-dark">{stat.note}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="group rounded-xl border border-brass/40 bg-cocoa p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-brass"
            >
              <p className="font-display text-lg font-semibold text-gold-light">{action.label}</p>
              <p className="mt-1 text-sm text-cream/80">{action.note}</p>
              <span className="mt-3 block h-0.5 w-8 rounded bg-gold transition-all group-hover:w-16" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent Activity</h2>
        <Table columns={COLUMNS} data={RECENT} />
      </section>
    </div>
  );
}

export default LibrarianDashboard;