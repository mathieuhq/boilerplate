import { describe, expect, it } from "vitest";

import { AggregateRoot } from "../aggregate-root.base";

class TestAggregateRoot extends AggregateRoot<{ id: string; name: string }> {
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: { id: string; name: string }): TestAggregateRoot {
    return new TestAggregateRoot(props);
  }
}

describe("AggregateRoot base", () => {
  describe("constructor", () => {
    it("should create aggregate root with props", () => {
      const aggregate = TestAggregateRoot.create({ id: "1", name: "Test" });
      expect(aggregate.id).toBe("1");
      expect(aggregate.name).toBe("Test");
    });
  });

  describe("inheritance", () => {
    it("should inherit equals method from Entity", () => {
      const aggregate = TestAggregateRoot.create({ id: "1", name: "Test" });
      expect(aggregate.equals(aggregate)).toBe(true);
    });

    it("should return false for different aggregate instances", () => {
      const aggregate1 = TestAggregateRoot.create({ id: "1", name: "Test" });
      const aggregate2 = TestAggregateRoot.create({ id: "1", name: "Test" });
      expect(aggregate1.equals(aggregate2)).toBe(false);
    });
  });
});
