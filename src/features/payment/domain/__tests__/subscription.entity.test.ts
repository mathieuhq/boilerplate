import { describe, expect, it } from "vitest";

import { Subscription } from "../entities/subscription.entity";

describe("Subscription Entity", () => {
  describe("create", () => {
    it("should create a subscription with required properties", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "active",
      });
      expect(subscription.id).toBe("sub-123");
      expect(subscription.plan).toBe("pro");
      expect(subscription.status).toBe("active");
    });

    it("should create a subscription with all properties", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "enterprise",
        status: "active",
        seats: 10,
        annual: true,
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2025-01-01"),
        cancelAtPeriodEnd: false,
      });
      expect(subscription.seats).toBe(10);
      expect(subscription.annual).toBe(true);
      expect(subscription.periodStart).toEqual(new Date("2024-01-01"));
      expect(subscription.periodEnd).toEqual(new Date("2025-01-01"));
      expect(subscription.cancelAtPeriodEnd).toBe(false);
    });
  });

  describe("isActive", () => {
    it("should return true when status is active", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "active",
      });
      expect(subscription.isActive).toBe(true);
    });

    it("should return false when status is not active", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "canceled",
      });
      expect(subscription.isActive).toBe(false);
    });

    it("should return false when status is past_due", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "past_due",
      });
      expect(subscription.isActive).toBe(false);
    });

    it("should return false when status is trialing", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "trialing",
      });
      expect(subscription.isActive).toBe(false);
    });
  });

  describe("isCanceled", () => {
    it("should return true when status is canceled", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "canceled",
      });
      expect(subscription.isCanceled).toBe(true);
    });

    it("should return false when status is not canceled", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "active",
      });
      expect(subscription.isCanceled).toBe(false);
    });

    it("should return false when status is past_due", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "past_due",
      });
      expect(subscription.isCanceled).toBe(false);
    });
  });

  describe("optional properties", () => {
    it("should return undefined for optional properties when not set", () => {
      const subscription = Subscription.create({
        id: "sub-123",
        plan: "pro",
        status: "active",
      });
      expect(subscription.seats).toBeUndefined();
      expect(subscription.annual).toBeUndefined();
      expect(subscription.periodStart).toBeUndefined();
      expect(subscription.periodEnd).toBeUndefined();
      expect(subscription.cancelAtPeriodEnd).toBeUndefined();
    });
  });
});
