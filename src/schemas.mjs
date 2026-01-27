import { LIBS } from "./libs.mjs";
const { z } = LIBS;

/**
 * Schema for individual debt items
 */
export const DebtSchema = z.object({
  caseID: z.string(),
  totalAmount: z.number(),
  originalAmount: z.number(),
  interestAndFines: z.number().optional(),
  originalDueDate: z.date().optional(),
  debtCollectorName: z.string(),
  originalCreditorName: z.string(), 
  debtType: z.string().optional(),
  comment: z.string().optional(),
});


/*
{
totalAmount: float,
originalAmount: float,
interestAndFines: float,
caseID: String,
debtCollectorName: String,
creditorName: String,
debtType: String,
comment: String
}
*/

/**
 * Schema for debt collection data
 */
export const DebtCollectionSchema = z.object({
  creditSite: z.string(),
  debts: z.array(DebtSchema),
  isCurrent: z.boolean(),
  totalAmount: z.number(),
});

/**
 * Schema for Intrum debt case - strict version requiring all fields
 */
export const IntrumDebtCaseSchema = z.object({
  caseNumber: z.string().min(1, "Case number cannot be empty"),
  totalAmount: z.string().min(1, "Total amount is required"),
  creditorName: z.string().min(1, "Creditor name is required"),
});

/**
 * Schema for Intrum manually found debt file
 * Automatically filters out incomplete cases during validation
 */
export const IntrumManualDebtSchema = z.object({
  debtCases: z
    .array(IntrumDebtCaseSchema)
    .transform((cases) =>
      cases.filter((c) => c.caseNumber && c.totalAmount && c.creditorName)
    ),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime string",
  }),
});

/**
 * Schema for Intrum detailed case information
 */
export const IntrumDetailedCaseSchema = z.object({
  caseNumber: z.string(),
  details: z.record(z.string(), z.any()),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime string",
  }),
});

/**
 * Schema for Kredinor manually found debt
 */
export const KredinorManualDebtSchema = z.object({
  debtAmount: z.number(),
  activeCases: z.int(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime string",
  }),
});

/**
 * Schema for Kredinor full debt details
 */
export const KredinorFullDebtDetailsSchema = z.object({
  debtList: z.array(z.string()),
  creditorList: z.array(z.string()),
  saksnummerList: z.array(z.string()),
});

/**
 * Schema for general saved file metadata
 */
export const SavedFileMetadataSchema = z.object({
  creditor: z.string(),
  userId: z.string(),
  date: z.string(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime string",
  }),
  dataType: z.string(),
});

/**
 * Helper function to validate and save JSON data with schema validation
 * @param {string} filePath - Path to save the file
 * @param {any} data - Data to save
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveValidatedJSON = async (filePath, data, schema) => {
  const fs = require("fs/promises");

  // Validate data against schema
  const validatedData = schema.safeParse(data);

  if (!validatedData.success) {
    const error = validatedData.error;
    console.warn("❌ Validation error:", error.issues);
    console.warn("Failed to validate data for:", filePath);

    // Save anyway but with _unvalidated suffix for debugging
    const unvalidatedPath = filePath.replace(".json", "_unvalidated.json");
    await fs.writeFile(
      unvalidatedPath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    console.log(`⚠️  Saved unvalidated data to ${unvalidatedPath}`);
    console.log("About to write following");
    console.error(error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "));

    return {
      success: false,
      error: `Validation failed: ${error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
    };
  }
  
  
  // Save to file
  await fs.writeFile(
    filePath,
    JSON.stringify(validatedData.data, null, 2),
    "utf-8"
  );
  
  
  console.log(`✓ Validated and saved data to ${filePath}`);
  return { success: true };
};

/**
 * Helper function to safely parse validated data
 * @param {string} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {any|null} - Validated data or null if validation fails
 */
export const safeParseData = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Data validation error:", error.errors);
    }
    return null;
  }
};
