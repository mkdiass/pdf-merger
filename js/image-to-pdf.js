const { PDFDocument } = PDFLib;
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileSection = document.getElementById('fileSection');
const imageList = document.getElementById('imageList');
const fileSummary = document.getElementById('fileSummary');
const createButton = document.getElementById('createButton');
const clearButton = document.getElementById('clearButton');
const resultArea = document.getElementById('resultArea');
const resultInfo = document.getElementById('resultInfo');
const downloadButton = document.getElementById('downloadButton');
const newButton = document.getElementById('newButton');

let images = [];
let outputBlob = null;
let draggedIndex = null;

function setImages(files) {
    const valid = [...files].filter(file => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type));
    images = valid.map(file => ({ file, url: URL.createObjectURL(file) }));
    renderImages();
}

function renderImages() {
    fileSection.classList.toggle('hidden', images.length === 0);
    createButton.disabled = images.length === 0;
    fileSummary.textContent = `${images.length} ${images.length === 1 ? 'imagem' : 'imagens'}`;
    imageList.innerHTML = '';

    images.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'image-list-card';
        card.draggable = true;
        card.innerHTML = `
            <span class="drag-handle" title="Arraste para reordenar">⋮⋮</span>
            <img src="${item.url}" alt="Pré-visualização de ${item.file.name}">
            <div class="image-list-info"><strong>${index + 1}. ${item.file.name}</strong><span>${Math.round(item.file.size / 1024)} KB</span></div>
            <button class="remove-button" type="button" aria-label="Remover imagem">×</button>`;
        card.querySelector('.remove-button').addEventListener('click', () => removeImage(index));
        card.addEventListener('dragstart', () => { draggedIndex = index; card.classList.add('dragging'); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', event => event.preventDefault());
        card.addEventListener('drop', event => {
            event.preventDefault();
            if (draggedIndex === null || draggedIndex === index) return;
            const [moved] = images.splice(draggedIndex, 1);
            images.splice(index, 0, moved);
            draggedIndex = null;
            renderImages();
        });
        imageList.appendChild(card);
    });
}

function removeImage(index) {
    URL.revokeObjectURL(images[index].url);
    images.splice(index, 1);
    renderImages();
}

async function imageBytes(file) { return new Uint8Array(await file.arrayBuffer()); }

createButton.addEventListener('click', async () => {
    createButton.disabled = true;
    createButton.textContent = 'Criando PDF...';
    try {
        const pdf = await PDFDocument.create();
        for (const item of images) {
            const bytes = await imageBytes(item.file);
            let image;
            if (item.file.type === 'image/jpeg') image = await pdf.embedJpg(bytes);
            else if (item.file.type === 'image/png') image = await pdf.embedPng(bytes);
            else {
                const bitmap = await createImageBitmap(item.file);
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width; canvas.height = bitmap.height;
                canvas.getContext('2d').drawImage(bitmap, 0, 0);
                const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                image = await pdf.embedPng(await png.arrayBuffer());
            }
            const page = pdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        const bytes = await pdf.save();
        outputBlob = new Blob([bytes], { type: 'application/pdf' });
        resultInfo.textContent = `${images.length} ${images.length === 1 ? 'imagem convertida' : 'imagens convertidas'} em um único PDF.`;
        resultArea.classList.remove('hidden');
        resultArea.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(error);
        resultInfo.textContent = 'Não foi possível criar o PDF. Verifique as imagens selecionadas.';
        resultArea.classList.remove('hidden');
    } finally {
        createButton.disabled = images.length === 0;
        createButton.textContent = 'Criar PDF';
    }
});

downloadButton.addEventListener('click', () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const link = document.createElement('a');
    link.href = url; link.download = 'imagens_convertidas.pdf'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function reset() {
    images.forEach(item => URL.revokeObjectURL(item.url));
    images = []; outputBlob = null; fileInput.value = '';
    resultArea.classList.add('hidden');
    renderImages();
}

clearButton.addEventListener('click', reset);
newButton.addEventListener('click', reset);
fileInput.addEventListener('change', e => setImages(e.target.files));
['dragenter', 'dragover'].forEach(name => uploadArea.addEventListener(name, e => { e.preventDefault(); uploadArea.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(name => uploadArea.addEventListener(name, e => { e.preventDefault(); uploadArea.classList.remove('dragover'); }));
uploadArea.addEventListener('drop', e => setImages(e.dataTransfer.files));
