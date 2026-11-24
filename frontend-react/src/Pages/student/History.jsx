import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";

// Sample records for the visual design. They are replaced when the backend is connected.
const LOANS = [
  { id: 1, title: "Introduction to Algorithms", borrowed: "14 Nov 2026", due: "28 Nov 2026", returned: "Not yet returned", status: "borrowed", fine: "0.00" },
  { id: 2, title: "Clean Code", borrowed: "4 Nov 2026", due: "18 Nov 2026", returned: "Not yet returned", status: "overdue", fine: "30.00" },
  { id: 3, title: "Operating System Concepts", borrowed: "10 Sep 2026", due: "24 Sep 2026", returned: "22 Sep 2026", status: "returned", fine: "0.00" },
  { id: 4, title: "Python Crash Course", borrowed: "20 Aug 2026", due: "3 Sep 2026", returned: "7 Sep 2026", status: "returned", fine: "20.00" },
  { id: 5, title: "Computer Networks", borrowed: "1 Jul 2026", due: "15 Jul 2026", returned: "14 Jul 2026", status: "returned", fine: "0.00" },
  { id: 6, title: "Database System Concepts", borrowed: "5 Jun 2026", due: "19 Jun 2026", returned: "19 Jun 2026", status: "returned", fine: "0.00" },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "borrowed", label: "Active" },
  { key: "overdue", label: "Overdue" },
  { key: "returned", label: "Returned" },
];

const COLUMNS = [
  { key: "title", header: "Book Title", render: (row) => <span className="font-medium">{row.title}</span> },
  { key: "borrowed", header: "Borrowed On" },
  { key: "due", header: "Due Date" },
  { key: "returned", header: "Returned On" },
  { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
  { key: "fine", header: "Fine" },
];

function History() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return LOANS.filter(
      (loan) =>
        (tab === "all" || loan.status === tab) &&
        (!text || loan.title.toLowerCase().includes(text))
    );
  }, [query, tab]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Borrowing History</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">A complete record of every book you have borrowed.</p>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                tab === item.key
                  ? "border-brass bg-cocoa text-gold-light shadow-brass"
                  : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="w-full md:max-w-xs">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by book title" />
        </div>
      </div>

      <Table columns={COLUMNS} data={rows} emptyMessage="No loans match your selection." />
    </div>
  );
}

export default History;