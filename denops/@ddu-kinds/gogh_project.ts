import type { Denops } from "https://deno.land/x/denops_std@v6.5.0/mod.ts";
import { BaseKind } from "https://deno.land/x/ddu_vim@v4.1.0/types.ts";
import type {
  DduItem,
  PreviewContext,
  Previewer,
} from "https://deno.land/x/ddu_vim@v4.1.0/types.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { exists, expandGlob } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { FileActions } from "https://deno.land/x/ddu_kind_file@v0.7.1/file.ts";
import type { ActionData as FileActionData } from "https://deno.land/x/ddu_kind_file@v0.7.1/file.ts";
import { openUrl } from "../ddu-kind-gogh/browsable.ts";

export type GoghProject = {
  fullFilePath: string;
  relPath: string;
  relFilePath: string;
  host: string;
  owner: string;
  name: string;
  url: string;
};

export type ActionData = FileActionData & GoghProject;

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

type Params = {
  trashCommand: string[];
};

export class Kind extends BaseKind<Params> {
  actions = {
    ...FileActions,
    browse: openUrl,
  };

  async getPreviewer(
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

  override params(): Params {
    return {
      trashCommand: [],
    };
  }
}
