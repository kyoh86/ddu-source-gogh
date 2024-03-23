import {
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";
import { openUrl } from "../ddu-kind-gogh/browsable.ts";

export type ActionData = {
  updatedAt?: string;
  spec: {
    host?: string;
    owner: string;
    name: string;
  };
  url: string;
  description?: string;
  homepage?: string;
  language?: string;
  archived?: boolean;
  private?: boolean;
  isTemplate?: boolean;
};

type Params = Record<string, never>;

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    browse: openUrl,
    get: async (args) => {
      await Promise.all(args.items.map(async (item) => {
        const action = item?.action as ActionData;
        try {
          const command = new Deno.Command("gogh", {
            args: ["get", action.spec.owner + "/" + action.spec.name],
          });
          command.spawn();

          await command.output();
        } catch (e) {
          await args.denops.call(
            "ddu#util#print_error",
            `gogh get ${action.url} is failed.`,
          );

          if (e instanceof Error) {
            await args.denops.call(
              "ddu#util#print_error",
              e.message,
            );
          }
        }
      }));
      return ActionFlags.None;
    },
  };

  override params(): Params {
    return {};
  }
}
