# DudaMapa

DudaMapa convierte las dudas anónimas de una comunidad en un mapa de temas críticos. El MVP permite explorar materias, apoyar una duda para indicar que otras personas también la tienen, proponer una explicación y marcar el tema como resuelto.

## Tecnologías

- **Frontend:** Vue 3, Vite y JavaScript.
- **Backend:** Node.js y Express.
- **Base de datos:** SQLite mediante `better-sqlite3`.
- **Pruebas:** Vitest (unitarias), Supertest (integración) y Playwright (E2E).
- **Entrega prevista:** GitHub Actions, Docker Hub, Terraform y Ansible.

## Ejecutar localmente

Requiere Node.js 20 o superior y npm.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Vite muestra la dirección del frontend (por defecto `http://localhost:5173`) y la API escucha en `http://localhost:3000`. El frontend reenvía `/api` al backend.

## Pruebas

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test
```

El MVP incluye pruebas unitarias, de integración y E2E. Los flujos E2E levantan automáticamente frontend y API con Playwright.

## Documentación de la API

El contrato de la API está documentado en [docs/CONTRATO_API.md](docs/CONTRATO_API.md).

## Docker

```bash
docker compose up --build
```

La aplicación queda en `http://localhost`. Para probar la URL temporal de Cloudflare localmente:

```bash
docker compose --profile cloudflare up --build
docker compose logs -f cloudflare
```

## Estructura del proyecto

- `frontend/`: interfaz en Vue y lógica del mapa.
- `backend/`: API REST en Express y persistencia en SQLite.
- `e2e/`: escenarios de extremo a extremo con Playwright.
- `docs/CONTRATO_API.md`: rutas y formatos del backend.
- Terraform, Ansible, Docker Hub, OCI, VNC y Cloudflare: [infra/README.md](infra/README.md).

El catálogo de materias proviene del PDF **Plan de Estudios ISI 2017 actualizado en 2022** proporcionado para esta práctica. Las cinco materias de sexto semestre aparecen primero: Proyecto de Sistemas III (PRS3T6), Realidad Virtual y Aumentada (RVA1T6), Redes y Comunicación de Datos II (RED2T6), Software Quality Assurance (SQA1T6) y Tecnologías Emergentes I (TEM1T6). El mapa inicia con ejemplos de ese semestre, pero permite publicar dudas de cualquier materia del plan. Los apoyos y preguntas de inicio son ilustrativos, no resultados reales de una encuesta.

## Pipeline en GitHub Actions

`.github/workflows/pipeline.yml` prueba `dev` y los Pull Requests; en cada push a `main`, publica la imagen en Docker Hub y después aplica Terraform y configura la VM con Ansible. Para habilitar el despliegue hay que configurar los secretos y variables descritos en [infra/README.md](infra/README.md). No se guardan claves privadas, tokens, contraseñas VNC ni estados de Terraform en Git.
