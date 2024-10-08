/** Reservation for Lunchly */

const moment = require('moment');

const db = require('../db');

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this._customerId = customerId;
    this._numGuests = numGuests;
    this._startAt = startAt;
    this._notes = notes;
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(id) {
    if (this._customerId) {
      const err = new Error('Reservation already has customer ID.');
      err.status = 404;
      throw err;
    } else {
      this._customerId = id;
    }
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(n) {
    if (n < 1) {
      const err = new Error(
        'Can not make reservation with less than one guest.'
      );
      err.status = 404;
      throw err;
    }

    this._numGuests = n;
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(date) {
    if (!(date instanceof Date)) {
      const err = new Error('Start date must be a Date object.');
      err.status = 404;
      throw err;
    }

    this._startAt = date;
  }

  get notes() {
    return this._notes;
  }

  set notes(str) {
    this._notes = str || '';
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this._startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
           customer_id AS "customerId",
           num_guests AS "numGuests",
           start_at AS "startAt",
           notes AS "notes"
         FROM reservations
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** save this reservation. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this._customerId, this._startAt, this._numGuests, this._notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
        SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4
        WHERE id=$5`,
        [this._customerId, this._startAt, this._numGuests, this._notes, this.id]
      );
    }
  }
}

module.exports = Reservation;
