// sw.js
const CACHE_NAME = 'cantine-app-v4'; // Change this on app update to trigger the 'activate' event
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/utils/pdfGenerator.ts',
  // Components
  '/components/Button.tsx',
  '/components/DeactivatedScreen.tsx',
  '/components/ForcedPasswordChangeScreen.tsx',
  '/components/Header.tsx',
  '/components/Icons.tsx',
  '/components/LockScreen.tsx',
  '/components/PasswordConfirmModal.tsx',
  '/components/QRScanner.tsx',
  '/components/Sidebar.tsx',
  '/components/SplashScreen.tsx',
  '/components/Toast.tsx',
  // Context
  '/context/AppContext.tsx',
  '/context/ToastContext.tsx',
  '/context/seedData.ts',
  // Pages
  '/pages/AProposPage.tsx',
  '/pages/AssistantPage.tsx',
  '/pages/BilanEcoleLegacyPage.tsx',
  '/pages/BilanEcolePage.tsx',
  '/pages/BilanVivresPage.tsx',
  '/pages/CFCBilanPage.tsx',
  '/pages/Dashboard.tsx',
  '/pages/DonsPage.tsx',
  '/pages/FichePrevisionPage.tsx',
  '/pages/FournisseursPage.tsx',
  '/pages/HistoriquePage.tsx',
  '/pages/Information.tsx',
  '/pages/JoursPreparationPage.tsx',
  '/pages/ListePage.tsx',
  '/pages/MenusPage.tsx',
  '/pages/ParametresPage.tsx',
  '/pages/PlaceholderPage.tsx',
  '/pages/RapportMiParcoursPage.tsx',
  '/pages/RapportsPage.tsx',
  '/pages/SanteHygienePage.tsx',
  '/pages/VerificationRapportPage.tsx',
  // Dashboard Components
  '/pages/dashboard/utils.ts',
  '/pages/dashboard/EventModal.tsx',
  '/pages/dashboard/CustomCalendar.tsx',
  '/pages/dashboard/AlertsWidget.tsx',
  '/pages/dashboard/StatCard.tsx',
  '/pages/dashboard/DefaultDashboardContent.tsx',
  '/pages/dashboard/ResteJoursTable.tsx',
  '/pages/dashboard/ResteDenreesTable.tsx',
  '/pages/dashboard/DepensesTable.tsx',
  '/pages/dashboard/ActivitesTable.tsx',
  // Information Components
  '/pages/information/utils.ts',
  '/pages/information/IEPPForm.tsx',
  '/pages/information/EcolesTable.tsx',
  '/pages/information/DenreesTable.tsx',
  '/pages/information/StaffTable.tsx',
  '/pages/information/ClassEnrollmentTable.tsx',
  '/pages/information/HistoricalEnrollmentTable.tsx',
  '/pages/information/SaisieAssiduiteTable.tsx',
  '/pages/information/CepeResultsTable.tsx',
  '/pages/information/CesacTable.tsx',
  '/pages/information/InfrastructuresTable.tsx',
  '/pages/information/DenreesEcoleTable.tsx',
  // Liste Components
  '/pages/liste/PlanActionBudgetiseReport.tsx',
  '/pages/liste/RapportDistributionReport.tsx',
  '/pages/liste/RapportMensuel.tsx',
  // Main CDN dependency
  'https://cdn.tailwindcss.com',
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Intercept fetch requests and serve from cache if available
self.addEventListener('fetch', event => {
  // We only want to cache GET requests for http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                if (event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});