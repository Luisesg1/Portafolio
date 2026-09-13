export const services = [
  {
    n: '01',
    title: 'Web Development',
    desc: 'Landing pages, sitios corporativos y páginas comerciales de alto rendimiento.',
    tags: ['React', 'Vite', 'UI'],
  },
  {
    n: '02',
    title: 'Custom Systems',
    desc: 'Sistemas administrativos y soluciones empresariales a medida.',
    tags: ['Django', 'SQL', 'Auth'],
  },
  {
    n: '03',
    title: 'Applications',
    desc: 'Aplicaciones y herramientas digitales personalizadas de escritorio y web.',
    tags: ['Electron', 'React', 'API'],
  },
  {
    n: '04',
    title: 'REST APIs',
    desc: 'Diseño y desarrollo de APIs REST robustas y documentadas.',
    tags: ['Python', 'REST', 'JSON'],
  },
  {
    n: '05',
    title: 'Automation',
    desc: 'Automatización de procesos y herramientas internas que ahorran tiempo.',
    tags: ['Python', 'Scripts', 'CI'],
  },
  {
    n: '06',
    title: 'Backend & Data',
    desc: 'APIs, lógica de negocio y modelos de datos, con autenticación y roles.',
    tags: ['PostgreSQL', 'Auth', 'Roles'],
  },
] as const

export const projects = [
  {
    n: '01',
    title: 'Calculadora 3D',
    category: 'Costing System',
    desc: 'App móvil para el cálculo de costos, precios y márgenes de productos fabricados mediante impresión 3D.',
    tech: ['Kotlin', 'Jetpack Compose', 'Android'],
    accent: 'var(--blue)',
    year: '2025',
    role: 'Mobile Developer',
    stack: ['Kotlin', 'Jetpack Compose', 'Material 3', 'Hilt'],
    problem:
      'Calcular el costo real de una pieza impresa en 3D es tedioso y propenso a errores: material, tiempo de máquina, energía, desgaste y margen se estimaban a mano en planillas.',
    solution:
      'Una app móvil Android que centraliza todas las variables de costeo y calcula precio y margen al instante, con parámetros reutilizables y una interfaz clara pensada para uso diario.',
    result:
      'Reemplaza el cálculo manual por un flujo consistente y repetible: menos margen de error y precios listos al instante a partir de parámetros reutilizables.',
    repo: 'https://github.com/Luisesg1/Calculadora-3D' as string,
    images: [
      '/projects/calc3d-1.webp',
      '/projects/calc3d-2.webp',
      '/projects/calc3d-3.webp',
      '/projects/calc3d-4.webp',
    ] as string[],
    wip: true,
    device: 'phone' as 'phone' | 'browser',
    screens: ['Inicio', 'Cotización', 'Materiales', 'Estadísticas'] as string[],
  },
  {
    n: '02',
    title: 'Gestión Institucional',
    category: 'Web System',
    desc: 'Sistema web para gestión de usuarios, roles, permisos, inventario y procesos administrativos.',
    tech: ['Django', 'PostgreSQL', 'REST API'],
    accent: 'var(--violet)',
    year: '2025',
    role: 'Full Stack Developer',
    stack: ['Django', 'PostgreSQL', 'REST API', 'Python'],
    problem:
      'Los procesos administrativos vivían dispersos en planillas y trámites manuales, sin control de acceso ni trazabilidad sobre quién hacía qué.',
    solution:
      'Una plataforma web con autenticación, roles y permisos granulares, módulos de inventario y gestión, respaldada por una API REST y una base de datos relacional.',
    result:
      'Unificó la operación en un solo sistema con control de acceso por rol, dando estructura y trazabilidad a procesos que antes eran manuales.',
    repo: 'https://github.com/Luisesg1/inventario-liceo' as string,
    images: [
      '/projects/gestion-1.webp',
      '/projects/gestion-2.webp',
      '/projects/gestion-3.webp',
      '/projects/gestion-4.webp',
    ] as string[],
    wip: true,
    device: 'browser' as 'phone' | 'browser',
    screens: ['Inicio', 'Inventario', 'Tickets', 'Personal'] as string[],
  },
  {
    n: '03',
    title: 'DEFCA',
    category: 'AgTech / Research',
    desc: 'Proyecto tecnológico enfocado en la detección de enfermedades foliares en cultivos de avellano.',
    tech: ['Python', 'Data', 'Vision'],
    accent: 'var(--coral)',
    year: '2026',
    role: 'Developer / Research',
    stack: ['Python', 'Computer Vision', 'Data'],
    problem:
      'La detección temprana de enfermedades foliares en avellano depende de inspección visual manual, lenta y difícil de escalar a lo largo de un cultivo.',
    solution:
      'Un enfoque basado en visión por computador y análisis de datos para identificar signos de enfermedad en hojas a partir de imágenes, apoyando la decisión agronómica.',
    result:
      'Proyecto de investigación aplicada que explora cómo la tecnología puede asistir el diagnóstico agrícola de forma más rápida y objetiva.',
    repo: '' as string,
    images: [
      '/projects/defca-1.webp',
      '/projects/defca-2.webp',
      '/projects/defca-3.webp',
    ] as string[],
    wip: true,
    device: 'browser' as 'phone' | 'browser',
    screens: ['Características', 'Por qué DEFCA', 'Nosotros'] as string[],
  },
  {
    n: '04',
    title: 'Beast',
    category: 'Fitness App',
    desc: 'App de gimnasio que registra entrenamientos, records y progreso, con un coach de IA que analiza tu historial.',
    tech: ['React', 'Firebase', 'IA'],
    accent: 'var(--cyan)',
    year: '2026',
    role: 'Mobile Developer',
    stack: ['React', 'Vite', 'Capacitor', 'Firebase', 'IA'],
    problem:
      'Llevar el control del gym —series, PRs, RPE, volumen por músculo— a mano o en notas es tedioso y no entrega retroalimentación útil para progresar.',
    solution:
      'Una app Android que registra sesiones, calcula records y 1RM, detecta músculos descuidados y suma un coach de IA (BRUX) que analiza tu historial y responde en lenguaje natural, con logros y rachas que sostienen la constancia.',
    result:
      'Convierte el registro de entrenamientos en datos accionables —PRs, insights y recomendaciones— con una capa de gamificación que mantiene al usuario volviendo.',
    repo: 'https://github.com/Luisesg1/gym-app' as string,
    images: [
      '/projects/beast-1.webp',
      '/projects/beast-5.webp',
      '/projects/beast-2.webp',
      '/projects/beast-3.webp',
      '/projects/beast-4.webp',
    ] as string[],
    wip: true,
    device: 'phone' as 'phone' | 'browser',
    screens: ['Home', 'Menú', 'Dashboard', 'Coach IA', 'Records'] as string[],
  },
  {
    n: '05',
    title: 'Sistema de Cotizaciones',
    category: 'Web System',
    desc: 'App web para gestionar cotizaciones: clientes, cálculo automático de IVA, numeración diaria y PDF profesional con firma digital.',
    tech: ['React', 'TypeScript', 'Supabase'],
    accent: 'var(--magenta)',
    year: '2026',
    role: 'Full Stack Developer',
    stack: ['React 18', 'TypeScript', 'TailwindCSS', 'Supabase', 'PostgreSQL', 'jsPDF'],
    problem:
      'Generar cotizaciones a mano en Word/Excel —sin numeración consistente, sin registro histórico ni control de clientes— es un proceso lento y propenso a errores.',
    solution:
      'App web de gestión de cotizaciones: CRUD de clientes, cálculo automático de subtotal/IVA/total, numeración diaria (AAMMDD-N), PDF profesional de una página con firma digital y datos bancarios, historial con búsqueda y duplicado, y configuración de la empresa. Autenticación con recuperación de contraseña.',
    result:
      'Sistema completo de punta a punta: genera cotizaciones en segundos con formato consistente, respaldo centralizado en la nube y PDF listo para enviar. Incluye modo demo sin backend.',
    repo: 'https://github.com/Luisesg1/sistema-cotizacion' as string,
    images: [
      '/projects/cotiza-1.webp',
      '/projects/cotiza-3.webp',
      '/projects/cotiza-4.webp',
      '/projects/cotiza-2.webp',
      '/projects/cotiza-5.webp',
    ] as string[],
    wip: false,
    device: 'browser' as 'phone' | 'browser',
    screens: ['Dashboard', 'Historial', 'Clientes', 'Nueva Cotización', 'Configuración'] as string[],
  },
] as const

/** Real, non-fabricated portfolio signals. No fake client counts or metrics. */
export const metrics = [
  { label: 'Projects Built', value: '05', sub: 'Real, built end-to-end' },
  { label: 'Focus', value: 'FULL', sub: 'Stack — front to back' },
  { label: 'Since', value: '2026', sub: 'Ingeniería · INACAP' },
  { label: 'Mode', value: 'BUILD', sub: 'Create · Learn · Iterate' },
] as const

/** SYSTEM status readout — capabilities, not fake uptime. */
export const systemStatus = [
  { key: 'FRONTEND', value: 'ONLINE' },
  { key: 'BACKEND', value: 'ONLINE' },
  { key: 'DATABASE', value: 'ONLINE' },
  { key: 'REST APIs', value: 'ONLINE' },
  { key: 'UI / UX', value: 'ONLINE' },
  { key: 'CREATIVE', value: 'ONLINE' },
] as const

/** Per-technology meta shown on hover in the Tech section. */
export const techMeta: Record<string, string> = {
  React: 'UI / Daily driver',
  TypeScript: 'Typed / Preferred',
  JavaScript: 'Core / Fluent',
  HTML: 'Semantic / Fundamentals',
  CSS: 'Motion / Layout',
  Tailwind: 'Utility / Rapid UI',
  Vite: 'Build / Dev speed',
  Python: 'Backend / Data',
  Django: 'Backend / Systems',
  Java: 'Backend / OOP',
  'Spring Boot': 'Backend / APIs',
  'REST API': 'Integration / Design',
  Kotlin: 'Android / Modern',
  'Jetpack Compose': 'Android / UI',
  'Android Studio': 'Mobile / IDE',
  MySQL: 'Relational / Queries',
  PostgreSQL: 'Relational / Production',
  H2: 'In-memory / Testing',
  Supabase: 'BaaS / Postgres',
  Git: 'Versioning / Workflow',
  GitHub: 'Collaboration / CI',
  Electron: 'Desktop / Cross-platform',
}

/** Technologies I reach for first — highlighted over the complementary ones. */
export const coreTech = new Set([
  'React',
  'TypeScript',
  'Python',
  'Django',
  'Kotlin',
  'PostgreSQL',
])

export const projectTypes = [
  'Web Development',
  'Web Application',
  'E-Commerce',
  'Custom Software',
  'Other',
] as const

export const stack = [
  {
    group: 'Frontend',
    items: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Vite'],
  },
  { group: 'Backend', items: ['Python', 'Django', 'Java', 'Spring Boot', 'REST API'] },
  { group: 'Mobile', items: ['Kotlin', 'Jetpack Compose', 'Android Studio'] },
  { group: 'Database', items: ['PostgreSQL', 'MySQL', 'Supabase', 'H2'] },
  { group: 'Tools', items: ['Git', 'GitHub', 'Electron'] },
] as const

export const process = [
  { n: '01' },
  { n: '02' },
  { n: '03' },
  { n: '04' },
  { n: '05' },
] as const

export const approach = [
  'Design',
  'Technology',
  'Performance',
  'UX',
  'Scalability',
  'Problem Solving',
] as const
