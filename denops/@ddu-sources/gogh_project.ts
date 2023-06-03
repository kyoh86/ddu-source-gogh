import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v2.9.2/base/source.ts";
import type { ActionData as FileActionData } from "https://deno.land/x/ddu_kind_file@v0.4.2/file.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v2.9.2/types.ts";
import { pathshorten } from "https://deno.land/x/denops_std@v5.0.0/function/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.190.0/streams/text_line_stream.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.1/mod.ts";

type ActionData = FileActionData;

type Params = {
  display: "shorten" | "full-file-path" | "rel-file-path" | "rel-path" | "url";
};

class EchomsgStream extends WritableStream<string> {
  constructor(denops: Denops) {
    super({
      write: async (chunk, _controller) => {
        await denops.cmd("echomsg '[ddu-source-gogh]' chunk", { chunk });
      },
    });
  }
}

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
  override kind = "file";

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
          .pipeTo(new EchomsgStream(denops));
      }
    });
    return stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());
  }
}
