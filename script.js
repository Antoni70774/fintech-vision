import Chart from "chart.js";

const balanceValue = document.getElementById("balance-value");
const incomeValue = document.getElementById("income-value");
const expensesValue = document.getElementById("expenses-value");
const transactionList = document.getElementById("transaction-list");
const transactionForm = document.getElementById("transaction-form");
const modal = document.getElementById("modal");
const addTransactionBtn = document.getElementById("add-transaction-btn");
const closeModalBtn = document.querySelector(".close-modal-btn");
const installBtn = document.getElementById("install-btn");

let transactions = [];
let deferredPrompt;

// Modal control
addTransactionBtn.addEventListener("click", () => modal.classList.add("active"));
closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));

// Form submission
transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    const transaction = { description, amount, type, category, date };
    transactions.push(transaction);

    updateDashboard();
    renderTransactions();
    updateChart();

    transactionForm.reset();
    modal.classList.remove("active");
});

// Atualiza os valores
function updateDashboard() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expenses;

    balanceValue.textContent = `R$ ${balance.toFixed(2)}`;
    incomeValue.textContent = `R$ ${income.toFixed(2)}`;
    expensesValue.textContent = `R$ ${expenses.toFixed(2)}`;
}

// Renderiza histórico
function renderTransactions() {
    transactionList.innerHTML = "";

    transactions.forEach((t, index) => {
        const li = document.createElement("li");
        li.className = t.type;
        li.innerHTML = `
            <strong>${t.description}</strong> - R$ ${t.amount.toFixed(2)} 
            <em>(${t.category} - ${t.date})</em>
            <button onclick="deleteTransaction(${index})">🗑️</button>
        `;
        transactionList.appendChild(li);
    });
}

// Deleta transação
window.deleteTransaction = function(index) {
    transactions.splice(index, 1);
    updateDashboard();
    renderTransactions();
    updateChart();
};

// Gráfico por categoria
const ctx = document.getElementById("category-chart").getContext("2d");
let categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: [],
        datasets: [{
            label: "Despesas por Categoria",
            data: [],
            backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF"
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: "bottom" }
        }
    }
});

function updateChart() {
    const categories = {};
    transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

    categoryChart.data.labels = Object.keys(categories);
    categoryChart.data.datasets[0].data = Object.values(categories);
    categoryChart.update();
}

// Instalação do PWA
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choice => {
            if (choice.outcome === "accepted") {
                installBtn.classList.add("hidden");
            }
            deferredPrompt = null;
        });
    }
});
