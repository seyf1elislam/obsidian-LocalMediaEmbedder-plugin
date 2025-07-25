import { PluginSettingTab, Setting } from "obsidian";
import EmbedMediaPlugin from "main";

export interface LocalMediaPluginSettings {
	port: number;
	baselink: string;
	showInMenuItem: boolean;
	defaultWidth: number;
	defaultHeight: number;
	enableCaching: boolean;
}

export const DEFAULT_SETTINGS: LocalMediaPluginSettings = {
	port: 5555,
	baselink: "http://127.0.0.1",
	showInMenuItem: true,
	defaultWidth: 640,
	defaultHeight: 360,
	enableCaching: true,
};

// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = NonNullable<
	{ [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj]
>;

export class MyPluginSettingsTab extends PluginSettingTab {
	constructor(public plugin: EmbedMediaPlugin) {
		//@ts-ignore
		super(plugin.app, plugin);
	}

	addHeading(heading: string) {
		return new Setting(this.containerEl).setName(heading).setHeading();
	}

	addTextSetting(settingName: KeysOfType<LocalMediaPluginSettings, string>) {
		return new Setting(this.containerEl).addText((text) => {
			text.setValue(this.plugin.settings[settingName])
				.setPlaceholder(DEFAULT_SETTINGS[settingName])
				.onChange(async (value) => {
					// @ts-ignore
					this.plugin.settings[settingName] = value;
					await this.plugin.saveSettings();
				});
		});
	}

	addNumberSetting(
		settingName: KeysOfType<LocalMediaPluginSettings, number>
	) {
		return new Setting(this.containerEl).addText((text) => {
			text.setValue("" + this.plugin.settings[settingName])
				.setPlaceholder("" + DEFAULT_SETTINGS[settingName])
				.then((text) => (text.inputEl.type = "number"))
				.onChange(async (value) => {
					// @ts-ignore
					this.plugin.settings[settingName] =
						value === "" ? DEFAULT_SETTINGS[settingName] : +value;
					await this.plugin.saveSettings();
				});
		});
	}

	addToggleSetting(
		settingName: KeysOfType<LocalMediaPluginSettings, boolean>,
		extraOnChange?: (value: boolean) => void
	) {
		return new Setting(this.containerEl).addToggle((toggle) => {
			toggle
				.setValue(this.plugin.settings[settingName])
				.onChange(async (value) => {
					// @ts-ignore
					this.plugin.settings[settingName] = value;
					await this.plugin.saveSettings();
					extraOnChange?.(value);
				});
		});
	}

	addDropdowenSetting(
		settingName: KeysOfType<LocalMediaPluginSettings, string>,
		options: readonly string[],
		display?: (option: string) => string,
		extraOnChange?: (value: string) => void
	) {
		return new Setting(this.containerEl).addDropdown((dropdown) => {
			const displayNames = new Set<string>();
			for (const option of options) {
				const displayName = display?.(option) ?? option;
				if (!displayNames.has(displayName)) {
					dropdown.addOption(option, displayName);
					displayNames.add(displayName);
				}
			}
			dropdown
				.setValue(this.plugin.settings[settingName])
				.onChange(async (value) => {
					// @ts-ignore
					this.plugin.settings[settingName] = value;
					await this.plugin.saveSettings();
					extraOnChange?.(value);
				});
		});
	}

	addSliderSetting(
		settingName: KeysOfType<LocalMediaPluginSettings, number>,
		min: number,
		max: number,
		step: number
	) {
		return new Setting(this.containerEl).addSlider((slider) => {
			slider
				.setLimits(min, max, step)
				.setValue(this.plugin.settings[settingName])
				.setDynamicTooltip()
				.onChange(async (value) => {
					// @ts-ignore
					this.plugin.settings[settingName] = value;
					await this.plugin.saveSettings();
				});
		});
	}

	display(): void {
		this.containerEl.empty();
		
		this.addHeading("Server Configuration");
		
		this.addNumberSetting("port")
			.setName("Server Port")
			.setDesc("Port number for the local media server (1024-65535). Restart required after changing.");
		
		this.addTextSetting("baselink")
			.setName("Base URL")
			.setDesc("Base URL for the local server. Usually should remain as localhost/127.0.0.1 for security.");

		this.addHeading("User Interface");
		
		this.addToggleSetting("showInMenuItem")
			.setName("Show in Context Menu")
			.setDesc("Show 'Embed selected media path' option in the editor context menu when text is selected.");

		this.addHeading("Default Media Settings");
		
		this.addNumberSetting("defaultWidth")
			.setName("Default Width")
			.setDesc("Default width in pixels for embedded media when not specified in the code block.");
		
		this.addNumberSetting("defaultHeight")
			.setName("Default Height")  
			.setDesc("Default height in pixels for embedded media when not specified in the code block.");

		this.addHeading("Performance");
		
		this.addToggleSetting("enableCaching")
			.setName("Enable Caching")
			.setDesc("Enable HTTP caching headers for better performance. Media files will be cached for 1 hour.");
	}
}
