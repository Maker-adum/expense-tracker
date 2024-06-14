document.addEventListener('DOMContentLoaded', () => {
    const transactionsTableBody = document.querySelector('#transactions-table tbody');
    const balanceElement = document.getElementById('balance');
    const addTransactionForm = document.getElementById('add-transaction-form');
    const loadTransactionsButton = document.getElementById('load-transactions-button');
    const exportButton = document.getElementById('export-button');
    const editForm = document.getElementById('edit-transaction-form');
    const modal = document.querySelector('.modal');
    const apiBaseUrl = 'https://localhost:7060/budgettransaction';

    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');

    const categories = {
        income: ['Salary', 'Sales', 'Allowance', 'Side Hustle'],
        expense: ['Entertainment', 'Groceries', 'Subscriptions']
    };

    function updateCategories() {
        const selectedType = typeSelect.value;
        const selectedCategories = categories[selectedType];

        // Clear existing options
        categorySelect.innerHTML = '';

        // Add new options
        selectedCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase().replace(/\s+/g, '');
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    // Update categories on page load
    updateCategories();

    // Update categories when type changes
    typeSelect.addEventListener('change', updateCategories);

    let transactions = [];

    async function fetchTransactions() {
        try {
            const response = await fetch(apiBaseUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            transactions = await response.json();

            // Assign type to each transaction based on category
            transactions.forEach(transaction => {
                if (categories.income.includes(transaction.category)) {
                    transaction.type = 'income';
                } else if (categories.expense.includes(transaction.category)) {
                    transaction.type = 'expense';
                }
            });

            renderTransactions();
            updateBalance();
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    }

    function renderTransactions() {
        transactionsTableBody.innerHTML = '';
        const recentTransactions = transactions.slice(-10);
        recentTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="ID">${transaction.id}</td>
                <td data-label="Amount">${transaction.amount}</td>
                <td data-label="Category">${transaction.category}</td>
                <td data-label="Date">${new Date(transaction.date).toLocaleDateString()}</td>
                <td data-label="Description">${transaction.description}</td>
                <td data-label="Actions">
                    <button data-id="${transaction.id}" class="edit-button">Edit</button>
                    <button data-id="${transaction.id}" class="delete-button">Delete</button>
                </td>
            `;
            transactionsTableBody.appendChild(row);
        });
    }

    transactionsTableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('edit-button')) {
            const id = target.dataset.id; // Get ID from data-id attribute
            openEditForm(id);
        } else if (target.classList.contains('delete-button')) {
            const id = target.dataset.id; // Get ID from data-id attribute
            deleteTransaction(id);
        }
    });

    async function openEditForm(transactionId) {
        try {
            const response = await fetch(`${apiBaseUrl}/${transactionId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const transaction = await response.json();
            document.getElementById('editTransactionId').value = transaction.id;
            document.getElementById('editAmount').value = transaction.amount;
            document.getElementById('editDescription').value = transaction.description;
            document.getElementById('editCategory').value = transaction.category.toLowerCase().replace(/\s+/g, '');
            document.getElementById('editTransactionDate').value = transaction.date.slice(0, 10);

            // Show the modal
            modal.style.display = 'block';
        } catch (error) {
            console.error('Failed to fetch transaction for edit:', error);
        }
    }

    async function deleteTransaction(id) {
        try {
            const response = await fetch(`${apiBaseUrl}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Find the transaction to delete from the local array
            const index = transactions.findIndex(transaction => transaction.id === parseInt(id));
            if (index !== -1) {
                const deletedTransaction = transactions.splice(index, 1)[0];

                // Update balance locally
                if (deletedTransaction.type === 'income') {
                    balance -= parseFloat(deletedTransaction.amount) || 0;
                } else if (deletedTransaction.type === 'expense') {
                    balance += parseFloat(deletedTransaction.amount) || 0;
                }
                updateBalance(); // Update balance immediately

                renderTransactions();
            }
        } catch (error) {
            console.error('Failed to delete transaction:', error);
        }
    }

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const transactionId = document.getElementById('editTransactionId').value;
        const amount = parseFloat(document.getElementById('editAmount').value);
        const description = document.getElementById('editDescription').value;
        const category = document.getElementById('editCategory').value;
        const date = document.getElementById('editTransactionDate').value;
        const updatedTransaction = { id: transactionId, amount, description, category, date };

        try {
            const response = await fetch(`${apiBaseUrl}/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTransaction)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const updatedTransactionData = await response.json();

            // Update the transaction in the local array
            const index = transactions.findIndex(transaction => transaction.id === parseInt(updatedTransactionData.id));
            if (index !== -1) {
                const oldTransaction = transactions[index];
                transactions[index] = updatedTransactionData;

                // Update balance locally
                if (oldTransaction.type === 'income') {
                    balance -= parseFloat(oldTransaction.amount) || 0;
                } else if (oldTransaction.type === 'expense') {
                    balance += parseFloat(oldTransaction.amount) || 0;
                }

                if (updatedTransactionData.type === 'income') {
                    balance += parseFloat(updatedTransactionData.amount) || 0;
                } else if (updatedTransactionData.type === 'expense') {
                    balance -= parseFloat(updatedTransactionData.amount) || 0;
                }
                updateBalance(); // Update balance immediately

                renderTransactions();
                modal.style.display = 'none'; // Close the modal
            }
        } catch (error) {
            console.error('Failed to update transaction:', error);
        }
    });

    function updateBalance() {
        let balance = 0;
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                balance += parseFloat(transaction.amount) || 0;
            } else if (transaction.type === 'expense') {
                balance -= parseFloat(transaction.amount) || 0;
            }
        });
        balanceElement.innerText = balance.toFixed(2);
        if (balance < 0) {
            balanceElement.classList.add('negative-balance');
        } else {
            balanceElement.classList.remove('negative-balance');
        }
    }

    function resetForm() {
        addTransactionForm.reset();
        updateCategories();
        const transactionIdInput = document.getElementById('transaction-id');
        if (transactionIdInput) {
            transactionIdInput.remove();
        }
    }

    addTransactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const transactionId = document.getElementById('transaction-id') ? document.getElementById('transaction-id').value : null;

        const newTransaction = { type, category, amount, date: new Date().toISOString(), description };

        try {
            let response;
            if (transactionId) {
                // Update existing transaction
                response = await fetch(`${apiBaseUrl}/${transactionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTransaction)
                });
            } else {
                // Add new transaction
                response = await fetch(apiBaseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTransaction)
                });
            }

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const createdOrUpdatedTransaction = await response.json();

            if (transactionId) {
                // Update transaction in the transactions array
                const index = transactions.findIndex(transaction => transaction.id === parseInt(transactionId));
                if (index !== -1) {
                    transactions[index] = createdOrUpdatedTransaction;
                }
            } else {
                // Add new transaction to the transactions array
                transactions.push(createdOrUpdatedTransaction);
            }

            // Update balance locally
            if (type === 'income') {
                balance += amount;
            } else if (type === 'expense') {
                balance -= amount;
            }
            updateBalance(); // Update balance immediately

            renderTransactions();
            resetForm();
        } catch (error) {
            console.error('Failed to add transaction:', error);
        }
    });

    loadTransactionsButton.addEventListener('click', fetchTransactions);

    exportButton.addEventListener('click', () => {
        const csvContent = 'data:text/csv;charset=utf-8,'
            + transactions.map(transaction => `${transaction.id},${transaction.amount},${transaction.category},${transaction.date},${transaction.description}`).join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'transactions.csv');
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
    });

    fetchTransactions();
});
