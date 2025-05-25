import type { Denops } from "jsr:@denops/std@~7.5.0";
import type { GatherArguments } from "jsr:@shougo/ddu-vim@~10.3.0/source";
import type { Item } from "jsr:@shougo/ddu-vim@~10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.3.0/source";
import { pathshorten } from "jsr:@denops/std@~7.5.0/function";
import { ensure } from "jsr:@core/unknownutil@~4.3.0";

import {
  type ActionData,
  type GoghProject,
  isGoghProject,
} from "../@ddu-kinds/gogh_project.ts";
import { iterJSON, iterLine } from "../ddu-source-gogh/iter.ts";

type Params = {
  display: "shorten" | "full-file-path" | "rel-file-path" | "rel-path";
};

export class Source extends BaseSource<Params, ActionData> {
  override kind = "gogh_project";

  override gather(
    { denops, sourceParams }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { status, stderr, stdout } = new Deno.Command("gogh", {
          args: ["list", "--format", "json", "--limit", "0"],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();

        for await (const entry of iterJSON(stdout)) {
          const project = ensure(entry, isGoghProject);
          controller.enqueue([{
            word: "relPath" in project ? project.relPath : project.path,
            display: await this.displayProject(
              denops,
              sourceParams,
              project,
            ),
            action: {
              ...project,
              relPath: "relPath" in project ? project.relPath : project.path,
              path: "fullFilePath" in project
                ? project.fullFilePath
                : project.fullPath,
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
        return await pathshorten(
          denops,
          "relPath" in project ? project.relPath : project.path,
        );
      case "rel-path":
        return "relPath" in project ? project.relPath : project.path;
      case "rel-file-path":
        return "relPath" in project ? project.relPath : project.path;
      case "full-file-path":
        return "fullFilePath" in project
          ? project.fullFilePath
          : project.fullPath;
      default:
        await denops.call(
          "ddu#util#print_error",
          `Invalid display param: ${sourceParams.display}`,
          "ddu-source-gogh",
        );
        return "fullFilePath" in project
          ? project.fullFilePath
          : project.fullPath;
    }
  }
}
