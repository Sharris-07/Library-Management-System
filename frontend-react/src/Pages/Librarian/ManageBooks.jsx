import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";

const CATEGORIES = ["Computer Science", "Databases", "Artificial Intelligence", "Systems and Networks"];

// Sample books for the visual design. They are replaced when the backend is connected.
const INITIAL_BOOKS = [
  { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "9780262046305", category: "Computer Science", publisher: "MIT Press", copies: 3, archived: false },
  { id: 2, title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Computer Science", publisher: "Prentice Hall", copies: 2, archived: false },
  { id: 3, title: "Database System Concepts", author: "Abraham Silberschatz", isbn: "9780078022159", category: "Databases", publisher: "McGraw Hill", copies: 2, archived: false },
  { id: 4, title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", isbn: "9780134610993", category: "Artificial Intelligence", publisher: "Pearson", copies: 2, archived: false },
  { id: 5, title: "Computer Networks", author: "Andrew S. Tanenbaum", isbn: "9780132126953", category: "Systems and Networks", publisher: "Pearson", copies: 1, archived: true },
];

const EMPTY_FORM = { title: "", author: "", isbn: "", category: CATEGORIES[0], publisher: "", copies: "1" };

function ManageBooks() {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [archiveTarget, setArchiveTarget] = useState(null);

  const visibleBooks = useMemo(() => {
    const text = query.trim().toLowerCase();
    return books.filter(
      (book) =>
        !text ||
        book.title.toLowerCase().includes(text) ||
        book.author.toLowerCase().includes(text) ||
        book.isbn.includes(text)
    );
  }, [books, query]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (book) => {
    setEditingId(book.id);
    setForm({ ...book, copies: String(book.copies) });
    setErrors({});
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleSave = () => {
    const found = {};
    if (!form.title.trim()) found.title = "Title is required.";
    if (!form.author.trim()) found.author = "Author is required.";
    if (!form.isbn.trim()) found.isbn = "ISBN is required.";
    if (!(Number(form.copies) >= 1)) found.copies = "Enter at least one copy.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const record = { ...form, copies: Number(form.copies) };
    if (editingId) {
      setBooks((previous) => previous.map((book) => (book.id === editingId ? { ...book, ...record } : book)));
    } else {
      setBooks((previous) => [{ ...record, id: Date.now(), archived: false }, ...previous]);
    }
    setFormOpen(false);
  };

  const confirmArchive = () => {
    setBooks((previous) =>
      previous.map((book) => (book.id === archiveTarget.id ? { ...book, archived: !book.archived } : book))
    );
    setArchiveTarget(null);
  };

  const columns = [
    { key: "title", header: "Title", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "author", header: "Author" },
    { key: "category", header: "Category" },
    { key: "isbn", header: "ISBN" },
    { key: "copies", header: "Copies" },
    { key: "archived", header: "Status", render: (row) => <Badge status={row.archived ? "archived" : "active"} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant={row.archived ? "gold" : "danger"} onClick={() => setArchiveTarget(row)}>
            {row.archived ? "Restore" : "Archive"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="!text-cream text-3xl font-semibold">Manage Books</h1>
          <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
          <p className="text-sm text-cream/90">Add new titles, update details, and archive books no longer in use.</p>
        </div>
        <Button variant="gold" size="lg" onClick={openAdd}>Add New Book</Button>
      </section>

      <div className="md:max-w-md">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, author, or ISBN" />
      </div>

      <Table columns={columns} data={visibleBooks} emptyMessage="No books match your search." />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? "Edit Book" : "Add New Book"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSave}>{editingId ? "Save Changes" : "Add Book"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} required />
          <Input label="Author" name="author" value={form.author} onChange={handleChange} error={errors.author} required />
          <Input label="ISBN" name="isbn" value={form.isbn} onChange={handleChange} error={errors.isbn} required />
          <Input label="Publisher" name="publisher" value={form.publisher} onChange={handleChange} />
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-cocoa">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} className="input-field">
              {CATEGORIES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <Input label="Number of copies" name="copies" type="number" min="1" value={form.copies} onChange={handleChange} error={errors.copies} required />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        title={archiveTarget?.archived ? "Restore Book" : "Archive Book"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button variant={archiveTarget?.archived ? "gold" : "danger"} onClick={confirmArchive}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm">
          {archiveTarget?.archived
            ? `Restore "${archiveTarget?.title}" to the active catalogue?`
            : `Archive "${archiveTarget?.title}"? It will no longer be available for borrowing.`}
        </p>
      </Modal>
    </div>
  );
}

export default ManageBooks;