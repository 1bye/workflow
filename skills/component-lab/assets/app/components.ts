import type { BoundComponent } from "../schema/index";
import { resolveComponents } from "../schema/entries";

const entries = import.meta.glob<{ default: BoundComponent }>("@drafts/components/**/index.ts", {
  eager: true,
});

export default resolveComponents(entries);
