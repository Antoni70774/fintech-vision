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

// Adicionar carregamento inicial dos dados
transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

// Função para salvar dados
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Adicionar formatação de moeda no input
document.getElementById("amount").addEventListener("input", function(e) {
    // Remove caracteres não numéricos
    let value = e.target.value.replace(/\D/g, "");
    
    // Converte para decimal
    value = (parseFloat(value) / 100).toFixed(2);
    
    // Atualiza o valor apenas se for um número válido
    if (!isNaN(value)) {
        e.target.value = value;
    }
});

// Remover evento duplicado de formatação e adicionar novo
document.getElementById("amount").addEventListener("input", function(e) {
    try {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (value) {
            const numberValue = (parseInt(value) / 100);
            e.target.value = numberValue.toLocaleString('pt-BR', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    } catch (error) {
        console.error('Erro na formatação:', error);
    }
});

// Adicionar data atual automaticamente
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;
});

// Form submission
transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();

    try {
        const description = document.getElementById("description").value.trim();
        const amountStr = document.getElementById("amount").value
            .replace(/\./g, '')
            .replace(',', '.');
        const amount = parseFloat(amountStr);
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;
        const date = document.getElementById("date").value;

        if (!description || !amount || !category || !date) {
            showMobileAlert('Preencha todos os campos');
            return;
        }

        const transaction = { 
            description, 
            amount: Number(amount.toFixed(2)), 
            type, 
            category, 
            date 
        };

        transactions.push(transaction);
        saveTransactions();
        updateDashboard();
        renderTransactions();
        updateChart();

        showMobileAlert('Lançamento realizado com sucesso!');
        
        transactionForm.reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("date").value = today;
        modal.classList.remove("active");
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        showMobileAlert('Erro ao adicionar transação');
    }
});

// Função para formatar moeda em PT-BR
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Atualiza os valores do dashboard
function updateDashboard() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expenses;

    balanceValue.textContent = formatCurrency(balance);
    incomeValue.textContent = formatCurrency(income);
    expensesValue.textContent = formatCurrency(expenses);
}

// Renderiza histórico com nova formatação
function renderTransactions() {
    transactionList.innerHTML = "";

    transactions.forEach((t, index) => {
        const li = document.createElement("li");
        li.className = t.type;
        li.innerHTML = `
            <strong>${t.description}</strong> - ${formatCurrency(t.amount)}
            <em>(${t.category} - ${new Date(t.date).toLocaleDateString('pt-BR')})</em>
            <button onclick="deleteTransaction(${index})">🗑️</button>
        `;
        transactionList.appendChild(li);
    });
}

// Deleta transação
window.deleteTransaction = function(index) {
    if (confirm('Deseja realmente excluir esta transação?')) {
        transactions.splice(index, 1);
        saveTransactions();
        updateDashboard();
        renderTransactions();
        updateChart();
    }
};

// Gráfico por categoria
const ctx = document.getElementById("category-chart");
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
            legend: { 
                position: "bottom",
                display: true
            }
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

// Adicionar carregamento inicial ao final do arquivo
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    renderTransactions();
    updateChart();
});

// Adicionar tratamento de erro para o Chart
window.addEventListener('error', function(e) {
    console.error('Erro capturado:', e.error);
});

// Adicionar feedback tátil para mobile
function vibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Modificar showMobileAlert
function showMobileAlert(message) {
    vibrate();
    const alertDiv = document.createElement('div');
    alertDiv.className = 'mobile-alert';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 2000);
}
