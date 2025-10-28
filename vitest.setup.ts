import "@testing-library/jest-dom";
import { server } from "./src/mocks/server";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver as any;


process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test (important for test isolation)
//afterEach(() => server.resetHandlers());

// Stop the server after all tests
afterAll(() => server.close());
