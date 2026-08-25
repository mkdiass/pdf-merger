const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const fileList = document.getElementById("fileList");
const mergeButton = document.getElementById("mergeButton");
const clearButton = document.getElementById("clearButton");
const fileSummary = document.getElementById("fileSummary");

const fileSettings = document.getElementById("fileSettings");
const fileNameInput = document.getElementById("fileName");

const resultArea = document.getElementById("resultArea");
const resultInfo = document.getElementById("resultInfo");

const downloadButton = document.getElementById("downloadButton");
const newMergeButton = document.getElementById("newMergeButton");


let files = [];

let draggedIndex = null;

let finalPDFBlob = null;

let finalPDFUrl = null;


// ======================================================
// SELECIONAR ARQUIVOS
// ======================================================

fileInput.addEventListener("change", (event) => {

    const selectedFiles =
        Array.from(event.target.files);

    addFiles(selectedFiles);

    fileInput.value = "";
});


// ======================================================
// ADICIONAR ARQUIVOS
// ======================================================

function addFiles(newFiles) {

    const pdfFiles = newFiles.filter(file =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    files = [...files, ...pdfFiles];

    renderFiles();
}


// ======================================================
// RENDERIZAR LISTA
// ======================================================

async function renderFiles() {

    fileList.innerHTML = "";

    if (files.length === 0) {

        fileList.innerHTML = `
            <p class="empty">
                Nenhum PDF selecionado.
            </p>
        `;

        mergeButton.disabled = true;

        fileSettings.classList.add("hidden");

        updateSummary();

        return;
    }


    mergeButton.disabled = false;

    fileSettings.classList.remove("hidden");


    files.forEach((file, index) => {

        const fileElement =
            document.createElement("div");

        fileElement.classList.add("file");

        fileElement.draggable = true;

        fileElement.dataset.index = index;


        fileElement.innerHTML = `

            <div
                class="drag-handle"
                title="Arraste para reorganizar"
            >
                ⋮⋮
            </div>

            <div class="file-icon">
                📄
            </div>

            <div class="file-info">

                <div class="file-name">
                    ${escapeHTML(file.name)}
                </div>

                <div
                    class="file-details"
                    id="details-${index}"
                >
                    Carregando informações...
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

        loadPDFInfo(file, index);
    });


    updateSummary();
}


// ======================================================
// INFORMAÇÕES DO PDF
// ======================================================

async function loadPDFInfo(file, index) {

    try {

        const arrayBuffer =
            await file.arrayBuffer();

        const pdf =
            await PDFLib.PDFDocument.load(
                arrayBuffer
            );

        const pageCount =
            pdf.getPageCount();


        const details =
            document.getElementById(
                `details-${index}`
            );


        if (details) {

            details.textContent =
                `${pageCount} ${
                    pageCount === 1
                        ? "página"
                        : "páginas"
                } • ${formatFileSize(file.size)}`;
        }


        updateSummary();

    } catch (error) {

        const details =
            document.getElementById(
                `details-${index}`
            );


        if (details) {

            details.textContent =
                "Não foi possível ler este PDF";
        }
    }
}


// ======================================================
// RESUMO
// ======================================================

async function updateSummary() {

    if (files.length === 0) {

        fileSummary.textContent =
            "0 arquivos • 0 páginas • 0 MB";

        return;
    }


    let totalPages = 0;


    for (const file of files) {

        try {

            const arrayBuffer =
                await file.arrayBuffer();

            const pdf =
                await PDFLib.PDFDocument.load(
                    arrayBuffer
                );

            totalPages +=
                pdf.getPageCount();

        } catch (error) {

            console.error(
                "Erro ao ler PDF:",
                file.name
            );
        }
    }


    const totalSize =
        files.reduce(
            (total, file) =>
                total + file.size,
            0
        );


    const fileText =
        files.length === 1
            ? "arquivo"
            : "arquivos";


    const pageText =
        totalPages === 1
            ? "página"
            : "páginas";


    fileSummary.textContent =
        `${files.length} ${fileText} • ${totalPages} ${pageText} • ${formatFileSize(totalSize)}`;
}


// ======================================================
// REMOVER ARQUIVO
// ======================================================

fileList.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".remove-button"
            );


        if (!button) {
            return;
        }


        const index =
            Number(button.dataset.index);


        files.splice(index, 1);


        renderFiles();
    }
);


// ======================================================
// LIMPAR TUDO
// ======================================================

clearButton.addEventListener(
    "click",
    () => {

        files = [];

        fileInput.value = "";

        clearResult();

        renderFiles();
    }
);


// ======================================================
// DRAG AND DROP — UPLOAD
// ======================================================

uploadArea.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        uploadArea.classList.add(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "dragleave",
    () => {

        uploadArea.classList.remove(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        uploadArea.classList.remove(
            "dragover"
        );


        const droppedFiles =
            Array.from(
                event.dataTransfer.files
            );


        addFiles(droppedFiles);
    }
);


// ======================================================
// REORDENAR PDFs
// ======================================================

fileList.addEventListener(
    "dragstart",
    (event) => {

        const fileElement =
            event.target.closest(".file");


        if (!fileElement) {
            return;
        }


        draggedIndex =
            Number(
                fileElement.dataset.index
            );


        fileElement.classList.add(
            "dragging"
        );
    }
);


fileList.addEventListener(
    "dragend",
    (event) => {

        const fileElement =
            event.target.closest(".file");


        if (!fileElement) {
            return;
        }


        fileElement.classList.remove(
            "dragging"
        );


        draggedIndex = null;


        document
            .querySelectorAll(".file")
            .forEach(element => {

                element.classList.remove(
                    "drag-over"
                );
            });
    }
);


fileList.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();


        const target =
            event.target.closest(".file");


        if (!target) {
            return;
        }


        const targetIndex =
            Number(
                target.dataset.index
            );


        if (
            targetIndex ===
            draggedIndex
        ) {
            return;
        }


        document
            .querySelectorAll(".file")
            .forEach(element => {

                element.classList.remove(
                    "drag-over"
                );
            });


        target.classList.add(
            "drag-over"
        );
    }
);


fileList.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();


        const target =
            event.target.closest(".file");


        if (!target) {
            return;
        }


        const targetIndex =
            Number(
                target.dataset.index
            );


        if (
            draggedIndex === null ||
            targetIndex === draggedIndex
        ) {
            return;
        }


        const draggedFile =
            files[draggedIndex];


        files.splice(
            draggedIndex,
            1
        );


        files.splice(
            targetIndex,
            0,
            draggedFile
        );


        draggedIndex = null;


        renderFiles();
    }
);


// ======================================================
// MESCLAR PDFs
// ======================================================

mergeButton.addEventListener(
    "click",
    mergePDFs
);


async function mergePDFs() {

    if (files.length === 0) {
        return;
    }


    mergeButton.disabled = true;


    const originalText =
        mergeButton.textContent;


    mergeButton.textContent =
        "Mesclando...";


    clearResult();


    try {

        const mergedPdf =
            await PDFLib.PDFDocument.create();


        let totalPages = 0;


        // ----------------------------------------------
        // COPIAR TODAS AS PÁGINAS
        // ----------------------------------------------

        for (const file of files) {

            const arrayBuffer =
                await file.arrayBuffer();


            const pdf =
                await PDFLib.PDFDocument.load(
                    arrayBuffer
                );


            const pageIndices =
                pdf.getPageIndices();


            const pages =
                await mergedPdf.copyPages(
                    pdf,
                    pageIndices
                );


            pages.forEach(page => {

                mergedPdf.addPage(page);

            });


            totalPages +=
                pageIndices.length;
        }


        // ----------------------------------------------
        // GERAR PDF
        // ----------------------------------------------

        const mergedPdfBytes =
            await mergedPdf.save();


        finalPDFBlob =
            new Blob(
                [mergedPdfBytes],
                {
                    type: "application/pdf"
                }
            );


        // ----------------------------------------------
        // NOME DO ARQUIVO
        // ----------------------------------------------

        let fileName =
            fileNameInput.value.trim();


        if (!fileName) {

            fileName =
                "PDF_Mesclado";
        }


        fileName =
            sanitizeFileName(fileName);


        // Guardamos o nome para o download

        downloadButton.dataset.filename =
            `${fileName}.pdf`;


        // ----------------------------------------------
        // URL TEMPORÁRIA
        // ----------------------------------------------

        if (finalPDFUrl) {

            URL.revokeObjectURL(
                finalPDFUrl
            );
        }


        finalPDFUrl =
            URL.createObjectURL(
                finalPDFBlob
            );


        // ----------------------------------------------
        // RESULTADO
        // ----------------------------------------------

        resultInfo.textContent =
            `${totalPages} ${
                totalPages === 1
                    ? "página"
                    : "páginas"
            } • ${formatFileSize(
                finalPDFBlob.size
            )}`;


        resultArea.classList.remove(
            "hidden"
        );


        resultArea.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        mergeButton.textContent =
            "PDF criado!";


    } catch (error) {

        console.error(error);


        alert(
            "Não foi possível mesclar os PDFs. " +
            "Verifique se os arquivos não estão protegidos por senha ou corrompidos."
        );


        mergeButton.textContent =
            originalText;


    } finally {

        mergeButton.disabled = false;
    }
}


// ======================================================
// BAIXAR PDF
// ======================================================

downloadButton.addEventListener(
    "click",
    () => {

        if (
            !finalPDFBlob ||
            !finalPDFUrl
        ) {
            return;
        }


        const downloadLink =
            document.createElement("a");


        downloadLink.href =
            finalPDFUrl;


        downloadLink.download =
            downloadButton.dataset.filename ||
            "PDF_Mesclado.pdf";


        document.body.appendChild(
            downloadLink
        );


        downloadLink.click();


        document.body.removeChild(
            downloadLink
        );
    }
);


// ======================================================
// NOVA MESCLAGEM
// ======================================================

newMergeButton.addEventListener(
    "click",
    () => {

        files = [];

        fileInput.value = "";

        fileNameInput.value =
            "PDF_Mesclado";


        clearResult();

        renderFiles();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


// ======================================================
// LIMPAR RESULTADO
// ======================================================

function clearResult() {

    resultArea.classList.add(
        "hidden"
    );


    if (finalPDFUrl) {

        URL.revokeObjectURL(
            finalPDFUrl
        );

        finalPDFUrl = null;
    }


    finalPDFBlob = null;


    mergeButton.textContent =
        "Mesclar PDFs";
}


// ======================================================
// LIMPAR NOME DO ARQUIVO
// ======================================================

function sanitizeFileName(name) {

    return name
        .replace(
            /[<>:"/\\|?*\x00-\x1F]/g,
            ""
        )
        .trim()
        .replace(
            /\.pdf$/i,
            ""
        ) || "PDF_Mesclado";
}


// ======================================================
// FORMATAR TAMANHO
// ======================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;
    }


    if (bytes < 1024 * 1024) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }


    return `${(
        bytes / (1024 * 1024)
    ).toFixed(1)} MB`;
}


// ======================================================
// SEGURANÇA
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent = text;


    return div.innerHTML;
}