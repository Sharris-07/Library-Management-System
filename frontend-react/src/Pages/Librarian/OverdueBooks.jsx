import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { BORROW_POLICY } from "../../utils/constants";

// Sample records for the visual design. They are replaced when the backend is connected.
const INITIAL_OVERDUE = [
  { id: 1, member: "Aarav Sharma", book: "Clean Code", due: "18 Nov 2026", daysLate: 6, paid: false },
  { id: 2, member: "Sneha Iyer", book: "Database System Concepts", due: "21 Nov 2026", daysLate: 3, paid: false },
  { id: 3, member: "Kabir Singh", book: "Computer Networks", due: "12 Nov 2026", daysLate: 12, paid: false },
  { id: 4, member: "Meera Joshi", book: "Python Crash Course", due: "15 Nov 2026", daysLate: 9, paid: true },
];

const fineFor = (item) => item.daysLate * BORROW_POLICY.FINE_PER_DAY;

function OverdueBooks() {
  const [items, setItems] = useState(INITIAL_OVERDUE);
  const [query, setQuery] = useState("");
  const [paying, setPaying] = useState(null);
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        !text ||
        item.member.toLowerCase().includes(text) ||
        item.book.toLowerCase().includes(text)
    );
  }, [items, query]);

  const totalUnpaid = items
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + fineFor(item), 0);

  const confirmPayment = () => {
    setItems((previous) =>
      previous.map((item) => (item.id === paying.id ? { ...item, paid: true } : item))
    );
    setNotice(`Payment of ${fineFor(paying).toFixed(2)} was recorded for ${paying.member}.`);
    setPaying(null);
  };

  const columns = [
    { key: "member", header: "Member", render: (row) => <span className="font-medium">{row.member}</span> },
    { key: "book", header: "Book" },
    { key: "due", header: "Due Date" },
    { key: "daysLate", header: "Days Overdue", render: (row) => <Badge status="overdue">{`${row.daysLate} days`}</Badge> },
    { key: "fine", header: "Fine", render: (row) => fineFor(row).toFixed(2) },
    { key: "paid", header: "Payment", render: (row) => <Badge status={row.paid ? "paid" : "unpaid"} /> },
    {
      key: "actions",
      header: "Action",
      render: (row) =>
        row.paid ? (
          <span className="text-xs text-taupe">Settled</span>
        ) : (
          <Button size="sm" variant="gold" onClick={() => setPaying(row)}>Record Payment</Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Overdue Books</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">
          Fines are charged at {BORROW_POLICY.FINE_PER_DAY.toFixed(2)} for every day a book is overdue.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Overdue Loans", value: items.length, note: "Books not returned on time" },
          { label: "Unpaid Fines", value: items.filter((item) => !item.paid).length, note: "Awaiting payment" },
          { label: "Outstanding Amount", value: totalUnpaid.toFixed(2), note: "Total still to collect" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-brass/40 border-l-4 border-l-gold bg-white/70 p-5 shadow-soft">
            <p className="text-sm text-taupe">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-cocoa">{stat.value}</p>
            <p className="mt-1 text-xs text-brass-dark">{stat.note}</p>
          </div>
        ))}
      </section>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-sm text-green-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="md:max-w-md">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by member or book" />
      </div>

      <Table columns={columns} data={rows} emptyMessage="There are no overdue books." />

      <Modal
        isOpen={Boolean(paying)}
        onClose={() => setPaying(null)}
        title="Record Fine Payment"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(null)}>Cancel</Button>
            <Button variant="gold" onClick={confirmPayment}>Confirm Payment</Button>
          </>
        }
      >
        {paying && (
          <div className="space-y-2 text-sm">
            <p><strong>{paying.member}</strong> is paying the fine for <strong>{paying.book}</strong>.</p>
            <p>Amount received: <strong>{fineFor(paying).toFixed(2)}</strong></p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OverdueBooks;