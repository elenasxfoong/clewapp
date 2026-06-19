import "dotenv/config";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { searchGoogleBooks } from "../src/services/googleBooks";

const port = Number(process.env.API_PORT ?? 3001);

const sendJson = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/books/search") {
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      sendJson(response, 200, []);
      return;
    }

    try {
      const books = await searchGoogleBooks(query);
      sendJson(response, 200, books);
    } catch (error) {
      console.error("Book search failed", error);
      sendJson(response, 500, { error: "Failed to search books" });
    }

    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
