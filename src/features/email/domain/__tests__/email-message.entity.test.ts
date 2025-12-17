import { describe, expect, it } from "vitest";

import {
  EmailMessage,
  type EmailMessageProps,
} from "../entities/email-message.entity";

class TestEmailMessage extends EmailMessage {
  static create(props: EmailMessageProps): TestEmailMessage {
    return new TestEmailMessage(props);
  }
}

describe("EmailMessage entity", () => {
  const baseProps: EmailMessageProps = {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Test Subject",
    html: "<p>Test content</p>",
  };

  describe("required properties", () => {
    it("should return to property", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.to).toBe("recipient@example.com");
    });

    it("should return from property", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.from).toBe("sender@example.com");
    });

    it("should return subject property", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.subject).toBe("Test Subject");
    });

    it("should return html property", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.html).toBe("<p>Test content</p>");
    });
  });

  describe("optional properties", () => {
    it("should return undefined for text when not set", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.text).toBeUndefined();
    });

    it("should return text when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        text: "Plain text content",
      });
      expect(message.text).toBe("Plain text content");
    });

    it("should return undefined for replyTo when not set", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.replyTo).toBeUndefined();
    });

    it("should return replyTo when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        replyTo: "reply@example.com",
      });
      expect(message.replyTo).toBe("reply@example.com");
    });

    it("should return undefined for cc when not set", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.cc).toBeUndefined();
    });

    it("should return cc as string when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        cc: "cc@example.com",
      });
      expect(message.cc).toBe("cc@example.com");
    });

    it("should return cc as array when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        cc: ["cc1@example.com", "cc2@example.com"],
      });
      expect(message.cc).toEqual(["cc1@example.com", "cc2@example.com"]);
    });

    it("should return undefined for bcc when not set", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.bcc).toBeUndefined();
    });

    it("should return bcc as string when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        bcc: "bcc@example.com",
      });
      expect(message.bcc).toBe("bcc@example.com");
    });

    it("should return bcc as array when set", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      });
      expect(message.bcc).toEqual(["bcc1@example.com", "bcc2@example.com"]);
    });

    it("should return undefined for attachments when not set", () => {
      const message = TestEmailMessage.create(baseProps);
      expect(message.attachments).toBeUndefined();
    });

    it("should return attachments when set", () => {
      const attachments = [
        { filename: "file.pdf", path: "/path/to/file.pdf" },
        { filename: "image.png", content: "base64content" },
      ];
      const message = TestEmailMessage.create({
        ...baseProps,
        attachments,
      });
      expect(message.attachments).toEqual(attachments);
    });
  });

  describe("to property variations", () => {
    it("should handle to as array", () => {
      const message = TestEmailMessage.create({
        ...baseProps,
        to: ["recipient1@example.com", "recipient2@example.com"],
      });
      expect(message.to).toEqual([
        "recipient1@example.com",
        "recipient2@example.com",
      ]);
    });
  });
});
