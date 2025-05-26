import { as, is, type Predicate } from "jsr:@core/unknownutil@~4.3.0";

export const isRepoActionData = is.UnionOf([
  is.ObjectOf({
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
  }),
  is.ObjectOf({
    ref: is.ObjectOf({
      host: is.String,
      owner: is.String,
      name: is.String,
    }),
    url: is.String,
    cloneUrl: as.Optional(is.String),
    updatedAt: is.String,
    parent: as.Optional(is.ObjectOf({
      ref: is.ObjectOf({
        host: is.String,
        owner: is.String,
        name: is.String,
      }),
      cloneUrl: as.Optional(is.String),
    })),
    description: as.Optional(is.String),
    homepage: as.Optional(is.String),
    language: as.Optional(is.String),
    archived: as.Optional(is.Boolean),
    private: as.Optional(is.Boolean),
    isTemplate: as.Optional(is.Boolean),
    fork: as.Optional(is.Boolean),
  }),
]) satisfies Predicate<RepoActionData>;

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
} | {
  ref: {
    host: string;
    owner: string;
    name: string;
  };
  url: string;
  cloneUrl?: string;
  updatedAt: string;
  parent?: {
    ref: {
      host: string;
      owner: string;
      name: string;
    };
    cloneUrl?: string;
  };
  description?: string;
  homepage?: string;
  language?: string;
  archived?: boolean;
  private?: boolean;
  isTemplate?: boolean;
  fork?: boolean;
};
