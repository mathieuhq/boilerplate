import { strToU8, type Zippable, zipSync } from "fflate";

import type {
  ArchiveFile,
  IArchivePort,
} from "../../application/ports/archive.port";

export class FflateArchiveAdapter implements IArchivePort {
  async create(files: ArchiveFile[]): Promise<Uint8Array> {
    const entries: Zippable = Object.fromEntries(
      files.map((file) => [
        file.path,
        typeof file.content === "string" ? strToU8(file.content) : file.content,
      ]),
    );

    return zipSync(entries, { level: 6 });
  }
}
