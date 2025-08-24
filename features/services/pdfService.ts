// features/services/pdfService.ts
import html2pdf from 'html2pdf.js'
import { getCurrentUserData } from './userService'

export async function generateHealthPlanPDF(plan: any, elementId = 'pdf-content') {
  const user = await getCurrentUserData()
  const date = new Date().toLocaleDateString()

  const element = document.getElementById(elementId) || document.createElement('div')
  element.innerHTML = `
    <h1>GloWell Plan</h1>
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Dosha:</strong> ${user.dosha}</p>
    <h2>Summary</h2>
    <p>${plan.summary}</p>
    <h2>Routine</h2>
    ${['morning', 'afternoon', 'evening'].map((t) => `
      <h3>${t}</h3><ul>${plan.dailyRoutine[t].map((i: string) => `<li>${i}</li>`).join('')}</ul>
    `).join('')}
    <h2>Diet</h2>
    ${['breakfast', 'lunch', 'dinner'].map((m) => `
      <h3>${m}</h3><ul>${plan.diet[m].map((i: string) => `<li>${i}</li>`).join('')}</ul>
    `).join('')}
    <h2>Exercise</h2>
    <ul>${plan.exercise.map((i: string) => `<li>${i}</li>`).join('')}</ul>
  `
  const opt = {
    margin: 10,
    filename: `mishby-health-plan-${date}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  await html2pdf().set(opt).from(element).save()
}
