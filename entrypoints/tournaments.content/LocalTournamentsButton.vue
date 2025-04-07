<template>
  <div class="text-base">
    <AppButton
      @click="toggleLocalTournaments"
      class="font-normal"
    >
      <Trophy class="mr-2 size-4" />
      Local Tournaments
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from "lucide-vue-next";

import AppButton from "@/components/AppButton.vue";
import { AutodartsToolsLocalTournaments, type ILocalTournaments } from "@/utils/local-tournaments-storage";

const emit = defineEmits([ "settingChange" ]);
const localTournamentsConfig = ref<ILocalTournaments>();

onMounted(async () => {
  localTournamentsConfig.value = await AutodartsToolsLocalTournaments.getValue();

  // Initialize if needed
  if (!localTournamentsConfig.value) {
    localTournamentsConfig.value = {
      show: false,
    };
  }
});

watch(localTournamentsConfig, async (_, oldValue) => {
  if (!oldValue) return;

  await AutodartsToolsLocalTournaments.setValue(toRaw(localTournamentsConfig.value!));
  emit("settingChange");
  console.log("Local Tournaments setting changed");
}, { deep: true });

function toggleLocalTournaments() {
  if (!localTournamentsConfig.value) return;
  localTournamentsConfig.value.show = !localTournamentsConfig.value.show;
}
</script>
