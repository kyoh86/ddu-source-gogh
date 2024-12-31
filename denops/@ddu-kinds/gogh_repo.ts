import { BaseKind } from "jsr:@shougo/ddu-vim@~9.4.0/kind";
import { ActionFlags, type Actions } from "jsr:@shougo/ddu-vim@~9.4.0/types";
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
