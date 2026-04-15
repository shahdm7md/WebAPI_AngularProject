namespace API.Contracts.Admin
{
    public sealed class DashboardStatsResponse
    {
        public int TotalUsers { get; init; }
        public int ActiveSellers { get; init; }
        public int PendingSellers { get; init; }
        public int TotalOrders { get; init; }
        public int TotalOrdersToday { get; init; }
        public decimal NetRevenue { get; init; }
        public int LowStockProducts { get; init; }
    }
}
