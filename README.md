# folketinget-dk

Danish Parliament (Folketinget) open data: cases, actors, votes, meetings and
documents, plus the full text of a published document.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

Source: Folketinget, parliamentary data service and document register. Keyless,
live, public. Field names and values are Danish.

## Tools

- `query_entity` -- OData query over any entity (`Sag`, `Aktør`, `Afstemning`, `Møde`, `Dokument`, ...).
- `get_entity_by_id` -- one record by numeric id, with `$expand`.
- `search_cases` -- cases/bills whose title contains a substring.
- `document_text` -- the extracted TEXT of a `Dokument` by id (a minister's
  answer to a committee question, a bill text, ...). Returns title, date,
  question wording, who answered, the text, and a `reason` whenever no text
  could be returned (`no_file`, `file_blocked`, `no_extractable_text`, ...), so
  an empty result is never ambiguous. The file format is detected from the
  bytes, not from the declared format. Long texts page with `offset`/`max_chars`.

## Provenance

Every `document_text` response carries `source` ("Folketinget, parliamentary
document register"), the document id and `data_as_of`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "folketinget-dk": {
      "url": "https://gateway.pipeworx.io/folketinget-dk/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/folketinget-dk/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/folketinget_dk_query_entity \
  -H 'Content-Type: application/json' \
  -d '{"entity":"Sag","filter":"year(opdateringsdato) eq 2024","top":10,"orderby":"opdateringsdato desc"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/folketinget_dk_query_entity`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-folketinget-dk` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/folketinget-dk/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "folketinget-dk": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-folketinget-dk"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Folketinget Dk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
