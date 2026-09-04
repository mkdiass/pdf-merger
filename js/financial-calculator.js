const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const initialInput = document.getElementById('initial');
const monthlyInput = document.getElementById('monthly');
const rateInput = document.getElementById('rate');
const monthsInput = document.getElementById('months');
const rateType = document.getElementById('rateType');
const result = document.getElementById('result');
let chart;

document.getElementById('calculateButton').addEventListener('click', () => {
    const initial = Math.max(0, Number(initialInput.value) || 0);
    const monthly = Math.max(0, Number(monthlyInput.value) || 0);
    const rate = Number(rateInput.value) || 0;
    const months = Math.max(1, Math.floor(Number(monthsInput.value) || 1));

    const monthlyRate = rateType.value === 'annual'
        ? Math.pow(1 + rate / 100, 1 / 12) - 1
        : rate / 100;

    let balance = initial;
    const labels = ['Inicial'];
    const values = [balance];
    let totalInvested = initial;

    for (let month = 1; month <= months; month++) {
        balance = balance * (1 + monthlyRate) + monthly;
        totalInvested += monthly;
        labels.push(`Mês ${month}`);
        values.push(balance);
    }

    const interest = balance - totalInvested;
    document.getElementById('finalValue').textContent = money(balance);
    document.getElementById('invested').textContent = money(totalInvested);
    document.getElementById('interest').textContent = money(interest);
    document.getElementById('returnRate').textContent = `${totalInvested ? ((interest / totalInvested) * 100).toFixed(2) : '0.00'}%`;
    result.classList.remove('hidden');

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('growthChart'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Patrimônio', data: values, tension: .25, fill: true }] },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: value => money(value) } } }
        }
    });
});
