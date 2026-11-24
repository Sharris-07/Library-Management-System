import { useMemo, useState } from "react";
import SearchBar from "../../components/common/SearchBar";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

// Sample books for the visual design. They are replaced when the backend is connected.
const BOOKS = [
  { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", category: "Computer Science", isbn: "9780262046305", publisher: "MIT Press", total: 3, available: 2, description: "A comprehensive guide to algorithms, data structures, and their analysis." },
  { id: 2, title: "Clean Code", author: "Robert C. Martin", category: "Computer Science", isbn: "9780132350884", publisher: "Prentice Hall", total: 2, available: 1, description: "A handbook of practices for writing readable and maintainable software." },
  { id: 3, title: "Database System Concepts", author: "Abraham Silberschatz", category: "Databases", isbn: "9780078022159", publisher: "McGraw Hill", total: 2, available: 1, description: "Core concepts of relational databases, transactions, and query processing." },
  { id: 4, title: "Operating System Concepts", author: "Abraham Silberschatz", category: "Systems and Networks", isbn: "9781119800361", publisher: "Wiley", total: 2, available: 2, description: "Principles of process management, memory, storage, and security." },
  { id: 5, title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", category: "Artificial Intelligence", isbn: "9780134610993", publisher: "Pearson", total: 2, available: 1, description: "A broad introduction to search, learning, and reasoning." },
  { id: 6, title: "Python Crash Course", author: "Eric Matthes", category: "Computer Science", isbn: "9781718502703", publisher: "No Starch Press", total: 3, available: 3, description: "A practical introduction to programming with hands on projects." },
  { id: 7, title: "Computer Networks", author: "Andrew S. Tanenbaum", category: "Systems and Networks", isbn: "9780132126953", publisher: "Pearson", total: 1, available: 0, description: "Fundamentals of network architecture, protocols, and the internet." },
  { id: 8, title: "Pattern Recognition and Machine Learning", author: "Christopher Bishop", category: "Artificial Intelligence", isbn: "9780387310732", publisher: "Springer", total: 2, available: 2, description: "A foundation for statistical pattern recognition and machine learning." },
];

const CATEGORIES = ["All", "Computer Science", "Databases", "Artificial Intelligence", "Systems and Networks"];

// Full class names so that Tailwind detects them.
const COVER_STYLES = {
  "Computer Science": "from-cocoa to-mocha",
  Databases: "from-mocha to-caramel",
  "Artificial Intelligence": "from-brass-dark to-gold",
  "Systems and Networks": "from-taupe to-cocoa",
};

function Catalogue() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");

  const visibleBooks = useMemo(() => {
    const text = query.trim().toLowerCase();
    return BOOKS.filter((book) => {
      const matchesCategory = category === "All" || book.category === category;
      const matchesText =
        !text ||
        book.title.toLowerCase().includes(text) ||
        book.author.toLowerCase().includes(text) ||
        book.isbn.includes(text);
      return matchesCategory && matchesText;
    });
  }, [query, category]);

  const handleAction = () => {
    const done = selected.available > 0 ? "Borrow request sent for" : "Reservation placed for";
    setNotice(`${done} "${selected.title}".`);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cocoa via-mocha to-brass p-6 shadow-soft">
        <h1 className="!text-cream text-3xl font-semibold">Book Catalogue</h1>
        <div className="my-3 h-1 w-16 rounded bg-gold-gradient" />
        <p className="mb-4 text-sm text-cream/90">Search by title, author, or ISBN and check availability instantly.</p>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, author, or ISBN" />
      </section>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-sm text-green-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === name
                ? "border-brass bg-cocoa text-gold-light shadow-brass"
                : "border-brass/40 bg-white/60 text-cocoa hover:bg-caramel/20"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {visibleBooks.length === 0 ? (
        <div className="card py-12 text-center text-taupe">No books match your search.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {visibleBooks.map((book) => (
            <article key={book.id} className="flex flex-col overflow-hidden rounded-xl border border-brass/40 bg-white/70 shadow-soft transition hover:-translate-y-1 hover:shadow-brass">
              <div className={`flex h-36 items-center justify-center bg-gradient-to-br ${COVER_STYLES[book.category]}`}>
                <span className="font-display text-5xl font-bold text-gold-light">{book.title.charAt(0)}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brass-dark">{book.category}</p>
                <h3 className="mt-1 text-base font-semibold leading-snug">{book.title}</h3>
                <p className="mt-1 text-sm text-taupe">{book.author}</p>
                <div className="mt-3">
                  <Badge status={book.available > 0 ? "available" : "borrowed"}>
                    {book.available > 0 ? `${book.available} of ${book.total} available` : "Currently borrowed"}
                  </Badge>
                </div>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSelected(book)}>
                  View Details
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="gold" onClick={handleAction}>
              {selected?.available > 0 ? "Borrow Book" : "Reserve Book"}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-cocoa">{selected.description}</p>
            <dl className="grid grid-cols-3 gap-y-2">
              <dt className="text-taupe">Author</dt><dd className="col-span-2 font-medium">{selected.author}</dd>
              <dt className="text-taupe">Category</dt><dd className="col-span-2 font-medium">{selected.category}</dd>
              <dt className="text-taupe">Publisher</dt><dd className="col-span-2 font-medium">{selected.publisher}</dd>
              <dt className="text-taupe">ISBN</dt><dd className="col-span-2 font-medium">{selected.isbn}</dd>
              <dt className="text-taupe">Availability</dt>
              <dd className="col-span-2">
                <Badge status={selected.available > 0 ? "available" : "borrowed"}>
                  {selected.available > 0 ? `${selected.available} of ${selected.total} available` : "Currently borrowed"}
                </Badge>
              </dd>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Catalogue;