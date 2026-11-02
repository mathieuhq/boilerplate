export type ArchiveFile = {
  path: string;
  content: string | Uint8Array;
};

export type IArchivePort = {
  create: (files: ArchiveFile[]) => Promise<Uint8Array>;
};
