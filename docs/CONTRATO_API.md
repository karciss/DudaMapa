# Contrato de la API de DudaMapa

Base local: `http://localhost:3000/api`. Todos los cuerpos y respuestas usan JSON y UTF-8.

## Tema

```json
{
  "id": 1,
  "title": "¿Cómo distinguir pruebas de integración y E2E?",
  "subject": "Software Quality Assurance · SQA1T6",
  "summary": "En el proyecto de sistemas me cuesta decidir qué validar entre componentes y qué comprobar desde la experiencia completa.",
  "supporters": 24,
  "resolved": false,
  "explanation": null,
  "tags": ["integrales", "métodos"],
  "questionsCount": 1,
  "updatedAt": "2026-11-22T12:00:00.000Z"
}
```

## Rutas

| Método y ruta | Uso | Respuesta exitosa |
| --- | --- | --- |
| `GET /health` | Estado de servicio para Docker y despliegue. | `200 {"status":"ok","service":"dudamapa-api"}` |
| `GET /courses` | Lista de materias existentes. | `200 ["Proyecto de Sistemas III · PRS3T6", "Software Quality Assurance · SQA1T6"]` |
| `GET /topics` | Mapa completo, ordenado por apoyos. | `200 [tema, ...]` |
| `GET /topics?q=E2E&course=Software%20Quality%20Assurance%20%C2%B7%20SQA1T6&status=open` | Filtrar por texto, materia y estado `open`/`resolved`. | `200 [tema, ...]` |
| `GET /topics/:id` | Detalle del tema y sus preguntas. | `200 {tema, questions: [...]}` |
| `POST /questions` | Publicar una pregunta o agruparla si coincide título y materia. | `201 {topic, question}` |
| `POST /topics/:id/endorse` | Registrar que alguien más tiene esa duda. | `200 tema actualizada` |
| `POST /topics/:id/resolve` | Publicar explicación y marcar tema resuelto. | `200 tema actualizada` |

### `POST /questions`

```json
{
  "title": "¿Cómo delimitar el MVP del proyecto?",
  "subject": "Proyecto de Sistemas III · PRS3T6",
  "body": "Me cuesta elegir qué flujo implementar primero para que el MVP se pueda probar de principio a fin.",
  "author": null
}
```

`author` es opcional y se guarda como `null` cuando se publica de forma anónima. Título: 8–120 caracteres; materia: 2–80; cuerpo: 12–800.

### `POST /topics/:id/resolve`

```json
{
  "explanation": "Primero identifica el patrón de consulta. Luego verifica el plan de ejecución con datos representativos."
}
```

La explicación debe tener entre 20 y 1200 caracteres. El endpoint responde `404` si no existe el tema y `400` si la entrada no es válida.

## Persistencia

SQLite guarda `topics` y `questions`. El archivo local está en `backend/data/dudamapa.sqlite` y se excluye de Git. En Docker el volumen `dudamapa_data` conserva la base cuando se actualiza la imagen.
