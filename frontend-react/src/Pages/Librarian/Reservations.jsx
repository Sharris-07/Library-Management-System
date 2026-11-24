import { useState } from "react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

// Sample reservations for the visual design. They are replaced when the backend is connected.
const INITIAL_RESERVATIONS = [
  { id: 1, member: "Aarav Sharma", book: "Computer Networks", requested: "22 Nov 2026", status: "pending" },
  { id: 2, member: "Sneha Iyer", book: "Artificial Intelligence: A Modern Approach", requested: "20 Nov 2026", status: "ready" },
  { id: 3, member: "Meera Joshi", book: "Clean Code", requested: "23 Nov 2026", status: "pending" },
  { id: 4, member: "Kabir Singh", book: "Introduction to Algorithms", requested: "19 Nov 2026", status: "pending" },
];

function Reservations() {
  const [items, setItems] = useState(INITIAL_RESERVATIONS);
  const [notice, setNotice] = useState("");

  const markReady = (item) => {
    setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, status: "ready" } : entry)));
    setNotice(`"${item.book}" is now ready for ${item.member}.`);
  };

  const complete = (item) => {
    setItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setNotice(`"${item.book}" was issued to ${item.member}.`);
  };

  const cancel = (item) => {
    setItems((previous) => previous.filter((entry) => entry.id !== item.id));
    setNotice(`The reservation of "${item.book}" for ${item.member} was cancelled.`);
  };

  const columns = [
    { key: "member", header: "Member", render: (row) => <span className="font-medium">{row.member}</span> },
    { key: "book", header: "Book" },
    { key: "requested", header: "Requested On" },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === "pending" ? (
            <Button size="sm" variant="secondary" onClick={() => markReady(row)}>Mark Ready</Button>
          ) : (
            <Button size="sm" variant="gold" onClick={() => complete(row)}>Issue Book</Button>
          )}
          <Button size="sm" variant="danger" onClick={() => cancel(row)}>Cancel</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Reservations</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">Manage the queue of members waiting for unavailable books.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: "Pending", value: items.filter((item) => item.status === "pending").length, note: "Waiting for a copy" },
          { label: "Ready for Collection", value: items.filter((item) => item.status === "ready").length, note: "Copy is being held" },
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

      <Table columns={columns} data={items} emptyMessage="There are no active reservations." />
    </div>
  );
}

export default Reservations;