import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.5.1/base/source.ts";
import type { ActionData as FileActionData } from "https://deno.land/x/ddu_kind_file@v0.5.3/file.ts";

import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.5.1/types.ts";
import { pathshorten } from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.198.0/streams/text_line_stream.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import { EchomsgStream } from "./gogh_util/msg_stream.ts";

type ActionData = FileActionData;

type Params = {
  display: "shorten" | "full-file-path" | "rel-file-path" | "rel-path" | "url";
};

type GoghProject = {
  fullFilePath: string;
  relPath: string;
  relFilePath: string;
  host: string;
  owner: string;
  name: string;
  url: string;
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_project";

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return this.listProjects(args)
      .pipeThrough(
        new TransformStream<JSONValue, Item<ActionData>>({
          transform: async (value, controller) => {
            const project = value as GoghProject;
            controller.enqueue({
              word: project.relPath,
              display: await this.displayProject(args, project),
              action: {
                path: project.fullFilePath,
                isDirectory: true,
                url: project.url,
              },
              treePath: project.fullFilePath,
              isTree: true,
            });
          },
        }),
      )
      .pipeThrough(new ChunkedStream({ chunkSize: 1000 }));
  }

  override params(): Params {
    return {
      display: "rel-path",
    };
  }

  async displayProject(
    args: { denops: Denops; sourceParams: Params },
    project: GoghProject,
  ): Promise<string> {
    switch (args.sourceParams.display) {
      case "shorten":
        return await pathshorten(args.denops, project.relPath);
      case "rel-path":
        return project.relPath;
      case "rel-file-path":
        return project.relFilePath;
      case "full-file-path":
        return project.fullFilePath;
      default:
        await args.denops.call(
          "ddu#util#print_error",
          `Invalid display param: ${args.sourceParams.display}`,
          "ddu-source-gogh",
        );
        return project.fullFilePath;
    }
  }

  listProjects({ denops }: { denops: Denops }): ReadableStream<JSONValue> {
    const { status, stderr, stdout } = new Deno.Command("gogh", {
      args: ["list", "--format", "json"],
      stdin: "null",
      stderr: "piped",
      stdout: "piped",
    }).spawn();
    status.then((status) => {
      if (!status.success) {
        stderr
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new TextLineStream())
          .pipeTo(new EchomsgStream(denops, "gogh-source-project", true));
      }
    });
    return stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());
  }
}
