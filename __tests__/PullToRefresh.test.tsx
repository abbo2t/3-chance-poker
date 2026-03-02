import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import { PullToRefresh } from "../src/components/PullToRefresh";

function makeTouchEvent(type: string, clientY: number): TouchEvent {
  const touch = { clientY } as Touch;
  return new TouchEvent(type, {
    touches: type === "touchend" ? [] : [touch],
    changedTouches: [touch],
    bubbles: true,
  });
}

describe("PullToRefresh", () => {
  const reloadMock = vi.fn();

  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });
    reloadMock.mockReset();
  });

  it("renders nothing when not pulling", () => {
    const { container } = render(<PullToRefresh />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Pull to refresh" when pulling below threshold', () => {
    render(<PullToRefresh />);

    act(() => {
      document.dispatchEvent(makeTouchEvent("touchstart", 0));
      document.dispatchEvent(makeTouchEvent("touchmove", 40));
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Pull to refresh")).toBeInTheDocument();
  });

  it('shows "Release to refresh" when pulling past the threshold', () => {
    render(<PullToRefresh />);

    act(() => {
      document.dispatchEvent(makeTouchEvent("touchstart", 0));
      document.dispatchEvent(makeTouchEvent("touchmove", 100));
    });

    expect(screen.getByText("Release to refresh")).toBeInTheDocument();
  });

  it("calls window.location.reload when released past the threshold", () => {
    vi.useFakeTimers();
    render(<PullToRefresh />);

    act(() => {
      document.dispatchEvent(makeTouchEvent("touchstart", 0));
      document.dispatchEvent(makeTouchEvent("touchmove", 100));
      document.dispatchEvent(makeTouchEvent("touchend", 100));
    });

    expect(reloadMock).not.toHaveBeenCalled();
    act(() => vi.runAllTimers());
    expect(reloadMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not reload when released before the threshold", () => {
    render(<PullToRefresh />);

    act(() => {
      document.dispatchEvent(makeTouchEvent("touchstart", 0));
      document.dispatchEvent(makeTouchEvent("touchmove", 40));
      document.dispatchEvent(makeTouchEvent("touchend", 40));
    });

    expect(reloadMock).not.toHaveBeenCalled();
  });
});
