import { LIBS } from "../libs.mjs";
const { z } = LIBS;

/**
 * Schema for individual debt items
 */
export const DebtSchema = z.object({
  caseID: z.string(),
  totalAmount: z.number(),
  originalAmount: z.number().optional(),
  interestAndFines: z.number().optional(),
  originalDueDate: z.date().optional(),
  debtCollectorName: z.string(),
  originalCreditorName: z.string(), 
  debtType: z.string().optional(),
  comment: z.string().optional(),
});

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

// ============================================================================
// Schemas for Structured Debt Collection Documents (PDF Extraction Format)
// ============================================================================

/**
 * Schema for document metadata
 */
export const DocumentMetadataSchema = z.object({
  source: z.string(),
  documentType: z.string(),
  extractionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO 8601 datetime string",
  }),
  pdfPath: z.string().optional(),
  pdfLink: z.string().optional(),
  documentDate: z.string().optional(),
});

/**
 * Schema for case identifiers
 */
export const CaseIdentifiersSchema = z.object({
  caseNumber: z.string(),
  referenceNumber: z.string().optional(),
  customerNumber: z.string().optional(),
});

/**
 * Schema for case amounts breakdown
 */
export const CaseAmountsSchema = z.object({
  totalAmount: z.number(),
  principalAmount: z.number(),
  interest: z.number().optional(),
  fees: z.number().optional(),
  collectionFees: z.number().optional(),
  interestOnCosts: z.number().optional(),
});

/**
 * Schema for case dates
 */
export const CaseDatesSchema = z.object({
  invoiceDate: z.string().optional(),
  originalDueDate: z.string().optional(),
  issuedDate: z.string().optional(),
  paymentDeadline: z.string().optional(),
});

/**
 * Schema for address
 */
export const AddressSchema = z.object({
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

/**
 * Schema for individual invoice
 */
export const InvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
});

/**
 * Schema for debtor information
 */
export const DebtorInfoSchema = z.object({
  name: z.string().optional(),
  nationalId: z.string().optional(),
  address: AddressSchema.optional(),
});

/**
 * Schema for case parties
 */
export const CasePartiesSchema = z.object({
  debtCollector: z.string(),
  currentCreditor: z.string().optional(),
  originalCreditor: z.string().optional(),
  debtor: DebtorInfoSchema.optional(),
});

/**
 * Schema for case details
 */
export const CaseDetailsSchema = z.object({
  caseStatus: z.string().optional(),
  description: z.string().optional(),
  basisForClaim: z.string().optional(),
  invoices: z.array(InvoiceSchema).optional(),
  claimType: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for individual debt case in document
 */
export const DocumentCaseSchema = z.object({
  identifiers: CaseIdentifiersSchema,
  amounts: CaseAmountsSchema,
  dates: CaseDatesSchema,
  parties: CasePartiesSchema,
  details: CaseDetailsSchema.optional(),
});

/**
 * Schema for complete structured debt collection document
 * Use this for validating extracted PDF data
 */
export const StructuredDebtDocumentSchema = z.object({
  documentMetadata: DocumentMetadataSchema,
  totalAmount: z.number(),
  numberOfCases: z.number().int(),
  debtCollector: z.string(),
  cases: z.array(DocumentCaseSchema),
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
    console.warn("Validation error:", error.issues);
    console.warn("Failed to validate data for:", filePath);

    // Save anyway but with _unvalidated suffix for debugging
    const unvalidatedPath = filePath.replace(".json", "_unvalidated.json");
    await fs.writeFile(
      unvalidatedPath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    console.log(`Saved unvalidated data to ${unvalidatedPath}`);
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
  
  
  console.log(`Validated and saved data to ${filePath}`);
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
      console.error("Data validation error:", error.errors);
    }
    return null;
  }
};
