const STORAGE_KEY = "NLWSetup@habits"
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]

const form = document.querySelector("form")
const daysContainer = form.querySelector(".days")
const monthSelect = document.querySelector("#month-select")
const yearSelect = document.querySelector("#year-select")
const habits = [...form.querySelectorAll(".habit")].map((el) => el.dataset.name)

const today = new Date()
let current = { year: today.getFullYear(), month: today.getMonth() } // month: 0-11

// Dados: { habito: ["AAAA-MM-DD", ...] }
const data = loadData()

function pad(n) {
  return String(n).padStart(2, "0")
}

function toKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function loadData() {
  let raw = {}
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {}

  // Migra o formato antigo "MM-DD" (sem ano) para "AAAA-MM-DD", assumindo o ano atual
  const year = new Date().getFullYear()
  const result = {}
  for (const [habit, dates] of Object.entries(raw)) {
    result[habit] = [...new Set(dates.map((d) => (d.length === 5 ? `${year}-${d}` : d)))]
  }
  return result
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function isChecked(habit, key) {
  return data[habit]?.includes(key)
}

function setupFilter() {
  monthSelect.innerHTML = MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join("")

  const years = new Set([today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1])
  Object.values(data).flat().forEach((d) => years.add(Number(d.slice(0, 4))))
  yearSelect.innerHTML = [...years]
    .sort()
    .map((y) => `<option value="${y}">${y}</option>`)
    .join("")

  monthSelect.addEventListener("change", () => goTo(current.year, Number(monthSelect.value)))
  yearSelect.addEventListener("change", () => goTo(Number(yearSelect.value), current.month))
  document.querySelector("#prev-month").addEventListener("click", () => goTo(current.year, current.month - 1))
  document.querySelector("#next-month").addEventListener("click", () => goTo(current.year, current.month + 1))
}

function goTo(year, month) {
  const date = new Date(year, month, 1)
  current = { year: date.getFullYear(), month: date.getMonth() }

  // Garante que o ano exista no seletor ao navegar pelas setas
  if (![...yearSelect.options].some((o) => Number(o.value) === current.year)) {
    yearSelect.add(new Option(current.year, current.year))
    const sorted = [...yearSelect.options].sort((a, b) => a.value - b.value)
    yearSelect.replaceChildren(...sorted)
  }

  render()
}

function render() {
  const { year, month } = current
  monthSelect.value = month
  yearSelect.value = year

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())

  let html = ""
  for (let day = 1; day <= daysInMonth; day++) {
    const key = toKey(year, month, day)
    const weekday = WEEKDAYS[new Date(year, month, day).getDay()]
    const classes = ["day"]
    if (key === todayKey) classes.push("today")
    if (key > todayKey) classes.push("future")

    html += `<div class="${classes.join(" ")}" data-date="${key}">
      <div class="date"><span>${weekday}</span>${pad(day)}</div>
      ${habits
        .map(
          (habit) =>
            `<input type="checkbox" name="${habit}" value="${key}" ${isChecked(habit, key) ? "checked" : ""} />`
        )
        .join("")}
    </div>`
  }
  daysContainer.innerHTML = html

  // Rola até o dia de hoje quando estiver no mês atual
  const todayEl = daysContainer.querySelector(".today")
  const left = todayEl
    ? todayEl.offsetLeft - daysContainer.offsetLeft - daysContainer.clientWidth / 2 + todayEl.offsetWidth / 2
    : 0
  daysContainer.scrollTo({ left, behavior: "instant" })
}

form.addEventListener("change", (event) => {
  const input = event.target
  if (input.type !== "checkbox") return

  const list = new Set(data[input.name] || [])
  input.checked ? list.add(input.value) : list.delete(input.value)
  data[input.name] = [...list].sort()
  saveData()
})

setupFilter()
saveData() // persiste a migração do formato antigo
render()
