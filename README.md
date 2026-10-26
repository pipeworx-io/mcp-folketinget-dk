# folketinget-dk

Danish Parliament (Folketinget) open data: cases, actors, votes, meetings and
documents, plus the full text of a published document.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1879+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

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

Both URLs reach the same gateway and the same 1879+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/query_entity \
  -H 'Content-Type: application/json' \
  -d '{"entity":"Sag","filter":"year(opdateringsdato) eq 2024","top":10,"orderby":"opdateringsdato desc"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/query_entity`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

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

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-folketinget-dk
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

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
