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
| `children` | no | Nested nodes |
| `display` | no | How children appear; see below. Default `box` |
| `count` | no | Integer ≥ 2 or `"many"`: draw several instances (max 3 copies) |

## Display

| Value | Drawn as | Use for |
| --- | --- | --- |
| `box` | Closed box; click to open its children as a new canvas | Large or secondary insides |
| `frame` | Open container with children laid out inside, on the same canvas | 2–5 parts that are the point of this level |
| `sections` | Frame split into tight compartments (each child is one) | A unit divided into areas, like `API` and `Runtime` |
| `chips` | Box with children as small tags | 2–8 simple leaves: plugins, skills, MCP |
| `choice` | Box with children as tags separated by "or" | Interchangeable adapters: Pi / Codex / ACP |

Children of `frame` and `sections` can be any display, so a frame can hold a
box you open later. Children of `chips` and `choice` should be leaves. `count`
is allowed on `box`, `chips`, and `choice` only. Edges and flow steps may
target any node; the viewer attaches them to whatever stands for it on screen.

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
