// One request per process. stdout is reserved for this JSON envelope.
console.log = (...args) => console.error(...args);
try {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("NDT request exceeds 1 MiB");
    chunks.push(chunk);
  }
  const request = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const { callTool, ndtRevision } = await import("./ndt-runtime.mjs");
  const ndt_revision = await ndtRevision();
  const result = await callTool(request.name, request.arguments);
  process.stdout.write(JSON.stringify({ ok: true, result: { ...result, ndt_revision } }));
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, error: error.message }));
}
