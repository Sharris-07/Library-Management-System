import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { BORROW_POLICY } from "../../utils/constants";

// Sample log entries for the visual design. They are replaced when the backend is connected.
const LOGS = [
  { id: 1, time: "24 Nov 2026, 10:20", user: "Meera Patel", action: "Issued", detail: "Introduction to Algorithms to Aarav Sharma" },
  { id: 2, time: "24 Nov 2026, 09:45", user: "Meera Patel", action: "Returned", detail: "Clean Code from Sneha Iyer" },
  { id: 3, time: "23 Nov 2026, 17:05", user: "Rohan Mehta", action: "Account", detail: "Deactivated the account of Kabir Singh" },
  { id: 4, time: "23 Nov 2026, 12:40", user: "Meera Patel", action: "Payment", detail: "Recorded a fine payment for Python Crash Course" },
  { id: 5, time: "22 Nov 2026, 15:10", user: "Meera Patel", action: "Catalogue", detail: "Added the book Computer Networks" },
  { id: 6, time: "21 Nov 2026, 11:30", user: "Rohan Mehta", action: "Settings", detail: "Changed the fine per day value" },
];

const ACTION_FILTERS = ["All", "Issued", "Returned", "Payment", "Catalogue", "Account", "Settings"];

const ACTION_BADGE = {
  Issued: "borrowed",
  Returned: "returned",
  Payment: "paid",
  Catalogue: "active",
  Account: "inactive",
  Settings: "default",
};

const LOG_COLUMNS = [
  { key: "time", header: "Time" },
  { key: "user", header: "User", render: (row) => <span className="font-medium">{row.user}</span> },
  { key: "action", header: "Action", render: (row) => <Badge status={ACTION_BADGE[row.action]}>{row.action}</Badge> },
  { key: "detail", header: "Details" },
];

function LogsAndSettings({ initialTab = "logs" }) {
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const [settings, setSettings] = useState({
    loanDays: String(BORROW_POLICY.LOAN_DAYS),
    finePerDay: String(BORROW_POLICY.FINE_PER_DAY),
    maxLoans: String(BORROW_POLICY.MAX_ACTIVE_LOANS),
  });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return LOGS.filter(
      (entry) =>
        (actionFilter === "All" || entry.action === actionFilter) &&
        (!text || entry.user.toLowerCase().includes(text) || entry.detail.toLowerCase().includes(text))
    );
  }, [query, actionFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSettings((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setSaved(false);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const found = {};
    if (!(Number(settings.loanDays) >= 1)) found.loanDays = "Enter at least one day.";
    if (!(Number(settings.finePerDay) >= 0)) found.finePerDay = "Enter zero or a positive amount.";
    if (!(Number(settings.maxLoans) >= 1)) found.maxLoans = "Enter at least one book.";
    setErrors(found);
    setSaved(Object.keys(found).length === 0);
  };

  const tabClass = (name) =>
    `rounded-full border px-5 py-2 text-sm font-medium transition ${
      tab === name ? "border-brass bg-cocoa text-gold-light shadow-brass" : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Logs and Settings</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="text-sm text-cream/90">Review system activity and configure the borrowing policy.</p>
      </section>

      <div className="flex gap-2">
        <button type="button" className={tabClass("logs")} onClick={() => setTab("logs")}>Activity Logs</button>
        <button type="button" className={tabClass("settings")} onClick={() => setTab("settings")}>System Settings</button>
      </div>

      {tab === "logs" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {ACTION_FILTERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActionFilter(name)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    actionFilter === name
                      ? "border-brass bg-cocoa text-gold-light shadow-brass"
                      : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="w-full md:max-w-xs">
              <SearchBar value={query} onChange={setQuery} placeholder="Search by user or detail" />
            </div>
          </div>
          <Table columns={LOG_COLUMNS} data={rows} emptyMessage="No log entries match your selection." />
        </div>
      ) : (
        <form onSubmit={handleSave} noValidate className="card max-w-2xl space-y-4">
          <h2 className="text-xl font-semibold">Borrowing Policy</h2>
          <Input label="Loan period (days)" name="loanDays" type="number" min="1" value={settings.loanDays} onChange={handleChange} error={errors.loanDays} helperText="Number of days a book may be kept." />
          <Input label="Fine per overdue day" name="finePerDay" type="number" min="0" step="0.5" value={settings.finePerDay} onChange={handleChange} error={errors.finePerDay} helperText="Amount charged for each day a book is late." />
          <Input label="Maximum active loans per member" name="maxLoans" type="number" min="1" value={settings.maxLoans} onChange={handleChange} error={errors.maxLoans} helperText="Books one member may hold at the same time." />

          {saved && (
            <p className="rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-800">
              The settings were saved successfully.
            </p>
          )}

          <Button type="submit" variant="gold" size="lg">Save Settings</Button>
        </form>
      )}
    </div>
  );
}

export default LogsAndSettings;