import { NextRequest, NextResponse } from "next/server";
import { getServerDatabases } from "@/lib/appwrite/server";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import logger from "@/lib/logger";
import { requireModuleAccess, buildErrorResponse } from "@/lib/api/auth-utils";
import { readOnlyRateLimit } from "@/lib/rate-limit";

// Define strict types for our finance records
interface FinanceRecord {
  amount?: number;
  record_type?: "income" | "expense";
  transaction_date?: string;
  category?: string;
  [key: string]: unknown;
}

// Handler function wrapped with rate limiter
async function getFinancialStatsHandler(request: NextRequest) {
  try {
    // Require authentication and finance module access
    await requireModuleAccess('finance');

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const paymentMethod = searchParams.get("payment_method");

    const databases = getServerDatabases();
    const collectionId = appwriteConfig.collections.financeRecords;
    const databaseId = appwriteConfig.databaseId;

    const queries: string[] = [
      Query.limit(5000), // Max limit to get most records for aggregation
    ];

    if (from) {
      queries.push(Query.greaterThanEqual("transaction_date", from));
    }
    if (to) {
      queries.push(Query.lessThanEqual("transaction_date", to));
    }
    if (paymentMethod) {
      queries.push(Query.equal("payment_method", paymentMethod));
    }

    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      queries
    );

    const documents = response.documents as unknown as FinanceRecord[];

    // 1. Totals
    let totalIncome = 0;
    let totalExpenses = 0;

    // 2. Trends (Monthly)
    const monthlyStats: Record<string, { income: number; expense: number }> = {};

    // 3. Categories
    const categoryStats: {
      income: Record<string, number>;
      expense: Record<string, number>;
    } = {
      income: {},
      expense: {},
    };

    documents.forEach((doc) => {
      const amount = doc.amount || 0;
      const type = doc.record_type;
      const dateStr = doc.transaction_date;
      if (!dateStr) return;
      const date = new Date(dateStr);
      // Format YYYY-MM
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = doc.category || "Diğer";

      // Totals
      if (type === "income") totalIncome += amount;
      else if (type === "expense") totalExpenses += amount;

      // Trends
      if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { income: 0, expense: 0 };
      if (type === "income") monthlyStats[monthKey].income += amount;
      else if (type === "expense") monthlyStats[monthKey].expense += amount;

      // Categories
      if (type === "income" || type === "expense") {
          if (!categoryStats[type][category]) categoryStats[type][category] = 0;
          categoryStats[type][category] += amount;
      }
    });

    const netIncome = totalIncome - totalExpenses;

    // Format trends for Recharts
    const trends = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        income: stats.income,
        expense: stats.expense
      }));

    return NextResponse.json({
      success: true,
      data: {
        totals: { totalIncome, totalExpenses, netIncome, recordCount: documents.length },
        trends,
        categories: categoryStats
      }
    });

  } catch (error) {
     const authError = buildErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }

    logger.error("Failed to fetch financial stats", error);
    return NextResponse.json(
      { success: false, error: "Finansal istatistikler alınamadı." },
      { status: 500 }
    );
  }
}

export const GET = readOnlyRateLimit(getFinancialStatsHandler);
