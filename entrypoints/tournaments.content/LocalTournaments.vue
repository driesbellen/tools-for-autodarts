<template>
  <div v-if="show">
    TEST
  </div>
</template>

<script setup lang="ts">
import { AutodartsToolsLocalTournaments, type ILocalTournaments } from "@/utils/local-tournaments-storage";

let unwatchLocalTournaments: any;

const show = ref(false);

watch(show, () => {
  if (show.value) {
    const elementsToHide = [
      document.querySelector("#adt-tournaments-container > div:nth-of-type(2)"),
      document.querySelector("#adt-tournaments-container > div:nth-of-type(3)"),
    ];
    elementsToHide.forEach((element) => {
      if (element) (element as HTMLElement).style.display = "none";
    });
  } else {
    const elementsToShow = [
      document.querySelector("#adt-tournaments-container > div:nth-of-type(2)"),
      document.querySelector("#adt-tournaments-container > div:nth-of-type(3)"),
    ];
    elementsToShow.forEach((element) => {
      if (element) (element as HTMLElement).style.display = "block";
    });
  }
});

onBeforeMount(async () => {
  const localTournamentsConfig = await AutodartsToolsLocalTournaments.getValue();
  await AutodartsToolsLocalTournaments.setValue({
    ...localTournamentsConfig,
    show: false,
  });
});

onMounted(async () => {
  unwatchLocalTournaments = await AutodartsToolsLocalTournaments.watch(async (tournamentsData: ILocalTournaments) => {
    show.value = tournamentsData.show;
  });
});

onUnmounted(() => {
  unwatchLocalTournaments?.();
});
</script>
