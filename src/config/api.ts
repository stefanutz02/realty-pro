// src/config/api.ts

export const API_BASE_URL = 'https:
export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    registerToken: '/auth/register-token',
  },

  properties: {
    search: '/properties/search',
    detail: '/properties/:id',
    list: '/properties',
    filters: '/properties/filters',
  },

  favorites: {
    list: '/favorites',
    add: '/favorites/add',
    remove: '/favorites/remove',
    snapshot: '/favorites/snapshot',
  },

  blog: {
    list: '/blog/posts',
    detail: '/blog/posts/:id',
    search: '/blog/search',
  },

  chat: {
    send: '/chat/message',
    transcript: '/chat/transcript',
    consent: '/chat/consent',
  },

  credits: {
    rates: '/credits/rates',
    calculate: '/credits/calculate',
  },

  contact: {
    submit: '/contact/submit',
    inquiry: '/contact/inquiry',
  },

  locations: {
    counties: '/locations/counties',
    cities: '/locations/cities/:countyId',
    zones: '/locations/zones/:cityId',
  },

  agents: {
    list: '/agents',
    detail: '/agents/:id',
  },
};

export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }

  return url;
};

export const isLegacyUrl = (url: string): boolean => {
  return (
    url.includes('obiectivimobiliare.ro') ||
    url.includes('immoflux.ro') ||
    url.includes('api.obiectivimobiliare.ro')
  );
};
