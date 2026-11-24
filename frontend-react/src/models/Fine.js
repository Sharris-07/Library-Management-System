import BaseModel from "./BaseModel";
import { PAYMENT_STATUS } from "../utils/constants";

export default class Fine extends BaseModel {
  #loanId;
  #userId;
  #bookTitle;
  #amount;
  #paymentStatus;

  constructor(data = {}) {
    super({
      id: data.id,
      createdAt: BaseModel.readField(data, "createdAt", "created_at"),
    });

    this.#loanId = BaseModel.readField(data, "loanId", "loan_id");
    this.#userId = BaseModel.readField(data, "userId", "user_id");
    this.#bookTitle = BaseModel.readField(data, "bookTitle", "book_title", "");
    this.#amount = Number(data.amount ?? 0);
    this.#paymentStatus = BaseModel.readField(
      data,
      "paymentStatus",
      "payment_status",
      PAYMENT_STATUS.UNPAID
    );
  }

  get loanId() {
    return this.#loanId;
  }

  get userId() {
    return this.#userId;
  }

  get bookTitle() {
    return this.#bookTitle;
  }

  get amount() {
    return this.#amount;
  }

  get paymentStatus() {
    return this.#paymentStatus;
  }

  isPaid() {
    return this.#paymentStatus === PAYMENT_STATUS.PAID;
  }

  isUnpaid() {
    return !this.isPaid();
  }

  // Amount shown in tables, always with two decimal places.
  getFormattedAmount() {
    return this.#amount.toFixed(2);
  }

  // Polymorphism: this class supplies its own version of the parent's abstract method.
  toPlainObject() {
    return {
      id: this.id,
      loanId: this.#loanId,
      userId: this.#userId,
      bookTitle: this.#bookTitle,
      amount: this.#amount,
      paymentStatus: this.#paymentStatus,
    };
  }

  // Static helper: the total of all unpaid fines in a list.
  static getTotalUnpaid(fines = []) {
    return fines
      .filter((fine) => fine.isUnpaid())
      .reduce((total, fine) => total + fine.amount, 0);
  }
}