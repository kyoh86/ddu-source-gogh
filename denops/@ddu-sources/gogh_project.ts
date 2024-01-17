import type { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.9.0/base/source.ts";
import type { ActionData, GoghProject } from "../@ddu-kinds/gogh_project.ts";

import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.9.0/types.ts";
import { pathshorten } from "https://deno.land/x/denops_std@v5.2.0/function/mod.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import { echoerrCommand } from "https://denopkg.com/kyoh86/denops-util@v0.0.6/command.ts";

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
        const { waitErr, pipeOut, finalize } = echoerrCommand(denops, "gogh", {
          args: ["list", "--format", "json"],
        });
        await pipeOut
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
          .pipeThrough(new ChunkedStream({ chunkSize: 1000 }))
          .pipeTo(
            new WritableStream({
              write: (chunk) => {
                controller.enqueue(chunk);
              },
            }),
          ).finally(async () => {
            await waitErr;
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
