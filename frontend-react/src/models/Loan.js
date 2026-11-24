import BaseModel from "./BaseModel";
import { BORROW_POLICY, LOAN_STATUS } from "../utils/constants";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default class Loan extends BaseModel {
  #userId;
  #copyId;
  #bookTitle;
  #borrowedAt;
  #dueAt;
  #returnedAt;

  constructor(data = {}) {
    super({
      id: data.id,
      createdAt: BaseModel.readField(data, "createdAt", "created_at"),
    });

    this.#userId = BaseModel.readField(data, "userId", "user_id");
    this.#copyId = BaseModel.readField(data, "copyId", "copy_id");
    this.#bookTitle = BaseModel.readField(data, "bookTitle", "book_title", "");

    const borrowedAt = BaseModel.readField(data, "borrowedAt", "borrowed_at");
    const dueAt = BaseModel.readField(data, "dueAt", "due_at");
    const returnedAt = BaseModel.readField(data, "returnedAt", "return_at");

    this.#borrowedAt = borrowedAt ? new Date(borrowedAt) : null;
    this.#dueAt = dueAt ? new Date(dueAt) : null;
    this.#returnedAt = returnedAt ? new Date(returnedAt) : null;
  }

  get userId() {
    return this.#userId;
  }

  get copyId() {
    return this.#copyId;
  }

  get bookTitle() {
    return this.#bookTitle;
  }

  get borrowedAt() {
    return this.#borrowedAt;
  }

  get dueAt() {
    return this.#dueAt;
  }

  get returnedAt() {
    return this.#returnedAt;
  }

  isReturned() {
    return this.#returnedAt !== null;
  }

  // A loan is overdue when the due date has passed. For a returned loan,
  // the return date is compared with the due date instead of today.
  isOverdue() {
    if (!this.#dueAt) return false;
    const reference = this.#returnedAt ?? new Date();
    return reference > this.#dueAt;
  }

  getDaysOverdue() {
    if (!this.isOverdue()) return 0;
    const reference = this.#returnedAt ?? new Date();
    return Math.ceil((reference - this.#dueAt) / MS_PER_DAY);
  }

  // Positive while the book is still within its loan period.
  getDaysRemaining() {
    if (this.isReturned() || !this.#dueAt) return 0;
    return Math.max(0, Math.ceil((this.#dueAt - new Date()) / MS_PER_DAY));
  }

  getFineAmount() {
    return this.getDaysOverdue() * BORROW_POLICY.FINE_PER_DAY;
  }

  getStatus() {
    if (this.isReturned()) return LOAN_STATUS.RETURNED;
    if (this.isOverdue()) return LOAN_STATUS.OVERDUE;
    return LOAN_STATUS.ACTIVE;
  }

  // Polymorphism: this class supplies its own version of the parent's abstract method.
  toPlainObject() {
    return {
      id: this.id,
      userId: this.#userId,
      copyId: this.#copyId,
      bookTitle: this.#bookTitle,
      borrowedAt: this.#borrowedAt,
      dueAt: this.#dueAt,
      returnedAt: this.#returnedAt,
    };
  }
}