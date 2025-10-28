import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function Hello() {
  return <h1>Hello World!</h1>;
}

test("renders hello message", () => {
  render(<Hello />);
  expect(screen.getByText("Hello World!")).toBeInTheDocument(); // ❌ will fail first
});
