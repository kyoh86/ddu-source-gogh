import type { Denops } from "https://deno.land/x/denops_std@v6.5.0/mod.ts";
import type { GatherArguments } from "https://deno.land/x/ddu_vim@v4.1.1/base/source.ts";
import { BaseSource, Item } from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { ChunkedStream } from "https://deno.land/x/chunked_stream@0.1.4/mod.ts";
import {
  JSONLinesParseStream,
  JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import type { RepoActionData } from "../ddu-kind-gogh/types.ts";
import { echoerrCommand } from "https://denopkg.com/kyoh86/denops-util@master/command.ts";

type Params = {
  display: "url" | "spec";
  limit: number;
};

export class Source extends BaseSource<Params, RepoActionData> {
  override kind = "gogh_repo"; // create action: gogh get

  override gather(
    args: GatherArguments<Params>,
  ): ReadableStream<Item<RepoActionData>[]> {
    return new ReadableStream<Item<RepoActionData>[]>({
      start: async (controller) => {
        const { wait, pipeOut, finalize } = echoerrCommand(
          args.denops,
          "gogh",
          {
            args: [
              "repos",
              "--format",
              "json",
              "--limit",
              args.sourceParams.limit.toString(),
            ],
          },
        );

        await Promise.all([
          pipeOut
            .pipeThrough(new JSONLinesParseStream())
            .pipeThrough(
              new TransformStream<JSONValue, Item<RepoActionData>>({
                transform: async (value, controller) => {
                  const repo = value as RepoActionData;
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
      display: "spec",
      limit: 30,
    };
  }

  async displayProject(
    args: { denops: Denops; sourceParams: Params },
    repo: RepoActionData,
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
