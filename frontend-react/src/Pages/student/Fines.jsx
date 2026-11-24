import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { BORROW_POLICY } from "../../utils/constants";

// Sample records for the visual design. They are replaced when the backend is connected.
const SUMMARY = [
  { label: "Unpaid Fines", value: "30.00", note: "Outstanding balance" },
  { label: "Paid Fines", value: "20.00", note: "Cleared so far" },
  { label: "Overdue Books", value: "1", note: "Return as soon as possible" },
];

const DUE_DATES = [
  { id: 1, title: "Introduction to Algorithms", due: "28 Nov 2026", note: "4 days remaining", tone: "available" },
  { id: 2, title: "Clean Code", due: "18 Nov 2026", note: "6 days overdue", tone: "overdue" },
];

const FINES = [
  { id: 1, title: "Clean Code", days: 6, amount: "30.00", status: "unpaid" },
  { id: 2, title: "Python Crash Course", days: 4, amount: "20.00", status: "paid" },
];

const COLUMNS = [
  { key: "title", header: "Book Title", render: (row) => <span className="font-medium">{row.title}</span> },
  { key: "days", header: "Days Overdue" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Payment Status", render: (row) => <Badge status={row.status} /> },
];

function Fines() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Fines and Due Dates</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">
          Fines are charged at {BORROW_POLICY.FINE_PER_DAY.toFixed(2)} for every day a book is overdue.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SUMMARY.map((item) => (
          <div key={item.label} className="rounded-xl border border-brass/40 border-l-4 border-l-gold bg-white/70 p-5 shadow-soft">
            <p className="text-sm text-taupe">{item.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-cocoa">{item.value}</p>
            <p className="mt-1 text-xs text-brass-dark">{item.note}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Upcoming Due Dates</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DUE_DATES.map((item) => (
            <div key={item.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-taupe">Due on {item.due}</p>
              </div>
              <Badge status={item.tone}>{item.note}</Badge>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Fine Records</h2>
        <Table columns={COLUMNS} data={FINES} emptyMessage="You have no fines." />
        <p className="mt-3 text-xs text-taupe">Fines are paid at the library desk and recorded by the librarian.</p>
      </section>
    </div>
  );
}

export default Fines;