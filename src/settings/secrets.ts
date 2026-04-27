import { Plugin } from "obsidian";

interface KeyStore {
  [provider: string]: string;
}

/**
 * SecretsManager stores API keys using the plugin's own loadData/saveData.
 * Keys live in data.json under the "_keys" field.
 *
 * This is the same pattern used by Obsidian Copilot, Smart Connections, and
 * other major AI plugins — app.secretStorage is an undocumented internal API
 * whose method signatures vary across Obsidian versions and cannot be relied on.
 *
 * If you want extra OS-level protection, exclude the vault's .obsidian folder
 * from cloud sync (e.g. add it to .gitignore).
 */
export class SecretsManager {
  private keys: KeyStore = {};

  constructor(private plugin: Plugin) {}

  /** Call once at plugin load, before any getApiKey calls. */
  async load(): Promise<void> {
    const saved = (await this.plugin.loadData()) ?? {};
    this.keys = (saved["_keys"] as KeyStore) ?? {};
  }

  async getApiKey(provider: string): Promise<string> {
    return this.keys[provider] ?? "";
  }

  async setApiKey(provider: string, key: string): Promise<void> {
    this.keys[provider] = key;
    await this.persist();
  }

  async clearApiKey(provider: string): Promise<void> {
    delete this.keys[provider];
    await this.persist();
  }

  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return key.trim().length > 0;
  }

  private async persist(): Promise<void> {
    const existing = (await this.plugin.loadData()) ?? {};
    existing["_keys"] = this.keys;
    await this.plugin.saveData(existing);
  }
}
