import {
  ensure,
  is,
  maybe,
} from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";
import {
  ActionArguments,
  ActionFlags,
  BaseActionParams,
} from "https://deno.land/x/ddu_vim@v4.1.0/types.ts";

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
