import BaseModel from "./BaseModel";
import { ROLES, ROLE_HOME } from "../utils/constants";

const ROLE_LABELS = Object.freeze({
  [ROLES.STUDENT]: "Student",
  [ROLES.LIBRARIAN]: "Librarian",
  [ROLES.ADMIN]: "Administrator",
});

export default class User extends BaseModel {
  #name;
  #email;
  #role;
  #status;

  constructor(data = {}) {
    super({
      id: data.id,
      createdAt: BaseModel.readField(data, "createdAt", "created_at"),
    });

    this.#name = data.name ?? "";
    this.#email = data.email ?? "";
    this.#role = data.role ?? ROLES.STUDENT;
    this.#status = data.status ?? "active";
  }

  get name() {
    return this.#name;
  }

  get email() {
    return this.#email;
  }

  get role() {
    return this.#role;
  }

  get status() {
    return this.#status;
  }

  isActive() {
    return this.#status === "active";
  }

  isStudent() {
    return this.#role === ROLES.STUDENT;
  }

  isLibrarian() {
    return this.#role === ROLES.LIBRARIAN;
  }

  isAdmin() {
    return this.#role === ROLES.ADMIN;
  }

  // Used by protected routes to decide whether this user may open a page.
  hasRole(allowedRoles = []) {
    return allowedRoles.includes(this.#role);
  }

  getRoleLabel() {
    return ROLE_LABELS[this.#role] ?? "User";
  }

  // The page opened immediately after login.
  getHomeRoute() {
    return ROLE_HOME[this.#role];
  }

  // Initials shown inside the avatar circle of the navigation bar.
  getInitials() {
    return this.#name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  // Polymorphism: this class supplies its own version of the parent's abstract method.
  // The password is never stored in this object.
  toPlainObject() {
    return {
      id: this.id,
      name: this.#name,
      email: this.#email,
      role: this.#role,
      status: this.#status,
    };
  }
}