import BaseModel from "./BaseModel";
import { COPY_STATUS } from "../utils/constants";

export default class Book extends BaseModel {
  #title;
  #isbn;
  #publisher;
  #category;
  #description;
  #authors;
  #copies;
  #archived;

  constructor(data = {}) {
    super({
      id: data.id,
      createdAt: BaseModel.readField(data, "createdAt", "created_at"),
    });

    this.#title = data.title ?? "";
    this.#isbn = data.isbn ?? "";
    this.#publisher = data.publisher ?? "";
    this.#category = data.category ?? "";
    this.#description = data.description ?? "";
    this.#authors = data.authors ?? [];
    this.#copies = data.copies ?? [];
    this.#archived = Boolean(data.archived);
  }

  get title() {
    return this.#title;
  }

  get isbn() {
    return this.#isbn;
  }

  get publisher() {
    return this.#publisher;
  }

  get category() {
    return this.#category;
  }

  get description() {
    return this.#description;
  }

  get authors() {
    return [...this.#authors];
  }

  get copies() {
    return [...this.#copies];
  }

  get isArchived() {
    return this.#archived;
  }

  getAuthorNames() {
    return this.#authors.join(", ");
  }

  getTotalCopies() {
    return this.#copies.length;
  }

  getAvailableCopies() {
    return this.#copies.filter((copy) => copy.status === COPY_STATUS.AVAILABLE)
      .length;
  }

  isAvailable() {
    return !this.#archived && this.getAvailableCopies() > 0;
  }

  // Short text for badges, for example "3 of 5 available".
  getAvailabilityLabel() {
    return `${this.getAvailableCopies()} of ${this.getTotalCopies()} available`;
  }

  // Polymorphism: this class supplies its own version of the parent's abstract method.
  toPlainObject() {
    return {
      id: this.id,
      title: this.#title,
      isbn: this.#isbn,
      publisher: this.#publisher,
      category: this.#category,
      description: this.#description,
      authors: this.#authors,
      archived: this.#archived,
    };
  }
}