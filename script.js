const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const fileList = document.getElementById("fileList");
const mergeButton = document.getElementById("mergeButton");
const clearButton = document.getElementById("clearButton");

let files = [];

// Selecionar arquivos
fileInput.addEventListener("change", (event) => {
    const selectedFiles = Array.from(event.target.files);

    addFiles(selectedFiles);

    // Permite selecionar os mesmos arquivos novamente
    fileInput.value = "";
});

// Adicionar PDFs
function addFiles(newFiles) {

    const pdfFiles = newFiles.filter(file =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    files = [...files, ...pdfFiles];

    renderFiles();
}

// Mostrar arquivos na tela
function renderFiles() {

    fileList.innerHTML = "";

    if (files.length === 0) {

        fileList.innerHTML = `
            <p class="empty">
                Nenhum PDF selecionado.
            </p>
        `;

        mergeButton.disabled = true;

        return;
    }

    files.forEach((file, index) => {

        const fileElement = document.createElement("div");

        fileElement.classList.add("file");

        fileElement.innerHTML = `
            <div class="file-icon">
                📄
            </div>

            <div class="file-info">

                <div class="file-name">
                    ${escapeHTML(file.name)}
                </div>

                <div class="file-size">
                    ${formatFileSize(file.size)}
                </div>

            </div>

            <button
                class="remove-button"
                data-index="${index}"
                title="Remover PDF"
            >
                ✕
            </button>
        `;

        fileList.appendChild(fileElement);
    });

    mergeButton.disabled = false;
}

// Remover arquivo
fileList.addEventListener("click", (event) => {

    const button = event.target.closest(".remove-button");

    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);

    files.splice(index, 1);

    renderFiles();
});

// Limpar todos
clearButton.addEventListener("click", () => {

    files = [];

    fileInput.value = "";

    renderFiles();
});

// Drag and Drop
uploadArea.addEventListener("dragover", (event) => {

    event.preventDefault();

    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {

    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (event) => {

    event.preventDefault();

    uploadArea.classList.remove("dragover");

    const droppedFiles = Array.from(event.dataTransfer.files);

    addFiles(droppedFiles);
});

// MESCLAR PDFs
mergeButton.addEventListener("click", mergePDFs);

async function mergePDFs() {

    if (files.length === 0) {
        return;
    }

    // Desabilita o botão durante o processamento
    mergeButton.disabled = true;

    const originalText = mergeButton.textContent;

    mergeButton.textContent = "Mesclando...";

    try {

        // Cria um novo PDF vazio
        const mergedPdf = await PDFLib.PDFDocument.create();

        // Percorre todos os PDFs selecionados
        for (const file of files) {

            // Lê o arquivo
            const arrayBuffer = await file.arrayBuffer();

            // Carrega o PDF
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);

            // Pega todas as páginas
            const pages = await mergedPdf.copyPages(
                pdf,
                pdf.getPageIndices()
            );

            // Adiciona cada página ao novo PDF
            pages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        // Gera o PDF final
        const mergedPdfBytes = await mergedPdf.save();

        // Cria um arquivo temporário no navegador
        const blob = new Blob(
            [mergedPdfBytes],
            { type: "application/pdf" }
        );

        const url = URL.createObjectURL(blob);

        // Cria link de download
        const downloadLink = document.createElement("a");

        downloadLink.href = url;
        downloadLink.download = "PDF_Mesclado.pdf";

        document.body.appendChild(downloadLink);

        downloadLink.click();

        document.body.removeChild(downloadLink);

        // Libera memória
        URL.revokeObjectURL(url);

        mergeButton.textContent = "PDF criado com sucesso!";

        setTimeout(() => {

            mergeButton.textContent = originalText;

        }, 2500);

    } catch (error) {

        console.error(error);

        alert(
            "Não foi possível mesclar os PDFs. " +
            "Verifique se os arquivos não estão protegidos por senha ou corrompidos."
        );

        mergeButton.textContent = originalText;

    } finally {

        mergeButton.disabled = false;

    }
}

// Formatar tamanho do arquivo
function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Evitar inserir HTML através do nome do arquivo
function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}