using Tracker.Models;

namespace Tracker.WebApi.Models
{
    public class BudgetTransaction
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public TransactionCategory Category { get; set; }
        public DateTime Date { get; set; }
        public string Description {  get; set; }
    }
}
