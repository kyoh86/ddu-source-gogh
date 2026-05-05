import type { Denops } from "@denops/std";
import { BaseKind } from "@shougo/ddu-vim/kind";
import type { DduItem, PreviewContext, Previewer } from "@shougo/ddu-vim/types";
import { join } from "@std/path";
import { exists, expandGlob } from "@std/fs";
import {
  type ActionData as FileActionData,
  FileActions,
} from "@shougo/ddu-kind-file";
import { openUrl } from "../../ddu-kind-gogh/browsable.ts";
import { is, type Predicate } from "@core/unknownutil";

export type GoghWorktree = {
  repo: string;
  branch: string;
  commit: string;
  path: string;
};

export const isGoghWorktree = is.ObjectOf({
  repo: is.String,
  branch: is.String,
  commit: is.String,
  path: is.String,
}) satisfies Predicate<GoghWorktree>;

export type ActionData = FileActionData & GoghWorktree;

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

  override params(): Params {
    return {
      trashCommand: [],
    };
  }
}
