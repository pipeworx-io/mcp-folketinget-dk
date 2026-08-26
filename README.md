# mcp-folketinget-dk

Danish Parliament (Folketinget) open data MCP — oda.ft.dk, an OData v3 API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `query_entity` | Query a Folketinget (Danish Parliament) OData v3 entity collection. Returns matching rows under the `value` array. Fields and values are in Danish (e.g. titel=title, navn=name, opdateringsdato=last-updated). Supports OData $filter/$orderby/$expand/$select with $top/$skip paging. Example filters: "year(opdateringsdato) eq 2024", "substringof('klima',titel)", "typeid eq 3". |
| `get_entity_by_id` | Fetch a single Folketinget entity record by its numeric id, e.g. Sag(1). Returns the record object directly (not wrapped in `value`). Use $expand to inline related entities. |
| `search_cases` | Convenience search over Sag (cases/bills): finds cases whose Danish title (titel) contains a substring. Sorted by most recently updated. Use this to look up legislation/matters by keyword; for full control use query_entity. |

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

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

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
