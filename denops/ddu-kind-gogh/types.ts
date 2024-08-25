import { as, is } from "jsr:@core/unknownutil@~4.3.0";

export const isRepoActionData = is.ObjectOf({
  updatedAt: as.Optional(is.String),
  spec: is.ObjectOf({
    host: as.Optional(is.String),
    owner: is.String,
    name: is.String,
  }),
  url: is.String,
  description: as.Optional(is.String),
  homepage: as.Optional(is.String),
  language: as.Optional(is.String),
  archived: as.Optional(is.Boolean),
  private: as.Optional(is.Boolean),
  isTemplate: as.Optional(is.Boolean),
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
