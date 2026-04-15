import { Hono } from 'hono'
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { dl, entry, insert, readAll } from './db'

const app = new Hono()
app.use(logger(), cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/docs', (c) => {
  const docs = {
    title: 'Books API Documentation',
    baseUrl: 'http://localhost:3000',
    endpoints: [
      {
        method: 'GET',
        path: '/',
        description: 'Welcome message',
        response: 'Hello Hono!'
      },
      {
        method: 'GET',
        path: '/docs',
        description: 'API documentation',
        response: 'This documentation object'
      },
      {
        method: 'GET',
        path: '/books',
        description: 'Get all books',
        response: 'Array of book objects with id, title, and author'
      },
      {
        method: 'POST',
        path: '/books',
        description: 'Create a new book',
        requestBody: {
          title: 'string',
          author: 'string'
        },
        response: { success: true }
      },
      {
        method: 'GET',
        path: '/books/:id',
        description: 'Get a book by ID',
        params: {
          id: 'string (book ID)'
        },
        response: 'Book object with id, title, and author'
      }
    ]
  }
  return c.json(docs, 200)
})

app.get("/books", async (c) => {
  const data = readAll.all()
  return c.json(data, 200)
})

app.post("/books", async (c) => {
  const body = await c.req.json()

  const { title, author } = body;

  insert.run({
    $title: title,
    $author: author
  })

  return c.json({
    success: true
  }, 200)
})

app.get("/books/:id", async (c) => {
  const id = c.req.param("id");

  const en = entry.get({
    $id: id
  })

  return c.json(en, 200)
})

app.delete("/books/:id", async (c) => {
  const id = c.req.param("id")

  dl.run({
    $id: id
  })

  return c.json({succes: true}, 200)
})
export default app
