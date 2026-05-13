import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sheetConfig } from "@/lib/sheetData";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

function getSheetsClient() {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_KEY) {
    throw new Error("Google Sheets API env vars are not configured.");
  }

  const credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
  // Ensure escaped \n in private_key are real newlines
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  try {
    const sheets = getSheetsClient();
    
    // Fetch main module data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetConfig.tableRange,
    });
    
    // Fetch branch data
    let branchValues: unknown[][] = [];
    try {
      const branchResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetConfig.branchTableRange,
      });
      branchValues = branchResponse.data.values || [];
    } catch (branchErr) {
      console.warn("[/api/sheets] Branch data not found, continuing without it");
    }

    // Fetch device testing data
    let deviceValues: unknown[][] = [];
    try {
      const deviceResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetConfig.deviceTestingRange,
      });
      deviceValues = deviceResponse.data.values || [];
    } catch (deviceErr) {
      console.warn("[/api/sheets] Device testing data not found, continuing without it");
    }

    // Fetch master branchwise testing (sales closing)
    let masterValues: unknown[][] = [];
    try {
      const masterResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetConfig.masterBranchRange,
      });
      masterValues = masterResponse.data.values || [];
    } catch (masterErr) {
      console.warn("[/api/sheets] Master branchwise testing data not found, continuing without it");
    }
    
    return NextResponse.json({ 
      values: response.data.values || [],
      branchValues,
      deviceValues,
      masterValues
    });
  } catch (err: any) {
    console.error("[/api/sheets]", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { range, values } = body;
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID!,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });

  return NextResponse.json({ success: true, range, values });
}
