import type { Denops } from "jsr:@denops/std@~7.3.0";
import type { GatherArguments } from "jsr:@shougo/ddu-vim@~6.4.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~6.4.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.4.0/source";
import { pathshorten } from "jsr:@denops/std@~7.3.0/function";

import type { ActionData, GoghProject } from "../@ddu-kinds/gogh_project.ts";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import { echoerrCommand } from "jsr:@kyoh86/denops-util@~0.1.0/command";

type Params = {
  display: "shorten" | "full-file-path" | "rel-file-path" | "rel-path" | "url";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_project";

  override gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { wait, pipeOut, finalize } = echoerrCommand(denops, "gogh", {
          args: ["list", "--format", "json"],
        });
        await Promise.all([
          pipeOut
            .pipeThrough(new JSONLinesParseStream())
            .pipeThrough(
              new TransformStream<JSONValue, Item<ActionData>>({
                transform: async (value, controller) => {
                  const project = value as GoghProject;
                  controller.enqueue({
                    word: project.relPath,
                    display: await this.displayProject(
                      denops,
                      sourceParams,
                      project,
                    ),
                    action: {
                      ...project,
                      path: project.fullFilePath,
                      isDirectory: true,
                    },
                    treePath: project.fullFilePath,
                    isTree: true,
                  });
                },
              }),
            )
            .pipeTo(
              new WritableStream({
                write: (chunk) => {
                  controller.enqueue([chunk]);
                },
              }),
            ),
          wait,
        ]).finally(async () => {
          await finalize();
          controller.close();
        });
      },
    });
  }

  override params(): Params {
    return {
      display: "rel-path",
    };
  }

  async displayProject(
    denops: Denops,
    sourceParams: Params,
    project: GoghProject,
  ): Promise<string> {
    switch (sourceParams.display) {
      case "shorten":
        return await pathshorten(denops, project.relPath);
      case "rel-path":
        return project.relPath;
      case "rel-file-path":
        return project.relFilePath;
      case "full-file-path":
        return project.fullFilePath;
      default:
        await denops.call(
          "ddu#util#print_error",
          `Invalid display param: ${sourceParams.display}`,
          "ddu-source-gogh",
        );
        return project.fullFilePath;
    }
  }
}
