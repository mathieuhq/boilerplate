type SeatItem = {
  id: string;
  quantity?: number | null;
};

type SeatItemChange =
  | { price: string; quantity: number }
  | { id: string; quantity: number }
  | { id: string; deleted: true };

export function getBillableSeats(plan: string, memberCount: number) {
  if (plan !== "team") return 0;

  return Math.max(memberCount - 1, 0);
}

export function getSeatItemChange(input: {
  seatPriceId: string;
  seats: number;
  item?: SeatItem;
}): SeatItemChange | null {
  if ((input.item?.quantity ?? 0) === input.seats) return null;

  if (!input.item) return { price: input.seatPriceId, quantity: input.seats };

  if (input.seats === 0) return { id: input.item.id, deleted: true };

  return { id: input.item.id, quantity: input.seats };
}
