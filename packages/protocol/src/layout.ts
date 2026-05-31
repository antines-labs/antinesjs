import type { SchemaIR, ObjectIR } from "@antines/schema";
import { FieldType, FieldCategory, type FieldLayout, type CompiledLayout } from "./types.js";

/**
 * Resolve a SchemaIR node to its wire type, category, and fixed size.
 * Mirrors Go's fieldTypeAndSize.
 */
function fieldTypeAndSize(s: SchemaIR): [FieldType, FieldCategory, number] {
  switch (s.type) {
    case "string":
      return [FieldType.String, FieldCategory.Variable, 0];
    case "number":
      return [FieldType.Number, FieldCategory.Fixed, 8];
    case "boolean":
      return [FieldType.Boolean, FieldCategory.Fixed, 1];
    case "enum":
      return [FieldType.Enum, FieldCategory.Fixed, 2];
    case "date":
      return [FieldType.Date, FieldCategory.Fixed, 8];
    case "array":
      return [FieldType.Array, FieldCategory.Variable, 0];
    case "object":
      return [FieldType.Object, FieldCategory.Variable, 0];
    case "nullable": {
      if (!s.inner) throw new Error("nullable: missing inner schema");
      const [innerType, innerCat, innerSize] = fieldTypeAndSize(s.inner);
      if (innerCat === FieldCategory.Fixed) {
        return [innerType, FieldCategory.Fixed, innerSize + 1];
      }
      return [innerType, FieldCategory.Variable, 0];
    }
    case "optional": {
      if (!s.inner) throw new Error("optional: missing inner schema");
      // In object field context: bitmask handles optionality, unwrap to inner type
      return fieldTypeAndSize(s.inner);
    }
    default:
      throw new Error(`unknown schema type: ${(s as SchemaIR).type}`);
  }
}

/**
 * Calculate the wire format layout from a SchemaIR object schema.
 * Mirrors Go's CalculateLayout.
 */
export function calculateLayout(s: ObjectIR): CompiledLayout {
  const fields: FieldLayout[] = [];
  let fixedSize = 0;
  let bitmaskBit = 0;
  let variableCount = 0;

  const fieldNames = s.fieldOrder ?? Object.keys(s.fields);

  for (const name of fieldNames) {
    const f = s.fields[name];
    if (!f) continue;

    const [ft, cat, size] = fieldTypeAndSize(f.schema);

    const fl: FieldLayout = {
      name,
      fieldType: ft,
      category: cat,
      offset: 0,
      size: 0,
      bitmaskBit: -1,
      isOptional: f.optional,
      isNullable: f.nullable,
    };

    if (cat === FieldCategory.Fixed) {
      fl.offset = fixedSize;
      fl.size = size;
      fixedSize += size;
    } else {
      fl.offset = variableCount;
      variableCount++;
    }

    if (f.optional) {
      fl.bitmaskBit = bitmaskBit;
      bitmaskBit++;
    }

    fields.push(fl);
  }

  const bitmaskSize = bitmaskBit > 0 ? Math.ceil(bitmaskBit / 8) : 0;

  return {
    fields,
    fixedSize,
    bitmaskSize,
    variableCount,
  };
}
