import { apiFetch } from './modules/api.js';

const slides = [
  {
    title: 'Potencialize sua leitura do mercado em tempo real',
    text: 'Combine fluxo, macro, força setorial e pressão do índice em uma leitura visual pensada para acelerar sua tomada de decisão.',
    headline: 'Potencialize sua leitura do mercado',
    description: 'A demonstração alterna visões fictícias do radar para despertar curiosidade comercial.',
    metric: '72% / 28%',
    mode: 'Fluxo comprador'
  },
  {
    title: 'Radar de Mercado em tempo real',
    text: 'Leia fluxo institucional, indicadores macro e pressões dominantes em um painel pensado para leitura rápida.',
    headline: 'Radar em tempo real',
    description: 'Cenário fictício de convicção e dominância visual para apresentar o valor do produto.',
    metric: '68% / 32%',
    mode: 'Painel macro'
  },
  {
    title: 'Acompanhe a pressão do mercado ao vivo',
    text: 'Monitore pressão institucional e macro global em uma experiência visual feita para operação.',
    headline: 'Pressão do mercado ao vivo',
    description: 'A cena combina macro, fluxo e índice para reforçar a ideia de produto premium.',
    metric: '63% / 37%',
    mode: 'Fluxo institucional'
  },
  {
    title: 'Leia a pressão do mercado em tempo real',
    text: 'Ferramenta visual para observar dólar, risco, Brasil e direção provável do índice em um só lugar.',
    headline: 'Leia a pressão do índice',
    description: 'Take visual focado em macro global e leitura tática do índice.',
    metric: '58% / 42%',
    mode: 'Macro global'
  },
  {
    title: 'Acompanhe a pressão com leitura institucional',
    text: 'Veja direção, dominância e contexto de forma objetiva em um cockpit visual de mercado.',
    headline: 'Leitura institucional',
    description: 'A proposta aqui é criar desejo visual antes do checkout e do acesso completo.',
    metric: '77% / 23%',
    mode: 'Ativos dominantes'
  },
  {
    title: 'Entenda a direção do mercado com leitura em tempo real',
    text: 'Acesse um radar pensado para unir pressão, fluxo, probabilidade e leitura operacional.',
    headline: 'Direção do mercado',
    description: 'Fechamento do carrossel com CTA forte e pegada de produto comercial.',
    metric: '72% / 28%',
    mode: 'Direção índice'
  }
];

let activeSlide = 0;
let timer = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function qs(id) { return document.getElementById(id); }

function applySlide(index) {
  const data = slides[index];
  document.querySelectorAll('.stage-slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  document.querySelectorAll('#stageDots button').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  qs('heroTitle').textContent = data.title;
  qs('heroText').textContent = data.text;
  qs('sceneHeadline').textContent = data.headline;
  qs('sceneDescription').textContent = data.description;
  qs('sceneMetric').textContent = data.metric;
  qs('sceneMode').textContent = data.mode;
  qs('sceneCounter').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
}

function queueNext() {
  clearTimeout(timer);
  if (document.hidden || reducedMotion) return;
  timer = window.setTimeout(() => {
    activeSlide = (activeSlide + 1) % slides.length;
    applySlide(activeSlide);
    queueNext();
  }, 3600);
}

function goToSlide(index) {
  activeSlide = index;
  applySlide(activeSlide);
  queueNext();
}

async function verificarSessaoExistente() {
  try {
    await apiFetch('/api/me');
    window.location.href = '/app';
  } catch {}
}

async function onSubmit(event) {
  event.preventDefault();
  const status = qs('loginStatus');
  status.className = 'auth-status';
  status.textContent = 'Entrando...';

  const username = qs('username').value.trim();
  const password = qs('password').value;

  try {
    await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    status.classList.add('success');
    status.textContent = 'Login realizado. Redirecionando...';
    window.location.href = '/app';
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.message;
  }
}

qs('loginForm')?.addEventListener('submit', onSubmit);
qs('demoJump')?.addEventListener('click', () => {
  qs('demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelectorAll('#stageDots button').forEach((dot) => {
  dot.addEventListener('click', () => goToSlide(Number(dot.dataset.slide || 0)));
});

document.addEventListener('visibilitychange', queueNext);

applySlide(activeSlide);
queueNext();
verificarSessaoExistente();
