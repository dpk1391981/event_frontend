import axios from 'axios';

// Production: NEXT_PUBLIC_API_URL=/bff/api/v1  (BFF — same-origin, no CORS)
// Development: http://localhost:3001/api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => Promise.reject(err.response?.data || err),
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  /** Returns { otpMode, emailConfigured, googleEnabled, googleClientId, showPhone } */
  getConfig:    () => api.get('/auth/config'),
  checkEmail:   (email: string) => api.get(`/auth/check-email?email=${encodeURIComponent(email)}`),

  // ── Password auth ──
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: () =>
    api.post('/auth/resend-verification', {}),

  // ── OTP auth ──
  sendOtp: (identifier: { phone?: string; email?: string }) =>
    api.post('/auth/send-otp', identifier),
  verifyOtp: (identifier: { phone?: string; email?: string }, otp: string) =>
    api.post('/auth/verify-otp', { ...identifier, otp }),

  // ── Google ──
  googleLogin: (credential: string) =>
    api.post('/auth/google', { credential }),

  // ── Profile & preferences ──
  updateProfile: (data: { name: string; email?: string; phone?: string; role?: string }) =>
    api.patch('/auth/profile', data),
  savePreferences: (data: {
    budget?: string; cityId?: number; localityId?: number; eventTypes?: string[];
  }) => api.patch('/auth/preferences', data),
  getMe: () => api.post('/auth/me'),
};

// ─── Search ──────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (params: Record<string, unknown>) => api.get('/search', { params }),
  nlpSearch: (q: string, cityId?: number, eventDate?: string, eventTime?: string) =>
    api.get('/search/nlp', { params: { q, cityId, eventDate, eventTime } }),
  eventPlan: (eventType: string, budget: number, cityId: number, guestCount?: number, eventDate?: string) =>
    api.get('/search/event-plan', { params: { eventType, budget, cityId, guestCount, eventDate } }),
  parseIntent: (q: string) => api.get('/search/parse-intent', { params: { q } }),
};

// ─── Vendor Availability ──────────────────────────────────────────────────────
export const availabilityApi = {
  get: () => api.get('/vendor/availability'),
  update: (data: { availabilityType?: 'always' | 'manual'; weeklySlots?: Record<string, string[]> }) =>
    api.patch('/vendor/availability', data),
  blockDate: (date: string) => api.post('/vendor/availability/block', { date }),
  unblockDate: (date: string) => api.delete(`/vendor/availability/block/${date}`),
};

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const vendorsApi = {
  getFeatured: (cityId?: number) => api.get('/vendors/featured', { params: { cityId } }),
  getById: (id: number) => api.get(`/vendors/${id}`),
  getBySlug: (slug: string) => api.get(`/vendors/slug/${slug}`),
  create: (data: unknown) => api.post('/vendors', data),
  update: (id: number, data: unknown) => api.patch(`/vendors/${id}`, data),
  getMyProfile: () => api.get('/vendors/my'),
};

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  getCities:      ()             => api.get('/locations/cities'),
  getLocalities:  (cityId: number) => api.get(`/locations/cities/${cityId}/localities`),
  // Admin CRUD
  createCity:     (data: unknown)  => api.post('/locations/cities', data),
  updateCity:     (id: number, data: unknown) => api.patch(`/locations/cities/${id}`, data),
  removeCity:     (id: number)     => api.delete(`/locations/cities/${id}`),
  getAllLocalities: ()              => api.get('/locations/admin/localities'),
  createLocality: (data: unknown)  => api.post('/locations/localities', data),
  updateLocality: (id: number, data: unknown) => api.patch(`/locations/localities/${id}`, data),
  removeLocality: (id: number)     => api.delete(`/locations/localities/${id}`),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll:  (type?: string) => api.get('/categories', { params: { type } }),
  getOne:  (id: number)    => api.get(`/categories/${id}`),
  // Admin CRUD — requires JWT + admin role
  create:  (data: unknown) => api.post('/categories', data),
  update:  (id: number, data: unknown) => api.patch(`/categories/${id}`, data),
  remove:  (id: number)    => api.delete(`/categories/${id}`),
};

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leadsApi = {
  create: (data: unknown) => api.post('/leads', data),
  route: (data: unknown) => api.post('/leads/route', data),
  planBooking: (data: unknown) => api.post('/leads/plan-booking', data),
  getVendorLeads: (vendorId: number, page = 1, limit = 20, status?: string) =>
    api.get(`/leads/vendor/${vendorId}`, { params: { page, limit, status } }),
  getStats: (vendorId: number) => api.get(`/leads/vendor/${vendorId}/stats`),
  markViewed: (leadId: number) => api.patch(`/leads/${leadId}/viewed`),
  updateStatus: (leadId: number, status: string) => api.patch(`/leads/${leadId}/status`, { status }),
};

// ─── Events (public discovery stubs) ─────────────────────────────────────────
export const eventsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/events', { params }),
  getFeatured: (cityId?: number) => api.get('/events/featured', { params: { cityId } }),
  getTrending: (cityId?: number) => api.get('/events/trending', { params: { cityId } }),
  getBySlug: (slug: string) => api.get(`/events/slug/${slug}`),
};

// ─── Vendor Event Posts ────────────────────────────────────────────────────────
export const vendorEventsApi = {
  list:   (vendorId: number, page = 1) => api.get(`/events/vendor/${vendorId}`, { params: { page } }),
  get:    (vendorId: number, id: number) => api.get(`/events/vendor/${vendorId}/${id}`),
  create: (vendorId: number, data: unknown) => api.post(`/events/vendor/${vendorId}`, data),
  update: (vendorId: number, id: number, data: unknown) => api.put(`/events/vendor/${vendorId}/${id}`, data),
  remove: (vendorId: number, id: number) => api.delete(`/events/vendor/${vendorId}/${id}`),
  boost:  (vendorId: number, id: number) => api.post(`/events/vendor/${vendorId}/${id}/boost`),
  // Admin
  adminList:   (status?: string, page = 1) => api.get('/events/admin/list', { params: { status, page } }),
  adminStats:  () => api.get('/events/admin/stats'),
  adminReview: (id: number, data: { action: string; rejectionReason?: string }) =>
    api.patch(`/events/admin/${id}/review`, data),
};

// ─── Tokens ────────────────────────────────────────────────────────────────────
export const tokensApi = {
  getWallet:      (vendorId: number) => api.get(`/tokens/wallet/${vendorId}`),
  getTransactions:(vendorId: number, page = 1) => api.get(`/tokens/transactions/${vendorId}`, { params: { page } }),
  requestTokens:  (vendorId: number, data: { requestedAmount: number; reason?: string }) =>
    api.post(`/tokens/request/${vendorId}`, data),
  getMyRequests:  (vendorId: number) => api.get(`/tokens/requests/${vendorId}`),
  // Admin
  adminWallets:       (page = 1) => api.get('/tokens/admin/wallets', { params: { page } }),
  adminPendingReqs:   (page = 1) => api.get('/tokens/admin/requests/pending', { params: { page } }),
  adminReviewRequest: (id: number, data: { action: string; adminNote?: string }) =>
    api.patch(`/tokens/admin/requests/${id}/review`, data),
  adminGrant:  (data: { vendorId: number; amount: number; note?: string }) => api.post('/tokens/admin/grant', data),
  adminDeduct: (data: { vendorId: number; amount: number; note?: string }) => api.post('/tokens/admin/deduct', data),
};

// ─── Deals ────────────────────────────────────────────────────────────────────
export const dealsApi = {
  list:  (vendorId: number, page = 1) => api.get(`/deals/vendor/${vendorId}`, { params: { page } }),
  stats: (vendorId: number) => api.get(`/deals/vendor/${vendorId}/stats`),
  get:   (vendorId: number, id: number) => api.get(`/deals/vendor/${vendorId}/${id}`),
  create:(vendorId: number, data: unknown) => api.post(`/deals/vendor/${vendorId}`, data),
  update:(vendorId: number, id: number, data: unknown) => api.put(`/deals/vendor/${vendorId}/${id}`, data),
  remove:(vendorId: number, id: number) => api.delete(`/deals/vendor/${vendorId}/${id}`),
  adminList: (page = 1) => api.get('/deals/admin/all', { params: { page } }),
};

// ─── Form Builder ─────────────────────────────────────────────────────────────
export const formBuilderApi = {
  getFields:    (category?: string) => api.get('/form-builder/fields', { params: { category } }),
  adminGetAll:  (page = 1) => api.get('/form-builder/admin/fields', { params: { page } }),
  adminCreate:  (data: unknown) => api.post('/form-builder/admin/fields', data),
  adminUpdate:  (id: number, data: unknown) => api.put(`/form-builder/admin/fields/${id}`, data),
  adminToggle:  (id: number) => api.patch(`/form-builder/admin/fields/${id}/toggle`),
  adminDelete:  (id: number) => api.delete(`/form-builder/admin/fields/${id}`),
  adminSeed:    () => api.post('/form-builder/admin/seed'),
};

// ─── Upload (client-side base64 helper) ──────────────────────────────────────
export const uploadApi = {
  /**
   * Converts a File to a compressed base64 data URL (max 800px, quality 0.75).
   * No backend required — stored directly in event.images[].
   */
  compressToBase64: (file: File, maxPx = 800, quality = 0.75): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement('img');
        img.onload = () => {
          const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width  = img.width  * ratio;
          canvas.height = img.height * ratio;
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }),
};

// ─── Packages (Public + Vendor) ───────────────────────────────────────────────
export const packagesApi = {
  getFeatured:   (cityId?: number, limit?: number) =>
    api.get('/packages/featured', { params: { cityId, limit } }),
  getTrending:   (cityId?: number, limit?: number) =>
    api.get('/packages/trending', { params: { cityId, limit } }),
  search:        (params: Record<string, unknown>) =>
    api.get('/packages/search', { params }),
  getMyPackages: () => api.get('/packages/my'),
  create:        (data: unknown) => api.post('/packages', data),
  update:        (id: number, data: unknown) => api.patch(`/packages/${id}`, data),
  remove:        (id: number) => api.delete(`/packages/${id}`),
  boost:         (id: number) => api.post(`/packages/${id}/boost`),
  setFeatured:   (id: number, featured: boolean) =>
    featured
      ? api.post(`/packages/${id}/feature`, { featured: true })
      : api.delete(`/packages/${id}/feature`),
};

// ─── Vendor Services (JWT required) ──────────────────────────────────────────
export const vendorServicesApi = {
  getAll: () => api.get('/vendor/services'),
  getOne: (id: number) => api.get(`/vendor/services/${id}`),
  create: (data: {
    title: string;
    description?: string;
    categoryId?: number;
    priceUnit?: string;
    minPrice?: number;
    maxPrice?: number;
    duration?: string;
    highlights?: string[];
  }) => api.post('/vendor/services', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/vendor/services/${id}`, data),
  remove: (id: number) => api.delete(`/vendor/services/${id}`),
  reorder: (orderedIds: number[]) =>
    api.patch('/vendor/services/reorder', { orderedIds }),
};

// ─── Vendor Panel (JWT required) ──────────────────────────────────────────────
export const vendorPanelApi = {
  getDashboard:         () => api.get('/vendor/dashboard'),
  getLeads:             (params?: { page?: number; status?: string; packageId?: number; search?: string }) =>
    api.get('/vendor/leads', { params }),
  getLeadStats:         () => api.get('/vendor/leads/stats'),
  updateLeadStatus:     (id: number, status: string, notes?: string) =>
    api.patch(`/vendor/leads/${id}/status`, { status, notes }),
  unlockLead:           (id: number) => api.post(`/vendor/leads/${id}/unlock`),
  getLeadHistory:       (id: number) => api.get(`/vendor/leads/${id}/history`),
  getProfile:           () => api.get('/vendor/profile'),
  updateProfile:        (data: unknown) => api.patch('/vendor/profile', data),
  getWallet:            () => api.get('/vendor/wallet'),
  getTransactions:      (page = 1) => api.get('/vendor/wallet/transactions', { params: { page } }),
  getSubscription:      () => api.get('/vendor/subscription'),
  getNotifications:     (page = 1) => api.get('/vendor/notifications', { params: { page } }),
  markNotifRead:        (id: number) => api.patch(`/vendor/notifications/${id}/read`),
  markAllNotifsRead:    () => api.patch('/vendor/notifications/read-all'),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getMy:     () => api.get('/subscriptions/my'),
  initiate:  (billingCycle: 'monthly' | 'yearly') => api.post('/subscriptions/initiate', { billingCycle }),
  activate:  (data: { vendorId: number; billingCycle: string; paymentId: string; amount: number }) =>
    api.post('/subscriptions/activate', data),
  getHistory: () => api.get('/subscriptions/history'),
};

// ─── SEO (Public) ─────────────────────────────────────────────────────────────
export const seoPublicApi = {
  getPage:       (slug: string) => api.get(`/seo/page/${slug}`),
  getFooterLinks: () => api.get('/seo/footer-links'),
  getSitemap:    () => api.get('/seo/sitemap'),
};

// ─── SEO Admin ────────────────────────────────────────────────────────────────
export const seoAdminApi = {
  // Pages
  listPages:    (page = 1, limit = 20, search?: string, pageType?: string) =>
    api.get('/seo/admin/pages', { params: { page, limit, search, pageType } }),
  getPage:      (id: number) => api.get(`/seo/admin/pages/${id}`),
  createPage:   (data: unknown) => api.post('/seo/admin/pages', data),
  updatePage:   (id: number, data: unknown) => api.put(`/seo/admin/pages/${id}`, data),
  togglePage:   (id: number) => api.patch(`/seo/admin/pages/${id}/toggle`),
  deletePage:   (id: number) => api.delete(`/seo/admin/pages/${id}`),
  // Footer links
  listFooterLinks:   (page = 1) => api.get('/seo/admin/footer-links', { params: { page } }),
  createFooterLink:  (data: unknown) => api.post('/seo/admin/footer-links', data),
  updateFooterLink:  (id: number, data: unknown) => api.put(`/seo/admin/footer-links/${id}`, data),
  deleteFooterLink:  (id: number) => api.delete(`/seo/admin/footer-links/${id}`),
  // Bulk
  seed:          () => api.post('/seo/admin/seed'),
  generate:      () => api.post('/seo/generate'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard:              () => api.get('/admin/dashboard'),
  getSettings:            (group?: string) => api.get('/admin/settings', { params: { group } }),
  updateSetting:          (key: string, value: string) => api.put(`/admin/settings/${key}`, { value }),
  bulkUpdateSettings:     (updates: { key: string; value: string }[]) => api.put('/admin/settings', { updates }),
  getVendors:             (status?: string, page = 1) => api.get('/admin/vendors', { params: { status, page } }),
  approveVendor:          (id: number) => api.patch(`/admin/vendors/${id}/approve`),
  rejectVendor:           (id: number) => api.patch(`/admin/vendors/${id}/reject`),
  suspendVendor:          (id: number) => api.patch(`/admin/vendors/${id}/suspend`),
  toggleFeatured:         (id: number) => api.patch(`/admin/vendors/${id}/featured`),
  updateVendorRank:       (id: number, data: { rankWeight?: number; profileScore?: number; isFeatured?: boolean }) =>
                            api.patch(`/admin/vendors/${id}/rank`, data),
  getLeads: (
    page = 1,
    filters: { status?: string; cityId?: number; categoryId?: number; source?: string } = {},
  ) => api.get('/admin/leads', { params: { page, ...filters } }),
  getLeadAnalytics:       () => api.get('/admin/leads/analytics'),
  getLeadDetail:          (id: number) => api.get(`/admin/leads/${id}`),
  updateLeadStatus:       (id: number, status: string) => api.patch(`/admin/leads/${id}/status`, { status }),
  reassignLead:           (id: number, vendorId: number) => api.patch(`/admin/leads/${id}/reassign`, { vendorId }),
  assignLeadToVendor:     (id: number, vendorId: number) => api.post(`/admin/leads/${id}/assign`, { vendorId }),
  unassignLead:           (id: number) => api.patch(`/admin/leads/${id}/unassign`),
  seedLeads:              () => api.post('/admin/seed-leads'),
  makeAdmin:              (id: number) => api.patch(`/admin/users/${id}/make-admin`),
  seed:                   () => api.post('/admin/seed'),
  getCategories:          (type?: string) => api.get('/admin/categories', { params: { type } }),
  updateCategoryAlloc:    (id: number, data: { eventAllocations: Record<string, number>; budgetAllocationPercent?: number }) =>
                            api.patch(`/admin/categories/${id}/allocations`, data),
};
