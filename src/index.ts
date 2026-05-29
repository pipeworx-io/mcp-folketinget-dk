interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Danish Parliament (Folketinget) open data MCP — oda.ft.dk, an OData v3 API.
 *
 * Keyless, live, public. Data is in Danish: field names and most values are
 * Danish (e.g. `titel` = title, `navn` = name, `opdateringsdato` = last-updated).
 *
 * Core entities (Danish names — pass them verbatim as `entity`):
 *   - Sag        — cases / bills / parliamentary matters
 *   - Aktør      — actors: politicians, committees, parties, ministries
 *   - Afstemning — votes (a single roll-call)
 *   - Stemme     — individual member votes within an Afstemning
 *   - Møde       — meetings
 *   - Dokument   — documents
 *   - Sagstrin   — case steps / stages
 *
 * OData v3 query options are passed through verbatim: $filter, $top, $skip,
 * $orderby, $expand, $select. Examples of $filter:
 *   year(opdateringsdato) eq 2024
 *   substringof('klima',titel)
 *   typeid eq 3
 * List endpoints return rows under the `value` array; a by-id fetch returns the
 * single record object directly.
 */


const BASE = 'https://oda.ft.dk/api';
const UA = 'pipeworx-mcp-folketinget-dk/1.0 (+https://pipeworx.io)';

const ENTITY_HINT =
  'Danish entity name: Sag (cases/bills), Aktør (politicians/committees/parties), Afstemning (votes), Stemme (individual votes), Møde (meetings), Dokument, Sagstrin.';

const tools: McpToolExport['tools'] = [
  {
    name: 'query_entity',
    description:
      'Query a Folketinget (Danish Parliament) OData v3 entity collection. Returns matching rows under the `value` array. Fields and values are in Danish (e.g. titel=title, navn=name, opdateringsdato=last-updated). Supports OData $filter/$orderby/$expand/$select with $top/$skip paging. Example filters: "year(opdateringsdato) eq 2024", "substringof(\'klima\',titel)", "typeid eq 3".',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: ENTITY_HINT },
        filter: { type: 'string', description: "OData $filter, e.g. \"year(opdateringsdato) eq 2024\" or \"substringof('klima',titel)\"." },
        top: { type: 'number', description: 'OData $top — max rows to return (default 20).' },
        skip: { type: 'number', description: 'OData $skip — rows to skip for paging.' },
        orderby: { type: 'string', description: 'OData $orderby, e.g. "opdateringsdato desc".' },
        expand: { type: 'string', description: 'OData $expand — related entities to inline, e.g. "Stemme" or "Sagstrin".' },
        select: { type: 'string', description: 'OData $select — comma-separated fields, e.g. "id,titel,opdateringsdato".' },
      },
      required: ['entity'],
    },
  },
  {
    name: 'get_entity_by_id',
    description:
      'Fetch a single Folketinget entity record by its numeric id, e.g. Sag(1). Returns the record object directly (not wrapped in `value`). Use $expand to inline related entities.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', description: ENTITY_HINT },
        id: { type: 'number', description: 'Numeric id of the record.' },
        expand: { type: 'string', description: 'OData $expand — related entities to inline, e.g. "Sagstrin" or "Stemme".' },
        select: { type: 'string', description: 'OData $select — comma-separated fields.' },
      },
      required: ['entity', 'id'],
    },
  },
  {
    name: 'search_cases',
    description:
      'Convenience search over Sag (cases/bills): finds cases whose Danish title (titel) contains a substring. Sorted by most recently updated. Use this to look up legislation/matters by keyword; for full control use query_entity.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Substring to match in the Danish case title (titel), e.g. "klima", "skat", "sundhed".' },
        top: { type: 'number', description: 'Max rows to return (default 20).' },
        skip: { type: 'number', description: 'Rows to skip for paging.' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'query_entity': {
      const entity = entityName(args);
      const params = new URLSearchParams({ $top: String(numArg(args.top, 20)) });
      if (typeof args.filter === 'string' && args.filter.trim()) params.set('$filter', args.filter);
      if (typeof args.orderby === 'string' && args.orderby.trim()) params.set('$orderby', args.orderby);
      if (typeof args.expand === 'string' && args.expand.trim()) params.set('$expand', args.expand);
      if (typeof args.select === 'string' && args.select.trim()) params.set('$select', args.select);
      if (args.skip !== undefined) params.set('$skip', String(numArg(args.skip, 0)));
      return ftGet(`/${encodeURIComponent(entity)}?${params.toString()}`);
    }
    case 'get_entity_by_id': {
      const entity = entityName(args);
      const id = numArg(args.id, NaN);
      if (!Number.isFinite(id)) throw new Error('Required argument "id" must be a number, e.g. 1.');
      const params = new URLSearchParams();
      if (typeof args.expand === 'string' && args.expand.trim()) params.set('$expand', args.expand);
      if (typeof args.select === 'string' && args.select.trim()) params.set('$select', args.select);
      const qs = params.toString();
      return ftGet(`/${encodeURIComponent(entity)}(${id})${qs ? `?${qs}` : ''}`);
    }
    case 'search_cases': {
      const query = reqStr(args, 'query', '"klima"');
      const safe = query.replace(/'/g, "''");
      const params = new URLSearchParams({
        $filter: `substringof('${safe}',titel)`,
        $orderby: 'opdateringsdato desc',
        $top: String(numArg(args.top, 20)),
      });
      if (args.skip !== undefined) params.set('$skip', String(numArg(args.skip, 0)));
      return ftGet(`/Sag?${params.toString()}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ftGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Folketinget: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function entityName(args: Record<string, unknown>): string {
  return reqStr(args, 'entity', '"Sag"').trim();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

function numArg(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
