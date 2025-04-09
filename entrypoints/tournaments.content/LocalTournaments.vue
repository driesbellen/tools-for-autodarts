<template>
  <div v-if="show" class="mt-6">
    <div class="flex items-center justify-end">
      <AppButton @click="openCreateTournamentModal" auto type="success">
        Create Tournament
      </AppButton>
    </div>

    <div id="brackets-container" ref="bracketsContainer" class="brackets-viewer mt-6" />

    <AppModal
      @close="showCreateTournamentModal = false"
      :show="showCreateTournamentModal"
      title="Create Tournament"
    >
      <div class="space-y-4">
        <div>
          <label for="tournament-name" class="mb-1 block text-sm font-medium text-white">Tournament Name</label>
          <input
            id="tournament-name"
            v-model="tournamentName"
            type="text"
            class="w-full rounded-md border border-white/20 bg-white/10 p-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
            placeholder="Enter tournament name"
          >
        </div>
        <AppTextarea
          v-model="contestantsInput"
          label="Contestants"
          placeholder="Enter player names, one per line"
          :rows="6"
          helper-text="Enter one player name per line"
        />
      </div>

      <template #footer>
        <AppButton @click="showCreateTournamentModal = false">
          Cancel
        </AppButton>
        <AppButton @click="submitCreateTournament" type="success">
          Create
        </AppButton>
      </template>
    </AppModal>

    <!-- Match Score Modal -->
    <AppModal
      @close="showMatchScoreModal = false"
      :show="showMatchScoreModal"
      title="Update Match Score"
    >
      <div v-if="currentMatch && tournamentData" class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium text-white">
              {{ tournamentData.contestants?.[currentMatch.sides[0]?.contestantId]?.players[0]?.title || 'Player 1' }}
            </label>
            <input
              v-model="player1Score"
              type="number"
              min="0"
              class="w-full rounded-md border border-white/20 bg-white/10 p-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
              placeholder="Score"
            >
          </div>
          <div class="text-xl font-bold text-white">
            vs
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-sm font-medium text-white">
              {{ tournamentData.contestants?.[currentMatch.sides[1]?.contestantId]?.players[0]?.title || 'Player 2' }}
            </label>
            <input
              v-model="player2Score"
              type="number"
              min="0"
              class="w-full rounded-md border border-white/20 bg-white/10 p-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
              placeholder="Score"
            >
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton @click="showMatchScoreModal = false">
          Cancel
        </AppButton>
        <AppButton @click="updateMatchScore" type="success">
          Save Scores
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { createBracket } from "bracketry";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";

import AppButton from "@/components/AppButton.vue";
import AppModal from "@/components/AppModal.vue";
import AppTextarea from "@/components/AppTextarea.vue";
import { AutodartsToolsLocalTournaments, type ILocalTournaments } from "@/utils/local-tournaments-storage";

// Define the types based on bracketry's documentation
interface BracketryData {
  rounds: Array<{ name: string }>;
  matches: Array<{
    roundIndex: number;
    order: number;
    sides: Array<{
      contestantId?: string;
      title?: string;
      scores?: Array<{ mainScore: string | number; subscore?: string | number; isWinner?: boolean }>;
      currentScore?: string | number;
      isServing?: boolean;
      isWinner?: boolean;
    }>;
    matchStatus?: string;
    isLive?: boolean;
    isBronzeMatch?: boolean;
  }>;
  contestants?: {
    [contestantId: string]: {
      entryStatus?: string;
      players: Array<{
        title: string;
        nationality?: string;
      }>;
    };
  };
}

let unwatchLocalTournaments: any;
const bracketsContainer = ref<HTMLElement | null>(null);
const show = ref(false);
const tournamentData = ref<BracketryData | null>(null);

// Modal state
const showCreateTournamentModal = ref(false);
const tournamentName = ref("");
const contestantsInput = ref("");

// State for match score modal
const showMatchScoreModal = ref(false);
const currentMatch = ref<any>(null);
const player1Score = ref("");
const player2Score = ref("");

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

watch(tournamentData, () => {
  if (tournamentData.value && bracketsContainer.value) {
    renderTournament();
  }
}, { deep: true });

function renderTournament() {
  if (!tournamentData.value || !bracketsContainer.value) return;

  // Create bracket
  createBracket(
    tournamentData.value,
    bracketsContainer.value,
    {
      visibleRoundsCount: 3,
      matchMaxWidth: 350,
      roundTitleColor: "white",
      matchTextColor: "white",
      rootBorderColor: "transparent",
      onMatchClick: (match) => {
        openMatchScoreModal(match);
      },
    },
  );
}

onMounted(async () => {
  const localTournamentsConfig = await AutodartsToolsLocalTournaments.getValue();
  show.value = localTournamentsConfig.show;
  tournamentData.value = localTournamentsConfig.tournamentData || null;
  unwatchLocalTournaments = await AutodartsToolsLocalTournaments.watch(async (tournamentsData: ILocalTournaments) => {
    show.value = tournamentsData.show;
    tournamentData.value = tournamentsData.tournamentData || null;
  });

  if (tournamentData.value && bracketsContainer.value) {
    renderTournament();
  }
});

onUnmounted(() => {
  unwatchLocalTournaments?.();
});

function openCreateTournamentModal() {
  tournamentName.value = "";
  contestantsInput.value = "";
  showCreateTournamentModal.value = true;
}

async function submitCreateTournament() {
  // Parse contestant input - split by newline and remove empty lines
  const contestants = contestantsInput.value
    .split("\n")
    .map(name => name.trim())
    .filter(name => name !== "");

  if (contestants.length < 2) {
    alert("Please enter at least 2 contestants");
    return;
  }

  // Determine number of rounds based on contestant count
  const numContestants = contestants.length;
  const numRounds = Math.ceil(Math.log2(numContestants));

  // Create rounds
  const rounds: Array<{ name: string }> = [];
  for (let i = 0; i < numRounds; i++) {
    let roundName: string;
    if (i === numRounds - 1) {
      roundName = "Final";
    } else if (i === numRounds - 2) {
      roundName = "Semifinals";
    } else if (i === numRounds - 3) {
      roundName = "Quarterfinals";
    } else {
      roundName = `Round ${i + 1}`;
    }
    rounds.push({ name: roundName });
  }

  // Create contestant data with UUIDs
  const contestantsData: Record<string, { players: Array<{ title: string }> }> = {};
  const contestantIds: string[] = [];

  contestants.forEach((name) => {
    const id = uuidv4();
    contestantsData[id] = {
      players: [ { title: name } ],
    };
    contestantIds.push(id);
  });

  // Create initial matches for the first round
  const matches: BracketryData["matches"] = [];
  const firstRoundMatchCount = 2 ** (Math.ceil(Math.log2(numContestants)) - 1);

  for (let i = 0; i < firstRoundMatchCount; i++) {
    const sides: Array<{
      contestantId?: string;
      scores?: Array<{
        mainScore: string | number;
        isWinner?: boolean;
      }>;
      isWinner?: boolean;
    }> = [];

    // Add contestants to this match if available
    if (i * 2 < contestantIds.length) {
      sides.push({
        contestantId: contestantIds[i * 2],
        scores: [],
      });
    } else {
      sides.push({});
    }

    if (i * 2 + 1 < contestantIds.length) {
      sides.push({
        contestantId: contestantIds[i * 2 + 1],
        scores: [],
      });
    } else {
      sides.push({});
    }

    matches.push({
      roundIndex: 0,
      order: i,
      sides,
    });
  }

  // Create the BracketryData
  const data: BracketryData = {
    rounds,
    matches,
    contestants: contestantsData,
  };

  tournamentData.value = data;

  // Save tournament data
  const currentConfig = await AutodartsToolsLocalTournaments.getValue();
  await AutodartsToolsLocalTournaments.setValue({
    ...currentConfig,
    tournamentData: data,
  });

  // Close the modal
  showCreateTournamentModal.value = false;
}

async function createTournament() {
  // This function is kept for backward compatibility
  // Open the modal instead of creating a tournament directly
  openCreateTournamentModal();
}

// Open match score modal
function openMatchScoreModal(match: any) {
  currentMatch.value = match;

  // Reset scores
  player1Score.value = "";
  player2Score.value = "";

  // If match has scores, populate them
  if (match.sides[0]?.scores?.length > 0) {
    player1Score.value = String(match.sides[0].scores[0].mainScore || "");
  }
  if (match.sides[1]?.scores?.length > 0) {
    player2Score.value = String(match.sides[1].scores[0].mainScore || "");
  }

  showMatchScoreModal.value = true;
}

// Update match score
async function updateMatchScore() {
  if (!currentMatch.value || !tournamentData.value) return;

  const { roundIndex, order } = currentMatch.value;
  const matchIndex = tournamentData.value.matches.findIndex(
    m => m.roundIndex === roundIndex && m.order === order,
  );

  if (matchIndex === -1) return;

  // Create a deep copy of the tournament data to avoid reference issues
  const updatedTournamentData = JSON.parse(JSON.stringify(tournamentData.value));

  // Update scores
  const match = updatedTournamentData.matches[matchIndex];

  // Player 1 score
  if (player1Score.value) {
    const p1Score = Number.parseInt(player1Score.value);
    const p2Score = player2Score.value ? Number.parseInt(player2Score.value) : 0;

    // Create score object if it doesn't exist
    if (!match.sides[0].scores) {
      match.sides[0].scores = [];
    }

    if (match.sides[0].scores.length === 0) {
      match.sides[0].scores.push({
        mainScore: p1Score,
        isWinner: p1Score > p2Score,
      });
    } else {
      match.sides[0].scores[0].mainScore = p1Score;
      match.sides[0].scores[0].isWinner = p1Score > p2Score;
    }

    match.sides[0].isWinner = p1Score > p2Score;
  }

  // Player 2 score
  if (player2Score.value) {
    const p2Score = Number.parseInt(player2Score.value);
    const p1Score = player1Score.value ? Number.parseInt(player1Score.value) : 0;

    // Create score object if it doesn't exist
    if (!match.sides[1].scores) {
      match.sides[1].scores = [];
    }

    if (match.sides[1].scores.length === 0) {
      match.sides[1].scores.push({
        mainScore: p2Score,
        isWinner: p2Score > p1Score,
      });
    } else {
      match.sides[1].scores[0].mainScore = p2Score;
      match.sides[1].scores[0].isWinner = p2Score > p1Score;
    }

    match.sides[1].isWinner = p2Score > p1Score;
  }

  // Update the tournament data
  tournamentData.value = updatedTournamentData;

  // Save updated tournament data
  const currentConfig = await AutodartsToolsLocalTournaments.getValue();
  await AutodartsToolsLocalTournaments.setValue({
    ...currentConfig,
    tournamentData: updatedTournamentData,
  });

  showMatchScoreModal.value = false;
}
</script>

<style>
.brackets-viewer {
  overflow-x: auto;
  min-height: 400px;
}

.bracket-root {}

.bracket-root .navigation-button,
.bracket-root .scroll-button {
  justify-content: center;
  align-items: center;
  cursor: auto;
  user-select: none;
  z-index: 3;
}

.bracket-root .navigation-button.active,
.bracket-root .scroll-button.active {
  cursor: pointer;
}

.bracket-root .navigation-button.active>*,
.bracket-root .scroll-button.active>* {
  opacity: 1;
}

.bracket-root .navigation-button>*,
.bracket-root .scroll-button>* {
  opacity: 0.15;
}

.bracket-root .navigation-button {
  display: grid;
}

.bracket-root .navigation-button.left {
  grid-column: 1;
}

.bracket-root .navigation-button.right {
  grid-column: 5;
}

.bracket-root .navigation-button.hidden {
  display: none;
}

.bracket-root svg.default-nav-icon {
  fill: var(--navButtonSvgColor);
  box-sizing: content-box;
  padding: var(--navButtonPadding, 0);
  width: var(--navButtonArrowSize);
  height: var(--navButtonArrowSize);
}

.bracket-root svg.default-scroll-icon {
  fill: var(--scrollButtonSvgColor);
  box-sizing: content-box;
  padding: var(--scrollButtonPadding, 0);
  width: var(--scrollButtonArrowSize);
  height: var(--scrollButtonArrowSize);
}

.bracket-root .scroll-button {
  grid-column: 2/span 2;
  display: none;
}

.bracket-root .scroll-button.button-up {
  grid-row: 3;
  border-bottom: 1px solid var(--scrollGutterBorderColor, var(--rootBorderColor));
}

.bracket-root .scroll-button.button-down {
  grid-row: 5;
  border-top: 1px solid var(--scrollGutterBorderColor, var(--rootBorderColor));
}

.bracket-root.with-scroll-buttons-over-matches .scroll-button {
  border: none;
  height: 0;
}

.bracket-root.with-scroll-buttons-over-matches .button-up {
  align-items: flex-start;
}

.bracket-root.with-scroll-buttons-over-matches .button-down {
  align-items: flex-end;
}

.bracket-root.with-vertical-scroll-buttons .scroll-button {
  display: flex;
}

.bracket-root.with-vertical-scroll-buttons .scrollbar.animated {
  transition: top 0.3s ease-out, height 0.3s ease-out;
}

.bracket-root.with-nav-buttons-before-titles .navigation-button {
  border-bottom: 1px solid var(--roundTitlesBorderColor, var(--rootBorderColor));
}

.bracket-root.with-nav-buttons-before-titles .navigation-button.left {
  grid-column: 2;
  justify-content: flex-start;
}

.bracket-root.with-nav-buttons-before-titles .navigation-button.right {
  grid-column: 3;
  justify-content: flex-end;
}

.bracket-root.with-nav-buttons-over-titles .navigation-button {
  grid-row: 2;
  width: 0;
  border: none;
  position: relative;
  margin-bottom: 1px;
}

.bracket-root.with-nav-buttons-over-titles .navigation-button.left {
  justify-content: flex-start;
}

.bracket-root.with-nav-buttons-over-titles .navigation-button.right {
  justify-content: flex-end;
}

.bracket-root.with-hidden-nav-buttons .navigation-button {
  display: none !important;
}

.bracket-root.with-gutter-nav-buttons .navigation-button {
  grid-row: 1/-1;
}

.bracket-root.with-gutter-nav-buttons .navigation-button.left {
  border-right: 1px solid var(--navGutterBorderColor, var(--rootBorderColor));
}

.bracket-root.with-gutter-nav-buttons .navigation-button.right {
  border-left: 1px solid var(--navGutterBorderColor, var(--rootBorderColor));
}

.bracket-root.with-nav-buttons-over_matches .navigation-button:not(.hidden) {
  display: flex;
  border: none;
  width: 0;
  position: relative;
  grid-row: 4;
}

.bracket-root.with-nav-buttons-over_matches .navigation-button:not(.hidden)>*:first-child {
  position: absolute;
  top: var(--navButtonsTopDistance, 50%);
  transform: translate(0, -50%);
}

.bracket-root.with-nav-buttons-over_matches .navigation-button:not(.hidden).left>*:first-child {
  left: 0;
}

.bracket-root.with-nav-buttons-over_matches .navigation-button:not(.hidden).right>*:first-child {
  right: 0;
}

.stop-scrolling {
  height: 100%;
  overflow: hidden;
}

.bracket-root {
  display: grid;

  grid-template-columns: auto 1fr 1fr 0 auto;
  grid-template-rows: auto auto auto 1fr auto;
  min-width: 260px;
  min-height: 250px;

  max-width: 100%;
  width: var(--width);
  height: var(--height);
  text-align: left;
  border-width: 1px;
  border-style: solid;
  border-color: var(--wrapperBorderColor, var(--rootBorderColor));
  box-sizing: border-box;
  font-family: var(--rootFontFamily);
  background-color: var(--rootBgColor);
  border-radius: var(--chakra-radii-md);
  background-color: var(--chakra-colors-whiteAlpha-200);
}

.bracket-root * {
  box-sizing: border-box;
  user-select: none;
  margin: 0;
  padding: 0;
  width: auto;
  height: auto;
  border: none;
  border-radius: 0;
  align-content: unset;
  align-items: unset;
  align-self: unset;
  bottom: unset;
  top: unset;
  left: unset;
  right: unset;
  box-shadow: none;
  outline: none;
  text-decoration: none;
  white-space: initial;
  line-height: initial;
}

.bracket-root .zero-width {
  width: 0;
}

.bracket-root .full-width-grid-column {

  grid-column: 1/-1;
}

.bracket-root .equal-width-columns-grid {

  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
}

.bracket-root .round-titles-grid-item {
  width: 0;
  min-width: 100%;
  grid-row: 2;
  grid-column: 2/span 2;
  overflow: hidden;
  padding-bottom: 1px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: var(--chakra-colors-chakra-border-color);
}

.bracket-root .round-titles-wrapper {
  height: 100%;
  min-width: 100%;
  font-size: var(--roundTitlesFontSize);
  font-family: var(--roundTitlesFontFamily, var(--rootFontFamily));
  color: var(--roundTitleColor);
  border-radius: var(--chakra-radii-md);
}

.bracket-root .round-title {
  padding: var(--roundTitlesVerticalPadding) var(--matchHorMargin);
  display: flex;
  overflow: hidden;
  justify-content: center;
  white-space: nowrap;
}

.bracket-root .matches-scroller {
  grid-column: 2/span 2;
  grid-row: 4;
  overflow-y: hidden;
  overflow-x: hidden;
  pointer-events: none;

  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bracket-root .matches-scroller::-webkit-scrollbar {
  display: none;

}

.bracket-root .matches-scroller.scroll-y-enabled {
  pointer-events: auto;
}

.bracket-root .matches-positioner {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: 100%;
  min-height: 100%;
  grid-template-rows: 100%;
  overflow: hidden;
  padding: var(--mainVerticalPadding, 0) 0;
  font-size: var(--matchFontSize);
}

.bracket-root .scrollbar-parent {
  grid-column: 4;
  grid-row: 4;
  position: relative;
  display: none;
  z-index: 3;
}

.bracket-root .scrollbar-overflow-preventer {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: var(--scrollbarWidth);
  overflow-y: hidden;
}

.bracket-root .scrollbar {
  position: absolute;
  right: 0;
  width: 100%;
  background: var(--scrollbarColor);
}

.bracket-root.with-visible-scrollbar .scrollbar-parent {
  display: block;
}

.bracket-root.with-native-scroll .matches-scroller.scroll-y-enabled {
  overflow-y: scroll;
}

.bracket-root.with-vertical-scroll-buttons .matches-positioner.is-scrolling {
  transition: transform var(--scroll-transition-duration) ease-out;
}

.bracket-root .round-wrapper {
  position: relative;
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  align-items: stretch;
  min-width: 180px;
  max-width: 100%;
}

.bracket-root .round-wrapper:first-of-type .match-lines-area {

  left: var(--matchHorMargin);
}

.bracket-root .round-wrapper:last-of-type .match-lines-area {
  right: var(--matchHorMargin);
}

.bracket-root .round-wrapper.collapsed {
  visibility: hidden;
}

.bracket-root .matches-positioner.is-scrolling * {
  cursor: auto !important;
}

.bracket-root .bronze-round-wrapper {
  display: flex;
  overflow: hidden;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);

  z-index: 2;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper .match-wrapper {
  padding: 0;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper:first-child {
  width: calc(var(--matchHorMargin) * 1.2);
  min-width: 0;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper:first-child .match-wrapper {
  padding: 0;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper:first-child .match-wrapper .match-lines-area {
  left: 0;
  width: 100%;
}

.bracket-root .bronze-round-wrapper .pseudo-round-wrapper:first-child .match-wrapper .match-lines-area .line-wrapper {
  box-shadow: none;
}

.bracket-root .bronze-round-wrapper .round-wrapper {
  flex: 1;
}

.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper {
  padding-left: calc(var(--matchHorMargin) * 0.3);
}

.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper.even {
  align-self: end;
  padding-top: var(--matchMinVerticalGap);
  padding-bottom: var(--matchMinVerticalGap);
}

.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper.odd {
  align-self: start;
  padding-top: calc(var(--matchMinVerticalGap) + var(--matchFontSize) * 1.5);
  padding-bottom: calc(var(--matchMinVerticalGap) + var(--matchFontSize) * 1.5);
}

.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper.odd .line-wrapper.upper,
.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper.even .line-wrapper.lower {
  box-shadow: calc(var(--connectionLinesWidth) * -1) 0px 0px 0px;
}

.bracket-root .bronze-round-wrapper .round-wrapper .match-wrapper.highlighted .line-wrapper {

  color: var(--highlightedConnectionLinesColor);
}

.bracket-root .match-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  min-height: 40px;
  box-sizing: border-box;
  padding: calc(var(--matchMinVerticalGap) / 2) var(--matchHorMargin);
}

.bracket-root .match-wrapper.odd .line-wrapper.upper {
  box-shadow: var(--connectionLinesWidth) 0px 0px 0px;
  border-bottom: var(--connectionLinesWidth) solid var(--connectionLinesColor);
}

.bracket-root .match-wrapper.even .line-wrapper.lower {
  box-shadow: var(--connectionLinesWidth) 0px 0px 0px;
  border-top: var(--connectionLinesWidth) solid var(--connectionLinesColor);
}

.bracket-root .match-wrapper.highlighted .match-status {
  border-color: var(--highlightedConnectionLinesColor);
}

.bracket-root .match-wrapper.highlighted .match-lines-area .line-wrapper {

  color: var(--highlightedConnectionLinesColor);
  border-color: var(--highlightedConnectionLinesColor);
}

.bracket-root .match-wrapper.last-highlighted .match-lines-area .line-wrapper {
  color: var(--connectionLinesColor);
}

.bracket-root .match-status {
  display: flex;
  z-index: 2;
  align-self: center;
  transition: border-color 0.1s ease-out;
  font-size: calc(var(--matchFontSize) * 0.85);
  padding: calc(var(--matchFontSize) / 6) calc(var(--matchFontSize) / 2);
  margin: 0 calc(var(--matchFontSize) / 2);
  border-width: var(--connectionLinesWidth);
  border-style: solid;
  color: black;
  border-color: var(--connectionLinesColor);
  background-color: var(--connectionLinesColor);
  border-radius: 4px;
}

.bracket-root .match-status:empty {
  display: none;
}

.bracket-root .match-body {
  display: flex;
  width: 100%;
  max-width: var(--matchMaxWidth);
  justify-content: center;
  z-index: 2;
  transition: border-color 0.1s ease-out;
  pointer-events: auto;
  border-width: var(--connectionLinesWidth, 2);
  border-style: solid;
  border-color: transparent;
  position: relative;
}

.bracket-root .match-body:empty {

  pointer-events: none;
}

.bracket-root .match-body .sides {
  flex: 1;
  display: grid;

  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  grid-row-gap: var(--connectionLinesWidth);
}

.bracket-root .match-body.live:not(:empty) {
  border-color: var(--liveMatchBorderColor, var(--rootBorderColor));
  background-color: var(--liveMatchBgColor);
}

.bracket-root .match-body.live:not(:empty) .current-score {
  border-color: var(--liveMatchBorderColor, var(--rootBorderColor));
}

.bracket-root .match-top,
.bracket-root .match-bottom {
  position: absolute;
  left: 0;
  color: #c1c1c1;
  padding-left: calc(var(--matchFontSize) / 2);
  font-size: calc(var(--matchFontSize) * 0.7);
  width: 100%;
}

.bracket-root .match-top {
  bottom: calc(100% + var(--connectionLinesWidth) + 1px);
}

.bracket-root .match-bottom {
  top: calc(100% + var(--connectionLinesWidth) + 1px);
}

.bracket-root .match-lines-area {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 1;
}

.bracket-root .match-lines-area .line-wrapper {

  flex: 1;
  transition: color 0.1s ease-out, border-color 0.1s ease-out;

  color: var(--connectionLinesColor);
}

.bracket-root .matches-positioner>.round-wrapper:last-of-type .line-wrapper {

  color: transparent;
}

.bracket-root .side-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  pointer-events: auto;
  padding-top: var(--matchAxisMargin);
  padding-bottom: var(--matchAxisMargin);
  padding-right: calc(var(--matchFontSize) / 3 * 2);
  padding-left: calc(var(--matchFontSize) / 2);

  color: var(--matchTextColor);
}

.bracket-root .side-wrapper.empty-side,
.bracket-root .side-wrapper:not([contestant-id]) {
  pointer-events: none;
}

.bracket-root .side-wrapper.highlighted .player-title {
  color: var(--highlightedPlayerTitleColor);
}

.bracket-root .side-wrapper.looser:not(.highlighted) .player-title,
.bracket-root .side-wrapper .single-score-wrapper:not(.winner) {
  opacity: 0.54;
}

.bracket-root .side-wrapper:not(.winner) .winner-mark {
  display: none;
}

.bracket-root .side-info-item {
  display: grid;

  grid-auto-rows: minmax(0, 1fr);
  grid-template-columns: auto;
  align-items: center;
}

.bracket-root .side-info-item * {
  white-space: nowrap;
  user-select: none;
}

.bracket-root .side-info-item.serving-mark {
  width: calc(var(--matchFontSize) / 2.5);
  height: calc(var(--matchFontSize) / 2.5);
  margin-left: calc(var(--distanceBetweenScorePairs) * 0.8);
  border-radius: 50%;
  background-color: #b7cf15;
}

.bracket-root .side-info-item.serving-mark.hidden {
  display: none;
}

.bracket-root .side-info-item.serving-mark.transparent {
  opacity: 0;
}

.bracket-root .side-info-item.side-scores {
  grid-auto-flow: column;
  font-family: var(--scoreFontFamily, var(--rootFontFamily));
  grid-column-gap: var(--distanceBetweenScorePairs);
}

.bracket-root .side-info-item.current-score {
  border-width: 1px;
  border-style: solid;
  text-align: center;
  border-color: var(--matchTextColor);
  padding: 0 calc(var(--matchFontSize) / 3);
  margin-left: calc(var(--distanceBetweenScorePairs) * 0.8);
}

.bracket-root .side-info-item.current-score:empty {
  display: none;
}

.bracket-root .side-info-item.entry-status:not(:empty) {
  margin-right: calc(var(--matchFontSize) / 2);
}

.bracket-root .side-info-item.players-info {
  flex: 1;
  min-width: 0;
  grid-row-gap: var(--oneSidePlayersGap);
}

.bracket-root .side-info-item.winner-mark {
  padding-right: var(--distanceBetweenScorePairs);
}

.bracket-root .side-info-item.winner-mark svg {
  fill: var(--matchTextColor, #000000);
}

.bracket-root .player-wrapper {
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.bracket-root .player-wrapper .nationality {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bracket-root .player-wrapper .nationality:not(:empty) {
  margin-right: calc(var(--matchFontSize) / 2);
}

.bracket-root .player-wrapper .player-title {
  flex: 1;
  transition: color 0.1s ease-out, opacity 0.1s ease-out;
  text-align: left;
  text-overflow: ellipsis;

  min-width: 0;
  overflow: hidden;
  padding-right: calc(var(--matchFontSize) * 1.5);
  font-family: var(--playerTitleFontFamily, var(--rootFontFamily));
}

.bracket-root .single-score-wrapper {
  display: flex;
  overflow: visible;
  flex-direction: column;
  align-items: center;
}

.bracket-root .single-score-wrapper .side-own-single-score {
  display: flex;
}

.bracket-root .single-score-wrapper .opponent-single-score {
  display: flex;
  height: 0;
  overflow: hidden;
}

.bracket-root .subscore {
  padding-left: 1px;
  font-size: calc(var(--matchFontSize) / 3 * 2);
  margin-top: calc(var(--matchFontSize) / 5 * -1);
  margin-right: calc(var(--matchFontSize) / 5 * -1);
}

.bracket-root svg.default-winner-svg {
  width: auto;
  height: var(--matchFontSize);
}

.bracket-root.with-onMatchClick .match-body:not(:empty) {
  cursor: pointer;
}

.bracket-root.with-onMatchClick .match-body:not(:empty):hover {
  border-color: var(--hoveredMatchBorderColor, var(--rootBorderColor));
}

.bracket-root.with-onMatchClick .match-body:not(:empty):hover .player-title {
  color: var(--highlightedPlayerTitleColor);
}

.bracket-root.with-onMatchClick .match-body:not(:empty) * {

  pointer-events: none;
}

.bracket-root:not(.with-classical-layout) .round-wrapper.collapsed {
  height: 0;
  overflow: hidden;
}

.bracket-root.with-clickable-sides .side-wrapper {
  cursor: pointer;
}

.bracket-root.with-clickable-sides .side-wrapper:hover .player-title {
  color: var(--highlightedPlayerTitleColor);
}
</style>
