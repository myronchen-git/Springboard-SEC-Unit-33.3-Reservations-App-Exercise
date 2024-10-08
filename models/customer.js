/** Customer for Lunchly */

const db = require('../db');
const Reservation = require('./reservation');

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes;
  }

  get notes() {
    return this._notes;
  }

  set notes(str) {
    this._notes = str || '';
  }

  get fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
         first_name AS "firstName",
         last_name AS "lastName",
         phone,
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** Searches for customers by name. */
  static async search(name) {
    let [firstName, lastName] = name.split(' ', 2);
    firstName ||= '';
    lastName ||= '';

    const results = await db.query(
      `SELECT id,
         first_name AS "firstName",
         last_name AS "lastName",
         phone,
         notes
       FROM customers
       WHERE first_name ILIKE $1 AND last_name ILIKE $2
       ORDER BY last_name, first_name`,
      [`%${firstName}%`, `%${lastName}%`]
    );

    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
         first_name AS "firstName",
         last_name AS "lastName",
         phone,
         notes
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this._notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this._notes, this.id]
      );
    }
  }

  /** Gets top 10 customers, ordered by most reservations. */
  static async top10() {
    const results = await db.query(
      `SELECT
        c.id,
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        c.notes,
        COUNT(r.id) AS num_reserv
       FROM customers AS c
       JOIN reservations AS r ON c.id = r.customer_id
       GROUP BY c.id
       ORDER BY num_reserv DESC, last_name, first_name
       LIMIT 10`
    );
    return results.rows.map((c) => new Customer(c));
  }
}

module.exports = Customer;
