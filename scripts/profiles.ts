export const profiles = {
  core: { section: null, skills: [] },
  web: {
    section: "React web",
    skills: ["vercel-react-best-practices", "vercel-composition-patterns"],
  },
  "bun-api": { section: "Bun API", skills: [] },
  "workers-api": { section: "Workers API", skills: [] },
  desktop: {
    section: "Desktop",
    skills: ["vercel-react-best-practices", "vercel-composition-patterns"],
  },
  mobile: { section: "Mobile", skills: ["vercel-composition-patterns"] },
  library: { section: "Library and CLI", skills: [] },
  workspace: { section: "Workspace layer", skills: ["turborepo"] },
} as const;

export const skills = [
  "tdd",
  "ultracite",
  "turborepo",
  "vercel-react-best-practices",
  "vercel-composition-patterns",
  "shadcn",
] as const;

export type Profile = keyof typeof profiles;
export type Skill = (typeof skills)[number];
