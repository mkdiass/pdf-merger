const password = document.getElementById('password');
const length = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const uppercase = document.getElementById('uppercase');
const lowercase = document.getElementById('lowercase');
const numbers = document.getElementById('numbers');
const symbols = document.getElementById('symbols');
const strength = document.getElementById('strength');
const strengthBar = document.getElementById('strengthBar');
const message = document.getElementById('message');

const sets = {
    uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lowercase: 'abcdefghijkmnopqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%&*+-_=?.'
};

function secureRandom(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
}

function generate() {
    const active = [];
    if (uppercase.checked) active.push(sets.uppercase);
    if (lowercase.checked) active.push(sets.lowercase);
    if (numbers.checked) active.push(sets.numbers);
    if (symbols.checked) active.push(sets.symbols);
    if (!active.length) { message.textContent = 'Selecione pelo menos um tipo de caractere.'; return; }

    const all = active.join('');
    const chars = active.map(set => set[secureRandom(set.length)]);
    while (chars.length < Number(length.value)) chars.push(all[secureRandom(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    password.value = chars.join('');
    message.textContent = '';
    updateStrength(active.length);
}

function updateStrength(types) {
    const score = Number(length.value) + types * 8;
    const label = score >= 72 ? 'Muito forte' : score >= 52 ? 'Forte' : score >= 34 ? 'Média' : 'Fraca';
    strength.textContent = label;
    strengthBar.style.width = `${Math.min(100, (score / 88) * 100)}%`;
}

length.addEventListener('input', () => { lengthValue.textContent = length.value; generate(); });
[uppercase, lowercase, numbers, symbols].forEach(el => el.addEventListener('change', generate));
document.getElementById('generateButton').addEventListener('click', generate);
document.getElementById('copyButton').addEventListener('click', async () => {
    if (!password.value) generate();
    await navigator.clipboard.writeText(password.value);
    message.textContent = 'Senha copiada para a área de transferência.';
});
generate();
