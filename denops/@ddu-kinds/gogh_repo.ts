import { ActionFlags, type Actions, BaseKind } from "jsr:@shougo/ddu-vim/types";
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
