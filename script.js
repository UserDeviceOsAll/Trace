let storedData = localStorage.getItem('traceData');
let expenses = [];
try {
    expenses = JSON.parse(storedData) || [];
    if (!Array.isArray(expenses)) expenses = [];
} catch (e) {
    expenses = [];
}

let budget = parseFloat(localStorage.getItem('traceBudget')) || 0;

const form = document.getElementById('expense-form');
if (form) {
    document.getElementById('date').valueAsDate = new Date();
    form.addEventListener('submit', e => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        if (isNaN(amount)) return;
        
        expenses.push({
            amount: amount,
            date: document.getElementById('date').value,
            category: document.getElementById('category').value
        });
        localStorage.setItem('traceData', JSON.stringify(expenses));
        location.href = 'history.html';
    });
}

const list = document.getElementById('history-list');
if (list) {
    const empty = document.getElementById('empty-msg');
    if (expenses.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        expenses.forEach((x, i) => {
            const amt = parseFloat(x.amount) || 0;
            const cat = x.category || 'Other';
            const dt = x.date || 'Unknown';
            list.innerHTML += `<tr><td>${dt}</td><td>${cat}</td><td>₹${amt.toFixed(2)}</td><td><button class="delete-btn" onclick="del(${i})">Delete</button></td></tr>`;
        });
    }

    document.getElementById('export-btn').onclick = () => {
        if (expenses.length === 0) return alert('No data');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' }));
        a.download = 'trace_backup.json';
        a.click();
    };

    document.getElementById('import-file').onchange = e => {
        const r = new FileReader();
        r.onload = ev => {
            try {
                const d = JSON.parse(ev.target.result);
                if (Array.isArray(d)) {
                    localStorage.setItem('traceData', JSON.stringify(d));
                    location.reload();
                }
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        if (e.target.files[0]) r.readAsText(e.target.files[0]);
    };
}

window.del = i => {
    expenses.splice(i, 1);
    localStorage.setItem('traceData', JSON.stringify(expenses));
    location.reload();
};

const totalEl = document.getElementById('total-amount');
if (totalEl) {
    const now = new Date();
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const day = now.getDate();
    const rem = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - day;
    
    const monthly = expenses.filter(x => x.date && x.date.startsWith(cm));
    
    let total = 0;
    let cats = {};
    
    monthly.forEach(x => { 
        const amt = parseFloat(x.amount) || 0;
        total += amt; 
        cats[x.category] = (cats[x.category] || 0) + amt; 
    });
    
    let top = 'None';
    let max = 0;
    
    for (let c in cats) {
        if (cats[c] > max) { 
            max = cats[c]; 
            top = c; 
        }
    }

    const avg = monthly.length > 0 ? total / day : 0;
    const save = budget - total;
    const safe = rem > 0 ? save / rem : save;
    const pct = budget > 0 ? (safe / budget) * 100 : 0;

    totalEl.textContent = `₹${total.toFixed(2)}`;
    document.getElementById('top-category').textContent = top;
    document.getElementById('budget-display').textContent = `₹${budget.toFixed(2)}`;
    document.getElementById('avg-daily').textContent = `₹${avg.toFixed(2)}`;
    document.getElementById('safe-daily').textContent = `₹${safe.toFixed(2)}`;
    
    const sv = document.getElementById('savings-amount');
    sv.textContent = `₹${save.toFixed(2)}`;
    if (save < 0) sv.classList.add('negative');

    const warn = document.getElementById('budget-warning');
    if (budget > 0) {
        warn.classList.remove('hidden');
        if (pct >= 2) { 
            warn.className = 'warning w-green'; 
            warn.textContent = `Safe: Spend ₹${safe.toFixed(0)}/day for ${rem} days.`; 
        } else if (pct >= 1.75) { 
            warn.className = 'warning w-yellow'; 
            warn.textContent = `Caution: Limit to ₹${safe.toFixed(0)}/day.`; 
        } else if (pct >= 1.5) { 
            warn.className = 'warning w-orange'; 
            warn.textContent = `Warning: Only ₹${safe.toFixed(0)}/day left.`; 
        } else if (pct >= 1.25) { 
            warn.className = 'warning w-red'; 
            warn.textContent = `Danger: ₹${safe.toFixed(0)}/day remaining!`; 
        } else { 
            warn.className = 'warning w-skull'; 
            warn.textContent = `💀 CRITICAL: Budget depleted.`; 
        }
    }

    document.getElementById('budget-input').value = budget > 0 ? budget : '';
    document.getElementById('save-budget-btn').onclick = () => {
        localStorage.setItem('traceBudget', parseFloat(document.getElementById('budget-input').value) || 0);
        location.reload();
    };

    const risk = document.getElementById('risk-container');
    if (monthly.length === 0) {
        document.getElementById('risk-empty').style.display = 'block';
    } else {
        document.getElementById('risk-empty').style.display = 'none';
        risk.innerHTML = '';
        const steps = { Transport: 2, Food: 5, Clothing: 5, Entertainment: 10, Other: 8, Essentials: 15 };
        
        for (let c in cats) {
            const p = budget > 0 ? (cats[c] / budget) * 100 : 0;
            const w = Math.min(p, 100);
            const s = steps[c] || 10;
            let cl = 'bg-green';
            let ic = '';

            if (p > s * 4) { 
                cl = 'bg-skull'; 
                ic = ' 💀'; 
            } else if (p > s * 3) {
                cl = 'bg-red';
            } else if (p > s * 2) {
                cl = 'bg-orange';
            } else if (p > s) {
                cl = 'bg-yellow';
            }

            risk.innerHTML += `<div class="risk-item"><div class="risk-header"><span>${c}${ic}</span><span>₹${cats[c].toFixed(2)} (${p.toFixed(0)}%)</span></div><div class="bar-bg"><div class="bar-fill ${cl}" style="width:${w}%"></div></div></div>`;
        }
    }
}