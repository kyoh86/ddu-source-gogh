import type { Denops } from "https://deno.land/x/denops_std@v6.1.0/mod.ts";
import {
  ActionFlags,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.10.2/types.ts";
import type {
  ActionArguments,
  DduItem,
  PreviewContext,
  Previewer,
} from "https://deno.land/x/ddu_vim@v3.10.2/types.ts";
import { join } from "https://deno.land/std@0.217.0/path/mod.ts";
import { exists, expandGlob } from "https://deno.land/std@0.217.0/fs/mod.ts";
import { FileActions } from "https://deno.land/x/ddu_kind_file@v0.7.1/file.ts";
import { systemopen } from "https://deno.land/x/systemopen@v0.2.0/mod.ts";
import type { ActionData as FileActionData } from "https://deno.land/x/ddu_kind_file@v0.7.1/file.ts";

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
    browse: async ({ items }: ActionArguments<Params>) => {
      for (const item of items) {
        const { url } = item.action as ActionData;
        if (url) {
          await systemopen(url);
        }
      }
      return ActionFlags.None;
    },
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
