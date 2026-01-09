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

export type GoghProject = {
  fullFilePath: string;
  relPath: string;
  relFilePath: string;
  host: string;
  owner: string;
  name: string;
  url: string;
} | {
  fullPath: string;
  path: string;
  host: string;
  owner: string;
  name: string;
};

export const isGoghProject = is.UnionOf([
  is.ObjectOf({
    fullFilePath: is.String,
    relPath: is.String,
    relFilePath: is.String,
    host: is.String,
    owner: is.String,
    name: is.String,
    url: is.String,
  }),
  is.ObjectOf({
    fullPath: is.String,
    path: is.String,
    host: is.String,
    owner: is.String,
    name: is.String,
  }),
]) satisfies Predicate<GoghProject>;

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
