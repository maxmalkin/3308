import "@testing-library/jest-dom";

afterEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
  jest.restoreAllMocks();
});
