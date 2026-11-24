// Abstract parent class for every entity model in the application.
// It cannot be instantiated directly; child classes extend it.

export default class BaseModel {
  #id;
  #createdAt;

  constructor({ id = null, createdAt = null } = {}) {
    if (new.target === BaseModel) {
      throw new Error("BaseModel is abstract and cannot be instantiated.");
    }
    this.#id = id;
    this.#createdAt = createdAt ? new Date(createdAt) : null;
  }

  get id() {
    return this.#id;
  }

  get createdAt() {
    return this.#createdAt;
  }

  // Abstract method: every child class must provide its own version.
  toPlainObject() {
    throw new Error("toPlainObject() must be implemented by the child class.");
  }

  // Called automatically by JSON.stringify, for example when sending data to the API.
  toJSON() {
    return this.toPlainObject();
  }

  // The backend language is not confirmed yet, so this helper accepts both
  // camelCase (dueAt) and snake_case (due_at) field names from the API.
  static readField(data, camelKey, snakeKey, fallback = null) {
    if (data == null) return fallback;
    if (data[camelKey] !== undefined) return data[camelKey];
    if (data[snakeKey] !== undefined) return data[snakeKey];
    return fallback;
  }
}