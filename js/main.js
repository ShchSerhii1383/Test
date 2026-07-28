import { SceneManager } from './systems/SceneManager.js';
import { SaveManager } from './systems/SaveManager.js';
import { IntroSequence } from './systems/IntroSequence.js';
import { AudioManager } from './systems/AudioManager.js';
import { GiftManager } from './systems/GiftManager.js';
import { Mickey } from './components/Mickey.js';
import { renderMickeyInto } from './components/mickeySprite.js';
import { renderIslandChests } from './components/chestSprite.js';
import { IslandScene } from './scenes/IslandScene.js';
import { LagoonScene } from './scenes/LagoonScene.js';
import { MountainScene } from './scenes/MountainScene.js';
import { BazaarScene } from './scenes/BazaarScene.js';
import { RewardScene } from './scenes/RewardScene.js';
import { ConstellationScene } from './scenes/ConstellationScene.js';
import { AlbumScene } from './scenes/AlbumScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';
import { SCENES } from './config/constants.js';

/**
 * main.js
 * -------
 * Entry point. Creates the shared systems (save, gifts, scene manager),
 * the one shared Mickey instance, then registers every scene that exists
 * in the DOM. As new scenes get built, register them here the same way —
 * this file stays short no matter how big the game gets.
 */
function start() {
  const saveManager = new SaveManager();
  const giftManager = new GiftManager(saveManager);
  const audio = new AudioManager();
  // Built after audio, because it now drives the per-scene ambient mix.
  const sceneManager = new SceneManager(audio);

  // Draw Mickey's artwork into every .mickey container (island, finale, ...)
  // from the single sprite module, before anything tries to animate him.
  renderMickeyInto('.mickey');
  // The reward chest is themed on the fly by RewardScene once it knows
    // which adventure just finished — see RewardScene.enter().
  renderIslandChests();

  // Mickey lives on the Island scene's DOM but is shared across scenes
  // that need him (Lagoon, Reward) — there's only ever one Mickey.
  const mickeyEl = document.getElementById('mickey');
  const dialogEl = document.getElementById('mickey-dialog');
  const dialogTextEl = document.getElementById('mickey-dialog-text');
  const mickey = new Mickey(mickeyEl, dialogEl, dialogTextEl);

  const islandEl = document.getElementById('scene-island');
  const islandScene = new IslandScene(islandEl, sceneManager, mickey, saveManager, audio);
  sceneManager.register(SCENES.ISLAND, islandEl, islandScene);

  const lagoonEl = document.getElementById('scene-lagoon');
  const lagoonScene = new LagoonScene(lagoonEl, sceneManager, mickey, audio);
  sceneManager.register(SCENES.LAGOON, lagoonEl, lagoonScene);

  const mountainEl = document.getElementById('scene-mountain');
  const mountainScene = new MountainScene(mountainEl, sceneManager, mickey, audio);
  sceneManager.register(SCENES.MOUNTAIN, mountainEl, mountainScene);

  const bazaarEl = document.getElementById('scene-bazaar');
  const bazaarScene = new BazaarScene(bazaarEl, sceneManager, mickey, audio);
  sceneManager.register(SCENES.BAZAAR, bazaarEl, bazaarScene);

  const rewardEl = document.getElementById('scene-reward');
  const rewardScene = new RewardScene(rewardEl, sceneManager, giftManager, saveManager, mickey, audio);
  sceneManager.register(SCENES.REWARD, rewardEl, rewardScene);

  const constellationEl = document.getElementById('scene-constellation');
  const constellationScene = new ConstellationScene(constellationEl, sceneManager, mickey, audio);
  sceneManager.register(SCENES.CONSTELLATION, constellationEl, constellationScene);

  const albumEl = document.getElementById('scene-album');
  const albumScene = new AlbumScene(albumEl, sceneManager, saveManager, mickey, audio);
  sceneManager.register(SCENES.ALBUM, albumEl, albumScene);

  const finaleEl = document.getElementById('scene-finale');
  const finaleScene = new FinaleScene(finaleEl, audio);
  sceneManager.register(SCENES.FINALE, finaleEl, finaleScene);

  // The island comes up first but stays quiet: the opening sequence plays
  // on top of it, using the real camera, the real Mickey and the real boxes.
  // Only when it finishes does the island become the player's to explore.
  sceneManager.goTo(SCENES.ISLAND, { fromIntro: true });

  const intro = new IntroSequence(mickey, saveManager, audio);
  intro.play().then(() => islandScene.beginLife());

  setUpMuteButton(audio);
}

/**
 * Wires the corner mute button. Audio itself is unlocked by the intro's
 * title card — the player's first deliberate tap — not by this button;
 * this just needs to work whether that's already happened or not.
 */
function setUpMuteButton(audio) {
  const muteBtn = document.getElementById('mute-toggle');
  muteBtn.addEventListener('click', () => {
    audio.unlock(); // harmless no-op if the title card already did this
    const muted = audio.toggleMute();
    muteBtn.classList.toggle('is-muted', muted);
  });
}

document.addEventListener('DOMContentLoaded', start);
