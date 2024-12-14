import type { Denops } from "jsr:@denops/std@~7.4.0";
import type { GatherArguments } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~9.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~9.1.0/source";
import { ChunkedStream } from "jsr:@hibiki/chunked-stream@~0.1.4";
import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import type { RepoActionData } from "../ddu-kind-gogh/types.ts";
import { echoerrCommand } from "jsr:@kyoh86/denops-util@~0.1.0/command";

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
