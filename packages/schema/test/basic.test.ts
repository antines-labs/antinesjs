import { s } from "../src/index.js";

// Test 1: string schema
const nameSchema = s.string().min(2).max(100);
const nameIR = s.serialize(nameSchema);
console.log("String schema:", JSON.stringify(nameIR, null, 2));
assert(nameIR.type === "string");
assert(nameIR.validations.min === 2);
assert(nameIR.validations.max === 100);

// Test 2: number with int
const ageSchema = s.number().int().min(0).max(150);
const ageIR = s.serialize(ageSchema);
console.log("Number schema:", JSON.stringify(ageIR, null, 2));
assert(ageIR.type === "number");
assert(ageIR.validations.int === true);

// Test 3: object with fields
const userSchema = s.object({
  name: s.string().min(2),
  email: s.string().email(),
  age: { schema: s.number().int(), optional: true },
});
const userIR = s.serialize(userSchema);
console.log("Object schema:", JSON.stringify(userIR, null, 2));
assert(userIR.type === "object");
assert(userIR.fields["name"]!.schema.type === "string");
assert(userIR.fields["age"]!.optional === true);

// Test 4: nested object
const nestedSchema = s.object({
  meta: s.object({
    tags: s.array(s.string()),
    score: s.number(),
  }),
});
const nestedIR = s.serialize(nestedSchema);
console.log("Nested object:", JSON.stringify(nestedIR, null, 2));
assert(nestedIR.type === "object");
const metaField = nestedIR.fields["meta"]!.schema;
assert(metaField.type === "object");
const metaObj = metaField as import("../src/serialize.js").ObjectIR;
assert(metaObj.fields["tags"]!.schema.type === "array");
assert(metaObj.fields["score"]!.schema.type === "number");

// Test 5: enum
const roleSchema = s.enum(["admin", "member", "viewer"]);
const roleIR = s.serialize(roleSchema);
console.log("Enum schema:", JSON.stringify(roleIR, null, 2));
assert(roleIR.type === "enum");
assert(roleIR.values.length === 3);

// Test 6: nullable + optional wrappers
const nullableSchema = s.nullable(s.string());
const nullableIR = s.serialize(nullableSchema);
console.log("Nullable schema:", JSON.stringify(nullableIR, null, 2));
assert(nullableIR.type === "nullable");
assert(nullableIR.inner.type === "string");

// Test 7: array
const tagsSchema = s.array(s.string().min(1)).min(1).max(10).unique();
const tagsIR = s.serialize(tagsSchema);
console.log("Array schema:", JSON.stringify(tagsIR, null, 2));
assert(tagsIR.type === "array");
assert(tagsIR.items.type === "string");
assert(tagsIR.validations.unique === true);

// Test 8: complex real-world schema
const createUserSchema = s.object({
  name: s.string().min(2).max(100),
  email: s.string().email(),
  password: s.string().min(8).max(128),
  role: s.enum(["admin", "member"]),
  profile: s
    .object({
      bio: s.optional(s.string().max(500)),
      avatar: { schema: s.string().url(), optional: true, nullable: true },
      tags: s.array(s.string()).max(20),
    })
    .strict(),
  metadata: s.array(
    s.object({
      key: s.string().min(1),
      value: s.string(),
    }),
  ),
});
const createUserIR = s.serialize(createUserSchema);
console.log("Complex schema:");
console.log(JSON.stringify(createUserIR, null, 2));
assert(createUserIR.type === "object");
const profile = createUserIR.fields["profile"]!.schema as import("../src/serialize.js").ObjectIR;
assert(profile.strict === true);
assert(profile.fields["avatar"]!.nullable === true);
assert(profile.fields["bio"]!.optional === true);

console.log("\n--- All tests passed! ---");

function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg ?? "Assertion failed");
}
