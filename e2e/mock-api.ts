// Mock API for E2E tests - Provides deterministic test data and network error simulation
import { Page, Route } from '@playwright/test';

// Mock data constants for deterministic tests
export const MOCK_DATA = {
  users: [
    {
      id: 'user_admin_001',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'user_member_001',
      email: 'member@test.com',
      name: 'Test Member',
      role: 'MEMBER',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],

  beneficiaries: [
    {
      id: 'beneficiary_001',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '5551234567',
      email: 'ahmet@example.com',
      identityNumber: '12345678901',
      address: 'Test Address 1',
      status: 'ACTIVE',
      notes: 'Test beneficiary notes',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'beneficiary_002',
      firstName: 'Fatma',
      lastName: 'Kaya',
      phone: '5557654321',
      email: 'fatma@example.com',
      identityNumber: '98765432109',
      address: 'Test Address 2',
      status: 'ACTIVE',
      notes: 'Another test beneficiary',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],

  donations: [
    {
      id: 'donation_001',
      amount: 100,
      donorName: 'Test Donor',
      description: 'Test donation',
      status: 'COMPLETED',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],

  tasks: [
    {
      id: 'task_001',
      title: 'Test Task',
      description: 'Test task description',
      status: 'PENDING',
      assigneeId: 'user_member_001',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

// Mock authentication responses
export const MOCK_AUTH = {
  valid: {
    success: true,
    user: MOCK_DATA.users[0],
    token: 'mock_jwt_token_12345',
  },
  invalid: {
    success: false,
    error: 'Geçersiz email veya şifre',
  },
  csrf: {
    token: 'mock_csrf_token_12345',
  },
};

// Mock API response patterns
export class MockAPIHandler {
  private page: Page;
  private networkErrors: boolean = false;
  private slowNetwork: boolean = false;

  constructor(page: Page) {
    this.page = page;
  }

  // Enable network error simulation
  enableNetworkErrors(): void {
    this.networkErrors = true;
  }

  // Enable slow network simulation
  enableSlowNetwork(): void {
    this.slowNetwork = true;
  }

  // Disable all network simulation
  disableSimulation(): void {
    this.networkErrors = false;
    this.slowNetwork = false;
  }

  // Setup mock routes for the page
  setupMockRoutes(): void {
    // Mock authentication routes
    this.page.route('/api/csrf', async (route) => {
      await this.handleCSRF(route);
    });

    this.page.route('/api/auth/login', async (route) => {
      await this.handleLogin(route);
    });

    this.page.route('/api/auth/logout', async (route) => {
      await this.handleLogout(route);
    });

    this.page.route('/api/auth/me', async (route) => {
      await this.handleMe(route);
    });

    // Mock user management routes
    this.page.route('/api/users', async (route) => {
      await this.handleUsers(route);
    });

    this.page.route('/api/users/*', async (route) => {
      await this.handleUserById(route);
    });

    // Mock beneficiary routes
    this.page.route('/api/beneficiaries', async (route) => {
      await this.handleBeneficiaries(route);
    });

    this.page.route('/api/beneficiaries/*', async (route) => {
      await this.handleBeneficiaryById(route);
    });

    // Mock donation routes
    this.page.route('/api/donations', async (route) => {
      await this.handleDonations(route);
    });

    // Mock task routes
    this.page.route('/api/tasks', async (route) => {
      await this.handleTasks(route);
    });
  }

  // Individual route handlers
  private async handleCSRF(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AUTH.csrf),
    });
  }

  private async handleLogin(route: Route): Promise<void> {
    await this.simulateDelay();

    const request = route.request();
    const postData = request.postDataJSON();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    // Mock successful login
    if (postData.email === 'admin@test.com' && postData.password === 'admin123') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH.valid),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH.invalid),
      });
    }
  }

  private async handleLogout(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  }

  private async handleMe(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AUTH.valid.user),
    });
  }

  private async handleUsers(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_DATA.users, total: MOCK_DATA.users.length }),
      });
    } else if (method === 'POST') {
      // Mock user creation
      const newUser = {
        id: `user_${Date.now()}`,
        ...route.request().postDataJSON(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newUser),
      });
    }
  }

  private async handleUserById(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const url = route.request().url();
    const userId = url.split('/').pop();
    const user = MOCK_DATA.users.find((u) => u.id === userId);

    if (user) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'User not found' }),
      });
    }
  }

  private async handleBeneficiaries(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_DATA.beneficiaries,
          total: MOCK_DATA.beneficiaries.length,
        }),
      });
    } else if (method === 'POST') {
      // Mock beneficiary creation
      const newBeneficiary = {
        id: `beneficiary_${Date.now()}`,
        ...route.request().postDataJSON(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newBeneficiary),
      });
    }
  }

  private async handleBeneficiaryById(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const url = route.request().url();
    const beneficiaryId = url.split('/').pop();
    const beneficiary = MOCK_DATA.beneficiaries.find((b) => b.id === beneficiaryId);

    if (beneficiary) {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(beneficiary),
        });
      } else if (method === 'PUT') {
        // Mock update
        const updatedBeneficiary = {
          ...beneficiary,
          ...route.request().postDataJSON(),
          updatedAt: new Date().toISOString(),
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedBeneficiary),
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Beneficiary not found' }),
      });
    }
  }

  private async handleDonations(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_DATA.donations, total: MOCK_DATA.donations.length }),
      });
    }
  }

  private async handleTasks(route: Route): Promise<void> {
    await this.simulateDelay();

    if (this.networkErrors) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network Error' }),
      });
      return;
    }

    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: MOCK_DATA.tasks, total: MOCK_DATA.tasks.length }),
      });
    }
  }

  // Utility method to simulate network delay
  private async simulateDelay(): Promise<void> {
    if (this.slowNetwork) {
      await this.page.waitForTimeout(2000); // 2 second delay for slow network
    } else {
      await this.page.waitForTimeout(100); // Minimal delay
    }
  }
}

// Helper function to setup mock API for a test
export function setupMockAPI(
  page: Page,
  options: {
    enableNetworkErrors?: boolean;
    enableSlowNetwork?: boolean;
  } = {}
): MockAPIHandler {
  const handler = new MockAPIHandler(page);

  if (options.enableNetworkErrors) {
    handler.enableNetworkErrors();
  }

  if (options.enableSlowNetwork) {
    handler.enableSlowNetwork();
  }

  handler.setupMockRoutes();
  return handler;
}

// Helper function to cleanup mock API
export function cleanupMockAPI(page: Page): void {
  page.unroute('/api/csrf');
  page.unroute('/api/auth/login');
  page.unroute('/api/auth/logout');
  page.unroute('/api/auth/me');
  page.unroute('/api/users');
  page.unroute('/api/users/*');
  page.unroute('/api/beneficiaries');
  page.unroute('/api/beneficiaries/*');
  page.unroute('/api/donations');
  page.unroute('/api/tasks');
}
