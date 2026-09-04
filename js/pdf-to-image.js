import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const options = document.getElementById('options');
const scaleInput = document.getElementById('scale');
const convertButton = document.getElementById('convertButton');
const resultArea = document.getElementById('resultArea');
const resultInfo = document.getElementById('resultInfo');
const imageResults = document.getElementById('imageResults');
const clearButton = document.getElementById('clearButton');

let selectedFile = null;

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const safeName = (name) => name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9À-ÿ_-]+/g, '_').slice(0, 80) || 'pagina';

function setFile(file) {
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    fileInfo.textContent = 'Selecione um arquivo PDF válido.';
    fileInfo.classList.remove('success');
    return;
  }
  selectedFile = file;
  fileInfo.textContent = `${file.name} • ${formatSize(file.size)}`;
  fileInfo.classList.add('success');
  fileInfo.classList.remove('hidden');
  options.classList.remove('hidden');
  convertButton.disabled = false;
}

fileInput.addEventListener('change', (event) => setFile(event.target.files[0]));

['dragenter', 'dragover'].forEach((eventName) => {
  uploadArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadArea.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  uploadArea.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
  });
});

uploadArea.addEventListener('drop', (event) => setFile(event.dataTransfer.files[0]));

convertButton.addEventListener('click', async () => {
  if (!selectedFile) return;

  convertButton.disabled = true;
  convertButton.textContent = 'Convertendo...';
  imageResults.innerHTML = '';

  try {
    const data = await selectedFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const scale = Number(scaleInput.value);
    const baseName = safeName(selectedFile.name);

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);

      const card = document.createElement('article');
      card.className = 'image-card';
      card.innerHTML = `<img src="${url}" alt="Página ${pageNumber}"><div class="image-card-footer"><span>Página ${pageNumber}</span><a class="button" href="${url}" download="${baseName}_pagina_${pageNumber}.png">Baixar PNG</a></div>`;
      imageResults.appendChild(card);
    }

    resultInfo.textContent = `${pdf.numPages} ${pdf.numPages === 1 ? 'página convertida' : 'páginas convertidas'} com sucesso.`;
    resultArea.classList.remove('hidden');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    resultInfo.textContent = 'Não foi possível converter este PDF. Tente outro arquivo.';
    resultArea.classList.remove('hidden');
  } finally {
    convertButton.disabled = false;
    convertButton.textContent = 'Converter PDF';
  }
});

clearButton.addEventListener('click', () => {
  imageResults.querySelectorAll('img').forEach((img) => URL.revokeObjectURL(img.src));
  selectedFile = null;
  fileInput.value = '';
  fileInfo.textContent = '';
  fileInfo.classList.add('hidden');
  options.classList.add('hidden');
  resultArea.classList.add('hidden');
  imageResults.innerHTML = '';
  convertButton.disabled = true;
});