import { JSONLinesParseStream, type JSONValue } from "@kyoh86/jsonlines";

import { TextLineStream } from "@std/streams/text-line-stream";

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
