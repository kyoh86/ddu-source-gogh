import type { Denops } from "https://deno.land/x/denops_std@v5.3.0/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v3.10.0/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v3.10.0/types.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.2/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import type { ActionData } from "../@ddu-kinds/gogh_repo.ts";
import { echoerrCommand } from "https://denopkg.com/kyoh86/denops-util@v0.0.6/command.ts";

type Params = {
  display: "url" | "spec";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_repo"; // create action: gogh get

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { waitErr, pipeOut, finalize } = echoerrCommand(
          args.denops,
          "gogh",
          {
            args: ["repos", "--format", "json"],
          },
        );

        await pipeOut
          .pipeThrough(new JSONLinesParseStream())
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
}
