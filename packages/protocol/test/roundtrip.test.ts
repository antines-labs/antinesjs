import { calculateLayout } from "../src/layout.js";
import { serializeOutput, deserializeInput } from "../src/serialize.js";
import { encodeHeader, decodeHeader, newHeader } from "../src/header.js";
import { Direction, MessageType } from "../src/types.js";
import type { ObjectIR } from "@antines/schema";

// ---- Header tests ----

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg ?? "Assertion failed");
}

{
  const h = newHeader(Direction.GoToJS, MessageType.Dispatch, 42, 7, 200, 1024);
  const buf = encodeHeader(h);
  const decoded = decodeHeader(buf);

  assert(decoded.magic === 0x414e5453, "magic");
  assert(decoded.version === 0x01, "version");
  assert(decoded.direction === Direction.GoToJS, "direction");
  assert(decoded.msgType === MessageType.Dispatch, "msgType");
  assert(decoded.requestId === 42, "requestId");
  assert(decoded.handlerId === 7, "handlerId");
  assert(decoded.payloadLen === 1024, "payloadLen");
  assert(decoded.statusCode === 200, "statusCode");

  console.log("Header encode/decode");
}

// ---- Layout tests ----

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["age", "active", "role", "createdAt"],
    fields: {
      age: { schema: { type: "number", validations: {} }, optional: false, nullable: false },
      active: { schema: { type: "boolean" }, optional: false, nullable: false },
      role: { schema: { type: "enum", values: ["a", "b"] }, optional: false, nullable: false },
      createdAt: { schema: { type: "date", validations: {} }, optional: false, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);
  assert(layout.fixedSize === 19, `fixedSize: expected 19 got ${layout.fixedSize}`);
  assert(layout.variableCount === 0, `variableCount: expected 0 got ${layout.variableCount}`);
  assert(layout.bitmaskSize === 0, `bitmaskSize: expected 0 got ${layout.bitmaskSize}`);

  console.log("✓ Fixed-only layout");
}

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["id", "age", "name", "email"],
    fields: {
      id: { schema: { type: "string", validations: {} }, optional: false, nullable: false },
      age: {
        schema: { type: "number", validations: { int: true } },
        optional: true,
        nullable: false,
      },
      name: { schema: { type: "string", validations: {} }, optional: false, nullable: false },
      email: { schema: { type: "string", validations: {} }, optional: true, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);
  assert(layout.fixedSize === 8, `fixedSize: expected 8 got ${layout.fixedSize}`);
  assert(layout.variableCount === 3, `variableCount: expected 3 got ${layout.variableCount}`);
  assert(layout.bitmaskSize === 1, `bitmaskSize: expected 1 got ${layout.bitmaskSize}`);

  console.log("✓ Mixed layout");
}

// ---- Serialization round-trip tests ----

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["age", "active"],
    fields: {
      age: { schema: { type: "number", validations: {} }, optional: false, nullable: false },
      active: { schema: { type: "boolean" }, optional: false, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);
  const data = { age: 30, active: true };

  const buf = serializeOutput(layout, data);
  const result = deserializeInput(layout, buf);

  assert(result.age === 30, `age: expected 30 got ${result.age}`);
  assert(result.active === true, `active: expected true got ${result.active}`);

  console.log("✓ Fixed-only round-trip");
}

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["name", "email"],
    fields: {
      name: { schema: { type: "string", validations: {} }, optional: false, nullable: false },
      email: { schema: { type: "string", validations: {} }, optional: true, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);

  // Present
  {
    const buf = serializeOutput(layout, { name: "Alice", email: "alice@example.com" });
    const result = deserializeInput(layout, buf);
    assert(result.name === "Alice", `name: expected Alice got ${result.name}`);
    assert(
      result.email === "alice@example.com",
      `email: expected alice@example.com got ${result.email}`,
    );
  }

  // Absent optional
  {
    const buf = serializeOutput(layout, { name: "Alice" });
    const result = deserializeInput(layout, buf);
    assert(result.name === "Alice", `name: expected Alice got ${result.name}`);
    assert(!("email" in result), `email should be absent, got ${result.email}`);
  }

  console.log("✓ Variable + optional round-trip");
}

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["value"],
    fields: {
      value: { schema: { type: "number", validations: {} }, optional: false, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);

  const testCases = [0, -1, 3.14, 42];
  for (const tc of testCases) {
    const buf = serializeOutput(layout, { value: tc });
    const result = deserializeInput(layout, buf);
    assert(
      Math.abs((result.value as number) - tc) < 0.001,
      `number: expected ${tc} got ${result.value}`,
    );
  }

  console.log("✓ Number precision round-trip");
}

{
  const schema: ObjectIR = {
    type: "object",
    fieldOrder: ["id", "name", "age", "active", "email"],
    fields: {
      id: { schema: { type: "string", validations: {} }, optional: false, nullable: false },
      name: { schema: { type: "string", validations: {} }, optional: false, nullable: false },
      age: {
        schema: { type: "number", validations: { int: true } },
        optional: true,
        nullable: false,
      },
      active: { schema: { type: "boolean" }, optional: false, nullable: false },
      email: { schema: { type: "string", validations: {} }, optional: true, nullable: false },
    },
    strict: false,
  };

  const layout = calculateLayout(schema);

  const input = {
    id: "abc-123",
    name: "Alice",
    age: 30,
    active: true,
  };

  const buf = serializeOutput(layout, input);
  const result = deserializeInput(layout, buf);

  assert(result.id === "abc-123", `id: expected 'abc-123' got ${result.id}`);
  assert(result.name === "Alice", `name: expected Alice got ${result.name}`);
  assert(result.age === 30, `age: expected 30 got ${result.age}`);
  assert(result.active === true, `active: expected true got ${result.active}`);
  assert(!("email" in result), "email should be absent");

  console.log("✓ Mixed fields round-trip");
}

console.log("\n--- All protocol JS tests passed! ---");
