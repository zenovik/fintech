import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'repository',
    loadComponent: () => import('./pages/repository-explorer/repository-explorer.page').then((m) => m.RepositoryExplorerPage),
  },
  {
    path: 'architecture',
    loadComponent: () => import('./pages/architecture-explorer/architecture-explorer.page').then((m) => m.ArchitectureExplorerPage),
  },
  {
    path: 'database',
    loadComponent: () => import('./pages/database-explorer/database-explorer.page').then((m) => m.DatabaseExplorerPage),
  },
  {
    path: 'api',
    loadComponent: () => import('./pages/api-explorer/api-explorer.page').then((m) => m.ApiExplorerPage),
  },
  {
    path: 'frontend',
    loadComponent: () => import('./pages/frontend-explorer/frontend-explorer.page').then((m) => m.FrontendExplorerPage),
  },
  {
    path: 'backend',
    loadComponent: () => import('./pages/backend-explorer/backend-explorer.page').then((m) => m.BackendExplorerPage),
  },
  {
    path: 'workers',
    loadComponent: () => import('./pages/workers-explorer/workers-explorer.page').then((m) => m.WorkersExplorerPage),
  },
  {
    path: 'security',
    loadComponent: () => import('./pages/security-explorer/security-explorer.page').then((m) => m.SecurityExplorerPage),
  },
  {
    path: 'traceability',
    loadComponent: () => import('./pages/traceability-explorer/traceability-explorer.page').then((m) => m.TraceabilityExplorerPage),
  },
  {
    path: 'knowledge-graph',
    loadComponent: () => import('./pages/knowledge-graph/knowledge-graph.page').then((m) => m.KnowledgeGraphPage),
  },
  {
    path: 'dependency-graph',
    loadComponent: () => import('./pages/dependency-graph/dependency-graph.page').then((m) => m.DependencyGraphPage),
  },
  {
    path: 'impact',
    loadComponent: () => import('./pages/impact-analysis/impact-analysis.page').then((m) => m.ImpactAnalysisPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'documentation',
    loadComponent: () => import('./pages/documentation/documentation.page').then((m) => m.DocumentationPage),
  },
  {
    path: 'metrics',
    loadComponent: () => import('./pages/metrics/metrics.page').then((m) => m.MetricsPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: '' },
];
