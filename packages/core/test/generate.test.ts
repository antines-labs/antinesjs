import { join } from "node:path";
import { generateManifest } from "../src/generate.js";

const routesDir = join(import.meta.dirname, "fixtures", "routes");

const manifest = await generateManifest({ routesDir });

console.log("Generated manifest:");
console.log(JSON.stringify(manifest, null, 2));

assert(manifest.version === 1);
assert(manifest.routes.length === 3);

// route 1: POST /users
const usersPost = manifest.routes[0]!;
assert(usersPost.method === "POST");
assert(usersPost.path === "/users");
assert(usersPost.handlerId === 1);
assert(usersPost.hasHandler === true);
assert(usersPost.params.length === 0);
assert(usersPost.schema.input !== undefined);
assert(usersPost.schema.input.type === "object");
assert(usersPost.schema.output !== undefined);
assert(usersPost.schema.errors?.["email_taken"] !== undefined);
assert(usersPost.schema.errors["email_taken"].status === 409);

// route 2: POST /auth/login
const login = manifest.routes[1]!;
assert(login.method === "POST");
assert(login.path === "/auth/login");
assert(login.handlerId === 2);
assert(login.hasHandler === true);
assert(login.schema.input !== undefined);
assert(login.schema.output !== undefined);
const loginOutput = login.schema.output;
assert(loginOutput.type === "object");
const userField = loginOutput.fields["user"];
assert(userField !== undefined);
assert(userField.schema.type === "object");

// route 3: GET /health (Go-only)
const health = manifest.routes[2]!;
assert(health.method === "GET");
assert(health.path === "/health");
assert(health.handlerId === 3);
assert(health.hasHandler === false);
assert(health.schema.input === undefined);
assert(health.schema.output !== undefined);
assert(health.schema.output.type === "object");

console.log("\n--- All manifest generation tests passed! ---");

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg ?? "Assertion failed");
}
