/**
 * Partner CSV Import Script
 *
 * Usage: npx tsx scripts/import-partners.ts <path-to-csv>
 *
 * CRITICAL: This script preserves existing upload keys from the CSV.
 * It does NOT generate new keys for imported partners.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

// Mapping from CSV values to database enum values
const platformMap: Record<string, string> = {
  'whmcs': 'WHMCS',
  'broker panel': 'BROKER_PANEL',
  'partner portal': 'PARTNER_PORTAL',
};

const partnerTypeMap: Record<string, string> = {
  'broker': 'BROKER',
  'affiliate': 'AFFILIATE',
  'ea': 'EA',
  'other': 'OTHER',
};

const configMap: Record<string, string> = {
  'locked-down': 'LOCKED_DOWN',
  'standard': 'STANDARD',
  'custom': 'CUSTOM',
};

const statusMap: Record<string, string> = {
  'live': 'LIVE',
  'in-progress': 'IN_PROGRESS',
  'pre-sales': 'PRE_SALES',
  'inactive': 'INACTIVE',
  'pending requirements': 'IN_PROGRESS',
  'pending partner reply': 'IN_PROGRESS',
  'pending contract': 'PRE_SALES',
  'build in progress': 'IN_PROGRESS',
};

function mapValue(value: string | undefined, mapping: Record<string, string>): string | null {
  if (!value || value.trim() === '') return null;
  const normalized = value.trim().toLowerCase();
  return mapping[normalized] || null;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function parseCommission(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  // Remove % sign and parse
  const cleaned = value.replace(/%/g, '').trim();
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return null;
  return Math.min(100, Math.max(0, num));
}

function parseDate(value: string | undefined): Date {
  if (!value || value.trim() === '') return new Date();
  try {
    // Try to parse YYYY-MM-DD format
    const date = new Date(value.trim());
    if (!isNaN(date.getTime())) return date;
  } catch {
    // Fall back to current date
  }
  return new Date();
}

interface CSVRow {
  'Date Added'?: string;
  'Partner Name'?: string;
  'Upload Key'?: string;
  'Platform'?: string;
  'Partner Type'?: string;
  'Config'?: string;
  'Landing Page'?: string;
  'Partner Status'?: string;
  'Support Channel'?: string;
  'Contact Name'?: string;
  'Contact Email'?: string;
  'Commission'?: string;
  'Notes'?: string;
}

async function importPartners(csvPath: string) {
  console.log(`Reading CSV from: ${csvPath}`);

  let fileContent: string;
  try {
    fileContent = readFileSync(csvPath, "utf-8");
  } catch (error) {
    console.error(`Failed to read file: ${csvPath}`);
    console.error(error);
    process.exit(1);
  }

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CSVRow[];

  console.log(`Found ${records.length} rows in CSV`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let noName = 0;
  let noKey = 0;

  for (const row of records) {
    const name = row['Partner Name']?.trim();
    const uploadKey = row['Upload Key']?.trim();

    // Skip rows without a name
    if (!name) {
      noName++;
      continue;
    }

    // Skip rows without an upload key (we preserve existing keys, don't generate)
    if (!uploadKey) {
      console.log(`⚠️  Skipping "${name}" - no upload key in CSV`);
      noKey++;
      continue;
    }

    try {
      // Check if partner already exists by name
      const existingByName = await prisma.partner.findUnique({
        where: { name },
      });

      if (existingByName) {
        console.log(`⏭️  Skipping "${name}" - already exists`);
        skipped++;
        continue;
      }

      // Check if upload key already exists
      const existingByKey = await prisma.partner.findUnique({
        where: { uploadKey },
      });

      if (existingByKey) {
        console.log(`⚠️  Skipping "${name}" - upload key already in use by "${existingByKey.name}"`);
        skipped++;
        continue;
      }

      // Map CSV values to database values
      const platform = mapValue(row['Platform'], platformMap);
      const partnerType = mapValue(row['Partner Type'], partnerTypeMap);
      const config = mapValue(row['Config'], configMap);
      const partnerStatus = mapValue(row['Partner Status'], statusMap) || 'PRE_SALES';
      const hasLandingPage = parseBoolean(row['Landing Page']);
      const commission = partnerType === 'AFFILIATE' ? parseCommission(row['Commission']) : null;
      const dateAdded = parseDate(row['Date Added']);

      await prisma.partner.create({
        data: {
          name,
          uploadKey, // PRESERVE existing key from CSV
          dateAdded,
          platform,
          partnerType,
          config,
          partnerStatus,
          hasLandingPage,
          supportChannel: row['Support Channel']?.trim() || null,
          contactName: row['Contact Name']?.trim() || null,
          contactEmail: row['Contact Email']?.trim() || null,
          commission,
          notes: row['Notes']?.trim() || null,
        },
      });

      console.log(`✅ Created: ${name} (${uploadKey.substring(0, 8)}...)`);
      created++;
    } catch (error) {
      console.error(`❌ Error importing "${name}":`, error);
      errors++;
    }
  }

  console.log('\n========================================');
  console.log('Import Summary:');
  console.log('========================================');
  console.log(`Total rows in CSV:     ${records.length}`);
  console.log(`Rows without name:     ${noName}`);
  console.log(`Rows without key:      ${noKey}`);
  console.log(`Created:               ${created}`);
  console.log(`Skipped (duplicate):   ${skipped}`);
  console.log(`Errors:                ${errors}`);
  console.log('========================================');

  if (created > 0) {
    console.log('\n✅ Import completed successfully!');
    console.log('Run "npx prisma studio" to view imported partners.');
  }
}

// Main execution
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-partners.ts <path-to-csv>');
  console.error('Example: npx tsx scripts/import-partners.ts "../B2B_Custom_VPS_Products.csv"');
  process.exit(1);
}

importPartners(csvPath)
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
