import {Database} from "bun:sqlite"

const db = new Database("mydb.sqlite")

db.run("PRAGMA journal_mode = WAL;");

db.run(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT
  )
`)

// for writing new entry to the database
export const insert = db.prepare("INSERT INTO books (title, author) VALUES ($title, $author)");

// for selecting all the entries from the database
export const readAll = db.prepare("SELECT * FROM books");

// get a specific entry from the database
export const entry = db.prepare("SELECT * FROM books where id = $id");

// delete a book
export const dl = db.prepare("DELETE FROM books where id = $id");
