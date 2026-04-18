"use client";

import { useState } from "react";
import { Editor } from "@justin06lee/hellatuff";

export default function Page() {
  const [saved, setSaved] = useState<string>("");

  return (
    <main>
      <Editor
        articlePath={["docs", "hello"]}
        initialRaw={"# Hello\n\nWrite something."}
        onSave={async (raw) => {
          setSaved(raw);
          return { version: String(Date.now()), message: "Saved (in memory)" };
        }}
      />
      <pre style={{ marginTop: "2rem", whiteSpace: "pre-wrap" }}>{saved}</pre>
    </main>
  );
}
