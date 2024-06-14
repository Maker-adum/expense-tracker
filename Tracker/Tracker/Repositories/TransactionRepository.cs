using System.Text.Json;
using Tracker.Models;
using Tracker.WebApi.Models;

namespace Tracker
{
    public class TransactionRepository
    {
        private List<BudgetTransaction> _transactions;
        private readonly string _filePath = "transactions.json";

        public TransactionRepository()
        {
            LoadFromFile();
            // Add some initial data if the file is empty
            if (!_transactions.Any())
            {
                SaveToFile();
            }
        }

        public IEnumerable<BudgetTransaction> GetAll() => _transactions;

        public BudgetTransaction GetById(int id) => _transactions.FirstOrDefault(t => t.Id == id);


        // Getting by category 
        public IEnumerable<BudgetTransaction> GetByCategory(string categoryType)
        {
            bool isIncome = categoryType.ToLower() == "income";
            var incomeCategories = new[]
            {
                TransactionCategory.Salary,
                TransactionCategory.Sales,
                TransactionCategory.SideHustle,
                TransactionCategory.Allowances
            };

            var expenseCategories = new[]
            {
                TransactionCategory.Entertainment,
                TransactionCategory.Groceries,
                TransactionCategory.Subsriptions
            };

            return _transactions.Where(t => isIncome ? incomeCategories.Contains(t.Category) : expenseCategories.Contains(t.Category));
        }

        public void Add(BudgetTransaction transaction)
        {
            // Assign a unique Id to the transaction
            transaction.Id = _transactions.Any() ? _transactions.Max(t => t.Id) + 1 : 1;
            _transactions.Add(transaction);
            SaveToFile();
        }

        public void Update(BudgetTransaction transaction)
        {
            var existingTransaction = GetById(transaction.Id);
            if (existingTransaction != null)
            {
                // Update the properties of the existing transaction
                existingTransaction.Category = transaction.Category;
                existingTransaction.Amount = transaction.Amount;
                existingTransaction.Date = transaction.Date;
                existingTransaction.Description = transaction.Description;
                SaveToFile();
            }
        }

        public void Delete(int id)
        {
            var transaction = GetById(id);
            if (transaction != null)
            {
                // Remove the transaction from the list
                _transactions.Remove(transaction);
                SaveToFile();
            }
        }

        private void SaveToFile()
        {
            var json = JsonSerializer.Serialize(_transactions);
            File.WriteAllText(_filePath, json);
        }

        private void LoadFromFile()
        {
            if (File.Exists(_filePath))
            {
                var json = File.ReadAllText(_filePath);
                _transactions = JsonSerializer.Deserialize<List<BudgetTransaction>>(json) ?? new List<BudgetTransaction>();
            }
            else
            {
                _transactions = new List<BudgetTransaction>();
            }
        }
    }
}
