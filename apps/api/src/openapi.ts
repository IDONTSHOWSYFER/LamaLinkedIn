// Spécification OpenAPI 3.0 de l'API Lama Linked.In (documentation Swagger).
// Servie sur GET /api/docs (UI) et GET /api/openapi.json (JSON brut).

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Lama Linked.In — API REST',
    version: '1.0.0',
    description:
      "API de l'assistant LinkedIn Lama Linked.In : authentification (JWT), événements & statistiques, lead magnet. " +
      'Sécurité : bcrypt, validation Zod, en-têtes OWASP, rate limiting Redis, anti-énumération.',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local' },
    { url: 'https://lama-linked-in-api.onrender.com', description: 'Production (Render)' },
  ],
  tags: [
    { name: 'Système' },
    { name: 'Authentification' },
    { name: 'Événements' },
    { name: 'Lead magnet' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string' },
          type: { type: 'string', enum: ['like', 'comment', 'connection', 'message'] },
          postId: { type: 'string', nullable: true },
          mode: { type: 'string', enum: ['assist', 'agent'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          likes: { type: 'integer' },
          comments: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
      Message: { type: 'object', properties: { message: { type: 'string' } } },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Système'],
        summary: 'Health check + version',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentification'],
        summary: 'Inscription',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '400': { description: 'Données invalides (Zod)' },
          '409': { description: 'Email déjà utilisé' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Connexion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Identifiants incorrects' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentification'],
        summary: 'Profil courant',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '401': { description: 'Token manquant/invalide' },
        },
      },
      put: {
        tags: ['Authentification'],
        summary: 'Mise à jour du profil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } },
            },
          },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Non autorisé' }, '409': { description: 'Email déjà utilisé' } },
      },
      delete: {
        tags: ['Authentification'],
        summary: 'Suppression du compte (RGPD)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Compte et données supprimés' }, '401': { description: 'Non autorisé' } },
      },
    },
    '/api/auth/password': {
      put: {
        tags: ['Authentification'],
        summary: 'Changement de mot de passe',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } },
              },
            },
          },
        },
        responses: { '200': { description: 'Mis à jour' }, '401': { description: 'Mot de passe actuel incorrect' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Demande de réinitialisation (réponse générique anti-énumération)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
        },
        responses: { '200': { description: 'Réponse générique', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentification'],
        summary: 'Réinitialisation via token (haché SHA-256, expiration 1 h)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 } } },
            },
          },
        },
        responses: { '200': { description: 'Mot de passe réinitialisé' }, '400': { description: 'Lien invalide ou expiré' } },
      },
    },
    '/api/events': {
      post: {
        tags: ['Événements'],
        summary: 'Créer un événement LinkedIn',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['like', 'comment', 'connection', 'message'] },
                  postId: { type: 'string' },
                  authorName: { type: 'string' },
                  authorTag: { type: 'string' },
                  content: { type: 'string' },
                  mode: { type: 'string', enum: ['assist', 'agent'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
          '400': { description: 'Données invalides' },
          '401': { description: 'Non autorisé' },
        },
      },
      get: {
        tags: ['Événements'],
        summary: 'Lister ses événements (paginé, max 200)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Event' } } } } } },
      },
    },
    '/api/events/stats': {
      get: {
        tags: ['Événements'],
        summary: 'Statistiques par période (cache Redis)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'period', in: 'query', schema: { type: 'string', enum: ['today', 'week', 'month'], default: 'today' } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } } },
      },
    },
    '/api/lead': {
      post: {
        tags: ['Lead magnet'],
        summary: "Soumission du lead magnet (envoi de l'ebook)",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName'],
                properties: { email: { type: 'string', format: 'email' }, firstName: { type: 'string', minLength: 1, maxLength: 80 }, consent: { type: 'boolean' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Email envoyé' }, '400': { description: 'Données invalides' } },
      },
    },
  },
} as const;
