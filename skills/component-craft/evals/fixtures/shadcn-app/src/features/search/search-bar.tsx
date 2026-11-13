import { useState } from "react";

import { Input } from "@/components/ui/input";

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      <svg aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 16 16">
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" />
      </svg>
      <Input
        type="search"
        aria-label="Search notes"
        placeholder="Search notes"
        className="pl-9"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onSearch(event.target.value);
        }}
      />
    </div>
  );
}
