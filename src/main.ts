import { ButtonProfile, ComboPluginSettings } from 'src/models/combo-plugin-settings';
import { MarkdownPostProcessor, MarkdownPreviewRenderer, Plugin } from 'obsidian';
import ComboPluginSettingTab from './settings';

const DEFAULT_SETTINGS: ComboPluginSettings = {
  buttonProfiles: [
    {
      gameName: 'Street Fighter 6',
      blockName: 'sf6',
      buttonColors: {
        'LP': '#7dffff',
        'MP': '#ffff01',
        'HP': '#ff9899',
        'LK': '#7dffff',
        'MK': '#ffff01',
        'HK': '#ff9899',
        'DI': '#2ad35d',
        'DR': '#2ad35d',
      },
      specialPrefixes: {
        'EX:':  '#ee44e0',
        'CMD:': '#ee44e0',
      },
      delimeters: '>,~/',
    },
    {
      gameName: 'Guilty Gear',
      blockName: 'ggear',
      buttonColors: {
        'P': '#d96aca',
        'K': '#1ba6ff',
        'S': '#16df53',
        'H': '#ff0000',
        'D': '#e8982c',
      },
      delimeters: '>,~ ',
    }
  ]
};

export default class ComboPlugin extends Plugin {

  settings: ComboPluginSettings;
  addedNodes: HTMLElement[] = [];
  postProcessors: { [blockName: string]: MarkdownPostProcessor } = {};

  async onload(): Promise<void> {
    await this.loadSettings();

    const settingTab = new ComboPluginSettingTab(this.app, this);
    this.addSettingTab(settingTab);

    for (const profile of this.settings.buttonProfiles) {
      await this.registerButtonProfile(profile);
    }

    this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
  }

  async registerButtonProfiles(): Promise<void> {
    for (const buttonProfile of this.settings.buttonProfiles) {
      const postProcessor = await this.registerButtonProfile(buttonProfile);
      this.postProcessors[buttonProfile.blockName] = postProcessor;
    }
  }

  async registerButtonProfile(buttonProfile: ButtonProfile): Promise<MarkdownPostProcessor> {
    return this.registerMarkdownCodeBlockProcessor(buttonProfile.blockName, (source, el, ctx) => {
      this.processComboText(buttonProfile, source, el.createEl('div'));
      return Promise.resolve();
    });
  }

  processComboText(profile: ButtonProfile, text: string, div: HTMLDivElement): void {
    const delimRegexp = new RegExp(`([ ]{0,}[${profile.delimeters}\n]+[ ]{0,})`);
    const comboParts = text.split(delimRegexp);
    const children: HTMLElement[] = [];

    comboParts.forEach((comboPart) => {
      let foundMatch = false;
      
      if (profile.specialPrefixes && !foundMatch) {
        Object.keys(profile.specialPrefixes).forEach((prefix) => {
          if (comboPart.startsWith(prefix)) {
            const span = createSpan(); 

            if (profile.specialPrefixes) {
              const color = profile.specialPrefixes[prefix];
              span.setText(comboPart.substring(prefix.length));
              if (color && color.length) {
                span.setAttribute('style', `color:${color}`);
              }
            }

            children.push(span);
            foundMatch = true;
          }
        });
      }

      if (!foundMatch) {
        Object.keys(profile.buttonColors).forEach((button) => {
          if (comboPart.contains(button)) {
            const span = createSpan();
            span.setText(comboPart);
            span.setAttribute('style', `color:${profile.buttonColors[button]}`);
            children.push(span);
            foundMatch = true;
          }
        });
      }

      if (!foundMatch && comboPart === '\n') {
        const br = createEl('br');
        children.push(br);
        foundMatch = true;
      }

      if (!foundMatch) {
        const span = createSpan();
        span.setText(comboPart);
        children.push(span);
        foundMatch = true;
      }
    });

    for (let i = 0; i < children.length; i++) {
      if (children[i]) {
        div.append(children[i]);
      }
    }
    this.addedNodes.push(...children);
  }

  onunload(): void {
    if (this.postProcessors) {
      const postProcessorKeys = Object.keys(this.postProcessors);
      if (postProcessorKeys && postProcessorKeys.length) {
        postProcessorKeys.forEach((key) => MarkdownPreviewRenderer.unregisterPostProcessor(this.postProcessors[key]));
      }
      if (this.addedNodes && this.addedNodes.length) {
        this.addedNodes.forEach((node) => node.remove());
      }
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

}
