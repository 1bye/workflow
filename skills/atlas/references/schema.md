# Atlas model

```json
{
  "title": "OnBot",
  "desc": "Optional one-line summary shown at the root.",
  "nodes": [
    {
      "id": "relay",
      "label": "Relay",
      "kind": "service",
      "desc": "Routes commands and owns shared records.",
      "src": ["apps/server/src/index.ts"],
      "children": [
        { "id": "coordinator", "label": "Coordinator", "kind": "module" }
      ]
    },
    { "id": "db", "label": "App DB", "kind": "db" }
  ],
  "edges": [
    { "from": "relay.coordinator", "to": "db", "label": "SQL", "src": "packages/db/src/client.ts:12" }
  ],
  "flows": [
    {
      "id": "post-message",
      "label": "User posts a message",
      "steps": [
        { "from": "web", "to": "relay.coordinator", "label": "post message" },
        { "from": "relay.coordinator", "to": "db", "label": "commit run" }
      ]
    }
  ]
}
```

## Nodes

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | `[a-z0-9-]`, unique among siblings. A node's path is its ancestors' ids joined by `.` |
| `label` | yes | 1–4 words |
| `kind` | yes | See kinds below |
| `desc` | no | One sentence |
| `src` | no | Array of `path` or `path:line` |
| `inferred` | no | `true` when not confirmed in code |
| `children` | no | Nested nodes; makes the node openable |

Kinds: `actor`, `client`, `service`, `process`, `package`, `module`, `class`,
`function`, `db`, `store`, `queue`, `external`, `group`.

Use `group` for a logical boundary that is not a runtime unit (for example
"OnBot host").

## Edges

`from` and `to` are full node paths. Optional: `label`, `src` (string),
`inferred`, `dir` (`"both"` for two-way traffic).

## Flows

Each flow has `id`, `label`, and ordered `steps` with `from`, `to`, and an
optional `label`. A step may use `from` equal to `to` for work inside one node.
