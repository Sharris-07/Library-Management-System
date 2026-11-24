import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sample members for the visual design. They are replaced when the backend is connected.
const INITIAL_MEMBERS = [
  { id: 1, name: "Aarav Sharma", email: "aarav@college.edu", joined: "12 Jul 2026", loans: 2, status: "active" },
  { id: 2, name: "Sneha Iyer", email: "sneha@college.edu", joined: "20 Aug 2026", loans: 1, status: "active" },
  { id: 3, name: "Kabir Singh", email: "kabir@college.edu", joined: "2 Sep 2026", loans: 1, status: "inactive" },
  { id: 4, name: "Meera Joshi", email: "meera@college.edu", joined: "15 Sep 2026", loans: 0, status: "active" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

function Members() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return members.filter(
      (member) =>
        (filter === "all" || member.status === filter) &&
        (!text || member.name.toLowerCase().includes(text) || member.email.toLowerCase().includes(text))
    );
  }, [members, query, filter]);

  const openForm = () => {
    setForm({ name: "", email: "" });
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

    const joined = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    setMembers((previous) => [
      { id: Date.now(), name: form.name.trim(), email: form.email.trim(), joined, loans: 0, status: "active" },
      ...previous,
    ]);
    setFormOpen(false);
  };

  const toggleStatus = (id) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === id ? { ...member, status: member.status === "active" ? "inactive" : "active" } : member
      )
    );
  };

  const columns = [
    { key: "name", header: "Name", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "email", header: "Email" },
    { key: "joined", header: "Joined On" },
    { key: "loans", header: "Active Loans" },
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
          <h1 className="!text-cream text-3xl font-semibold">Members</h1>
          <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
          <p className="text-sm text-cream/90">Register members and manage their account status.</p>
        </div>
        <Button variant="gold" size="lg" onClick={openForm}>Add Member</Button>
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

      <Table columns={columns} data={rows} emptyMessage="No members match your selection." />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleAdd}>Add Member</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          <Input label="Email address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required />
        </div>
      </Modal>
    </div>
  );
}

export default Members;