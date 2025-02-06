import {
  JSONLinesParseStream,
  type JSONValue,
} from "https://deno.land/x/jsonlines@v1.2.2/mod.ts";

import { TextLineStream } from "jsr:@std/streams@1.0/text-line-stream";

export async function* iterJSON(
  r: ReadableStream<Uint8Array>,
): AsyncIterable<JSONValue> {
  const lines = r
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new JSONLinesParseStream());
  for await (const line of lines) {
    yield line;
  }
}

export async function* iterLine(
  r: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const lines = r
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  for await (const line of lines) {
    yield line;
  }
}
