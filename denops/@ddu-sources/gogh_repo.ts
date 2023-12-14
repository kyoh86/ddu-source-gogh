import type { Denops } from "https://deno.land/x/denops_std@v5.2.0/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.8.1/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.8.1/types.ts";
import { TextLineStream } from "https://deno.land/std@0.209.0/streams/text_line_stream.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import { EchomsgStream } from "./gogh_util/msg_stream.ts";
import type { ActionData } from "../@ddu-kinds/gogh_repo.ts";

type Params = {
  display: "url" | "spec";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_repo"; // create action: gogh get

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return this.listRepos(args)
      .pipeThrough(
        new TransformStream<JSONValue, Item<ActionData>>({
          transform: async (value, controller) => {
            const repo = value as ActionData;
            controller.enqueue({
              word: repo.url,
              display: await this.displayProject(args, repo),
              action: repo,
            });
          },
        }),
      )
      .pipeThrough(new ChunkedStream({ chunkSize: 1000 }));
  }

  override params(): Params {
    return {
      display: "spec",
    };
  }

  async displayProject(
    args: { denops: Denops; sourceParams: Params },
    repo: ActionData,
  ): Promise<string> {
    switch (args.sourceParams.display) {
      case "spec":
        return `${repo.spec.host}/${repo.spec.owner}/${repo.spec.name}`;
      case "url":
        return repo.url;
      default:
        await args.denops.call(
          "ddu#util#print_error",
          `Invalid display param: ${args.sourceParams.display}`,
          "ddu-source-gogh",
        );
        return "";
    }
  }

  listRepos({ denops }: { denops: Denops }): ReadableStream<JSONValue> {
    const { status, stderr, stdout } = new Deno.Command("gogh", {
      args: ["repos", "--format", "json"],
      stdin: "null",
      stderr: "piped",
      stdout: "piped",
    }).spawn();
    status.then((status) => {
      if (!status.success) {
        stderr
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new TextLineStream())
          .pipeTo(new EchomsgStream(denops, "gogh-source-repo"));
      }
    });
    return stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());
  }
}
