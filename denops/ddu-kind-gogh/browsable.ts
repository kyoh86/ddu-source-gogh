import { ensure, is, maybe } from "@core/unknownutil";
import {
  type ActionArguments,
  ActionFlags,
  type BaseParams,
} from "@shougo/ddu-vim/types";

export async function openUrl<
  T extends BaseParams,
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
