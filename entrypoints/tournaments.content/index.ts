import "~/assets/tailwind.css";
import { createApp } from "vue";

import LocalTournamentsButton from "./LocalTournamentsButton.vue";
import LocalTournaments from "./LocalTournaments.vue";

import type { IConfig } from "@/utils/storage";

import { waitForElementWithTextContent } from "@/utils";
import { AutodartsToolsConfig, AutodartsToolsUrlStatus } from "@/utils/storage";
import { isSafari, isiOS } from "@/utils/helpers";

let localTournamentsButtonUI: any;
let localTournamentsUI: any;

const tools = {
  localTournamentsButton: null as any,
  localTournaments: null as any,
};

export default defineContentScript({
  matches: [ "*://play.autodarts.io/*" ],
  cssInjectionMode: "ui",
  async main(ctx: any) {
    AutodartsToolsUrlStatus.watch(async (url: string) => {
      if (!url && (isiOS() || isSafari())) url = window.location.href;

      const config: IConfig = await AutodartsToolsConfig.getValue();
      if (url.endsWith("/tournaments")) {
        console.log("Autodarts Tools: Tournaments Ready");
        if (true) { // TODO: Add local tournaments config
          await initLocalTournamentsButton(ctx).catch(console.error);
          await initLocalTournaments(ctx).catch(console.error);
        }
      } else {
        tools.localTournamentsButton?.remove();
        tools.localTournaments?.remove();
      }
    });
  },
});

async function initScript(fn: any, url: string) {
  if (window.location.href !== url) return;
  await fn();
}

async function initLocalTournamentsButton(ctx: any) {
  const headlineEl = await waitForElementWithTextContent("h2", "Tournaments");
  if (!headlineEl) return;

  localTournamentsButtonUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-local-tournaments-button",
    position: "inline",
    anchor: headlineEl.parentElement?.parentElement,
    onMount: (container: any) => {
      const app = createApp(LocalTournamentsButton);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      app?.unmount();
    },
  });
  localTournamentsButtonUI.mount();
}

async function initLocalTournaments(ctx: any) {
  await waitForElement("autodarts-tools-local-tournaments-button");
  const headlineEl = await waitForElementWithTextContent("h2", "Tournaments");
  if (!headlineEl) return;

  const pageContainer = headlineEl.parentElement?.parentElement?.parentElement;
  if (!pageContainer) return;

  pageContainer.setAttribute("id", "adt-tournaments-container");

  localTournamentsUI = await createShadowRootUi(ctx, {
    name: "autodarts-tools-local-tournaments",
    position: "inline",
    anchor: pageContainer,
    onMount: (container: any) => {
      const app = createApp(LocalTournaments);
      app.mount(container);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        container.classList.add("dark");
      }
      return app;
    },
    onRemove: (app: any) => {
      app?.unmount();
    },
  });
  localTournamentsUI.mount();
}
