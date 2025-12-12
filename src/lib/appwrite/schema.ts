import { Permission, Role } from "node-appwrite";

/**
 * Appwrite Database Schema Definition
 * Defines collections, attributes, and indexes for the project.
 */

export const DB_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "kafkasder_db";

export interface Attribute {
  key: string;
  type:
    | "string"
    | "integer"
    | "double"
    | "boolean"
    | "email"
    | "url"
    | "ip"
    | "datetime"
    | "enum";
  size?: number; // For string
  required: boolean;
  array?: boolean;
  default?: string | number | boolean | null;
  elements?: string[]; // For enum
}

export interface Index {
  key: string;
  type: "key" | "fulltext" | "unique";
  attributes: string[];
  orders?: ("ASC" | "DESC")[];
}

export interface CollectionConfig {
  name: string;
  id: string; // collectionId
  attributes?: Attribute[];
  indexes?: Index[];
  permissions?: unknown[];
}

const PERM_PUBLIC_READ = [Permission.read(Role.any())];

const PERM_RESTRICTED = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

export const COLLECTIONS: CollectionConfig[] = [
  {
    name: "Users",
    id: "users",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "name", type: "string", size: 128, required: true },
      { key: "email", type: "email", required: true },
      {
        key: "role",
        type: "string",
        size: 32,
        required: true,
        default: "member",
      },
      {
        key: "permissions",
        type: "string",
        size: 512,
        required: false,
        array: true,
      },
      { key: "avatar", type: "url", required: false },
      { key: "isActive", type: "boolean", required: true, default: true },
      { key: "phone", type: "string", size: 20, required: false },
      { key: "lastLogin", type: "datetime", required: false },
    ],
    indexes: [
      { key: "email_idx", type: "unique", attributes: ["email"] },
    ],
  },
  {
    name: "Beneficiaries",
    id: "beneficiaries",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "name", type: "string", size: 128, required: true },
      { key: "tc_no", type: "string", size: 11, required: true },
      { key: "phone", type: "string", size: 20, required: true },
      { key: "email", type: "email", required: false },
      { key: "birth_date", type: "datetime", required: false }, // Using datetime for dates
      { key: "gender", type: "string", size: 20, required: false },
      // Address
      { key: "address", type: "string", size: 512, required: true },
      { key: "city", type: "string", size: 50, required: true },
      { key: "district", type: "string", size: 50, required: true },
      { key: "neighborhood", type: "string", size: 50, required: true },
      // Family
      { key: "family_size", type: "integer", required: true, default: 1 },
      // Status
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "TASLAK",
      },
      {
        key: "approval_status",
        type: "string",
        size: 20,
        required: false,
        default: "pending",
      },
      // Search optimization
      { key: "search_text", type: "string", size: 1024, required: false }, // For full text search
    ],
    indexes: [
      { key: "tc_no_idx", type: "unique", attributes: ["tc_no"] },
      {
        key: "name_search",
        type: "fulltext",
        attributes: ["name", "tc_no", "phone"],
      },
      { key: "status_idx", type: "key", attributes: ["status"] },
    ],
  },
  {
    name: "Donations",
    id: "donations",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "donor_name", type: "string", size: 128, required: true },
      { key: "donor_phone", type: "string", size: 20, required: true },
      { key: "donor_email", type: "email", required: false },
      { key: "amount", type: "double", required: true },
      {
        key: "currency",
        type: "string",
        size: 3,
        required: true,
        default: "TRY",
      },
      { key: "donation_type", type: "string", size: 50, required: true },
      { key: "payment_method", type: "string", size: 50, required: true },
      { key: "donation_purpose", type: "string", size: 100, required: true },
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "pending",
      },
      { key: "receipt_number", type: "string", size: 50, required: false },
      { key: "is_kumbara", type: "boolean", required: false, default: false },
    ],
    indexes: [
      { key: "status_idx", type: "key", attributes: ["status"] },
      {
        key: "donor_search",
        type: "fulltext",
        attributes: ["donor_name", "donor_phone"],
      },
      {
        key: "created_idx",
        type: "key",
        attributes: ["$createdAt"],
        orders: ["DESC"],
      },
    ],
  },
  {
    name: "Aid Applications",
    id: "aid_applications", // Consistent with types
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "applicant_name", type: "string", size: 128, required: true },
      {
        key: "applicant_type",
        type: "string",
        size: 20,
        required: true,
        default: "person",
      },
      { key: "application_date", type: "datetime", required: true },
      {
        key: "stage",
        type: "string",
        size: 20,
        required: true,
        default: "draft",
      },
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "open",
      },
      {
        key: "priority",
        type: "string",
        size: 20,
        required: false,
        default: "normal",
      },
      { key: "beneficiary_id", type: "string", size: 36, required: false },
    ],
    indexes: [
      { key: "status_idx", type: "key", attributes: ["status"] },
      { key: "stage_idx", type: "key", attributes: ["stage"] },
    ],
  },
  {
    name: "Tasks",
    id: "tasks",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "title", type: "string", size: 256, required: true },
      { key: "description", type: "string", size: 2048, required: false },
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "pending",
      },
      {
        key: "priority",
        type: "string",
        size: 10,
        required: true,
        default: "normal",
      },
      { key: "assigned_to", type: "string", size: 36, required: false },
      { key: "created_by", type: "string", size: 36, required: true },
      { key: "due_date", type: "datetime", required: false },
      { key: "is_read", type: "boolean", required: true, default: false },
    ],
    indexes: [
      { key: "status_idx", type: "key", attributes: ["status"] },
      { key: "assigned_idx", type: "key", attributes: ["assigned_to"] },
    ],
  },
  {
    name: "Meetings",
    id: "meetings",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "title", type: "string", size: 256, required: true },
      { key: "description", type: "string", size: 1024, required: false },
      { key: "meeting_date", type: "datetime", required: true },
      { key: "location", type: "string", size: 256, required: false },
      { key: "organizer", type: "string", size: 36, required: true },
      {
        key: "participants",
        type: "string",
        size: 36,
        required: false,
        array: true,
      },
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "scheduled",
      },
      {
        key: "meeting_type",
        type: "string",
        size: 20,
        required: true,
        default: "general",
      },
    ],
    indexes: [
      { key: "date_idx", type: "key", attributes: ["meeting_date"] },
      { key: "status_idx", type: "key", attributes: ["status"] },
    ],
  },
  {
    name: "Parameters", // For dynamic dropdowns
    id: "parameters",
    permissions: PERM_PUBLIC_READ, // Public reading allowed
    attributes: [
      { key: "category", type: "string", size: 50, required: true },
      { key: "name_tr", type: "string", size: 128, required: true },
      { key: "value", type: "string", size: 128, required: true },
      { key: "order", type: "integer", required: true, default: 0 },
      { key: "is_active", type: "boolean", required: true, default: true },
    ],
    indexes: [
      { key: "category_idx", type: "key", attributes: ["category"] },
    ],
  },
  {
    name: "Audit Logs",
    id: "audit_logs",
    permissions: PERM_RESTRICTED,
    attributes: [
      { key: "action", type: "string", size: 50, required: true },
      { key: "resource", type: "string", size: 50, required: true },
      { key: "user_id", type: "string", size: 36, required: true },
      { key: "details", type: "string", size: 2048, required: false },
      { key: "ip_address", type: "ip", required: false },
      {
        key: "status",
        type: "string",
        size: 20,
        required: true,
        default: "success",
      },
    ],
    indexes: [
      { key: "user_idx", type: "key", attributes: ["user_id"] },
      {
        key: "created_idx",
        type: "key",
        attributes: ["$createdAt"],
        orders: ["DESC"],
      },
    ],
  },
];
