export type MigrationDefinition = {
  key: string;
  description: string;
  run: () => Promise<void>;
};
