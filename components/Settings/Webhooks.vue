<template>
  <div
    v-if="config"
    class="adt-container transition-transform hover:-translate-y-0.5"
  >
    <div class="relative z-10 flex h-full flex-col justify-between space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="mb-1 font-bold uppercase">
            Webhooks
          </h3>
          <p class="max-w-[18rem] text-sm text-white/70">
            Send game information to an external endpoint. Choose whether you want to receive match details
            or each individual throw.
          </p>
        </div>
        <div class="flex">
          <div @click="$emit('toggle', 'webhooks')" class="absolute inset-y-0 left-12 right-0 cursor-pointer" />
          <AppToggle
            @update:model-value="toggleFeature"
            v-model="config.webhooks.enabled"
          />
        </div>
      </div>

      <div v-if="config.webhooks.enabled" class="space-y-4 border-t border-white/10 pt-4 text-sm text-white/70">
        <AppInput
          v-model="config.webhooks.url"
          label="Webhook URL"
          placeholder="https://example.com/webhook"
          helper-text="HTTPS-Endpoint that receives POST-JSON."
        />
        <AppInput
          v-model="config.webhooks.token"
          label="Optional Webhook Token"
          placeholder="e.g. Bearer-Token or any secret text"
          helper-text="Sent as Authorization: Bearer <Token>."
        />
        <div class="space-y-2">
          <p class="text-xs uppercase text-white/60">
            Select Data
          </p>
          <div
            v-for="option in payloadOptions"
            :key="option.key"
            class="flex flex-col rounded border border-white/10 bg-white/5 p-3 text-white/70"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-white">
                  {{ option.label }}
                </p>
                <p class="text-xs text-white/60">
                  {{ option.description }}
                </p>
              </div>
              <AppToggle v-model="config.webhooks.payloadTypes[option.key]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppInput from "../AppInput.vue";
import AppToggle from "../AppToggle.vue";
import type { IConfig } from "@/utils/storage";
import { AutodartsToolsConfig } from "@/utils/storage";

type PayloadKey = keyof IConfig["webhooks"]["payloadTypes"];

const emit = defineEmits([ "toggle", "settingChange" ]);
const config = ref<IConfig>();

const payloadOptions: Array<{
  key: PayloadKey;
  label: string;
  description: string;
}> = [
  {
    key: "match",
    label: "All Game Data",
    description: "Match state including scores, legs and player lists at every change.",
  },
  {
    key: "throws",
    label: "Each Dart",
    description: "A JSON payload per dart throw with segment, coordinates and player.",
  },
];

async function toggleFeature() {
  if (!config.value) return;

  const wasEnabled = config.value.webhooks.enabled;
  config.value.webhooks.enabled = !wasEnabled;

  if (!wasEnabled) {
    await nextTick();
    emit("toggle", "webhooks");
  }
}

onMounted(async () => {
  config.value = await AutodartsToolsConfig.getValue();
});

watch(config, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsConfig.setValue(toRaw(config.value!));
  emit("settingChange");
  console.log("Webhooks setting changed");
}, { deep: true });
</script>

