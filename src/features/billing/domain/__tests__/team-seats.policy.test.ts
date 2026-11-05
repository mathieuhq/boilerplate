import { describe, expect, it } from "vitest";

import { getBillableSeats, getSeatItemChange } from "../team-seats.policy";

describe("team seats policy", () => {
  it("bills every member except the owner on the Team plan", () => {
    expect(getBillableSeats("team", 3)).toBe(2);
    expect(getBillableSeats("team", 1)).toBe(0);
    expect(getBillableSeats("team", 0)).toBe(0);
  });

  it("bills no seats on other plans", () => {
    expect(getBillableSeats("pro", 3)).toBe(0);
  });

  it("adds, updates, removes or keeps the seat item", () => {
    const seatPriceId = "price_seat";
    const item = { id: "si_1", quantity: 2 };

    expect(getSeatItemChange({ seatPriceId, seats: 2 })).toEqual({
      price: seatPriceId,
      quantity: 2,
    });
    expect(getSeatItemChange({ seatPriceId, seats: 3, item })).toEqual({
      id: "si_1",
      quantity: 3,
    });
    expect(getSeatItemChange({ seatPriceId, seats: 0, item })).toEqual({
      id: "si_1",
      deleted: true,
    });
    expect(getSeatItemChange({ seatPriceId, seats: 2, item })).toBeNull();
    expect(getSeatItemChange({ seatPriceId, seats: 0 })).toBeNull();
  });
});
