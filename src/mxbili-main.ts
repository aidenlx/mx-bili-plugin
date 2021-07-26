import getPort from "get-port";
import { debounce, Notice, Plugin, Setting } from "obsidian";

import fetchBiliPoster from "./fake-bili/fetch-poster";
import getServer from "./fake-bili/proxy/server";

export default class MxBili extends Plugin {
  settings: MxBiliSettings = DEFAULT_SETTINGS;

  server?: ReturnType<typeof getServer>;

  fetchPoster = fetchBiliPoster;

  setupProxy = (port: number): void => {
    if (this.server) this.server.close().listen(port);
    else {
      this.server = getServer(port);
      this.server.on("error", (err) => {
        if (err.message.includes("EADDRINUSE"))
          new Notice("端口已被占用，请在Media Extended设置中更改端口号");
        else console.error(err);
      });
    }
  };

  /**
   * detect if port being used, and save free port
   * @param port desire port
   * @returns free port
   */
  setupPort = async (port: number): Promise<number> => {
    const newPort = await getPort({ port });
    if (newPort !== port) {
      new Notice(`${port}端口已被占用，切换至${newPort}`);
    }
    if (this.settings.port !== newPort) {
      this.settings.port = newPort;
      await this.saveSettings();
    }
    return newPort;
  };

  async onload() {
    console.log("loading MxBili");

    await this.loadSettings();

    const newPort = await this.setupPort(this.settings.port);
    this.setupProxy(newPort);
  }

  onunload() {
    console.log("unloading MxBili");

    this.server?.close();
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  portSetting = (containerEl: HTMLElement) =>
    new Setting(containerEl)
      .setName("代理端口号")
      .setDesc("若与现有端口冲突请手动指定其他端口")
      .addText((text) => {
        const save = debounce(
          async (value: string) => {
            const newPort = await this.setupPort(+value);
            if (newPort !== +value) text.setValue(newPort.toString());
            this.setupProxy(newPort);
          },
          500,
          true,
        );
        text
          .setValue(this.settings.port.toString())
          .onChange(async (value: string) => {
            text.inputEl.toggleClass("incorrect", !isVaildPort(value));
            if (isVaildPort(value) && this.settings.port !== +value)
              save(value);
          });
      });
}

interface MxBiliSettings {
  port: number;
}

const DEFAULT_SETTINGS: MxBiliSettings = {
  port: 2233,
};

const isVaildPort = (str: string) => {
  const test =
    /^()([1-9]|[1-5]?[0-9]{2,4}|6[1-4][0-9]{3}|65[1-4][0-9]{2}|655[1-2][0-9]|6553[1-5])$/;
  return test.test(str);
};
