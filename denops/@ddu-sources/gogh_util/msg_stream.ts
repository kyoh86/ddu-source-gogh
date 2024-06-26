import type { Denops } from "https://deno.land/x/denops_std@v6.5.0/mod.ts";

export class EchomsgStream extends WritableStream<string> {
  #cmd = "echomsg";
  constructor(denops: Denops, source: string, errorMsg: boolean = false) {
    super({
      write: async (chunk, _controller) => {
        await denops.cmd(`${this.#cmd} '[${source}]' chunk`, { chunk });
      },
    });
    if (errorMsg) {
      this.#cmd = "echoerr";
    }
  }
}
