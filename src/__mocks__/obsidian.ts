// Minimal Obsidian mock for unit tests.
// Only the shapes used by scoring.ts, prompt.ts, and provider.ts are needed.

export class TFile {
  name: string = ''
  path: string = ''
  extension: string = 'md'
  basename: string = ''
  stat = { mtime: 0, ctime: 0, size: 0 }
  vault: unknown = null
  parent: unknown = null
}

export class TFolder {
  name: string = ''
  path: string = ''
  children: unknown[] = []
  isRoot() { return false }
}

export class Vault {
  getAbstractFileByPath(_path: string) { return null }
  getMarkdownFiles(): TFile[] { return [] }
  async cachedRead(_file: TFile) { return '' }
  async read(_file: TFile) { return '' }
}

export class App {
  vault = new Vault()
}

export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
export class Modal {}
export class ItemView {}
export class Notice {}
export class WorkspaceLeaf {}
