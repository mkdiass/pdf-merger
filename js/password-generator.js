const password = document.getElementById('password');
const length = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const uppercase = document.getElementById('uppercase');
const lowercase = document.getElementById('lowercase');
const numbers = document.getElementById('numbers');
const symbols = document.getElementById('symbols');
const reference = document.getElementById('reference');
const referenceExtra = document.getElementById('referenceExtra');
const strength = document.getElementById('strength');
const strengthBar = document.getElementById('strengthBar');
const lengthMeta = document.getElementById('lengthMeta');
const referenceMeta = document.getElementById('referenceMeta');
const randomnessMeta = document.getElementById('randomnessMeta');
const message = document.getElementById('message');
const generateButton = document.getElementById('generateButton');
const copyButton = document.getElementById('copyButton');

const sets = {
    uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lowercase: 'abcdefghijkmnopqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%&*+-_=?.'
};

function secureRandom(max) {
    if (max <= 0) throw new Error('Limite aleatório inválido.');
    const maxUint = 0x100000000;
    const limit = maxUint - (maxUint % max);
    const array = new Uint32Array(1);
    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);
    return array[0] % max;
}

function cleanReference(value) {
    return value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
}

function shuffled(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getMode() {
    return document.querySelector('input[name="mode"]:checked')?.value || 'personalized';
}

function getReferences() {
    return [cleanReference(reference.value), cleanReference(referenceExtra.value)].filter(Boolean);
}

function transformReference(source) {
    return source.split('').map((char, index) => {
        if (/[a-z]/.test(char)) return index % 2 === 0 ? char.toUpperCase() : char;
        return char;
    }).join('');
}

function buildReferencePart(refs, targetLength, mode) {
    if (!refs.length || mode === 'random' || mode === 'maximum') return '';

    const source = transformReference(refs.join(''));

    if (mode === 'memorable') {
        return source.slice(0, Math.min(source.length, Math.max(5, Math.floor(targetLength * 0.45))));
    }

    // No modo personalizado, mantemos um pequeno trecho contínuo da referência.
    // Isso deixa a personalização perceptível sem transformar a referência inteira em senha.
    const maxReferenceLength = Math.min(source.length, Math.max(3, Math.floor(targetLength * 0.30)));
    if (maxReferenceLength <= 0) return '';

    const start = source.length > maxReferenceLength
        ? secureRandom(source.length - maxReferenceLength + 1)
        : 0;

    return source.slice(start, start + maxReferenceLength);
}

function getActiveSets() {
    const active = [];
    if (uppercase.checked) active.push(sets.uppercase);
    if (lowercase.checked) active.push(sets.lowercase);
    if (numbers.checked) active.push(sets.numbers);
    if (symbols.checked) active.push(sets.symbols);
    return active;
}

function generate() {
    const active = getActiveSets();
    if (!active.length) {
        message.textContent = 'Selecione pelo menos um tipo de caractere.';
        return;
    }

    const mode = getMode();
    const refs = getReferences();
    const targetLength = mode === 'maximum' ? Math.max(24, Number(length.value)) : Number(length.value);
    const all = active.join('');
    const chars = [];

    // Garante pelo menos um caractere de cada categoria selecionada.
    active.forEach(set => chars.push(set[secureRandom(set.length)]));

    const referencePart = buildReferencePart(refs, targetLength, mode);

    // A referência fica visivelmente presente nos modos personalizados.
    for (const char of referencePart) {
        if (chars.length < targetLength) chars.push(char);
    }

    while (chars.length < targetLength) {
        chars.push(all[secureRandom(all.length)]);
    }

    shuffled(chars);
    password.value = chars.join('');
    message.textContent = '';
    updateMeta(mode, refs, Boolean(referencePart));
    updateStrength(active.length, mode, targetLength, Boolean(refs.length));
}

function updateMeta(mode, refs, referenceUsed) {
    lengthMeta.textContent = `${password.value.length} caracteres`;
    referenceMeta.textContent = referenceUsed
        ? 'Referência incorporada'
        : refs.length && (mode === 'random' || mode === 'maximum')
            ? 'Referência ignorada neste modo'
            : 'Sem referência';
    randomnessMeta.textContent = mode === 'maximum' ? 'Máxima aleatoriedade' : 'Aleatoriedade criptográfica';
}

function updateStrength(types, mode, size, hasReference) {
    let score = size + types * 8;
    if (mode === 'maximum') score += 16;
    if (mode === 'random') score += 6;
    if (hasReference && mode === 'personalized') score -= 4;

    const label = score >= 92 ? 'Muito forte' : score >= 68 ? 'Forte' : score >= 46 ? 'Média' : 'Fraca';
    strength.textContent = label;
    strengthBar.style.width = `${Math.min(100, (score / 108) * 100)}%`;
}

function updateModeUI() {
    document.querySelectorAll('.mode-option').forEach(option => {
        const input = option.querySelector('input');
        option.classList.toggle('selected', input.checked);
    });

    if (getMode() === 'maximum') length.value = Math.max(24, Number(length.value));
    lengthValue.textContent = length.value;
    generate();
}

length.addEventListener('input', () => {
    if (getMode() === 'maximum' && Number(length.value) < 24) length.value = 24;
    lengthValue.textContent = length.value;
    generate();
});

[uppercase, lowercase, numbers, symbols].forEach(el => el.addEventListener('change', generate));
[reference, referenceExtra].forEach(el => el.addEventListener('input', generate));
document.querySelectorAll('input[name="mode"]').forEach(el => el.addEventListener('change', updateModeUI));

generateButton.addEventListener('click', generate);

copyButton.addEventListener('click', async () => {
    try {
        if (!password.value) generate();
        await navigator.clipboard.writeText(password.value);
        message.textContent = 'Senha copiada para a área de transferência.';
    } catch {
        message.textContent = 'Não foi possível copiar automaticamente. Selecione e copie a senha manualmente.';
    }
});

generate();
