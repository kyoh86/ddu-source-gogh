import type { Denops } from "https://deno.land/x/denops_core@v5.0.0/denops.ts";
import type {
  DduItem,
  PreviewContext,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.5.1/types.ts";
import { join } from "https://deno.land/std@0.198.0/path/mod.ts";
import { exists, expandGlob } from "https://deno.land/std@0.198.0/fs/mod.ts";
import { Kind as FileKind } from "https://deno.land/x/ddu_kind_file@v0.5.3/file.ts";

async function searchReadme(dir: string) {
  for (const name of ["README", "README.md", "README.markdown"]) {
    const filepath = join(dir, name);
    if (await exists(filepath, { isReadable: true })) {
      return filepath;
    }
  }
}

async function searchDoc(dir: string) {
  const docPath = join(dir, "doc", "**", "*.txt");
  for await (const entry of expandGlob(docPath)) {
    if (entry.isFile) {
      return entry.path;
    }
  }
}

export class Kind extends FileKind {
  override async getPreviewer(
    args: {
      denops: Denops;
      item: DduItem;
      actionParams: unknown;
      previewContext: PreviewContext;
    },
  ): Promise<Previewer | undefined> {
    const { path } = args.item.action as { path?: string };
    if (!path) return undefined;
    const doc = await searchDoc(path) || await searchReadme(path);
    if (!doc) return undefined;
    return { kind: "buffer", path: doc };
  }
}
