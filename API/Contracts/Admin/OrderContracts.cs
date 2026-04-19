using SharedKernel.Enums;

namespace API.Contracts.Admin
{
    public sealed class AdminOrderResponse
    {
        public int Id { get; init; }
        public string CustomerName { get; init; } = string.Empty;
        public string CustomerEmail { get; init; } = string.Empty;
        public decimal TotalAmount { get; init; }
        public OrderStatus Status { get; init; } 
        public string PaymentMethod { get; init; } = string.Empty;
        public DateTime CreatedAt { get; init; }
    }

    public sealed class UpdateOrderStatusRequest
    {
        public string Status { get; init; } = string.Empty;
    }

    public sealed class UpdateOrderStatusResult
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string Message { get; init; } = string.Empty;
    }
}
