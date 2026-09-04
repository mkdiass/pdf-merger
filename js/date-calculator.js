const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const includeEndDate = document.getElementById("includeEndDate");
const calculateButton = document.getElementById("calculateButton");
const clearButton = document.getElementById("clearButton");
const resultArea = document.getElementById("resultArea");

const mainDays = document.getElementById("mainDays");
const dateDirection = document.getElementById("dateDirection");
const calendarDifference = document.getElementById("calendarDifference");
const weeksDifference = document.getElementById("weeksDifference");
const hoursDifference = document.getElementById("hoursDifference");
const minutesDifference = document.getElementById("minutesDifference");
const secondsDifference = document.getElementById("secondsDifference");
const businessDaysDifference = document.getElementById("businessDaysDifference");
const startWeekday = document.getElementById("startWeekday");
const endWeekday = document.getElementById("endWeekday");

const baseDateInput = document.getElementById("baseDate");
const daysToAddInput = document.getElementById("daysToAdd");
const addDaysButton = document.getElementById("addDaysButton");
const addDaysResult = document.getElementById("addDaysResult");
const addDaysDescription = document.getElementById("addDaysDescription");
const newDateResult = document.getElementById("newDateResult");

const weekdays = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
];

const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro"
];

calculateButton.addEventListener("click", calculateDateDifference);
clearButton.addEventListener("click", clearCalculator);
addDaysButton.addEventListener("click", calculateNewDate);

[startDateInput, endDateInput, includeEndDate].forEach(element => {
    element.addEventListener("change", () => {
        if (startDateInput.value && endDateInput.value) {
            calculateDateDifference();
        }
    });
});

function parseDateInput(value) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function formatInputDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);
}

function formatNumber(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
}

function calculateDateDifference() {
    const start = parseDateInput(startDateInput.value);
    const end = parseDateInput(endDateInput.value);

    if (!start || !end) {
        alert("Selecione a data inicial e a data final.");
        return;
    }

    const difference = end.getTime() - start.getTime();
    const direction = difference >= 0 ? 1 : -1;
    const absoluteDays = Math.abs(Math.round(difference / 86400000));
    const totalDays = absoluteDays + (includeEndDate.checked ? 1 : 0);

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    mainDays.textContent = `${formatNumber(totalDays)} ${totalDays === 1 ? "dia" : "dias"}`;

    if (difference === 0) {
        dateDirection.textContent = includeEndDate.checked
            ? "As duas datas são iguais e o dia foi contado."
            : "As duas datas são iguais.";
    } else {
        dateDirection.textContent = direction > 0
            ? `De ${formatDate(start)} até ${formatDate(end)}`
            : `De ${formatDate(end)} até ${formatDate(start)}`;
    }

    calendarDifference.textContent = getCalendarDifference(start, end);

    weeksDifference.textContent = remainingDays === 0
        ? `${formatNumber(weeks)} ${weeks === 1 ? "semana" : "semanas"}`
        : `${formatNumber(weeks)} ${weeks === 1 ? "semana" : "semanas"} e ${remainingDays} ${remainingDays === 1 ? "dia" : "dias"}`;

    hoursDifference.textContent = `${formatNumber(totalDays * 24)} h`;
    minutesDifference.textContent = `${formatNumber(totalDays * 1440)} min`;
    secondsDifference.textContent = `${formatNumber(totalDays * 86400)} s`;

    const businessDays = countBusinessDays(start, end, includeEndDate.checked);
    businessDaysDifference.textContent = `${formatNumber(businessDays)} ${businessDays === 1 ? "dia" : "dias"}`;

    startWeekday.textContent = weekdays[start.getUTCDay()];
    endWeekday.textContent = weekdays[end.getUTCDay()];

    resultArea.classList.remove("hidden");
}

function getCalendarDifference(start, end) {
    let first = start;
    let second = end;
    let sign = 1;

    if (first.getTime() > second.getTime()) {
        first = end;
        second = start;
        sign = -1;
    }

    let years = second.getUTCFullYear() - first.getUTCFullYear();
    let months = second.getUTCMonth() - first.getUTCMonth();
    let days = second.getUTCDate() - first.getUTCDate();

    if (days < 0) {
        months--;
        const daysInPreviousMonth = new Date(
            Date.UTC(second.getUTCFullYear(), second.getUTCMonth(), 0)
        ).getUTCDate();
        days += daysInPreviousMonth;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];

    if (years > 0) {
        parts.push(`${years} ${years === 1 ? "ano" : "anos"}`);
    }

    if (months > 0) {
        parts.push(`${months} ${months === 1 ? "mês" : "meses"}`);
    }

    if (days > 0 || parts.length === 0) {
        parts.push(`${days} ${days === 1 ? "dia" : "dias"}`);
    }

    return sign < 0 ? `-${parts.join(", ")}` : parts.join(", ");
}

function countBusinessDays(start, end, inclusiveEnd) {
    let first = start;
    let last = end;

    if (first.getTime() > last.getTime()) {
        first = end;
        last = start;
    }

    const lastDay = new Date(last.getTime());
    if (!inclusiveEnd) {
        lastDay.setUTCDate(lastDay.getUTCDate() - 1);
    }

    if (lastDay.getTime() < first.getTime()) {
        return 0;
    }

    let count = 0;
    const cursor = new Date(first.getTime());

    while (cursor.getTime() <= lastDay.getTime()) {
        const day = cursor.getUTCDay();

        if (day !== 0 && day !== 6) {
            count++;
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return count;
}

function calculateNewDate() {
    const baseDate = parseDateInput(baseDateInput.value);
    const days = Number(daysToAddInput.value);

    if (!baseDate || !Number.isInteger(days)) {
        alert("Informe uma data e uma quantidade inteira de dias.");
        return;
    }

    const result = new Date(baseDate.getTime());
    result.setUTCDate(result.getUTCDate() + days);

    const action = days >= 0 ? "adicionando" : "subtraindo";
    const absoluteDays = Math.abs(days);

    addDaysDescription.textContent =
        `${formatDate(baseDate)} ${action} ${formatNumber(absoluteDays)} ${absoluteDays === 1 ? "dia" : "dias"} resulta em:`;

    newDateResult.textContent = formatDate(result);
    addDaysResult.classList.remove("hidden");
}

function clearCalculator() {
    startDateInput.value = "";
    endDateInput.value = "";
    includeEndDate.checked = false;

    resultArea.classList.add("hidden");

    baseDateInput.value = "";
    daysToAddInput.value = "";
    addDaysResult.classList.add("hidden");
}

// Atalho útil: Enter calcula a diferença quando o usuário está nos campos de data.
[startDateInput, endDateInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            calculateDateDifference();
        }
    });
});

// Preenche a ferramenta de adicionar dias com a data de hoje.
const today = new Date();
baseDateInput.value = formatInputDate(new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
)));
