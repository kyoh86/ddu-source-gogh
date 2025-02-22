import type { Denops } from "jsr:@denops/std@~7.5.0";

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
