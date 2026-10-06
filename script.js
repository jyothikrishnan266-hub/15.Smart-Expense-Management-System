// ===============================
// DATA
// ===============================

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let incomes = JSON.parse(localStorage.getItem("incomes")) || [];

let users = JSON.parse(localStorage.getItem("users")) || [
    {
        username: "admin",
        password: "admin123",
        role: "Admin"
    }
];

let budget = Number(localStorage.getItem("budget")) || 0;

let currentUser = null;

let expenseChart = null;
let reportChart = null;


// ===============================
// LOGIN
// ===============================

function login() {

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const user = users.find(
        u => u.username === username &&
             u.password === password
    );

    if (!user) {
        alert("Invalid username or password!");
        return;
    }

    currentUser = user;

    document.getElementById("loginPage")
        .classList.add("hidden");

    document.getElementById("app")
        .classList.remove("hidden");

    document.getElementById("welcomeText").innerText =
        `Welcome, ${user.username} (${user.role})`;

    updateDashboard();
    displayExpenses();
    displayIncome();
    displayUsers();
    displayHistory();
    updateBudget();

    showSection("dashboard");
}


// ===============================
// LOGOUT
// ===============================

function logout() {

    currentUser = null;

    document.getElementById("app")
        .classList.add("hidden");

    document.getElementById("loginPage")
        .classList.remove("hidden");

    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
}


// ===============================
// NAVIGATION
// ===============================

function showSection(sectionName) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    const section = document.getElementById(sectionName);

    if (section) {
        section.classList.remove("hidden");
    }

    const titles = {
        dashboard: "Dashboard",
        expenses: "Expense Management",
        income: "Income Management",
        budget: "Budget Management",
        reports: "Reports & Analytics",
        history: "Expense History",
        users: "User Management"
    };

    document.getElementById("pageTitle").innerText =
        titles[sectionName] || "Dashboard";

    if (sectionName === "reports") {
        createReportChart();
    }
}


// ===============================
// EXPENSE FORM
// ===============================

const expenseForm =
    document.getElementById("expenseForm");

if (expenseForm) {

    expenseForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const id =
            document.getElementById("expenseId").value;

        const receiptInput =
            document.getElementById("receipt");

        const expense = {

            id: id ? Number(id) : Date.now(),

            title:
                document.getElementById("expenseTitle").value.trim(),

            amount:
                Number(
                    document.getElementById("expenseAmount").value
                ),

            category:
                document.getElementById("expenseCategory").value,

            date:
                document.getElementById("expenseDate").value,

            status:
                document.getElementById("expenseStatus").value,

            description:
                document.getElementById("expenseDescription").value.trim(),

            receipt:
                receiptInput.files.length > 0
                    ? receiptInput.files[0].name
                    : ""
        };


        if (id) {

            const index =
                expenses.findIndex(
                    e => e.id === Number(id)
                );

            if (index !== -1) {
                expenses[index] = expense;
            }

        } else {

            expenses.push(expense);
        }


        saveData();

        expenseForm.reset();

        document.getElementById("expenseId").value = "";

        setTodayDate();

        alert("Expense saved successfully!");

        displayExpenses();
        displayHistory();
        updateDashboard();
        updateBudget();
    });
}


// ===============================
// DISPLAY EXPENSES
// ===============================

function displayExpenses() {

    const table =
        document.getElementById("expenseTable");

    if (!table) return;

    const searchElement =
        document.getElementById("searchExpense");

    const categoryElement =
        document.getElementById("filterCategory");

    const search =
        searchElement
            ? searchElement.value.toLowerCase()
            : "";

    const category =
        categoryElement
            ? categoryElement.value
            : "";

    table.innerHTML = "";


    const filteredExpenses =
        expenses.filter(expense => {

            const matchesSearch =
                expense.title.toLowerCase().includes(search) ||
                expense.category.toLowerCase().includes(search) ||
                expense.status.toLowerCase().includes(search);

            const matchesCategory =
                category === "" ||
                expense.category === category;

            return matchesSearch && matchesCategory;
        });


    if (filteredExpenses.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No expenses found
                </td>
            </tr>
        `;

        return;
    }


    filteredExpenses.forEach(expense => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHTML(expense.title)}</td>

            <td>₹${formatNumber(expense.amount)}</td>

            <td>${escapeHTML(expense.category)}</td>

            <td>${expense.date}</td>

            <td>
                <span class="status ${expense.status}">
                    ${expense.status}
                </span>
            </td>

            <td>
                ${expense.receipt
                    ? escapeHTML(expense.receipt)
                    : "No receipt"}
            </td>

            <td>

                <button
                    class="action-btn edit"
                    onclick="editExpense(${expense.id})">
                    Edit
                </button>

                <button
                    class="action-btn delete"
                    onclick="deleteExpense(${expense.id})">
                    Delete
                </button>

                ${
                    expense.status === "Pending"
                    ?
                    `
                    <button
                        class="action-btn approve"
                        onclick="approveExpense(${expense.id})">
                        Approve
                    </button>

                    <button
                        class="action-btn reject"
                        onclick="rejectExpense(${expense.id})">
                        Reject
                    </button>
                    `
                    :
                    ""
                }

            </td>
        `;

        table.appendChild(row);
    });
}


// ===============================
// EDIT EXPENSE
// ===============================

function editExpense(id) {

    const expense =
        expenses.find(e => e.id === id);

    if (!expense) {
        alert("Expense not found.");
        return;
    }

    document.getElementById("expenseId").value =
        expense.id;

    document.getElementById("expenseTitle").value =
        expense.title;

    document.getElementById("expenseAmount").value =
        expense.amount;

    document.getElementById("expenseCategory").value =
        expense.category;

    document.getElementById("expenseDate").value =
        expense.date;

    document.getElementById("expenseStatus").value =
        expense.status;

    document.getElementById("expenseDescription").value =
        expense.description || "";

    showSection("expenses");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ===============================
// DELETE EXPENSE
// ===============================

function deleteExpense(id) {

    const confirmed =
        confirm("Are you sure you want to delete this expense?");

    if (!confirmed) return;

    expenses =
        expenses.filter(e => e.id !== id);

    saveData();

    displayExpenses();
    displayHistory();
    updateDashboard();
    updateBudget();

    alert("Expense deleted successfully.");
}


// ===============================
// APPROVE EXPENSE
// ===============================

function approveExpense(id) {

    const expense =
        expenses.find(e => e.id === id);

    if (!expense) return;

    expense.status = "Approved";

    saveData();

    displayExpenses();
    displayHistory();
    updateDashboard();
    updateBudget();

    alert("Expense approved successfully.");
}


// ===============================
// REJECT EXPENSE
// ===============================

function rejectExpense(id) {

    const expense =
        expenses.find(e => e.id === id);

    if (!expense) return;

    expense.status = "Rejected";

    saveData();

    displayExpenses();
    displayHistory();
    updateDashboard();
    updateBudget();

    alert("Expense rejected.");
}


// ===============================
// INCOME FORM
// ===============================

const incomeForm =
    document.getElementById("incomeForm");

if (incomeForm) {

    incomeForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const income = {

            id: Date.now(),

            title:
                document.getElementById("incomeTitle")
                    .value.trim(),

            amount:
                Number(
                    document.getElementById("incomeAmount")
                        .value
                ),

            date:
                document.getElementById("incomeDate")
                    .value
        };


        incomes.push(income);

        localStorage.setItem(
            "incomes",
            JSON.stringify(incomes)
        );

        incomeForm.reset();

        setTodayDate();

        displayIncome();
        updateDashboard();

        alert("Income added successfully.");
    });
}


// ===============================
// DISPLAY INCOME
// ===============================

function displayIncome() {

    const table =
        document.getElementById("incomeTable");

    if (!table) return;

    table.innerHTML = "";


    if (incomes.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No income records found
                </td>
            </tr>
        `;

        return;
    }


    incomes.forEach(income => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHTML(income.title)}</td>

            <td>₹${formatNumber(income.amount)}</td>

            <td>${income.date}</td>

            <td>

                <button
                    class="action-btn delete"
                    onclick="deleteIncome(${income.id})">
                    Delete
                </button>

            </td>
        `;

        table.appendChild(row);
    });
}


// ===============================
// DELETE INCOME
// ===============================

function deleteIncome(id) {

    if (!confirm("Delete this income record?")) {
        return;
    }

    incomes =
        incomes.filter(i => i.id !== id);

    localStorage.setItem(
        "incomes",
        JSON.stringify(incomes)
    );

    displayIncome();
    updateDashboard();

    alert("Income deleted successfully.");
}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    const totalIncome =
        incomes.reduce(
            (sum, item) => sum + Number(item.amount),
            0
        );


    const totalExpense =
        expenses
            .filter(e => e.status !== "Rejected")
            .reduce(
                (sum, item) => sum + Number(item.amount),
                0
            );


    const balance =
        totalIncome - totalExpense;


    const incomeElement =
        document.getElementById("totalIncome");

    const expenseElement =
        document.getElementById("totalExpense");

    const balanceElement =
        document.getElementById("balance");

    const budgetElement =
        document.getElementById("dashboardBudget");


    if (incomeElement) {
        incomeElement.innerText =
            `₹${formatNumber(totalIncome)}`;
    }

    if (expenseElement) {
        expenseElement.innerText =
            `₹${formatNumber(totalExpense)}`;
    }

    if (balanceElement) {
        balanceElement.innerText =
            `₹${formatNumber(balance)}`;
    }

    if (budgetElement) {
        budgetElement.innerText =
            `₹${formatNumber(budget)}`;
    }


    createExpenseChart();

    displayRecentExpenses();

    updateNotifications();
}


// ===============================
// EXPENSE CHART
// ===============================

function createExpenseChart() {

    const canvas =
        document.getElementById("expenseChart");

    if (!canvas) return;


    const categories = {};


    expenses.forEach(expense => {

        if (expense.status === "Rejected") {
            return;
        }

        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }

        categories[expense.category] +=
            Number(expense.amount);
    });


    if (expenseChart) {
        expenseChart.destroy();
    }


    expenseChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels:
                Object.keys(categories),

            datasets: [{

                data:
                    Object.values(categories),

                backgroundColor: [
                    "#4f46e5",
                    "#10b981",
                    "#ef4444",
                    "#f59e0b",
                    "#3b82f6",
                    "#8b5cf6",
                    "#ec4899",
                    "#14b8a6"
                ]
            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


// ===============================
// RECENT EXPENSES
// ===============================

function displayRecentExpenses() {

    const container =
        document.getElementById("recentExpenses");

    if (!container) return;

    container.innerHTML = "";


    const recent =
        expenses
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            "<p>No expenses available.</p>";

        return;
    }


    recent.forEach(expense => {

        container.innerHTML += `

            <div class="expense-item">

                <span>
                    ${escapeHTML(expense.title)}

                    <small>
                        (${escapeHTML(expense.category)})
                    </small>
                </span>

                <strong>
                    ₹${formatNumber(expense.amount)}
                </strong>

            </div>
        `;
    });
}


// ===============================
// BUDGET FORM
// ===============================

const budgetForm =
    document.getElementById("budgetForm");

if (budgetForm) {

    budgetForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const amount =
            Number(
                document.getElementById("budgetAmount")
                    .value
            );


        if (amount < 0) {
            alert("Budget cannot be negative.");
            return;
        }


        budget = amount;

        localStorage.setItem(
            "budget",
            budget
        );


        updateBudget();
        updateDashboard();

        budgetForm.reset();

        alert("Budget updated successfully.");
    });
}


// ===============================
// UPDATE BUDGET
// ===============================

function updateBudget() {

    const spent =
        expenses
            .filter(e => e.status !== "Rejected")
            .reduce(
                (sum, e) =>
                    sum + Number(e.amount),
                0
            );


    const budgetText =
        document.getElementById("budgetText");

    const progressBar =
        document.getElementById("progressBar");


    if (!budgetText || !progressBar) {
        return;
    }


    budgetText.innerText =
        `₹${formatNumber(spent)} / ₹${formatNumber(budget)}`;


    let percentage =
        budget > 0
            ? (spent / budget) * 100
            : 0;


    percentage =
        Math.min(percentage, 100);


    progressBar.style.width =
        percentage + "%";


    if (percentage >= 90) {

        progressBar.style.background =
            "#dc2626";

    } else if (percentage >= 70) {

        progressBar.style.background =
            "#f59e0b";

    } else {

        progressBar.style.background =
            "#4f46e5";
    }
}


// ===============================
// NOTIFICATIONS
// ===============================

function updateNotifications() {

    const notification =
        document.getElementById("notificationCount");

    if (!notification) return;


    const pending =
        expenses.filter(
            e => e.status === "Pending"
        ).length;


    notification.innerText = pending;


    if (pending > 0) {

        notification.title =
            `${pending} expense(s) waiting for approval`;

    } else {

        notification.title =
            "No pending expenses";
    }
}


// ===============================
// HISTORY
// ===============================

function displayHistory() {

    const container =
        document.getElementById("historyList");

    if (!container) return;

    container.innerHTML = "";


    if (expenses.length === 0) {

        container.innerHTML =
            "<p>No expense history available.</p>";

        return;
    }


    expenses
        .slice()
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        )
        .forEach(expense => {

            container.innerHTML += `

                <div class="history-item">

                    <strong>
                        ${escapeHTML(expense.title)}
                    </strong>

                    <p>
                        ₹${formatNumber(expense.amount)}
                        |
                        ${escapeHTML(expense.category)}
                        |
                        ${expense.date}
                    </p>

                    <small>
                        Status:
                        <strong>
                            ${expense.status}
                        </strong>
                    </small>

                </div>
            `;
        });
}


// ===============================
// USER FORM
// ===============================

const userForm =
    document.getElementById("userForm");

if (userForm) {

    userForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const username =
            document.getElementById("newUsername")
                .value.trim();

        const password =
            document.getElementById("newPassword")
                .value;

        const role =
            document.getElementById("newRole")
                .value;


        if (!username || !password) {
            alert("Please enter username and password.");
            return;
        }


        if (
            users.some(
                u => u.username.toLowerCase() ===
                     username.toLowerCase()
            )
        ) {

            alert("Username already exists!");
            return;
        }


        users.push({
            username,
            password,
            role
        });


        localStorage.setItem(
            "users",
            JSON.stringify(users)
        );


        userForm.reset();

        displayUsers();

        alert("User added successfully.");
    });
}


// ===============================
// DISPLAY USERS
// ===============================

function displayUsers() {

    const table =
        document.getElementById("userTable");

    if (!table) return;

    table.innerHTML = "";


    users.forEach((user, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(user.username)}
            </td>

            <td>
                ${escapeHTML(user.role)}
            </td>

            <td>

                ${
                    index !== 0
                    ?
                    `
                    <button
                        class="action-btn delete"
                        onclick="deleteUser(${index})">
                        Delete
                    </button>
                    `
                    :
                    "Main Admin"
                }

            </td>
        `;


        table.appendChild(row);
    });
}


// ===============================
// DELETE USER
// ===============================

function deleteUser(index) {

    if (index === 0) {
        alert("The main admin cannot be deleted.");
        return;
    }


    if (!confirm("Delete this user?")) {
        return;
    }


    users.splice(index, 1);


    localStorage.setItem(
        "users",
        JSON.stringify(users)
    );


    displayUsers();

    alert("User deleted successfully.");
}


// ===============================
// REPORT CHART
// ===============================

function createReportChart() {

    const canvas =
        document.getElementById("reportChart");

    if (!canvas) return;


    const categories = {};


    expenses.forEach(expense => {

        if (expense.status === "Rejected") {
            return;
        }

        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }

        categories[expense.category] +=
            Number(expense.amount);
    });


    if (reportChart) {
        reportChart.destroy();
    }


    reportChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels:
                Object.keys(categories),

            datasets: [{

                label: "Expenses",

                data:
                    Object.values(categories),

                backgroundColor:
                    "#4f46e5",

                borderRadius: 6
            }]
        },

        options: {

            responsive: true,

            scales: {

                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// ===============================
// EXPORT EXCEL
// ===============================

function exportExcel() {

    if (typeof XLSX === "undefined") {

        alert("Excel export library is not loaded.");

        return;
    }


    const data =
        expenses.map(expense => ({

            Title: expense.title,

            Amount: expense.amount,

            Category: expense.category,

            Date: expense.date,

            Status: expense.status,

            Description: expense.description,

            Receipt: expense.receipt

        }));


    const worksheet =
        XLSX.utils.json_to_sheet(data);


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Expenses"
    );


    XLSX.writeFile(
        workbook,
        "Expense_Report.xlsx"
    );
}


// ===============================
// EXPORT PDF
// ===============================

function exportPDF() {

    if (!window.jspdf) {

        alert("PDF export library is not loaded.");

        return;
    }


    const { jsPDF } = window.jspdf;

    const doc =
        new jsPDF();


    doc.setFontSize(18);

    doc.text(
        "Expense Management Report",
        20,
        20
    );


    doc.setFontSize(10);


    let y = 35;


    expenses.forEach((expense, index) => {

        const text =
            `${index + 1}. ${expense.title} | ₹${expense.amount} | ${expense.category} | ${expense.date} | ${expense.status}`;


        doc.text(
            text.substring(0, 110),
            10,
            y
        );


        y += 8;


        if (y > 280) {

            doc.addPage();

            y = 20;
        }
    });


    doc.save(
        "Expense_Report.pdf"
    );
}


// ===============================
// SAVE DATA
// ===============================

function saveData() {

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "incomes",
        JSON.stringify(incomes)
    );
}


// ===============================
// SEARCH / FILTER
// ===============================

const searchExpense =
    document.getElementById("searchExpense");

if (searchExpense) {

    searchExpense.addEventListener(
        "input",
        displayExpenses
    );
}


const filterCategory =
    document.getElementById("filterCategory");

if (filterCategory) {

    filterCategory.addEventListener(
        "change",
        displayExpenses
    );
}


// ===============================
// DATE
// ===============================

function setTodayDate() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const expenseDate =
        document.getElementById("expenseDate");

    const incomeDate =
        document.getElementById("incomeDate");


    if (expenseDate) {
        expenseDate.value = today;
    }

    if (incomeDate) {
        incomeDate.value = today;
    }
}


// ===============================
// FORMAT NUMBER
// ===============================

function formatNumber(number) {

    return Number(number || 0)
        .toLocaleString("en-IN");
}


// ===============================
// SECURITY HELPER
// ===============================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// INITIALIZE
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setTodayDate();

        displayExpenses();

        displayIncome();

        displayUsers();

        displayHistory();

        updateBudget();
    }
);
