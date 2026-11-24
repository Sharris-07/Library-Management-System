import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { ROLES } from "../../utils/constants";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { value: ROLES.STUDENT, label: "Student" },
  { value: ROLES.LIBRARIAN, label: "Librarian" },
  { value: ROLES.ADMIN, label: "Administrator" },
];

// Sample accounts for the visual design. They are replaced when the backend is connected.
const INITIAL_USERS = [
  { id: 1, name: "Rohan Mehta", email: "rohan@college.edu", role: ROLES.ADMIN, status: "active" },
  { id: 2, name: "Meera Patel", email: "meera.p@college.edu", role: ROLES.LIBRARIAN, status: "active" },
  { id: 3, name: "Arjun Nair", email: "arjun@college.edu", role: ROLES.LIBRARIAN, status: "active" },
  { id: 4, name: "Aarav Sharma", email: "aarav@college.edu", role: ROLES.STUDENT, status: "active" },
  { id: 5, name: "Kabir Singh", email: "kabir@college.edu", role: ROLES.STUDENT, status: "inactive" },
];

const FILTERS = [{ key: "all", label: "All" }, ...ROLE_OPTIONS.map((item) => ({ key: item.value, label: item.label }))];

function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES.LIBRARIAN });
  const [errors, setErrors] = useState({});

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return users.filter(
      (account) =>
        (filter === "all" || account.role === filter) &&
        (!text || account.name.toLowerCase().includes(text) || account.email.toLowerCase().includes(text))
    );
  }, [users, query, filter]);

  const openForm = () => {
    setForm({ name: "", email: "", role: ROLES.LIBRARIAN });
    setErrors({});
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleAdd = () => {
    const found = {};
    if (!form.name.trim()) found.name = "Full name is required.";
    if (!form.email.trim()) found.email = "Email address is required.";
    else if (!EMAIL_PATTERN.test(form.email)) found.email = "Enter a valid email address.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setUsers((previous) => [
      { id: Date.now(), name: form.name.trim(), email: form.email.trim(), role: form.role, status: "active" },
      ...previous,
    ]);
    setFormOpen(false);
  };

  const changeRole = (id, role) => {
    setUsers((previous) => previous.map((account) => (account.id === id ? { ...account, role } : account)));
  };

  const toggleStatus = (id) => {
    setUsers((previous) =>
      previous.map((account) =>
        account.id === id ? { ...account, status: account.status === "active" ? "inactive" : "active" } : account
      )
    );
  };

  const columns = [
    { key: "name", header: "Name", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <select
          value={row.role}
          onChange={(event) => changeRole(row.id, event.target.value)}
          aria-label={`Role of ${row.name}`}
          className="input-field !w-auto !py-1.5"
        >
          {ROLE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      ),
    },
    { key: "status", header: "Status", render: (row) => <Badge status={row.status} /> },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <Button size="sm" variant={row.status === "active" ? "danger" : "gold"} onClick={() => toggleStatus(row.id)}>
          {row.status === "active" ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="!text-cream text-3xl font-semibold">User Management</h1>
          <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
          <p className="text-sm text-cream/90">Create librarian accounts, assign roles, and control account access.</p>
        </div>
        <Button variant="gold" size="lg" onClick={openForm}>Add Account</Button>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === item.key
                  ? "border-brass bg-cocoa text-gold-light shadow-brass"
                  : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="w-full md:max-w-xs">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or email" />
        </div>
      </div>

      <Table columns={columns} data={rows} emptyMessage="No accounts match your selection." />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleAdd}>Create Account</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          <Input label="Email address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required />
          <div>
            <label htmlFor="new-role" className="mb-1 block text-sm font-medium text-cocoa">Role</label>
            <select id="new-role" name="role" value={form.role} onChange={handleChange} className="input-field">
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UserManagement;