import {
  ActionFlags,
  Actions,
  BaseKind,
} from "https://deno.land/x/ddu_vim@v3.9.0/types.ts";

import { UrlActions } from "https://denopkg.com/4513ECHO/ddu-kind-url@master/denops/@ddu-kinds/url.ts";

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

type Params = {
  externalOpener: "openbrowser" | "external" | "systemopen" | "uiopen";
};

export class Kind extends BaseKind<Params> {
  override actions: Actions<Params> = {
    browse: UrlActions.browse,
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
    return {
      externalOpener: "systemopen",
    };
  }
}
