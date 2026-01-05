import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface AnalyticsExportData {
  totalCustomers: number;
  totalRestaurants: number;
  totalRevenue: number;
  totalTransactions: number;
  avgOrderValue: number;
  totalDiscountGiven: number;
  conversionRate: number;
  topRestaurants: { name: string; revenue: number; transactions: number; avgOrder: number }[];
  cuisineDistribution: { name: string; value: number }[];
  revenueByMonth: { month: string; revenue: number; transactions: number }[];
  transactionsByDay: { day: string; count: number; revenue: number }[];
}

export const exportToCSV = (data: AnalyticsExportData, filename: string = 'analytics-report') => {
  const lines: string[] = [];
  
  // Header
  lines.push('DineDeal Analytics Report');
  lines.push(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`);
  lines.push('');
  
  // Key Metrics
  lines.push('KEY METRICS');
  lines.push('Metric,Value');
  lines.push(`Total Customers,${data.totalCustomers}`);
  lines.push(`Total Restaurants,${data.totalRestaurants}`);
  lines.push(`Total Revenue,₹${data.totalRevenue.toLocaleString()}`);
  lines.push(`Total Transactions,${data.totalTransactions}`);
  lines.push(`Average Order Value,₹${Math.round(data.avgOrderValue)}`);
  lines.push(`Total Discounts Given,₹${data.totalDiscountGiven.toLocaleString()}`);
  lines.push(`Conversion Rate,${data.conversionRate.toFixed(1)}%`);
  lines.push('');
  
  // Top Restaurants
  lines.push('TOP PERFORMING RESTAURANTS');
  lines.push('Rank,Name,Revenue,Transactions,Avg Order');
  data.topRestaurants.forEach((r, i) => {
    lines.push(`${i + 1},${r.name},₹${r.revenue.toLocaleString()},${r.transactions},₹${Math.round(r.avgOrder)}`);
  });
  lines.push('');
  
  // Cuisine Distribution
  lines.push('CUISINE DISTRIBUTION');
  lines.push('Cuisine,Count');
  data.cuisineDistribution.forEach(c => {
    lines.push(`${c.name},${c.value}`);
  });
  lines.push('');
  
  // Revenue by Month
  lines.push('REVENUE BY MONTH');
  lines.push('Month,Revenue,Transactions');
  data.revenueByMonth.forEach(m => {
    lines.push(`${m.month},₹${m.revenue.toLocaleString()},${m.transactions}`);
  });
  lines.push('');
  
  // Transactions by Day
  lines.push('TRANSACTIONS BY DAY OF WEEK');
  lines.push('Day,Count,Revenue');
  data.transactionsByDay.forEach(d => {
    lines.push(`${d.day},${d.count},₹${d.revenue.toLocaleString()}`);
  });
  
  // Create and download CSV
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (data: AnalyticsExportData, filename: string = 'analytics-report') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(41, 98, 255); // Primary color
  doc.text('DineDeal Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, pageWidth / 2, 28, { align: 'center' });
  
  // Key Metrics Section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Key Metrics', 14, 42);
  
  doc.autoTable({
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Total Customers', data.totalCustomers.toString()],
      ['Total Restaurants', data.totalRestaurants.toString()],
      ['Total Revenue', `₹${data.totalRevenue.toLocaleString()}`],
      ['Total Transactions', data.totalTransactions.toString()],
      ['Average Order Value', `₹${Math.round(data.avgOrderValue)}`],
      ['Total Discounts Given', `₹${data.totalDiscountGiven.toLocaleString()}`],
      ['Conversion Rate', `${data.conversionRate.toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
  });
  
  // Top Restaurants Section
  let yPos = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Top Performing Restaurants', 14, yPos);
  
  doc.autoTable({
    startY: yPos + 4,
    head: [['Rank', 'Name', 'Revenue', 'Transactions', 'Avg Order']],
    body: data.topRestaurants.map((r, i) => [
      (i + 1).toString(),
      r.name,
      `₹${r.revenue.toLocaleString()}`,
      r.transactions.toString(),
      `₹${Math.round(r.avgOrder)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
  });
  
  // Cuisine Distribution
  yPos = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Cuisine Distribution', 14, yPos);
  
  doc.autoTable({
    startY: yPos + 4,
    head: [['Cuisine', 'Restaurant Count']],
    body: data.cuisineDistribution.map(c => [c.name, c.value.toString()]),
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
  });
  
  // Check if we need a new page
  yPos = doc.lastAutoTable.finalY + 12;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  // Revenue by Month
  doc.setFontSize(14);
  doc.text('Monthly Revenue Trend', 14, yPos);
  
  doc.autoTable({
    startY: yPos + 4,
    head: [['Month', 'Revenue', 'Transactions']],
    body: data.revenueByMonth.map(m => [
      m.month,
      `₹${m.revenue.toLocaleString()}`,
      m.transactions.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
  });
  
  // Transactions by Day
  yPos = doc.lastAutoTable.finalY + 12;
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Transactions by Day of Week', 14, yPos);
  
  doc.autoTable({
    startY: yPos + 4,
    head: [['Day', 'Transaction Count', 'Revenue']],
    body: data.transactionsByDay.map(d => [
      d.day,
      d.count.toString(),
      `₹${d.revenue.toLocaleString()}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 14, right: 14 },
  });
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | DineDeal Analytics Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};
