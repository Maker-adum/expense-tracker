using System.Text.Json.Serialization;

namespace Tracker.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TransactionCategory
    {
        Salary,
        Sales,
        SideHustle,
        Allowances,

        Entertainment,
        Groceries,
        Subsriptions
    }
}
