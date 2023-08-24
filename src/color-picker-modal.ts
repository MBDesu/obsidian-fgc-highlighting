import { App, Modal } from 'obsidian';
import ComboPlugin from './main';
import { ComboPluginSettings } from './models/combo-plugin-settings';

export default class ColorPickerModal extends Modal {
  plugin: ComboPlugin;
  settings: ComboPluginSettings;

  constructor(app: App, plugin: ComboPlugin, settings: ComboPluginSettings) {
    super(app);
    this.plugin = plugin;
    this.settings = settings;
  }

}