import { App, MarkdownPreviewRenderer, Notice, PluginSettingTab, Setting } from 'obsidian';
import ComboPlugin from './main';
import { ButtonProfile } from './models/combo-plugin-settings';

// TODO: Clean up this mess
export default class ComboPluginSettingTab extends PluginSettingTab {

  plugin: ComboPlugin;

  constructor(app: App, plugin: ComboPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Fighting Game Combo Highlighting Settings' });

    this.generateNewGameOptions(containerEl);
    this.plugin.settings.buttonProfiles.forEach((profile) => {
      this.generateGameOptions(containerEl, profile.gameName);
      containerEl.createEl('hr');
    });
  }

  private async generateNewGameOptions(containerEl: HTMLElement): Promise<void> {
    const newGameDiv = containerEl.createDiv();
    new Setting(containerEl)
      .addButton((button) => {
        button
          .setButtonText('Add Game')
          .setClass('add-button')
          .onClick(() => {
            let gameName = '';
            let blockName = '';
            new Setting(newGameDiv)
                .setName('Game Name')
                .addText((text) => {
                text
                  .setPlaceholder('Street Fighter 6')
                  .onChange((value) => {
                    gameName = value;
                  });
              });
            new Setting(newGameDiv)
              .setName('Block Name')
              .setDesc('This will be used as the code block language; make sure to use an unused value')
              .addText((text) => {
                text
                  .setPlaceholder('sf6')
                  .onChange((value) => {
                    blockName = value;
                  });
              });
            new Setting(newGameDiv)
              .addButton((button) => {
                button
                  .setIcon('save')
                  .setClass('add-button')
                  .onClick(async () => {
                    if (!(gameName && blockName)) {
                      new Notice('Must enter game name and block name');
                      return;
                    } else if (this.plugin.settings.buttonProfiles.some((buttonProfile) => buttonProfile.blockName === blockName)) {
                      new Notice('Game must have a unique block name');
                      return;
                    }

                    const buttonProfile: ButtonProfile = {
                      blockName: blockName,
                      gameName: gameName,
                      buttonColors: {},
                      delimeters: '',
                    };
                    this.plugin.settings.buttonProfiles.push(buttonProfile);
                    await this.plugin.saveSettings();
                    this.display();
                  });
              });
          });
      });
  }

  private async generateGameOptions(containerEl: HTMLElement, gameName: string): Promise<void> {
    if (gameName !== 'default') {
      const buttonProfile = this.plugin.settings.buttonProfiles.find((profile) => profile.gameName === gameName);

      if (buttonProfile) {
        this.generateButtonSettings(containerEl, buttonProfile);
        this.generatePrefixesSettings(containerEl, buttonProfile);
        this.generateDelimeterSettings(containerEl, buttonProfile);
      }
    }
  }

  private generateButtonSettings(containerEl: HTMLElement, buttonProfile: ButtonProfile): void {
    containerEl.createEl('h1', { text: `${buttonProfile.gameName} Settings` });
    const buttonDiv = containerEl.createDiv();
    new Setting(buttonDiv).setName(`Delete ${buttonProfile.gameName}`).addButton((button) => {
      button
        .onClick(async () => {
          const profileIndex = this.plugin.settings.buttonProfiles.indexOf(buttonProfile);
          this.plugin.settings.buttonProfiles.splice(profileIndex, 1);
          await this.plugin.saveSettings();
          MarkdownPreviewRenderer.unregisterPostProcessor(this.plugin.postProcessors[buttonProfile.blockName]);
          this.display();
        })
        .setIcon('trash')
        .setClass('caution-button')
    });
    new Setting(buttonDiv)
      .setName('Button Settings')
      .setDesc(`Change button identifiers and colors for ${buttonProfile.gameName}`)

      Object.keys(buttonProfile.buttonColors).forEach((buttonConfig) => {
        const buttonControl = new Setting(buttonDiv);
        buttonControl.addText((text) => text.setValue(buttonConfig).setDisabled(true));

        buttonControl.addColorPicker((colorPicker) => {
          colorPicker.setValue(buttonProfile.buttonColors![buttonConfig])
            .onChange(async (value) => {
              buttonProfile.buttonColors![buttonConfig] = value;
              await this.plugin.saveSettings();
              this.display();
            });
        });

        buttonControl
          .addButton((button) => {
            button
              .setIcon('trash')
              .onClick(async () => {
                delete buttonProfile.buttonColors![buttonConfig];
                await this.plugin.saveSettings();
                this.display();
              });
          });
      });
    let newButtonColor = '#000000';
    let newButton = 'Button';
    new Setting(containerEl.createDiv())
      .addButton((button) => {
        button.onClick(async () => {
          new Setting(buttonDiv)
            .addText((text) => text.setPlaceholder('Button Glyph')
              .onChange((value) => newButton = value)
            )
            .addColorPicker((colorPicker) => colorPicker.setValue('#000000')
              .onChange((value) => newButtonColor = value)
            )
            .addButton((saveButton) => {
              saveButton.onClick(async () => {
                buttonProfile.buttonColors![newButton] = newButtonColor;
                await this.plugin.saveSettings();
                this.display();
              })
              .setIcon('save')
              .setClass('add-button');
            });
        })
        .setButtonText('Add Button')
        .setClass('add-button');
    });
  }

  private generatePrefixesSettings(containerEl: HTMLElement, buttonProfile: ButtonProfile): void {
    const prefixesDiv = containerEl.createDiv();
    new Setting(prefixesDiv)
      .setName('Special Prefix Settings ❔')
      .setDesc(`Change special prefix strings and colors for ${buttonProfile.gameName}`)
      .setTooltip('These strings won\'t appear in a combo, but will color the immediately following token as specified.');

    if (buttonProfile.specialPrefixes) {
      Object.keys(buttonProfile.specialPrefixes).forEach((prefix) => {
        const prefixControl = new Setting(prefixesDiv);
        prefixControl.addText((text) => text.setValue(prefix).setDisabled(true));

        prefixControl.addColorPicker((colorPicker) => {
          colorPicker.setValue(buttonProfile.specialPrefixes![prefix])
            .onChange(async (value) => {
              buttonProfile.specialPrefixes![prefix] = value;
              await this.plugin.saveSettings();
              this.display();
            });
        });

        prefixControl
          .addButton((button) => {
            button
              .setIcon('trash')
              .onClick(async () => {
                delete buttonProfile.specialPrefixes![prefix];
                await this.plugin.saveSettings();
                this.display();
              });
          });
      });
    }
    let newPrefix = 'Special Prefix';
    let newColor = '#000000';
    new Setting(containerEl.createDiv())
      .addButton((button) => {
        button.onClick(async () => {
          new Setting(prefixesDiv)
            .addText((text) => text.setPlaceholder('Special Prefix')
              .onChange((value) => newPrefix = value)
            )
            .addColorPicker((colorPicker) => colorPicker.setValue('#000000')
              .onChange((value) => newColor = value)
            )
            .addButton((saveButton) => {
              saveButton.onClick(async () => {
                buttonProfile.specialPrefixes![newPrefix] = newColor;
                await this.plugin.saveSettings();
                this.display();
              })
              .setIcon('save')
              .setClass('add-button');
            });
        })
        .setButtonText('Add Special Prefix')
        .setClass('add-button');
    });
  }

  private generateDelimeterSettings(containerEl: HTMLElement, buttonProfile: ButtonProfile): void {
    if (buttonProfile.delimeters) {
      const delimetersDiv = containerEl.createDiv();
      new Setting(delimetersDiv)
        .setName('Delimeters ❔')
        .setDesc(`Delimeters for ${buttonProfile.gameName} combos`)
        .setTooltip('These are the symbols that appear between moves of your notation.')
        .addText((text) => {
          text
            .setValue(buttonProfile.delimeters)
            .onChange(async (value) => {
              buttonProfile.delimeters = value;
              await this.plugin.saveSettings();
            });
        });
    }
  }

}