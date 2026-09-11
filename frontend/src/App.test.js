import { API_URL } from "./config/api";

test("provides a normalized API base URL", () => {
  expect(API_URL).toMatch(/^https?:\/\//);
});
