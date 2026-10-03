export const profiles = {
  core: { language: "ts", section: null, skills: [] },
  web: {
    language: "ts",
    section: "React web",
    skills: ["vercel-react-best-practices", "vercel-composition-patterns"],
  },
  "bun-api": { language: "ts", section: "Bun API", skills: [] },
  "workers-api": { language: "ts", section: "Workers API", skills: [] },
  desktop: {
    language: "ts",
    section: "Desktop",
    skills: ["vercel-react-best-practices", "vercel-composition-patterns"],
  },
  mobile: { language: "ts", section: "Mobile", skills: ["vercel-composition-patterns"] },
  library: { language: "ts", section: "Library and CLI", skills: [] },
  workspace: { language: "ts", section: "Workspace layer", skills: ["turborepo"] },
  rust: { language: "rust", section: null, skills: ["rust-development"] },
  "rust-library": { language: "rust", section: "Library", skills: ["rust-development"] },
  "rust-cli": { language: "rust", section: "CLI", skills: ["rust-development"] },
  "rust-async": { language: "rust", section: "Async service", skills: ["rust-development"] },
  "rust-native-wasm": {
    language: "rust",
    section: "Native and WASM",
    skills: ["rust-development"],
  },
  "rust-workspace": { language: "rust", section: "Workspace layer", skills: ["rust-development"] },
} as const;

export const skillSources = {
  bro: "ts/skills/bro",
  unslop: "ts/skills/unslop",
  tdd: "ts/skills/tdd",
  ultracite: "ts/skills/ultracite",
  turborepo: "ts/skills/turborepo",
  "vercel-react-best-practices": "ts/skills/vercel-react-best-practices",
  "vercel-composition-patterns": "ts/skills/vercel-composition-patterns",
  shadcn: "ts/skills/shadcn",
  "rust-development": "rust/skills/rust-development",
} as const;

export type Profile = keyof typeof profiles;
export type Language = (typeof profiles)[Profile]["language"];
export type Skill = keyof typeof skillSources;
export const skills = Object.keys(skillSources) as Skill[];
