const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const RecurringTransaction = require("../models/RecurringTransaction");
const { generateDueRecurring } = require("./recurringService");
const { startOfMonth, endOfMonth, daysRemainingInMonth } = require("../utils/date");

const ownerMatch = (userId) => ({ owner: new mongoose.Types.ObjectId(userId) });

const monthBounds = (offset = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), 1),
    end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    label: d.toLocaleString("en-US", { month: "short" }),
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  };
};

exports.summaryForRange = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    {
      $match: {
        ...ownerMatch(userId),
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  let income = 0;
  let expense = 0;
  let count = 0;
  rows.forEach((r) => {
    count += r.count;
    if (r._id === "income") income = r.total;
    if (r._id === "expense") expense = r.total;
  });
  return { income, expense, balance: income - expense, count };
};

exports.monthlySeries = async (userId, months = 6) => {
  const start = monthBounds(-(months - 1)).start;
  const rows = await Transaction.aggregate([
    { $match: { ...ownerMatch(userId), date: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const series = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const b = monthBounds(-i);
    const income =
      rows.find((r) => r._id.year === b.year && r._id.month === b.month && r._id.type === "income")
        ?.total || 0;
    const expense =
      rows.find((r) => r._id.year === b.year && r._id.month === b.month && r._id.type === "expense")
        ?.total || 0;
    series.push({
      month: b.label,
      year: b.year,
      income,
      expense,
      net: income - expense,
      isCurrent: i === 0,
    });
  }
  return series;
};

exports.categoryBreakdown = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    {
      $match: {
        ...ownerMatch(userId),
        type: "expense",
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$category", amount: { $sum: "$amount" } } },
    { $sort: { amount: -1 } },
  ]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return rows.map((r) => ({
    category: r._id,
    amount: r.amount,
    percent: total > 0 ? Math.round((r.amount / total) * 1000) / 10 : 0,
  }));
};

exports.getDashboard = async (userId) => {
  await generateDueRecurring(userId);

  const now = new Date();
  const thisStart = startOfMonth(now);
  const thisEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prev = monthBounds(-1);

  const [month, previous, allTime, incomeVsExpenses, spendingByCategory, recent, budgets] =
    await Promise.all([
      exports.summaryForRange(userId, thisStart, thisEnd),
      exports.summaryForRange(userId, prev.start, prev.end),
      exports.summaryForRange(userId, new Date(0), thisEnd),
      exports.monthlySeries(userId, 6),
      exports.categoryBreakdown(userId, thisStart, thisEnd),
      Transaction.find({ owner: userId }).sort({ date: -1, _id: -1 }).limit(5),
      Budget.find({
        owner: userId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }),
    ]);

  const spentRows = await Transaction.aggregate([
    {
      $match: {
        ...ownerMatch(userId),
        type: "expense",
        date: { $gte: thisStart, $lt: thisEnd },
      },
    },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);
  const spentMap = Object.fromEntries(spentRows.map((r) => [r._id, r.spent]));

  const budgetOverview = budgets.map((b) => {
    const spent = spentMap[b.category] || 0;
    const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    return {
      id: b._id,
      category: b.category,
      amount: b.amount,
      spent,
      remaining: b.amount - spent,
      percentUsed: Math.round(percent * 10) / 10,
    };
  });

  const savingsRate = month.income > 0 ? (month.balance / month.income) * 100 : 0;
  const expenseDelta =
    previous.expense > 0 ? ((month.expense - previous.expense) / previous.expense) * 100 : null;
  const incomeDelta =
    previous.income > 0 ? ((month.income - previous.income) / previous.income) * 100 : null;

  const topCategory = spendingByCategory[0] || null;
  const insights = [];
  if (expenseDelta !== null) {
    insights.push({
      type: expenseDelta <= 0 ? "positive" : "attention",
      title: expenseDelta <= 0 ? "Spending decreased" : "Spending increased",
      body:
        expenseDelta <= 0
          ? `Expenses are ${Math.abs(expenseDelta).toFixed(1)}% lower than last month.`
          : `Expenses are ${expenseDelta.toFixed(1)}% higher than last month.`,
    });
  }
  if (topCategory) {
    insights.push({
      type: "info",
      title: `${topCategory.category} is your largest expense`,
      body: `${topCategory.category} accounts for ${topCategory.percent}% of this month's spending.`,
    });
  }
  if (month.income > 0) {
    insights.push({
      type: savingsRate >= 20 ? "positive" : "info",
      title: `Savings rate ${savingsRate.toFixed(1)}%`,
      body:
        savingsRate >= 20
          ? "You are saving a healthy share of this month's income."
          : "Consider lowering discretionary spending to improve your savings rate.",
    });
  }

  return {
    greetingDate: now.toISOString(),
    totals: {
      balance: allTime.balance,
      monthIncome: month.income,
      monthExpense: month.expense,
      monthBalance: month.balance,
      savingsRate: Math.round(savingsRate * 10) / 10,
      incomeDelta: incomeDelta !== null ? Math.round(incomeDelta * 10) / 10 : null,
      expenseDelta: expenseDelta !== null ? Math.round(expenseDelta * 10) / 10 : null,
      daysRemaining: daysRemainingInMonth(now),
    },
    incomeVsExpenses,
    spendingByCategory,
    recentTransactions: recent,
    budgetOverview,
    insights,
  };
};

exports.getAnalytics = async (userId, query = {}) => {
  await generateDueRecurring(userId);
  const now = new Date();
  let start;
  let end;
  const year = query.year && query.year !== "all" ? Number(query.year) : null;
  const month = query.month ? Number(query.month) : null;

  if (query.year === "all") {
    start = new Date(0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (year && month) {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 1);
  } else if (year) {
    start = new Date(year, 0, 1);
    end = new Date(year + 1, 0, 1);
  } else {
    start = startOfMonth(now);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  const categoryFilter = query.category;
  const match = {
    ...ownerMatch(userId),
    date: { $gte: start, $lt: end },
  };
  if (categoryFilter) match.category = categoryFilter;

  // Financial Health is a monthly-oriented card (savings rate, days remaining,
  // budget usage), so its target (year, month) is derived independently of the
  // chart date range above - reusing `start` broke this for "All years" (epoch
  // date -> year 1970) and silently summed every month's budgets together for
  // "a specific year, no month" instead of using just the current month.
  let budgetYear = null;
  let budgetMonth = null;
  if (month) {
    // A specific month was selected - always honor it.
    budgetYear = year || now.getFullYear();
    budgetMonth = month;
  } else if (!year || year === now.getFullYear()) {
    // No year filter ("All years") or the current year with no month picked -
    // fall back to the real current month, since that's what "this period"
    // means for a monthly card when nothing more specific was chosen.
    budgetYear = now.getFullYear();
    budgetMonth = now.getMonth() + 1;
  }
  // Otherwise: a specific past/future year was selected with no month. There is
  // no single "current" month for that year, so budgetYear/budgetMonth stay
  // null and we honestly report no applicable budget below.
  const budgetStart = budgetYear ? new Date(budgetYear, budgetMonth - 1, 1) : null;
  const budgetEnd = budgetYear ? new Date(budgetYear, budgetMonth, 1) : null;

  const [rangeSummary, prevSummary, monthly, categories, largest, counts, budgetDocs, budgetPeriodExpense] =
    await Promise.all([
      Transaction.aggregate([
        { $match: match },
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            ...ownerMatch(userId),
            date: {
              $gte: new Date(start.getFullYear(), start.getMonth() - 1, 1),
              $lt: start,
            },
          },
        },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
      exports.monthlySeries(userId, 6),
      exports.categoryBreakdown(userId, start, end).then((rows) =>
        categoryFilter ? rows.filter((r) => r.category === categoryFilter) : rows
      ),
      Transaction.find({
        owner: userId,
        type: "expense",
        date: { $gte: start, $lt: end },
        ...(categoryFilter ? { category: categoryFilter } : {}),
      })
        .sort({ amount: -1 })
        .limit(1),
      Transaction.aggregate([
        { $match: match },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      budgetYear ? Budget.find({ owner: userId, year: budgetYear, month: budgetMonth }) : Promise.resolve([]),
      budgetYear
        ? Transaction.aggregate([
            { $match: { ...ownerMatch(userId), type: "expense", date: { $gte: budgetStart, $lt: budgetEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).then((rows) => rows[0]?.total || 0)
        : Promise.resolve(0),
    ]);

  const pick = (rows, type) => rows.find((r) => r._id === type)?.total || 0;
  const income = pick(rangeSummary, "income");
  const expense = pick(rangeSummary, "expense");
  const prevIncome = pick(prevSummary, "income");
  const prevExpense = pick(prevSummary, "expense");
  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  const days = Math.max(1, Math.ceil((Math.min(Date.now(), end) - start) / 86400000));
  const expenseCount = counts.find((c) => c._id === "expense")?.count || 0;
  const incomeCount = counts.find((c) => c._id === "income")?.count || 0;
  const totalLogged = expenseCount + incomeCount;

  const totalBudget = budgetDocs.reduce((s, b) => s + b.amount, 0);
  const budgetUsage = totalBudget > 0 ? (budgetPeriodExpense / totalBudget) * 100 : null;

  let healthScore = 50;
  if (savingsRate >= 20) healthScore += 20;
  else if (savingsRate >= 10) healthScore += 10;
  else if (savingsRate < 0) healthScore -= 20;
  if (budgetUsage !== null) {
    if (budgetUsage < 80) healthScore += 15;
    else if (budgetUsage < 100) healthScore += 5;
    else healthScore -= 15;
  }
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    period: { start, end, year: year || now.getFullYear(), month: month || null },
    summary: {
      netCashFlow: net,
      totalIncome: income,
      totalExpenses: expense,
      savingsRate: Math.round(savingsRate * 10) / 10,
      incomeDelta: prevIncome ? Math.round(((income - prevIncome) / prevIncome) * 1000) / 10 : null,
      expenseDelta: prevExpense
        ? Math.round(((expense - prevExpense) / prevExpense) * 1000) / 10
        : null,
    },
    incomeVsExpenses: monthly,
    spendingByCategory: categories,
    monthlySpending: monthly.map((m) => ({ month: m.month, expense: m.expense, isCurrent: m.isCurrent })),
    financialHealth: {
      score: healthScore,
      label: healthScore >= 70 ? "Healthy" : healthScore >= 45 ? "Fair" : "Needs attention",
      savingsRate: Math.round(savingsRate * 10) / 10,
      budgetUsage: budgetUsage !== null ? Math.round(budgetUsage * 10) / 10 : null,
      daysRemaining: daysRemainingInMonth(now),
    },
    highlights: {
      largestExpense: largest[0] || null,
      highestCategory: categories[0] || null,
      averageDailySpending: Math.round((expense / days) * 100) / 100,
      transactionsLogged: totalLogged,
      expenseCount,
      incomeCount,
    },
  };
};

exports.getInsights = async (userId, notificationPrefs = {}) => {
  await generateDueRecurring(userId);
  const now = new Date();
  const start = startOfMonth(now);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prev = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: start,
  };

  const budgetAlertsEnabled = notificationPrefs.budgetAlerts !== false;
  const largeTransactionAlertsEnabled = notificationPrefs.largeTransactionAlerts !== false;

  const [current, previous, categories, prevCategories, budgets, recurring, largest, expenseStats] =
    await Promise.all([
      exports.summaryForRange(userId, start, end),
      exports.summaryForRange(userId, prev.start, prev.end),
      exports.categoryBreakdown(userId, start, end),
      exports.categoryBreakdown(userId, prev.start, prev.end),
      Budget.find({ owner: userId, year: now.getFullYear(), month: now.getMonth() + 1 }),
      RecurringTransaction.find({ owner: userId, isActive: true, type: "expense" }),
      Transaction.find({ owner: userId, type: "expense", date: { $gte: start, $lt: end } })
        .sort({ amount: -1 })
        .limit(1),
      Transaction.aggregate([
        {
          $match: {
            ...ownerMatch(userId),
            type: "expense",
            date: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: null, avgAmount: { $avg: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

  const spentRows = await Transaction.aggregate([
    {
      $match: {
        ...ownerMatch(userId),
        type: "expense",
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);
  const spentMap = Object.fromEntries(spentRows.map((r) => [r._id, r.spent]));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const budgetUsage = totalBudget > 0 ? (current.expense / totalBudget) * 100 : null;
  const savingsRate = current.income > 0 ? (current.balance / current.income) * 100 : 0;
  const expenseDelta =
    previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : null;

  const categoryChanges = categories.map((c) => {
    const prior = prevCategories.find((p) => p.category === c.category)?.amount || 0;
    return {
      category: c.category,
      current: c.amount,
      previous: prior,
      delta: c.amount - prior,
    };
  });

  const upcomingRecurring = recurring
    .filter((r) => r.nextRunAt <= new Date(Date.now() + 7 * 86400000))
    .map((r) => ({
      title: r.title,
      amount: r.amount,
      nextRunAt: r.nextRunAt,
      category: r.category,
    }));
  const upcomingTotal = upcomingRecurring.reduce((s, r) => s + r.amount, 0);

  const cards = [];
  if (expenseDelta !== null) {
    cards.push({
      id: "spending-change",
      tone: expenseDelta <= 0 ? "positive" : "attention",
      title: expenseDelta <= 0 ? "Spending Decreased" : "Spending Increased",
      body:
        expenseDelta <= 0
          ? `Your total spending is ${Math.abs(expenseDelta).toFixed(1)}% lower than last month.`
          : `Your total spending is ${expenseDelta.toFixed(1)}% higher than last month.`,
      metrics: {
        thisMonth: current.expense,
        priorCycle: previous.expense,
        saved: previous.expense - current.expense,
      },
      href: "/analytics",
    });
  }

  if (categories[0]) {
    cards.push({
      id: "largest-category",
      tone: "info",
      title: `${categories[0].category} Is Your Largest Expense`,
      body: `${categories[0].category} accounts for ${categories[0].percent}% of your total spending this month.`,
      metrics: {
        amount: categories[0].amount,
        share: categories[0].percent,
      },
      href: "/categories",
    });
  }

  if (budgetAlertsEnabled) {
    budgets.forEach((b) => {
      const spent = spentMap[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (pct >= 80) {
        cards.push({
          id: `budget-${b._id}`,
          tone: pct >= 100 ? "attention" : "attention",
          title: `${b.category} ${pct >= 100 ? "Over Budget" : "Near Budget Limit"}`,
          body: `${b.category} is at ${pct.toFixed(0)}% of its monthly budget with ${daysRemainingInMonth(now)} days remaining.`,
          metrics: { spent, limit: b.amount, remaining: b.amount - spent },
          href: "/budgets",
        });
      }
    });
  }

  if (largeTransactionAlertsEnabled && largest[0] && expenseStats[0]?.count >= 3) {
    const avgAmount = expenseStats[0].avgAmount;
    const isUnusual = avgAmount > 0 && largest[0].amount >= avgAmount * 2.5 && largest[0].amount >= 50;
    if (isUnusual) {
      cards.push({
        id: "unusual-large-transaction",
        tone: "attention",
        title: "Unusually Large Transaction",
        body: `"${largest[0].title}" (${largest[0].category}) is notably higher than your average expense this month.`,
        metrics: {
          amount: largest[0].amount,
          average: Math.round(avgAmount * 100) / 100,
        },
        href: "/transactions",
      });
    }
  }

  const rising = categoryChanges.filter((c) => c.delta > 0).sort((a, b) => b.delta - a.delta)[0];
  if (rising && rising.previous > 0) {
    cards.push({
      id: "category-increase",
      tone: "attention",
      title: `${rising.category} Increased`,
      body: `You spent more on ${rising.category} than last month.`,
      metrics: { paceDelta: rising.delta, currentCycle: rising.current },
      href: "/transactions",
    });
  }

  cards.push({
    id: "savings-rate",
    tone: savingsRate >= 20 ? "positive" : "info",
    title: savingsRate >= 20 ? "Strong Savings Rate" : "Savings Rate",
    body:
      current.income > 0
        ? `Your current savings rate is ${savingsRate.toFixed(1)}% of income this month.`
        : "Log income this month to calculate a savings rate.",
    metrics: { netSavings: current.balance, rate: Math.round(savingsRate * 10) / 10 },
    href: "/goals",
  });

  if (upcomingRecurring.length) {
    cards.push({
      id: "upcoming-recurring",
      tone: "info",
      title: "Upcoming Recurring Expenses",
      body: `You have ${upcomingRecurring.length} recurring expense${upcomingRecurring.length === 1 ? "" : "s"} scheduled over the next 7 days.`,
      metrics: { scheduledOutflow: upcomingTotal, payments: upcomingRecurring.length },
      href: "/recurring",
    });
  }

  const actions = [];
  const nearBudget = budgetAlertsEnabled
    ? budgets.find((b) => {
        const spent = spentMap[b.category] || 0;
        const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return pct >= 80;
      })
    : null;
  if (nearBudget) {
    actions.push({
      title: `Review ${nearBudget.category} spending`,
      body: `You're close to or over the ${nearBudget.category} budget.`,
      href: "/budgets",
    });
  }
  if (rising) {
    actions.push({
      title: `Check ${rising.category} spending`,
      body: `${rising.category} increased compared with last month.`,
      href: "/transactions",
    });
  }
  if (savingsRate >= 20) {
    actions.push({
      title: "Keep your savings pace",
      body: "You are currently meeting a healthy savings rate this month.",
      href: "/goals",
    });
  }

  return {
    summary: {
      spendingChange: expenseDelta !== null ? Math.round(expenseDelta * 10) / 10 : null,
      budgetHealth: budgetUsage !== null ? Math.round(budgetUsage * 10) / 10 : null,
      savingsRate: Math.round(savingsRate * 10) / 10,
      largestExpense: largest[0]
        ? { title: largest[0].title, amount: largest[0].amount, category: largest[0].category }
        : categories[0]
          ? { title: categories[0].category, amount: categories[0].amount, category: categories[0].category }
          : null,
      daysRemaining: daysRemainingInMonth(now),
    },
    cards,
    spendingPatterns: categories,
    monthOverMonth: {
      income: { current: current.income, previous: previous.income },
      expenses: { current: current.expense, previous: previous.expense },
      net: { current: current.balance, previous: previous.balance },
    },
    recommendedActions: actions,
    upcomingRecurring,
  };
};
