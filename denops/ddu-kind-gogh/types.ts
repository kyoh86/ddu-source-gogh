import { is } from "https://deno.land/x/unknownutil@v3.18.0/mod.ts";

export const isRepoActionData = is.ObjectOf({
  updatedAt: is.OptionalOf(is.String),
  spec: is.ObjectOf({
    host: is.OptionalOf(is.String),
    owner: is.String,
    name: is.String,
  }),
  url: is.String,
  description: is.OptionalOf(is.String),
  homepage: is.OptionalOf(is.String),
  language: is.OptionalOf(is.String),
  archived: is.OptionalOf(is.Boolean),
  private: is.OptionalOf(is.Boolean),
  isTemplate: is.OptionalOf(is.Boolean),
});

export type RepoActionData = {
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
