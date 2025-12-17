import { describe, expect, it } from "vitest";

import { Entity } from "../entity.base";

class TestEntity extends Entity<{ id: string; value: number }> {
  get id(): string {
    return this.props.id;
  }

  get value(): number {
    return this.props.value;
  }

  static create(props: { id: string; value: number }): TestEntity {
    return new TestEntity(props);
  }
}

describe("Entity base", () => {
  describe("constructor", () => {
    it("should create entity with props", () => {
      const entity = TestEntity.create({ id: "1", value: 42 });
      expect(entity.id).toBe("1");
      expect(entity.value).toBe(42);
    });
  });

  describe("equals", () => {
    it("should return true when comparing same instance", () => {
      const entity = TestEntity.create({ id: "1", value: 42 });
      expect(entity.equals(entity)).toBe(true);
    });

    it("should return false when comparing different instances", () => {
      const entity1 = TestEntity.create({ id: "1", value: 42 });
      const entity2 = TestEntity.create({ id: "1", value: 42 });
      expect(entity1.equals(entity2)).toBe(false);
    });

    it("should return false when comparing entities with different values", () => {
      const entity1 = TestEntity.create({ id: "1", value: 42 });
      const entity2 = TestEntity.create({ id: "2", value: 100 });
      expect(entity1.equals(entity2)).toBe(false);
    });
  });
});
