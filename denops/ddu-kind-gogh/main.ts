import type { Denops } from "jsr:@denops/std@~7.6.0";
import { ensure, is, maybe } from "jsr:@core/unknownutil@~4.3.0";
import { systemopen } from "jsr:@lambdalisue/systemopen@~1.0.0";
import { isRepoActionData } from "./types.ts";

export function main(denops: Denops) {
  denops.dispatcher = {
    async open(uUrl: unknown, uOpener?: unknown) {
      const url = ensure(uUrl, is.String);
      const opener = maybe(uOpener, is.String);
      if (opener) {
        const command = new Deno.Command(opener, {
          args: [url],
          stdin: "null",
          stdout: "null",
          stderr: "null",
        });
        const proc = command.spawn();
        await proc.status;
      } else {
        await systemopen(url);
      }
    },
    async get(uAction: unknown) {
      const action = ensure(uAction, isRepoActionData);
      const spec = "spec" in action ? action.spec : action.ref;
      const command = new Deno.Command("gogh", {
        args: ["get", spec.owner + "/" + spec.name],
      });
      const proc = command.spawn();
      await proc.status;
    },
  };
}
