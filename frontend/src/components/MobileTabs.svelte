<script lang="ts">
  type TabId = "source" | "timeline" | "lyrics";

  export let activeTab: TabId;
  export let tabs: { id: TabId; label: string }[] = [];
  export let onSelect: (tab: TabId) => void;
</script>

<nav class="mobile-tabs panel" aria-label="Editor sections">
  {#each tabs as tab}
    <button
      type="button"
      class:active={activeTab === tab.id}
      on:click={() => {
        onSelect(tab.id);
      }}
    >
      {tab.label}
    </button>
  {/each}
</nav>
