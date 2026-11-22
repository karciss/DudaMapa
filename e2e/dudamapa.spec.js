import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('topic-grid')).toBeVisible()
})

test('muestra el mapa, su jerarquía visual y las materias iniciales', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /una duda compartida/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /qué estamos aprendiendo/i })).toBeVisible()
  await expect(page.getByTestId('topic-card-1')).toContainText('Software Quality Assurance · SQA1T6')
  await expect(page.getByTestId('topic-card-1')).toContainText('Punto crítico')
})

test('filtra dudas por materia y permite regresar a todas', async ({ page }) => {
  const course = page.getByTestId('course-filter')
  await course.selectOption({ label: 'Software Quality Assurance · SQA1T6' })
  await expect(page.getByTestId('topic-grid').locator('article')).toHaveCount(1)
  await expect(page.getByTestId('topic-grid')).toContainText('pruebas de integración')
  await course.selectOption({ label: 'Todas las materias' })
  await expect(page.getByTestId('topic-grid').locator('article')).toHaveCount(8)
})

test('busca dudas por palabras presentes en el título o la descripción', async ({ page }) => {
  await page.getByTestId('search-input').fill('E2E')
  await expect(page.getByTestId('topic-grid').locator('article')).toHaveCount(1)
  await expect(page.getByTestId('topic-grid')).toContainText('Software Quality Assurance · SQA1T6')
})

test('registra el apoyo de otra persona y actualiza el contador', async ({ page }) => {
  const count = page.locator('[data-testid="topic-card-1"] .support-info strong')
  await expect(count).toHaveText('26')
  await page.getByTestId('support-1').click()
  await expect(count).toHaveText('27')
  await expect(page.getByRole('status')).toContainText('Sumamos tu voz')
})

test('publica una pregunta anónima y la abre en el panel de detalle', async ({ page }) => {
  await page.getByTestId('open-question-form').click()
  await page.getByTestId('question-title').fill('¿Cómo se diseña un índice compuesto?')
  await page.getByTestId('question-subject').selectOption({ label: 'Proyecto de Sistemas III · PRS3T6' })
  await page.getByTestId('question-details').fill('Me cuesta elegir el orden de las columnas del índice para filtrar resultados.')
  await page.getByTestId('submit-question').click()
  await expect(page.getByTestId('topic-overlay')).toBeVisible()
  await expect(page.getByTestId('topic-overlay')).toContainText('¿Cómo se diseña un índice compuesto?')
  await expect(page.getByTestId('topic-overlay')).toContainText('Estudiante anónimo')
})

test('permite publicar una explicación y marcar el tema como resuelto', async ({ page }) => {
  await page.getByTestId('topic-card-1').click()
  await page.getByTestId('explanation-input').fill('Primero identifica el patrón de acceso. Coloca al inicio la columna que más reduce los resultados y verifica el plan de ejecución con un conjunto de datos realista.')
  await page.getByTestId('resolve-topic').click()
  await expect(page.getByTestId('topic-overlay')).toContainText('Una explicación para llevarse')
  await expect(page.getByTestId('topic-overlay').getByText('Resuelto')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Tema resuelto')
})

test('muestra un estado vacío y permite abrir el formulario desde la búsqueda', async ({ page }) => {
  await page.getByTestId('search-input').fill('tema que no existe 91827')
  await expect(page.getByTestId('empty-state')).toBeVisible()
  await page.getByTestId('empty-state').getByRole('button', { name: /compartir una duda/i }).click()
  await expect(page.getByTestId('question-overlay')).toBeVisible()
})
