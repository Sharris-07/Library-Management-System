import { useState } from "react";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { BORROW_POLICY } from "../../utils/constants";

// Sample records for the visual design. They are replaced when the backend is connected.
const MEMBERS = ["Aarav Sharma", "Sneha Iyer", "Kabir Singh", "Meera Joshi"];
const AVAILABLE_BOOKS = ["Introduction to Algorithms", "Python Crash Course", "Operating System Concepts", "Clean Code"];

const INITIAL_LOANS = [
  { id: 1, member: "Aarav Sharma", book: "Introduction to Algorithms", due: "28 Nov 2026", daysLate: 0 },
  { id: 2, member: "Aarav Sharma", book: "Clean Code", due: "18 Nov 2026", daysLate: 6 },
  { id: 3, member: "Sneha Iyer", book: "Database System Concepts", due: "21 Nov 2026", daysLate: 3 },
];

const formatDate = (date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function IssueReturn() {
  const [tab, setTab] = useState("issue");
  const [loans, setLoans] = useState(INITIAL_LOANS);
  const [member, setMember] = useState(MEMBERS[0]);
  const [book, setBook] = useState(AVAILABLE_BOOKS[0]);
  const [notice, setNotice] = useState("");
  const [returning, setReturning] = useState(null);

  const dueDate = formatDate(new Date(Date.now() + BORROW_POLICY.LOAN_DAYS * 24 * 60 * 60 * 1000));

  const handleIssue = (event) => {
    event.preventDefault();
    setLoans((previous) => [{ id: Date.now(), member, book, due: dueDate, daysLate: 0 }, ...previous]);
    setNotice(`"${book}" was issued to ${member}. Due on ${dueDate}.`);
  };

  const fineFor = (loan) => loan.daysLate * BORROW_POLICY.FINE_PER_DAY;

  const confirmReturn = () => {
    const fine = fineFor(returning);
    setLoans((previous) => previous.filter((loan) => loan.id !== returning.id));
    setNotice(
      fine > 0
        ? `"${returning.book}" was returned. A fine of ${fine.toFixed(2)} was recorded.`
        : `"${returning.book}" was returned on time.`
    );
    setReturning(null);
  };

  const columns = [
    { key: "member", header: "Member", render: (row) => <span className="font-medium">{row.member}</span> },
    { key: "book", header: "Book" },
    { key: "due", header: "Due Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (row.daysLate > 0 ? <Badge status="overdue">{`${row.daysLate} days overdue`}</Badge> : <Badge status="borrowed">On loan</Badge>),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <Button size="sm" variant="gold" onClick={() => setReturning(row)}>Receive Return</Button>
      ),
    },
  ];

  const tabClass = (name) =>
    `rounded-full border px-5 py-2 text-sm font-medium transition ${
      tab === name ? "border-brass bg-cocoa text-gold-light shadow-brass" : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Issue and Return</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">Lend books to members and receive returned books with automatic fine calculation.</p>
      </section>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-sm text-green-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" className={tabClass("issue")} onClick={() => setTab("issue")}>Issue a Book</button>
        <button type="button" className={tabClass("return")} onClick={() => setTab("return")}>Return a Book</button>
      </div>

      {tab === "issue" ? (
        <form onSubmit={handleIssue} className="card max-w-2xl space-y-4">
          <div>
            <label htmlFor="member" className="mb-1 block text-sm font-medium text-cocoa">Member</label>
            <select id="member" value={member} onChange={(event) => setMember(event.target.value)} className="input-field">
              {MEMBERS.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="book" className="mb-1 block text-sm font-medium text-cocoa">Available book</label>
            <select id="book" value={book} onChange={(event) => setBook(event.target.value)} className="input-field">
              {AVAILABLE_BOOKS.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="rounded-lg border border-brass/40 bg-caramel/10 px-4 py-3 text-sm">
            Loan period: <strong>{BORROW_POLICY.LOAN_DAYS} days</strong>. Due date: <strong>{dueDate}</strong>.
          </div>
          <Button type="submit" variant="gold" size="lg">Issue Book</Button>
        </form>
      ) : (
        <Table columns={columns} data={loans} emptyMessage="There are no books currently on loan." />
      )}

      <Modal
        isOpen={Boolean(returning)}
        onClose={() => setReturning(null)}
        title="Receive Return"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturning(null)}>Cancel</Button>
            <Button variant="gold" onClick={confirmReturn}>Confirm Return</Button>
          </>
        }
      >
        {returning && (
          <div className="space-y-2 text-sm">
            <p><strong>{returning.book}</strong> borrowed by {returning.member}.</p>
            <p>
              Fine to collect:{" "}
              <strong className={fineFor(returning) > 0 ? "text-red-700" : "text-green-800"}>
                {fineFor(returning).toFixed(2)}
              </strong>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default IssueReturn;