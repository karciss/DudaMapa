<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowDownRight, ArrowRight, BookOpen, Check, ChevronDown, CircleCheck, Clock3,
  Compass, Flame, Heart, HelpCircle, MessageCircle, Plus, Search, Send,
  SlidersHorizontal, Sparkles, Users, X,
} from '@lucide/vue'
import { endorseTopic, getCourses, getTopic, getTopics, postQuestion, resolveTopic } from './services/api'
import { compactNumber, filterTopics, formatRelativeDate, heatLevel } from './utils/topics'

const topics = ref([])
const courses = ref([])
const selectedCourse = ref('Todas las materias')
const selectedStatus = ref('Todos')
const search = ref('')
const sortBy = ref('popular')
const loading = ref(true)
const errorMessage = ref('')
const activeTopic = ref(null)
const showQuestionForm = ref(false)
const questionTitle = ref('')
const questionSubject = ref('')
const questionDetails = ref('')
const questionName = ref('')
const explanationText = ref('')
const submitting = ref(false)
const toastMessage = ref('')
let debounceTimer
let toastTimer

const visibleTopics = computed(() => {
  const result = filterTopics(topics.value, {
    query: search.value,
    course: selectedCourse.value,
    status: selectedStatus.value,
  })
  return [...result].sort((a, b) => sortBy.value === 'recent'
    ? new Date(b.updatedAt) - new Date(a.updatedAt)
    : b.supporters - a.supporters)
})

const unresolvedCount = computed(() => topics.value.filter((topic) => !topic.resolved).length)
const resolvedCount = computed(() => topics.value.filter((topic) => topic.resolved).length)
const criticalCount = computed(() => topics.value.filter((topic) => !topic.resolved && topic.supporters >= 20).length)
const totalSupporters = computed(() => topics.value.reduce((sum, topic) => sum + topic.supporters, 0))

async function refreshTopics() {
  loading.value = true
  try {
    const [nextTopics, nextCourses] = await Promise.all([
      getTopics(),
      courses.value.length ? Promise.resolve(courses.value) : getCourses(),
    ])
    topics.value = nextTopics
    courses.value = nextCourses
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = 'No pudimos conectar con el mapa. Revisa que la API esté encendida e inténtalo de nuevo.'
  } finally {
    loading.value = false
  }
}

async function openTopic(topic) {
  try {
    activeTopic.value = await getTopic(topic.id)
    explanationText.value = ''
  } catch {
    notify('No se pudo abrir esta duda. Intenta de nuevo.')
  }
}

async function vote(topic) {
  try {
    const updated = await endorseTopic(topic.id)
    topics.value = topics.value.map((item) => item.id === updated.id ? updated : item)
    if (activeTopic.value?.id === updated.id) activeTopic.value = { ...activeTopic.value, ...updated }
    notify('Sumamos tu voz al punto crítico')
  } catch {
    notify('No se pudo registrar tu apoyo. Intenta de nuevo.')
  }
}

async function submitQuestion() {
  if (!questionTitle.value.trim() || !questionSubject.value || !questionDetails.value.trim()) return
  submitting.value = true
  try {
    const result = await postQuestion({
      title: questionTitle.value.trim(),
      subject: questionSubject.value,
      body: questionDetails.value.trim(),
      author: questionName.value.trim() || null,
    })
    await refreshTopics()
    showQuestionForm.value = false
    questionTitle.value = ''
    questionDetails.value = ''
    questionName.value = ''
    notify('Tu duda ya está en el mapa')
    if (result.topic) await openTopic(result.topic)
  } catch (error) {
    notify(error.message || 'No se pudo publicar la duda.')
  } finally {
    submitting.value = false
  }
}

async function publishExplanation() {
  if (!activeTopic.value || !explanationText.value.trim()) return
  submitting.value = true
  try {
    const updated = await resolveTopic(activeTopic.value.id, explanationText.value.trim())
    activeTopic.value = await getTopic(updated.id)
    topics.value = topics.value.map((topic) => topic.id === updated.id ? updated : topic)
    explanationText.value = ''
    notify('Explicación publicada. ¡Tema resuelto!')
  } catch (error) {
    notify(error.message || 'No se pudo publicar la explicación.')
  } finally {
    submitting.value = false
  }
}

function notify(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 3200)
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    activeTopic.value = null
    showQuestionForm.value = false
  }
}

onMounted(() => {
  refreshTopics()
  window.addEventListener('keydown', handleEscape)
})
onUnmounted(() => {
  clearTimeout(debounceTimer)
  clearTimeout(toastTimer)
  window.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#inicio" aria-label="DudaMapa, ir al inicio">
        <span class="brand-mark"><Compass :size="21" stroke-width="2.3" /></span>
        <span>Duda<span class="brand-highlight">Mapa</span><small>APRENDER EN COMUNIDAD</small></span>
      </a>
      <nav class="main-nav" aria-label="Navegación principal">
        <a class="nav-link nav-link-active" href="#mapa">Explorar mapa</a>
        <a class="nav-link" href="#como-funciona">Cómo funciona</a>
      </nav>
      <button class="button button-dark button-ask" data-testid="open-question-form" @click="showQuestionForm = true">
        <Plus :size="17" /> Compartir una duda
      </button>
    </header>

    <main id="inicio">
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-dot"></span> INGENIERÍA DE SISTEMAS · SEXTO SEMESTRE</div>
          <h1>Una duda compartida<br />puede abrir <span>muchas puertas.</span></h1>
          <p class="hero-description">Encuentra lo que está costando, comparte lo que sabes y convierte cada pregunta en un paso adelante.</p>
          <div class="hero-actions">
            <a href="#mapa" class="button button-lime">Explorar el mapa <ArrowDownRight :size="17" /></a>
            <button class="button button-quiet" @click="showQuestionForm = true"><MessageCircle :size="17" /> Preguntar en anónimo</button>
          </div>
          <div class="hero-trust"><div class="avatar-stack"><span>✦</span><span>↗</span><span>●</span></div><span>Una comunidad que aprende <strong>sin miedo a preguntar</strong></span></div>
        </div>
        <div class="hero-art" aria-label="Ilustración de conexiones entre dudas y respuestas">
          <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
          <svg class="map-lines" viewBox="0 0 550 390" aria-hidden="true">
            <path d="M79 92 C169 96 165 170 245 174 S348 122 428 87" />
            <path d="M245 174 C203 232 150 242 116 305" />
            <path d="M245 174 C313 236 355 260 449 284" />
            <path d="M428 87 C436 172 441 209 449 284" />
          </svg>
          <div class="orbit-label label-top"><Sparkles :size="14" /> ideas que conectan</div>
          <div class="map-node node-one"><span class="node-icon node-coral"><HelpCircle :size="19" /></span><span><strong>¿Integración o E2E?</strong><small>Software Quality Assurance</small></span><i>+26</i></div>
          <div class="map-node node-two"><span class="node-icon node-blue"><BookOpen :size="19" /></span><span><strong>¿Cómo reducir el mareo?</strong><small>Realidad Virtual y Aumentada</small></span><i>+19</i></div>
          <div class="map-node node-three"><span class="node-icon node-violet"><MessageCircle :size="18" /></span><span><strong>Timeout entre dos redes</strong><small>Redes y Comunicación II</small></span><i>+14</i></div>
          <div class="map-node node-four"><span class="node-icon node-yellow"><CircleCheck :size="18" /></span><span><strong>¿Cuándo se completa una tarea?</strong><small>Proyecto de Sistemas III</small></span><i class="resolved-mini">Resuelto</i></div>
          <div class="map-center"><span class="center-spark">✳</span><strong>Cuando una<br />duda nos une</strong><small>el aprendizaje<br />se multiplica</small></div>
          <div class="orbit-label label-bottom"><span></span> temas que necesitan atención</div>
        </div>
        <div class="hero-bottom-note"><span>01</span> EL MAPA CRECE CON CADA PREGUNTA</div>
      </section>

      <section class="map-section" id="mapa">
        <div class="section-heading">
          <div>
            <div class="eyebrow eyebrow-light"><span class="eyebrow-dot"></span> PULSO DE LA COMUNIDAD</div>
            <h2>¿Qué estamos <span>aprendiendo?</span></h2>
            <p class="section-subtitle">Ejemplos de dudas inspirados en las materias de sexto semestre. Los apoyos iniciales son ilustrativos y se actualizarán con la participación del grupo.</p>
          </div>
          <button class="button button-outline" data-testid="ask-from-map" @click="showQuestionForm = true"><Plus :size="17" /> Sumar una pregunta</button>
        </div>

        <div class="stats-row" aria-label="Resumen del mapa">
          <div class="stat-card stat-featured"><span class="stat-icon stat-icon-lime"><Flame :size="18" /></span><div><strong data-testid="critical-count">{{ compactNumber(criticalCount) }}</strong><span>puntos críticos</span></div><span class="stat-trend">EN FOCO</span></div>
          <div class="stat-card"><span class="stat-icon stat-icon-coral"><HelpCircle :size="18" /></span><div><strong>{{ compactNumber(unresolvedCount) }}</strong><span>dudas abiertas</span></div></div>
          <div class="stat-card"><span class="stat-icon stat-icon-violet"><CircleCheck :size="18" /></span><div><strong>{{ compactNumber(resolvedCount) }}</strong><span>temas resueltos</span></div></div>
          <div class="stat-card"><span class="stat-icon stat-icon-blue"><Users :size="18" /></span><div><strong>{{ compactNumber(totalSupporters) }}</strong><span>voces en el mapa</span></div></div>
        </div>

        <div class="map-toolbar">
          <div class="toolbar-intro"><span class="toolbar-pulse"></span><span>Explora por materia o encuentra una duda</span></div>
          <label class="search-box"><Search :size="18" /><input v-model="search" data-testid="search-input" type="search" placeholder="Buscar tema, materia..." /><kbd>⌘ K</kbd></label>
          <label class="select-box"><SlidersHorizontal :size="16" /><select v-model="selectedCourse" data-testid="course-filter" aria-label="Filtrar por materia"><option>Todas las materias</option><option v-for="course in courses" :key="course" :value="course">{{ course }}</option></select><ChevronDown :size="15" /></label>
        </div>

        <div class="map-filter-row">
          <div class="filter-pills" role="group" aria-label="Filtrar por estado">
            <button v-for="state in ['Todos', 'Sin resolver', 'Resueltos']" :key="state" class="filter-pill" :class="{ 'filter-pill-active': selectedStatus === state }" :data-testid="`status-${state.toLowerCase().replace(' ', '-')}`" @click="selectedStatus = state">{{ state }}<span v-if="state === 'Todos'">{{ topics.length }}</span></button>
          </div>
          <label class="sort-control">Ordenar por <select v-model="sortBy" aria-label="Ordenar dudas"><option value="popular">Más apoyadas</option><option value="recent">Más recientes</option></select><ChevronDown :size="14" /></label>
        </div>

        <div v-if="errorMessage" class="connection-banner" role="alert"><span>{{ errorMessage }}</span><button @click="refreshTopics">Reintentar</button></div>
        <div v-if="loading" class="loading-state" role="status"><span class="loading-spinner"></span> Trazando el mapa de dudas...</div>
        <div v-else-if="visibleTopics.length" class="topic-grid" data-testid="topic-grid">
          <article v-for="(topic, index) in visibleTopics" :key="topic.id" class="topic-card" :class="[`heat-${heatLevel(topic.supporters).color}`, { 'topic-resolved': topic.resolved }]" :data-testid="`topic-card-${topic.id}`" :style="{ '--card-index': index }" @click="openTopic(topic)">
            <div class="card-topline"><span class="subject-tag"><span class="subject-dot"></span>{{ topic.subject }}</span><span v-if="topic.resolved" class="resolved-tag"><Check :size="13" /> Resuelto</span><span v-else class="heat-tag" :class="`heat-label-${heatLevel(topic.supporters).color}`"><Flame v-if="topic.supporters >= 20" :size="13" />{{ heatLevel(topic.supporters).label }}</span></div>
            <h3>{{ topic.title }}</h3>
            <p class="topic-summary">{{ topic.summary }}</p>
            <div class="card-topic-tags"><span v-for="tag in (topic.tags || []).slice(0, 2)" :key="tag">#{{ tag }}</span></div>
            <div class="card-footer"><div class="support-info"><span class="support-avatars"><i>✳</i><i>◌</i><i>✦</i></span><strong>{{ topic.supporters }}</strong><span>también tienen esta duda</span></div><button class="support-button" :aria-label="`Yo también tengo la duda: ${topic.title}`" :data-testid="`support-${topic.id}`" @click.stop="vote(topic)"><Heart :size="16" /> Yo también</button></div>
            <div class="card-bottom"><span><MessageCircle :size="14" /> {{ topic.questionsCount }} preguntas</span><span><Clock3 :size="14" /> {{ formatRelativeDate(topic.updatedAt) }}</span><button class="card-open" :aria-label="`Ver duda: ${topic.title}`" @click.stop="openTopic(topic)"><ArrowRight :size="16" /></button></div>
          </article>
        </div>
        <div v-else class="empty-state" data-testid="empty-state"><span class="empty-icon"><Search :size="22" /></span><h3>Por aquí todavía no hay una duda</h3><p>Prueba otra búsqueda o comparte la primera pregunta para abrir el mapa.</p><button class="button button-dark" @click="showQuestionForm = true"><Plus :size="16" /> Compartir una duda</button></div>

        <div class="map-legend"><span class="legend-title"><Sparkles :size="15" /> CÓMO LEER EL MAPA</span><span><i class="legend-dot legend-mint"></i> En observación</span><span><i class="legend-dot legend-sun"></i> Se repite</span><span><i class="legend-dot legend-coral"></i> Punto crítico</span><span class="legend-note">La intensidad refleja cuántas personas la apoyaron.</span></div>
      </section>

      <section class="how-section" id="como-funciona">
        <div class="how-copy"><div class="eyebrow"><span class="eyebrow-dot"></span> APRENDER ES UN PROCESO COMPARTIDO</div><h2>Una pregunta.<br /><span>Un mapa entero.</span></h2><p>No tienes que saberlo todo para ayudar. A veces, decir “a mí también me pasa” es el primer paso para que alguien encuentre la respuesta.</p><a href="#mapa" class="text-link">Recorrer el mapa <ArrowRight :size="16" /></a></div>
        <div class="steps-list">
          <article class="step-item"><span class="step-number">01</span><span class="step-icon step-icon-coral"><MessageCircle :size="19" /></span><div><h3>Pregunta sin presión</h3><p>Publica de forma anónima. La atención está en la idea, no en quién la escribió.</p></div></article>
          <article class="step-item"><span class="step-number">02</span><span class="step-icon step-icon-blue"><Users :size="19" /></span><div><h3>Encuentra a quienes comparten tu duda</h3><p>Apoya un tema y mira cómo las preguntas frecuentes aparecen en el mapa.</p></div></article>
          <article class="step-item"><span class="step-number">03</span><span class="step-icon step-icon-lime"><Sparkles :size="19" /></span><div><h3>Conviertan la duda en claridad</h3><p>Una explicación de la comunidad puede cerrar el ciclo y ayudar a la siguiente persona.</p></div></article>
        </div>
      </section>
    </main>

    <footer class="footer"><a class="brand footer-brand" href="#inicio"><span class="brand-mark"><Compass :size="19" /></span><span>Duda<span class="brand-highlight">Mapa</span></span></a><span>Hecho para aprender mejor, juntos.</span><a href="#mapa">Volver al mapa <ArrowRight :size="14" /></a></footer>

    <Transition name="fade"><div v-if="activeTopic" class="overlay" data-testid="topic-overlay" @click.self="activeTopic = null"><section class="detail-panel" role="dialog" aria-modal="true" :aria-label="activeTopic.title">
      <button class="close-button" aria-label="Cerrar detalle" data-testid="close-detail" @click="activeTopic = null"><X :size="19" /></button>
      <div class="detail-kicker"><span class="subject-tag"><span class="subject-dot"></span>{{ activeTopic.subject }}</span><span v-if="activeTopic.resolved" class="resolved-tag"><Check :size="13" /> Resuelto</span><span v-else class="heat-tag" :class="`heat-label-${heatLevel(activeTopic.supporters).color}`">{{ heatLevel(activeTopic.supporters).label }}</span></div>
      <h2>{{ activeTopic.title }}</h2><p class="detail-summary">{{ activeTopic.summary }}</p>
      <div class="detail-support"><div class="detail-support-count"><strong>{{ activeTopic.supporters }}</strong><span>personas también tienen esta duda</span></div><button class="button button-dark" :data-testid="`detail-support-${activeTopic.id}`" @click="vote(activeTopic)"><Heart :size="16" /> Yo también</button></div>
      <div class="detail-divider"></div>
      <div class="detail-section-title"><h3>Preguntas de la comunidad</h3><span>{{ activeTopic.questions?.length || 0 }}</span></div>
      <div v-if="activeTopic.questions?.length" class="question-list"><article v-for="question in activeTopic.questions" :key="question.id" class="community-question"><span class="question-avatar"><MessageCircle :size="15" /></span><div><p>{{ question.body }}</p><small>{{ question.author || 'Estudiante anónimo' }} · {{ formatRelativeDate(question.createdAt) }}</small></div></article></div>
      <p v-else class="no-questions">Todavía no hay preguntas escritas. Puedes ser la primera persona en explicar qué parte cuesta.</p>
      <div v-if="activeTopic.resolved" class="answer-card"><div class="answer-heading"><span class="answer-check"><Check :size="15" /></span><div><strong>Una explicación para llevarse</strong><small>Compartida por la comunidad</small></div></div><p>{{ activeTopic.explanation }}</p></div>
      <form v-else class="explanation-form" @submit.prevent="publishExplanation"><label for="explanation">¿Tienes una explicación que pueda ayudar?</label><textarea id="explanation" v-model="explanationText" data-testid="explanation-input" rows="3" maxlength="1200" placeholder="Comparte el paso a paso, una idea clave o un recurso que te haya servido..."></textarea><div class="explanation-actions"><span>Al publicarla, el tema quedará marcado como resuelto.</span><button class="button button-lime" data-testid="resolve-topic" :disabled="submitting || !explanationText.trim()"><Send :size="15" /> Publicar y resolver</button></div></form>
      <button class="link-question" @click="activeTopic = null; showQuestionForm = true">¿Tienes otra pregunta? <span>Compártela en el mapa</span></button>
    </section></div></Transition>

    <Transition name="fade"><div v-if="showQuestionForm" class="overlay" data-testid="question-overlay" @click.self="showQuestionForm = false"><section class="question-modal" role="dialog" aria-modal="true" aria-labelledby="question-modal-title">
      <button class="close-button" aria-label="Cerrar formulario" data-testid="close-question-form" @click="showQuestionForm = false"><X :size="19" /></button>
      <div class="modal-symbol"><MessageCircle :size="22" /></div><div class="eyebrow"><span class="eyebrow-dot"></span> TU PREGUNTA TIENE UN LUGAR AQUÍ</div><h2 id="question-modal-title">Abramos una<br /><span>nueva ruta.</span></h2><p class="modal-intro">Cuéntanos qué tema te gustaría entender. Tu nombre es opcional.</p>
      <form class="question-form" data-testid="question-form" @submit.prevent="submitQuestion">
        <label for="question-title">¿Cuál es la duda?<input id="question-title" v-model="questionTitle" data-testid="question-title" maxlength="120" required placeholder="Ej. ¿Cuándo conviene usar una subconsulta?" /></label>
        <label for="question-course">Materia<select id="question-course" v-model="questionSubject" data-testid="question-subject" required><option disabled value="">Elige una materia</option><option v-for="course in courses" :key="course">{{ course }}</option></select><ChevronDown :size="15" /></label>
        <label for="question-details">¿Qué parte se te hace difícil?<textarea id="question-details" v-model="questionDetails" data-testid="question-details" maxlength="800" required rows="3" placeholder="Puedes explicar qué intentaste y dónde te trabaste..."></textarea></label>
        <label for="question-name">Tu nombre <span>(opcional)</span><input id="question-name" v-model="questionName" data-testid="question-name" maxlength="50" placeholder="Deja este campo vacío para publicar en anónimo" /></label>
        <div class="anonymous-note"><span><Heart :size="16" /></span><p><strong>Tu espacio, tus reglas.</strong> Si no escribes tu nombre, tu pregunta aparece como anónima.</p></div>
        <button class="button button-dark submit-question" data-testid="submit-question" :disabled="submitting"><Send :size="16" /> {{ submitting ? 'Publicando...' : 'Compartir en el mapa' }}</button>
      </form>
    </section></div></Transition>

    <Transition name="toast"><div v-if="toastMessage" class="toast-message" role="status"><span class="toast-check"><Check :size="14" /></span>{{ toastMessage }}</div></Transition>
  </div>
</template>
