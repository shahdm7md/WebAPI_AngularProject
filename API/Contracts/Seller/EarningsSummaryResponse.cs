namespace API.Contracts.Seller
{
    public class EarningsSummaryResponse
    {
        public decimal TotalEarnings { get; set; }
        public decimal ThisMonthEarnings { get; set; }
        public decimal LastMonthEarnings { get; set; }
        public int TotalOrders { get; set; }
        public int ThisMonthOrders { get; set; }
        public decimal AverageOrderValue { get; set; }
    }
}
