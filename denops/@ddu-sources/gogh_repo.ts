import type { Denops } from "jsr:@denops/std@~7.5.0";
import type { GatherArguments } from "jsr:@shougo/ddu-vim@~10.2.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~10.2.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.2.0/source";

import type { RepoActionData } from "../ddu-kind-gogh/types.ts";
import { iterJSON, iterLine } from "../ddu-source-gogh/iter.ts";

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
        const { status, stderr, stdout } = new Deno.Command("gogh", {
          args: [
            "repos",
            "--format",
            "json",
            "--limit",
            args.sourceParams.limit.toString(),
          ],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();

        for await (const entry of iterJSON(stdout)) {
          const repo = entry as RepoActionData;
          controller.enqueue([{
            word: repo.url,
            display: await this.displayProject(args, repo),
            action: repo,
          }]);
        }
        const result = await status;
        controller.close();
        if (!result.success) {
          for await (const line of iterLine(stderr)) {
            console.error(line);
          }
        }
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
