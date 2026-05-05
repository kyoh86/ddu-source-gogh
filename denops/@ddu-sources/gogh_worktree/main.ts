import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";
import { ensure } from "@core/unknownutil";

import {
  type ActionData,
  isGoghWorktree,
} from "../../@ddu-kinds/gogh_worktree/main.ts";
import { iterJSON, iterLine } from "../../ddu-source-gogh/iter.ts";

type Params = Record<PropertyKey, never>;

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_worktree";

  override gather(
    {}: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { status, stderr, stdout } = new Deno.Command("gogh", {
          args: ["worktree", "list", "--format", "json", "--limit", "0"],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();

        for await (const entry of iterJSON(stdout)) {
          const worktree = ensure(entry, isGoghWorktree);
          controller.enqueue([{
            word: worktree.path,
            display: `${worktree.repo} (@${worktree.branch})`,
            action: {
              ...worktree,
            },
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
    return {};
  }
}
