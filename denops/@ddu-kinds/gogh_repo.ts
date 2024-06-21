import {
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v4.1.1/types.ts";
import { openUrl } from "../ddu-kind-gogh/browsable.ts";

type Params = Record<string, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    browse: openUrl,
    get: async (args) => {
      await Promise.all(args.items.map(async (item) => {
        await args.denops.call("denops#notify", "ddu-kind-gogh", "get", [
          item.action,
        ]);
      }));
      return ActionFlags.None;
    },
  };

  override params(): Params {
    return {};
  }
}
