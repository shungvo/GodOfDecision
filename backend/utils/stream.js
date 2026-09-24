/**
 * Send an async iterable of text as one plain text response.
 *
 * The awkward part is the first chunk. Until a byte is on the wire we
 * can still answer with a JSON error; after that the status line is
 * spent and a failure can only end the response early. So the first
 * value is pulled *before* any header is written, and only failures
 * past that point are unreportable.
 *
 * `badRequest` decides which errors are the caller's fault rather than
 * the model's — those come back as 400 instead of 502.
 */
export const streamProse = async (res, iterable, { badRequest, label }) => {
  const iterator = iterable[Symbol.asyncIterator]();

  let first;

  try {
    first = await iterator.next();
  } catch (error) {
    if (badRequest?.(error)) {
      return res.status(400).json({ success: false, error: error.message });
    }

    console.error(`${label} error:`, error);

    return res.status(502).json({
      success: false,
      error: 'Vị thần đang im lặng. Hãy thử lại sau.',
    });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  // Tell any proxy in front of us not to buffer the stream.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    if (!first.done) res.write(first.value);

    for (
      let next = await iterator.next();
      !next.done;
      next = await iterator.next()
    ) {
      res.write(next.value);
    }
  } catch (error) {
    // Headers are already out. Ending early leaves the client with a
    // short reading rather than a broken response.
    console.error(`${label} stream cut short:`, error);
  }

  return res.end();
};
