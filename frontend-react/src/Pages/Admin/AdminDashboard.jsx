import { useAuth } from "../../context/AuthContext";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";

// Sample values for the visual design. They are replaced when the backend is connected.
const STATS = [
  { label: "Total Members", value: "842", note: "Registered accounts" },
  { label: "Total Books", value: "1,248", note: "Titles in the catalogue" },
  { label: "Active Loans", value: "186", note: "Currently borrowed" },
  { label: "Unpaid Fines", value: "1,240.00", note: "Outstanding amount" },
];

const MONTHLY = [
  { month: "Jun", value: 120 },
  { month: "Jul", value: 150 },
  { month: "Aug", value: 98 },
  { month: "Sep", value: 210 },
  { month: "Oct", value: 185 },
  { month: "Nov", value: 240 },
];

const CATEGORIES = [
  { name: "Computer Science", percent: 38 },
  { name: "Artificial Intelligence", percent: 24 },
  { name: "Databases", percent: 20 },
  { name: "Systems and Networks", percent: 18 },
];

const RECENT = [
  { id: 1, action: "Issued Introduction to Algorithms to Aarav Sharma", by: "Meera Patel", time: "Today, 10:20", type: "borrowed" },
  { id: 2, action: "Deactivated the account of Kabir Singh", by: "Rohan Mehta", time: "Yesterday, 17:05", type: "inactive" },
  { id: 3, action: "Recorded a fine payment for Python Crash Course", by: "Meera Patel", time: "Yesterday, 12:40", type: "paid" },
  { id: 4, action: "Added the book Computer Networks", by: "Meera Patel", time: "22 Nov 2026", type: "active" },
];

const COLUMNS = [
  { key: "action", header: "Activity", render: (row) => <span className="font-medium">{row.action}</span> },
  { key: "by", header: "Performed By" },
  { key: "time", header: "Time" },
  { key: "type", header: "Type", render: (row) => <Badge status={row.type} /> },
];

function AdminDashboard() {
  const { user } = useAuth();
  const highest = Math.max(...MONTHLY.map((item) => item.value));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft md:p-8">
        <p className="text-sm font-medium text-gold-light">Administration</p>
        <h1 className="mt-1 !text-cream text-3xl font-semibold md:text-4xl">Welcome, {user.name}</h1>
        <div className="my-4 h-1 w-16 rounded bg-gold-gradient" />
        <p className="max-w-xl text-sm text-cream/90">
          Monitor the whole library, manage staff accounts, and review system activity.
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly borrowing chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold">Books Borrowed per Month</h2>
          <div className="mt-6 flex h-52 items-end gap-3">
            {MONTHLY.map((item) => (
              <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-cocoa">{item.value}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brass-dark via-brass to-gold shadow-brass"
                  style={{ height: `${(item.value / highest) * 100}%` }}
                />
                <span className="text-xs text-taupe">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h2 className="text-xl font-semibold">Borrowing by Category</h2>
          <div className="mt-5 space-y-4">
            {CATEGORIES.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-semibold text-brass-dark">{item.percent}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-taupe/20">
                  <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent Activity</h2>
        <Table columns={COLUMNS} data={RECENT} />
      </section>
    </div>
  );
}

export default AdminDashboard;