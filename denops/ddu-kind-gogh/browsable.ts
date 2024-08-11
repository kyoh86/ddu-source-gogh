import { ensure, is, maybe } from "jsr:@core/unknownutil@~4.1.0";
import {
  type ActionArguments,
  ActionFlags,
  type BaseActionParams,
} from "jsr:@shougo/ddu-vim/types";

export async function openUrl<
  T extends BaseActionParams,
  U extends { url: string },
>(
  { denops, items, actionParams }: ActionArguments<T>,
) {
  const params = ensure(actionParams, is.Record);
  const opener = maybe(params.opener, is.String);
  for (const item of items) {
    const action = item?.action as U;
    await denops.call("denops#notify", "ddu-kind-gogh", "open", [
      action.url,
      opener,
    ]);
  }
  return ActionFlags.None;
}
